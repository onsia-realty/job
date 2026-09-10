import Link from 'next/link';
import { BadgeCheck, Building2, UserRound } from 'lucide-react';
import {
  StayExclusiveBadge,
  StayImage,
  StayStatusBadge,
} from '@/components/stay/StayPrimitives';
// ⚠️ 포맷 유틸은 반드시 '@/lib/stay/format' 에서 가져온다.
// StayPrimitives 는 'use client' 라 거기서 re-export 하면 서버에서 호출 불가(런타임 폭발).
import {
  formatArea,
  formatDepositMonthly,
  formatMinStay,
  formatWon,
} from '@/lib/stay/format';
import {
  STAY_AMENITY_LABELS,
  STAY_ROOM_STRUCTURE_LABELS,
  STAY_TYPE_LABELS,
  type StayAmenity,
} from '@/lib/stay/constants';
// 목데이터가 아니라 DB 행(stays) 타입을 받는다 — StaySample 은 Stay 의 별칭이라 목데이터도 그대로 통과한다.
import type { Stay } from '@/types/stay';

// 5단 중 마지막 줄에 노출할 어메니티 개수 (네모는 한 줄 설명만 쓴다)
const AMENITY_VISIBLE = 3;

/**
 * 주소 축약 — "경기도 화성시 동탄역로 160" → "동탄역로 160"
 * 시군구는 별도 필드(sigungu)로 앞에 붙기 때문에 도로명 뒷부분만 남긴다.
 */
function shortRoadAddress(address: string | null): string {
  if (!address) return '';
  const tokens = address.trim().split(/\s+/);
  return tokens.length <= 2 ? address : tokens.slice(-2).join(' ');
}

function amenityLabel(code: string): string {
  return STAY_AMENITY_LABELS[code as StayAmenity] ?? code;
}

/** 값이 없는 조각은 통째로 뺀다 — 허공에 뜬 "·" 방지 */
function joinDot(parts: Array<string | null | undefined>): string {
  return parts.filter((p): p is string => Boolean(p)).join(' · ');
}

/** 카드 형태 — 'row' = 지도 패널의 가로형(391×120), 'tile' = 목록 그리드의 세로형 */
export type StayCardVariant = 'row' | 'tile';

/**
 * 네모(nemoapp.kr/store) 스토어 리스트 행을 그대로 이식한 가로형 카드.
 * 391 × 120 고정 — 좌측 120×120 정사각 썸네일 + 우측 5단 텍스트.
 *
 * variant='tile' 은 /stay/list 그리드용 세로형(상단 4:3 썸네일 + 하단 텍스트)이다.
 * 텍스트 1~5단 계산은 아래에서 한 번만 하고 JSX 배치만 분기한다 — 두 벌로 갈라지면
 * 한쪽만 고쳐지는 사고가 난다.
 *
 * 지도 ↔ 목록 hover 동기화를 위해 active / onMouseEnter / onMouseLeave 를 받는다.
 * 넷 다 optional 이라 기존 호출부는 그대로 동작한다.
 */
