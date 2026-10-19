'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

export interface Announcement {
  id: number;
  badge: string;
  title: string;
  description: string;
  link: string | null;
}

const motionQuery = '(prefers-reduced-motion: reduce)';
const subscribeMotion = (notify: () => void) => {
  const media = window.matchMedia(motionQuery);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
const getReducedMotion = () => window.matchMedia(motionQuery).matches;
const getServerReducedMotion = () => true;
const controlClass = 'size-11 shrink-0 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-50';

export default function AnnouncementSlider({ items }: { items: Announcement[] }) {
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, getServerReducedMotion);
  const running = items.length > 1 && !userPaused && !hovered && !focused && !reducedMotion;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setIndex((previous) => (previous + 1) % items.length), 5000);
    return () => clearInterval(timer);
  }, [running, items.length]);

  if (!items.length) return null;
  const activeIndex = index % items.length;
  const item = items[activeIndex];
  const move = (offset: number) => setIndex((previous) => (previous + offset + items.length) % items.length);

  return (
    <section aria-roledescription="carousel" aria-label="공지사항"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      className="relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#16202b] to-[#111418] p-5 sm:p-6 lg:min-h-[320px] lg:p-10">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      <div className="min-h-[240px] lg:min-h-[212px]" aria-live={running ? 'off' : 'polite'} aria-atomic="true" aria-roledescription="slide" aria-label={`${activeIndex + 1} / ${items.length}`}>
        <span className={`mb-4 inline-block rounded-full border px-3 py-1 text-xs ${item.badge === 'AI' ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'}`}>{item.badge}</span>
        <h2 className="mb-3 break-keep text-2xl font-bold leading-tight md:text-3xl lg:text-[2.25rem]">{item.title}</h2>
        <p className="max-w-prose break-keep text-sm leading-relaxed text-gray-300 sm:text-base">{item.description}</p>
        <div className="mt-3 min-h-[44px]">
          {item.link && <Link href={item.link} className="inline-flex min-h-[44px] items-center gap-2 rounded text-sm font-medium text-cyan-300 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">자세히 보기 <ArrowRight className="size-4" aria-hidden="true" /></Link>}
        </div>
      </div>
      {items.length > 1 && <div className="mt-6 flex flex-wrap items-center gap-1">
        <div className="flex">
          {items.map((announcement, position) => <button key={announcement.id} type="button" onClick={() => setIndex(position)} aria-label={`${position + 1}번 공지: ${announcement.title}`} aria-current={position === activeIndex}
            className="inline-flex size-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
            <span aria-hidden="true" className={`h-2 rounded-full transition-all motion-reduce:transition-none ${position === activeIndex ? 'w-6 bg-cyan-400' : 'w-2 bg-white/30'}`} />
          </button>)}
        </div>
        <div className="ml-auto flex gap-1 sm:gap-2">
          <button type="button" className={controlClass} disabled={reducedMotion} onClick={() => setUserPaused((previous) => !previous)}
            aria-label={reducedMotion ? '모션 감소 설정으로 자동 재생 꺼짐' : userPaused ? '자동 재생 시작' : '자동 재생 정지'} aria-pressed={reducedMotion || userPaused}>
            {reducedMotion || userPaused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
          </button>
          <button type="button" className={controlClass} onClick={() => move(-1)} aria-label="이전 공지"><ChevronLeft className="size-5" aria-hidden="true" /></button>
          <button type="button" className={controlClass} onClick={() => move(1)} aria-label="다음 공지"><ChevronRight className="size-5" aria-hidden="true" /></button>
        </div>
      </div>}
    </section>
  );
}
