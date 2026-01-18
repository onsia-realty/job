'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Building2 } from 'lucide-react';

interface MobileStatsBarProps {
  todayNewJobs: number;
  todayVisitors: number;
  totalJobs: number;
}

export default function MobileStatsBar({ todayNewJobs, todayVisitors, totalJobs }: MobileStatsBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // 스크롤 시 숨기기/보이기
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={`md:hidden bg-gradient-to-r from-purple-600 to-blue-600 text-white sticky top-[60px] z-30 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="px-4 py-2">
        <div className="flex items-center justify-around">
          {/* 신규현장 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-white/70">오늘 신규</p>
              <p className="text-sm font-bold">{todayNewJobs}건</p>
            </div>
          </div>

          {/* 구분선 */}
          <div className="w-px h-8 bg-white/30" />

          {/* 실시간 방문자 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-white/70">실시간 방문</p>
              <p className="text-sm font-bold">{todayVisitors.toLocaleString()}명</p>
            </div>
          </div>

          {/* 구분선 */}
          <div className="w-px h-8 bg-white/30" />

          {/* 전체 현장 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-white/70">전체 현장</p>
              <p className="text-sm font-bold">{totalJobs.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
