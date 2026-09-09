import { Suspense } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AlertTriangle, ArrowRight, Home, SearchX } from 'lucide-react';
import Header from '@/components/shared/Header';
import StayCard from '@/components/stay/StayCard';
import StayFilterBar from '@/components/stay/StayFilterBar';
// 값 상수는 'use client' 모듈이 아니라 순수 모듈에서 가져온다.
// (클라이언트 모듈 경유 시 서버에서는 client reference 프록시가 되어 런타임에 터진다)
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
  STAY_LIST_MAX_LIMIT,
  STAY_STATUSES,
  type StayDealType,
  type StayStatus,
  type StayType,
} from '@/lib/stay/constants';
import type { Stay, StayListResponse } from '@/types/stay';

export const dynamic = 'force-dynamic';

// ---------- 쿼리 파싱 ----------
// 필터 상태의 단일 출처는 URL 이다. 잘못된 값은 조용히 버리고 기본값으로 되돌린다.

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseMulti<T extends string>(
  raw: string | string[] | undefined,
  allowed: readonly T[]
): T[] {
  const value = first(raw);
  if (!value) return [];
  const allowedSet = new Set<string>(allowed);
  return Array.from(
    new Set(value.split(',').map((v) => v.trim()).filter((v) => allowedSet.has(v)))
  ) as T[];
}

const SORT_VALUES = STAY_LIST_SORTS.map((o) => o.value);

// ---------- 데이터 로드 ----------
// 정렬/거래유형은 GET /api/stays 가 지원하므로 서버에서 처리한다.
// API 가 지원하지 않는 조건(차단 유형 제외, 유형 다중선택, 진행상태 다중선택)만 여기서 후처리한다.

/** 서버 컴포넌트에서 자기 자신의 API 를 부르려면 절대 URL 이 필요하다. */
async function apiOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (host) {
    const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
  }
  return (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.booin.co.kr').trim();
}

type StayListResult =
  | { ok: true; stays: Stay[] }
  | { ok: false; stays: never[] };

