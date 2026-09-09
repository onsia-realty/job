'use client';

// 단기임대 상세 갤러리 — 메인 이미지 + 썸네일 스트립.
// /public/images/stay/ 에 실제 자산이 없어 StayImage 의 onError 폴백이 정상 동작이다.

import { useState } from 'react';
import { StayImage } from '@/components/stay/StayPrimitives';

export default function StayGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  // 이미지가 하나도 없으면 폴백 1장만 노출한다.
  const list = images.length > 0 ? images : [null];
  const current = list[Math.min(activeIndex, list.length - 1)] ?? null;

  return (
    <div className="space-y-2">
      <div className="relative w-full overflow-hidden rounded-2xl bg-slate-100" style={{ aspectRatio: '3 / 2' }}>
        <StayImage
          src={current}
          alt={title}
          sizes="(max-width: 1024px) 100vw, 720px"
          className="h-full w-full object-cover"
        />
        {list.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium text-white">
            {Math.min(activeIndex, list.length - 1) + 1} / {list.length}
          </span>
        )}
      </div>

      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((src, i) => {
            const isActive = i === Math.min(activeIndex, list.length - 1);
            return (
              <button
                key={`${src ?? 'empty'}-${i}`}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={`${title} 사진 ${i + 1} 보기`}
                aria-current={isActive}
                className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                  isActive ? 'border-blue-600' : 'border-transparent hover:border-slate-300'
                }`}
              >
                <StayImage src={src} alt={`${title} 사진 ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
