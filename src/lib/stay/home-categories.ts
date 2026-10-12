// /stay 메인의 유형 카드 4장 ↔ stay_type 매핑 — 서버·클라이언트 공용 순수 모듈
//
// ⚠️ 이 파일에는 절대 'use client' 를 붙이지 마라.
//    (list-options.ts 상단 주석과 같은 이유 — 서버 컴포넌트가 값 상수를 import 할 때
//     client reference 프록시를 받아 런타임에 폭발한다.)
//
// ── 매핑 근거 ──
// stay_type CHECK 는 6개다: officetel / apartment / living_facility / office / store / villa.
// 이 중 living_facility 는 STAY_BLOCKED_TYPES(list-options.ts:28)로 v1 에서 통째 차단이라
// 카드 대상이 아니다. 남은 5개를 4장에 빠짐없이 배분한다 → 어떤 매물도 카드로 도달 불가해지지 않는다.
//
//   officetel → 오피스텔 / apartment → 아파트 / villa → 원·투룸 / office+store → 사무실·상가
//
// '원·투룸' 을 villa 에 붙인 이유: room_structure(studio/1room/2room…)는 DB CHECK 도 없고
// /api/stays 가 필터 파라미터로 받지도 않는 자유 컬럼이라(실데이터에 null 도 있다) 카드의
// 근거로 쓸 수 없다. 나머지 3장이 전부 stay_type 축이므로 축을 섞지 않고 villa(빌라/다세대)로
// 맞춘다. 라벨만으로는 오해 소지가 있어 부제에 '빌라·다세대' 를 명시한다.

import type { StayDealType, StayType } from '@/lib/stay/constants';

export interface StayHomeCategory {
  /** URL 에 노출되는 슬러그 (?type= 값과 동일 — 복수형은 쉼표 이어붙이기) */
  slug: string;
  label: string;
  /** 33m2 의 "잠시 머물기 좋은 편리한 집" 톤 — 한 줄 */
  subtitle: string;
  /** 이 카드가 번역되는 stay_type 들 */
  types: readonly StayType[];
  /** 카드가 강제하는 거래 유형 — 사무실·상가만 공실임대 축이다 */
  deal: StayDealType;
}

export const STAY_HOME_CATEGORIES: readonly StayHomeCategory[] = [
  {
    slug: 'officetel',
    label: '오피스텔',
    subtitle: '잠시 머물기 좋은 편리한 집',
    types: ['officetel'],
    deal: 'short_term',
  },
  {
    slug: 'apartment',
    label: '아파트',
    subtitle: '가족과 함께 지낼 아늑한 집',
    types: ['apartment'],
    deal: 'short_term',
  },
  {
    slug: 'villa',
    label: '원·투룸',
    subtitle: '혼자 또는 둘이 지내기 좋은 빌라·다세대',
    types: ['villa'],
    deal: 'short_term',
  },
  {
    slug: 'office,store',
    label: '사무실·상가',
    subtitle: '비어 있는 동안 알차게 쓰는 업무·영업 공간',
    types: ['office', 'store'],
    deal: 'vacancy',
  },
];

/**
 * 카드 → 목록 링크.
 * 기존 URL 규약(STAY_QUERY_KEYS.type 은 쉼표 이어붙인 다중선택, deal 은 거래유형)을 그대로 쓴다.
 * 새 쿼리 키를 만들지 않아야 /stay/list 와 /stay/map 이 같은 URL 을 서로 넘겨받을 수 있다.
 */
export function stayCategoryHref(category: StayHomeCategory): string {
  const params = new URLSearchParams();
  params.set('type', category.types.join(','));
  // short_term 은 STAY_DEFAULT_DEAL_TYPE 이라 생략해도 되지만, 카드가 뜻하는 바를 URL 에
  // 명시해 두면 공유된 링크가 기본값 변경에 흔들리지 않는다.
  params.set('deal', category.deal);
  return `/stay/list?${params.toString()}`;
}
