import type { Metadata } from 'next';
import Link from 'next/link';

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

        {/* 핵심 요약 카드 */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wider">수집 항목</p>
            <p className="text-lg font-extrabold text-blue-900">최소 수집 원칙</p>
            <p className="text-sm text-blue-700 mt-1">서비스 제공에 필요한 정보만 수집</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wider">보유 기간</p>
            <p className="text-lg font-extrabold text-blue-900">회원 탈퇴 시 즉시 파기</p>
            <p className="text-sm text-blue-700 mt-1">법령에 따른 보존 기간 예외</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wider">이용자 권리</p>
            <p className="text-lg font-extrabold text-blue-900">열람·수정·삭제 보장</p>
            <p className="text-sm text-blue-700 mt-1">언제든 개인정보 관리 가능</p>
          </div>
        </div>

        <div className="prose prose-gray max-w-none text-[15px] leading-relaxed">

          <p className="text-gray-600 mb-6">
            온시아 공인중개사(이하 &quot;회사&quot;)는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.
          </p>

          {/* 1. 처리 목적 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">1. 개인정보의 처리 목적</h2>
          <p className="text-gray-600 mb-3">회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">처리 목적</th>
                  <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">상세 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-4 py-3 font-medium">회원가입 및 관리</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">회원제 서비스 이용에 따른 본인확인, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="border border-gray-200 px-4 py-3 font-medium">서비스 제공</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">구인·구직 매칭 서비스 제공, 이력서 등록 및 공고 게시, 유료서비스 제공 및 요금 결제·정산</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-3 font-medium">마케팅 및 광고 활용</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">신규 서비스 안내, 이벤트 정보 제공, 맞춤형 서비스 제공 (별도 동의 시)</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="border border-gray-200 px-4 py-3 font-medium">민원 처리</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. 수집 항목 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">2. 수집하는 개인정보 항목 및 수집 방법</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">2.1 필수 수집 항목</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">구분</th>
                  <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">수집 항목</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-4 py-3 font-medium">회원가입</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">이메일 주소, 비밀번호, 이름, 회원유형(구직자/구인자)</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="border border-gray-200 px-4 py-3 font-medium">이력서 등록 (구직자)</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">이름, 생년월일, 성별, 연락처(전화번호), 이메일, 증명사진, 자격증 번호, 경력사항, 희망 근무조건(지역, 업종, 급여), 자기소개</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-3 font-medium">공고 등록 (구인자)</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">회사명, 대표자명, 사업장 주소, 담당자 연락처, 사업자등록번호</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="border border-gray-200 px-4 py-3 font-medium">유료서비스 결제</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">결제 수단 정보(신용카드번호, 은행계좌정보 등)는 PG사(KG이니시스)를 통해 처리되며, 회사는 결제 결과(거래번호, 결제일시, 결제금액)만 수집합니다.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">2.2 선택 수집 항목</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>프로필 사진, AI 프로필 사진</li>
            <li>DNA 성향 분석 결과 (위험감수, 사교성, 논리력, 회복력 등)</li>
            <li>마케팅 수신 동의 정보</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">2.3 자동 수집 항목</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>IP 주소, 쿠키, 서비스 이용 기록, 방문 일시, 기기 정보(OS, 브라우저 종류)</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">2.4 수집 방법</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>회원가입 및 서비스 이용 과정에서 이용자가 직접 입력</li>
            <li>서비스 이용 과정에서 자동으로 생성·수집</li>
          </ul>

          {/* 3. 보유 기간 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">3. 개인정보의 처리 및 보유 기간</h2>

          <p className="text-gray-600 mb-3">회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용 기간 내에서 개인정보를 처리·보유합니다.</p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">보유 항목</th>
                  <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">보유 기간</th>
                  <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">근거 법령</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-4 py-3 font-medium">회원정보</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">회원 탈퇴 시 즉시 파기</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">-</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="border border-gray-200 px-4 py-3 font-medium">계약 또는 청약철회에 관한 기록</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">5년</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">전자상거래법</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-3 font-medium">대금결제 및 재화 등의 공급에 관한 기록</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">5년</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">전자상거래법</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="border border-gray-200 px-4 py-3 font-medium">소비자 불만 또는 분쟁처리에 관한 기록</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">3년</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">전자상거래법</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-3 font-medium">웹사이트 방문 기록</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">3개월</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">통신비밀보호법</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. 제3자 제공 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">4. 개인정보의 제3자 제공</h2>

          <p className="text-gray-600 mb-3">회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>

          <ul className="list-disc pl-6 space-y-2">
            <li><strong>이용자의 동의를 받은 경우</strong>: 구직자가 특정 공고에 지원 시, 해당 구인자에게 이력서 정보(이름, 연락처, 경력 등) 제공</li>
            <li><strong>법률의 규정에 의한 경우</strong>: 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>

          {/* 5. 위탁 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">5. 개인정보 처리의 위탁</h2>

          <p className="text-gray-600 mb-3">회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">수탁업체</th>
                  <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">위탁 업무 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-4 py-3 font-medium">KG이니시스</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">신용카드, 계좌이체 등 결제 처리</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="border border-gray-200 px-4 py-3 font-medium">Supabase Inc.</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">클라우드 서비스 운영 및 데이터 저장</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-3 font-medium">Google LLC</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">AI 프로필 사진 생성 (Google Gemini)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 6. 권리·의무 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">6. 정보주체의 권리·의무 및 행사 방법</h2>

          <p className="text-gray-600 mb-3">이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.</p>

          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>개인정보 열람 요구</strong>: 회사가 보유하고 있는 개인정보를 열람할 수 있습니다.</li>
            <li><strong>개인정보 정정·삭제 요구</strong>: 개인정보에 오류가 있을 경우 정정 또는 삭제를 요구할 수 있습니다.</li>
            <li><strong>개인정보 처리정지 요구</strong>: 개인정보의 처리 정지를 요구할 수 있습니다.</li>
            <li><strong>회원 탈퇴</strong>: 서비스 내 설정 또는 고객센터를 통해 회원 탈퇴를 요청할 수 있으며, 탈퇴 즉시 개인정보가 파기됩니다.</li>
          </ol>

          <p className="text-gray-600 mt-3">권리 행사는 이메일(onsia777@gmail.com)을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.</p>

          {/* 7. 파기 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">7. 개인정보의 파기 절차 및 방법</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">7.1 파기 절차</h3>
          <p className="text-gray-600 mb-3">이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 내부 방침 및 기타 관련 법령에 따라 일정 기간 저장된 후 혹은 즉시 파기됩니다.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">7.2 파기 방법</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>전자적 파일 형태</strong>: 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제</li>
            <li><strong>종이에 출력된 개인정보</strong>: 분쇄기로 분쇄하거나 소각하여 파기</li>
          </ul>

          {/* 8. 안전성 확보 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">8. 개인정보의 안전성 확보 조치</h2>

          <p className="text-gray-600 mb-3">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>

          <ul className="list-disc pl-6 space-y-2">
            <li><strong>개인정보 암호화</strong>: 비밀번호 등 중요 개인정보는 암호화되어 저장·관리되며, 데이터 전송 시 SSL/TLS를 통해 암호화합니다.</li>
            <li><strong>해킹 등에 대비한 기술적 대책</strong>: 백신 프로그램 등을 이용하여 컴퓨터 바이러스에 의한 피해를 방지하기 위한 조치를 취하고 있습니다.</li>
            <li><strong>접근 제한</strong>: 개인정보를 처리하는 시스템에 대한 접근권한의 부여·변경·말소를 통하여 개인정보에 대한 접근통제를 위한 필요한 조치를 하고 있습니다.</li>
            <li><strong>접속 기록의 보관</strong>: 개인정보처리시스템에 접속한 기록(웹 로그, 요약정보 등)을 최소 1년 이상 보관·관리합니다.</li>
          </ul>

          {/* 9. 쿠키 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">9. 쿠키(Cookie)의 설치·운영 및 거부</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">9.1 쿠키의 사용 목적</h3>
          <p className="text-gray-600 mb-3">이용자에게 최적화된 정보 제공을 위해 쿠키를 사용합니다. 쿠키는 웹사이트를 운영하는데 이용되는 서버가 이용자의 브라우저에 보내는 소량의 정보이며, 이용자의 컴퓨터에 저장됩니다.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">9.2 쿠키의 거부 방법</h3>
          <p className="text-gray-600 mb-3">이용자는 웹브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다. 다만, 쿠키 저장을 거부할 경우 로그인이 필요한 일부 서비스의 이용이 어려울 수 있습니다.</p>

          {/* 10. 보호책임자 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">10. 개인정보 보호책임자</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 my-4">
            <div className="space-y-2 text-sm">
              <p className="font-bold text-blue-900 mb-3">개인정보 보호책임자</p>
              <p><strong className="text-blue-900">성명</strong>: 연대겸</p>
              <p><strong className="text-blue-900">직책</strong>: 대표이사</p>
              <p><strong className="text-blue-900">이메일</strong>: onsia777@gmail.com</p>
              <p><strong className="text-blue-900">대표전화</strong>: 1555-1245</p>
            </div>
          </div>

          <p className="text-gray-600 mt-3">이용자는 회사의 서비스를 이용하면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해 지체 없이 답변 및 처리해드리겠습니다.</p>

          {/* 11. 구제방법 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">11. 권익침해 구제방법</h2>

          <p className="text-gray-600 mb-3">개인정보침해로 인한 구제를 받기 위하여 아래의 기관에 분쟁해결이나 상담 등을 신청할 수 있습니다.</p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 my-4">
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-bold text-blue-900">개인정보분쟁조정위원회</p>
                <p className="text-gray-600">전화: 1833-6972 | 홈페이지: www.kopico.go.kr</p>
              </div>
              <div>
                <p className="font-bold text-blue-900">개인정보침해신고센터 (한국인터넷진흥원)</p>
                <p className="text-gray-600">전화: 118 | 홈페이지: privacy.kisa.or.kr</p>
              </div>
              <div>
                <p className="font-bold text-blue-900">대검찰청 사이버수사과</p>
                <p className="text-gray-600">전화: 1301 | 홈페이지: www.spo.go.kr</p>
              </div>
              <div>
                <p className="font-bold text-blue-900">경찰청 사이버수사국</p>
                <p className="text-gray-600">전화: 182 | 홈페이지: ecrm.cyber.go.kr</p>
              </div>
            </div>
          </div>

          {/* 12. 변경 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">12. 개인정보 처리방침 변경</h2>

          <p className="text-gray-600 mb-3">이 개인정보처리방침은 2026년 2월 24일부터 적용됩니다. 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>

        </div>

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
          <p><strong className="text-gray-500">온시아 공인중개사</strong> | 대표이사: 연대겸 | 사업자등록번호: 846-23-01501</p>
          <p>주소: 서울특별시 송파구 중대로 197, 3동 305층 A169(가락동)</p>
          <p>고객센터: onsia777@gmail.com | 업태: 정보통신업 | 종목: 소프트웨어 개발 및 공급업</p>
        </div>
      </main>
    </div>
  );
}
