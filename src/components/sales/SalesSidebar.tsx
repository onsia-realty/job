'use client';

import Link from 'next/link';
import { Bookmark, PenSquare, RefreshCw, Megaphone, LayoutList, ChevronRight } from 'lucide-react';

// 분양의신(bunshin.kr/jobs) 우측 액션 사이드바를 충실 이식.
// 라벨/부제는 경쟁사 DOM 채증값 기반.
const ACTIONS = [
  {
    href: '/sales/jobs/new',
    icon: PenSquare,
    title: '구인공고 등록',
    desc: '분양상담사 채용의 시작',
    tone: 'primary' as const,
  },
  {
    href: '/sales/mypage',
    icon: RefreshCw,
    title: '내 공고 연장하기',
    desc: '끊김 없이, 채용 기회를 이어가는 방법',
    tone: 'plain' as const,
  },
  {
    href: '/sales/premium',
    icon: Megaphone,
    title: '광고 상품 안내',
    desc: '내 공고를 효과적으로 홍보하는 법',
    tone: 'plain' as const,
  },
  {
    href: '/sales/mypage',
    icon: LayoutList,
    title: '내 구인공고 관리',
    desc: '등록한 공고를 한눈에 바로 확인',
    tone: 'plain' as const,
  },
];

export default function SalesSidebar() {
  return (
    <aside className="hidden lg:flex flex-col gap-3 w-[280px] shrink-0">
      {/* 저장한 공고 */}
      <button
        type="button"
        className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-800 hover:border-blue-500 hover:text-blue-600 transition-colors"
      >
        <Bookmark className="w-4 h-4" />
        저장한 공고
      </button>

      {/* 액션 카드 스택 */}
      <div className="flex flex-col gap-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          const isPrimary = a.tone === 'primary';
          return (
            <Link
              key={a.title}
              href={a.href}
              className={`group flex items-center gap-3 rounded-xl border p-3.5 transition-all ${
                isPrimary
                  ? 'border-transparent bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isPrimary ? 'bg-white/20' : 'bg-blue-50 text-blue-600'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-bold ${isPrimary ? 'text-white' : 'text-gray-800'}`}>
                  {a.title}
                </span>
                <span className={`block text-[11px] leading-tight mt-0.5 ${isPrimary ? 'text-white/80' : 'text-gray-500'}`}>
                  {a.desc}
                </span>
              </span>
              <ChevronRight className={`h-4 w-4 shrink-0 ${isPrimary ? 'text-white/70' : 'text-gray-400 group-hover:text-blue-600'}`} />
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
