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
  page_no?: number;                // default 1; explicit start page fetches the remaining suffix
  service_key: string;             // decode된 키
}

export async function fetchMolit<T = unknown>(params: MolitFetchParams): Promise<T[]> {
  const { endpoint, lawd_cd, deal_ymd, num_of_rows = 1000, page_no = 1, service_key } = params;
  if (!Number.isSafeInteger(num_of_rows) || num_of_rows < 1 || num_of_rows > 1000 ||
      !Number.isSafeInteger(page_no) || page_no < 1 || page_no > 20) {
    throw new Error('MOLIT API invalid pagination parameters');
  }
  // Never propagate provider messages, fetch errors or URL constructor errors: they may contain keys.
  let url: URL;
  try { url = new URL(endpoint); } catch { throw new Error('MOLIT API invalid endpoint'); }
  url.searchParams.set('serviceKey', service_key);
  url.searchParams.set('LAWD_CD', lawd_cd);
  url.searchParams.set('DEAL_YMD', deal_ymd);
  url.searchParams.set('numOfRows', String(num_of_rows));
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error('MOLIT API timeout'));
    }, 30_000);
  });
  const collect = async (): Promise<T[]> => {
    const rows: T[] = [];
    const seenPages = new Set<string>();
    let total: number | undefined;
    for (let page = page_no; page <= 20; page++) {
      if (controller.signal.aborted) throw new Error('MOLIT API timeout');
      url.searchParams.set('pageNo', String(page));
      const res = await fetch(url.toString(), {
        next: { revalidate: 3600 }, signal: controller.signal,
      });
      if (!res.ok) throw new Error('MOLIT API HTTP failure');
      const parsed = parseXmlResponse<PublicApiResponse<T>>(await res.text());
      if (controller.signal.aborted) throw new Error('MOLIT API timeout');
      if (!isSuccessResponse(parsed)) throw new Error('MOLIT API provider failure');
      const body = parsed?.response?.body;
      const count = molitCount(body?.totalCount);
      if (molitCount(body?.pageNo) !== page || molitCount(body?.numOfRows) !== num_of_rows) {
        throw new Error('MOLIT API inconsistent pagination');
      }
      if (count > 20_000 || Math.ceil(count / num_of_rows) > 20) {
        throw new Error('MOLIT API pagination budget exceeded');
      }
      if (total !== undefined && total !== count) throw new Error('MOLIT API totalCount changed');
      total = count;
      const items = extractItems(parsed);
      const expected = Math.min(num_of_rows, Math.max(0, count - (page - 1) * num_of_rows));
      if (items.length !== expected || items.some(item => !item || typeof item !== 'object')) {
        throw new Error('MOLIT API incomplete page');
      }
      // Sorting also catches a provider repeating a page in a different row order.
      const fingerprint = JSON.stringify(items.map(item => JSON.stringify(item)).sort());
      if (items.length && seenPages.has(fingerprint)) throw new Error('MOLIT API repeated page');
      seenPages.add(fingerprint);
      rows.push(...items);
      if (page * num_of_rows >= count) return rows;
    }
    throw new Error('MOLIT API pagination budget exceeded');
  };
  try {
    return await Promise.race([collect(), timeout]);
  } catch {
    // Fixed text only, including parser/network failures (no cause containing a request URL).
    throw new Error(controller.signal.aborted ? 'MOLIT API timeout' : 'MOLIT API incomplete response');
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

function molitCount(value: unknown): number {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value))) {
    throw new Error('MOLIT API invalid count');
  }
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('MOLIT API invalid count');
  return count;
}
