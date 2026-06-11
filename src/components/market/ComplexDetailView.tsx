'use client';

import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import Link from 'next/link';
import {
  X, TrendingUp, TrendingDown, Building2, Calendar, MapPin, Sparkles, ChevronLeft,
} from 'lucide-react';
import type { MapComplexPoint, DealTypeFilter } from './MarketMap.client';
import type { ComplexDetail } from '@/lib/market/types';
import type { NearbySchool } from '@/lib/market/surroundings';
import { useComplexDetail, useSurroundings, type ChartRange } from '@/lib/market/queries';
import { formatKoreanPrice, formatEokUnit } from '@/lib/market/format';

interface Props {
  complexKey: string;
  point: MapComplexPoint | undefined;
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

// 듀얼 라인 색상 (호갱노노/네이버 스타일 — 매매 빨강 + 전세 파랑)
const LINE_TRADE = '#e11d48';
const LINE_RENT = '#2563eb';
const LINE_PRESALE = '#7c3aed';

const RANGE_TABS: Array<{ value: ChartRange; label: string }> = [
  { value: '1m', label: '1개월' },
  { value: '6m', label: '6개월' },
  { value: '1y', label: '1년' },
  { value: '3y', label: '3년' },
  { value: '5y', label: '5년' },
];
const RANGE_LABEL: Record<ChartRange, string> = {
  '1m': '1개월', '6m': '6개월', '1y': '1년', '3y': '3년', '5y': '5년',
};

type Metric = 'price' | 'pyeong';

// 도보 시간 뱃지 — 5분 이내 초록, 10분 이내 앰버, 그 외 회색
function WalkBadge({ minutes, distance }: { minutes: number; distance: number }) {
  const cls =
    minutes <= 5
      ? 'bg-emerald-50 text-emerald-700'
      : minutes <= 10
      ? 'bg-amber-50 text-amber-700'
      : 'bg-market-surface-2 text-market-text-mute';
  return (
    <span className={`flex-shrink-0 text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${cls}`}>
      도보 {minutes}분 · {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance}km`}
    </span>
  );
}

// 상세 패널 탭 (네이버페이 부동산 스타일)
type DetailTab = 'price' | 'info' | 'nearby';
const DETAIL_TABS: Array<{ value: DetailTab; label: string }> = [
  { value: 'price', label: '시세/실거래' },
  { value: 'info', label: '단지정보' },
  { value: 'nearby', label: '인근' },
];

export default function ComplexDetailView({ complexKey, point, dealType, onClose }: Props) {
  const [range, setRange] = useState<ChartRange>('6m');
  const [metric, setMetric] = useState<Metric>('price');
  const [tab, setTab] = useState<DetailTab>('price');

  const { data, isFetching } = useComplexDetail(complexKey, range);
  const detail: ComplexDetail | null = data ?? null;
  const busy = isFetching;

  // 인근 탭 — 학교/지하철/버스 (탭 진입 시에만 fetch, 24h 캐시)
  const { data: surroundings, isFetching: surroundingsLoading } = useSurroundings(
    detail?.complex_meta?.lat,
    detail?.complex_meta?.lng,
    detail?.complex_meta?.road_address,
    tab === 'nearby',
  );

  const name = detail?.complex_name || point?.complex_name || '단지';
  const meta = detail?.complex_meta;
  const isTrade = dealType === 'trade';
  const dealColor = DEAL_COLORS[dealType];
  const currentMonthly = detail?.monthly?.[0];

  // KPI 메인 값
  const mainPrice = isTrade
    ? currentMonthly?.avg_price_manwon ?? point?.avg_price_manwon
    : point?.avg_price_manwon;

  // ── 차트 데이터 (매매+전세 듀얼 라인, 지표 토글) ──
  const useP = metric === 'pyeong';
  const showPresale = dealType === 'presale' && !useP;
  const chartData = (detail?.monthly_split ?? []).map((m) => ({
    ym: m.ym.slice(2),
    매매: useP ? (m.trade_pyeong ?? null) : m.trade_avg,
    전세: useP ? (m.rent_pyeong ?? null) : m.rent_avg,
    분양권: showPresale ? (m.presale_avg ?? null) : null,
    거래량:
      dealType === 'trade' ? m.trade_count
      : dealType === 'presale' ? (m.presale_count ?? 0)
      : m.rent_count,
  }));
  const hasChart = chartData.length >= 2;

  // 기간 대비 변동률 (매매 기준)
  const tradeSeries = chartData.map((d) => d.매매).filter((v): v is number => v != null && v > 0);
  const periodDelta =
    tradeSeries.length >= 2 && tradeSeries[0] > 0
      ? ((tradeSeries[tradeSeries.length - 1] - tradeSeries[0]) / tradeSeries[0]) * 100
      : null;

  // dealType에 따라 거래 리스트 분기 (분양권은 별도 배열)
  const recentTxs = dealType === 'presale'
    ? (detail?.recent_silv_transactions ?? []).slice(0, 5)
    : (detail?.recent_transactions ?? []).slice(0, 5);
  const showRecent = (dealType === 'trade' || dealType === 'presale') && recentTxs.length > 0;

  // 평형별 분포 (매매 한정 — 백엔드가 매매로만 집계)
  const unitDist = (detail?.unit_distribution ?? []).filter((u) => u.count > 0);
  const showUnitDist = isTrade && unitDist.length > 0;

  // 건축물대장 메타
  const bm = detail?.building_meta;
  const showBuildingMeta = bm && (
    bm.bc_rat != null || bm.vl_rat != null || bm.land_share_per_hhld != null ||
    bm.parking_total != null || bm.ride_elvt_cnt != null
  );

  // 인근 단지 비교
  const nearby = (detail?.nearby_complexes ?? []).slice(0, 5);
  const showNearby = nearby.length > 0;

  const tooltipStyle = {
    background: 'white',
    border: '1px solid #e4e7eb',
    borderRadius: '10px',
    fontSize: '12px',
    boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
    padding: '8px 12px',
  } as const;

  return (
    <div className="h-full flex flex-col bg-market-surface font-jakarta text-market-text overflow-hidden">
      {/* 헤더 (고정) */}
      <div className="px-5 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <button
                onClick={onClose}
                className="hidden md:inline-flex items-center gap-0.5 text-[11px] text-market-text-mute hover:text-market-text mb-1.5 -ml-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                단지 목록
              </button>
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

      {/* 탭 (고정) — 네이버페이 부동산 스타일 밑줄 탭 */}
      <div className="flex border-b border-market-border flex-shrink-0 px-3" role="tablist">
        {DETAIL_TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`flex-1 py-2.5 text-[13px] text-center transition-colors border-b-2 -mb-px ${
              tab === t.value
                ? 'font-bold text-market-text border-market-text'
                : 'font-medium text-market-text-mute border-transparent hover:text-market-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 스크롤 영역 (탭 콘텐츠) */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
        {tab === 'price' && (
        <>
        {/* 메인 KPI */}
        <div className="px-5 py-4 border-b border-market-border">
          <div className="text-[11px] font-medium text-market-text-mute mb-1.5">
            {DEAL_LABELS[dealType]} 평균 {dealType === 'wolse' || dealType === 'jeonse' ? '보증금' : '거래가'}
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <div
              className="text-[30px] font-extrabold tabular-nums leading-none"
              style={{ color: dealColor }}
            >
              {mainPrice != null ? formatKoreanPrice(mainPrice) : busy ? '…' : '-'}
            </div>
            {dealType === 'wolse' && point?.avg_monthly_manwon != null && (
              <div className="text-sm font-semibold text-market-text-mute tabular-nums">
                / 월 {formatKoreanPrice(point.avg_monthly_manwon)}
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
                {detail.growth_pct > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {detail.growth_pct > 0 ? '+' : ''}
                {detail.growth_pct.toFixed(1)}%
              </span>
            )}
            {isTrade && currentMonthly?.avg_pyeong_price && (
              <span className="text-xs text-market-text-mute tabular-nums">
                평당 <strong className="text-market-text font-semibold">{formatKoreanPrice(currentMonthly.avg_pyeong_price)}</strong>
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

        {/* 가격 추이 — 매매+전세 듀얼 라인 + 기간 탭 + 지표 토글 */}
        <div className="px-5 py-4 border-b border-market-border">
          <div className="flex items-baseline justify-between mb-2.5">
            <div className="text-sm font-bold text-market-text">가격 추이</div>
            <div className="flex items-center gap-2.5 text-[11px] font-medium">
              <span className="flex items-center gap-1" style={{ color: LINE_TRADE }}>
                <span className="w-2 h-2 rounded-full" style={{ background: LINE_TRADE }} />매매
              </span>
              <span className="flex items-center gap-1" style={{ color: LINE_RENT }}>
                <span className="w-2 h-2 rounded-full" style={{ background: LINE_RENT }} />전세
              </span>
              {showPresale && (
                <span className="flex items-center gap-1" style={{ color: LINE_PRESALE }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: LINE_PRESALE }} />분양권
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex gap-1">
              {RANGE_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setRange(t.value)}
                  className={`px-2 py-1 text-[11px] rounded-md font-medium transition-all ${
                    range === t.value
                      ? 'bg-market-text text-white font-semibold'
                      : 'bg-market-surface-2 text-market-text-mute hover:bg-market-border'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-0.5 bg-market-surface-2 rounded-md p-0.5 flex-shrink-0">
              {([['price', '총액'], ['pyeong', '평당가']] as Array<[Metric, string]>).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`px-2 py-0.5 text-[10px] rounded font-medium transition-all ${
                    metric === m
                      ? 'bg-market-surface text-market-text font-semibold shadow-sm'
                      : 'text-market-text-mute hover:text-market-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {hasChart ? (
            <>
              {periodDelta != null && (
                <div className="mb-2">
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      periodDelta > 0
                        ? 'bg-deal-trade-soft text-deal-trade'
                        : periodDelta < 0
                        ? 'bg-deal-jeonse-soft text-deal-jeonse'
                        : 'bg-market-surface-2 text-market-text-mute'
                    }`}
                  >
                    {periodDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    매매 {RANGE_LABEL[range]} 전 대비 {periodDelta > 0 ? '+' : ''}{periodDelta.toFixed(1)}%
                  </span>
                </div>
              )}
              <div className={`h-[240px] -ml-2 transition-opacity ${busy ? 'opacity-60' : ''}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f3" vertical={false} />
                    <XAxis
                      dataKey="ym"
                      tick={{ fontSize: 10, fill: '#9aa0a6' }}
                      axisLine={{ stroke: '#e4e7eb' }}
                      tickLine={false}
                      dy={4}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#9aa0a6' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatEokUnit}
                      width={44}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: '#5a5d63', fontSize: '11px', marginBottom: '3px', fontWeight: 600 }}
                      formatter={(v, n) => {
                        const num = typeof v === 'number' ? v : 0;
                        return num ? [formatKoreanPrice(num), n] : ['-', n];
                      }}
                    />
                    <Line type="monotone" dataKey="매매" name="매매" stroke={LINE_TRADE} strokeWidth={2.2}
                      dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'white' }} connectNulls />
                    <Line type="monotone" dataKey="전세" name="전세" stroke={LINE_RENT} strokeWidth={2.2}
                      dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'white' }} connectNulls />
                    {showPresale && (
                      <Line type="monotone" dataKey="분양권" name="분양권" stroke={LINE_PRESALE} strokeWidth={2.2}
                        dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'white' }} connectNulls />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-xs text-market-text-faint border border-dashed border-market-border rounded-xl text-center px-4">
              {busy ? '차트 로딩 중…' : `${RANGE_LABEL[range]} 추이 데이터 부족 (2개월 이상 필요)`}
            </div>
          )}

          <div className="mt-2 text-[10px] text-market-text-faint leading-relaxed">
            실거래가 기준 · {useP ? '평당가(전용면적)' : '거래금액'} 평균 · 출처: 국토교통부
          </div>
        </div>

        {/* 월별 거래량 */}
        {hasChart && (
          <div className="px-5 py-4 border-b border-market-border">
            <div className="flex items-baseline justify-between mb-2.5">
              <div className="text-sm font-bold text-market-text">월별 거래량</div>
              <div className="text-[11px] text-market-text-faint">{DEAL_LABELS[dealType]} · 건수</div>
            </div>
            <div className="h-[100px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <XAxis dataKey="ym" tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} minTickGap={20} />
                  <YAxis tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [`${typeof v === 'number' ? v : 0}건`, '거래량']}
                  />
                  <Bar dataKey="거래량" fill={dealColor} opacity={0.65} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 평형별 평균 — 매매만, 가로 스크롤 카드 */}
        {showUnitDist && (
          <div className="px-5 py-4 border-b border-market-border">
            <div className="text-[11px] font-semibold text-market-text-mute uppercase tracking-wider mb-2.5">
              평형별 평균
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
              {unitDist.map((u, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 min-w-[92px] bg-market-surface-2 rounded-xl px-3 py-2.5 border border-market-border"
                >
                  <div className="text-[10px] text-market-text-faint font-medium tabular-nums">
                    {u.label}
                  </div>
                  <div
                    className="text-base font-bold tabular-nums mt-0.5 leading-tight"
                    style={{ color: dealColor }}
                  >
                    {formatKoreanPrice(u.avg_price_manwon, 'compact')}
                  </div>
                  <div className="text-[10px] text-market-text-mute tabular-nums mt-0.5">
                    {u.count}건 · 평당 {formatKoreanPrice(u.avg_pyeong_price, 'compact')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    {tx.floor != null && (
                      <span className="text-market-text-faint tabular-nums">{tx.floor}층</span>
                    )}
                  </div>
                  <span className="font-bold text-market-text tabular-nums flex-shrink-0">
                    {tx.price_manwon ? formatKoreanPrice(tx.price_manwon) : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        </>
        )}

        {/* ── 단지정보 탭 ── */}
        {tab === 'info' && (!showBuildingMeta ? (
          <div className="px-6 py-10 text-center text-sm text-market-text-mute">
            건축물대장 정보가 아직 수집되지 않았습니다.
          </div>
        ) : bm && (
          <div className="px-5 py-4 border-b border-market-border">
            <div className="text-[11px] font-semibold text-market-text-mute uppercase tracking-wider mb-2.5">
              단지 정보
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {bm.bc_rat != null && (
                <div className="flex justify-between">
                  <span className="text-market-text-mute">건폐율</span>
                  <span className="text-market-text font-semibold tabular-nums">{bm.bc_rat}%</span>
                </div>
              )}
              {bm.vl_rat != null && (
                <div className="flex justify-between">
                  <span className="text-market-text-mute">용적률</span>
                  <span className="text-market-text font-semibold tabular-nums">{bm.vl_rat}%</span>
                </div>
              )}
              {bm.land_share_per_hhld != null && (
                <div className="flex justify-between">
                  <span className="text-market-text-mute">세대당 대지지분</span>
                  <span className="text-market-text font-semibold tabular-nums">{bm.land_share_per_hhld}㎡</span>
                </div>
              )}
              {bm.parking_total != null && (
                <div className="flex justify-between">
                  <span className="text-market-text-mute">총 주차</span>
                  <span className="text-market-text font-semibold tabular-nums">{bm.parking_total.toLocaleString()}대</span>
                </div>
              )}
              {bm.parking_total != null && meta?.hhld_cnt != null && meta.hhld_cnt > 0 && (
                <div className="flex justify-between">
                  <span className="text-market-text-mute">세대당 주차</span>
                  <span className="text-market-text font-semibold tabular-nums">
                    {(bm.parking_total / meta.hhld_cnt).toFixed(2)}대
                  </span>
                </div>
              )}
              {bm.ride_elvt_cnt != null && (
                <div className="flex justify-between">
                  <span className="text-market-text-mute">승강기</span>
                  <span className="text-market-text font-semibold tabular-nums">{bm.ride_elvt_cnt}기</span>
                </div>
              )}
              {bm.tot_area != null && (
                <div className="flex justify-between">
                  <span className="text-market-text-mute">연면적</span>
                  <span className="text-market-text font-semibold tabular-nums">{Math.round(bm.tot_area).toLocaleString()}㎡</span>
                </div>
              )}
              {bm.main_purps && (
                <div className="flex justify-between">
                  <span className="text-market-text-mute">주용도</span>
                  <span className="text-market-text font-semibold truncate ml-2">{bm.main_purps}</span>
                </div>
              )}
              {bm.strct && (
                <div className="flex justify-between">
                  <span className="text-market-text-mute">구조</span>
                  <span className="text-market-text font-semibold truncate ml-2">{bm.strct}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* ── 인근 탭 — 지하철/버스/학교 + 인근 단지 비교 ── */}
        {tab === 'nearby' && (
        <>
        {/* 지하철 (반경 2km) */}
        <div className="px-5 py-4 border-b border-market-border">
          <div className="flex items-baseline justify-between mb-2.5">
            <div className="text-[11px] font-semibold text-market-text-mute uppercase tracking-wider">지하철</div>
            <div className="text-[10px] text-market-text-faint">반경 2km</div>
          </div>
          {surroundingsLoading ? (
            <div className="text-xs text-market-text-faint py-2">불러오는 중…</div>
          ) : !surroundings || surroundings.subway.length === 0 ? (
            <div className="text-xs text-market-text-faint py-1">반경 내 지하철역이 없습니다</div>
          ) : (
            <div className="space-y-1.5">
              {surroundings.subway.map((st, i) => (
                <div key={i} className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="flex-shrink-0 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: st.lineColor }}
                    >
                      {st.lineName}
                    </span>
                    <span className="font-semibold text-market-text truncate">{st.stationName}</span>
                    {st.isTransfer && (
                      <span className="flex-shrink-0 text-[9px] text-market-text-faint border border-market-border rounded px-1">환승</span>
                    )}
                  </div>
                  <WalkBadge minutes={st.walkingTime} distance={st.distance} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 버스 정류장 (반경 600m) */}
        <div className="px-5 py-4 border-b border-market-border">
          <div className="flex items-baseline justify-between mb-2.5">
            <div className="text-[11px] font-semibold text-market-text-mute uppercase tracking-wider">버스 정류장</div>
            <div className="text-[10px] text-market-text-faint">반경 600m</div>
          </div>
          {surroundingsLoading ? (
            <div className="text-xs text-market-text-faint py-2">불러오는 중…</div>
          ) : !surroundings || surroundings.bus.length === 0 ? (
            <div className="text-xs text-market-text-faint py-1">반경 내 정류장 정보가 없습니다</div>
          ) : (
            <div className="space-y-1.5">
              {surroundings.bus.map((b, i) => (
                <div key={i} className="flex items-center justify-between text-xs gap-2">
                  <span className="font-medium text-market-text truncate">{b.stationName}</span>
                  <WalkBadge minutes={b.walkingTime} distance={b.distance} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 학교 (반경 1.5km — 초/중/고) */}
        <div className="px-5 py-4 border-b border-market-border">
          <div className="flex items-baseline justify-between mb-2.5">
            <div className="text-[11px] font-semibold text-market-text-mute uppercase tracking-wider">학교</div>
            <div className="text-[10px] text-market-text-faint">반경 1.5km</div>
          </div>
          {surroundingsLoading ? (
            <div className="text-xs text-market-text-faint py-2">불러오는 중…</div>
          ) : !surroundings ? (
            <div className="text-xs text-market-text-faint py-1">학교 정보가 없습니다</div>
          ) : (
            <div className="space-y-3">
              {([
                ['초등학교', surroundings.schools.elementary],
                ['중학교', surroundings.schools.middle],
                ['고등학교', surroundings.schools.high],
              ] as Array<[string, NearbySchool[]]>).map(([label, list]) => (
                <div key={label}>
                  <div className="text-[10px] font-semibold text-market-text-faint mb-1">{label}</div>
                  {list.length === 0 ? (
                    <div className="text-[11px] text-market-text-faint">반경 내 없음</div>
                  ) : (
                    <div className="space-y-1">
                      {list.map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-semibold text-market-text truncate">{s.schoolName}</span>
                            <span className="flex-shrink-0 text-[9px] text-market-text-faint border border-market-border rounded px-1">
                              {s.foundationType}
                            </span>
                          </div>
                          <WalkBadge minutes={s.walkingTime} distance={s.distance} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 인근 단지 비교 (반경 2km 내 거리 순) */}
        {!showNearby ? (
          <div className="px-5 py-4 border-b border-market-border">
            <div className="text-[11px] font-semibold text-market-text-mute uppercase tracking-wider mb-2">인근 단지 비교</div>
            <div className="text-xs text-market-text-faint">반경 2km 내 비교할 거래 데이터가 없습니다</div>
          </div>
        ) : (
          <div className="px-5 py-4 border-b border-market-border">
            <div className="flex items-baseline justify-between mb-2.5">
              <div className="text-[11px] font-semibold text-market-text-mute uppercase tracking-wider">
                인근 단지 비교
              </div>
              <div className="text-[10px] text-market-text-faint">반경 2km</div>
            </div>
            <div className="space-y-1.5">
              {nearby.map((n) => (
                <div key={n.complex_key} className="flex items-center justify-between text-xs gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-market-text font-medium truncate">{n.complex_name}</div>
                    <div className="text-[10px] text-market-text-faint tabular-nums">
                      {n.distance_km != null ? `${n.distance_km}km` : '-'}
                      {' · '}
                      평당 {formatKoreanPrice(n.avg_pyeong_price, 'compact')}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className="text-sm font-bold tabular-nums leading-tight"
                      style={{ color: dealColor }}
                    >
                      {formatKoreanPrice(n.avg_price_manwon, 'compact')}
                    </div>
                    <div className="text-[10px] text-market-text-faint tabular-nums">
                      {n.trade_count}건
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </>
        )}
      </div>

      {/* 푸터 — 데이터 출처 + AI 분석 링크 */}
      <div className="px-5 py-2.5 border-t border-market-border bg-market-surface flex-shrink-0 flex items-center justify-between">
        <div className="text-[10px] text-market-text-faint">국토부 실거래가</div>
        <Link
          href={`/market/insights/${encodeURIComponent(complexKey)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-semibold text-deal-jeonse hover:underline flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          AI 깊은 분석
        </Link>
      </div>
    </div>
  );
}
