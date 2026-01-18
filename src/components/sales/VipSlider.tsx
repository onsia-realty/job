'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import type { SalesJobListing } from '@/types';
import { SALES_JOB_TYPE_LABELS } from '@/types';

interface VipSliderProps {
  jobs: SalesJobListing[];
}

// 배지 스타일
const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: 'bg-green-500', text: 'text-white' },
  hot: { bg: 'bg-red-500', text: 'text-white' },
  jackpot: { bg: 'bg-yellow-500', text: 'text-black' },
  popular: { bg: 'bg-purple-500', text: 'text-white' },
};

export default function VipSlider({ jobs }: VipSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // 자동 슬라이드
  useEffect(() => {
    if (!isAutoPlaying || jobs.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % jobs.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, jobs.length]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + jobs.length) % jobs.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % jobs.length);
    setIsAutoPlaying(false);
  };

  // 터치 스와이프
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  };

  if (jobs.length === 0) return null;

  const currentJob = jobs[currentIndex];

  return (
    <div className="relative bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900 rounded-xl overflow-hidden">
      {/* VIP 라벨 */}
      <div className="absolute top-3 left-3 z-10">
        <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          VIP
        </span>
      </div>

      {/* 슬라이드 인디케이터 */}
      <div className="absolute top-3 right-3 z-10">
        <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1} / {jobs.length}
        </span>
      </div>

      {/* 메인 슬라이드 */}
      <div
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Link href={`/sales/jobs/${currentJob.id}`}>
          <div className="flex flex-col md:flex-row">
            {/* 썸네일 */}
            <div className="relative w-full md:w-1/2 h-48 md:h-64">
              {currentJob.thumbnail ? (
                <Image
                  src={currentJob.thumbnail}
                  alt={currentJob.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-700 to-blue-700 flex items-center justify-center">
                  <Building2 className="w-20 h-20 text-white/30" />
                </div>
              )}
              {/* 배지 오버레이 */}
              {currentJob.badges.length > 0 && (
                <div className="absolute bottom-3 left-3 flex gap-1">
                  {currentJob.badges.map((badge) => (
                    <span
                      key={badge}
                      className={`text-xs px-2 py-0.5 rounded ${BADGE_COLORS[badge]?.bg} ${BADGE_COLORS[badge]?.text}`}
                    >
                      {badge === 'new' ? '신규' : badge === 'hot' ? 'HOT' : badge === 'jackpot' ? '대박' : '인기'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 정보 */}
            <div className="flex-1 p-4 md:p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded">
                  {SALES_JOB_TYPE_LABELS[currentJob.type]}
                </span>
                <span className="text-white/70 text-xs">{currentJob.region}</span>
              </div>

              <h3 className="text-lg md:text-xl font-bold mb-2 line-clamp-2">
                {currentJob.title}
              </h3>

              <p className="text-white/80 text-sm mb-3 line-clamp-2">
                {currentJob.description}
              </p>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-white/10 px-2 py-1 rounded">
                  {currentJob.position === 'headTeam' ? '본부장' : currentJob.position === 'teamLead' ? '팀장' : '팀원'}
                </span>
                <span className="bg-white/10 px-2 py-1 rounded">
                  {currentJob.salary.type === 'commission' ? '계약 수수료' : currentJob.salary.type === 'base_incentive' ? '기본급+인센' : '일급'}
                </span>
                {currentJob.benefits.length > 0 && (
                  <span className="bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded">
                    {currentJob.benefits.join(' ')}
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-white/60 text-xs">{currentJob.company}</span>
                <span className="text-yellow-400 text-sm font-medium">자세히 보기 →</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* 네비게이션 버튼 (PC) */}
      {jobs.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* 도트 인디케이터 */}
      {jobs.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {jobs.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setIsAutoPlaying(false);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? 'bg-white w-4' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
