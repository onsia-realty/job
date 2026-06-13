/**
 * K-apt 공동주택관리비 (공용관리비) API
 * 출처: 국토부 공동주택관리비(공용관리비) 정보제공서비스 (data.go.kr, 1613000)
 *
 * 두 서비스로 구성:
 *  1) AptListService3       — 단지목록 (법정동/시군구 → kaptCode 매핑 소스)
 *  2) AptCmnuseManageCostServiceV2 — 공용관리비 17개 항목 (각각 별도 오퍼레이션)
 *
 * ⚠️ K-apt는 JSON 응답이다 (실거래가/건축물대장의 XML과 다름).
 *    응답 구조: { response: { header: {resultCode, resultMsg}, body: { items[] | item } } }
 *    각 공용관리비 오퍼레이션은 (kaptCode, searchDate) 단위로 단일 item을 반환하며,
 *    식별자(kaptCode/kaptName)를 제외한 모든 숫자필드의 합 = 해당 항목 총액. (17개 전부 검증됨)
 *    값이 모두 null = 그 단지가 K-apt에 관리비 미공개 (의무공개는 100세대+).
 */
import { API_BASE } from './publicApi';

export interface KaptListItem {
  kaptCode: string;
  kaptName: string;
  bjdCode: string;
  as1?: string | null; // 시도
  as2?: string | null; // 시군구
  as3?: string | null; // 읍면동
  as4?: string | null; // 리
}

/**
 * 공용관리비 17개 오퍼레이션 ↔ apt_mgmt_costs.cmn_* 컬럼 매핑.
 * col 은 마이그레이션 028 의 컬럼명, raw 키는 raw JSONB 에 저장할 키.
 */
export const CMN_COST_OPS = [
  { op: 'getHsmpLaborCostInfoV2', col: 'cmn_labor', key: 'labor', ko: '인건비' },
  { op: 'getHsmpTaxdueInfoV2', col: 'cmn_tax', key: 'tax', ko: '제세공과금' },
  { op: 'getHsmpVhcleMntncCostInfoV2', col: 'cmn_vehicle', key: 'vehicle', ko: '차량유지비' },
  { op: 'getHsmpEtcCostInfoV2', col: 'cmn_etc', key: 'etc', ko: '그밖의부대비용' },
  { op: 'getHsmpOfcrkCostInfoV2', col: 'cmn_office', key: 'office', ko: '제사무비' },
  { op: 'getHsmpClothingCostInfoV2', col: 'cmn_clothing', key: 'clothing', ko: '피복비' },
  { op: 'getHsmpEduTraingCostInfoV2', col: 'cmn_education', key: 'education', ko: '교육훈련비' },
  { op: 'getHsmpCleaningCostInfoV2', col: 'cmn_cleaning', key: 'cleaning', ko: '청소비' },
  { op: 'getHsmpGuardCostInfoV2', col: 'cmn_security', key: 'security', ko: '경비비' },
  { op: 'getHsmpDisinfectionCostInfoV2', col: 'cmn_disinfect', key: 'disinfect', ko: '소독비' },
  { op: 'getHsmpElevatorMntncCostInfoV2', col: 'cmn_elevator', key: 'elevator', ko: '승강기유지비' },
  { op: 'getHsmpHomeNetworkMntncCostInfoV2', col: 'cmn_network', key: 'network', ko: '지능형홈네트워크설비유지비' },
  { op: 'getHsmpRepairsCostInfoV2', col: 'cmn_repair', key: 'repair', ko: '수선비' },
  { op: 'getHsmpFacilityMntncCostInfoV2', col: 'cmn_facility', key: 'facility', ko: '시설유지비' },
  { op: 'getHsmpSafetyCheckUpCostInfoV2', col: 'cmn_safety', key: 'safety', ko: '안전점검비' },
  { op: 'getHsmpDisasterPreventionCostInfoV2', col: 'cmn_disaster', key: 'disaster', ko: '재해예방비' },
  { op: 'getHsmpConsignManageFeeInfoV2', col: 'cmn_consign', key: 'consign', ko: '위탁관리수수료' },
] as const;

export type CmnCostColumn = (typeof CMN_COST_OPS)[number]['col'];

