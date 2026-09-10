// /stay 상세 "주변 시세" 블록.
//
// ⚠️ 서버 컴포넌트다. 'use client' 를 넣지 마라 — formatWon 같은 순수 서버 유틸을
//    직접 호출하고, 데이터도 서버에서 fetch 해서 Suspense 로 스트리밍한다.
// ⚠️ API 응답 금액은 전부 원 단위다. 여기서 ×10000 을 다시 하지 마라.

import { TrendingUp } from 'lucide-react';
import { formatWon } from '@/lib/stay/format';
import type { StayNearbyPriceResponse } from '@/types/stay';

/** 로딩 자리 — 카드 높이를 미리 잡아 본문이 튀지 않게 한다. */
export function StayNearbyPriceSkeleton() {
  return (
    <div className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
  );
}

/** 증감 배지 — ±5% 안쪽은 "비슷"으로 뭉갠다(표본 오차 범위). */
function DiffBadge({ pct }: { pct: number }) {
  const abs = Math.abs(pct);
  if (pct <= -5) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        {abs}% 저렴
      </span>
    );
  }
  if (pct >= 5) {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-700 ring-1 ring-inset ring-orange-600/20">
        {abs}% 비쌈
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 ring-1 ring-inset ring-slate-400/20">
      비슷
    </span>
  );
}

/**
 * 비교 한 행 — 월차임만.
 * ⚠️ 보증금은 비교하지 않는다: 반전세가 섞이면 보증금 평균이 크게 왜곡된다.
 */
function CompareRow({
  label,
  subjectWon,
  averageWon,
  pct,
}: {
  label: string;
  subjectWon: number;
  averageWon: number;
  pct: number;
}) {
  return (
    <div className="grid grid-cols-[64px_1fr_1fr_auto] items-center gap-2 py-2.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="min-w-0 truncate text-sm font-extrabold text-slate-900">
        {formatWon(subjectWon)}
      </span>
      <span className="min-w-0 truncate text-sm text-slate-600">{formatWon(averageWon)}</span>
      <DiffBadge pct={pct} />
    </div>
  );
}

export default async function StayNearbyPrice({
  stayId,
  origin,
}: {
  stayId: string;
  origin: string;
}) {
  // 부가 정보다 — 실패하면 조용히 사라진다(빈 박스도 남기지 않는다).
  let data: StayNearbyPriceResponse;
  try {
    const res = await fetch(
      `${origin}/api/stays/${encodeURIComponent(stayId)}/nearby-price`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    data = (await res.json()) as StayNearbyPriceResponse;
  } catch {
    return null;
  }

  if (!data.available) return null;

  const {
    sampleCount,
    months,
    areaFiltered,
    regionLabel,
    propertyTypeLabel,
    average,
    subject,
    monthlyDiffPct,
  } = data;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-1.5 text-base font-extrabold text-slate-900">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          주변 시세
        </h2>
        <p className="text-[11px] text-slate-400">
          {regionLabel} {propertyTypeLabel} · 최근 {months}개월 실거래 {sampleCount}건
          {areaFiltered ? ' · 유사 면적' : ''}
        </p>
      </div>

      {/* 컬럼 헤더 */}
      <div className="grid grid-cols-[64px_1fr_1fr_auto] items-center gap-2 border-b border-slate-100 pb-1.5 text-[11px] text-slate-400">
        <span />
        <span>이 매물</span>
        <span className="min-w-0 truncate">
          {regionLabel} {propertyTypeLabel} 평균
        </span>
        <span />
      </div>

      <CompareRow
        label="월차임"
        subjectWon={subject.monthlyWon}
        averageWon={average.monthlyWon}
        pct={monthlyDiffPct}
      />

      <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
        국토교통부 실거래가 · 최근 {months}개월 {sampleCount}건 기준
        {areaFiltered ? '' : ' · 면적 조건 없이 집계'}
      </p>
    </section>
  );
}
