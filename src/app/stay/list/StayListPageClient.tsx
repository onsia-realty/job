'use client';

// 단기임대 목록(/stay/list) — 33m2(/guest/room) 구조 이식.
// 좌측 고정 필터 사이드바 + 우측 카드 그리드. 지도는 없다(/stay/map 이 담당).
//
// 필터 상태의 단일 출처는 URL 이다(/stay/map 과 동일한 규약). 그래야 두 화면이
// 쿼리스트링만 넘겨주면 같은 조건을 그대로 이어받는다.
//
// ⚠️ /api/stays 는 텍스트 검색 파라미터가 없고 stay_type 도 단일값(.eq)만 받는다.
//    그래서 다중 유형 · 텍스트 검색 · living_facility 제외는 StayMapPageClient 와
//    똑같이 클라이언트에서 후처리한다. API 는 건드리지 않는다.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Map as MapIcon, RotateCcw, Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import StayCard from '@/components/stay/StayCard';
import {
  isBlockedStayType,
  STAY_DEFAULT_DEAL_TYPE,
  STAY_DEFAULT_SORT,
  STAY_FILTER_TYPES,
  STAY_LIST_SORTS,
  STAY_QUERY_KEYS,
  type StayListSort,
} from '@/lib/stay/list-options';
import {
  STAY_DEAL_TYPES,
  STAY_DEAL_TYPE_LABELS,
  STAY_LIST_MAX_LIMIT,
  STAY_STATUSES,
  STAY_STATUS_LABELS,
  STAY_TYPE_LABELS,
  type StayDealType,
  type StayStatus,
  type StayType,
} from '@/lib/stay/constants';
import type { Stay, StayListResponse } from '@/types/stay';

/** 검색어 쿼리 키 — 기존 STAY_QUERY_KEYS 규약에 없는 유일한 추가 키 */
const QUERY_KEY_Q = 'q';

const SORT_VALUES = STAY_LIST_SORTS.map((o) => o.value);

function parseMulti<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return [];
  const allowedSet = new Set<string>(allowed);
  return Array.from(
    new Set(raw.split(',').map((v) => v.trim()).filter((v) => allowedSet.has(v)))
  ) as T[];
}

