'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, ChevronDown, ChevronRight, Home, MapPin, MessageCircle, Search, SlidersHorizontal } from 'lucide-react';
import { STAY_HOME_CATEGORIES, stayCategoryHref } from '@/lib/stay/home-categories';
import StayCategoryArt from '@/components/stay/StayCategoryArt';

const REGIONS = ['광교', '영통', '망포', '동탄', '수원', '용인'];
const STEPS = [
  { number: '01', icon: MapPin, title: '내 생활에 맞는 위치 찾기', description: '출퇴근, 이사 사이의 쉼표, 새로운 동네에서의 시작. 원하는 지역을 검색하거나 지도로 살펴보세요.' },
  { number: '02', icon: SlidersHorizontal, title: '사진과 임대 조건 비교하기', description: '보증금과 임대료, 관리비를 함께 살펴보세요. 입주 가능일과 최소 임대 기간도 확인해 주세요.' },
  { number: '03', icon: MessageCircle, title: '등록자에게 직접 문의하기', description: '마음에 드는 공간을 찾았다면 문의를 남겨보세요. 입주 일정과 계약 조건은 등록자와 확인합니다.' },
];
const FAQS = [
  { question: '부인 STAY에서는 어떻게 집을 구하나요?', answer: '지역이나 공간 유형으로 매물을 찾고, 상세 페이지에서 사진과 임대 조건을 비교한 뒤 문의를 남길 수 있습니다. 현재는 호스트 등록과 게스트 문의를 중심으로 운영하며, 사이트 내 예약·결제 기능은 준비 중입니다.' },
  { question: '얼마나 짧게 머무를 수 있나요?', answer: '최소 임대 기간과 입주 가능일은 매물마다 다릅니다. 상세 페이지에 표시된 조건을 확인하고, 원하는 날짜에 실제 입주할 수 있는지는 등록자에게 문의해 주세요. 임대료 외 관리비와 보증금, 별도 비용도 계약 전에 함께 확인해 주세요.' },
  { question: '호스트와 안심중개사는 어떻게 다른가요?', answer: '호스트는 임대인으로서 직접 공간과 임대 조건을 등록합니다. 안심중개사는 중개사무소 정보와 소속을 확인하는 절차를 거쳐 중개 매물을 등록합니다. 중개사 확인이 모든 매물의 권리관계나 보증금 반환을 보장하는 것은 아니므로 개별 계약 조건을 확인해야 합니다.' },
  { question: '제가 가진 공간도 등록할 수 있나요?', answer: '호스트 등록 화면에서 공간 정보, 사진, 임대 조건을 입력할 수 있습니다. 적법하게 임대할 권한이 있는 공간을 등록해 주세요. 개업공인중개사라면 안심중개사 안내에서 중개사 등록 절차를 확인할 수 있습니다.' },
];

