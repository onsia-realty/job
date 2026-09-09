'use client';

// 단기임대(/stay) 화면 공용 프리미티브.
// 목록·상세·소유주 랜딩이 전부 이 파일을 import 한다. 중복 구현 금지.

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { STAY_STATUS_LABELS, type StayStatus } from '@/lib/stay/constants';

// 포맷 함수(formatWon / formatDepositMonthly / formatArea / formatMinStay)는
// '@/lib/stay/format' 으로 이동했다. 여기서 re-export 하지 마라 —
// 'use client' 경계를 다시 넘게 되어 서버 컴포넌트에서 호출 시 같은 버그가 재발한다.

// ---------- 상태 배지 ----------
// 5종 상태는 회전 모델의 핵심이다. 특히 '퇴거예정'은 공실이 나기 전에 재노출하는 장치라
// 눈에 띄는 색을 쓴다.

const STATUS_STYLES: Record<StayStatus, string> = {
  available: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  inquiring: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  contracting: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  occupied: 'bg-slate-100 text-slate-500 ring-slate-400/20',
  leaving: 'bg-orange-50 text-orange-700 ring-orange-600/20',
};

export function StayStatusBadge({
  status,
  className = '',
}: {
  status: StayStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]} ${className}`}
    >
      {STAY_STATUS_LABELS[status]}
    </span>
  );
}

/** 전속 배지 — 소유주 승인으로 문의가 독점 라우팅되는 매물 표시 */
export function StayExclusiveBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-2.5 py-1 text-xs font-semibold text-white ${className}`}
    >
      ★ 전속
    </span>
  );
}

// ---------- 이미지 ----------
// /public/images/stay/ 에 실제 자산이 아직 없다. 경로는 목데이터의 규약만 잡아둔 상태라
// 전부 깨지므로 폴백이 필수다.

export function StayImage({
  src,
  alt,
  className = '',
  sizes,
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  // onError 가 발생한 "뒤에" 폴백으로 바꾸면, 그 전까지 브라우저가 깨진 이미지와 alt 텍스트를
  // 그대로 그린다(레이아웃도 함께 튄다). 그래서 로드가 성공하기 전까지는 항상 폴백을 보여주고,
  // onLoad 가 떨어진 뒤에만 실제 이미지로 교체한다.
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');

  const showFallback = !src || status !== 'loaded';

  return (
    <>
      {showFallback && (
        <div
          className={`flex flex-col items-center justify-center gap-1.5 bg-slate-100 text-slate-300 ${className}`}
          aria-label={`${alt} (이미지 준비 중)`}
          role="img"
        >
          <ImageOff className="h-7 w-7" />
          <span className="text-[11px] font-medium text-slate-400">이미지 준비 중</span>
        </div>
      )}
      {src && status !== 'failed' && (
        // 자산이 외부/미확정 경로라 next/image 대신 img 를 쓴다. 자산 확정 후 교체 대상.
        // 로드 전에는 hidden 이지만 display:none 이어도 요청은 나가므로 onLoad/onError 는 정상 동작한다.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading="lazy"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('failed')}
          className={showFallback ? 'hidden' : className}
        />
      )}
    </>
  );
}