/**
 * 개별사용료 10개 오퍼레이션 ↔ apt_mgmt_costs.ind_* 컬럼 매핑.
 * 서비스: AptIndvdlzManageCostServiceV2 (KAPT_IND_COST).
 * 각 항목은 C(공동)·P(세대) 2필드인 경우가 있어 식별자 외 전 숫자필드 합 = 항목총액.
 * bucket: 'heat' = 난방비 버킷(난방만), 'etc' = 기타개별관리비 버킷.
 * ※ 네이버 검증: 난방비 하절기≈0원 → 급탕(hotwater)은 난방이 아니라 기타개별.
 */
export const IND_COST_OPS = [
  { op: 'getHsmpHeatCostInfoV2', col: 'ind_heat', key: 'heat', ko: '난방비', bucket: 'heat' },
  { op: 'getHsmpHotWaterCostInfoV2', col: 'ind_hotwater', key: 'hotwater', ko: '급탕비', bucket: 'etc' },
  { op: 'getHsmpGasRentalFeeInfoV2', col: 'ind_gas', key: 'gas', ko: '가스사용료', bucket: 'etc' },
  { op: 'getHsmpElectricityCostInfoV2', col: 'ind_elec', key: 'elec', ko: '전기료', bucket: 'etc' },
  { op: 'getHsmpWaterCostInfoV2', col: 'ind_water', key: 'water', ko: '수도료', bucket: 'etc' },
  { op: 'getHsmpDomesticWasteFeeInfoV2', col: 'ind_waste', key: 'waste', ko: '생활폐기물수수료', bucket: 'etc' },
  { op: 'getHsmpBuildingInsuranceFeeInfoV2', col: 'ind_insurance', key: 'insurance', ko: '건물보험료', bucket: 'etc' },
  { op: 'getHsmpElectionOrpnsInfoV2', col: 'ind_election', key: 'election', ko: '선거관리위원회운영비', bucket: 'etc' },
  { op: 'getHsmpMovingInRepresentationMtgInfoV2', col: 'ind_repr_council', key: 'reprCouncil', ko: '입주자대표회의운영비', bucket: 'etc' },
  { op: 'getHsmpWaterPurifierTankFeeInfoV2', col: 'ind_septic', key: 'septic', ko: '정화조오물수수료', bucket: 'etc' },
] as const;

export type IndCostColumn = (typeof IND_COST_OPS)[number]['col'];

export interface CommonMgmtCostRow {
  kapt_code: string;
  search_date: string; // YYYYMM
  // 17개 항목 총액 (원) — null = 미공개/무데이터
  cmn_labor: number | null;
  cmn_tax: number | null;
  cmn_vehicle: number | null;
  cmn_etc: number | null;
  cmn_office: number | null;
  cmn_clothing: number | null;
  cmn_education: number | null;
  cmn_cleaning: number | null;
  cmn_security: number | null;
  cmn_disinfect: number | null;
  cmn_elevator: number | null;
  cmn_network: number | null;
  cmn_repair: number | null;
  cmn_facility: number | null;
  cmn_safety: number | null;
  cmn_disaster: number | null;
  cmn_consign: number | null;
  cmn_total: number | null; // 17개 합
  raw: Record<string, unknown>; // 항목별 세부필드 원본 ({ labor: {...}, tax: {...}, ... })
}

interface KaptResponse<T> {
  response?: {
    header?: { resultCode?: string; resultMsg?: string };
    body?: { items?: T[] | { item?: T | T[] }; item?: T | T[]; totalCount?: number };
  };
}

function toNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

async function fetchKaptJson<T>(url: URL, service_key: string): Promise<KaptResponse<T>> {
  url.searchParams.set('serviceKey', service_key);
  url.searchParams.set('_type', 'json');
  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`K-apt API ${res.status} ${res.statusText}`);
  const text = await res.text();
  try {
    return JSON.parse(text) as KaptResponse<T>;
  } catch {
    throw new Error(`K-apt API non-JSON response: ${text.slice(0, 100)}`);
  }
}

function isNormal(parsed: KaptResponse<unknown>): boolean {
  const rc = parsed?.response?.header?.resultCode;
  return String(rc) === '00' || String(rc) === '000';
}

/** 단지목록 응답에서 items 배열을 안전 추출 (K-apt는 body.items 가 배열) */
function extractKaptItems<T>(parsed: KaptResponse<T>): T[] {
  const body = parsed?.response?.body;
  if (!body) return [];
  if (Array.isArray(body.items)) return body.items;
  const nested = (body.items as { item?: T | T[] } | undefined)?.item ?? body.item;
  if (!nested) return [];
  return Array.isArray(nested) ? nested : [nested];
}