export default function StayCard({
  stay,
  active = false,
  variant = 'row',
  onMouseEnter,
  onMouseLeave,
}: {
  stay: Stay;
  active?: boolean;
  variant?: StayCardVariant;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  // ── 1단: 매물종류 · 지역 (네모의 "업종 · 역 도보 N분" 자리) ──
  const region = [stay.sigungu, shortRoadAddress(stay.address)].filter(Boolean).join(' ');
  const tier1 = joinDot([STAY_TYPE_LABELS[stay.stay_type], region || null]);

  // ── 2단: 가격 (카드의 주인공) ──
  const price = formatDepositMonthly(stay.deposit_won, stay.monthly_fee_won);

  // ── 3단: 관리비 · 최소 계약기간 ──
  const tier3 = joinDot([
    stay.maintenance_fee_won != null ? `관리비 ${formatWon(stay.maintenance_fee_won)}` : null,
    stay.min_stay_days != null ? formatMinStay(stay.min_stay_days) : null,
  ]);

  // ── 4단: 전용면적 · 층 · 구조 ──
  const tier4 = joinDot([
    stay.exclusive_area != null ? formatArea(stay.exclusive_area) : null,
    stay.floor != null ? `${stay.floor}층` : null,
    stay.room_structure ? STAY_ROOM_STRUCTURE_LABELS[stay.room_structure] : null,
  ]);

  // ── 5단: 등록 주체 / 어메니티 (작은 컬러 아이콘 + 한 줄) ──
  const isOwner = stay.owner_type === 'owner';
  // DB 행은 amenities 가 null 로 올 수 있다(타입은 NOT NULL 이지만 방어).
  const amenities = (stay.amenities ?? []).slice(0, AMENITY_VISIBLE).map(amenityLabel);
  const tier5 = isOwner
    ? '임대인 직접등록'
    : (stay.agent_office_name ?? (amenities.length > 0 ? amenities.join(' · ') : '중개사무소'));
  const Tier5Icon = isOwner ? UserRound : stay.agent_office_name ? Building2 : BadgeCheck;

  const isTile = variant === 'tile';

  return (
    <Link
      href={`/stay/${stay.id}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={
        isTile
          ? `flex w-full flex-col overflow-hidden rounded-xl border border-gray-200 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
              active ? 'bg-blue-50 ring-2 ring-inset ring-blue-500' : 'bg-white hover:shadow-md'
            }`
          : `flex h-[120px] w-full items-stretch gap-3 overflow-hidden border-b border-gray-100 pr-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
              active
                ? 'bg-blue-50 ring-2 ring-inset ring-blue-500'
                : 'bg-white hover:bg-gray-50'
            }`
      }
    >
      {/* ── 썸네일 ── row: 120×120 정사각 / tile: 상단 4:3 전폭 (원본이 4:3 이라 크롭 없음) */}
      <div
        className={
          isTile
            ? 'relative aspect-[4/3] w-full overflow-hidden bg-slate-100'
            : 'relative h-[120px] w-[120px] flex-shrink-0 overflow-hidden rounded-lg bg-slate-100'
        }
      >
        <StayImage
          src={stay.thumbnail}
          alt={stay.title}
          sizes={isTile ? '(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw' : '120px'}
          className="h-full w-full object-cover"
        />
        {/* row 는 썸네일이 120px 뿐이라 배지를 축소해서 얹는다. tile 은 폭이 넉넉해 정상 크기. */}
        <div
          className={`pointer-events-none absolute left-2 top-2 ${
            isTile ? '' : 'left-1 top-1 origin-top-left scale-[0.75]'
          }`}
        >
          <StayStatusBadge status={stay.status} className="shadow-sm" />
        </div>
        {stay.is_exclusive && (
          <div
            className={`pointer-events-none absolute right-2 top-2 ${
              isTile ? '' : 'right-1 top-1 origin-top-right scale-[0.75]'
            }`}
          >
            <StayExclusiveBadge className="shadow-sm" />
          </div>
        )}
      </div>

      {/* ── 텍스트 5단 ── row: 우측 / tile: 하단 */}
      <div
        className={
          isTile
            ? 'flex min-w-0 flex-1 flex-col gap-[3px] px-3 py-3'
            : 'flex min-w-0 flex-1 flex-col justify-center gap-[3px] py-3'
        }
      >
        {/* 1단 */}
        {tier1 && (
          <p className="truncate text-[11px] leading-[14px] text-gray-400">{tier1}</p>
        )}

        {/* 2단 — 가격. 일/주 단가는 사업모델상 취급하지 않으므로 렌더하지 않는다. */}
        <p
          className={`truncate font-extrabold tracking-tight text-gray-900 ${
            isTile ? 'text-[17px] leading-[22px]' : 'text-[15px] leading-[20px]'
          }`}
        >
          {price}
        </p>

        {/* 3단 */}
        {tier3 && (
          <p className="truncate text-[11px] leading-[14px] text-gray-500">{tier3}</p>
        )}

        {/* 4단 */}
        {tier4 && (
          <p className="truncate text-[11px] leading-[14px] text-gray-600">{tier4}</p>
        )}

        {/* 5단 — 작은 컬러 아이콘 + 한 줄 */}
        <p
          className={`flex items-center gap-1 text-[11px] leading-[14px] ${
            isOwner ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <Tier5Icon
            className={`h-3 w-3 flex-shrink-0 ${isOwner ? 'text-blue-600' : 'text-cyan-600'}`}
          />
          <span className="truncate">{tier5}</span>
        </p>
      </div>
    </Link>
  );
}
