import Link from 'next/link';
import { DEMO_STAY_INQUIRY_MESSAGE } from '@/lib/stay/demo';

export function StayDemoBadge() {
  return <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-950">샘플 매물</span>;
}

export default function StayDemoNotice() {
  return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
    <StayDemoBadge />
    <p className="mt-2">화면 시연용 샘플이며 실제 입주 가능한 매물이 아닙니다. 표시된 이미지도 예시용으로, 실제 매물의 상태를 증명하는 사진이 아닙니다.</p>
    <p className="mt-2">{DEMO_STAY_INQUIRY_MESSAGE}</p>
    <Link href="/stay/new" className="mt-2 inline-block font-bold underline">호스트로 내 매물 등록하기</Link>
  </div>;
}
