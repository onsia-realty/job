import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '서비스 이용약관 | 부동산인',
  description: '부동산인(온시아 JOB) 서비스 이용약관',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">부동산<span className="text-cyan-600">인</span></Link>
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

          {/* 제1장 총칙 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">제1장 총칙</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제1조 (목적)</h3>
          <p>본 약관은 온시아 공인중개사(이하 &quot;회사&quot;)가 운영하는 부동산인 온라인 웹사이트 및 앱을 통하여 부동산 전문가 구인/구직, AI 콘텐츠 및 관련 제반 &quot;서비스&quot;를 제공함에 있어 이용 고객(이하 &quot;회원&quot;)과 &quot;회사&quot; 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제2조 (용어의 정의)</h3>
          <p>본 약관에서 사용하는 용어의 정의는 아래와 같습니다.</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;사이트 및 앱&quot;이라 함은 &quot;회사&quot;가 &quot;회원&quot;에게 서비스를 제공하기 위하여 운영하는 웹사이트, 모바일 앱 등 모든 매체를 통칭하며, 통합된 하나의 계정을 이용하여 서비스를 제공받을 수 있는 아래의 사이트를 말합니다.
              <ul className="list-disc pl-6 mt-1 space-y-1 text-gray-600">
                <li>부동산인 사이트: www.booin.co.kr</li>
                <li>부동산인 APP(Play Store / App Store): 준비 중</li>
              </ul>
            </li>
            <li>&quot;서비스&quot;라 함은 &quot;회사&quot;가 운영하는 &quot;사이트 및 앱&quot;을 통해 &quot;회원&quot;이 등록하는 자료 등을 각각의 목적에 맞게 분류·가공·집계하여 정보를 제공하는 서비스와 기타 관련된 모든 부대 서비스를 말합니다.</li>
            <li>&quot;회원&quot;이라 함은 &quot;회사&quot;가 운영하는 &quot;사이트 및 앱&quot;을 통하여 본 약관에 동의하고, &quot;회사&quot;와 이용계약을 체결하여 아이디(ID)를 부여받은 개인 또는 법인을 말합니다.</li>
            <li>&quot;구인회원&quot;이라 함은 공인중개사, 분양상담사 등 부동산 전문 인력을 채용하고자 구인공고를 등록하는 회원을 말합니다.</li>
            <li>&quot;구직회원&quot;이라 함은 부동산 관련 직종에 취업하고자 이력서를 등록하고 구인공고에 지원하는 회원을 말합니다.</li>
            <li>&quot;유료서비스&quot;라 함은 프리미엄 공고 노출(BASIC, 프리미엄, VIP, 슈페리어, 유니크 등), AI 부가서비스 등 회사가 유료로 제공하는 서비스를 말합니다.</li>
            <li>&quot;아이디(ID)&quot;라 함은 &quot;회원&quot; 식별과 서비스 이용을 위하여 &quot;회원&quot;이 직접 지정하고 &quot;회사&quot;가 부여하는 이메일 주소 또는 소셜 로그인 계정을 말합니다.</li>
            <li>&quot;비회원&quot;이라 함은 회원가입 절차를 거치지 않고 &quot;회사&quot;가 제공하는 서비스를 이용하거나 하려는 자를 말합니다.</li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제3조 (약관의 효력 및 개정)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>본 약관은 &quot;회사&quot;가 운영하는 &quot;사이트 및 앱&quot;을 통하여 이를 공지하거나 전자우편 및 기타의 방법으로 &quot;회원&quot;에게 통지함으로써 효력이 발생됩니다.</li>
            <li>&quot;회사&quot;는 관련 법규를 준수하는 범위 내에서 본 약관을 개정할 수 있으며, 개정 시 적용일 최소 7일 전부터 서비스 내 공지 또는 통지합니다.</li>
            <li>다만, &quot;회원&quot;에게 불리한 조건으로 개정될 경우 최소 15일 이상의 사전 유예기간을 두고 공지하며, 개정 전·후 내용을 명확하게 비교하여 &quot;회원&quot;이 이해하기 쉽도록 표시합니다.</li>
            <li>&quot;회원&quot;이 약관 공지 후 유예기간 내에 별도의 의사표시를 하지 않을 경우 개정된 약관에 동의한 것으로 간주합니다.</li>
            <li>&quot;회원&quot;은 개정된 약관에 동의하지 않을 경우 회원 탈퇴(가입 해지)를 요청할 수 있습니다.</li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제4조 (약관 외 준칙)</h3>
          <p>본 약관에서 규정하지 않은 사항에 관해서는 전기통신기본법, 전기통신사업법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 전자상거래 등에서의 소비자보호에 관한 법률, 직업안정법, 기타 관련 법령의 규정에 따릅니다.</p>

          {/* 제2장 서비스 이용 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">제2장 서비스 이용</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제5조 (이용계약의 성립)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>서비스 이용계약은 &quot;회사&quot;가 제공하는 서비스를 이용하고자 하는 자(이하 &quot;가입신청자&quot;)가 본 약관의 내용에 동의하고 이용 신청을 하며, &quot;회사&quot;가 이를 승낙함으로써 성립됩니다.</li>
            <li>&quot;가입신청자&quot;가 이용계약 시 &quot;사이트 및 앱&quot;상의 &quot;동의함&quot; 버튼을 누르면 본 약관 및 개인정보처리방침에 대하여도 동의한 것으로 간주합니다.</li>
            <li>소셜 로그인(카카오, 구글 등)을 통한 가입 시에도 본 약관이 동일하게 적용됩니다.</li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제6조 (이용신청의 승낙과 제한)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회사&quot;는 &quot;가입신청자&quot;의 가입 승낙 처리 시 특별한 경우를 제외하고 신청 순서에 따라 승낙하는 것을 원칙으로 합니다.</li>
            <li>&quot;회사&quot;는 다음 각 호에 해당하는 이용계약 신청에 대하여 이를 승낙하지 않을 수 있습니다.
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>실명이 아니거나 타인의 명의를 도용하여 신청한 경우</li>
                <li>입력한 내용 중 허위 정보를 기재하여 신청한 경우</li>
                <li>현행법규에 위배되는 내용이나 사회의 미풍양속을 저해할 목적으로 신청한 경우</li>
                <li>&quot;회사&quot;의 권한으로 회원자격을 상실한 적이 있는 회원이 재가입한 경우</li>
                <li>만 14세 미만의 청소년이 가입을 신청한 경우</li>
                <li>기타 &quot;회사&quot;가 서비스 운영상 필요하다고 인정되는 경우</li>
              </ul>
            </li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제7조 (서비스의 내용)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회사&quot;는 다음 각 호의 서비스를 제공합니다.
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>공인중개사·분양상담사 구인공고 등록 및 열람 서비스</li>
                <li>이력서 등록 및 관리, 구인구직 매칭 서비스</li>
                <li>AI 기반 부동산 뉴스·콘텐츠(BOOIN NEWS TOON, AI 실무비서 등) 서비스</li>
                <li>AI 프로필 사진 생성 서비스</li>
                <li>프리미엄 공고 노출 등 유료 부가서비스</li>
                <li>커뮤니티 및 네트워킹 서비스</li>
                <li>기타 &quot;회사&quot;가 추가 개발하거나 제휴를 통해 제공하는 일체의 서비스</li>
              </ul>
            </li>
            <li>&quot;회사&quot;는 서비스의 내용을 추가 또는 변경할 수 있으며, 이 경우 변경 내용을 &quot;회원&quot;에게 공지합니다.</li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제8조 (구인공고 등록 및 노출)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회원&quot;은 구인공고 등록 시 기업정보 또는 담당자 정보를 정확히 기재하여야 합니다.</li>
            <li>&quot;회원&quot;은 직업안정법 제34조 및 동법 시행령 제34조에 따른 거짓구인광고의 범위에 위반되지 않도록 채용공고를 작성하여야 하며, 다음 각 호의 광고를 게시할 수 없습니다.
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>구인을 가장하여 물품판매, 수강생 모집, 자금모집 등을 행하는 광고</li>
                <li>거짓 구인을 목적으로 구인자의 신원을 표시하지 않는 광고</li>
                <li>구인자가 제시한 직종, 고용형태, 근로조건 등이 응모할 때와 현저히 다른 광고</li>
                <li>기타 광고의 중요내용이 사실과 다른 광고</li>
              </ul>
            </li>
            <li>&quot;회원&quot;은 관련 법률에 의거하여 근로자의 모집 및 채용에 있어 남녀, 연령을 차별하여서는 아니됩니다.</li>
            <li>위 항을 위반한 경우 이에 대한 책임은 전적으로 &quot;회원&quot;에게 있습니다.</li>
            <li>&quot;회사&quot;는 &quot;회원&quot;이 등록한 구인공고를 &quot;회사&quot;가 정한 방법에 의해 노출할 수 있습니다.</li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제9조 (서비스 이용시간 및 제한)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회사&quot;는 특별한 사유가 없는 한 연중무휴, 1일 24시간 서비스를 제공합니다.</li>
            <li>&quot;회사&quot;는 시스템 점검, 장애 해결, 보수 작업 등이 발생한 경우 일시적으로 서비스를 중단할 수 있으며, 계획된 작업의 경우 사전에 &quot;회원&quot;에게 공지합니다.</li>
            <li>&quot;회사&quot;는 기간통신사업자의 서비스 중지, 기타 불가항력적 사유 등으로 서비스 제공이 불가능한 경우 서비스를 제한할 수 있습니다.</li>
            <li>유료서비스 이용자에게는 서비스 중단 기간만큼 이용기간을 연장하는 등의 방법으로 보상합니다.</li>
          </ol>

          {/* 제3장 유료서비스 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">제3장 유료서비스</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제10조 (유료서비스의 요금 및 결제)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>회원 가입과 기본 구인공고 등록은 무료입니다. 다만, 공고를 효과적으로 노출시키기 위한 유료옵션 및 AI 부가서비스는 유료로 제공될 수 있습니다.</li>
            <li>&quot;회사&quot;는 유료서비스의 요금 및 상세내용을 &quot;사이트 및 앱&quot;에 공시합니다.</li>
            <li>&quot;회사&quot;는 유료서비스의 요금을 서비스의 종류 및 기간에 따라 변경할 수 있습니다. 다만, 변경 이전에 적용 또는 계약한 금액은 소급하여 적용하지 않습니다.</li>
            <li>&quot;회원&quot;은 유료서비스 이용요금의 지급방법으로 &quot;회사&quot;가 정한 결제방법(신용카드, 계좌이체, 간편결제 등) 중 하나를 선택할 수 있습니다.</li>
            <li>유료서비스는 결제 완료 즉시 서비스가 개시되며, 선택한 상품에 따라 해당 기간 동안 제공됩니다.</li>
            <li>유료서비스 이용요금은 부가가치세를 포함한 금액으로 표시합니다.</li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제11조 (청약철회 및 취소)</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 my-4">
            <p className="font-bold text-blue-800 mb-2">유료서비스 취소 안내</p>
            <p className="text-blue-700 text-sm">본 유료서비스는 결제 완료 즉시 서비스 제공이 개시되며, 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따라 서비스 제공이 개시된 이후에는 청약철회가 제한될 수 있습니다.</p>
          </div>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회원&quot;은 유료서비스를 구매한 날로부터 7일 이내에 청약철회를 할 수 있습니다. 단, 서비스 이용이 개시된 경우에는 관련 법령에 따라 청약철회가 제한될 수 있습니다.</li>
            <li>다음 각 호에 해당하는 경우 청약철회가 제한됩니다.
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>유료서비스(프리미엄 공고 게시, 상단 노출, 배지 등)의 제공이 개시된 경우</li>
                <li>&quot;회원&quot;의 책임 있는 사유로 서비스가 멸실 또는 훼손된 경우</li>
                <li>&quot;회원&quot;의 사용 또는 일부 소비에 의하여 서비스의 가치가 현저히 감소한 경우</li>
              </ul>
            </li>
            <li>제1항 및 제2항에도 불구하고, 유료서비스의 내용이 표시·광고 내용과 다르거나 계약 내용과 다르게 이행된 경우, &quot;회원&quot;은 서비스를 제공받은 날부터 3개월 이내, 그 사실을 안 날로부터 30일 이내에 청약철회를 할 수 있습니다.</li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제12조 (환불)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회사&quot;는 원칙적으로 &quot;회원&quot;이 &quot;회사&quot;의 서비스 이용규정을 위반한 경우 이용료를 환불하지 않습니다.</li>
            <li>&quot;회사&quot;는 다음 각 호에 해당하는 경우 이용료를 환불합니다.
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>유료서비스 이용이 개시되지 않은 경우</li>
                <li>네트워크 또는 시스템 장애로 서비스 이용이 불가능한 경우</li>
                <li>유료서비스 신청 후 &quot;회원&quot; 사정에 의해 서비스가 취소될 경우</li>
              </ul>
            </li>
            <li>환불 금액은 유료이용 계약 당시 상품의 단가 기준으로 서비스 제공이 완료된 기간에 해당하는 비용을 일할 계산하여 차감한 잔액으로 산정합니다.</li>
            <li>환불을 받고자 하는 &quot;회원&quot;은 고객센터(onsia777@gmail.com) 또는 전화로 환불 요청을 해야 합니다.</li>
            <li>&quot;회사&quot;는 환불 요청 접수일로부터 3영업일 내에 환불 여부를 검토하고, 환불 결정 시 통지일로부터 3영업일 이내에 원결제수단으로 환불합니다.</li>
            <li>환불 지연 시 「전자상거래 등에서의 소비자보호에 관한 법률」 제18조에 따라 연 15%의 지연이자를 부과합니다.</li>
            <li>자세한 환불 정책은 <Link href="/refund" className="text-blue-600 hover:underline">환불·취소 정책</Link> 페이지에서 확인할 수 있습니다.</li>
          </ol>

          {/* 제4장 책임 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">제4장 책임</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제13조 (회사의 의무)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회사&quot;는 본 약관에서 정한 바에 따라 지속적, 안정적으로 서비스를 제공할 수 있도록 최선의 노력을 다합니다.</li>
            <li>&quot;회사&quot;는 서비스에 관련된 설비를 항상 운용할 수 있는 상태로 유지·보수하고, 장애가 발생하는 경우 지체 없이 이를 수리·복구합니다.</li>
            <li>&quot;회사&quot;는 서비스와 관련한 &quot;회원&quot;의 의견이나 불만사항이 접수되는 경우, 타당하다고 판단될 경우 적절한 조치를 취합니다.</li>
            <li>&quot;회사&quot;는 유료 결제와 관련한 결제 정보를 5년간 보존합니다.</li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제14조 (회원의 의무)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회원&quot;은 관계법령과 본 약관의 규정 및 &quot;회사&quot;가 공지·통지하는 사항을 준수하여야 합니다.</li>
            <li>&quot;회원&quot;은 서비스를 이용함으로써 얻은 정보를 채용 이외의 목적으로 &quot;회사&quot;의 사전 승낙 없이 복제, 송신, 출판, 배포하거나 영리목적으로 이용해서는 안 됩니다.</li>
            <li>&quot;회원&quot;에게 부여된 아이디(ID)와 비밀번호의 관리 소홀, 부정사용에 의하여 발생하는 모든 결과에 대한 책임은 &quot;회원&quot;에게 있습니다.</li>
            <li>&quot;회원&quot;은 서비스 이용 시 다음 각 호의 행위를 하여서는 안 됩니다.
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>허위 정보의 등록 또는 타인의 정보 도용</li>
                <li>범죄 행위를 목적으로 하거나 범죄행위와 관련된 행위</li>
                <li>공공질서 및 미풍양속에 위반되는 내용의 유포</li>
                <li>다른 &quot;회원&quot; 또는 제3자의 명예를 훼손하거나 모욕하는 행위</li>
                <li>타인의 지적재산권 등 권리를 침해하는 행위</li>
                <li>해킹행위 또는 바이러스의 유포 행위</li>
                <li>광고성 정보를 무단으로 계속 전송하는 행위</li>
                <li>서비스의 안정적인 운영에 지장을 주거나 줄 우려가 있는 행위</li>
              </ul>
            </li>
            <li>&quot;회원&quot;은 이용신청서의 기재내용 중 변경된 내용이 있을 경우 이를 &quot;회사&quot;에 통지하여야 합니다.</li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제15조 (부정확한 정보의 게시 금지)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회원&quot;은 모든 게시 기능을 통해 사실과 다르거나 확인되지 않은 내용, 타인을 오도하거나 명예를 훼손할 우려가 있는 내용을 게시해서는 안 됩니다.</li>
            <li>&quot;회사&quot;는 &quot;회원&quot;이 본 조항을 위반한 경우 사전 통보 없이 해당 게시물을 삭제·수정 또는 임시 조치할 수 있으며, 해당 &quot;회원&quot;의 서비스 이용을 제한할 수 있습니다.</li>
            <li>&quot;회원&quot;은 본인의 게시물에 포함된 정보가 사실과 다르거나 부정확한 경우 즉시 수정 또는 삭제하여야 하며, 이를 이행하지 않아 발생하는 모든 법적 책임은 &quot;회원&quot; 본인에게 있습니다.</li>
            <li>반복적 또는 악의적인 허위 게시가 확인될 경우 회원 자격을 박탈할 수 있습니다.</li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제16조 (비인가 프로그램 사용 금지)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회원&quot;은 &quot;회사&quot;가 제공 또는 승인하지 않은 자동화된 프로그램(크롤러, 봇, 매크로, 스크립트 등)을 이용하여 서비스를 접속하거나 이용해서는 안 됩니다.</li>
            <li>본 조항을 위반하는 경우 &quot;회사&quot;는 사전 통지 없이 서비스 이용을 일시 또는 영구적으로 제한하거나 회원 자격을 박탈할 수 있습니다.</li>
            <li>본 조항을 위반하여 &quot;회사&quot; 또는 제3자에게 손해가 발생한 경우, 해당 &quot;회원&quot;은 모든 법적 책임을 부담합니다.</li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제17조 (자료내용의 책임과 정보 수정 권한)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;자료&quot;라 함은 &quot;회원&quot;이 서비스를 이용하면서 등록한 구인공고, 이력서, 게시물 등을 말합니다.</li>
            <li>&quot;회원&quot;은 자료를 사실에 근거하여 성실하게 작성해야 하며, 자료의 내용이 사실이 아니거나 부정확하게 작성되어 발생하는 모든 책임은 &quot;회원&quot;에게 있습니다.</li>
            <li>&quot;회사&quot;는 &quot;회원&quot;이 등록한 자료에 오자, 탈자 또는 사회적 통념에 어긋나는 문구가 있을 경우 이를 수정할 수 있는 권한이 있습니다.</li>
            <li>타인으로부터 허위사실 및 명예훼손 등으로 삭제 요청이 접수된 경우 &quot;회사&quot;는 사전 통지 없이 해당 자료를 삭제할 수 있습니다.</li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제18조 (자료의 저작권 및 활용)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회사&quot;가 작성한 게시물 또는 저작물에 대한 저작권 및 기타 지적재산권은 &quot;회사&quot;에 귀속합니다.</li>
            <li>&quot;회원&quot;이 &quot;사이트 및 앱&quot; 내에 게시한 게시물의 저작권은 &quot;회원&quot;에게 귀속됩니다. 단, &quot;회원&quot;은 자신이 등록한 게시물에 대해 무상의 비독점적 사용권을 &quot;회사&quot;에 부여하며, 이 사용권은 &quot;회사&quot;가 서비스를 운영하는 동안 유효합니다.</li>
            <li>&quot;회사&quot;는 &quot;회원&quot;의 동의 없이 게시물을 서비스 이외에 영리적 목적으로 사용할 수 없습니다.</li>
            <li>&quot;회원&quot;이 입력한 정보는 구인구직 및 관련 동향의 통계 자료로 활용될 수 있으며, 개인을 식별할 수 있는 개인정보는 제외합니다.</li>
          </ol>

          {/* 제5장 계약 해지 및 이용 제한 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">제5장 계약 해지 및 이용 제한</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제19조 (회원의 계약 해지 및 서비스 중지)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회원&quot;은 언제든지 고객센터 또는 회원 탈퇴 메뉴를 통하여 이용계약을 종료할 수 있습니다.</li>
            <li>다음 각 호에 해당하는 경우 &quot;회사&quot;는 &quot;회원&quot;의 사전 동의 없이 계약 해지, 서비스 중지, 자료 삭제 조치를 취할 수 있습니다.
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>제14조(회원의 의무)에서 나열한 금지행위에 해당되는 경우</li>
                <li>허위 정보로 등록된 경우</li>
                <li>현행법에 위배되는 내용이나 범죄적 행위에 결부된다고 인정되는 경우</li>
                <li>타인의 저작권 또는 권리를 침해하는 내용인 경우</li>
                <li>유료서비스 이용 요금을 납부하지 않은 경우</li>
                <li>기타 관계법규에 위배되거나 서비스 운영에 필요하다고 판단되는 경우</li>
              </ul>
            </li>
            <li>&quot;회사&quot;가 계약 해지 등의 조치를 한 경우, 해당 사유 및 내용을 이메일, 전화, 문자 등으로 통지합니다.</li>
            <li>&quot;회원&quot;은 해당 조치에 대한 이의제기를 할 수 있으며, 이의제기 민원처리 담당부서 연락처는 다음과 같습니다.
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2 text-sm">
                <p className="font-bold text-gray-700">민원처리 담당부서</p>
                <p>부동산인 고객센터</p>
                <p>메일: onsia777@gmail.com</p>
                <p>전화: 1555-1245</p>
              </div>
            </li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제20조 (서비스 이용 제한)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회사&quot;는 &quot;회원&quot;이 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 경고, 일시정지, 영구이용정지 등의 조치를 취할 수 있습니다.</li>
            <li>&quot;회사&quot;가 이용을 제한·정지한 경우, &quot;회원&quot;의 귀책사유에 의한 것이면 이미 결제한 유료서비스 이용료는 환불하지 않습니다.</li>
          </ol>

          {/* 제6장 정보 제공 및 광고 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">제6장 정보 제공 및 광고</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제21조 (정보의 제공 및 광고의 게재)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회사&quot;는 &quot;회원&quot;에게 서비스 이용에 필요한 정보 및 서비스 안내 등을 전자우편, 푸시 알림 등의 방법으로 제공할 수 있습니다.</li>
            <li>&quot;회사&quot;는 서비스 화면, 홈페이지 등에 광고를 게재할 수 있으며, 서비스를 이용하는 &quot;회원&quot;은 서비스 이용 시 노출되는 광고 게재에 대해 동의하는 것으로 간주합니다.</li>
            <li>&quot;회사&quot;는 광고주의 판촉활동에 &quot;회원&quot;이 참여하거나 교신 또는 거래를 함으로써 발생하는 손실과 손해에 대해 책임을 지지 않습니다.</li>
          </ol>

          {/* 제7장 면책조항 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">제7장 면책조항</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제22조 (손해배상 및 면책)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회사&quot;는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
            <li>&quot;회사&quot;는 &quot;회원&quot;의 고의·과실 및 귀책사유로 인한 서비스 이용의 장애 및 손해에 대하여 책임을 지지 않습니다.</li>
            <li>&quot;회사&quot;는 &quot;회원&quot;이 서비스에 게재한 정보, 자료, 사실의 신뢰도, 정확성 등 내용에 대해서는 보증하지 않습니다.</li>
            <li>&quot;회사&quot;는 &quot;회원&quot; 간 또는 &quot;회원&quot;과 제3자 간에 서비스를 매개로 발생한 분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임이 없습니다.</li>
            <li>&quot;회원&quot;이 본 약관을 위반한 행위로 &quot;회사&quot; 및 제3자에게 손해를 입힌 경우 &quot;회원&quot;은 그 손해를 배상할 책임이 있습니다.</li>
            <li>&quot;회사&quot;는 무료로 제공하는 서비스의 이용과 관련하여 개인정보처리방침에서 정하는 내용에 위반하지 않은 한 어떠한 손해도 책임지지 않습니다.</li>
          </ol>

          {/* 제8장 개인정보보호 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">제8장 개인정보보호</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제23조 (개인정보보호)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회사&quot;는 &quot;회원&quot;의 개인정보보호를 위하여 노력하며, 정보통신망 이용촉진 및 정보보호 등에 관한 법률에 따르고 &quot;사이트 및 앱&quot;에 <Link href="/privacy" className="text-blue-600 hover:underline">개인정보처리방침</Link>을 고지합니다.</li>
            <li>&quot;회사&quot;가 &quot;회원&quot;의 개인정보를 제3자에게 제공하거나 활용할 때에는 관련 법령에 따라 사전에 동의를 얻어야 합니다.</li>
          </ol>

          {/* 제9장 일반 사항 */}
          <h2 className="text-lg font-black text-blue-900 mt-12 mb-6 pb-2 border-b-2 border-blue-600">제9장 일반 사항</h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">제24조 (분쟁의 해결)</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>&quot;회사&quot;와 &quot;회원&quot;은 서비스와 관련하여 발생한 분쟁을 원만하게 해결하기 위하여 필요한 노력을 하여야 합니다.</li>
            <li>전항의 노력에도 불구하고 분쟁에 대해 소송이 제기될 경우, 대한민국 법을 적용하며, &quot;회사&quot;의 본사 소재지를 관할하는 법원을 전속관할법원으로 합니다.</li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">부칙</h3>
          <p>본 약관은 2026년 2월 24일부터 시행합니다.</p>

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
          <p>주소: 서울특별시 송파구 중대로 197, 3동 305층 A169(가락동) | 대표전화: <a href="tel:1555-1245" className="hover:text-gray-600">1555-1245</a></p>
          <p>업태: 정보통신업 | 종목: 소프트웨어 개발 및 공급업, 포털 및 인터넷 정보 매개 서비스업</p>
          <p>고객센터: onsia777@gmail.com</p>
        </div>
      </main>
    </div>
  );
}
