'use client';

// 단기임대 메인(/stay) — 33m2 홈 구조를 우리 톤으로 옮긴 랜딩.
//
// 히어로(카피 + 검색) → 유형 카드 4장 → 지도 띠 → 소유주 등록 CTA.
//
// ⚠️ 날짜 선택은 넣지 않는다. 우리는 예약 상품이 아니라 임대차 계약을 중개한다
//    (체크인/체크아웃 UI 는 숙박업 오인을 부른다).
// ⚠️ 카드에 매물 건수를 붙이지 않는다 — 실데이터가 한 자릿수라 숫자가 오히려 신뢰를 깎는다.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronRight, Home, MapPin, PenSquare, Search } from 'lucide-react';
import { STAY_HOME_CATEGORIES, stayCategoryHref } from '@/lib/stay/home-categories';
import StayCategoryArt from '@/components/stay/StayCategoryArt';

export default function StayHomeClient() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const needle = q.trim();
    router.push(needle ? `/stay/list?q=${encodeURIComponent(needle)}` : '/stay/list');
  };

  return (
    <div className="mx-auto max-w-[1120px] px-4 pb-16 sm:px-6">
      {/* ── 히어로 : 좌 카피 · 우 검색 ── */}
      <section className="grid items-center gap-8 py-12 lg:grid-cols-2 lg:py-16">
        <div>
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
            <Home className="h-3.5 w-3.5" />
            단기임대 · 공실임대
          </p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl">
            부인에서
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              잠시 머물 집을
            </span>{' '}
            찾아보세요
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-500">
            한 달부터 일 년까지, 계약 기간이 짧아 놓치기 쉬운 집만 모았습니다.{' '}
            {/* JSX 는 요소 주변 줄바꿈 공백을 지운다. br 이 숨겨지는 모바일에서
                두 문장이 "모았습니다.중개사가" 로 붙어버려 공백을 명시한다. */}
            <br className="hidden sm:block" />
            중개사가 직접 확인한 매물이라 조건이 정확합니다.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="mb-3 text-sm font-bold text-gray-900">어디에서 지내실 건가요?</p>
          <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="지역·건물명으로 검색"
                aria-label="지역·건물명으로 검색"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="flex-shrink-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              검색
            </button>
          </form>
          <p className="mt-3 text-[11px] text-gray-400">
            검색어 없이 눌러도 전체 매물을 볼 수 있습니다.
          </p>
        </div>
      </section>

      {/* ── 유형 카드 4장 ── */}
      <section>
        <h2 className="mb-3 text-lg font-bold tracking-tight text-gray-900">어떤 집을 찾으세요?</h2>
        {/* 모바일도 2열로 둔다 — 1열이면 카드 4장이 세로로 900px 넘게 늘어져
            아래 지도 띠·소유주 CTA 가 첫 화면에서 완전히 밀려난다. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {STAY_HOME_CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={stayCategoryHref(category)}
              className="group relative min-h-[196px] overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg sm:min-h-[236px] sm:p-5"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="text-base font-bold tracking-tight text-gray-900 group-hover:text-blue-600 sm:text-lg">
                  {category.label}
                </span>
                <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-gray-300 transition-colors group-hover:text-blue-600" />
              </span>
              <span className="mt-2 block text-[11px] leading-[17px] text-gray-500 sm:text-xs sm:leading-[18px]">
                {category.subtitle}
              </span>
              {/* 라인아트 — 우하단에 앉히고 카드 밖으로 나가는 부분은 잘라낸다 */}
              <StayCategoryArt
                slug={category.slug}
                className="pointer-events-none absolute -bottom-1 right-2 h-[72px] w-[88px] text-gray-500 transition-colors group-hover:text-blue-600 sm:right-4 sm:h-[92px] sm:w-[112px]"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* ── 지도 띠 ── */}
      <section className="mt-8">
        <Link
          href="/stay/map"
          className="group flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-5 transition-colors hover:from-blue-100 hover:to-cyan-100"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/80">
              <MapPin className="h-5 w-5 text-blue-600" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-gray-900">
                원하는 지역의 집을 지도로 찾아보세요
              </span>
              <span className="mt-0.5 block text-[11px] text-gray-500">
                주변 실거래가와 나란히 놓고 비교할 수 있습니다
              </span>
            </span>
          </span>
          <ArrowRight className="h-5 w-5 flex-shrink-0 text-blue-600 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      {/* ── 소유주 등록 CTA ── */}
      <section className="mt-4">
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">비어 있는 집이 있으신가요?</p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              집주인이 직접 접수하면 담당 중개사가 확인 후 매물로 올려드립니다.
            </p>
          </div>
          <Link
            href="/stay/owner"
            className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Home className="h-3.5 w-3.5 flex-shrink-0" />
            소유주 등록
            <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
          </Link>
        </div>
      </section>

      {/* ── 중개사 등록 CTA ──
          소유주 CTA(집주인 접수 → 중개사 확인 후 등록)와 헷갈리지 않게
          "개업공인중개사가 직접 올린다" 는 점을 문구로 분리한다.
          미로그인이면 /stay/new 가 자체적으로 로그인 유도 화면을 띄우므로
          여기서 로그인 게이트는 걸지 않는다. */}
      <section className="mt-3">
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">중개사이신가요?</p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              보유하신 단기임대 매물을 직접 등록하고 관리하실 수 있습니다.
            </p>
          </div>
          <Link
            href="/stay/new"
            className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <PenSquare className="h-3.5 w-3.5 flex-shrink-0" />
            매물 등록
            <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
          </Link>
        </div>
      </section>
    </div>
  );
}
