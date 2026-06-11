'use client';

import { useMemo, useState } from 'react';
import { Building2, ArrowDownWideNarrow } from 'lucide-react';
import type { MapComplexPoint, DealTypeFilter, MarkerMode } from './MarketMap.client';
import { formatKoreanPrice } from '@/lib/market/format';

interface Props {
  points: MapComplexPoint[];
  dealType: DealTypeFilter;
  loading: boolean;
  markerMode: MarkerMode;
  selectedKey?: string | null;
  onSelect: (key: string, lat: number, lng: number) => void;
}

type SortKey = 'price_desc' | 'price_asc' | 'count_desc';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'price_desc', label: '가격 높은순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'count_desc', label: '거래량순' },
];

// 무채색 + 초록 포인트 (집 마커와 동일 톤)
const PRICE_DARK = '#1E1E23';
const PRICE_GREEN = '#0A8348';

// 지도 내 단지 리스트 — 네이버페이 부동산 스타일 (미선택 시 좌측 패널)
export default function ComplexListPanel({ points, dealType, loading, markerMode, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('price_desc');

  const sorted = useMemo(() => {
    const arr = [...points];
    if (sortKey === 'price_desc') arr.sort((a, b) => b.avg_price_manwon - a.avg_price_manwon);
    else if (sortKey === 'price_asc') arr.sort((a, b) => a.avg_price_manwon - b.avg_price_manwon);
    else arr.sort((a, b) => b.trade_count - a.trade_count);
    return arr;
  }, [points, sortKey]);

  return (
    <div className="h-full flex flex-col bg-market-surface font-jakarta text-market-text overflow-hidden">
      {/* 헤더 — 단지 수 + 정렬 */}
      <div className="px-4 py-3 border-b border-market-border flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-sm font-bold text-market-text">
          <Building2 className="w-4 h-4 text-market-text-mute" />
          지도 내 단지
          <span className="tabular-nums text-market-text-mute font-semibold">
            {loading ? '…' : points.length.toLocaleString()}
          </span>
        </div>
        <div className="relative">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="appearance-none text-[11px] font-medium text-market-text-mute bg-market-surface-2 rounded-lg pl-6 pr-3 py-1.5 cursor-pointer hover:bg-market-border transition-colors outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ArrowDownWideNarrow className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-market-text-faint pointer-events-none" />
        </div>
      </div>

      {/* 리스트 */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
        {markerMode !== 'complex' ? (
          <div className="px-6 py-12 text-center text-sm text-market-text-mute">
            지도를 확대하면
            <br />
            단지 목록이 표시됩니다
          </div>
        ) : sorted.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-market-text-mute">
            {loading ? '단지를 불러오는 중…' : '이 영역에 거래 단지가 없습니다'}
          </div>
        ) : (
          sorted.map((p) => (
            <button
              key={p.complex_key}
              onClick={() => onSelect(p.complex_key, p.lat, p.lng)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-market-surface-2 transition-colors border-b border-market-border/50"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-market-text truncate">
                  {p.complex_name}
                  {p.property_type === 'officetel' && (
                    <span className="ml-1.5 text-[9px] font-medium text-market-text-faint bg-market-surface-2 px-1 py-0.5 rounded align-middle">
                      오피스텔
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-market-text-mute tabular-nums mt-0.5">
                  {p.rep_area ? `${p.rep_area}㎡ · ` : ''}거래 {p.trade_count}건
                  {dealType === 'wolse' && p.avg_monthly_manwon != null && (
                    <> · 월 {formatKoreanPrice(p.avg_monthly_manwon)}</>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[15px] font-extrabold tabular-nums" style={{ color: PRICE_DARK }}>
                  {formatKoreanPrice(p.avg_price_manwon, 'compact')}
                </div>
                {p.latest_price_manwon != null && (
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: PRICE_GREEN }}>
                    실 {formatKoreanPrice(p.latest_price_manwon, 'compact')}
                    {dealType === 'wolse' && p.latest_monthly_manwon != null && `/${p.latest_monthly_manwon}`}
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t border-market-border flex-shrink-0 text-[10px] text-market-text-faint">
        국토부 실거래가 · 최근 6개월 평균
      </div>
    </div>
  );
}
