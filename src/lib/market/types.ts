/**
 * 시세지도 공용 타입 — /api/market/complex/[key] 응답 등.
 * (구 MarketDetailPanel.tsx에서 이동)
 */

export interface ComplexDetail {
  complex_key: string;
  complex_name: string | null;
  dong: string | null;
  lawd_cd: string | null;
  growth_pct: number | null;
  monthly: Array<{
    ym: string;
    avg_price_manwon: number;
    trade_count: number;
    avg_pyeong_price: number;
  }>;
  recent_transactions: Array<{
    deal_date: string;
    price_manwon: number | null;
    exclusive_area: number | null;
    floor: number | null;
    deal_type: string;
    deal_channel: string | null;
  }>;
  recent_silv_transactions?: Array<{
    deal_date: string;
    price_manwon: number | null;
    exclusive_area: number | null;
    floor: number | null;
    deal_type: string;
    deal_channel: string | null;
  }>;
  complex_meta: {
    lat: number | null;
    lng: number | null;
    road_address: string | null;
    hhld_cnt: number | null;
    build_year: number | null;
    grnd_flr_cnt: number | null;
  } | null;
  building_meta?: {
    bc_rat: number | null;
    vl_rat: number | null;
    plat_area: number | null;
    arch_area: number | null;
    tot_area: number | null;
    land_share_per_hhld: number | null;
    parking_total: number | null;
    ride_elvt_cnt: number | null;
    strct: string | null;
    main_purps: string | null;
  } | null;
  nearby_complexes?: Array<{
    complex_key: string;
    complex_name: string;
    avg_price_manwon: number;
    trade_count: number;
    avg_pyeong_price: number;
    distance_km: number | null;
  }>;
  unit_distribution: Array<{
    label: string;
    count: number;
    avg_price_manwon: number;
    avg_pyeong_price: number;
  }>;
  monthly_split: Array<{
    ym: string;
    trade_avg: number | null;
    rent_avg: number | null;
    presale_avg?: number | null;
    trade_pyeong?: number | null;   // 매매 평당가 (전용면적 기준, 만원/평)
    rent_pyeong?: number | null;    // 전세 평당가 (전용면적 기준, 만원/평)
    trade_count: number;
    rent_count: number;
    presale_count?: number;
  }>;
  lease_ratio: number | null;
}
