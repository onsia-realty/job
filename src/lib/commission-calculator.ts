// ============================================================
// 부동산 중개보수 계산기
// 서울특별시 기준 (서울특별시 조례 + 공인중개사법 시행규칙)
// 출처: land.seoul.go.kr/land/broker/brokerageCommission.do
// ============================================================

export type TransactionType = 'sale' | 'jeonse' | 'monthly';
export type PropertyType = 'residential' | 'commercial' | 'officetel' | 'land';

interface CommissionRate {
  maxRate: number; // 상한 요율 (%)
  maxAmount?: number; // 한도액 (만원), undefined = 제한없음
  label: string;
}

interface CommissionResult {
  transactionType: TransactionType;
  propertyType: PropertyType;
  transactionAmount: number; // 만원 단위 (월세의 경우 환산보증금)
  rate: number; // 적용 요율 (%)
  maxCommission: number; // 최대 중개보수 (원)
  vat: number; // 부가세 (원)
  total: number; // 합계 (원)
  rateLabel: string;
  bracket: string; // 해당 구간 설명
}

// ============================================================
// 주택 매매·교환 요율표 (서울특별시, 6구간)
// ============================================================
const RESIDENTIAL_SALE_RATES: { min: number; max: number; rate: CommissionRate }[] = [
  { min: 0, max: 5000, rate: { maxRate: 0.6, maxAmount: 25, label: '5천만원 미만' } },
  { min: 5000, max: 20000, rate: { maxRate: 0.5, maxAmount: 80, label: '5천만원 이상 ~ 2억원 미만' } },
  { min: 20000, max: 90000, rate: { maxRate: 0.4, label: '2억원 이상 ~ 9억원 미만' } },
  { min: 90000, max: 120000, rate: { maxRate: 0.5, label: '9억원 이상 ~ 12억원 미만' } },
  { min: 120000, max: 150000, rate: { maxRate: 0.6, label: '12억원 이상 ~ 15억원 미만' } },
  { min: 150000, max: Infinity, rate: { maxRate: 0.7, label: '15억원 이상' } },
];

// ============================================================
// 주택 임대차 요율표 (전세·월세, 서울특별시, 6구간)
// ============================================================
const RESIDENTIAL_LEASE_RATES: { min: number; max: number; rate: CommissionRate }[] = [
  { min: 0, max: 5000, rate: { maxRate: 0.5, maxAmount: 20, label: '5천만원 미만' } },
  { min: 5000, max: 10000, rate: { maxRate: 0.4, maxAmount: 30, label: '5천만원 이상 ~ 1억원 미만' } },
  { min: 10000, max: 60000, rate: { maxRate: 0.3, label: '1억원 이상 ~ 6억원 미만' } },
  { min: 60000, max: 120000, rate: { maxRate: 0.4, label: '6억원 이상 ~ 12억원 미만' } },
  { min: 120000, max: 150000, rate: { maxRate: 0.5, label: '12억원 이상 ~ 15억원 미만' } },
  { min: 150000, max: Infinity, rate: { maxRate: 0.6, label: '15억원 이상' } },
];

// ============================================================
// 오피스텔 요율표
// 전용면적 85㎡ 이하 + 상·하수도, 전기, 가스 시설 구비
// ============================================================
const OFFICETEL_SALE_RATES: { min: number; max: number; rate: CommissionRate }[] = [
  { min: 0, max: Infinity, rate: { maxRate: 0.5, label: '오피스텔 매매·교환 (전용 85㎡ 이하)' } },
];

const OFFICETEL_LEASE_RATES: { min: number; max: number; rate: CommissionRate }[] = [
  { min: 0, max: Infinity, rate: { maxRate: 0.4, label: '오피스텔 임대차 (전용 85㎡ 이하)' } },
];

// ============================================================
// 주택·오피스텔 외 (토지, 상가, 사무실 등)
// 0.9% 이내에서 중개의뢰인과 개업공인중개사가 협의
// ============================================================
const NON_RESIDENTIAL_RATES: { min: number; max: number; rate: CommissionRate }[] = [
  { min: 0, max: Infinity, rate: { maxRate: 0.9, label: '주택 외 (상가, 사무실, 토지 등) — 0.9% 이내 협의' } },
];

