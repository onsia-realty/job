import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/market/rankings/top10?metric=count|price|growth&type=apt|officetel&sido=서울특별시
// 랭킹 지표 3종: 거래량 / 평균가 / 월간 변동률
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const metric = searchParams.get('metric') || 'count';
  const property_type = searchParams.get('type') || 'apt';
  const sido = searchParams.get('sido'); // optional

  try {
    // 이번 달 기준 (실거래 지연 고려 최근 1-2개월)
    const now = new Date();
    const targetYm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const ymStr = targetYm.toISOString().slice(0, 10);

    // complex_aggregates MV 조회
    let query = supabaseAdmin
      .from('complex_aggregates')
      .select('complex_key, complex_name, lawd_cd, property_type, trade_count, avg_price_manwon, avg_pyeong_price, median_price_manwon, ym')
      .eq('property_type', property_type)
      .eq('ym', ymStr);

    // sido 필터는 region_codes 조인 필요 → lawd_cd prefix로 처리
    if (sido === '서울특별시') {
      query = query.like('lawd_cd', '11%');
    } else if (sido === '경기도') {
      query = query.like('lawd_cd', '41%');
    }

    // 정렬 기준
    if (metric === 'count') {
      query = query.order('trade_count', { ascending: false });
    } else if (metric === 'price') {
      query = query.order('avg_price_manwon', { ascending: false });
    } else if (metric === 'pyeong') {
      query = query.order('avg_pyeong_price', { ascending: false });
    }

    const { data, error } = await query.limit(10);
    if (error) throw error;

    return NextResponse.json({
      ym: ymStr,
      metric,
      property_type,
      sido: sido || 'all',
      rankings: data || [],
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
