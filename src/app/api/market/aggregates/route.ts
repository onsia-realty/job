import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { readTransactionPages, transactionMetadata } from '@/lib/market/transactionData';
import { marketMonthStart, marketMonthEnd } from '@/lib/market/types';

/**
 * GET /api/market/aggregates?level=gu&type=apt
 * 줌아웃(시군구 레벨)용 지역 집계 마커 데이터.
 *
 * complex_aggregates MV(매매 한정)에서 최근 3개월을 lawd_cd별로 집계하고
 * region_codes의 구 이름/centroid를 붙여 반환한다.
 * ※ MV가 매매 전용이라 집계값은 거래유형과 무관하게 "매매 평균" 기준.
 *
 * 응답: { aggregates: [{ lawd_cd, name, sido, lat, lng, avg_price_manwon, trade_count, complex_count }] }
 */



export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'apt';

  try {
    // 최근 3개월 (실거래 신고 지연 고려)
    const now = new Date();
    const sinceStr = marketMonthStart(3, now);
    const untilStr = marketMonthStart(0, now);

    type Row = { lawd_cd: string; avg_price_manwon: number | null; trade_count: number | null; complex_key: string; ym: string };
    const rows = await readTransactionPages<Row>((from, to) => supabaseAdmin
      .from('complex_aggregates')
      .select('lawd_cd, avg_price_manwon, trade_count, complex_key, ym')
      .eq('property_type', type)
      .gte('ym', sinceStr)
      .lte('ym', untilStr)
      .order('ym', { ascending: false })
      .order('complex_key', { ascending: true })
      .range(from, to));

    // lawd_cd별 가중평균 (거래건수 가중) + 단지 수
    const byGu = new Map<string, { priceSum: number; count: number; complexes: Set<string> }>();
    for (const r of rows) {
      if (!r.avg_price_manwon || !r.trade_count) continue;
      let g = byGu.get(r.lawd_cd);
      if (!g) {
        g = { priceSum: 0, count: 0, complexes: new Set() };
        byGu.set(r.lawd_cd, g);
      }
      g.priceSum += r.avg_price_manwon * r.trade_count;
      g.count += r.trade_count;
      g.complexes.add(r.complex_key);
    }

    // 구 이름 + centroid
    const { data: regions, error: rErr } = await supabaseAdmin
      .from('region_codes')
      .select('lawd_cd, sido, sigungu, lat, lng')
      .in('lawd_cd', Array.from(byGu.keys()));
    if (rErr) {
      return NextResponse.json({ error: rErr.message }, { status: 500 });
    }

    const aggregates = (regions || [])
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => {
        const g = byGu.get(r.lawd_cd)!;
        return {
          lawd_cd: r.lawd_cd,
          name: r.sigungu,
          sido: r.sido,
          lat: r.lat as number,
          lng: r.lng as number,
          avg_price_manwon: Math.round(g.priceSum / g.count),
          trade_count: g.count,
          complex_count: g.complexes.size,
        };
      })
      .sort((a, b) => b.trade_count - a.trade_count);

    return NextResponse.json(
      { aggregates, metadata: transactionMetadata([], { source: 'complex_aggregates', periodStart: sinceStr, periodEnd: rows.length ? marketMonthEnd(rows[0].ym, now) : null }) },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    console.error('[market/aggregates] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