// ============================================================
// 요율표 선택 로직
// ============================================================
function getRateTable(propertyType: PropertyType, transactionType: TransactionType) {
  if (propertyType === 'officetel') {
    return transactionType === 'sale' ? OFFICETEL_SALE_RATES : OFFICETEL_LEASE_RATES;
  }
  if (propertyType === 'commercial' || propertyType === 'land') {
    return NON_RESIDENTIAL_RATES;
  }
  // 주택
  return transactionType === 'sale' ? RESIDENTIAL_SALE_RATES : RESIDENTIAL_LEASE_RATES;
}

// ============================================================
// 월세 → 환산보증금 계산
// 원칙: 보증금 + (월차임 × 100)
// 예외: 위 합산액이 5천만원 미만이면 보증금 + (월차임 × 70)
// ============================================================
export function convertMonthlyToAmount(deposit: number, monthlyRent: number): number {
  const converted = deposit + monthlyRent * 100;
  if (converted < 5000) {
    return deposit + monthlyRent * 70;
  }
  return converted;
}

// ============================================================
// 중개보수 계산
// ============================================================
export function calculateCommission(
  transactionType: TransactionType,
  propertyType: PropertyType,
  amountInManwon: number, // 만원 단위
  deposit?: number, // 월세일 때 보증금 (만원)
  monthlyRent?: number, // 월세일 때 월세 (만원)
): CommissionResult {
  let effectiveAmount = amountInManwon;

  // 월세인 경우 환산보증금으로 계산
  if (transactionType === 'monthly' && deposit !== undefined && monthlyRent !== undefined) {
    effectiveAmount = convertMonthlyToAmount(deposit, monthlyRent);
  }

  // 월세의 경우 임대차 요율표 적용
  const lookupType = transactionType === 'monthly' ? 'jeonse' : transactionType;
  const rateTable = getRateTable(propertyType, lookupType as 'sale' | 'jeonse');

  const bracket = rateTable.find(
    (b) => effectiveAmount >= b.min && effectiveAmount < b.max
  ) || rateTable[rateTable.length - 1];

  const rate = bracket.rate.maxRate;
  let maxCommission = Math.floor(effectiveAmount * 10000 * (rate / 100));

  // 한도액 적용 (있는 경우)
  if (bracket.rate.maxAmount) {
    const limit = bracket.rate.maxAmount * 10000;
    maxCommission = Math.min(maxCommission, limit);
  }

  const vat = Math.floor(maxCommission * 0.1);

  return {
    transactionType,
    propertyType,
    transactionAmount: effectiveAmount,
    rate,
    maxCommission,
    vat,
    total: maxCommission + vat,
    rateLabel: `${rate}%`,
    bracket: bracket.rate.label,
  };
}

// ============================================================
// 라벨
// ============================================================
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  sale: '매매·교환',
  jeonse: '전세',
  monthly: '월세',
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  residential: '주택 (아파트, 빌라, 주택분양권 등)',
  officetel: '오피스텔 (전용 85㎡ 이하)',
  commercial: '상업용 (상가, 사무실)',
  land: '토지',
};

// ============================================================
// 금액 포맷팅
// ============================================================
export function formatKRW(amount: number): string {
  if (amount >= 100000000) {
    const eok = Math.floor(amount / 100000000);
    const remainder = amount % 100000000;
    if (remainder === 0) return `${eok}억원`;
    const man = Math.floor(remainder / 10000);
    return `${eok}억 ${man.toLocaleString()}만원`;
  }
  if (amount >= 10000) {
    return `${Math.floor(amount / 10000).toLocaleString()}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

export function formatManwon(manwon: number): string {
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const remainder = manwon % 10000;
    if (remainder === 0) return `${eok}억`;
    return `${eok}억 ${remainder.toLocaleString()}만`;
  }
  return `${manwon.toLocaleString()}만`;
}

// ============================================================
// 전체 요율표 데이터 (UI 참조용)
// ============================================================
export const RATE_TABLE_DATA = {
  residential_sale: RESIDENTIAL_SALE_RATES,
  residential_lease: RESIDENTIAL_LEASE_RATES,
  officetel_sale: OFFICETEL_SALE_RATES,
  officetel_lease: OFFICETEL_LEASE_RATES,
  non_residential: NON_RESIDENTIAL_RATES,
};
