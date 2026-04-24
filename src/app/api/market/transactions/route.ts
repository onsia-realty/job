import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import {
  fetchApartmentTrades, fetchApartmentRents,
  fetchOfficetelTrades, fetchOfficetelRents,
  getSampleTransactions, type PropertyType, type DealType,
  type NormalizedTransaction,
} from '@/lib/market/realEstate';

const CACHE_FRESHNESS_HOURS = 24;

// GET /api/market/transactions?lawd_cd=11680&ym=202604&type=apt&deal=trade
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lawd_cd = searchParams.get('lawd_cd');
  const ym = searchParams.get('ym');
  const type = (searchParams.get('type') || 'apt') as PropertyType;
  const deal = (searchParams.get('deal') || 'trade') as DealType;

  if (!lawd_cd || !ym) {
    return NextResponse.json({ error: 'lawd_cd and ym are required' }, { status: 400 });
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
      return NextResponse.json({
        source: 'cache',
        count: cached.length,
        transactions: cached,
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

    return NextResponse.json({
      source,
      count: rows.length,
      transactions: rows,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('[market/transactions] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function isRecentlyFetched(fetchedAt: string | undefined, hours: number): boolean {
  if (!fetchedAt) return false;
  const diffMs = Date.now() - new Date(fetchedAt).getTime();
  return diffMs < hours * 60 * 60 * 1000;
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
  if (type === 'officetel' && deal === 'trade') return fetchOfficetelTrades(lawd_cd, ym, service_key);
  if (type === 'officetel' && deal === 'rent') return fetchOfficetelRents(lawd_cd, ym, service_key);
  return [];
}
