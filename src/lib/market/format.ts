/**
 * 시세 가격 표기 유틸 — 만원 단위 숫자를 한국식 가격 문자열로.
 * 시세지도 전역(마커/패널/차트/랭킹)에서 이 모듈만 사용한다.
 */

export type PriceStyle = 'full' | 'compact';

/**
 * 만원 → 한국식 가격 문자열.
 * - full   (패널/리스트용): 525000 → "52억 5,000" / 90000 → "9억" / 8500 → "8,500만"
 * - compact(마커/칩용)    : 525000 → "52.5억"     / 90000 → "9억" / 8500 → "8,500만"
 *   100억 이상은 소수점 절사: 1565000 → "156억"
 */
export function formatKoreanPrice(
  manwon: number | null | undefined,
  style: PriceStyle = 'full',
): string {
  if (manwon == null || !Number.isFinite(manwon)) return '-';
  if (manwon === 0) return '0';
  const sign = manwon < 0 ? '-' : '';
  const abs = Math.abs(Math.round(manwon));

  if (abs < 10000) {
    return `${sign}${abs.toLocaleString()}만`;
  }

  const eok = Math.floor(abs / 10000);
  const rest = abs % 10000;

  if (style === 'full') {
    return rest > 0 ? `${sign}${eok}억 ${rest.toLocaleString()}` : `${sign}${eok}억`;
  }

  // compact
  if (rest === 0) return `${sign}${eok}억`;
  if (eok >= 100) return `${sign}${eok}억`; // 100억+ 는 소수점 생략 (절사)
  const decimal = abs / 10000;
  const fixed = decimal.toFixed(1);
  return fixed.endsWith('.0') ? `${sign}${eok}억` : `${sign}${fixed}억`;
}

/**
 * 차트 Y축 눈금용 짧은 표기: 520000 → "52억", 5000 → "5천", 500 → "500만", 0 → "0"
 */
export function formatEokUnit(manwon: number | null | undefined): string {
  if (manwon == null || !Number.isFinite(manwon)) return '-';
  if (manwon === 0) return '0';
  const sign = manwon < 0 ? '-' : '';
  const abs = Math.abs(Math.round(manwon));
  if (abs >= 10000) return `${sign}${Math.round(abs / 10000)}억`;
  if (abs >= 1000) return `${sign}${Math.round(abs / 1000)}천`;
  return `${sign}${abs}만`;
}
