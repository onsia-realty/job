'use client';

import { useCallback, useRef, useState } from 'react';

export type SheetSnap = 'peek' | 'half' | 'full';

interface Props {
  snap: SheetSnap;
  onSnapChange: (s: SheetSnap) => void;
  children: React.ReactNode;
  /** peek 상태에서 보여줄 요약 한 줄 (grabber 아래) */
  peekContent?: React.ReactNode;
}

// 스냅포인트: 시트 높이 (화면 하단 기준)
const SNAP_HEIGHTS: Record<SheetSnap, string> = {
  peek: '124px',
  half: '50dvh',
  full: '92dvh',
};

const ORDER: SheetSnap[] = ['peek', 'half', 'full'];

/**
 * 모바일 바텀시트 — 스냅 3단 (peek/half/full).
 * 드래그는 grabber(상단 핸들) 영역에서만 동작해 콘텐츠 스크롤과 충돌하지 않는다.
 * peek/half에서는 지도가 보임 → "시트가 화면 80% 덮는" 문제 해소.
 */
export default function BottomSheet({ snap, onSnapChange, children, peekContent }: Props) {
  const [dragOffset, setDragOffset] = useState(0);
  const dragging = useRef(false);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;
    setDragOffset(e.touches[0].clientY - startY.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    const dy = dragOffset;
    setDragOffset(0);
    if (Math.abs(dy) < 36) return;
    const idx = ORDER.indexOf(snap);
    if (dy < 0 && idx < 2) onSnapChange(ORDER[idx + 1]);      // 위로 → 확장
    else if (dy > 0 && idx > 0) onSnapChange(ORDER[idx - 1]); // 아래로 → 축소
  }, [dragOffset, snap, onSnapChange]);

  // 드래그 중 시각 피드백 (아래로만, 위로는 저항)
  const translate = Math.max(0, dragOffset > 0 ? dragOffset : dragOffset * 0.3);

  return (
    <div
      className="md:hidden absolute left-0 right-0 bottom-0 z-30 bg-market-surface rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-market-border flex flex-col overflow-hidden"
      style={{
        height: SNAP_HEIGHTS[snap],
        transform: `translateY(${translate}px)`,
        transition: dragging.current ? 'none' : 'height 0.25s ease-out, transform 0.2s ease-out',
      }}
    >
      {/* grabber — 드래그/탭 전용 영역 */}
      <div
        className="flex-shrink-0 w-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => onSnapChange(snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'half')}
        role="button"
        aria-label="시트 크기 조절"
      >
        <div className="flex justify-center pt-2.5 pb-2">
          <div className="w-10 h-1 rounded-full bg-market-border" />
        </div>
      </div>

      {snap === 'peek' && peekContent ? (
        <button
          className="px-4 pb-3 flex-shrink-0 text-left w-full"
          onClick={() => onSnapChange('half')}
        >
          {peekContent}
        </button>
      ) : (
        <div className="flex-1 min-h-0">{children}</div>
      )}
    </div>
  );
}