async function fetchStays(query: {
  dealType: StayDealType;
  stayTypes: StayType[];
  statuses: StayStatus[];
  sort: StayListSort;
}): Promise<StayListResult> {
  const sp = new URLSearchParams();
  sp.set('deal_type', query.dealType);
  sp.set('sort', query.sort);
  sp.set('limit', String(STAY_LIST_MAX_LIMIT));
  // API 는 stay_type 단일값만 받는다. 정확히 1개 선택일 때만 서버로 넘긴다.
  if (query.stayTypes.length === 1) sp.set('stay_type', query.stayTypes[0]);

  try {
    const res = await fetch(`${await apiOrigin()}/api/stays?${sp.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false, stays: [] };

    const json = (await res.json()) as StayListResponse;
    const items = Array.isArray(json.items) ? json.items : [];

    return {
      ok: true,
      stays: items.filter((stay) => {
        // v1 은 생활숙박시설을 취급하지 않는다 — 유형 필터 미선택 상태에서도 항상 제외한다.
        if (isBlockedStayType(stay.stay_type)) return false;
        if (query.stayTypes.length > 0 && !query.stayTypes.includes(stay.stay_type)) return false;
        if (query.statuses.length > 0 && !query.statuses.includes(stay.status)) return false;
        return true;
      }),
    };
  } catch {
    return { ok: false, stays: [] };
  }
}

// ---------- 목록 영역 ----------

/** 로딩 상태 — 필터바 + 카드 그리드 자리를 미리 잡아 레이아웃이 튀지 않게 한다. */
function StayResultsSkeleton() {
  return (
    <div>
      <div className="h-48 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm" />
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm"
          />
        ))}
      </div>
    </div>
  );
}

async function StayResults({
  dealType,
  stayTypes,
  statuses,
  sort,
}: {
  dealType: StayDealType;
  stayTypes: StayType[];
  statuses: StayStatus[];
  sort: StayListSort;
}) {
  const result = await fetchStays({ dealType, stayTypes, statuses, sort });
  const stays = result.stays;
  const hasFilter = stayTypes.length > 0 || statuses.length > 0;

  return (
    <>
      <StayFilterBar
        dealType={dealType}
        stayTypes={stayTypes}
        statuses={statuses}
        sort={sort}
        totalCount={stays.length}
      />

      {!result.ok ? (
        // 에러 상태 — API 500/네트워크 실패. 빈 화면 대신 재시도 안내를 준다.
        <div className="py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <AlertTriangle className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="mb-2 text-base font-bold text-gray-700">
            매물을 불러오지 못했습니다
          </h2>
          <p className="mb-4 text-sm text-gray-400">
            일시적인 오류일 수 있습니다. 잠시 후 다시 시도해주세요.
          </p>
          <Link href="/stay" className="text-sm font-semibold text-blue-600 hover:underline">
            다시 불러오기
          </Link>
        </div>
      ) : stays.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stays.map((stay) => (
            <StayCard key={stay.id} stay={stay} />
          ))}
        </div>
      ) : hasFilter ? (
        <div className="py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <SearchX className="h-8 w-8 text-blue-300" />
          </div>
          <h2 className="mb-2 text-base font-bold text-gray-700">
            조건에 맞는 매물이 없습니다
          </h2>
          <p className="mb-4 text-sm text-gray-400">
            선택한 조건을 줄이면 더 많은 매물을 볼 수 있어요.
          </p>
          <Link href="/stay" className="text-sm font-semibold text-blue-600 hover:underline">
            필터 초기화
          </Link>
        </div>
      ) : (
        // 빈 상태 — 아직 등록된 매물 자체가 없다. 소유주 등록으로 유도한다.
        <div className="py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Home className="h-8 w-8 text-blue-300" />
          </div>
          <h2 className="mb-2 text-base font-bold text-gray-700">
            아직 등록된 매물이 없습니다
          </h2>
          <p className="mb-5 text-sm text-gray-400">
            첫 매물을 등록해보세요. 임대인도 직접 올릴 수 있습니다.
          </p>
          <Link
            href="/stay/owner"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            소유주 직접 등록하기
            <ArrowRight className="h-4 w-4 flex-shrink-0" />
          </Link>
        </div>
      )}
    </>
  );
}

export default async function StayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // 플래그 가드 — 실제 단기임대 목록 구현 완료 시 true로 토글
  const enabled = process.env.NEXT_PUBLIC_STAY_ENABLED === 'true';
  if (!enabled) {
    redirect('/');
  }

  const params = await searchParams;

  const dealTypeRaw = first(params[STAY_QUERY_KEYS.deal]);
  const dealType: StayDealType = STAY_DEAL_TYPES.includes(dealTypeRaw as StayDealType)
    ? (dealTypeRaw as StayDealType)
    : STAY_DEFAULT_DEAL_TYPE;

  const stayTypes = parseMulti<StayType>(params[STAY_QUERY_KEYS.type], STAY_FILTER_TYPES);
  const statuses = parseMulti<StayStatus>(params[STAY_QUERY_KEYS.status], STAY_STATUSES);

  const sortRaw = first(params[STAY_QUERY_KEYS.sort]);
  const sort: StayListSort = SORT_VALUES.includes(sortRaw as StayListSort)
    ? (sortRaw as StayListSort)
    : STAY_DEFAULT_SORT;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header variant="landing" />

      {/* ── 히어로 ── */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 pt-6 pb-7">
        <div className="mx-auto max-w-7xl px-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/70">
            단기임대 · 공실임대
          </p>
          <h1 className="text-xl font-extrabold leading-tight text-white md:text-2xl">
            짧게 살 집, 비어 있는 집을 한 곳에서
          </h1>
          <p className="mt-2 text-sm text-white/80">
            검증된 중개사무소와 임대인이 직접 올린 단기 임대 매물입니다.
          </p>

          {/* 소유주 유입 CTA */}
          <Link
            href="/stay/owner"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            집을 내놓으시나요? 소유주 직접 등록
            <ArrowRight className="h-4 w-4 flex-shrink-0" />
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-5">
        <Suspense
          key={`${dealType}|${stayTypes.join(',')}|${statuses.join(',')}|${sort}`}
          fallback={<StayResultsSkeleton />}
        >
          <StayResults
            dealType={dealType}
            stayTypes={stayTypes}
            statuses={statuses}
            sort={sort}
          />
        </Suspense>
      </main>
    </div>
  );
}
