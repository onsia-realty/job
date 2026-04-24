/**
 * 국토부 실거래가 API 호출 + 응답 변환
 * 아파트·오피스텔·상가·분양권 통합
 *
 * 출처: onsia-mapiapp/src/lib/api/real-transaction.ts 이식
 */
import { API_BASE, fetchMolit, parseKoreanPrice, normalizeComplexKey, isSuccessResponse, extractItems, parseXmlResponse } from './publicApi';
import type { PublicApiResponse } from './publicApi';

export type PropertyType = 'apt' | 'officetel' | 'villa' | 'store' | 'presale';
export type DealType = 'trade' | 'rent' | 'presale_resale';

export interface NormalizedTransaction {
  property_type: PropertyType;
  deal_type: DealType;
  lawd_cd: string;
  deal_ymd: string;
  deal_date: string;                   // ISO date
  complex_name: string;
  complex_key: string;
  dong: string;
  jibun: string | null;
  exclusive_area: number;
  floor: number | null;
  build_year: number | null;
  price_manwon: number | null;
  deposit_manwon: number | null;
  monthly_manwon: number | null;
  cancel_yn: boolean;
  deal_channel: string | null;
  raw: unknown;
}

// 국토부 아파트 매매 API raw item
interface AptTradeItem {
  아파트?: string;
  법정동?: string;
  지번?: string | number;
  전용면적?: number;
  층?: number;
  건축년도?: number;
  거래금액?: string | number;
  년?: number;
  월?: number;
  일?: number;
  거래유형?: string;
  해제여부?: string | boolean;
  해제사유발생일?: string;
}

interface AptRentItem extends AptTradeItem {
  보증금액?: string | number;
  월세금액?: string | number;
  계약구분?: string;
  계약기간?: string;
}

/**
 * 국토부 아파트 매매 fetch + 변환
 */
export async function fetchApartmentTrades(
  lawd_cd: string,
  deal_ymd: string,
  service_key: string
): Promise<NormalizedTransaction[]> {
  const items = await fetchMolit<AptTradeItem>({
    endpoint: API_BASE.MOLIT_APT_TRADE,
    lawd_cd,
    deal_ymd,
    service_key,
  });

  return items.map((item) => transformTrade(item, 'apt', lawd_cd, deal_ymd));
}

/**
 * 국토부 아파트 전월세 fetch + 변환
 */
export async function fetchApartmentRents(
  lawd_cd: string,
  deal_ymd: string,
  service_key: string
): Promise<NormalizedTransaction[]> {
  const items = await fetchMolit<AptRentItem>({
    endpoint: API_BASE.MOLIT_APT_RENT,
    lawd_cd,
    deal_ymd,
    service_key,
  });

  return items.map((item) => transformRent(item, 'apt', lawd_cd, deal_ymd));
}

/**
 * 오피스텔 매매 (차별화 포인트 — 호갱노노 약점)
 */
export async function fetchOfficetelTrades(
  lawd_cd: string,
  deal_ymd: string,
  service_key: string
): Promise<NormalizedTransaction[]> {
  const items = await fetchMolit<AptTradeItem>({
    endpoint: API_BASE.MOLIT_OFFI_TRADE,
    lawd_cd,
    deal_ymd,
    service_key,
  });
  return items.map((item) => transformTrade(item, 'officetel', lawd_cd, deal_ymd));
}

/**
 * 오피스텔 전월세
 */
export async function fetchOfficetelRents(
  lawd_cd: string,
  deal_ymd: string,
  service_key: string
): Promise<NormalizedTransaction[]> {
  const items = await fetchMolit<AptRentItem>({
    endpoint: API_BASE.MOLIT_OFFI_RENT,
    lawd_cd,
    deal_ymd,
    service_key,
  });
  return items.map((item) => transformRent(item, 'officetel', lawd_cd, deal_ymd));
}

/**
 * 단지별 최근 거래 조회 (여러 월 합산)
 * — cron이 아닌 on-demand 용도는 DB를 우선 조회하고 MISS만 fetch
 */
export async function fetchMultiMonth(
  type: PropertyType,
  deal: DealType,
  lawd_cd: string,
  months: string[], // ['202602', '202603', '202604']
  service_key: string
): Promise<NormalizedTransaction[]> {
  const fetchers = months.map((ym) => {
    if (type === 'apt' && deal === 'trade') return fetchApartmentTrades(lawd_cd, ym, service_key);
    if (type === 'apt' && deal === 'rent') return fetchApartmentRents(lawd_cd, ym, service_key);
    if (type === 'officetel' && deal === 'trade') return fetchOfficetelTrades(lawd_cd, ym, service_key);
    if (type === 'officetel' && deal === 'rent') return fetchOfficetelRents(lawd_cd, ym, service_key);
    return Promise.resolve([]);
  });

  const results = await Promise.allSettled(fetchers);
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}

// ==================== 내부 변환 ====================

