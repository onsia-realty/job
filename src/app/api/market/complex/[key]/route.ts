import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/market/complex/[key]
// 단지 상세: 최근 6개월 월별 집계 + 최근 10거래 + 주변 중개사/공고
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const complex_key = decodeURIComponent(key);

  try {
    // 월별 집계 (최근 6개월)
    const { data: monthly } = await supabaseAdmin
      .from('complex_aggregates')
      .select('*')
      .eq('complex_key', complex_key)
      .order('ym', { ascending: false })
      .limit(6);

    // 최근 10거래
    const { data: recent } = await supabaseAdmin
      .from('price_transactions')
      .select('deal_date, price_manwon, exclusive_area, floor, deal_type, deal_channel, cancel_yn, lawd_cd')
      .eq('complex_key', complex_key)
      .eq('cancel_yn', false)
      .order('deal_date', { ascending: false })
      .limit(10);

    // 단지가 위치한 lawd_cd 추출 (집계 또는 거래에서)
    const lawd_cd = monthly?.[0]?.lawd_cd || recent?.[0]?.lawd_cd || null;

    // 변동률 계산 (간이)
    let growth_pct: number | null = null;
    if (monthly && monthly.length >= 2) {
      const [current, previous] = monthly;
      if (previous.avg_price_manwon > 0) {
        growth_pct = Math.round(
          ((current.avg_price_manwon - previous.avg_price_manwon) / previous.avg_price_manwon) * 1000
        ) / 10;
      }
    }

    return NextResponse.json({
      complex_key,
      complex_name: monthly?.[0]?.complex_name || recent?.[0] ? '단지' : null,
      lawd_cd,
      growth_pct,
      monthly: monthly || [],
      recent_transactions: recent || [],
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
