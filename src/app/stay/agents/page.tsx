import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/shared/Header';

export const dynamic = 'force-dynamic';

export default function StayAgentsPage() {
  if (process.env.NEXT_PUBLIC_STAY_ENABLED !== 'true') redirect('/');
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header variant="landing" />
      <main className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
        <Link href="/stay" className="text-sm text-slate-500">단기임대 홈으로</Link>
        <p className="mt-10 text-sm font-semibold text-cyan-700">개업공인중개사를 위한 공간</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">안심중개사로 시작하세요</h1>
        <p className="mt-5 max-w-xl leading-7 text-slate-500">사무소 정보를 확인하고, 보유한 단기임대 매물을 등록하세요. 등록한 매물과 임대 진행 상태를 한곳에서 관리할 수 있습니다.</p>
        <div className="mt-10 grid gap-6 border-y border-slate-200 py-8 sm:grid-cols-3">
          {[
            ['01', '사무소 정보 확인', '내 정보에서 개설등록번호와 사무소 소속 확인을 진행합니다.'],
            ['02', '승인된 정보로 표기', '승인한 사무소 정보로 등록번호·대표자·연락처 등을 채웁니다.'],
            ['03', '매물 등록과 관리', '광고할 권한이 있는 매물의 가격과 계약 조건을 직접 등록합니다.'],
          ].map(([step, title, text]) => (
            <section key={step}><p className="mb-4 text-sm text-cyan-700">{step}</p><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></section>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/stay/new?role=agent" className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white">중개사 매물 등록 →</Link>
          <Link href="/agent/mypage/verification#broker" className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold">사무소 인증 확인</Link>
        </div>
        <p className="mt-8 max-w-2xl text-xs leading-6 text-slate-500">확인 범위는 계정의 중개사무소 소속과 등록 정보입니다. 매물의 권리관계, 현재 공실 여부, 계약 이행이나 보증금 반환을 보증하지 않습니다. 계약 전 해당 매물과 조건을 담당 중개사에게 확인해 주세요.</p>
      </main>
    </div>
  );
}
