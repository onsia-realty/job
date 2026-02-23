import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '이용약관 | 온시아 JOB',
  description: '온시아 JOB 서비스 이용약관',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">온시아 JOB</Link>
          <nav className="flex gap-4 text-sm text-gray-500">
            <Link href="/terms" className="text-blue-600 font-semibold">이용약관</Link>
            <Link href="/privacy" className="hover:text-gray-800">개인정보처리방침</Link>
            <Link href="/refund" className="hover:text-gray-800">환불정책</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">서비스 이용약관</h1>
        <p className="text-sm text-gray-400 mb-10">시행일: 2026년 2월 24일 | 최종 수정: 2026년 2월 24일</p>

        <div className="prose prose-gray max-w-none text-[15px] leading-relaxed">

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">제1조 (목적)</h2>
          <p>이 약관은 온시아 주식회사(이하 &quot;회사&quot;)가 운영하는 온시아 JOB 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자(이하 &quot;회원&quot;) 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">제2조 (정의)</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;서비스&quot;란 회사가 제공하는 부동산 전문가 구인구직 매칭 플랫폼 및 관련 부가서비스를 말합니다.</li>
            <li>&quot;회원&quot;이란 본 약관에 따라 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
            <li>&quot;구인회원&quot;이란 부동산 관련 인력을 채용하고자 구인공고를 등록하는 회원을 말합니다.</li>
            <li>&quot;구직회원&quot;이란 부동산 관련 직종에 취업하고자 이력서를 등록하고 구인공고에 지원하는 회원을 말합니다.</li>
            <li>&quot;유료서비스&quot;란 프리미엄 공고 노출, 상단 고정, 긴급 채용 배지 등 회사가 유료로 제공하는 부가서비스를 말합니다.</li>
          </ol>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">제3조 (약관의 효력 및 변경)</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
            <li>회사는 관련 법령에 위배되지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 적용일 7일 전부터 서비스 내 공지합니다.</li>
            <li>회원이 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
          </ol>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">제4조 (이용계약의 체결)</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>이용계약은 회원이 되고자 하는 자가 약관의 내용에 동의한 후 회원가입 신청을 하고, 회사가 이를 승낙함으로써 체결됩니다.</li>
            <li>회사는 다음 각 호에 해당하는 경우 가입을 거절하거나 사후에 이용계약을 해지할 수 있습니다.
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>타인의 명의를 이용한 경우</li>
                <li>허위 정보를 기재한 경우</li>
                <li>기타 회사가 정한 이용신청 요건을 충족하지 않은 경우</li>
              </ul>
            </li>
          </ol>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">제5조 (서비스의 제공)</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>회사는 다음과 같은 서비스를 제공합니다.
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>구인공고 등록 및 관리 서비스</li>
                <li>이력서 등록 및 관리 서비스</li>
                <li>구인구직 매칭 서비스</li>
                <li>AI 기반 부동산 뉴스 및 콘텐츠 서비스</li>
                <li>프리미엄 공고 노출 등 유료 부가서비스</li>
              </ul>
            </li>
            <li>서비스는 연중무휴 1일 24시간 제공을 원칙으로 합니다. 단, 시스템 점검 등의 사유로 일시 중단될 수 있습니다.</li>
          </ol>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">제6조 (유료서비스 및 결제)</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>회원 가입 및 기본 구인공고 등록은 무료입니다.</li>
            <li>유료서비스의 종류, 이용요금 및 제공기간은 서비스 내 해당 페이지에 별도로 표시합니다.</li>
            <li>유료서비스 결제는 신용카드, 계좌이체, 간편결제 등 회사가 정한 결제수단을 통해 이루어집니다.</li>
            <li><strong>서비스 제공기간: 유료서비스는 결제 완료 즉시 서비스가 개시</strong>되며, 선택한 상품에 따라 5일, 7일, 14일, 30일 등 해당 기간 동안 제공됩니다.</li>
            <li>유료서비스 이용요금은 부가가치세를 포함한 금액으로 표시합니다.</li>
          </ol>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">제7조 (청약철회 및 취소)</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 my-4">
            <p className="font-bold text-blue-800 mb-2">유료서비스 취소 안내</p>
            <p className="text-blue-700 text-sm">본 유료서비스는 결제 완료 즉시 서비스 제공이 개시되며, 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따라 서비스 제공이 개시된 이후에는 청약철회가 제한될 수 있습니다.</p>
          </div>
          <ol className="list-decimal pl-6 space-y-2">
            <li>회원은 유료서비스를 구매한 날로부터 7일 이내에 청약철회를 할 수 있습니다. 단, 유료서비스의 이용이 개시된 경우에는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따라 청약철회가 제한될 수 있습니다.</li>
            <li>다음 각 호에 해당하는 경우 청약철회가 제한됩니다.
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>유료서비스(프리미엄 공고 게시, 상단 노출, 긴급 채용 배지 등)의 제공이 개시된 경우</li>
                <li>회원의 책임 있는 사유로 서비스가 멸실 또는 훼손된 경우</li>
                <li>회원의 사용 또는 일부 소비에 의하여 서비스의 가치가 현저히 감소한 경우</li>
              </ul>
            </li>
            <li>회사는 제2항의 청약철회 제한 사유를 서비스 이용 신청(결제) 과정에서 회원이 쉽게 알 수 있도록 명확하게 고지합니다.</li>
            <li>제1항 및 제2항에도 불구하고, 유료서비스의 내용이 표시·광고 내용과 다르거나 계약 내용과 다르게 이행된 경우, 회원은 서비스를 제공받은 날부터 3개월 이내, 그 사실을 안 날 또는 알 수 있었던 날부터 30일 이내에 청약철회를 할 수 있습니다.</li>
          </ol>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">제8조 (환불)</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>회사의 귀책사유(시스템 장애, 서비스 오류 등)로 유료서비스를 제공하지 못한 경우, 회사는 해당 기간만큼 서비스 기간을 연장하거나 이용요금을 환불합니다.</li>
            <li>환불 금액은 유료이용 계약 당시 상품의 정가 기준으로, 서비스 제공된 기간에 해당하는 요금을 일할(1일 기준) 계산하여 차감한 잔액으로 산정합니다.</li>
            <li>회사는 환불 요청 접수일로부터 3영업일 내에 환불 여부를 검토하여 그 결과를 회원에게 통지하고, 환불 결정 시 통지일로부터 3영업일 이내에 환불금을 지급합니다.</li>
            <li>환불은 원결제수단으로 진행하는 것을 원칙으로 합니다. 원결제수단으로의 환불이 불가능한 경우, 회원에게 사전 고지 후 다른 방법으로 환불할 수 있습니다.</li>
            <li>다음 각 호에 해당하는 경우 환불이 불가합니다.
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>회원이 약관을 위반하여 이용이 제한·정지된 경우</li>
                <li>허위 또는 부적절한 공고를 게재하여 서비스가 중지된 경우</li>
                <li>회원의 귀책사유로 서비스를 이용하지 못한 경우</li>
              </ul>
            </li>
          </ol>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">제9조 (회원의 의무)</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>회원은 서비스 이용 시 다음 각 호의 행위를 하여서는 안 됩니다.
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>허위 정보의 등록</li>
                <li>타인의 정보 도용</li>
                <li>회사가 게시한 정보의 무단 변경</li>
                <li>회사의 서비스를 이용하여 얻은 정보를 회사의 사전 승인 없이 상업적으로 이용하는 행위</li>
                <li>다른 회원 또는 제3자를 비방하거나 명예를 손상시키는 행위</li>
              </ul>
            </li>
          </ol>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">제10조 (서비스 이용 제한)</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>회사는 회원이 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 경고, 일시정지, 영구이용정지 등의 조치를 취할 수 있습니다.</li>
            <li>회사가 이용을 제한·정지한 경우, 이미 결제한 유료서비스 이용료는 환불하지 않으며, 이에 대해 별도의 손해배상을 청구할 수 있습니다.</li>
          </ol>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">제11조 (면책조항)</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
            <li>회사는 회원 간 또는 회원과 제3자 간에 서비스를 매개로 발생한 분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임이 없습니다.</li>
            <li>회사는 회원이 게재한 정보, 자료, 사실의 신뢰도, 정확성 등 내용에 대해서는 보증하지 않습니다.</li>
          </ol>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">제12조 (분쟁해결)</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>회사와 회원 간에 발생한 분쟁에 대해서는 대한민국 법을 적용합니다.</li>
            <li>서비스 이용과 관련하여 발생한 분쟁에 대한 소송은 회사의 본사 소재지를 관할하는 법원을 전속관할법원으로 합니다.</li>
          </ol>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">부칙</h2>
          <p>본 약관은 2026년 2월 24일부터 시행합니다.</p>
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
