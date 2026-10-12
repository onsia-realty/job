'use client';

// 단기임대(/stay) 모바일 바텀시트 — peek / half / full 3단 스냅.
// src/components/market/BottomSheet.tsx 를 그대로 이식했다(시세지도 코드는 수정 금지라 공통화 대신 복사).
// 다른 점은 색 토큰뿐: 시세지도의 market-* 토큰 대신 /stay 의 기본 gray 팔레트를 쓴다.

import { useCallback, useRef, useState } from 'react';

export type StaySheetSnap = 'peek' | 'half' | 'full';

interface Props {
  snap: StaySheetSnap;
  onSnapChange: (s: StaySheetSnap) => void;
  children: React.ReactNode;
  /** peek 상태에서 보여줄 요약 한 줄 (grabber 아래) */
  peekContent?: React.ReactNode;
}

// 스냅포인트: 시트 높이 (화면 하단 기준)
const SNAP_HEIGHTS: Record<StaySheetSnap, string> = {
  peek: '124px',
  half: '50dvh',
  full: '92dvh',
};

const ORDER: StaySheetSnap[] = ['peek', 'half', 'full'];

/**
 * 드래그는 grabber(상단 핸들) 영역에서만 동작해 콘텐츠 스크롤과 충돌하지 않는다.
 * peek/half 에서는 지도가 보인다 → "시트가 화면 대부분을 덮는" 문제 회피.
 */
export default function StayBottomSheet({ snap, onSnapChange, children, peekContent }: Props) {
  const [dragOffset, setDragOffset] = useState(0);
  const dragging = useRef(false);
  const startY = useRef(0);
  // 렌더 중에 ref 를 읽으면 react-hooks/refs 린트 위반이라, 렌더가 쓰는 드래그 여부는 state 로 둔다.
  // (원본 market/BottomSheet.tsx 는 ref 를 직접 읽어 린트 에러가 있었다 — 이식하면서 고침)
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true;
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;
    setDragOffset(e.touches[0].clientY - startY.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    const dy = dragOffset;
    setDragOffset(0);
    if (Math.abs(dy) < 36) return;
    const idx = ORDER.indexOf(snap);
    if (dy < 0 && idx < 2) onSnapChange(ORDER[idx + 1]); // 위로 → 확장
    else if (dy > 0 && idx > 0) onSnapChange(ORDER[idx - 1]); // 아래로 → 축소
  }, [dragOffset, snap, onSnapChange]);

  // 드래그 중 시각 피드백 (아래로만, 위로는 저항)
  const translate = Math.max(0, dragOffset > 0 ? dragOffset : dragOffset * 0.3);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 flex flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:hidden"
      style={{
        height: SNAP_HEIGHTS[snap],
        transform: `translateY(${translate}px)`,
        transition: isDragging ? 'none' : 'height 0.25s ease-out, transform 0.2s ease-out',
      }}
    >
      {/* grabber — 드래그/탭 전용 영역 */}
      <div
        className="w-full flex-shrink-0 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => onSnapChange(snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'half')}
        role="button"
        aria-label="시트 크기 조절"
      >
        <div className="flex justify-center pb-2 pt-2.5">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
      </div>

      {snap === 'peek' && peekContent ? (
        <button className="w-full flex-shrink-0 px-4 pb-3 text-left" onClick={() => onSnapChange('half')}>
          {peekContent}
        </button>
      ) : (
        <div className="min-h-0 flex-1">{children}</div>
      )}
    </div>
  );
}