/** 법정동코드(10자리)로 단지목록 조회 → kaptCode 매핑 소스 */
export async function fetchKaptListByBjd(
  bjdCode: string,
  service_key: string,
  numOfRows = 1000,
): Promise<KaptListItem[]> {
  const url = new URL(`${API_BASE.KAPT_LIST}/getLegaldongAptList3`);
  url.searchParams.set('bjdCode', bjdCode);
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('numOfRows', String(numOfRows));
  const parsed = await fetchKaptJson<KaptListItem>(url, service_key);
  if (!isNormal(parsed)) return [];
  return extractKaptItems(parsed);
}

/** 시군구코드(5자리)로 단지목록 조회 */
export async function fetchKaptListBySigungu(
  sigunguCode: string,
  service_key: string,
  numOfRows = 1000,
): Promise<KaptListItem[]> {
  const url = new URL(`${API_BASE.KAPT_LIST}/getSigunguAptList3`);
  url.searchParams.set('sigunguCode', sigunguCode);
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('numOfRows', String(numOfRows));
  const parsed = await fetchKaptJson<KaptListItem>(url, service_key);
  if (!isNormal(parsed)) return [];
  return extractKaptItems(parsed);
}

/** 공용관리비 단일 항목 호출 → (총액, 세부필드 원본) */
async function fetchCmnCostItem(
  kaptCode: string,
  searchDate: string,
  op: string,
  service_key: string,
): Promise<{ total: number | null; detail: Record<string, unknown> }> {
  const url = new URL(`${API_BASE.KAPT_CMN_COST}/${op}`);
  url.searchParams.set('kaptCode', kaptCode);
  url.searchParams.set('searchDate', searchDate);
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('numOfRows', '1');
  const parsed = await fetchKaptJson<Record<string, unknown>>(url, service_key);
  if (!isNormal(parsed)) return { total: null, detail: {} };
  const items = extractKaptItems<Record<string, unknown>>(parsed);
  const item = items[0];
  if (!item) return { total: null, detail: {} };

  const detail: Record<string, unknown> = {};
  let total = 0;
  let any = false;
  for (const [k, v] of Object.entries(item)) {
    if (k === 'kaptCode' || k === 'kaptName') continue;
    detail[k] = v;
    const n = toNumber(v);
    if (n != null) {
      total += n;
      any = true;
    }
  }
  return { total: any ? total : null, detail };
}

/**
 * 한 단지의 한 달치 공용관리비 17개 항목을 모두 수집 → apt_mgmt_costs 행.
 * 17개 오퍼레이션을 병렬 호출. 전 항목이 null(미공개)이면 null 반환.
 */
export async function fetchCommonMgmtCost(
  kaptCode: string,
  searchDate: string,
  service_key: string,
): Promise<CommonMgmtCostRow | null> {
  const results = await Promise.all(
    CMN_COST_OPS.map((o) => fetchCmnCostItem(kaptCode, searchDate, o.op, service_key)),
  );

  const cols: Record<string, number | null> = {};
  const raw: Record<string, unknown> = {};
  let total = 0;
  let any = false;
  CMN_COST_OPS.forEach((o, i) => {
    const { total: cat, detail } = results[i];
    cols[o.col] = cat;
    raw[o.key] = detail;
    if (cat != null) {
      total += cat;
      any = true;
    }
  });

  if (!any) return null; // 단지 전체 미공개

  return {
    kapt_code: kaptCode,
    search_date: searchDate,
    cmn_labor: cols.cmn_labor,
    cmn_tax: cols.cmn_tax,
    cmn_vehicle: cols.cmn_vehicle,
    cmn_etc: cols.cmn_etc,
    cmn_office: cols.cmn_office,
    cmn_clothing: cols.cmn_clothing,
    cmn_education: cols.cmn_education,
    cmn_cleaning: cols.cmn_cleaning,
    cmn_security: cols.cmn_security,
    cmn_disinfect: cols.cmn_disinfect,
    cmn_elevator: cols.cmn_elevator,
    cmn_network: cols.cmn_network,
    cmn_repair: cols.cmn_repair,
    cmn_facility: cols.cmn_facility,
    cmn_safety: cols.cmn_safety,
    cmn_disaster: cols.cmn_disaster,
    cmn_consign: cols.cmn_consign,
    cmn_total: total,
    raw,
  };
}

