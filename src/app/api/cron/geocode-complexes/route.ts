import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { geocodeWithDebug, buildComplexAddress } from '@/lib/market/complexes';

export const maxDuration = 300;

/**
 * GET /api/cron/geocode-complexes
 * 좌표 없는 단지를 N개씩 geocode. Authorization: Bearer ${CRON_SECRET}
 *
 * 후보 소스 2개:
 *   A) 재시도 풀 — complexes에 lat IS NULL로 남은 단지 (7일 쿨다운, 저장된 jibun_address 재사용)
 *   B) 발굴 — 오늘의 로테이션 지역(dayOfYear % 지역수)의 price_transactions를 스캔해
 *      complexes에 행이 아예 없는 신규 단지 추출. ?lawd_cd=11680 으로 지역 지정 가능.
 *
 * ※ 과거 버그: price_transactions를 ORDER BY 없이 limit*30 샘플링 → 항상 같은 행만 보여
 *   미백필 단지에 영영 도달 못 했음. 대량 백필은 scripts/backfill-geocode.mjs (로컬 실행) 사용.
 *
 * ?limit=100 (기본), ?debug=true 시 샘플 5개의 지오코딩 응답 상태 반환
 */
const DEFAULT_LIMIT = 100;
const RETRY_COOLDOWN_DAYS = 7;
const SCAN_PAGE_SIZE = 1000;
const SCAN_MAX_PAGES = 30;

interface Candidate {
  complex_key: string;
  complex_name: string;
  lawd_cd: string;
  property_type: string;
  address: string;
}

