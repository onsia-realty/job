'use client';

import { X, TrendingUp, TrendingDown, Building2, Calendar, MapPin } from 'lucide-react';
import type { MapComplexPoint, DealTypeFilter } from './MarketMap.client';

export interface ComplexDetail {
  complex_key: string;
  complex_name: string | null;
  dong: string | null;
  lawd_cd: string | null;
  growth_pct: number | null;
  monthly: Array<{
    ym: string;
    avg_price_manwon: number;
    trade_count: number;
    avg_pyeong_price: number;
  }>;
  recent_transactions: Array<{
    deal_date: string;
    price_manwon: number | null;
    exclusive_area: number | null;
    floor: number | null;
    deal_type: string;
    deal_channel: string | null;
  }>;
  recent_silv_transactions?: Array<{
    deal_date: string;
    price_manwon: number | null;
    exclusive_area: number | null;
    floor: number | null;
    deal_type: string;
    deal_channel: string | null;
  }>;
  complex_meta: {
    lat: number | null;
    lng: number | null;
    road_address: string | null;
    hhld_cnt: number | null;
    build_year: number | null;
    grnd_flr_cnt: number | null;
  } | null;
  building_meta?: {
    bc_rat: number | null;
    vl_rat: number | null;
    plat_area: number | null;
    arch_area: number | null;
    tot_area: number | null;
    land_share_per_hhld: number | null;
    parking_total: number | null;
    ride_elvt_cnt: number | null;
    strct: string | null;
    main_purps: string | null;
  } | null;
  nearby_complexes?: Array<{
    complex_key: string;
    complex_name: string;
    avg_price_manwon: number;
    trade_count: number;
    avg_pyeong_price: number;
    distance_km: number | null;
  }>;
  unit_distribution: Array<{
    label: string;
    count: number;
    avg_price_manwon: number;
    avg_pyeong_price: number;
  }>;
  monthly_split: Array<{
    ym: string;
    trade_avg: number | null;
    rent_avg: number | null;
    presale_avg?: number | null;
    trade_count: number;
    rent_count: number;
    presale_count?: number;
  }>;
  lease_ratio: number | null;
}

interface Props {
  complexKey: string;
  point: MapComplexPoint | undefined;
  detail: ComplexDetail | null;
  loading: boolean;
  dealType: DealTypeFilter;
  onClose: () => void;
}

const DEAL_COLORS: Record<DealTypeFilter, string> = {
  trade: '#e11d48',   // Rose-600 (매매)
  jeonse: '#2563eb',  // Blue-600 (전세)
  wolse: '#059669',   // Emerald-600 (월세)
  presale: '#7c3aed', // Violet-600 (분양권)
};

const DEAL_LABELS: Record<DealTypeFilter, string> = {
  trade: '매매',
  jeonse: '전세',
  wolse: '월세',
  presale: '분양권',
};

const KRW = (n: number) => Math.round(n).toLocaleString('ko-KR');

