import type { Metadata } from 'next';
import Link from 'next/link';
import { PRICING_TIERS, getExposureDays, type PricingTier } from '@/lib/toss';

// 1.1 표 — 가격·기간은 toss.ts PRICING_TIERS(공급가) 에서 생성
const PRICE_GROUPS: { category: PricingTier['category']; label: string }[] = [
  { category: 'agent', label: '공인중개사 상품' },
  { category: 'sales', label: '분양상담사 상품' },
];

const SERVICE_DESC: Record<string, string> = {
  'agent-basic': '검색 상위 노출, BASIC 배지',
  'agent-premium': '상단 고정 노출, 프리미엄 배지, 인재추천',
  'agent-vip': '최상단 고정, VIP 배지, 긴급채용 표시, 맞춤인재 매칭 (지역 독점)',
  'sales-premium': '일반 목록 반짝이 효과, 베이직 배지',
  'sales-superior': '전용 그리드 노출, 슈페리어 배지',
  'sales-dia': '추천 영역 상단 고정 노출, 다이아 배지',
  'sales-unique': '최상단 슬라이더 + 전용 그리드 노출, 유니크 배지 (지역 독점)',
};

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
          <Link href="/" className="text-lg font-bold text-gray-900">부동산<span className="text-cyan-600">인</span></Link>
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
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wider">환불 처리기간</p>
            <p className="text-lg font-extrabold text-blue-900">3영업일 이내</p>
            <p className="text-sm text-blue-700 mt-1">요청 접수 후 검토·환불</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wider">청약철회</p>
            <p className="text-lg font-extrabold text-blue-900">구매일로부터 7일</p>
            <p className="text-sm text-blue-700 mt-1">서비스 개시 전 전액 환불</p>
          </div>
        </div>

        <div className="prose prose-gray max-w-none text-[15px] leading-relaxed">

          {/* 1. 유료서비스 안내 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">1. 유료서비스 안내</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">1.1 서비스 종류 및 제공기간</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">상품명</th>
                  <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">서비스 내용</th>
                  <th className="border border-blue-200 px-4 py-3 text-center font-bold text-blue-900">제공기간</th>
                  <th className="border border-blue-200 px-4 py-3 text-right font-bold text-blue-900">이용요금(공급가)</th>
                </tr>
              </thead>
              {PRICE_GROUPS.map((group) => (
                <tbody key={group.category}>
                  <tr className="bg-gray-100">
                    <td colSpan={4} className="border border-gray-200 px-4 py-2 font-bold text-gray-800">{group.label}</td>
                  </tr>
                  {Object.entries(PRICING_TIERS)
                    .filter(([, tier]) => tier.category === group.category)
                    .map(([key, tier]) =>
                      tier.options.map((o, i) => (
                        <tr key={`${key}-${o.days}`}>
                          {i === 0 && (
                            <>
                              <td rowSpan={tier.options.length} className="border border-gray-200 px-4 py-3 font-medium align-top">
                                {tier.name}
                                {tier.purchaseEnabled === false && (
                                  <span className="block text-xs font-normal text-gray-500 mt-1">판매 준비 중</span>
                                )}
                              </td>
                              <td rowSpan={tier.options.length} className="border border-gray-200 px-4 py-3 text-gray-600 align-top">
                                {SERVICE_DESC[key] ?? '유료 공고 노출'}
                              </td>
                            </>
                          )}
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            결제 즉시 ~ {getExposureDays(o)}일
                            {o.bonusDays > 0 && (
                              <span className="block text-xs text-gray-500">({o.days}일 + 무료 {o.bonusDays}일)</span>
                            )}
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-right font-medium">
                            {tier.purchaseEnabled === false ? '판매 준비 중' : `${o.price.toLocaleString('ko-KR')}원`}
                          </td>
                        </tr>
                      )),
                    )}
                </tbody>
              ))}
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-2">※ 표시 금액은 공급가액이며 부가세(10%)는 별도입니다. 결제 시 부가세가 더해진 금액이 청구됩니다.</p>
          <p className="text-sm text-gray-500">※ 서비스 제공기간은 <strong>결제 완료 즉시 개시</strong>되며, 해당 기간 만료 시 자동 종료됩니다.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">1.2 무료서비스</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>회원가입, 이력서 등록, 기본(일반) 구인공고 등록은 무료입니다.</li>
            <li>무료 공고는 기간 제한 없이 이용 가능하며, 별도 결제가 필요하지 않습니다.</li>
          </ul>

          {/* 2. 청약철회 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">2. 청약철회(취소) 규정</h2>

          <div className="bg-red-50 border border-red-200 rounded-xl p-5 my-4">
            <p className="font-bold text-red-800 mb-2">중요 안내</p>
            <p className="text-red-700 text-sm">본 유료서비스는 결제 완료 즉시 서비스 제공이 개시되며, 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제4호에 따라 서비스 제공이 개시된 이후에는 청약철회가 제한될 수 있습니다.</p>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">2.1 청약철회 가능한 경우</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>서비스 개시 전</strong>: 결제 후 유료서비스가 아직 적용(개시)되지 않은 경우, 구매일로부터 7일 이내 전액 환불 가능</li>
            <li><strong>서비스 내용 불일치</strong>: 서비스의 내용이 표시·광고 내용과 다르거나 계약 내용과 다르게 이행된 경우, 서비스를 제공받은 날부터 3개월 이내 또는 그 사실을 안 날로부터 30일 이내 환불 가능</li>
            <li><strong>회사 귀책사유</strong>: 시스템 장애, 서비스 오류 등 회사의 귀책사유로 서비스를 정상적으로 이용할 수 없는 경우</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">2.2 청약철회가 제한되는 경우</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>유료서비스(프리미엄 공고 게시, 상단 노출, 긴급 채용 배지 등)의 제공이 이미 개시된 경우</li>
            <li>회원의 책임 있는 사유로 서비스가 멸실 또는 훼손된 경우</li>
            <li>회원의 사용 또는 일부 소비에 의하여 서비스의 가치가 현저히 감소한 경우</li>
            <li>회원이 이용약관을 위반하여 서비스 이용이 제한·정지된 경우</li>
            <li>허위 또는 부적절한 공고를 게재하여 회사가 서비스를 중지한 경우</li>
          </ul>

          {/* 3. 환불 정책 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">3. 환불 정책</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">3.1 환불 금액 산정</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 my-4">
            <p className="font-bold text-blue-900 mb-3">환불 금액 산정 원칙</p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-blue-800">
              <li>환불 요건에 부합하는 것으로 판단될 경우, <strong>각 서비스 환불 안내에 따라</strong> 유료이용 계약 당시 상품의 정가 기준으로 서비스 제공된 기간에 해당하는 요금을 차감한 잔액을 환불합니다.</li>
              <li>기간의 정함이 있는 유료서비스의 경우, 해지일까지의 이용일수를 <strong>1일 기준 금액</strong>으로 계산하여 이용금액을 공제 후 환급합니다.</li>
              <li>이용 건수의 정함이 있는 유료서비스의 경우, 기 사용분을 <strong>1건 기준 금액</strong>으로 계산하여 이용금액을 공제 후 환급합니다.</li>
            </ul>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">3.2 환불 절차</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>환불 신청</strong>: 고객센터(이메일: onsia777@gmail.com)로 환불 사유를 기재하여 요청</li>
            <li><strong>환불 검토</strong>: 요청 접수일로부터 <strong>3영업일 이내</strong> 환불 여부 검토 후 결과 통지</li>
            <li><strong>환불 지급</strong>: 환불 결정 시 통지일로부터 <strong>3영업일 이내</strong> 환불금 지급</li>
            <li><strong>환불 수단</strong>: 원결제수단(신용카드, 계좌이체 등)을 통한 취소·환불을 원칙으로 합니다.</li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">3.3 환불이 불가능한 경우</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>회원의 약관 위반으로 인해 서비스 이용이 제한·정지된 경우</li>
            <li>허위·불량 공고 게재로 인해 서비스가 중지된 경우</li>
            <li>회원의 귀책사유로 서비스를 이용하지 못한 경우</li>
            <li>유료서비스 제공기간이 모두 경과한 경우</li>
          </ul>

          {/* 4. 회사 귀책사유 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">4. 회사 귀책사유에 의한 환불</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>회사의 시스템 장애, 서비스 오류 등으로 유료서비스를 정상적으로 이용할 수 없는 경우, 회사는 장애 기간만큼 서비스 기간을 연장하거나 이용요금을 환불합니다.</li>
            <li>환불 지연 시 「전자상거래 등에서의 소비자보호에 관한 법률」 제18조에 따라 연 15%의 지연이자를 부과합니다.</li>
          </ol>

          {/* 5. 관련 법령 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">5. 관련 법령</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 (청약철회등)</li>
            <li>「전자상거래 등에서의 소비자보호에 관한 법률」 제18조 (청약철회등의 효과)</li>
            <li>본 정책에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다.</li>
          </ul>

          {/* 6. 고객센터 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">6. 고객센터 안내</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="space-y-2 text-sm">
              <p><strong className="text-blue-900">이메일</strong>: onsia777@gmail.com</p>
              <p><strong className="text-blue-900">대표전화</strong>: 1555-1245</p>
              <p><strong className="text-blue-900">운영시간</strong>: 평일 09:00 ~ 18:00 (주말·공휴일 휴무)</p>
              <p><strong className="text-blue-900">회사명</strong>: 온시아 공인중개사사무소</p>
              <p><strong className="text-blue-900">대표</strong>: 연대겸</p>
              <p><strong className="text-blue-900">사업자등록번호</strong>: 846-23-01501</p>
              <p><strong className="text-blue-900">주소</strong>: 서울특별시 송파구 중대로 197, 3동 305층 A169(가락동)</p>
            </div>
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
