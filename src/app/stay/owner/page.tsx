import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, ClipboardPenLine, Home } from 'lucide-react';
import Header from '@/components/shared/Header';
import OwnerLeadForm from '@/components/stay/OwnerLeadForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '호스트 등록 안내 | 부인 STAY',
  description: '직접 공간을 등록하거나 운영자의 도움을 받아 등록 초안을 준비하세요.',
};

const SOURCE_PATTERN = /^[A-Za-z0-9_-]{1,30}$/;

function normalizeSource(value: string | string[] | undefined) {
  const source = Array.isArray(value) ? value[0] : value;
  return source && SOURCE_PATTERN.test(source) ? source : null;
}

export default async function StayOwnerPage({ searchParams }: { searchParams: Promise<{ src?: string | string[] }> }) {
  if (process.env.NEXT_PUBLIC_STAY_ENABLED !== 'true') redirect('/');
  const sourceCode = normalizeSource((await searchParams).src);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header variant="landing" />
      <main>
        <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 text-white">
          <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
            <p className="text-sm font-semibold tracking-[0.16em] text-blue-200">부인 STAY FOR HOSTS</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">내 공간을 등록하는 두 가지 방법</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">정보를 직접 입력하거나, 간단한 신청을 남기고 운영자의 도움을 받을 수 있습니다.</p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
          <section aria-label="등록 방법 선택" className="-mt-8 grid gap-4 md:grid-cols-2">
            <Link href="/stay/new?role=host" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-400">
              <Home className="h-8 w-8 text-blue-600" aria-hidden />
              <h2 className="mt-4 text-xl font-bold">직접 등록하기</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">사진과 공간 정보, 임대 조건을 직접 입력해 등록합니다.</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">등록 화면으로 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
            <a href="#assisted-registration" className="group rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm transition hover:border-blue-500">
              <ClipboardPenLine className="h-8 w-8 text-blue-600" aria-hidden />
              <h2 className="mt-4 text-xl font-bold">등록 도움 신청</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">기본 조건만 남기면 운영자가 연락해 사진과 조건을 확인하고 초안을 작성합니다.</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">간단히 신청하기 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </a>
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-bold">도움 신청 후 진행 순서</h2>
            <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['1', '기본 신청', '연락처와 주소, 희망 조건을 남깁니다.'],
                ['2', '사진·조건 확인', '운영자가 연락해 등록에 필요한 사진과 조건을 받습니다.'],
                ['3', '초안 작성', '제공받은 정보와 사진으로 공개 전 초안을 준비합니다.'],
                ['4', '호스트 확인', '내 등록 신청에서 정확한 초안을 확인하고 게시를 승인합니다.'],
              ].map(([number, title, description]) => (
                <li key={number} className="rounded-xl border border-slate-200 bg-white p-5">
                  <span className="text-sm font-bold text-blue-600">STEP {number}</span>
                  <h3 className="mt-2 font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm leading-6 text-slate-600">사진과 추가 자료는 신청 후 운영자가 안내한 방법으로 받습니다. 공개 전 초안에서 사진과 조건을 모두 확인할 수 있습니다.</p>
          </section>

          <section id="assisted-registration" className="mt-14 scroll-mt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><h2 className="text-2xl font-bold">등록 도움 신청</h2><p className="mt-2 text-sm text-slate-600">로그인한 호스트의 신청으로 안전하게 저장됩니다.</p></div>
              <Link href="/stay/requests" className="text-sm font-semibold text-blue-700 hover:underline">내 등록 신청 보기</Link>
            </div>
            <div className="mt-5"><OwnerLeadForm sourceCode={sourceCode} /></div>
          </section>
        </div>
      </main>
    </div>
  );
}