export default function MarketDetailPanel({
  complexKey,
  point,
  detail,
  loading,
  dealType,
  onClose,
}: Props) {
  const name = detail?.complex_name || point?.complex_name || '단지';
  const meta = detail?.complex_meta;
  const isTrade = dealType === 'trade';
  const dealColor = DEAL_COLORS[dealType];

  const currentMonthly = detail?.monthly?.[0];

  // KPI 메인 값
  const mainPrice = isTrade
    ? currentMonthly?.avg_price_manwon ?? point?.avg_price_manwon
    : point?.avg_price_manwon;

  // dealType에 따라 거래 리스트 분기 (분양권은 별도 배열)
  const recentTxs = dealType === 'presale'
    ? (detail?.recent_silv_transactions ?? []).slice(0, 5)
    : (detail?.recent_transactions ?? []).slice(0, 5);
  const showRecent = (dealType === 'trade' || dealType === 'presale') && recentTxs.length > 0;

  return (
    <div className="h-full flex flex-col bg-market-surface font-jakarta text-market-text overflow-hidden">
      {/* 모바일 grabber */}
      <div className="md:hidden flex justify-center pt-2 pb-1 flex-shrink-0">
        <div className="w-10 h-1 rounded-full bg-market-border" />
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
        {/* 헤더 */}
        <div className="px-5 pt-3 pb-4 border-b border-market-border">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-market-text leading-tight truncate">{name}</h2>
              {meta?.road_address && (
                <div className="text-xs text-market-text-mute mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{meta.road_address}</span>
                </div>
              )}
              {(meta?.hhld_cnt != null || meta?.build_year != null || meta?.grnd_flr_cnt != null) && (
                <div className="text-xs text-market-text-mute mt-1.5 flex items-center gap-3 flex-wrap">
                  {meta.hhld_cnt != null && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {meta.hhld_cnt.toLocaleString()}세대
                    </span>
                  )}
                  {meta.build_year != null && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {meta.build_year}년
                    </span>
                  )}
                  {meta.grnd_flr_cnt != null && (
                    <span className="tabular-nums">최고 {meta.grnd_flr_cnt}층</span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-market-text-mute hover:text-market-text p-1 -mr-2 flex-shrink-0 rounded-full hover:bg-market-surface-2 transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 메인 KPI */}
        <div className="px-5 py-4 border-b border-market-border">
          <div className="text-[11px] font-medium text-market-text-mute mb-1.5">
            {DEAL_LABELS[dealType]} 평균 {dealType === 'wolse' || dealType === 'jeonse' ? '보증금' : '거래가'}
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <div
              className="text-[32px] font-extrabold tabular-nums leading-none"
              style={{ color: dealColor }}
            >
              {mainPrice != null ? KRW(mainPrice) : loading ? '…' : '-'}
              {mainPrice != null && <span className="text-base font-medium ml-0.5">만</span>}
            </div>
            {dealType === 'wolse' && point?.avg_monthly_manwon != null && (
              <div className="text-sm font-semibold text-market-text-mute tabular-nums">
                / 월 {KRW(point.avg_monthly_manwon)}만
              </div>
            )}
          </div>

          {/* 변동률 + 평당가 + 전세가율 행 */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {isTrade && detail?.growth_pct != null && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  detail.growth_pct > 0
                    ? 'bg-deal-trade-soft text-deal-trade'
                    : detail.growth_pct < 0
                    ? 'bg-deal-jeonse-soft text-deal-jeonse'
                    : 'bg-market-surface-2 text-market-text-mute'
                }`}
              >
                {detail.growth_pct > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {detail.growth_pct > 0 ? '+' : ''}
                {detail.growth_pct.toFixed(1)}%
              </span>
            )}
            {isTrade && currentMonthly?.avg_pyeong_price && (
              <span className="text-xs text-market-text-mute tabular-nums">
                평당 <strong className="text-market-text font-semibold">{KRW(currentMonthly.avg_pyeong_price)}만</strong>
              </span>
            )}
            {dealType === 'jeonse' && detail?.lease_ratio != null && (
              <span className="text-xs text-market-text-mute">
                전세가율 <strong className="text-deal-jeonse font-semibold tabular-nums">{detail.lease_ratio}%</strong>
              </span>
            )}
            {point?.trade_count != null && (
              <span className="text-xs text-market-text-mute tabular-nums">
                · {point.trade_count}건
              </span>
            )}
          </div>
        </div>

        {/* 최근 거래 (매매·분양권) */}
        {showRecent && (
          <div className="px-5 py-4 border-b border-market-border">
            <div className="text-[11px] font-semibold text-market-text-mute mb-2.5 uppercase tracking-wider">
              최근 {DEAL_LABELS[dealType]} 거래 {recentTxs.length}건
            </div>
            <div className="space-y-2">
              {recentTxs.map((tx, i) => (
                <div key={i} className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-market-text-faint tabular-nums flex-shrink-0">
                      {tx.deal_date.slice(2).replace(/-/g, '.')}
                    </span>
                    {tx.exclusive_area != null && (
                      <span className="text-market-text-mute tabular-nums">
                        {tx.exclusive_area.toFixed(1)}㎡
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-market-text tabular-nums">
                    {tx.price_manwon ? `${KRW(tx.price_manwon)}만` : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 푸터 — 데이터 출처만 (페이지 이동 X) */}
      <div className="px-5 py-2.5 border-t border-market-border bg-market-surface flex-shrink-0 flex items-center justify-between">
        <div className="text-[10px] text-market-text-faint">국토부 실거래가</div>
        <div className="text-[10px] text-market-text-faint tabular-nums">
          최근 6개월 데이터
        </div>
      </div>
    </div>
  );
}
