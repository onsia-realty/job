import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import StayMapPageClient from '../StayMapPageClient';

export const dynamic = 'force-dynamic';

/**
 * /stay/map — 지도 중심 스플릿 레이아웃 (네모 nemoapp.kr/store 구조 이식).
 *
 * 원래 /stay 였던 화면을 3화면 구조(메인 /stay · 목록 /stay/list · 지도 /stay/map)로
 * 재편하면서 이리로 옮겼다. 내용은 그대로다.
 *
 * 목록 조회는 지도 viewport(bounds) 에 묶여 있어 전부 클라이언트에서 일어난다.
 * 그래서 이 서버 컴포넌트는 플래그 가드만 하고 바로 클라이언트로 넘긴다.
 * (필터 파싱은 URL 을 단일 출처로 쓰는 StayMapPageClient 가 직접 한다 —
 *  서버에서 한 번 더 파싱하면 두 곳이 어긋날 수 있다.)
 *
 * ⚠️ useSearchParams 를 쓰는 클라이언트 컴포넌트는 반드시 Suspense 로 감싸야 한다.
 *    (감싸지 않으면 빌드 시 CSR bailout 에러)
 */
export default async function StayMapPage() {
  // 플래그 가드
  const enabled = process.env.NEXT_PUBLIC_STAY_ENABLED === 'true';
  if (!enabled) {
    redirect('/');
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <StayMapPageClient />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="animate-pulse text-sm text-gray-400">매물 지도를 불러오는 중…</div>
    </div>
  );
}
