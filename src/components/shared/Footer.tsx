'use client';

import Link from 'next/link';

interface FooterProps {
  variant?: 'full' | 'simple';
}

export default function Footer({ variant = 'full' }: FooterProps) {
  if (variant === 'simple') {
    return (
      <footer className="border-t border-white/10 pt-8 pb-6 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} BOOIN Corp. 부동산 전문가를 위한 AI 구인구직 플랫폼</p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
              <Link href="/privacy" className="hover:text-white transition-colors font-medium text-gray-300">개인정보처리방침</Link>
              <Link href="/refund" className="hover:text-white transition-colors">환불정책</Link>
            </div>
          </div>
          <div className="border-t border-white/5 pt-5">
            <div className="text-xs text-gray-600 leading-relaxed space-y-1">
              <p>
                <span className="text-gray-500">온시아 공인중개사</span>
                <span className="mx-2">|</span>
                대표이사: 연대겸
                <span className="mx-2">|</span>
                사업자등록번호: 846-23-01501
              </p>
              <p>
                주소: 서울특별시 송파구 중대로 197, 3동 305층 A169(가락동)
                <span className="mx-2">|</span>
                대표전화: <a href="tel:1555-1245" className="text-gray-500 hover:text-white transition-colors">1555-1245</a>
              </p>
              <p>
                업태: 정보통신업
                <span className="mx-2">|</span>
                종목: 소프트웨어 개발 및 공급업, 포털 및 인터넷 정보 매개 서비스업
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-white/10 pt-10 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 상단: 링크 */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} BOOIN Corp.</p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
            <Link href="/privacy" className="hover:text-white transition-colors font-medium text-gray-300">개인정보처리방침</Link>
            <Link href="/refund" className="hover:text-white transition-colors">환불정책</Link>
            <a href="mailto:onsia777@gmail.com" className="hover:text-white transition-colors">문의하기</a>
          </div>
        </div>

        {/* 하단: 사업자 정보 */}
        <div className="border-t border-white/5 pt-6">
          <div className="text-xs text-gray-600 leading-relaxed space-y-1">
            <p>
              <span className="text-gray-500">온시아 공인중개사</span>
              <span className="mx-2">|</span>
              대표이사: 연대겸
              <span className="mx-2">|</span>
              사업자등록번호: 846-23-01501
            </p>
            <p>
              주소: 서울특별시 송파구 중대로 197, 3동 305층 A169(가락동)
              <span className="mx-2">|</span>
              대표전화: <a href="tel:1555-1245" className="text-gray-500 hover:text-white transition-colors">1555-1245</a>
            </p>
            <p>
              업태: 정보통신업
              <span className="mx-2">|</span>
              종목: 소프트웨어 개발 및 공급업, 포털 및 인터넷 정보 매개 서비스업
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
