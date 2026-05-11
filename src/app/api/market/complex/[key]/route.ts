import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

interface RawTx {
  deal_date: string;
  price_manwon: number | null;
  deposit_manwon: number | null;
  exclusive_area: number | null;
  deal_type: string;
  cancel_yn: boolean;
  complex_name?: string;
  dong?: string | null;
  lawd_cd?: string;
}

// GET /api/market/complex/[key]
// 단지 상세: 월별 집계, 평형별 분포, 매매/전세 분리, 전세가율, 단지 메타, 최근 거래
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const complex_key = decodeURIComponent(key);

  try {
    // 월별 집계 (최근 6개월) — complex_aggregates Materialized View
    const { data: monthly } = await supabaseAdmin
      .from('complex_aggregates')
      .select('*')
      .eq('complex_key', complex_key)
      .order('ym', { ascending: false })
      .limit(6);

    // 최근 6개월 거래 raw (매매 + 전세 분리 집계용)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10);

    const { data: allTxs } = await supabaseAdmin
      .from('price_transactions')
      .select('deal_date, price_manwon, deposit_manwon, exclusive_area, deal_type, cancel_yn, complex_name, dong, lawd_cd')
      .eq('complex_key', complex_key)
      .gte('deal_date', sixMonthsAgoStr)
      .eq('cancel_yn', false)
      .order('deal_date', { ascending: false }) as { data: RawTx[] | null };

    // 단지 마스터 (좌표 + 메타) — 마이그 미적용 시 graceful
    let complex_meta: {
      lat: number | null;
      lng: number | null;
      road_address: string | null;
      hhld_cnt: number | null;
      build_year: number | null;
      grnd_flr_cnt: number | null;
    } | null = null;
    try {
      const { data: cm } = await supabaseAdmin
        .from('complexes')
        .select('lat, lng, road_address, hhld_cnt, build_year, grnd_flr_cnt')
        .eq('complex_key', complex_key)
        .maybeSingle();
      if (cm) complex_meta = cm;
    } catch { /* 마이그 미적용 — 무시 */ }

    // 최근 10거래 (매매만 — 표시용)
    const recent_transactions = (allTxs || [])
      .filter((t) => t.deal_type === 'trade')
      .slice(0, 10)
      .map((t) => ({
        deal_date: t.deal_date,
        price_manwon: t.price_manwon,
        exclusive_area: t.exclusive_area,
        floor: null as number | null, // 기존 호환
        deal_type: t.deal_type,
        deal_channel: null as string | null,
      }));

    // 단지가 위치한 lawd_cd
    const lawd_cd = monthly?.[0]?.lawd_cd || allTxs?.[0]?.lawd_cd || null;

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

    // 평형 bucket 분포 (매매 기준)
    const buckets: Array<{ label: string; min: number; max: number }> = [
      { label: '~60㎡', min: 0, max: 60 },
      { label: '60~85㎡', min: 60, max: 85 },
      { label: '85~110㎡', min: 85, max: 110 },
      { label: '110~135㎡', min: 110, max: 135 },
      { label: '135㎡~', min: 135, max: 9999 },
    ];
    const unit_distribution = buckets.map((b) => {
      const txs = (allTxs || []).filter((t) =>
        t.deal_type === 'trade' &&
        t.exclusive_area != null &&
        t.price_manwon != null &&
        t.exclusive_area >= b.min &&
        t.exclusive_area < b.max
      );
      const count = txs.length;
      const sumPrice = txs.reduce((s, t) => s + (t.price_manwon || 0), 0);
      const avg_price = count > 0 ? Math.round(sumPrice / count) : 0;
      const avg_pyeong = count > 0 && txs.some((t) => t.exclusive_area! > 0)
        ? Math.round(txs.reduce((s, t) => s + (t.price_manwon || 0) / (t.exclusive_area || 1), 0) / count * 3.3058)
        : 0;
      return { label: b.label, count, avg_price_manwon: avg_price, avg_pyeong_price: avg_pyeong };
    }).filter((b) => b.count > 0);

    // 매매/전세 월별 분리
    const monthlyGroup = new Map<string, { trade_prices: number[]; rent_deposits: number[]; trade_count: number; rent_count: number }>();
    (allTxs || []).forEach((t) => {
      if (!t.deal_date) return;
      const ym = t.deal_date.slice(0, 7);
      if (!monthlyGroup.has(ym)) {
        monthlyGroup.set(ym, { trade_prices: [], rent_deposits: [], trade_count: 0, rent_count: 0 });
      }
      const g = monthlyGroup.get(ym)!;
      if (t.deal_type === 'trade' && t.price_manwon) {
        g.trade_prices.push(t.price_manwon);
        g.trade_count++;
      } else if (t.deal_type === 'rent' && t.deposit_manwon) {
        g.rent_deposits.push(t.deposit_manwon);
        g.rent_count++;
      }
    });
    const monthly_split = Array.from(monthlyGroup.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ym, g]) => ({
        ym,
        trade_avg: g.trade_prices.length > 0 ? Math.round(g.trade_prices.reduce((s, p) => s + p, 0) / g.trade_prices.length) : null,
        rent_avg: g.rent_deposits.length > 0 ? Math.round(g.rent_deposits.reduce((s, p) => s + p, 0) / g.rent_deposits.length) : null,
        trade_count: g.trade_count,
        rent_count: g.rent_count,
      }));

    // 전세가율 (최근 6개월 전세 평균 / 매매 평균)
    const allTradePrices = (allTxs || []).filter((t) => t.deal_type === 'trade' && t.price_manwon).map((t) => t.price_manwon!);
    const allRentDeposits = (allTxs || []).filter((t) => t.deal_type === 'rent' && t.deposit_manwon).map((t) => t.deposit_manwon!);
    const tradeAvg = allTradePrices.length > 0 ? allTradePrices.reduce((s, p) => s + p, 0) / allTradePrices.length : 0;
    const rentAvg = allRentDeposits.length > 0 ? allRentDeposits.reduce((s, p) => s + p, 0) / allRentDeposits.length : 0;
    const lease_ratio = (tradeAvg > 0 && rentAvg > 0) ? Math.round((rentAvg / tradeAvg) * 1000) / 10 : null;

    return NextResponse.json({
      complex_key,
      complex_name: monthly?.[0]?.complex_name || allTxs?.[0]?.complex_name || null,
      dong: allTxs?.[0]?.dong || null,
      lawd_cd,
      growth_pct,
      monthly: monthly || [],
      recent_transactions,
      // 신규 필드
      complex_meta,
      unit_distribution,
      monthly_split,
      lease_ratio,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
