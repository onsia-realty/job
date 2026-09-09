'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import {
  STAY_DEAL_TYPES,
  STAY_DEAL_TYPE_LABELS,
  STAY_STATUSES,
  STAY_STATUS_LABELS,
  STAY_TYPE_LABELS,
  type StayDealType,
  type StayStatus,
  type StayType,
} from '@/lib/stay/constants';
// ⚠️ 아래 값 상수들은 'use client' 인 이 파일에서 정의/재-export 하면 안 된다.
//    서버 컴포넌트(page.tsx)가 import 할 때 client reference 프록시가 되어 런타임에 깨진다.
//    서버·클라이언트가 함께 쓰는 값은 순수 모듈 @/lib/stay/list-options 에만 둔다.
import {
  STAY_DEFAULT_DEAL_TYPE,
  STAY_DEFAULT_SORT,
  STAY_FILTER_TYPES,
  STAY_LIST_SORTS,
  STAY_QUERY_KEYS,
  type StayListSort,
} from '@/lib/stay/list-options';

// ---------- 컴포넌트 ----------

interface StayFilterBarProps {
  dealType: StayDealType;
  stayTypes: StayType[];
  statuses: StayStatus[];
  sort: StayListSort;
  totalCount: number;
}

function chipClass(active: boolean): string {
  return [
    'flex-shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
    active
      ? 'border-blue-600 bg-blue-600 text-white'
      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700',
  ].join(' ');
}

export default function StayFilterBar({
  dealType,
  stayTypes,
  statuses,
  sort,
  totalCount,
}: StayFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /** 쿼리스트링을 갈아끼운다. 기본값이면 키를 지워 URL 을 짧게 유지. */
  const pushQuery = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `/stay?${qs}` : '/stay', { scroll: false });
    },
    [router, searchParams]
  );

  const setDealType = (value: StayDealType) =>
    pushQuery((params) => {
      if (value === STAY_DEFAULT_DEAL_TYPE) params.delete(STAY_QUERY_KEYS.deal);
      else params.set(STAY_QUERY_KEYS.deal, value);
    });

  const toggleMulti = (key: string, current: string[], value: string) =>
    pushQuery((params) => {
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (next.length === 0) params.delete(key);
      else params.set(key, next.join(','));
    });

  const setSort = (value: StayListSort) =>
    pushQuery((params) => {
      if (value === STAY_DEFAULT_SORT) params.delete(STAY_QUERY_KEYS.sort);
      else params.set(STAY_QUERY_KEYS.sort, value);
    });

  const resetFilters = () => router.replace('/stay', { scroll: false });

  const hasActiveFilters =
    dealType !== STAY_DEFAULT_DEAL_TYPE ||
    stayTypes.length > 0 ||
    statuses.length > 0 ||
    sort !== STAY_DEFAULT_SORT;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      {/* ── 거래유형 탭 ── */}
      <div className="flex gap-1 border-b border-gray-100 pb-px">
        {STAY_DEAL_TYPES.map((value) => {
          const active = dealType === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setDealType(value)}
              aria-pressed={active}
              className={`-mb-px border-b-2 px-3 pb-2.5 text-sm font-bold transition-colors ${
                active
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {STAY_DEAL_TYPE_LABELS[value]}
            </button>
          );
        })}
      </div>

      {/* ── 숙소유형 (다중 선택) ── */}
      <div className="mt-3.5">
        <p className="mb-1.5 text-[11px] font-semibold text-gray-400">건물유형</p>
        <div className="scrollbar-hide flex gap-1.5 overflow-x-auto pb-0.5">
          {STAY_FILTER_TYPES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleMulti(STAY_QUERY_KEYS.type, stayTypes, value)}
              aria-pressed={stayTypes.includes(value)}
              className={chipClass(stayTypes.includes(value))}
            >
              {STAY_TYPE_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      {/* ── 상태 (다중 선택) ── */}
      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-semibold text-gray-400">진행상태</p>
        <div className="scrollbar-hide flex gap-1.5 overflow-x-auto pb-0.5">
          {STAY_STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleMulti(STAY_QUERY_KEYS.status, statuses, value)}
              aria-pressed={statuses.includes(value)}
              className={chipClass(statuses.includes(value))}
            >
              {STAY_STATUS_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      {/* ── 결과 건수 + 정렬 ── */}
      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-gray-50 pt-3">
        <p className="text-xs text-gray-400">
          총 <span className="font-bold text-gray-700">{totalCount}</span>건
        </p>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-0.5 text-xs font-medium text-gray-400 hover:text-gray-700"
            >
              <X className="h-3.5 w-3.5" />
              초기화
            </button>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as StayListSort)}
            aria-label="정렬 기준"
            className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STAY_LIST_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
