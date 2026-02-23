import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '환불·취소 정책 | 온시아 JOB',
  description: '온시아 JOB 유료서비스 환불 및 취소 정책',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">온시아 JOB</Link>
          <nav className="flex gap-4 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-800">이용약관</Link>
            <Link href="/privacy" className="hover:text-gray-800">개인정보처리방침</Link>
            <Link href="/refund" className="text-blue-600 font-semibold">환불정책</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">환불·취소 정책</h1>
        <p className="text-sm text-gray-400 mb-10">시행일: 2026년 2월 24일 | 최종 수정: 2026년 2월 24일</p>

        {/* 핵심 요약 카드 */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wider">서비스 제공기간</p>
            <p className="text-lg font-extrabold text-blue-900">결제 즉시 개시</p>
            <p className="text-sm text-blue-700 mt-1">선택 상품에 따라 5일~30일</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-emerald-600 mb-1 uppercase tracking-wider">환불 처리기간</p>
            <p className="text-lg font-extrabold text-emerald-900">3영업일 이내</p>
            <p className="text-sm text-emerald-700 mt-1">요청 접수 후 검토·환불</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-amber-600 mb-1 uppercase tracking-wider">청약철회</p>
            <p className="text-lg font-extrabold text-amber-900">구매일로부터 7일</p>
            <p className="text-sm text-amber-700 mt-1">서비스 개시 전 전액 환불</p>
          </div>
        </div>

        <div className="prose prose-gray max-w-none text-[15px] leading-relaxed">

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">1. 유료서비스 안내</h2>

          <h3 className="text-base font-bold text-gray-800 mt-6 mb-3">1.1 서비스 종류 및 제공기간</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-3 text-left font-bold text-gray-700">상품명</th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-bold text-gray-700">서비스 내용</th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-bold text-gray-700">제공기간</th>
                  <th className="border border-gray-200 px-4 py-3 text-right font-bold text-gray-700">이용요금</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-4 py-3 font-medium">BASIC</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">검색 상위 노출, BASIC 배지</td>
                  <td className="border border-gray-200 px-4 py-3 text-center">결제 즉시 ~ 5일</td>
                  <td className="border border-gray-200 px-4 py-3 text-right font-medium">4,900원</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="border border-gray-200 px-4 py-3 font-medium">PREMIUM</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">상단 고정 노출, PREMIUM 배지, 인재추천</td>
                  <td className="border border-gray-200 px-4 py-3 text-center">결제 즉시 ~ 7일</td>
                  <td className="border border-gray-200 px-4 py-3 text-right font-medium">9,900원</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-3 font-medium">VIP</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">최상단 고정, VIP 배지, 긴급채용 표시, 맞춤인재 매칭</td>
                  <td className="border border-gray-200 px-4 py-3 text-center">결제 즉시 ~ 7일</td>
                  <td className="border border-gray-200 px-4 py-3 text-right font-medium">24,900원</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-2">※ 모든 금액은 부가가치세(VAT) 포함 금액입니다.</p>
          <p className="text-sm text-gray-500">※ 서비스 제공기간은 <strong>결제 완료 즉시 개시</strong>되며, 해당 기간 만료 시 자동 종료됩니다.</p>

          <h3 className="text-base font-bold text-gray-800 mt-6 mb-3">1.2 무료서비스</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>회원가입, 이력서 등록, 기본(일반) 구인공고 등록은 무료입니다.</li>
            <li>무료 공고는 기간 제한 없이 이용 가능하며, 별도 결제가 필요하지 않습니다.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">2. 청약철회(취소) 규정</h2>

          <div className="bg-red-50 border border-red-200 rounded-xl p-5 my-4">
            <p className="font-bold text-red-800 mb-2">중요 안내</p>
            <p className="text-red-700 text-sm">본 유료서비스는 결제 완료 즉시 서비스 제공이 개시되며, 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제4호에 따라 서비스 제공이 개시된 이후에는 청약철회가 제한될 수 있습니다.</p>
          </div>

          <h3 className="text-base font-bold text-gray-800 mt-6 mb-3">2.1 청약철회 가능한 경우</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>서비스 개시 전</strong>: 결제 후 유료서비스가 아직 적용(개시)되지 않은 경우, 구매일로부터 7일 이내 전액 환불 가능</li>
            <li><strong>서비스 내용 불일치</strong>: 서비스의 내용이 표시·광고 내용과 다르거나 계약 내용과 다르게 이행된 경우, 서비스를 제공받은 날부터 3개월 이내 또는 그 사실을 안 날로부터 30일 이내 환불 가능</li>
            <li><strong>회사 귀책사유</strong>: 시스템 장애, 서비스 오류 등 회사의 귀책사유로 서비스를 정상적으로 이용할 수 없는 경우</li>
          </ul>

          <h3 className="text-base font-bold text-gray-800 mt-6 mb-3">2.2 청약철회가 제한되는 경우</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>유료서비스(프리미엄 공고 게시, 상단 노출, 긴급 채용 배지 등)의 제공이 이미 개시된 경우</li>
            <li>회원의 책임 있는 사유로 서비스가 멸실 또는 훼손된 경우</li>
            <li>회원의 사용 또는 일부 소비에 의하여 서비스의 가치가 현저히 감소한 경우</li>
            <li>회원이 이용약관을 위반하여 서비스 이용이 제한·정지된 경우</li>
            <li>허위 또는 부적절한 공고를 게재하여 회사가 서비스를 중지한 경우</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">3. 환불 정책</h2>

          <h3 className="text-base font-bold text-gray-800 mt-6 mb-3">3.1 환불 금액 산정</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 my-4">
            <p className="font-bold text-gray-800 mb-2">환불 금액 계산 방식</p>
            <p className="text-gray-700 text-sm mb-3">환불 금액 = 결제 금액 - (1일 기준 금액 × 서비스 이용 일수)</p>
            <p className="text-gray-500 text-xs">※ 1일 기준 금액 = 결제 금액 ÷ 총 서비스 제공일수</p>
            <div className="mt-3 space-y-1.5 text-sm">
              <p className="text-gray-600"><strong>예시 1:</strong> BASIC(4,900원/5일) 상품을 2일 사용 후 환불 요청 → 4,900 - (980 × 2) = <strong>2,940원 환불</strong></p>
              <p className="text-gray-600"><strong>예시 2:</strong> PREMIUM(9,900원/7일) 상품을 3일 사용 후 환불 요청 → 9,900 - (1,414 × 3) = <strong>5,658원 환불</strong></p>
            </div>
          </div>

          <h3 className="text-base font-bold text-gray-800 mt-6 mb-3">3.2 환불 절차</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>환불 신청</strong>: 고객센터(이메일: support@onsia.city)로 환불 사유를 기재하여 요청</li>
            <li><strong>환불 검토</strong>: 요청 접수일로부터 <strong>3영업일 이내</strong> 환불 여부 검토 후 결과 통지</li>
            <li><strong>환불 지급</strong>: 환불 결정 시 통지일로부터 <strong>3영업일 이내</strong> 환불금 지급</li>
            <li><strong>환불 수단</strong>: 원결제수단(신용카드, 계좌이체 등)을 통한 취소·환불을 원칙으로 합니다.</li>
          </ol>

          <h3 className="text-base font-bold text-gray-800 mt-6 mb-3">3.3 환불이 불가능한 경우</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>회원의 약관 위반으로 인해 서비스 이용이 제한·정지된 경우</li>
            <li>허위·불량 공고 게재로 인해 서비스가 중지된 경우</li>
            <li>회원의 귀책사유로 서비스를 이용하지 못한 경우</li>
            <li>유료서비스 제공기간이 모두 경과한 경우</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">4. 회사 귀책사유에 의한 환불</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>회사의 시스템 장애, 서비스 오류 등으로 유료서비스를 정상적으로 이용할 수 없는 경우, 회사는 장애 기간만큼 서비스 기간을 연장하거나 이용요금을 환불합니다.</li>
            <li>환불 지연 시 「전자상거래 등에서의 소비자보호에 관한 법률」 제18조에 따라 연 15%의 지연이자를 부과합니다.</li>
          </ol>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">5. 관련 법령</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 (청약철회등)</li>
            <li>「전자상거래 등에서의 소비자보호에 관한 법률」 제18조 (청약철회등의 효과)</li>
            <li>본 정책에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">6. 고객센터 안내</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="space-y-2 text-sm">
              <p><strong>이메일</strong>: support@onsia.city</p>
              <p><strong>운영시간</strong>: 평일 09:00 ~ 18:00 (주말·공휴일 휴무)</p>
              <p><strong>회사명</strong>: 온시아 주식회사</p>
              <p><strong>대표</strong>: 연대겸</p>
              <p><strong>사업자등록번호</strong>: 243-88-01749</p>
              <p><strong>주소</strong>: 서울특별시 송파구 중대로 197, 3동 305층 A169(가락동)</p>
            </div>
          </div>
        </div>

        {/* 사업자 정보 */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-xs text-gray-400 space-y-1">
          <p><strong className="text-gray-500">온시아 주식회사</strong> | 대표이사: 연대겸 | 사업자등록번호: 243-88-01749</p>
          <p>주소: 서울특별시 송파구 중대로 197, 3동 305층 A169(가락동)</p>
          <p>고객센터: support@onsia.city | 업태: 정보통신업 | 종목: 소프트웨어 개발 및 공급업</p>
        </div>
      </main>
    </div>
  );
}