async function runGeocode(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(500, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));
  const debug = searchParams.get('debug') === 'true';
  const lawdOverride = searchParams.get('lawd_cd');
  const debugSamples: unknown[] = [];
  const started_at = Date.now();

  const candidates: Candidate[] = [];

  // ── A) 재시도 풀: lat IS NULL + 쿨다운 경과 ──
  const cooldownCutoff = new Date(Date.now() - RETRY_COOLDOWN_DAYS * 24 * 3600 * 1000).toISOString();
  const { data: retryRows, error: retryErr } = await supabaseAdmin
    .from('complexes')
    .select('complex_key, complex_name, sigungu_cd, property_type, jibun_address, geocoded_at')
    .is('lat', null)
    .or(`geocoded_at.is.null,geocoded_at.lt.${cooldownCutoff}`)
    .limit(limit);
  if (retryErr) {
    return NextResponse.json({ error: 'failed to load retry pool', detail: retryErr }, { status: 500 });
  }
  for (const r of retryRows || []) {
    if (!r.jibun_address) continue; // 주소 자체가 없으면 재시도 무의미
    candidates.push({
      complex_key: r.complex_key,
      complex_name: r.complex_name,
      lawd_cd: r.sigungu_cd,
      property_type: r.property_type,
      address: r.jibun_address,
    });
  }

  // ── B) 발굴: 로테이션 지역의 신규 단지 (complexes에 행 없음) ──
  let scanLawd: string | null = lawdOverride;
  const { data: regionRows } = await supabaseAdmin
    .from('region_codes')
    .select('lawd_cd, sido, sigungu')
    .order('lawd_cd');
  const regions = regionRows || [];
  const regionByLawd = new Map(regions.map((r) => [r.lawd_cd, { sido: r.sido as string, sigungu: r.sigungu as string }]));

  if (!scanLawd && regions.length > 0) {
    const dayOfYear = Math.floor((Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 0)) / 86400000);
    scanLawd = regions[dayOfYear % regions.length].lawd_cd;
  }

  let discovered = 0;
  if (scanLawd && candidates.length < limit) {
    const seen = new Map<string, { complex_name: string; dong: string | null; jibun: string | null; property_type: string }>();
    let lastId = 0;
    for (let page = 0; page < SCAN_MAX_PAGES; page++) {
      const { data: txs, error: txErr } = await supabaseAdmin
        .from('price_transactions')
        .select('id, complex_key, complex_name, dong, jibun, property_type')
        .eq('lawd_cd', scanLawd)
        .gt('id', lastId)
        .order('id', { ascending: true })
        .limit(SCAN_PAGE_SIZE);
      if (txErr || !txs || txs.length === 0) break;
      lastId = txs[txs.length - 1].id;
      for (const t of txs) {
        if (!seen.has(t.complex_key)) {
          seen.set(t.complex_key, { complex_name: t.complex_name, dong: t.dong, jibun: t.jibun, property_type: t.property_type });
        }
      }
      if (txs.length < SCAN_PAGE_SIZE) break;
    }

    // complexes에 이미 행이 있는 키 제외 (성공/실패 무관 — 실패분은 재시도 풀이 처리)
    // .in() 키는 30개 단위 — 한글 키 URL 인코딩 길이 한도 보호
    const allKeys = Array.from(seen.keys());
    const known = new Set<string>();
    for (let i = 0; i < allKeys.length; i += 30) {
      const batch = allKeys.slice(i, i + 30);
      const { data: existing } = await supabaseAdmin
        .from('complexes')
        .select('complex_key')
        .in('complex_key', batch);
      for (const e of existing || []) known.add(e.complex_key);
    }

    const region = regionByLawd.get(scanLawd);
    for (const [key, meta] of seen) {
      if (known.has(key)) continue;
      if (candidates.length >= limit) break;
      const address = buildComplexAddress({
        sido: region?.sido,
        sigungu: region?.sigungu || '',
        dong: meta.dong,
        jibun: meta.jibun,
      });
      candidates.push({
        complex_key: key,
        complex_name: meta.complex_name,
        lawd_cd: scanLawd,
        property_type: meta.property_type,
        address,
      });
      discovered++;
    }
  }

  const toGeocode = candidates.slice(0, limit);

  // 백필 진행률 지표: 재시도 대상 총량 (발굴 안 된 신규는 포함 안 됨)
  const { count: remainingNullCount } = await supabaseAdmin
    .from('complexes')
    .select('complex_key', { count: 'exact', head: true })
    .is('lat', null);

  const summary = {
    scan_lawd_cd: scanLawd,
    retry_pool: candidates.length - discovered,
    discovered,
    to_geocode: toGeocode.length,
    lat_null_total: remainingNullCount ?? null,
    geocoded: 0,
    failed: 0,
    upserted: 0,
    errors: [] as string[],
    elapsed_ms: 0,
  };

  // ── geocode + upsert. 동시 4개씩 (NCP/VWorld rate limit 보호) ──
  const results: Array<{
    complex_key: string;
    complex_name: string;
    lat: number | null;
    lng: number | null;
    road_address: string | null;
    jibun_address: string;
    sigungu_cd: string;
    property_type: string;
    geocode_source: string | null;
    geocoded_at: string | null;
  }> = [];

  const concurrency = 4;
  let cursor = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < toGeocode.length) {
      const idx = cursor++;
      if (idx >= toGeocode.length) break;
      const c = toGeocode[idx];
      const { point, debug: dbg } = c.address
        ? await geocodeWithDebug(c.address)
        : { point: null, debug: { address: '', lastError: 'EMPTY_ADDRESS' } };
      if (debug && debugSamples.length < 5) debugSamples.push({ complex_key: c.complex_key, ...dbg });
      if (point) {
        summary.geocoded++;
      } else {
        summary.failed++;
      }
      results.push({
        complex_key: c.complex_key,
        complex_name: c.complex_name,
        lat: point?.lat ?? null,
        lng: point?.lng ?? null,
        road_address: null,
        jibun_address: c.address,
        sigungu_cd: c.lawd_cd,
        property_type: c.property_type,
        // 실패해도 geocoded_at 스탬프 → 쿨다운 후 재시도 (성공 여부는 geocode_source로 구분)
        geocode_source: point ? point.source : null,
        geocoded_at: new Date().toISOString(),
      });
    }
  });
  await Promise.all(workers);

  // upsert (lat 있든 없든 마스터에 기록 — 실패 단지도 시도 흔적 남김)
  if (results.length > 0) {
    const { error: upErr } = await supabaseAdmin
      .from('complexes')
      .upsert(results, { onConflict: 'complex_key' });
    if (upErr) {
      summary.errors.push(`upsert: ${upErr.message}`);
    } else {
      summary.upserted = results.length;
    }
  }

  summary.elapsed_ms = Date.now() - started_at;
  return NextResponse.json({ ok: true, summary, debug_samples: debug ? debugSamples : undefined });
}

export async function GET(req: NextRequest) {
  return runGeocode(req);
}

export async function POST(req: NextRequest) {
  return runGeocode(req);
}
