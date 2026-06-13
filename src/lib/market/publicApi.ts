/**
 * 공공데이터 API 공통 유틸 (XML 파싱, 포맷터, 응답 타입)
 * 출처: raps-clone/renderer/lib/publicApi.ts — 포팅
 */
import { XMLParser } from 'fast-xml-parser';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
});

export const API_BASE = {
  // 국토부 실거래가 — HTTPS + apis.data.go.kr (공공데이터포털 공식 엔드포인트)
  MOLIT_APT_TRADE: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev',
  MOLIT_APT_RENT: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent',
  MOLIT_OFFI_TRADE: 'https://apis.data.go.kr/1613000/RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade',
  MOLIT_OFFI_RENT: 'https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent',
  MOLIT_NRG_TRADE: 'https://apis.data.go.kr/1613000/RTMSDataSvcNrgTrade/getRTMSDataSvcNrgTrade', // 상가
  MOLIT_RH_TRADE: 'https://apis.data.go.kr/1613000/RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade', // 연립·다세대
  MOLIT_SILV_TRADE: 'https://apis.data.go.kr/1613000/RTMSDataSvcSilvTrade/getRTMSDataSvcSilvTrade', // 분양권 전매
  APPLYHOME: 'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1',
  // ⚠️ 구 BldRgstService_v2는 폐기(500 고정) — 현행은 BldRgstHubService
  BLDG_LEDGER: 'https://apis.data.go.kr/1613000/BldRgstHubService',
  // K-apt 공동주택관리정보시스템 — JSON 응답 (실거래가/건축물대장의 XML과 다름)
  KAPT_LIST: 'https://apis.data.go.kr/1613000/AptListService3',                 // 단지목록 → kaptCode 매핑
  KAPT_CMN_COST: 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2', // 공용관리비 (17 오퍼레이션)
  KAPT_IND_COST: 'https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2', // 개별사용료 (난방/전기/수도/가스 등 10 오퍼레이션)
  KAPT_BASIS: 'https://apis.data.go.kr/1613000/AptBasisInfoServiceV4',           // 단지 기본정보 (세대수/부과면적)
} as const;

export function parseXmlResponse<T = unknown>(xmlData: string): T {
  return xmlParser.parse(xmlData) as T;
}

export interface PublicApiResponse<T> {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items?: { item?: T | T[] };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// 국토부 API 응답에서 items.item을 안전하게 배열로 추출
export function extractItems<T>(parsed: PublicApiResponse<T>): T[] {
  const items = parsed?.response?.body?.items;
  if (!items) return [];
  const item = items.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

// resultCode 체크 (000이 성공) — parser 설정과 무관하게 문자열 비교
export function isSuccessResponse(parsed: PublicApiResponse<unknown>): boolean {
  const rc = parsed?.response?.header?.resultCode;
  return String(rc) === '000' || String(rc) === '00';
}

// 거래금액 문자열 → 만원 정수
export function parseKoreanPrice(raw: string | number | null | undefined): number {
  if (raw == null) return 0;
  if (typeof raw === 'number') return raw;
  return parseInt(String(raw).replace(/[,\s]/g, ''), 10) || 0;
}

// 만원 단위 → 포맷 "12억 3,456만"
export function formatPrice(manwon: number): string {
  if (!manwon || manwon <= 0) return '-';
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const rest = manwon % 10000;
    return rest === 0 ? `${eok}억` : `${eok}억 ${rest.toLocaleString()}만`;
  }
  return `${manwon.toLocaleString()}만`;
}

// 면적 포맷 (㎡ + 평 환산)
export function formatArea(sqm: number): string {
  const pyeong = (sqm / 3.3058).toFixed(1);
  return `${sqm.toFixed(2)}㎡ (${pyeong}평)`;
}

export function sqmToPyeong(sqm: number): number {
  return sqm / 3.3058;
}

// YYYYMM 포맷 (202604)
export function formatYearMonth(year: number, month: number): string {
  return `${year}${String(month).padStart(2, '0')}`;
}

// 복합 키 정규화 (단지 그룹핑용)
export function normalizeComplexKey(name: string, dong: string, jibun?: string): string {
  const s = `${name || ''}_${dong || ''}_${jibun || ''}`
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\w가-힣_]/g, '');
  return s;
}

// 최근 N개월 YYYYMM 배열
export function getLastNMonths(n: number, fromDate = new Date()): string[] {
  const result: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(fromDate.getFullYear(), fromDate.getMonth() - i, 1);
    result.push(formatYearMonth(d.getFullYear(), d.getMonth() + 1));
  }
  return result;
}

// 국토부 API 호출 (공통)
export interface MolitFetchParams {
  endpoint: string;                // API_BASE.MOLIT_APT_TRADE 등
  lawd_cd: string;                 // 5자리
  deal_ymd: string;                // YYYYMM
  num_of_rows?: number;            // default 1000
  page_no?: number;                // default 1
  service_key: string;             // decode된 키
}

export async function fetchMolit<T = unknown>(params: MolitFetchParams): Promise<T[]> {
  const { endpoint, lawd_cd, deal_ymd, num_of_rows = 1000, page_no = 1, service_key } = params;

  const url = new URL(endpoint);
  url.searchParams.set('serviceKey', service_key);
  url.searchParams.set('LAWD_CD', lawd_cd);
  url.searchParams.set('DEAL_YMD', deal_ymd);
  url.searchParams.set('numOfRows', String(num_of_rows));
  url.searchParams.set('pageNo', String(page_no));

  const res = await fetch(url.toString(), {
    // 국토부 API는 캐시를 Next fetch cache로
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`MOLIT API error: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();
  const parsed = parseXmlResponse<PublicApiResponse<T>>(xml);

  if (!isSuccessResponse(parsed)) {
    const msg = parsed?.response?.header?.resultMsg || 'Unknown error';
    throw new Error(`MOLIT API failed: ${msg}`);
  }

  return extractItems(parsed);
}