function pickStringField(item: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = item[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return '';
}

function pickNumberField(item: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = item[k];
    if (v != null) {
      const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[,\s]/g, ''));
      if (!isNaN(n)) return n;
    }
  }
  return null;
}

function buildDealDate(item: Record<string, unknown>): string {
  const y = pickNumberField(item, '년', 'dealYear');
  const m = pickNumberField(item, '월', 'dealMonth');
  const d = pickNumberField(item, '일', 'dealDay');
  if (!y || !m || !d) return new Date().toISOString().slice(0, 10);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function transformTrade(
  item: AptTradeItem,
  property_type: PropertyType,
  lawd_cd: string,
  deal_ymd: string
): NormalizedTransaction {
  const rec = item as unknown as Record<string, unknown>;
  const complex_name = pickStringField(rec, '아파트', '오피스텔', 'complexName');
  const dong = pickStringField(rec, '법정동', 'dong');
  const jibun = pickStringField(rec, '지번', 'jibun') || null;
  const exclusive_area = pickNumberField(rec, '전용면적', 'exclusiveArea') || 0;
  const floor = pickNumberField(rec, '층', 'floor');
  const build_year = pickNumberField(rec, '건축년도', 'buildYear');
  const price_manwon = parseKoreanPrice(item.거래금액);
  const cancel_raw = item.해제여부;
  const cancel_yn = cancel_raw === 'O' || cancel_raw === true;
  const deal_channel = pickStringField(rec, '거래유형') || null;

  return {
    property_type,
    deal_type: 'trade',
    lawd_cd,
    deal_ymd,
    deal_date: buildDealDate(rec),
    complex_name,
    complex_key: normalizeComplexKey(complex_name, dong, jibun || undefined),
    dong,
    jibun,
    exclusive_area,
    floor: floor !== null ? Math.floor(floor) : null,
    build_year: build_year !== null ? Math.floor(build_year) : null,
    price_manwon,
    deposit_manwon: null,
    monthly_manwon: null,
    cancel_yn,
    deal_channel,
    raw: item,
  };
}

function transformRent(
  item: AptRentItem,
  property_type: PropertyType,
  lawd_cd: string,
  deal_ymd: string
): NormalizedTransaction {
  const rec = item as unknown as Record<string, unknown>;
  const complex_name = pickStringField(rec, '아파트', '오피스텔');
  const dong = pickStringField(rec, '법정동');
  const jibun = pickStringField(rec, '지번') || null;
  const exclusive_area = pickNumberField(rec, '전용면적') || 0;
  const floor = pickNumberField(rec, '층');
  const build_year = pickNumberField(rec, '건축년도');
  const deposit_manwon = parseKoreanPrice(item.보증금액);
  const monthly_manwon = parseKoreanPrice(item.월세금액);

  return {
    property_type,
    deal_type: 'rent',
    lawd_cd,
    deal_ymd,
    deal_date: buildDealDate(rec),
    complex_name,
    complex_key: normalizeComplexKey(complex_name, dong, jibun || undefined),
    dong,
    jibun,
    exclusive_area,
    floor: floor !== null ? Math.floor(floor) : null,
    build_year: build_year !== null ? Math.floor(build_year) : null,
    price_manwon: null,
    deposit_manwon,
    monthly_manwon: monthly_manwon || null,
    cancel_yn: false,
    deal_channel: null,
    raw: item,
  };
}

/**
 * 샘플 데이터 (API 키 없을 때 또는 개발용)
 */
export function getSampleTransactions(lawd_cd: string, deal_ymd: string): NormalizedTransaction[] {
  const baseDate = `${deal_ymd.slice(0, 4)}-${deal_ymd.slice(4, 6)}-15`;
  return [
    {
      property_type: 'apt',
      deal_type: 'trade',
      lawd_cd,
      deal_ymd,
      deal_date: baseDate,
      complex_name: '래미안원베일리',
      complex_key: normalizeComplexKey('래미안원베일리', '반포동', '1-1'),
      dong: '반포동',
      jibun: '1-1',
      exclusive_area: 84.9,
      floor: 10,
      build_year: 2023,
      price_manwon: 520000,
      deposit_manwon: null,
      monthly_manwon: null,
      cancel_yn: false,
      deal_channel: '중개거래',
      raw: { sample: true },
    },
    {
      property_type: 'apt',
      deal_type: 'trade',
      lawd_cd,
      deal_ymd,
      deal_date: baseDate,
      complex_name: '아크로리버파크',
      complex_key: normalizeComplexKey('아크로리버파크', '반포동', '2-1'),
      dong: '반포동',
      jibun: '2-1',
      exclusive_area: 112.3,
      floor: 20,
      build_year: 2016,
      price_manwon: 680000,
      deposit_manwon: null,
      monthly_manwon: null,
      cancel_yn: false,
      deal_channel: '중개거래',
      raw: { sample: true },
    },
  ];
}