export default function StayHomeClient() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const needle = q.trim();
    router.push(needle ? `/stay/list?q=${encodeURIComponent(needle)}` : '/stay/list');
  };

  return (
    <main className="text-slate-900">
      <nav aria-label="단기임대 이용 안내" className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-5 sm:px-8">
        <Link href="/stay" className="flex items-baseline gap-2 font-extrabold tracking-tight"><span className="text-xl">부인</span><span className="text-lg tracking-[0.12em] text-blue-600">STAY</span></Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-medium sm:gap-x-7">
          <Link href="/stay/map" className="hover:text-blue-600">지도에서 찾기</Link>
          <Link href="/stay/new?role=host" className="hover:text-blue-600">호스트 등록</Link>
          <Link href="/stay/owner" className="hover:text-blue-600">등록 도움 신청</Link>
          <Link href="/stay/requests" className="hover:text-blue-600">내 등록 신청</Link>
          <Link href="/stay/agents" className="hover:text-blue-600">안심중개사</Link>
          <Link href="/stay/inquiries" className="text-slate-500 hover:text-blue-600">문의함</Link>
        </div>
      </nav>

      <section className="relative isolate flex min-h-[550px] items-center overflow-hidden bg-slate-900 sm:min-h-[590px]">
        <Image src="/images/stay/stay-01.jpg" alt="밝은 거실과 주방이 있는 공간 연출 이미지" fill priority sizes="100vw" className="-z-20 object-cover object-[center_60%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/70 via-slate-950/50 to-slate-900/35" />
        <div className="mx-auto w-full max-w-[900px] px-5 py-16 text-center sm:px-8">
          <p className="mb-5 text-sm font-medium tracking-[0.16em] text-blue-100">A SPACE FOR YOUR EVERYDAY</p>
          <h1 className="text-[36px] font-bold leading-[1.35] tracking-[-0.045em] text-white sm:text-[54px]">머무는 시간은 짧아도,<br />생활은 나답게.</h1>
          <p className="mt-5 text-base leading-7 text-white/85 sm:text-lg">필요한 기간, 원하는 동네.<br className="sm:hidden" /> 나의 일상이 이어질 공간을 찾아보세요.</p>
          <form onSubmit={submit} className="mx-auto mt-9 flex max-w-[680px] items-center gap-2 rounded-2xl bg-white p-2 shadow-xl sm:rounded-full sm:p-2.5">
            <Search aria-hidden="true" className="ml-3 hidden h-5 w-5 shrink-0 text-slate-400 sm:block" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="어느 동네에서 지내고 싶으세요?" aria-label="지역·건물명으로 검색" className="min-w-0 flex-1 rounded-xl bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base" />
            <button type="submit" className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:rounded-full sm:px-7"><Search aria-hidden="true" className="h-4 w-4 sm:hidden" /><span>집 찾기</span></button>
          </form>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-sm text-white/90"><span className="text-white/65">지역 바로가기</span>{REGIONS.map((region) => <Link key={region} href={`/stay/list?q=${encodeURIComponent(region)}`} className="underline-offset-4 hover:underline">{region}</Link>)}</div>
        </div>
        <span className="absolute bottom-4 right-5 text-xs text-white/65">공간 연출 이미지</span>
      </section>

      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <section aria-label="호스트와 중개사를 위한 안내" className="grid gap-4 py-10 md:grid-cols-2 md:gap-5 sm:py-12">
          <Link href="/stay/new?role=host" className="group relative flex min-h-[186px] items-center justify-between gap-4 overflow-hidden rounded-2xl bg-[#f4f1eb] p-6 sm:p-8">
            <div className="relative z-10"><p className="text-sm font-semibold text-[#81715a]">FOR HOSTS</p><h2 className="mt-2 text-xl font-bold leading-snug tracking-tight sm:text-2xl">비어 있는 공간에<br />새로운 일상을 초대하세요</h2><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">호스트로 공간 등록 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></div>
            <Home aria-hidden="true" className="h-20 w-20 shrink-0 rotate-[-8deg] text-[#b8aa94] sm:h-24 sm:w-24" strokeWidth={1} />
          </Link>
          <Link href="/stay/agents" className="group relative flex min-h-[186px] items-center justify-between gap-4 overflow-hidden rounded-2xl bg-[#eaf0fb] p-6 sm:p-8">
            <div className="relative z-10"><p className="text-sm font-semibold text-blue-600">FOR AGENTS</p><h2 className="mt-2 text-xl font-bold leading-snug tracking-tight sm:text-2xl">동네를 잘 아는 중개사와<br />함께 만드는 단기임대</h2><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">안심중개사 알아보기 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></div>
            <Building2 aria-hidden="true" className="h-20 w-20 shrink-0 text-blue-300 sm:h-24 sm:w-24" strokeWidth={1} />
          </Link>
        </section>

        <section className="pb-14 sm:pb-20">
          <div className="mb-6 flex items-end justify-between gap-4"><div><p className="mb-2 text-sm font-semibold text-blue-600">FIND YOUR SPACE</p><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">어떤 공간이 필요하세요?</h2></div><Link href="/stay/list" className="flex shrink-0 items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600">전체 보기<ChevronRight className="h-4 w-4" /></Link></div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {STAY_HOME_CATEGORIES.map((category) => <Link key={category.slug} href={stayCategoryHref(category)} className="group relative min-h-[235px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-400 hover:bg-blue-50/40 sm:p-6"><span className="flex items-center justify-between gap-2"><span className="text-lg font-bold tracking-tight sm:text-xl">{category.label}</span><ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-600" /></span><span className="mt-3 block text-sm leading-6 text-slate-500">{category.subtitle}</span><StayCategoryArt slug={category.slug} className="pointer-events-none absolute bottom-3 right-4 h-[80px] w-[102px] text-slate-400 transition-colors group-hover:text-blue-500" /></Link>)}
          </div>
          <Link href="/stay/map" className="group mt-5 flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-5 py-6 sm:px-7"><span className="flex items-center gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-blue-600"><MapPin className="h-6 w-6" /></span><span><span className="block text-base font-semibold">집만큼 중요한, 집 주변의 생활</span><span className="mt-1 block text-sm leading-6 text-slate-500">원하는 위치의 공간을 지도에서 둘러보세요.</span></span></span><ArrowRight className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-1" /></Link>
        </section>
      </div>

      <section className="bg-[#f8f7f4] py-14 sm:py-20">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8"><p className="text-sm font-semibold text-blue-600">HOW TO STAY</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">낯선 동네에서도,<br className="sm:hidden" /> 시작은 간단하게</h2><div className="mt-9 grid gap-8 md:grid-cols-3 md:gap-10">{STEPS.map(({ number, icon: Icon, title, description }) => <div key={number}><div className="mb-5 flex items-center justify-between"><span className="text-4xl font-light tracking-tight text-slate-300">{number}</span><Icon aria-hidden="true" className="h-7 w-7 text-blue-600" strokeWidth={1.5} /></div><h3 className="border-t border-slate-200 pt-5 text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{description}</p></div>)}</div></div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_1.8fr] lg:gap-16">
        <div><p className="text-sm font-semibold text-blue-600">GOOD TO KNOW</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">처음이라 궁금한 것들</h2><p className="mt-4 text-sm leading-7 text-slate-500">공간을 찾는 순간부터 문의까지,<br />시작하기 전에 확인해 보세요.</p></div>
        <div className="border-t border-slate-200">{FAQS.map(({ question, answer }) => <details key={question} className="group border-b border-slate-200"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-base font-semibold [&::-webkit-details-marker]:hidden">{question}<ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" /></summary><p className="pb-6 pr-5 text-sm leading-7 text-slate-600">{answer}</p></details>)}</div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50"><div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-6 px-5 py-9 sm:flex-row sm:px-8"><div><Link href="/stay" className="text-lg font-bold tracking-tight">부인 <span className="text-blue-600">STAY</span></Link><p className="mt-2 text-sm text-slate-500">부동산인과 함께하는 단기임대 공간 찾기</p></div><div className="flex flex-wrap items-start gap-x-5 gap-y-3 text-sm text-slate-600"><Link href="/terms" className="hover:text-blue-600">이용약관</Link><Link href="/privacy" className="font-semibold hover:text-blue-600">개인정보처리방침</Link><Link href="/stay/inquiries" className="hover:text-blue-600">내 문의함</Link></div></div></footer>
    </main>
  );
}
