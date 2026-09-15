'use client';

// 단기임대(/stay) 필터 바 — 네모(nemoapp.kr/store) 구조 이식.
//
// 네모 계측: 헤더에 "굵은 메인라벨 + 작은 서브라벨" 2줄짜리 카테고리 탭, 그 아래 별도 줄에
// 좌측 검색 인풋(패널 폭) + 우측 필터 칩들(업종·가격·… + 새로고침) 이 붙는다.
// 그대로 옮기되, 칩의 동작(다중선택·URL 동기화)은 기존 /stay 필터 동작을 그대로 유지한다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
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
//    서버 컴포넌트가 import 할 때 client reference 프록시가 되어 런타임에 깨진다.
//    서버·클라이언트가 함께 쓰는 값은 순수 모듈 @/lib/stay/list-options 에만 둔다.
import {
  STAY_DEFAULT_DEAL_TYPE,
  STAY_DEFAULT_SORT,
  STAY_FILTER_TYPES,
  STAY_LIST_SORTS,
  STAY_QUERY_KEYS,
  type StayListSort,
} from '@/lib/stay/list-options';

// 네모 탭의 작은 서브라벨 — 메인라벨만으로는 두 상품의 차이가 안 보인다.
const DEAL_SUB_LABELS: Record<StayDealType, string> = {
  short_term: '1~12개월 단기 계약',
  vacancy: '비어 있는 집·상가',
};

interface StayFilterBarProps {
  dealType: StayDealType;
  stayTypes: StayType[];
  statuses: StayStatus[];
  sort: StayListSort;
  totalCount: number;
  /** 네모의 좌측 검색 인풋 자리 — 부모(StayMapPageClient)가 주입한다 */
  searchSlot?: React.ReactNode;
}

export default function StayFilterBar({
  dealType,
  stayTypes,
  statuses,
  sort,
  totalCount,
  searchSlot,
}: StayFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // ⚠️ 경로를 하드코딩하면 안 된다. 이 필터바는 /stay/map 과 /stay/list 양쪽에서 쓰이는데
  //    '/stay' 로 고정해 두면 필터를 만질 때마다 메인 화면으로 튕긴다.
  const pathname = usePathname();

  /** 쿼리스트링을 갈아끼운다. 기본값이면 키를 지워 URL 을 짧게 유지. */
  const pushQuery = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, searchParams, pathname]
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

  // 초기화는 필터 키만 지운다. lat/lng/zoom 까지 날리면 보고 있던 지도 위치가 튄다.
  const resetFilters = () =>
    pushQuery((params) => {
      params.delete(STAY_QUERY_KEYS.deal);
      params.delete(STAY_QUERY_KEYS.type);
      params.delete(STAY_QUERY_KEYS.status);
      params.delete(STAY_QUERY_KEYS.sort);
    });

  const hasActiveFilters =
    dealType !== STAY_DEFAULT_DEAL_TYPE ||
    stayTypes.length > 0 ||
    statuses.length > 0 ||
    sort !== STAY_DEFAULT_SORT;

  return (
    <div className="flex-shrink-0 border-b border-gray-200 bg-white">
      {/* ── 네모식 카테고리 탭 (굵은 메인라벨 + 작은 서브라벨) ── */}
      <div className="flex items-stretch gap-1 px-3 pt-1">
        {STAY_DEAL_TYPES.map((value) => {
          const active = dealType === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setDealType(value)}
              aria-pressed={active}
              className={`-mb-px min-w-[124px] border-b-2 px-3 pb-2 pt-1.5 text-left transition-colors ${
                active ? 'border-cyan-600' : 'border-transparent hover:bg-gray-50'
              }`}
            >
              <span
                className={`block text-sm font-extrabold leading-tight ${
                  active ? 'text-cyan-700' : 'text-gray-500'
                }`}
              >
                {STAY_DEAL_TYPE_LABELS[value]}
              </span>
              <span
                className={`mt-0.5 block text-[10px] leading-tight ${
                  active ? 'text-blue-500/80' : 'text-gray-400'
                }`}
              >
                {DEAL_SUB_LABELS[value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 검색/필터 줄 (좌: 검색 인풋 · 우: 필터 칩 + 새로고침) ── */}
      <div className="flex flex-col gap-2 border-t border-gray-100 px-3 py-2 md:flex-row md:items-center md:gap-3">
        {searchSlot}

        <div className="scrollbar-hide flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
          <MultiSelectChip
            label="건물유형"
            options={STAY_FILTER_TYPES.map((v) => ({ value: v, label: STAY_TYPE_LABELS[v] }))}
            selected={stayTypes}
            onToggle={(v) => toggleMulti(STAY_QUERY_KEYS.type, stayTypes, v)}
          />
          <MultiSelectChip
            label="진행상태"
            options={STAY_STATUSES.map((v) => ({ value: v, label: STAY_STATUS_LABELS[v] }))}
            selected={statuses}
            onToggle={(v) => toggleMulti(STAY_QUERY_KEYS.status, statuses, v)}
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as StayListSort)}
            aria-label="정렬 기준"
            className="flex-shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {STAY_LIST_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex flex-shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              초기화
            </button>
          )}

          <p className="ml-auto hidden flex-shrink-0 pl-2 text-xs text-gray-400 md:block">
            총 <span className="font-bold tabular-nums text-gray-700">{totalCount}</span>건
          </p>

        </div>
      </div>
    </div>
  );
}

// ---------- 다중선택 드롭다운 칩 ----------
// 네모의 "업종 ▾ / 가격 ▾" 팝오버 칩과 같은 형태. 기존 /stay 의 다중선택 동작을 그대로 담는다.

function MultiSelectChip<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  selected: T[];
  onToggle: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = selected.length > 0;
  const wrapRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기 — 칩이 가로 스크롤 안에 있어 오버레이 div 로는 스크롤이 막힌다.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const summary = active
    ? `${options.find((o) => o.value === selected[0])?.label ?? selected[0]}${
        selected.length > 1 ? ` +${selected.length - 1}` : ''
      }`
    : null;

  return (
    <div ref={wrapRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
          active
            ? 'border-cyan-600 bg-slate-900 text-white'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }`}
      >
        <span>{label}</span>
        {summary && <span className="font-medium opacity-90">· {summary}</span>}
        <span className="ml-0.5 text-[8px]">▼</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 min-w-[176px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl">
          {options.map((opt) => {
            const isOn = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onToggle(opt.value)}
                aria-pressed={isOn}
                className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-xs transition-colors hover:bg-gray-50 ${
                  isOn ? 'font-bold text-cyan-700' : 'text-gray-600'
                }`}
              >
                <span>{opt.label}</span>
                {isOn && <span>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
