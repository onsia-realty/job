/**
 * 시세지도 공용 타입 — /api/market/complex/[key] 응답 등.
 * (구 MarketDetailPanel.tsx에서 이동)
 */

// K-apt 관리비 월별 행 (apt_mgmt_costs) — 공용 17 + 개별 10 + 총액
export interface MgmtCostRow {
  search_date: string; // YYYYMM
  total_cost: number | null; // 공용+개별 단지 월 합계
  cmn_total: number | null;  // 공용관리비 합계
  ind_total: number | null;  // 개별사용료 합계
  cmn_labor: number | null;
  cmn_security: number | null;
  cmn_cleaning: number | null;
  cmn_elevator: number | null;
  cmn_repair: number | null;
  cmn_consign: number | null;
  cmn_disinfect: number | null;
  cmn_network: number | null;
  cmn_vehicle: number | null;
  cmn_office: number | null;
  cmn_tax: number | null;
  cmn_clothing: number | null;
  cmn_education: number | null;
  cmn_etc: number | null;
  cmn_facility: number | null;
  cmn_safety: number | null;
  cmn_disaster: number | null;
  // 개별사용료 — ind_heat = 난방비 버킷, 나머지 = 기타개별 버킷
  ind_heat: number | null;
  ind_hotwater: number | null;
  ind_gas: number | null;
  ind_elec: number | null;
  ind_water: number | null;
  ind_waste: number | null;
  ind_insurance: number | null;
  ind_election: number | null;
  ind_repr_council: number | null;
  ind_septic: number | null;
}

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
  mgmt_cost?: {
    kapt_code: string;
    hhld_cnt: number | null; // 세대당 환산용
    latest: MgmtCostRow;
    history: MgmtCostRow[];
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
