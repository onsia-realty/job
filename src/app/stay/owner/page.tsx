import { redirect } from 'next/navigation';
import {
  Home,
  CalendarClock,
  BadgeCheck,
  Gift,
  FileText,
  UserCheck,
  Megaphone,
  KeyRound,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import OwnerLeadForm from '@/components/stay/OwnerLeadForm';

export const dynamic = 'force-dynamic';

// QR 캠페인 코드 화이트리스트.
// - 036 의 source_code 는 VARCHAR(30) 이므로 길이를 30 으로 자른다.
// - 화면에 그대로 렌더하지 않고 폼 hidden 값으로만 흘려보낸다(XSS/노이즈 차단).
const SRC_PATTERN = /^[A-Za-z0-9_-]{1,30}$/;

function normalizeSrc(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  return SRC_PATTERN.test(value) ? value : null;
}

const BENEFITS = [
  {
    icon: CalendarClock,
    title: '공실 기간을 단축합니다',
    body: '장기 세입자를 기다리는 동안 비어 있는 기간을 단기 계약으로 메웁니다. 다음 장기 계약이 잡히면 그때 정리하면 됩니다.',
  },
  {
    icon: BadgeCheck,
    title: '검증된 중개사가 처리합니다',
    body: '온시아잡에 등록된 공인중개사가 배정되어 계약과 입주 관리를 맡습니다. 플랫폼은 중개를 직접 하지 않고, 소유주와 중개사를 연결하는 역할만 합니다.',
  },
  {
    icon: Gift,
    title: '등록은 무료입니다',
    body: '매물 등록과 노출에 소유주가 부담하는 비용은 없습니다. 등록 후 진행 여부는 소유주가 결정합니다.',
  },
];

const STEPS = [
  { icon: FileText, title: '매물 접수', body: '아래 양식으로 위치와 희망 조건을 남깁니다.' },
  { icon: UserCheck, title: '담당 중개사 배정', body: '해당 지역 공인중개사가 배정되어 연락드립니다.' },
  { icon: Megaphone, title: '매물 노출', body: '확인된 정보로 단기임대 매물이 등록·노출됩니다.' },
  { icon: KeyRound, title: '입주 계약', body: '중개사가 조건 조율과 임대차 계약을 진행합니다.' },
];

const FAQS = [
  {
    q: '소유주가 내는 수수료가 있나요?',
    a: '매물 등록과 노출에 드는 비용은 없습니다. 임대차 계약이 성사될 경우의 중개보수는 공인중개사법이 정한 요율에 따라 담당 중개사와 협의합니다.',
  },
  {
    q: '입주자 관리는 누가 하나요?',
    a: '배정된 담당 공인중개사가 문의 응대, 조건 조율, 계약 체결, 입주·퇴거 절차를 진행합니다. 온시아잡은 중개 당사자가 아닙니다.',
  },
  {
    q: '언제부터 노출되나요?',
    a: '접수 후 1영업일 이내에 담당 중개사가 연락드리며, 정보 확인과 소유주 확인이 끝나는 대로 노출됩니다.',
  },
];

export default async function StayOwnerPage({
  searchParams,
}: {
  searchParams: Promise<{ src?: string | string[] }>;
}) {
  // /stay 와 동일한 플래그 가드
  const enabled = process.env.NEXT_PUBLIC_STAY_ENABLED === 'true';
  if (!enabled) {
    redirect('/');
  }

  const params = await searchParams;
  const sourceCode = normalizeSrc(params?.src);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="landing" />

      {/* ---------- 히어로 ---------- */}
      <section className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-14 sm:py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Home className="w-3.5 h-3.5" />
            소유주 매물 등록
          </div>
          <h1 className="mt-4 text-2xl sm:text-4xl font-bold leading-snug">
            집이 비어 있나요?
            <br />
            단기 임대로 공백 없이 돌리세요
          </h1>
          <p className="mt-4 text-sm sm:text-base text-white/85 leading-relaxed">
            다음 장기 세입자를 기다리는 동안의 공백을 단기 계약으로 채웁니다.
            <br className="hidden sm:block" />
            접수하시면 지역 공인중개사가 배정되어 계약과 입주 관리를 맡습니다.
          </p>
          <a
            href="#owner-lead-form"
            className="mt-7 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
          >
            무료로 매물 접수하기
          </a>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 pb-20">
        {/* ---------- 설득 3블록 ---------- */}
        <section className="-mt-8 sm:-mt-10 grid gap-4 sm:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="mt-3 text-base font-bold text-slate-900">{title}</h2>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </section>

        {/* ---------- 진행 절차 4스텝 ---------- */}
        <section className="mt-14">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">진행 절차</h2>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="rounded-2xl bg-white p-5 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <Icon className="w-4 h-4 text-cyan-600" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- 접수 폼 ---------- */}
        <section id="owner-lead-form" className="mt-14 scroll-mt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">매물 접수</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            아래 정보만 남겨주시면 담당 중개사가 1영업일 이내에 연락드립니다.
          </p>
          <div className="mt-5">
            <OwnerLeadForm sourceCode={sourceCode} />
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="mt-14">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">자주 묻는 질문</h2>
          <div className="mt-4 space-y-2">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group rounded-xl bg-white border border-slate-200 p-4">
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 flex items-center justify-between gap-3">
                  {q}
                  <span className="text-slate-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="mt-10 text-xs text-slate-400 leading-relaxed">
          온시아잡은 통신판매중개자로서 임대차 계약의 당사자가 아니며, 계약과 입주 관리는 배정된 개업공인중개사가 수행합니다.
        </p>
      </main>
    </div>
  );
}
