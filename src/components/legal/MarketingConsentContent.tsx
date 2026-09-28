/**
 * 마케팅 정보 수신 동의 본문 — /marketing-consent 페이지와 회원가입 약관 모달에서 함께 사용
 * 운영자·개인정보 보호책임자 정보는 /privacy(개인정보처리방침)와 동일하게 유지할 것
 */
export default function MarketingConsentContent() {
  return (
        <div className="prose prose-gray max-w-none text-[15px] leading-relaxed">

          <p className="text-gray-600 mb-6">
            온시아 공인중개사사무소(이하 &quot;회사&quot;)는 부동산인(BOOIN) 회원에게 유용한 소식과 혜택을 전하기 위해, 아래 내용에 따라 광고성 정보 수신 동의를 받고 있습니다. 이 동의는 선택 사항이며, 동의하지 않아도 회원가입과 기본 서비스는 그대로 이용할 수 있습니다.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제1조 (목적)</h3>
          <p>본 동의서는 &quot;회사&quot;가 운영하는 부동산인 서비스에서 이벤트, 할인 혜택, 신규 기능 소식 등 영리 목적의 광고성 정보를 &quot;회원&quot;에게 전송하는 데 필요한 사항과, &quot;회원&quot;이 이를 받거나 거부할 수 있는 권리를 안내하는 것을 목적으로 합니다.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제2조 (동의 항목)</h3>

          <p className="font-semibold text-gray-900 mt-4 mb-2">2.1 수신 정보</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>이벤트·프로모션 참여 안내</li>
            <li>유료서비스 결제 할인 및 쿠폰 지급 소식</li>
            <li>신규 서비스·기능 출시 및 업데이트 안내</li>
            <li>회원님의 관심 조건에 맞춘 채용공고·현장 추천</li>
          </ul>

          <p className="font-semibold text-gray-900 mt-4 mb-2">2.2 발송 채널</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>문자 메시지(SMS/LMS)</li>
            <li>카카오 알림톡·친구톡</li>
            <li>이메일</li>
            <li>앱·웹 푸시 알림</li>
          </ul>

          <p className="font-semibold text-gray-900 mt-4 mb-2">2.3 발송 시간</p>
          <p>&quot;회사&quot;는 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 제50조의 취지에 따라 오후 9시부터 다음 날 오전 8시까지는 광고성 정보를 보내지 않습니다. 다만 &quot;회원&quot;이 야간 수신에 대해 별도로 동의한 경우에는 예외로 합니다.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제3조 (수집·이용 항목 및 목적)</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">수집·이용 항목</th>
                  <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">이용 목적</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-4 py-3 font-medium">이름, 휴대폰번호, 이메일, 회원유형</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">광고성 정보(이벤트·혜택·신규 서비스·맞춤 추천) 발송</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제4조 (보유 및 이용 기간)</h3>
          <p>&quot;회사&quot;는 &quot;회원&quot;이 동의를 철회하거나 회원 탈퇴를 할 때까지 위 정보를 광고성 정보 발송 목적으로 보유·이용하며, 그 사유가 생기면 해당 정보를 지체 없이 파기합니다.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제5조 (동의를 거부할 권리)</h3>
          <p>&quot;회원&quot;은 본 동의를 거부할 수 있습니다. 거부하더라도 회원가입이나 채용공고 열람·지원 등 기본 서비스 이용에는 아무런 제한이 없으며, 이벤트·할인 소식을 받아볼 수 없다는 점만 달라집니다.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제6조 (동의 철회 방법)</h3>
          <p>&quot;회원&quot;은 언제든지 아래 방법으로 수신 동의를 철회할 수 있으며, &quot;회사&quot;는 요청을 받은 즉시 발송 대상에서 제외합니다.</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>6.1 마이페이지 또는 고객센터</strong>: 마이페이지나 고객센터(onsia777@gmail.com, 1555-1245)를 통해 수신 거부를 요청할 수 있습니다.</li>
            <li><strong>6.2 수신 메시지 내 안내</strong>: 광고성 메시지마다 수신거부 방법을 함께 안내하며, 이를 통해 바로 거부할 수 있습니다.</li>
            <li><strong>6.3 개인정보 보호책임자 연락</strong>: 아래 개인정보 보호책임자에게 연락해 철회를 요청할 수 있습니다.</li>
          </ol>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 my-4">
            <div className="space-y-2 text-sm">
              <p className="font-bold text-blue-900 mb-3">개인정보 보호책임자</p>
              <p><strong className="text-blue-900">성명</strong>: 연대겸</p>
              <p><strong className="text-blue-900">직책</strong>: 대표이사</p>
              <p><strong className="text-blue-900">이메일</strong>: onsia777@gmail.com</p>
              <p><strong className="text-blue-900">대표전화</strong>: 1555-1245</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">수신 동의 여부 정기 확인</h3>
          <p>&quot;회사&quot;는 「정보통신망 이용촉진 및 정보보호 등에 관한 법률 시행령」의 취지에 따라, 수신에 동의한 &quot;회원&quot;에게 2년마다 동의 일자와 수신 동의 유지 여부를 확인하는 안내를 보내드립니다.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">부칙</h3>
          <p>본 동의서는 2026년 10월 1일부터 시행합니다.</p>

        </div>
  );
}
