'use client';

import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface BannerSlide {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  href?: string;
}

interface Props {
  slides: BannerSlide[];
  autoPlayMs?: number;
  glow?: boolean;
}

/** 리스트 상단 배너 캐러셀 (자동재생 + 터치스와이프 + 도트). 부인 퍼플/블루 톤. */
export default function BannerCarousel({ slides, autoPlayMs = 4000, glow = false }: Props) {
  const [idx, setIdx] = useState(0);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), autoPlayMs);
    return () => clearInterval(t);
  }, [count, autoPlayMs]);

  if (!count) return null;

  const go = (n: number) => setIdx(((n % count) + count) % count);
  const cur = slides[idx];

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <SlideWrapper href={cur.href}>
        <div
          className={`relative flex min-h-[140px] flex-col justify-center gap-1 px-6 py-7 sm:min-h-[180px] ${
            glow
              ? 'bg-gradient-to-r from-sales-primary via-fuchsia-500 to-sales-secondary'
              : 'bg-gradient-to-r from-sales-primary to-sales-secondary'
          }`}
          style={
            cur.image
              ? {
                  backgroundImage: `linear-gradient(90deg, rgba(124,58,237,.85), rgba(37,99,235,.7)), url(${cur.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {cur.subtitle && <p className="text-xs font-semibold text-white/80">{cur.subtitle}</p>}
          <h3 className="text-lg font-extrabold leading-snug text-white sm:text-2xl">{cur.title}</h3>
        </div>
      </SlideWrapper>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="이전 배너"
            onClick={() => go(idx - 1)}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/25 p-1.5 text-white hover:bg-black/40 sm:block"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="다음 배너"
            onClick={() => go(idx + 1)}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/25 p-1.5 text-white hover:bg-black/40 sm:block"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`${i + 1}번째 배너`}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SlideWrapper({ href, children }: { href?: string; children: ReactNode }) {
  if (href) {
    return (
      <Link href={href} className="block">
        {children}
      </Link>
    );
  }
  return <>{children}</>;
}
