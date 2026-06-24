'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bookmark } from 'lucide-react';
import type { SalesJobListing, SalesPosition } from '@/types';

// 분양의신(bunshin.kr/jobs) "추천 현장" 카드를 DOM 1:1 이식.
// 색: 회색/초록/블루 (퍼플 미사용)

const TYPE_LABELS: Record<string, string> = {
  apartment: '아파트', officetel: '오피스텔', store: '상가', industrial: '지산',
};
const POSITION_SHORT: Record<SalesPosition, string> = {
  headTeam: '본부', teamLead: '팀장', member: '팀원',
};

// 혜택 문자열을 "라벨 + 값" 으로 분해 (값은 빨강 강조). 예: "일비 5만원" → {label:'일비', value:'5'}
function splitBenefit(b: string): { label: string; value?: string } {
  const num = b.match(/(\d[\d,]*)/);
  if (num) return { label: b.replace(num[0], '').replace(/만원|만|원/g, '').trim() || b, value: num[1] };
  if (/지원|제공|무료/.test(b)) {
    const m = b.match(/(지원|제공|무료)/)!;
    return { label: b.replace(m[0], '').trim() || b, value: m[0] };
  }
  return { label: b };
}

export default function SalesFeaturedCard({ job }: { job: SalesJobListing }) {
  const amount = job.salary.amount;
  const isNumericAmount = amount ? /^[\d,]+$/.test(amount.replace(/만원|만|원/g, '').trim()) : false;
  const amountNum = amount ? amount.replace(/만원|만|원/g, '').trim() : '';

  return (
    <Link href={`/sales/jobs/${job.id}`}>
      <article className="flex min-w-0 cursor-pointer flex-col gap-3 group">
        {/* 썸네일 */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-200">
          {job.thumbnail ? (
            <Image
              src={job.thumbnail}
              alt={job.title}
              fill
              className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400">
              {job.company.charAt(0)}
            </div>
          )}
        </div>

        {/* 본문 */}
        <div className="flex min-w-0 flex-col gap-[10px]">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              {/* 유형 · 지역 + 북마크 */}
              <div className="flex min-w-0 items-center justify-between gap-1">
                <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-gray-600">
                  <span className="truncate">{TYPE_LABELS[job.type] || job.type}</span>
                  <span className="h-[3px] w-[3px] shrink-0 rounded-full bg-gray-300" />
                  <span className="truncate">{job.region}</span>
                </div>
                <button
                  type="button"
                  aria-label="북마크 추가"
                  onClick={(e) => e.preventDefault()}
                  className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <Bookmark className="h-4 w-4" />
                </button>
              </div>

              {/* 제목 */}
              <h3 className="line-clamp-2 text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {job.title}
              </h3>

              {/* 설명 */}
              <p className="line-clamp-1 text-sm font-medium text-gray-600">{job.description}</p>
            </div>

            {/* 수수료: 직책 배지 + RT + 금액 */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-1">
                <span className="inline-flex h-5 min-w-[34px] items-center justify-center rounded border border-green-300 bg-green-50 px-1 text-xs font-bold text-green-600">
                  {POSITION_SHORT[job.position]}
                </span>
                <span className="text-xs font-medium text-gray-600">RT</span>
              </div>
              <div className="flex shrink-0 items-baseline gap-1">
                {amount ? (
                  <>
                    <span className="text-lg font-bold text-gray-900">{isNumericAmount ? amountNum : amount}</span>
                    {isNumericAmount && <span className="text-sm font-medium text-gray-600">만원</span>}
                  </>
                ) : (
                  <span className="text-sm font-semibold text-gray-500">상담문의</span>
                )}
              </div>
            </div>
          </div>

          {/* 혜택 칩 */}
          {job.benefits.length > 0 && (
            <div className="flex w-full flex-nowrap items-center gap-1 overflow-hidden">
              {job.benefits.slice(0, 3).map((b) => {
                const { label, value } = splitBenefit(b);
                return (
                  <span
                    key={b}
                    className="inline-flex h-6 max-w-full shrink-0 items-center gap-[3px] rounded-full bg-gray-100 px-2 text-xs font-bold text-gray-700"
                  >
                    <span className="min-w-0 truncate">{label}</span>
                    {value && <span className="shrink-0 text-red-400">{value}</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
