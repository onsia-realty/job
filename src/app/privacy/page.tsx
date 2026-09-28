import type { Metadata } from 'next';
import Link from 'next/link';
import PrivacyContent from '@/components/legal/PrivacyContent';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 온시아 JOB',
  description: '온시아 JOB 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">부동산<span className="text-cyan-600">인</span></Link>
          <nav className="flex gap-4 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-800">이용약관</Link>
            <Link href="/privacy" className="text-blue-600 font-semibold">개인정보처리방침</Link>
            <Link href="/refund" className="hover:text-gray-800">환불정책</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">개인정보처리방침</h1>
        <p className="text-sm text-gray-400 mb-10">시행일: 2026년 2월 24일 | 최종 수정: 2026년 2월 24일</p>

        <PrivacyContent />

        {/* 취소·환불 규정 요약 */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-blue-900 text-center mb-6">취소·환불 규정</h2>
          <div className="space-y-4 max-w-3xl mx-auto text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold mt-0.5">01</span>
              <p><strong className="text-gray-900">서비스 개시 전 전액 환불</strong> — 결제 후 유료서비스가 적용되지 않은 경우, 구매일로부터 7일 이내 전액 환불 가능</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold mt-0.5">02</span>
              <p><strong className="text-gray-900">이용 중 부분 환불</strong> — 각 서비스 환불 안내에 따라 상품 정가 기준으로 서비스 제공 기간에 해당하는 요금을 차감한 잔액을 환불</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold mt-0.5">03</span>
              <p><strong className="text-gray-900">환불 불가</strong> — 서비스 기간이 모두 경과한 경우, 이용자 귀책사유(약관 위반 등)로 이용 제한된 경우</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold mt-0.5">04</span>
              <p><strong className="text-gray-900">환불 절차</strong> — 고객센터(onsia777@gmail.com) 요청 → 3영업일 내 검토 → 3영업일 내 원결제수단 환불</p>
            </div>
          </div>
          <div className="text-center mt-6">
            <Link href="/refund" className="text-blue-600 text-sm font-medium hover:underline">
              환불 정책 전문 보기 →
            </Link>
          </div>
        </div>

        {/* 사업자 정보 */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-xs text-gray-400 space-y-1">
          <p><strong className="text-gray-500">온시아 공인중개사사무소</strong> | 대표이사: 연대겸 | 사업자등록번호: 846-23-01501</p>
          <p>주소: 서울특별시 송파구 중대로 197, 3동 305층 A169(가락동)</p>
          <p>고객센터: onsia777@gmail.com | 업태: 정보통신업 | 종목: 소프트웨어 개발 및 공급업</p>
        </div>
      </main>
    </div>
  );
}
