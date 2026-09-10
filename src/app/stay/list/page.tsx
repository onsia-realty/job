import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Header from '@/components/shared/Header';
import StayListPageClient from './StayListPageClient';

export const dynamic = 'force-dynamic';

/**
 * /stay/list — 지도 없는 카드 그리드 목록 (33m2 /guest/room 구조).
 *
 * 좌측 필터 사이드바 + 우측 그리드. 지도(/stay/map)와 같은 URL 쿼리 규약
 * (STAY_QUERY_KEYS: deal / type / status / sort, 여기에 검색어 q 만 추가)을 쓰므로
 * 두 화면이 쿼리스트링을 그대로 주고받는다.
 *
 * ⚠️ useSearchParams 를 쓰는 클라이언트 컴포넌트는 반드시 Suspense 로 감싸야 한다.
 *    (감싸지 않으면 빌드 시 CSR bailout 에러)
 */
export default async function StayListPage() {
  const enabled = process.env.NEXT_PUBLIC_STAY_ENABLED === 'true';
  if (!enabled) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header variant="landing" />
      <Suspense fallback={<LoadingFallback />}>
        <StayListPageClient />
      </Suspense>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="animate-pulse text-sm text-gray-400">매물 목록을 불러오는 중…</div>
    </div>
  );
}
