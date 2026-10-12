import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Header from '@/components/shared/Header';
import StayHomeClient from './StayHomeClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '부인 STAY | 나의 일상이 이어지는 단기임대',
  description: '필요한 기간, 원하는 동네에서 단기임대 공간을 찾아보세요. 사진과 임대 조건을 비교하고 호스트와 중개사에게 문의할 수 있습니다.',
};

/**
 * /stay — 단기임대 메인(랜딩).
 *
 * 3화면 구조의 입구다: 여기(메인) → /stay/list(목록) → /stay/map(지도).
 * 원래 이 자리에 있던 지도 스플릿 화면은 /stay/map 으로 옮겼다.
 */
export default async function StayPage() {
  // 플래그 가드
  const enabled = process.env.NEXT_PUBLIC_STAY_ENABLED === 'true';
  if (!enabled) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-white">
      <Header variant="landing" />
      <Suspense fallback={<LoadingFallback />}>
        <StayHomeClient />
      </Suspense>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="animate-pulse text-sm text-gray-400">불러오는 중…</div>
    </div>
  );
}