export default function StayListPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── URL → 필터 상태 (URL 이 단일 출처) ──
  const dealTypeRaw = searchParams.get(STAY_QUERY_KEYS.deal);
  const dealType: StayDealType = (STAY_DEAL_TYPES as readonly string[]).includes(dealTypeRaw ?? '')
    ? (dealTypeRaw as StayDealType)
    : STAY_DEFAULT_DEAL_TYPE;

  const stayTypesKey = searchParams.get(STAY_QUERY_KEYS.type) ?? '';
  const statusesKey = searchParams.get(STAY_QUERY_KEYS.status) ?? '';
  const stayTypes = useMemo(
    () => parseMulti<StayType>(stayTypesKey || null, STAY_FILTER_TYPES),
    [stayTypesKey]
  );
  const statuses = useMemo(
    () => parseMulti<StayStatus>(statusesKey || null, STAY_STATUSES),
    [statusesKey]
  );

  const sortRaw = searchParams.get(STAY_QUERY_KEYS.sort);
  const sort: StayListSort = SORT_VALUES.includes(sortRaw as StayListSort)
    ? (sortRaw as StayListSort)
    : STAY_DEFAULT_SORT;

  const q = searchParams.get(QUERY_KEY_Q) ?? '';

  // ── URL 쓰기 ──
  const pushQuery = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
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

  const resetFilters = () =>
    pushQuery((params) => {
      params.delete(STAY_QUERY_KEYS.deal);
      params.delete(STAY_QUERY_KEYS.type);
      params.delete(STAY_QUERY_KEYS.status);
      params.delete(STAY_QUERY_KEYS.sort);
      params.delete(QUERY_KEY_Q);
    });

  const hasActiveFilters =
    dealType !== STAY_DEFAULT_DEAL_TYPE ||
    stayTypes.length > 0 ||
    statuses.length > 0 ||
    sort !== STAY_DEFAULT_SORT ||
    q.length > 0;

  // ── 검색 인풋 ──
  // 입력마다 router.replace 를 때리면 커서가 튄다. 로컬 state 로 받고 디바운스로 URL 에 반영.
  const [qDraft, setQDraft] = useState(q);
  /** 우리가 마지막으로 URL 에 밀어넣은 값 — 우리 자신의 변경으로 인풋을 되감지 않으려고 둔다. */
  const [qPushed, setQPushed] = useState(q);

  // 뒤로가기/외부 링크로 q 가 바뀌면 인풋을 맞춘다.
  // (effect 가 아니라 "렌더 중 state 조정" 패턴 — effect 안 setState 는 캐스케이드 렌더를 부른다)
  const [qSeen, setQSeen] = useState(q);
  if (q !== qSeen) {
    setQSeen(q);
    if (q !== qPushed) setQDraft(q);
  }

  useEffect(() => {
    if (qDraft.trim() === q) return;
    const t = setTimeout(() => {
      setQPushed(qDraft.trim());
      pushQuery((params) => {
        if (qDraft.trim()) params.set(QUERY_KEY_Q, qDraft.trim());
        else params.delete(QUERY_KEY_Q);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [qDraft, q, pushQuery]);

  // ── 목록 조회 ──
  const [rows, setRows] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    // 체크박스를 연속으로 누를 때 매번 때리지 않도록 디바운스 (StayMapPageClient 와 동일).
    const timer = setTimeout(() => {
      const seq = ++loadSeqRef.current;
      setLoading(true);

      const sp = new URLSearchParams();
      sp.set('deal_type', dealType);
      sp.set('sort', sort);
      sp.set('limit', String(STAY_LIST_MAX_LIMIT));
      // 진행상태는 서버가 다중으로 거른다.
      if (statuses.length > 0) sp.set('status', statuses.join(','));
      // API 는 stay_type 단일값(.eq)만 받는다 — 정확히 1개일 때만 서버로 넘긴다.
      if (stayTypes.length === 1) sp.set('stay_type', stayTypes[0]);

      fetch(`/api/stays?${sp.toString()}`, { cache: 'no-store' })
        .then((res) => {
          if (!res.ok) throw new Error('list failed');
          return res.json() as Promise<StayListResponse>;
        })
        .then((json) => {
          if (seq !== loadSeqRef.current) return; // 낡은 응답 폐기
          setRows(Array.isArray(json.items) ? json.items : []);
          setLoadFailed(false);
          setLoading(false);
        })
        .catch(() => {
          if (seq !== loadSeqRef.current) return;
          setRows([]);
          setLoadFailed(true);
          setLoading(false);
        });
    }, 150);

    return () => clearTimeout(timer);
  }, [dealType, sort, statuses, stayTypes]);

  // ── 클라이언트 후처리 (StayMapPageClient 와 동일) ──
  // v1 은 생활숙박시설을 취급하지 않는다 — 유형 미선택 상태에서도 항상 제외.
  // 유형 다중선택과 텍스트 검색도 API 가 지원하지 않으므로 여기서 좁힌다.
  const stays = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((stay) => {
      if (isBlockedStayType(stay.stay_type)) return false;
      if (stayTypes.length > 0 && !stayTypes.includes(stay.stay_type)) return false;
      if (needle) {
        const hay = `${stay.title} ${stay.address ?? ''} ${stay.sigungu ?? ''} ${stay.building_name ?? ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, stayTypes, q]);

  // 현재 필터를 그대로 지도로 넘긴다 (같은 쿼리 규약이라 변환이 필요 없다).
  const mapHref = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `/stay/map?${qs}` : '/stay/map';
  }, [searchParams]);

  // ── 좌측 사이드바 ──
  // ⚠️ /api/stays 가 실제로 지원하는 축만 노출한다. 방개수·평수·층수 같은 필터는 만들지 않는다.
  const [filterOpen, setFilterOpen] = useState(false);

  const sidebar = (
    <div className="space-y-6">
      <FilterGroup label="거래유형">
        <div className="space-y-1">
          {STAY_DEAL_TYPES.map((value) => (
            <FilterRow
              key={value}
              label={STAY_DEAL_TYPE_LABELS[value]}
              checked={dealType === value}
              type="radio"
              onChange={() => setDealType(value)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="건물유형">
        <div className="space-y-1">
          {STAY_FILTER_TYPES.map((value) => (
            <FilterRow
              key={value}
              label={STAY_TYPE_LABELS[value]}
              checked={stayTypes.includes(value)}
              type="checkbox"
              onChange={() => toggleMulti(STAY_QUERY_KEYS.type, stayTypes, value)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="진행상태">
        <div className="space-y-1">
          {STAY_STATUSES.map((value) => (
            <FilterRow
              key={value}
              label={STAY_STATUS_LABELS[value]}
              checked={statuses.includes(value)}
              type="checkbox"
              onChange={() => toggleMulti(STAY_QUERY_KEYS.status, statuses, value)}
            />
          ))}
        </div>
      </FilterGroup>

      <button
        type="button"
        onClick={resetFilters}
        disabled={!hasActiveFilters}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:cursor-default disabled:opacity-40"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        초기화
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
      {/* ── 상단: 검색 + 정렬 + 지도로 보기 ── */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="지역·건물명으로 검색"
            aria-label="매물 검색"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {qDraft && (
            <button
              type="button"
              onClick={() => setQDraft('')}
              aria-label="검색어 지우기"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            aria-expanded={filterOpen}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 lg:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            필터
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as StayListSort)}
            aria-label="정렬 기준"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STAY_LIST_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Link
            href={mapHref}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-3.5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            <MapIcon className="h-3.5 w-3.5" />
            지도로 보기
          </Link>
        </div>
      </div>

      <div className="flex gap-6">
        {/* ── 좌측 사이드바 (데스크톱 고정폭) ── */}
        <aside className="hidden w-[240px] flex-shrink-0 lg:block">
          <div className="sticky top-4 rounded-xl border border-gray-200 bg-white p-4">{sidebar}</div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* 모바일 접이식 필터 */}
          {filterOpen && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 lg:hidden">{sidebar}</div>
          )}

          <p className="mb-3 text-xs text-gray-500">
            총 <span className="font-bold tabular-nums text-gray-900">{loading ? '…' : stays.length}</span>건
          </p>

          {loadFailed ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-20 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                <AlertTriangle className="h-7 w-7 text-amber-400" />
              </div>
              <h2 className="mb-1.5 text-sm font-bold text-gray-700">매물을 불러오지 못했습니다</h2>
              <p className="text-xs text-gray-400">일시적인 오류일 수 있습니다. 잠시 후 다시 시도해주세요.</p>
            </div>
          ) : loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="aspect-[4/3] w-full animate-pulse bg-gray-100" />
                  <div className="space-y-2 p-3">
                    <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : stays.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {stays.map((stay) => (
                <StayCard key={stay.id} stay={stay} variant="tile" />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-20 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                <SearchX className="h-7 w-7 text-blue-300" />
              </div>
              <h2 className="mb-1.5 text-sm font-bold text-gray-700">조건에 맞는 매물이 없습니다</h2>
              <p className="mb-4 text-xs text-gray-400">검색어를 바꾸거나 필터를 줄여보세요.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                초기화
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- 사이드바 조각 ----------

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-gray-900">{label}</p>
      {children}
    </div>
  );
}

function FilterRow({
  label,
  checked,
  type,
  onChange,
}: {
  label: string;
  checked: boolean;
  type: 'radio' | 'checkbox';
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-xs text-gray-600 hover:text-gray-900">
      <input
        type={type}
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 flex-shrink-0 accent-blue-600"
      />
      <span className={checked ? 'font-semibold text-blue-600' : ''}>{label}</span>
    </label>
  );
}
