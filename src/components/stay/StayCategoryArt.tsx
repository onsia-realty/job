// /stay 메인 유형 카드의 라인아트 일러스트 — 33m2 톤(외곽선만, 채움 없음).
//
// ⚠️ 외부 이미지 파일이나 생성형 API 를 쓰지 않는다. 전부 손으로 그린 인라인 SVG 다.
//    stroke 를 currentColor 로 두어 카드 쪽 CSS(text-*)로 색을 제어한다 —
//    호버 시 slate → blue 로 물드는 인터랙션이 클래스 한 줄로 끝난다.
//
// 슬러그는 home-categories.ts 의 STAY_HOME_CATEGORIES[].slug 와 1:1 이다.
// (매핑·링크는 그 파일이 단독 소유한다. 여기는 시각 표현만 담당한다.)

import type { ReactElement, SVGProps } from 'react';

type ArtProps = SVGProps<SVGSVGElement>;

/** 4종 공통 프레임 — viewBox 110×92, stroke only, 얇은 선. */
function ArtFrame({ children, ...props }: ArtProps) {
  return (
    <svg
      viewBox="0 0 110 92"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** 오피스텔 — 높고 얇은 고층 건물 + 창문 격자 */
function OfficetelArt(props: ArtProps) {
  return (
    <ArtFrame {...props}>
      {/* 옥탑 */}
      <path d="M42 16V8h22v8" />
      {/* 본체 */}
      <rect x="32" y="16" width="42" height="70" />
      {/* 창문 격자 3열 × 3행 */}
      {[24, 38, 52].map((y) =>
        [37, 49, 61].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" />),
      )}
      {/* 출입구 */}
      <path d="M46 86V68h14v18" />
    </ArtFrame>
  );
}

/** 아파트 — 나란한 건물 3동 */
function ApartmentArt(props: ArtProps) {
  return (
    <ArtFrame {...props}>
      {/* 좌측 저층동 */}
      <rect x="10" y="38" width="28" height="48" />
      {[46, 60].map((y) =>
        [15, 27].map((x) => <rect key={`l${x}-${y}`} x={x} y={y} width="7" height="7" />),
      )}
      {/* 중앙 고층동 */}
      <rect x="40" y="18" width="30" height="68" />
      {[26, 40, 54, 68].map((y) =>
        [45, 58].map((x) => <rect key={`c${x}-${y}`} x={x} y={y} width="7" height="7" />),
      )}
      {/* 우측 중층동 */}
      <rect x="72" y="30" width="26" height="56" />
      {[38, 52, 66].map((y) => (
        <rect key={`r${y}`} x="80" y={y} width="10" height="7" />
      ))}
    </ArtFrame>
  );
}

/** 원·투룸 — 박공지붕 단독 주택 1채 */
function RoomArt(props: ArtProps) {
  return (
    <ArtFrame {...props}>
      {/* 지붕 */}
      <path d="M18 48 55 20l37 28" />
      {/* 본체 */}
      <path d="M27 44v42h56V44" />
      {/* 창문 */}
      <rect x="37" y="56" width="16" height="14" />
      {/* 현관 */}
      <path d="M62 86V60h13v26" />
      {/* 굴뚝 */}
      <path d="M76 33V26h7v12" />
    </ArtFrame>
  );
}

/** 사무실·상가 — 차양과 간판이 있는 점포 전면 */
function StoreArt(props: ArtProps) {
  return (
    <ArtFrame {...props}>
      {/* 건물 외곽 */}
      <rect x="14" y="14" width="82" height="72" />
      {/* 간판 */}
      <rect x="26" y="22" width="58" height="14" />
      {/* 차양 (사다리꼴) */}
      <path d="M14 44h82l-8 13H22z" />
      {/* 쇼윈도 */}
      <rect x="24" y="62" width="32" height="24" />
      <path d="M40 62v24" />
      {/* 출입문 */}
      <path d="M66 86V62h20v24" />
      <path d="M76 62v24" />
    </ArtFrame>
  );
}

const ART_BY_SLUG: Record<string, (props: ArtProps) => ReactElement> = {
  officetel: OfficetelArt,
  apartment: ApartmentArt,
  villa: RoomArt,
  'office,store': StoreArt,
};

/**
 * 카테고리 슬러그에 맞는 라인아트를 그린다.
 * 알 수 없는 슬러그면 아무것도 그리지 않는다(카드 텍스트는 그대로 산다).
 */
export default function StayCategoryArt({ slug, ...props }: ArtProps & { slug: string }) {
  const Art = ART_BY_SLUG[slug];
  if (!Art) return null;
  return <Art {...props} />;
}
