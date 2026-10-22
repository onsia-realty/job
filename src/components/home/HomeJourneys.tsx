import Image from 'next/image';
import Link from 'next/link';

const linkClass = 'inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-semibold text-cyan-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400';

export default function HomeJourneys({ stayEnabled }: { stayEnabled: boolean }) {
  return (
    <section aria-labelledby="home-journeys-title" className="mb-10 overflow-hidden rounded-2xl border border-white/10 bg-[#1C1D1F] lg:mb-16">
      <div className="grid md:grid-cols-5">
        <div className="px-6 py-10 md:col-span-3 lg:p-12">
          <p className="mb-5 text-xs tracking-[0.25em] text-cyan-300">BOOIN · 부동산인의 일과 공간</p>
          <h2 id="home-journeys-title" className="text-3xl font-semibold leading-tight tracking-tight lg:text-5xl">
            다음 일터를 찾고,{' '}<br />함께할 사람을 만나다.
          </h2>
          <p className="mt-6 max-w-lg text-sm leading-7 text-gray-300 lg:text-base">
            공인중개사와 분양상담사를 위한 구인구직.
            {stayEnabled && ' 머물 공간이 필요할 때는 단기임대 STAY까지.'}
          </p>
        </div>
        <div className="relative hidden min-h-64 md:col-span-2 md:block">
          <Image src="/images/grid-1.png" alt="" fill sizes="40vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1C1D1F] via-transparent to-transparent" />
          <span className="absolute bottom-4 right-4 rounded bg-black/60 px-2 py-1 text-xs text-white/80">공간 이미지 · 실제 공고 아님</span>
        </div>
      </div>
      <div className={`grid gap-px border-t border-white/10 bg-white/10 ${stayEnabled ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}>
        <div className="bg-[#1C1D1F] p-6">
          <p className="text-xs text-gray-400">01 · 구직</p>
          <h3 className="mt-2 text-xl font-semibold">일자리 찾기</h3>
          <p className="mt-2 text-sm text-gray-400">직무에 맞는 채용공고를 확인하세요.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/agent/jobs" className={linkClass}>공인중개사 채용공고 →</Link>
            <Link href="/sales/jobs" className={linkClass}>분양상담사 채용공고 →</Link>
          </div>
        </div>
        <div className="bg-[#1C1D1F] p-6">
          <p className="text-xs text-gray-400">02 · 채용</p>
          <h3 className="mt-2 text-xl font-semibold">채용공고 등록</h3>
          <p className="mt-2 text-sm text-gray-400">공고를 작성하고 필요한 광고 상품을 선택하세요.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/agent/jobs/new" className={linkClass}>중개사 공고 등록 →</Link>
            <Link href="/sales/jobs/new" className={linkClass}>분양 공고 등록 →</Link>
            <Link href="/premium" className={linkClass}>광고 상품·가격 보기 →</Link>
          </div>
        </div>
        {stayEnabled && (
          <div className="bg-[#1C1D1F] p-6">
            <p className="text-xs text-gray-400">03 · STAY</p>
            <h3 className="mt-2 text-xl font-semibold">머물 공간 찾기</h3>
            <p className="mt-2 text-sm text-gray-400">단기임대 매물을 둘러보고 내 공간을 등록하세요.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/stay" className={linkClass}>단기임대 찾기 →</Link>
              <Link href="/stay/new" className={linkClass}>임대 매물 등록 →</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
