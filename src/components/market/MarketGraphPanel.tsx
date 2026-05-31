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
  Cell,
} from 'recharts';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import type { MapComplexPoint, DealTypeFilter } from './MarketMap.client';
import type { ComplexDetail } from './MarketDetailPanel';
import { useComplexDetail, type ChartRange } from '@/lib/market/queries';

interface Props {
  point: MapComplexPoint | undefined;
  detail: ComplexDetail | null;
  loading: boolean;
  dealType: DealTypeFilter;
  complexKey?: string;
}

const DEAL_COLORS: Record<DealTypeFilter, string> = {
  trade: '#e11d48',
  jeonse: '#2563eb',
  wolse: '#059669',
  presale: '#7c3aed',
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

// 차트 기간 탭
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

const KRW = (n: number) => Math.round(n).toLocaleString('ko-KR');
const formatPrice = (v: number) =>
  v >= 10000 ? `${(v / 10000).toFixed(1).replace(/\.0$/, '')}억` : `${Math.round(v / 1000)}천`;

export default function MarketGraphPanel({ point, detail, loading, dealType, complexKey }: Props) {
  const [range, setRange] = useState<ChartRange>('6m');
  const [metric, setMetric] = useState<Metric>('price');

  // 기간 탭에 따른 데이터 — React Query. 기본 6m은 부모 캐시(같은 키) 공유 → 추가 fetch 없음.
  const { data: fetched, isFetching } = useComplexDetail(complexKey ?? null, range);
  const data = fetched ?? detail;
  const busy = isFetching || loading;

  const name = data?.complex_name || point?.complex_name || '단지';
  const useP = metric === 'pyeong';
  const showPresale = dealType === 'presale' && !useP; // 분양권 평당가 미제공 → 총액일 때만

  // 매매 + 전세 듀얼 라인 (지표 토글: 총액 ↔ 평당가)
  const chartData = (data?.monthly_split ?? []).map((m) => ({
    ym: m.ym.slice(2),
    매매: useP ? (m.trade_pyeong ?? null) : m.trade_avg,
    전세: useP ? (m.rent_pyeong ?? null) : m.rent_avg,
    분양권: showPresale ? (m.presale_avg ?? null) : null,
    거래량:
      dealType === 'trade' ? m.trade_count
      : dealType === 'presale' ? (m.presale_count ?? 0)
      : m.rent_count,
  }));

  const unitDist = data?.unit_distribution ?? [];
  const hasChart = chartData.length >= 2;
  const hasUnits = unitDist.length > 0;

  // ── 대표 수치 + 기간 대비 변동률 (매매 기준) ──
  const tradeSeries = chartData.map((d) => d.매매).filter((v): v is number => v != null && v > 0);
  const latestTrade = tradeSeries.length > 0 ? tradeSeries[tradeSeries.length - 1] : null;
  const periodDelta =
    tradeSeries.length >= 2 && tradeSeries[0] > 0
      ? ((tradeSeries[tradeSeries.length - 1] - tradeSeries[0]) / tradeSeries[0]) * 100
      : null;
  const bigValue = (v: number) => (useP ? `${KRW(v)}만` : formatPrice(v));
  const metricUnit = useP ? '만원/평' : '만원';

  return (
    <div className="h-full flex flex-col bg-market-surface font-jakarta text-market-text overflow-hidden">
      {/* 헤더 — 단지명 + 대표수치 + 기간대비 변동 + AI 분석 링크 */}
      <div className="px-6 pt-5 pb-4 border-b border-market-border flex-shrink-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="text-[10px] font-semibold text-market-text-faint uppercase tracking-wider">
            {DEAL_LABELS[dealType]} 가격 분석
          </div>
          {complexKey && (
            <Link
              href={`/market/insights/${encodeURIComponent(complexKey)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold text-deal-jeonse hover:underline flex items-center gap-1 flex-shrink-0"
            >
              <Sparkles className="w-3 h-3" />
              AI 깊은 분석
            </Link>
          )}
        </div>
        <h2 className="text-xl font-extrabold text-market-text leading-tight truncate">{name}</h2>

        {/* 대표 수치 (매매 평당가/총액) + N기간 전 대비 % */}
        {latestTrade != null && (
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-extrabold text-market-text tabular-nums">
              {bigValue(latestTrade)}
            </span>
            <span className="text-[11px] text-market-text-faint">
              매매 {useP ? '평당가' : '평균'}
            </span>
            {periodDelta != null && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ml-1 ${
                  periodDelta > 0
                    ? 'bg-deal-trade-soft text-deal-trade'
                    : periodDelta < 0
                    ? 'bg-deal-jeonse-soft text-deal-jeonse'
                    : 'bg-market-surface-2 text-market-text-mute'
                }`}
              >
                {periodDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {RANGE_LABEL[range]} 전 대비 {periodDelta > 0 ? '+' : ''}
                {periodDelta.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
        {/* 가격 추이 — 매매+전세 듀얼 라인 */}
        <div className="px-6 py-5 border-b border-market-border">
          <div className="flex items-baseline justify-between mb-3">
            <div className="text-sm font-bold text-market-text">가격 추이</div>
            {/* 범례 */}
            <div className="flex items-center gap-3 text-[11px] font-medium">
              <span className="flex items-center gap-1" style={{ color: LINE_TRADE }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: LINE_TRADE }} />매매
              </span>
              <span className="flex items-center gap-1" style={{ color: LINE_RENT }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: LINE_RENT }} />전세
              </span>
              {showPresale && (
                <span className="flex items-center gap-1" style={{ color: LINE_PRESALE }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: LINE_PRESALE }} />분양권
                </span>
              )}
            </div>
          </div>

          {/* 기간 탭 + 지표 토글 */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex gap-1">
              {RANGE_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setRange(t.value)}
                  className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all ${
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
            <div className={`h-[320px] -ml-2 transition-opacity ${busy ? 'opacity-60' : ''}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f3" vertical={false} />
                  <XAxis
                    dataKey="ym"
                    tick={{ fontSize: 11, fill: '#9aa0a6' }}
                    axisLine={{ stroke: '#e4e7eb' }}
                    tickLine={false}
                    dy={4}
                    minTickGap={24}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9aa0a6' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatPrice}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e4e7eb',
                      borderRadius: '10px',
                      fontSize: '12px',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                      padding: '8px 12px',
                    }}
                    labelStyle={{ color: '#5a5d63', fontSize: '11px', marginBottom: '3px', fontWeight: 600 }}
                    formatter={(v, n) => {
                      const num = typeof v === 'number' ? v : 0;
                      return num ? [`${KRW(num)}만`, n] : ['-', n];
                    }}
                  />
                  <Line type="monotone" dataKey="매매" name="매매" stroke={LINE_TRADE} strokeWidth={2.5}
                    dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }} connectNulls />
                  <Line type="monotone" dataKey="전세" name="전세" stroke={LINE_RENT} strokeWidth={2.5}
                    dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }} connectNulls />
                  {showPresale && (
                    <Line type="monotone" dataKey="분양권" name="분양권" stroke={LINE_PRESALE} strokeWidth={2.5}
                      dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }} connectNulls />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-sm text-market-text-faint border border-dashed border-market-border rounded-xl text-center px-4">
              {busy ? '차트 로딩 중…' : `${RANGE_LABEL[range]} 추이 데이터 부족 (2개월 이상 필요)`}
            </div>
          )}

          {/* 출처 / 기준 푸터 */}
          <div className="mt-2.5 text-[10px] text-market-text-faint leading-relaxed">
            실거래가 기준 · {useP ? '전용면적' : '거래금액'} 평균 · 단위 {metricUnit}
            <br />
            출처: 국토교통부 실거래가 (전세는 보증금 기준, 월세 제외)
          </div>
        </div>

        {/* 월별 거래량 */}
        {hasChart && (
          <div className="px-6 py-5 border-b border-market-border">
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-sm font-bold text-market-text">월별 거래량</div>
              <div className="text-[11px] text-market-text-faint">{DEAL_LABELS[dealType]} · 건수</div>
            </div>
            <div className="h-[120px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
                  <XAxis dataKey="ym" tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} minTickGap={20} />
                  <YAxis tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip
                    contentStyle={{ background: 'white', border: '1px solid #e4e7eb', borderRadius: '10px', fontSize: '12px', padding: '8px 12px' }}
                    formatter={(v) => [`${typeof v === 'number' ? v : 0}건`, '거래량']}
                  />
                  <Bar dataKey="거래량" fill={DEAL_COLORS[dealType]} opacity={0.65} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 평형별 분포 (매매만) */}
        {dealType === 'trade' && hasUnits && (
          <div className="px-6 py-5 border-b border-market-border">
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-sm font-bold text-market-text">평형별 평균</div>
              <div className="text-[11px] text-market-text-faint">단위 만원</div>
            </div>
            <div className="h-[160px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitDist} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} tickFormatter={formatPrice} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#5a5d63' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ background: 'white', border: '1px solid #e4e7eb', borderRadius: '10px', fontSize: '12px', padding: '8px 12px' }}
                    formatter={(v, _name, item) => {
                      const n = typeof v === 'number' ? v : 0;
                      const count = (item?.payload as { count?: number })?.count ?? 0;
                      return [`${KRW(n)}만 (${count}건)`, '평균'];
                    }}
                  />
                  <Bar dataKey="avg_price_manwon" radius={[0, 4, 4, 0]} barSize={18}>
                    {unitDist.map((_, idx) => (
                      <Cell key={idx} fill={LINE_TRADE} opacity={0.45 + idx * 0.1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 데이터가 전혀 없을 때 안내 */}
        {!hasChart && !hasUnits && !busy && (
          <div className="px-6 py-10 text-center text-sm text-market-text-mute">
            이 단지의 분석 데이터가 부족합니다.
            <br />
            <span className="text-[11px] text-market-text-faint">실거래 신고가 누적되면 자동으로 표시됩니다.</span>
          </div>
        )}
      </div>
    </div>
  );
}
