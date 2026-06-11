/**
 * 시세지도 필터 밴드 타입/옵션/매칭 함수 — 페이지 + 모바일 필터시트 공용.
 * (구 MarketPageClient.tsx 내부 정의에서 이동)
 */

export type PropertyTypeFilter = 'apt' | 'officetel';
export type AreaBand = 'all' | 'under60' | '60to85' | '85to110' | 'over110';
export type AgeBand = 'all' | 'new5' | 'mid10' | 'mid20' | 'old20';
export type HouseholdBand = 'all' | 'over50' | 'over300' | 'over1000';

export const AREA_OPTIONS: Array<{ value: AreaBand; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'under60', label: '~60㎡ (소형)' },
  { value: '60to85', label: '60~85㎡ (중소형)' },
  { value: '85to110', label: '85~110㎡ (중형)' },
  { value: 'over110', label: '110㎡~ (대형)' },
];
export const AGE_OPTIONS: Array<{ value: AgeBand; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'new5', label: '신축 (5년 이내)' },
  { value: 'mid10', label: '준신축 (5~10년)' },
  { value: 'mid20', label: '중고 (10~20년)' },
  { value: 'old20', label: '노후 (20년~)' },
];
export const HOUSEHOLD_OPTIONS: Array<{ value: HouseholdBand; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'over50', label: '50세대 이상' },
  { value: 'over300', label: '300세대 이상' },
  { value: 'over1000', label: '1000세대 이상' },
];

const CURRENT_YEAR = new Date().getFullYear();

export function matchAgeBand(buildYear: number | null | undefined, band: AgeBand): boolean {
  if (band === 'all') return true;
  if (buildYear == null) return false;
  const age = CURRENT_YEAR - buildYear;
  if (band === 'new5') return age <= 5;
  if (band === 'mid10') return age > 5 && age <= 10;
  if (band === 'mid20') return age > 10 && age <= 20;
  if (band === 'old20') return age > 20;
  return true;
}

export function matchAreaBand(area: number | null | undefined, band: AreaBand): boolean {
  if (band === 'all') return true;
  if (area == null) return false;
  if (band === 'under60') return area < 60;
  if (band === '60to85') return area >= 60 && area < 85;
  if (band === '85to110') return area >= 85 && area < 110;
  if (band === 'over110') return area >= 110;
  return true;
}

export function matchHouseholdBand(hhld: number | null | undefined, band: HouseholdBand): boolean {
  if (band === 'all') return true;
  if (hhld == null) return false;
  if (band === 'over50') return hhld >= 50;
  if (band === 'over300') return hhld >= 300;
  if (band === 'over1000') return hhld >= 1000;
  return true;
}

/** URL 쿼리값을 허용된 옵션으로 검증 (잘못된 값은 fallback) */
export function validBand<T extends string>(
  v: string | null,
  options: ReadonlyArray<{ value: T }>,
  fallback: T,
): T {
  return options.some((o) => o.value === v) ? (v as T) : fallback;
}
