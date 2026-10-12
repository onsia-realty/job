'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';

const VIDEO_SRC = '/videos/booin-signup-promo.mp4';
const POSTER_SRC = '/videos/booin-signup-promo-poster.jpg';

/**
 * 미디어쿼리 구독 훅 — 서버/첫 하이드레이션에서는 항상 false를 반환해
 * 하이드레이션 불일치 없이 클라이언트에서만 결과를 반영한다.
 */
function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

/**
 * 회원가입 화면 우측 홍보 영상 카드 (lg 이상에서만 렌더 — 모바일에서는 영상 자체를 받지 않음)
 */
export default function SignupPromoVideo() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  if (!isDesktop) return null;

  return <PromoVideoCard autoPlay={!prefersReducedMotion} />;
}

function PromoVideoCard({ autoPlay }: { autoPlay: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  // React는 muted 속성을 DOM에 확실히 반영하지 않으므로 직접 동기화
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // 자동재생이 브라우저 정책으로 막히면 재생 버튼을 노출
  useEffect(() => {
    if (!autoPlay || !videoRef.current) return;
    videoRef.current.play().catch(() => setAutoplayBlocked(true));
  }, [autoPlay]);

  const handlePlay = () => {
    videoRef.current?.play().catch(() => {
      // 브라우저 정책으로 재생이 막히면 포스터 + 재생 버튼 상태 유지
    });
  };

  return (
    <aside className="w-[300px] xl:w-[340px] flex-shrink-0 lg:sticky lg:top-20" aria-label="부동산인 소개 영상">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-3xl bg-slate-900 shadow-xl shadow-slate-900/15 ring-1 ring-slate-200">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          autoPlay={autoPlay}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          onPlay={() => { setIsPlaying(true); setHasPlayed(true); }}
          onPause={() => setIsPlaying(false)}
        />

        {/* 재생 버튼 — 자동재생을 하지 않는 경우(동작 줄이기 설정 등) */}
        {!isPlaying && (!autoPlay || autoplayBlocked || hasPlayed) && (
          <button
            type="button"
            onClick={handlePlay}
            aria-label="소개 영상 재생"
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-emerald-400"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play className="ml-1 h-7 w-7 text-emerald-600" fill="currentColor" />
            </span>
          </button>
        )}

        {/* 일시정지 (자동 재생 콘텐츠 정지 수단) */}
        {isPlaying && (
          <button
            type="button"
            onClick={() => videoRef.current?.pause()}
            aria-label="소개 영상 일시정지"
            className="absolute right-15 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Pause className="h-5 w-5" fill="currentColor" />
          </button>
        )}

        {/* 소리 켜기/끄기 */}
        <button
          type="button"
          onClick={() => setMuted((prev) => !prev)}
          aria-label={muted ? '소리 켜기' : '소리 끄기'}
          aria-pressed={!muted}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      <div className="mt-4 px-1">
        <p className="font-bold text-slate-900">부동산 전문가, 부인에서 시작하세요</p>
        <p className="mt-1 text-sm text-slate-500 leading-relaxed">
          채용공고부터 현장 소식까지, 부동산인이 한곳에 모아드려요.
        </p>
      </div>
    </aside>
  );
}
