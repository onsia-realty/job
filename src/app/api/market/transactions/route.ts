import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import {
  fetchApartmentTrades, fetchApartmentRents,
  fetchOfficetelTrades, fetchOfficetelRents,
  fetchApartmentSilvTrades,
  getSampleTransactions, type PropertyType, type DealType,
  type NormalizedTransaction,
} from '@/lib/market/realEstate';

const CACHE_FRESHNESS_HOURS = 24;

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

  if (bounds) {
    return handleBoundsMode(bounds, type, deal, months);
  }

  if (!lawd_cd || !ym) {
    return NextResponse.json({ error: 'lawd_cd and ym are required (or use bounds=)' }, { status: 400 });
  }

  try {
    // L2 캐시 — Supabase 조회 (fresh?)
    const { data: cached, error: cacheErr } = await supabaseAdmin
      .from('price_transactions')
      .select('*')
      .eq('lawd_cd', lawd_cd)
      .eq('deal_ymd', ym)
      .eq('property_type', type)
      .eq('deal_type', deal)
      .order('deal_date', { ascending: false });

    if (cacheErr) {
      console.error('[market/transactions] cache read error:', cacheErr);
    }

    const isFresh = (cached && cached.length > 0)
      ? isRecentlyFetched(cached[0]?.fetched_at, CACHE_FRESHNESS_HOURS)
      : false;

    if (isFresh && cached) {
      const complex_coords = await loadComplexCoords(cached.map((c) => c.complex_key));
      return NextResponse.json({
        source: 'cache',
        count: cached.length,
        transactions: cached,
        complex_coords,
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' },
      });
    }

    // L1 캐시 MISS → 국토부 API fetch
    const service_key = process.env.DATA_GO_KR_API_KEY;
    let rows: NormalizedTransaction[];
    let source: string;

    if (!service_key) {
      rows = getSampleTransactions(lawd_cd, ym);
      source = 'sample';
    } else {
      rows = await fetchByType(type, deal, lawd_cd, ym, service_key);
      source = 'molit';

      // Upsert 캐시
      if (rows.length > 0) {
        const { error: upErr } = await supabaseAdmin
          .from('price_transactions')
          .upsert(
            rows.map((r) => ({
              property_type: r.property_type,
              deal_type: r.deal_type,
              lawd_cd: r.lawd_cd,
              deal_ymd: r.deal_ymd,
              deal_date: r.deal_date,
              complex_name: r.complex_name,
              complex_key: r.complex_key,
              dong: r.dong,
              jibun: r.jibun,
              exclusive_area: r.exclusive_area,
              floor: r.floor,
              build_year: r.build_year,
              price_manwon: r.price_manwon,
              deposit_manwon: r.deposit_manwon,
              monthly_manwon: r.monthly_manwon,
              cancel_yn: r.cancel_yn,
              deal_channel: r.deal_channel,
              raw: r.raw,
              fetched_at: new Date().toISOString(),
            })),
            { onConflict: 'property_type,deal_type,lawd_cd,deal_ymd,complex_name,jibun,exclusive_area,floor,deal_date,price_manwon,deposit_manwon', ignoreDuplicates: true }
          );
        if (upErr) console.error('[market/transactions] upsert error:', upErr);
      }
    }

    const complex_coords = await loadComplexCoords(rows.map((r) => r.complex_key));
    return NextResponse.json({
      source,
      count: rows.length,
      transactions: rows,
      complex_coords,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('[market/transactions] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Viewport bounds 모드: 좌표 범위 안 단지의 최근 N개월 거래를 그대로 반환.
// 국토부 API는 호출하지 않음 — cron이 이미 채운 데이터만 조회.
const BOUNDS_MAX_COMPLEXES = 500;  // 줌 아웃 폭주 방지
// .in() 키 수 제한 — 한글 complex_key는 URL 인코딩 시 키당 ~100-150바이트라
// 100개만 넘어도 게이트웨이/undici URL 한도를 초과(fetch failed). 또한 PostgREST는
// 요청당 1000행 캡이 있어, 청크를 작게 가져가면 행 잘림도 함께 방지된다.
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
      .limit(BOUNDS_MAX_COMPLEXES);

    if (cErr) {
      console.error('[market/transactions] bounds complex query error:', cErr);
      return NextResponse.json({ error: cErr.message }, { status: 500 });
    }
    if (!complexRows || complexRows.length === 0) {
      return NextResponse.json({ source: 'bounds', count: 0, transactions: [], complex_coords: {} });
    }

    const complex_keys = complexRows.map((c) => c.complex_key);

    // 2) 최근 N개월 거래 (cancel 제외, property_type + deal_type 매칭)
    //    .in() 키가 수백 개면 쿼리 URL이 게이트웨이 한도를 넘어 400 → 청크 병렬 조회
    const sinceDate = new Date();
    sinceDate.setMonth(sinceDate.getMonth() - months);
    const sinceStr = sinceDate.toISOString().slice(0, 10);

    const txChunks = await Promise.all(
      chunk(complex_keys, IN_QUERY_CHUNK).map(async (keys) => {
        const { data, error } = await supabaseAdmin
          .from('price_transactions')
          .select('*')
          .in('complex_key', keys)
          .eq('property_type', type)
          .eq('deal_type', deal)
          .eq('cancel_yn', false)
          .gte('deal_date', sinceStr);
        if (error) throw new Error(`bounds tx query: ${error.message}`);
        return data || [];
      }),
    );
    const txs = txChunks.flat().sort((a, b) => (a.deal_date < b.deal_date ? 1 : -1));

    // 3) complex_coords map (클라이언트 jitter fallback 제거용)
    const complex_coords: Record<string, ComplexCoord> = {};
    for (const c of complexRows) {
      complex_coords[c.complex_key] = {
        lat: c.lat, lng: c.lng, hhld_cnt: c.hhld_cnt, build_year: c.build_year,
      };
    }

    return NextResponse.json({
      source: 'bounds',
      count: (txs || []).length,
      transactions: txs || [],
      complex_coords,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    console.error('[market/transactions] bounds mode error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function isRecentlyFetched(fetchedAt: string | undefined, hours: number): boolean {
  if (!fetchedAt) return false;
  const diffMs = Date.now() - new Date(fetchedAt).getTime();
  return diffMs < hours * 60 * 60 * 1000;
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
  return [];
}
