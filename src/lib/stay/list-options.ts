// 단기임대 목록(/stay)의 URL 쿼리 규약 + 필터/정렬 옵션 — 서버·클라이언트 공용 순수 모듈
//
// ⚠️ 이 파일에는 절대 'use client' 를 붙이지 마라.
//    'use client' 모듈에서 값(value) 상수를 export 하면, 서버 컴포넌트가 그것을 import 할 때
//    실제 값이 아니라 client reference 프록시를 받는다. 타입만 맞아 tsc 는 통과하지만
//    런타임에 `STAY_LIST_SORTS.map is not a function` 같은 TypeError 로 500 이 난다.
//    (실제로 StayFilterBar.tsx 에서 이 상수들을 export 하다가 /stay 가 500 으로 죽었다.)
//    따라서 서버(page.tsx)와 클라이언트(StayFilterBar.tsx)가 함께 쓰는 값은 여기에만 둔다.

import { STAY_TYPES, type StayDealType, type StayType } from '@/lib/stay/constants';

// ---------- URL 쿼리 규약 ----------
// 필터 상태를 로컬 state 가 아니라 URL 에 두어 목록 링크가 그대로 공유 가능하게 한다.

export const STAY_QUERY_KEYS = {
  deal: 'deal',
  type: 'type',
  status: 'status',
  sort: 'sort',
} as const;

// ---------- 숙소 유형 ----------

/**
 * v1 차단 유형 — 생활숙박시설은 취급하지 않는다.
 * 필터 옵션에서 빼는 것은 물론이고, 목록 결과에서도 서버 측에서 제외한다.
 */
export const STAY_BLOCKED_TYPES: readonly StayType[] = ['living_facility'];

export function isBlockedStayType(type: StayType): boolean {
  return STAY_BLOCKED_TYPES.includes(type);
}

/** 필터 UI 에 노출되는 숙소 유형 (생활숙박시설 제외) */
export const STAY_FILTER_TYPES: readonly StayType[] = STAY_TYPES.filter(
  (t) => !isBlockedStayType(t)
);

// ---------- 정렬 ----------
// 라벨은 @/lib/stay/constants 의 *_LABELS 에 대응 상수가 없으므로 여기서 정의한다.

export const STAY_LIST_SORTS = [
  { value: 'latest', label: '최신순' },
  { value: 'monthly_fee_asc', label: '월세 낮은순' },
  { value: 'monthly_fee_desc', label: '월세 높은순' },
  { value: 'views', label: '조회순' },
] as const;

export type StayListSort = (typeof STAY_LIST_SORTS)[number]['value'];

// ---------- 기본값 ----------

export const STAY_DEFAULT_DEAL_TYPE: StayDealType = 'short_term';
export const STAY_DEFAULT_SORT: StayListSort = 'latest';
