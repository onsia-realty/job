import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import MarketPageClient from './MarketPageClient';

export const dynamic = 'force-dynamic';

export default async function MarketPage() {
  // 플래그 가드 — Day 4 완료 시 true로 토글
  const enabled = process.env.NEXT_PUBLIC_MARKET_ENABLED === 'true';
  if (!enabled) {
    redirect('/');
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <MarketPageClient />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-slate-400">지도를 불러오는 중…</div>
    </div>
  );
}
