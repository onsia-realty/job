import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { geocodeWithDebug, buildComplexAddress } from '@/lib/market/complexes';

export const maxDuration = 300;

/**
 * GET /api/cron/geocode-complexes
 * price_transactions에 있지만 complexes 마스터에 좌표가 없는 단지를 N개씩 geocode.
 * Authorization: Bearer ${CRON_SECRET}
 * ?limit=100 (기본), ?force=true 시 기존 좌표도 갱신
 *
 * 단지 1개당 ~2-3초 (Vworld 도로명+지번 시도). limit=100이면 5분 안.
 * Vercel cron 일1회 + 사용자 수동 트리거 양쪽 지원.
 */
const DEFAULT_LIMIT = 100;

async function runGeocode(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(500, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));
  const force = searchParams.get('force') === 'true';
  const debug = searchParams.get('debug') === 'true';
  const debugSamples: unknown[] = [];

  // 1) 고유 단지 후보 추출 — price_transactions에 있고 complexes에 없는 (또는 force=true) 것.
  //    한 번에 너무 많이 가져오지 않게 limit×3 정도만 sample.
  const candidates: Map<string, {
    complex_key: string;
    complex_name: string;
    lawd_cd: string;
    dong: string | null;
    jibun: string | null;
    property_type: string;
  }> = new Map();

  // distinct 단지 키 + 메타 추출 (Supabase는 group by 직접 안 됨 → 단순 select + dedupe)
  const { data: txs, error: txErr } = await supabaseAdmin
    .from('price_transactions')
    .select('complex_key, complex_name, lawd_cd, dong, jibun, property_type')
    .limit(limit * 30); // 중복 많으므로 충분히 가져옴

  if (txErr) {
    return NextResponse.json({ error: 'failed to load transactions', detail: txErr }, { status: 500 });
  }

  for (const t of txs || []) {
    if (!candidates.has(t.complex_key)) {
      candidates.set(t.complex_key, t);
    }
  }

  // 이미 좌표가 있는 complex_key 제외 (force=false인 경우)
  let toGeocode = Array.from(candidates.values());
  if (!force) {
    const { data: existing } = await supabaseAdmin
      .from('complexes')
      .select('complex_key, lat')
      .in('complex_key', toGeocode.map((c) => c.complex_key));
    const existingWithGeo = new Set((existing || []).filter((e) => e.lat != null).map((e) => e.complex_key));
    toGeocode = toGeocode.filter((c) => !existingWithGeo.has(c.complex_key));
  }

  // 시도/시군구 이름 보강 (지오코딩 주소 풍부화)
  const lawdCdSet = new Set(toGeocode.map((c) => c.lawd_cd));
  const { data: regions } = await supabaseAdmin
    .from('region_codes')
    .select('lawd_cd, sido, sigungu')
    .in('lawd_cd', Array.from(lawdCdSet));
  const regionByLawd = new Map((regions || []).map((r) => [r.lawd_cd, { sido: r.sido as string, sigungu: r.sigungu as string }]));

  toGeocode = toGeocode.slice(0, limit);

  const summary = {
    candidates_loaded: candidates.size,
    to_geocode: toGeocode.length,
    geocoded: 0,
    failed: 0,
    upserted: 0,
    errors: [] as string[],
    elapsed_ms: 0,
  };
  const started_at = Date.now();

  // 2) geocode + upsert. 동시 4개씩 (Vworld rate limit 보호).
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
      const region = regionByLawd.get(c.lawd_cd);
      const address = buildComplexAddress({
        sido: region?.sido,
        sigungu: region?.sigungu || '',
        dong: c.dong,
        jibun: c.jibun,
      });

      const { point, debug: dbg } = address ? await geocodeWithDebug(address) : { point: null, debug: { hasKey: false, address: '', roadStatus: 'NO_ADDR', parcelStatus: 'NO_ADDR', lastError: undefined } };
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
        jibun_address: address,
        sigungu_cd: c.lawd_cd,
        property_type: c.property_type,
        geocode_source: point ? `vworld_${point.source}` : null,
        geocoded_at: point ? new Date().toISOString() : null,
      });
    }
  });
  await Promise.all(workers);

  // 3) upsert (lat 있든 없든 마스터에 기록 — 실패 단지도 시도 흔적 남김)
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
