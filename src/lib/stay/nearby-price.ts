// /stay 상세 "주변 시세" 비교 — 순수 로직.
//
// ⚠️ 이 파일에 'use client' 를 넣지 마라. 서버 컴포넌트/라우트에서 직접 호출한다.
//    (같은 이유는 lib/stay/format.ts 상단 주석 참고)
//
// ⚠️ 금액 단위 규약
//    - price_transactions 는 "만원 단위" (monthly_manwon INTEGER)
//    - stays 는 "원 단위" (monthly_fee_won) — 035_stays.sql:10-11
//    (보증금은 비교 대상이 아니다 — 반전세가 섞여 평균이 왜곡되므로 월차임만 쓴다)
//    이 모듈은 단위 변환을 하지 않는다. 만원→원(×10000)은 API 라우트 경계에서
//    딱 한 번만 수행한다. 여기서도, 컴포넌트에서도 다시 곱하지 마라.

import type { StayType } from '@/lib/stay/constants';

/** 이 건수 미만이면 비교 자체를 만들지 않는다 (표본이 얇으면 평균이 한두 건에 끌려간다) */
export const NEARBY_PRICE_MIN_SAMPLE = 5;

/** 실거래 조회 윈도우 (개월) */
export const NEARBY_PRICE_MONTHS = 12;

/** 전용면적 밴드 — ±30% */
export const NEARBY_PRICE_AREA_BAND = 0.3;

/**
 * 한 번에 가져올 실거래 최대 행수.
 * PostgREST 는 명시적 limit 이 없으면 1000행에서 조용히 잘린다(메모리: 서울/경기 주요 구는
 * 최근 rent 표본이 지역당 수백~1000건). 최근순 정렬 후 이 수만큼만 자른다.
 */
export const NEARBY_PRICE_MAX_ROWS = 500;

/**
 * stays.stay_type → price_transactions.property_type 매핑.
 *
 * ⚠️ 의도적으로 officetel / apartment 만 매핑한다.
 *    price_transactions.property_type 에는 'villa' | 'store' 값도 정의돼 있지만,
 *    수집 cron(`src/app/api/cron/sync-transactions`)이 apt / officetel 만 수집하므로
 *    실무상 빈 표본이다. 매핑을 넣으면 "표본 부족"으로 가는 대신 잘못된 기대를 만든다.
 *    office / living_facility 는 국토부 전월세 실거래 자체가 없다.
 */
export const STAY_TYPE_TO_TX_TYPE: Partial<Record<StayType, 'apt' | 'officetel'>> = {
  officetel: 'officetel',
  apartment: 'apt',
};

/**
 * 단순 평균.
 *
 * ⚠️ 빈 배열이면 `NaN` 을 반환한다. 0 을 쓰면 "평균 0원" 이라는 의미 있는 값과
 *    구분되지 않아 화면에 0원이 찍힌다. 호출측은 표본 수를 먼저 확인해서
 *    빈 배열을 넘기지 않아야 한다.
 *
 * 원본 배열은 변형하지 않는다.
 *
 * ⚠️ 평균은 중앙값과 달리 이상치에 취약하다. 전용면적 ±30% 밴드
 *    (NEARBY_PRICE_AREA_BAND)가 왜곡을 막는 유일한 장치이므로 절대 걷어내지 마라.
 */
export function average(values: number[]): number {
  if (values.length === 0) return NaN;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/**
 * 기준값 대비 증감률 (%), 소수 1자리 반올림.
 *
 * 부호 규약: **이 매물이 더 싸면 음수**, 더 비싸면 양수.
 * reference 가 0 이거나 유한하지 않으면 0으로 나누기를 피해 0 을 반환한다.
 */
export function diffPct(subject: number, reference: number): number {
  if (!Number.isFinite(reference) || reference === 0) return 0;
  if (!Number.isFinite(subject)) return 0;
  return Math.round(((subject - reference) / reference) * 1000) / 10;
}

/** 전용면적 ±band 밴드 (㎡) */
export function areaBand(
  area: number,
  band: number = NEARBY_PRICE_AREA_BAND
): { min: number; max: number } {
  return { min: area * (1 - band), max: area * (1 + band) };
}