export interface IndividualMgmtCostRow {
  kapt_code: string;
  search_date: string;
  ind_heat: number | null;        // 난방비 (난방 버킷)
  ind_hotwater: number | null;    // 급탕비
  ind_gas: number | null;         // 가스사용료
  ind_elec: number | null;        // 전기료 (공동+세대)
  ind_water: number | null;       // 수도료 (공동+세대)
  ind_waste: number | null;       // 생활폐기물수수료
  ind_insurance: number | null;   // 건물보험료
  ind_election: number | null;    // 선거관리위원회운영비
  ind_repr_council: number | null;// 입주자대표회의운영비
  ind_septic: number | null;      // 정화조오물수수료
  ind_total: number | null;       // 개별사용료 합계 (10항목)
  ind_heat_bucket: number | null; // 난방비 버킷 합 (= ind_heat)
  ind_etc_bucket: number | null;  // 기타개별 버킷 합 (난방 제외 9항목)
  raw: Record<string, unknown>;
}

/**
 * 한 단지의 한 달치 개별사용료 10개 항목 수집 → apt_mgmt_costs ind_* 행.
 * 전 항목 null(미공개)이면 null 반환.
 */
export async function fetchIndividualMgmtCost(
  kaptCode: string,
  searchDate: string,
  service_key: string,
): Promise<IndividualMgmtCostRow | null> {
  const results = await Promise.all(
    IND_COST_OPS.map((o) =>
      fetchCmnCostItem(kaptCode, searchDate, o.op, service_key).catch(() => ({ total: null, detail: {} })),
    ),
  );

  const cols: Record<string, number | null> = {};
  const raw: Record<string, unknown> = {};
  let total = 0;
  let heatBucket = 0;
  let etcBucket = 0;
  let any = false;
  IND_COST_OPS.forEach((o, i) => {
    const { total: cat, detail } = results[i];
    cols[o.col] = cat;
    raw[o.key] = detail;
    if (cat != null) {
      total += cat;
      any = true;
      if (o.bucket === 'heat') heatBucket += cat;
      else etcBucket += cat;
    }
  });

  if (!any) return null;

  return {
    kapt_code: kaptCode,
    search_date: searchDate,
    ind_heat: cols.ind_heat,
    ind_hotwater: cols.ind_hotwater,
    ind_gas: cols.ind_gas,
    ind_elec: cols.ind_elec,
    ind_water: cols.ind_water,
    ind_waste: cols.ind_waste,
    ind_insurance: cols.ind_insurance,
    ind_election: cols.ind_election,
    ind_repr_council: cols.ind_repr_council,
    ind_septic: cols.ind_septic,
    ind_total: total,
    ind_heat_bucket: heatBucket,
    ind_etc_bucket: etcBucket,
    raw,
  };
}

export interface KaptBasisInfo {
  kapt_code: string;
  kapt_name: string | null;
  hhld_cnt: number | null;     // 세대수 (kaptdaCnt)
  billed_area: number | null;  // 관리비부과면적 ㎡ (kaptMarea)
  mgr_type: string | null;     // 관리방식 (codeMgrNm: 위탁/자치)
  heat_type: string | null;    // 난방방식 (codeHeatNm: 지역/중앙/개별)
}

/** 단지 기본정보 — 세대수/부과면적/관리방식 (세대당 환산용) */
export async function fetchKaptBasisInfo(
  kaptCode: string,
  service_key: string,
): Promise<KaptBasisInfo | null> {
  const url = new URL(`${API_BASE.KAPT_BASIS}/getAphusBassInfoV4`);
  url.searchParams.set('kaptCode', kaptCode);
  const parsed = await fetchKaptJson<Record<string, unknown>>(url, service_key);
  if (!isNormal(parsed)) return null;
  const items = extractKaptItems<Record<string, unknown>>(parsed);
  const item = items[0];
  if (!item) return null;
  return {
    kapt_code: kaptCode,
    kapt_name: (item.kaptName as string) ?? null,
    hhld_cnt: toNumber(item.kaptdaCnt),
    billed_area: toNumber(item.kaptMarea),
    mgr_type: (item.codeMgrNm as string) ?? null,
    heat_type: (item.codeHeatNm as string) ?? null,
  };
}
