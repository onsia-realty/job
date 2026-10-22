import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { koreanDate, marketMonthsAgo } from '@/lib/market/types';
import {
  fetchApartmentTrades, fetchApartmentRents,
  fetchOfficetelTrades, fetchOfficetelRents,
  fetchApartmentSilvTrades,
  type PropertyType, type DealType,
  type NormalizedTransaction,
} from '@/lib/market/realEstate';

import { deduplicateTransactionBatch, TRANSACTION_CONFLICT_COLUMNS } from '@/lib/market/transactionBatch';
import { readTransactionPages, transactionReadBudget, transactionMetadata, TransactionReadBudgetError } from '@/lib/market/transactionData';

// GET /api/market/transactions
//   모드 1 (bounds): ?bounds=sw_lat,sw_lng,ne_lat,ne_lng&type=apt&deal=trade[&months=6]
//                    지도 viewport 범위의 단지를 조회. 클라이언트 드래그용.
//   모드 2 (lawd_cd): ?lawd_cd=11680&ym=202604&type=apt&deal=trade
//                    국토부 API fetch + 캐시 채우기 (RegionPicker / cron 호환).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lawd_cd = searchParams.get('lawd_cd');
  const ym = searchParams.get('ym');
  const bounds = searchParams.get('bounds');
  const months = Math.min(12, Math.max(1, parseInt(searchParams.get('months') || '6', 10) || 6));
  const type = (searchParams.get('type') || 'apt') as PropertyType;
  const deal = (searchParams.get('deal') || 'trade') as DealType;

  if (!['apt', 'officetel'].includes(type) || !['trade', 'rent', 'presale_resale'].includes(deal)
    || (type === 'officetel' && deal === 'presale_resale')) {
    return NextResponse.json({ error: 'Unsupported transaction type or deal' }, { status: 400 });
  }

  if (bounds) {
    return handleBoundsMode(bounds, type, deal, months);
  }

  if (!lawd_cd || !ym) {
    return NextResponse.json({ error: 'lawd_cd and ym are required (or use bounds=)' }, { status: 400 });
  }

  if (!/^\d{5}$/.test(lawd_cd) || !/^\d{4}(0[1-9]|1[0-2])$/.test(ym)) {
    return NextResponse.json({ error: 'Invalid region or month' }, { status: 400 });
  }
  const period = {
    periodStart: `${ym.slice(0, 4)}-${ym.slice(4)}-01`,
    periodEnd: new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(4)), 0)).toISOString().slice(0, 10),
  };
  try {
    const cached = await readTransactionPages((from, to) => supabaseAdmin
      .from('price_transactions').select('*').eq('lawd_cd', lawd_cd)
      .eq('deal_ymd', ym).eq('property_type', type).eq('deal_type', deal)
      .order('deal_date', { ascending: false }).order('id', { ascending: false }).range(from, to));
    const cacheMetadata = transactionMetadata(cached, { ...period, source: 'cache' });
    const respond = async (rows: typeof cached, metadata: ReturnType<typeof transactionMetadata>) => {
      const active = rows.filter(r => !r.cancel_yn);
      return NextResponse.json({ source: metadata.source, count: active.length, transactions: active,
        complex_coords: await loadComplexCoords(active.map(r => r.complex_key)), metadata },
        { headers: { 'Cache-Control': metadata.stale || metadata.persistenceError ? 'no-store' : 'public, s-maxage=600' } });
    };
    if (cached.length && !cacheMetadata.stale) return respond(cached, cacheMetadata);

    let fetched: NormalizedTransaction[];
    try {
      const serviceKey = process.env.DATA_GO_KR_API_KEY;
      if (!serviceKey) throw new Error('MOLIT service unavailable');
      // fetchMolit owns the 30-second abortable budget and clears its timer.
      fetched = await fetchByType(type, deal, lawd_cd, ym, serviceKey);
    } catch {
      const error = 'MOLIT service unavailable';
      const metadata = transactionMetadata(cached, { ...period, source: cached.length ? 'cache-stale' : 'molit-unavailable', stale: true, error });
      if (cached.length) return respond(cached, metadata);
      return NextResponse.json({ error, metadata }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    const completedAt = new Date().toISOString();
    const rows = deduplicateTransactionBatch(fetched.map(r => ({ ...r, fetched_at: completedAt })));
    let persistenceError: string | undefined;
    if (rows.length) {
      try {
        const { error } = await supabaseAdmin.from('price_transactions').upsert(
          rows.map(({ raw, ...row }) => { void raw; return row; }),
          { onConflict: TRANSACTION_CONFLICT_COLUMNS.join(','), ignoreDuplicates: false });
        if (error) persistenceError = 'Transaction cache persistence failed';
      } catch { persistenceError = 'Transaction cache persistence failed'; }
    }
    return respond(rows, transactionMetadata(rows, { ...period, source: 'molit', stale: false, completedAt, persistenceError }));
  } catch (error) {
    const truncated = error instanceof TransactionReadBudgetError;
    const message = truncated ? error.message : 'Transaction cache read failed';
    return NextResponse.json({ error: message, metadata: transactionMetadata([], {
      ...period, source: 'cache-unavailable', stale: true, truncated, error: message,
    }) }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

// Viewport bounds 모드: 좌표 범위 안 단지의 최근 N개월 거래를 그대로 반환.
// 국토부 API는 호출하지 않음 — cron이 이미 채운 데이터만 조회.
const BOUNDS_MAX_COMPLEXES = 500;  // 줌 아웃 폭주 방지
// .in() 키 수 제한 — 한글 complex_key는 URL 인코딩 시 키당 ~100-150바이트라
// 100개만 넘어도 게이트웨이/undici URL 한도를 초과(fetch failed). 또한 PostgREST는
// 거래 행은 각 청크 안에서도 1000행씩 끝까지 페이지 조회한다.
const IN_QUERY_CHUNK = 30;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
async function handleBoundsMode(
  boundsParam: string,
  type: PropertyType,
  deal: DealType,
  months: number,
): Promise<NextResponse> {
  const parts = boundsParam.split(',').map((v) => parseFloat(v));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    return NextResponse.json({ error: 'bounds must be "sw_lat,sw_lng,ne_lat,ne_lng"' }, { status: 400 });
  }
  const [sw_lat, sw_lng, ne_lat, ne_lng] = parts;

  const now = new Date();
  const sinceStr = marketMonthsAgo(months, now);
  const period = { periodStart: sinceStr, periodEnd: koreanDate(now) };
  let truncated = false;
  try {
    // 1) bounds 안 단지 키 조회 — complexes 마스터 사용 (좌표 백필된 것만)
    //    ⚠️ property_type으로 거르지 않는다 — 주상복합(예: 파크하비오)은 한 complex_key에
    //    apt+officetel 거래가 섞여 있는데 마스터 행의 type은 하나뿐이라, 여기서 거르면
    //    반대 탭에서 단지가 통째로 사라진다. 유형 필터는 아래 거래 쿼리가 담당.
    const { data: complexRows, error: cErr } = await supabaseAdmin
      .from('complexes')
      .select('complex_key, lat, lng, hhld_cnt, build_year, property_type')
      .gte('lat', sw_lat)
      .lte('lat', ne_lat)
      .gte('lng', sw_lng)
      .lte('lng', ne_lng)
      .order('complex_key', { ascending: true })
      .limit(BOUNDS_MAX_COMPLEXES + 1);

    if (cErr) throw new Error(cErr.message);
    truncated = (complexRows?.length ?? 0) > BOUNDS_MAX_COMPLEXES;
    const selected = (complexRows ?? []).slice(0, BOUNDS_MAX_COMPLEXES);
    const complex_keys = selected.map(c => c.complex_key);
    const budget = transactionReadBudget();
    const txs = [];
    for (const keys of chunk(complex_keys, IN_QUERY_CHUNK)) {
      const rows = await readTransactionPages((from, to) => supabaseAdmin
        .from('price_transactions').select('*').in('complex_key', keys)
        .eq('property_type', type).eq('deal_type', deal).eq('cancel_yn', false)
        .gte('deal_date', sinceStr).lte('deal_date', period.periodEnd)
        .order('deal_date', { ascending: false }).order('id', { ascending: false }).range(from, to), budget);
      txs.push(...rows.filter(r => !r.cancel_yn));
    }
    txs.sort((a, b) => String(b.deal_date).localeCompare(String(a.deal_date)) || String(b.id).localeCompare(String(a.id)));

    // 3) complex_coords map (클라이언트 jitter fallback 제거용)
    const complex_coords: Record<string, ComplexCoord> = {};
    for (const c of selected) {
      complex_coords[c.complex_key] = {
        lat: c.lat, lng: c.lng, hhld_cnt: c.hhld_cnt, build_year: c.build_year,
      };
    }

    return NextResponse.json({
      source: 'bounds',
      metadata: transactionMetadata(txs, { ...period, source: 'bounds', truncated, complexLimit: BOUNDS_MAX_COMPLEXES }),
      count: (txs || []).length,
      transactions: txs || [],
      complex_coords,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    console.error('[market/transactions] bounds mode error:', msg);
    return NextResponse.json({ error: msg, metadata: transactionMetadata([], { ...period, source: 'bounds', stale: true, truncated: truncated || e instanceof TransactionReadBudgetError, complexLimit: BOUNDS_MAX_COMPLEXES, error: msg }) }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

/**
 * 단지별 좌표/메타 map 로드. complexes 테이블 미존재(마이그 미적용)면 {} 반환.
 */
type ComplexCoord = { lat: number | null; lng: number | null; hhld_cnt: number | null; build_year: number | null };
async function loadComplexCoords(complex_keys: string[]): Promise<Record<string, ComplexCoord>> {
  if (complex_keys.length === 0) return {};
  const uniqKeys = Array.from(new Set(complex_keys));
  try {
    const chunks = await Promise.all(
      chunk(uniqKeys, IN_QUERY_CHUNK).map(async (keys) => {
        const { data, error } = await supabaseAdmin
          .from('complexes')
          .select('complex_key, lat, lng, hhld_cnt, build_year')
          .in('complex_key', keys);
        return error ? [] : data || [];
      }),
    );
    const map: Record<string, ComplexCoord> = {};
    for (const c of chunks.flat()) {
      map[c.complex_key] = { lat: c.lat, lng: c.lng, hhld_cnt: c.hhld_cnt, build_year: c.build_year };
    }
    return map;
  } catch {
    return {};
  }
}

async function fetchByType(
  type: PropertyType,
  deal: DealType,
  lawd_cd: string,
  ym: string,
  service_key: string
): Promise<NormalizedTransaction[]> {
  if (type === 'apt' && deal === 'trade') return fetchApartmentTrades(lawd_cd, ym, service_key);
  if (type === 'apt' && deal === 'rent') return fetchApartmentRents(lawd_cd, ym, service_key);
  if (type === 'apt' && deal === 'presale_resale') return fetchApartmentSilvTrades(lawd_cd, ym, service_key);
  if (type === 'officetel' && deal === 'trade') return fetchOfficetelTrades(lawd_cd, ym, service_key);
  if (type === 'officetel' && deal === 'rent') return fetchOfficetelRents(lawd_cd, ym, service_key);
  throw new Error('Unsupported transaction type');
}
