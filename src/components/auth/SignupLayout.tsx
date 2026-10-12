import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import SignupPromoVideo from './SignupPromoVideo';

interface SignupLayoutProps {
  title: string;
  children: ReactNode;
}

/**
 * 회원가입 단계(약관 동의 / 정보 입력) 공통 레이아웃
 * - 모바일·태블릿: 기존과 동일한 단일 컬럼(max-w-md)
 * - lg 이상: 좌측 폼 + 우측 홍보 영상 2단 구성
 */
export default function SignupLayout({ title, children }: SignupLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-8">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-md lg:max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/agent/auth/login"
              aria-label="로그인으로 돌아가기"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-slate-900">{title}</h1>
            <div className="w-5" />
          </div>
        </div>
      </header>

      <div className="max-w-md lg:max-w-4xl mx-auto px-4 py-6 lg:py-10 lg:flex lg:items-start lg:justify-center lg:gap-12">
        <main className="w-full max-w-md">{children}</main>
        <SignupPromoVideo />
      </div>
    </div>
  );
}
