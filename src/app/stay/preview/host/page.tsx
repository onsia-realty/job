import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import StayHostQuote from '@/components/stay/StayHostQuote';
import { koreaToday, type HostQuoteStay } from '@/lib/stay/host-pricing';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: '호스트 날짜·요금 미리보기 | 부인 STAY',
  robots: { index: false, follow: false },
};

/** Development-only fixture: never inserts a listing or sends an inquiry. */
export default function HostPreviewPage() {
  if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_STAY_ENABLED !== 'true') notFound();
  const stay: HostQuoteStay & { id: string } = {
    id: 'preview-host', owner_type: 'owner', deal_type: 'short_term', status: 'available',
    weekly_fee_won: 350000, daily_fee_won: 50000, monthly_fee_won: null,
    maintenance_fee_won: 300000, maintenance_included: false, utilities_included: true,
    deposit_won: 300000, min_stay_days: 7, max_stay_days: 84,
    available_from: koreaToday(), available_to: null,
  };
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <Link href="/stay" className="text-sm font-semibold text-blue-700">← 부인 STAY</Link>
        <div className="my-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          개발용 예시입니다. 실제 등록 매물이 아니며 문의·예약·결제가 발생하지 않습니다.
        </div>
        <div className="grid items-start gap-7 lg:grid-cols-[1fr_380px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <Image src="/images/stay/stay-01.jpg" alt="호스트 화면 확인을 위한 공간 연출 이미지" width={1200} height={900} className="aspect-[4/3] w-full object-cover" />
            <div className="p-6">
              <p className="text-sm font-semibold text-blue-700">호스트 직접 임대 · 화면 예시</p>
              <h1 className="mt-2 text-2xl font-bold">날짜를 골라 예상 금액을 확인하세요</h1>
              <p className="mt-4 text-sm leading-7 text-slate-600">예시 요금은 주 임대료 350,000원, 월 관리비 300,000원입니다. 7일 선택 시 임대료 350,000원과 관리비 70,000원으로 이용료는 420,000원이며, 보증금 300,000원은 별도 표시됩니다.</p>
              <Link href="/stay/new?role=host" className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white">호스트 등록 화면 보기</Link>
            </div>
          </section>
          <StayHostQuote stay={stay} preview />
        </div>
      </div>
    </main>
  );
}
