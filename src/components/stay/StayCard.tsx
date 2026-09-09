import Link from 'next/link';
import { MapPin, UserRound } from 'lucide-react';
import {
  StayExclusiveBadge,
  StayImage,
  StayStatusBadge,
} from '@/components/stay/StayPrimitives';
import { formatArea, formatDepositMonthly, formatMinStay } from '@/lib/stay/format';
import {
  STAY_AMENITY_LABELS,
  STAY_ROOM_STRUCTURE_LABELS,
  STAY_TYPE_LABELS,
  type StayAmenity,
} from '@/lib/stay/constants';
// 목데이터가 아니라 DB 행(stays) 타입을 받는다 — StaySample 은 Stay 의 별칭이라 목데이터도 그대로 통과한다.
import type { Stay } from '@/types/stay';

// 카드에 노출할 어메니티 개수. 초과분은 "+N" 으로 접는다.
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

export default function StayCard({ stay }: { stay: Stay }) {
  // DB 행은 amenities 가 null 로 올 수 있다(타입은 NOT NULL 이지만 방어).
  const amenities = stay.amenities ?? [];
  const visibleAmenities = amenities.slice(0, AMENITY_VISIBLE);
  const hiddenAmenityCount = amenities.length - visibleAmenities.length;

  // 메타 줄 — 값이 없는 항목은 통째로 뺀다(빈 "·" 방지)
  const meta: string[] = [STAY_TYPE_LABELS[stay.stay_type]];
  if (stay.exclusive_area != null) meta.push(formatArea(stay.exclusive_area));
  if (stay.floor != null) meta.push(`${stay.floor}층`);
  if (stay.room_structure) meta.push(STAY_ROOM_STRUCTURE_LABELS[stay.room_structure]);
  meta.push(formatMinStay(stay.min_stay_days));

  const region = [stay.sigungu, shortRoadAddress(stay.address)].filter(Boolean).join(' ');

  return (
    <Link
      href={`/stay/${stay.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {/* ── 썸네일 (4:3) ── */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <StayImage
          src={stay.thumbnail}
          alt={stay.title}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <StayStatusBadge status={stay.status} className="absolute left-2.5 top-2.5 shadow-sm" />
        {stay.is_exclusive && (
          <StayExclusiveBadge className="absolute right-2.5 top-2.5 shadow-sm" />
        )}
      </div>

      {/* ── 본문 ── */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-gray-900">
          {stay.title}
        </h3>

        {region && (
          <p className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{region}</span>
          </p>
        )}

        {/* 가격 — 카드의 주인공. 일/주 단가는 사업모델상 취급하지 않으므로 렌더하지 않는다. */}
        <p className="text-lg font-extrabold tracking-tight text-gray-900">
          {formatDepositMonthly(stay.deposit_won, stay.monthly_fee_won)}
        </p>

        <p className="text-xs leading-relaxed text-gray-500">{meta.join(' · ')}</p>

        {visibleAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleAmenities.map((code) => (
              <span
                key={code}
                className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500"
              >
                {amenityLabel(code)}
              </span>
            ))}
            {hiddenAmenityCount > 0 && (
              <span className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-400">
                +{hiddenAmenityCount}
              </span>
            )}
          </div>
        )}

        {/* ── 등록 주체 ── */}
        <div className="mt-auto border-t border-gray-50 pt-2.5">
          {stay.owner_type === 'owner' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              <UserRound className="h-3 w-3" />
              임대인 직접등록
            </span>
          ) : (
            <p className="truncate text-[11px] font-medium text-gray-400">
              {stay.agent_office_name ?? '중개사무소'}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
