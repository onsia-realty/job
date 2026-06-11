import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

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

const PAGE = 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'apt';

  try {
    // 최근 3개월 (실거래 신고 지연 고려)
    const since = new Date();
    since.setMonth(since.getMonth() - 3);
    since.setDate(1);
    const sinceStr = since.toISOString().slice(0, 10);

    // MV 페이지 조회 (PostgREST aggregate 미지원 → 서버에서 집계)
    type Row = { lawd_cd: string; avg_price_manwon: number | null; trade_count: number | null; complex_key: string };
    const rows: Row[] = [];
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await supabaseAdmin
        .from('complex_aggregates')
        .select('lawd_cd, avg_price_manwon, trade_count, complex_key')
        .eq('property_type', type)
        .gte('ym', sinceStr)
        .range(offset, offset + PAGE - 1);
      if (error) {
        console.error('[market/aggregates] MV query error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      rows.push(...((data || []) as Row[]));
      if (!data || data.length < PAGE) break;
    }

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
      { aggregates },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    console.error('[market/aggregates] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
