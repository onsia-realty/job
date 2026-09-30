import { Suspense } from 'react';
import SalesJobsPageClient from './SalesJobsPageClient';

export const dynamic = 'force-dynamic';

/**
 * /sales/jobs — 분양상담사 공고 목록.
 *
 * 쿼리: tier(unique|superior|premium|normal) / region(REGIONS) / type / sort(latest|commission|views).
 * 실공고(fetchJobs('sales'))를 앞에, 샘플을 뒤에 병합해 보여준다 — 로직은 SalesJobsPageClient.
 *
 * ⚠️ useSearchParams 를 쓰는 클라이언트 컴포넌트는 반드시 Suspense 로 감싸야 한다.
 *    (감싸지 않으면 빌드 시 CSR bailout 에러)
 */
export default function SalesJobsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SalesJobsPageClient />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
      <div className="animate-pulse text-sm text-gray-400">공고 목록을 불러오는 중…</div>
    </div>
  );
}
