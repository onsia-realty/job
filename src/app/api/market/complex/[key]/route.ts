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
// 차트 기간 → 개월 수. 잘못된 값은 6개월.
const RANGE_MONTHS: Record<string, number> = { '1m': 1, '6m': 6, '1y': 12, '3y': 36, '5y': 60 };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const complex_key = decodeURIComponent(key);
  const range = new URL(req.url).searchParams.get('range') || '6m';
  const months = RANGE_MONTHS[range] ?? 6;

  try {
    // 월별 집계 (기간 범위) — complex_aggregates Materialized View
    const { data: monthly } = await supabaseAdmin
      .from('complex_aggregates')
      .select('*')
      .eq('complex_key', complex_key)
      .order('ym', { ascending: false })
      .limit(months);

    // 기간 범위 거래 raw (매매 + 전세 분리 집계용)
    const sinceDate = new Date();
    sinceDate.setMonth(sinceDate.getMonth() - months);
    const sinceStr = sinceDate.toISOString().slice(0, 10);

    const { data: allTxs } = await supabaseAdmin
      .from('price_transactions')
      .select('deal_date, price_manwon, deposit_manwon, exclusive_area, deal_type, cancel_yn, complex_name, dong, lawd_cd')
      .eq('complex_key', complex_key)
      .gte('deal_date', sinceStr)
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
    let pnu: string | null = null;
    let kapt_code: string | null = null;
    try {
      const { data: cm } = await supabaseAdmin
        .from('complexes')
        .select('lat, lng, road_address, jibun_address, hhld_cnt, build_year, grnd_flr_cnt, pnu, kapt_code')
        .eq('complex_key', complex_key)
        .maybeSingle();
      if (cm) {
        complex_meta = {
          lat: cm.lat, lng: cm.lng,
          // 지오코딩 백필이 jibun_address만 채우므로 coalesce (헤더 주소 + 주변정보 도시 추출용)
          road_address: cm.road_address ?? cm.jibun_address,
          hhld_cnt: cm.hhld_cnt, build_year: cm.build_year, grnd_flr_cnt: cm.grnd_flr_cnt,
        };
        pnu = cm.pnu;
        kapt_code = cm.kapt_code ?? null;
      }
    } catch { /* 마이그 미적용 — 무시 */ }

    // 건축물대장 메타 — pnu join (아실 차별점: 대지지분/용적률/건폐율/주차)
    type BuildingMeta = {
      bc_rat: number | null;             // 건폐율 %
      vl_rat: number | null;             // 용적률 %
      plat_area: number | null;          // 대지면적 ㎡
      arch_area: number | null;          // 건축면적 ㎡
      tot_area: number | null;           // 연면적 ㎡
      land_share_per_hhld: number | null;// 세대당 대지지분 ㎡ (계산값)
      parking_total: number | null;      // 주차 총 (자주+기계)
      ride_elvt_cnt: number | null;      // 승용 승강기
      strct: string | null;              // 구조
      main_purps: string | null;         // 주용도
    };
    let building_meta: BuildingMeta | null = null;
    if (pnu) {
      try {
        const { data: bl } = await supabaseAdmin
          .from('building_ledgers')
          .select('bc_rat, vl_rat, plat_area, arch_area, tot_area, hhld_cnt, ride_elvt_cnt, indr_auto_utcnt, oudr_auto_utcnt, indr_mech_utcnt, oudr_mech_utcnt, strct_cd_nm, main_purps_cd_nm')
          .eq('pnu', pnu)
          .maybeSingle();
        if (bl) {
          const parking = (bl.indr_auto_utcnt || 0) + (bl.oudr_auto_utcnt || 0)
            + (bl.indr_mech_utcnt || 0) + (bl.oudr_mech_utcnt || 0);
          const landShare = (bl.plat_area && bl.hhld_cnt && bl.hhld_cnt > 0)
            ? Math.round((bl.plat_area / bl.hhld_cnt) * 100) / 100
            : null;
          building_meta = {
            bc_rat: bl.bc_rat,
            vl_rat: bl.vl_rat,
            plat_area: bl.plat_area,
            arch_area: bl.arch_area,
            tot_area: bl.tot_area,
            land_share_per_hhld: landShare,
            parking_total: parking > 0 ? parking : null,
            ride_elvt_cnt: bl.ride_elvt_cnt,
            strct: bl.strct_cd_nm,
            main_purps: bl.main_purps_cd_nm,
          };
        }
      } catch { /* 건축물대장 미적용 — graceful */ }
    }

    // 관리비 (K-apt) — kapt_code join, 최근 12개월. 공용 17 + 개별 10항목 + 총액.
    type MgmtCostRow = {
      search_date: string;
      total_cost: number | null;   // 공용+개별 단지 월 합계
      cmn_total: number | null;    // 공용관리비 합계
      ind_total: number | null;    // 개별사용료 합계
      cmn_labor: number | null; cmn_security: number | null; cmn_cleaning: number | null;
      cmn_elevator: number | null; cmn_repair: number | null; cmn_consign: number | null;
      cmn_disinfect: number | null; cmn_network: number | null; cmn_vehicle: number | null;
      cmn_office: number | null; cmn_tax: number | null; cmn_clothing: number | null;
      cmn_education: number | null; cmn_etc: number | null; cmn_facility: number | null;
      cmn_safety: number | null; cmn_disaster: number | null;
      // 개별사용료 — ind_heat = 난방비 버킷, 나머지 = 기타개별 버킷
      ind_heat: number | null; ind_hotwater: number | null; ind_gas: number | null;
      ind_elec: number | null; ind_water: number | null; ind_waste: number | null;
      ind_insurance: number | null; ind_election: number | null;
      ind_repr_council: number | null; ind_septic: number | null;
    };
    let mgmt_cost: {
      kapt_code: string;
      hhld_cnt: number | null;   // 세대당 환산용
      latest: MgmtCostRow;
      history: MgmtCostRow[];
    } | null = null;
    if (kapt_code) {
      try {
        const { data: amc } = await supabaseAdmin
          .from('apt_mgmt_costs')
          .select('search_date, total_cost, cmn_total, ind_total, cmn_labor, cmn_security, cmn_cleaning, cmn_elevator, cmn_repair, cmn_consign, cmn_disinfect, cmn_network, cmn_vehicle, cmn_office, cmn_tax, cmn_clothing, cmn_education, cmn_etc, cmn_facility, cmn_safety, cmn_disaster, ind_heat, ind_hotwater, ind_gas, ind_elec, ind_water, ind_waste, ind_insurance, ind_election, ind_repr_council, ind_septic')
          .eq('kapt_code', kapt_code)
          .order('search_date', { ascending: false })
          .limit(12) as { data: MgmtCostRow[] | null };
        if (amc && amc.length > 0) {
          mgmt_cost = { kapt_code, hhld_cnt: complex_meta?.hhld_cnt ?? null, latest: amc[0], history: amc };
        }
      } catch { /* 028 미적용 — graceful */ }
    }

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

    // 최근 분양권 거래 (presale_resale)
    const recent_silv_transactions = (allTxs || [])
      .filter((t) => t.deal_type === 'presale_resale')
      .slice(0, 10)
      .map((t) => ({
        deal_date: t.deal_date,
        price_manwon: t.price_manwon,
        exclusive_area: t.exclusive_area,
        floor: null as number | null,
        deal_type: t.deal_type,
        deal_channel: null as string | null,
      }));

    // 단지가 위치한 lawd_cd
    const lawd_cd = monthly?.[0]?.lawd_cd || allTxs?.[0]?.lawd_cd || null;

    // 인근 단지 비교 (반경 ~2km, 같은 lawd_cd 우선)
    type NearbyRow = {
      complex_key: string;
      complex_name: string;
      avg_price_manwon: number;
      trade_count: number;
      avg_pyeong_price: number;
      distance_km: number | null;
    };
    let nearby_complexes: NearbyRow[] = [];
    if (complex_meta?.lat != null && complex_meta?.lng != null) {
      try {
        // 같은 sigungu의 최근 월 단지 평균 조회
        const { data: agg } = await supabaseAdmin
          .from('complex_aggregates')
          .select('complex_key, complex_name, avg_price_manwon, trade_count, avg_pyeong_price, lawd_cd')
          .eq('lawd_cd', lawd_cd || '')
          .neq('complex_key', complex_key)
          .order('ym', { ascending: false })
          .limit(200);
        if (agg && agg.length > 0) {
          // 단지별 첫 행만 (최근 월)
          const seen = new Set<string>();
          const uniqAgg = agg.filter((a) => {
            if (seen.has(a.complex_key)) return false;
            seen.add(a.complex_key);
            return true;
          });
          // 좌표 join 후 거리 계산
          const uniqKeys = uniqAgg.map((a) => a.complex_key);
          const { data: coords } = await supabaseAdmin
            .from('complexes')
            .select('complex_key, lat, lng')
            .in('complex_key', uniqKeys)
            .not('lat', 'is', null);
          const coordMap = new Map(coords?.map((c) => [c.complex_key, { lat: c.lat, lng: c.lng }]) ?? []);
          const myLat = complex_meta.lat;
          const myLng = complex_meta.lng;
          nearby_complexes = uniqAgg
            .map((a) => {
              const c = coordMap.get(a.complex_key);
              if (!c) return null;
              // 간이 거리 — 한국 위도 ~111km/도, 경도 ~88km/도
              const dLat = (c.lat - myLat) * 111;
              const dLng = (c.lng - myLng) * 88;
              const distance_km = Math.sqrt(dLat * dLat + dLng * dLng);
              return {
                complex_key: a.complex_key,
                complex_name: a.complex_name,
                avg_price_manwon: a.avg_price_manwon,
                trade_count: a.trade_count,
                avg_pyeong_price: a.avg_pyeong_price,
                distance_km: Math.round(distance_km * 100) / 100,
              } as NearbyRow;
            })
            .filter((r): r is NearbyRow => r !== null && r.distance_km! <= 2)
            .sort((a, b) => (a.distance_km ?? 99) - (b.distance_km ?? 99))
            .slice(0, 8);
        }
      } catch { /* graceful */ }
    }

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

    // 매매/전세/분양권 월별 분리 (+ 매매/전세 평당가 — 전용면적 기준)
    const PY = 3.3058; // ㎡ → 평
    const monthlyGroup = new Map<string, {
      trade_prices: number[]; rent_deposits: number[]; presale_prices: number[];
      trade_pyeongs: number[]; rent_pyeongs: number[];
      trade_count: number; rent_count: number; presale_count: number;
    }>();
    (allTxs || []).forEach((t) => {
      if (!t.deal_date) return;
      const ym = t.deal_date.slice(0, 7);
      if (!monthlyGroup.has(ym)) {
        monthlyGroup.set(ym, {
          trade_prices: [], rent_deposits: [], presale_prices: [],
          trade_pyeongs: [], rent_pyeongs: [],
          trade_count: 0, rent_count: 0, presale_count: 0,
        });
      }
      const g = monthlyGroup.get(ym)!;
      const area = t.exclusive_area && t.exclusive_area > 0 ? t.exclusive_area : null;
      if (t.deal_type === 'trade' && t.price_manwon) {
        g.trade_prices.push(t.price_manwon);
        if (area) g.trade_pyeongs.push((t.price_manwon / area) * PY);
        g.trade_count++;
      } else if (t.deal_type === 'rent' && t.deposit_manwon) {
        g.rent_deposits.push(t.deposit_manwon);
        if (area) g.rent_pyeongs.push((t.deposit_manwon / area) * PY);
        g.rent_count++;
      } else if (t.deal_type === 'presale_resale' && t.price_manwon) {
        g.presale_prices.push(t.price_manwon);
        g.presale_count++;
      }
    });
    const avg = (arr: number[]) => (arr.length > 0 ? Math.round(arr.reduce((s, p) => s + p, 0) / arr.length) : null);
    const monthly_split = Array.from(monthlyGroup.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ym, g]) => ({
        ym,
        trade_avg: avg(g.trade_prices),
        rent_avg: avg(g.rent_deposits),
        presale_avg: avg(g.presale_prices),
        trade_pyeong: avg(g.trade_pyeongs),
        rent_pyeong: avg(g.rent_pyeongs),
        trade_count: g.trade_count,
        rent_count: g.rent_count,
        presale_count: g.presale_count,
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
      recent_silv_transactions,
      // 신규 필드
      complex_meta,
      building_meta,
      mgmt_cost,
      nearby_complexes,
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
