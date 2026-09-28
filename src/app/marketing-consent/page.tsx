import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingConsentContent from '@/components/legal/MarketingConsentContent';

export const metadata: Metadata = {
  title: '마케팅 정보 수신 동의 | 부동산인',
  description: '부동산인(온시아 JOB) 마케팅 정보 수신 동의 안내',
};

export default function MarketingConsentPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">부동산<span className="text-cyan-600">인</span></Link>
          <nav className="flex gap-4 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-800">이용약관</Link>
            <Link href="/privacy" className="hover:text-gray-800">개인정보처리방침</Link>
            <Link href="/refund" className="hover:text-gray-800">환불정책</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">마케팅 정보 수신 동의</h1>
        <p className="text-sm text-gray-400 mb-10">시행일: 2026년 10월 1일</p>

        <MarketingConsentContent />

        {/* 사업자 정보 */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-xs text-gray-400 space-y-1">
          <p><strong className="text-gray-500">온시아 공인중개사사무소</strong> | 대표이사: 연대겸 | 사업자등록번호: 846-23-01501</p>
          <p>주소: 서울특별시 송파구 중대로 197, 3동 305층 A169(가락동) | 대표전화: <a href="tel:1555-1245" className="hover:text-gray-600">1555-1245</a></p>
          <p>고객센터: onsia777@gmail.com</p>
        </div>
      </main>
    </div>
  );
}
