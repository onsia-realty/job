import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { computeSlowOne, cacheKey, SLOW_METRICS, type SlowMetric } from '@/lib/market/rankings';

// GET /api/market/rankings/top10?metric=count|price|pyeong|highest|drop|rise&type=apt|officetel&sido=서울특별시
// - highest/drop/rise: 사전계산 캐시(market_rankings) 읽기 → 즉시. 없으면 폴백 계산.
// - count/price/pyeong: complex_aggregates MV 즉석 조회(가벼움).
export const maxDuration = 60;

const SIDO_PREFIX: Record<string, string> = { '서울특별시': '11', '경기도': '41' };

// MV 결과(≤10건)에 구 이름 부착 (코드 11545 → "관악구")
async function attachRegionNames<T extends { lawd_cd: string | null }>(rankings: T[]): Promise<(T & { region_name: string })[]> {
  const codes = [...new Set(rankings.map((r) => r.lawd_cd).filter((c): c is string => !!c))];
  if (!codes.length) return rankings.map((r) => ({ ...r, region_name: '' }));
  const { data } = await supabaseAdmin.from('region_codes').select('lawd_cd, sido, sigungu').in('lawd_cd', codes);
  const map = new Map((data || []).map((r) => [r.lawd_cd, r.sigungu || r.sido || '']));
  return rankings.map((r) => ({ ...r, region_name: (r.lawd_cd && map.get(r.lawd_cd)) || r.lawd_cd || '' }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const metric = searchParams.get('metric') || 'highest';
  const property_type = searchParams.get('type') || 'apt';
  const sidoParam = searchParams.get('sido');
  const sido = sidoParam || 'all';

  try {
    // ── 신고가 / 최근하락 / 최근상승: 사전계산 캐시 읽기 ──
    if ((SLOW_METRICS as readonly string[]).includes(metric)) {
      const { data: cached } = await supabaseAdmin
        .from('market_rankings')
        .select('data, updated_at')
        .eq('cache_key', cacheKey(metric, sido, property_type))
        .maybeSingle();

      let rankings: unknown[];
      let source: 'cache' | 'live';
      if (cached) {
        rankings = (cached.data as unknown[]) || [];
        source = 'cache';
      } else {
        rankings = await computeSlowOne(metric as SlowMetric, property_type, sido);
        source = 'live';
      }

      return NextResponse.json(
        { metric, property_type, sido, source, updated_at: cached?.updated_at ?? null, rankings },
        { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400' } },
      );
    }

    // ── 거래량 / 평균가 / 평당가: MV 즉석 조회 ──
    const now = new Date();
    const targetYm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const ymStr = targetYm.toISOString().slice(0, 10);

    let query = supabaseAdmin
      .from('complex_aggregates')
      .select('complex_key, complex_name, lawd_cd, property_type, trade_count, avg_price_manwon, avg_pyeong_price, median_price_manwon, ym')
      .eq('property_type', property_type)
      .eq('ym', ymStr);

    const prefix = sidoParam ? SIDO_PREFIX[sidoParam] : undefined;
    if (prefix) query = query.like('lawd_cd', `${prefix}%`);

    if (metric === 'count') query = query.order('trade_count', { ascending: false });
    else if (metric === 'price') query = query.order('avg_price_manwon', { ascending: false });
    else if (metric === 'pyeong') query = query.order('avg_pyeong_price', { ascending: false });

    const { data, error } = await query.limit(10);
    if (error) throw error;

    const rankings = await attachRegionNames((data || []) as Array<{ lawd_cd: string | null }>);
    return NextResponse.json(
      { ym: ymStr, metric, property_type, sido, rankings },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
