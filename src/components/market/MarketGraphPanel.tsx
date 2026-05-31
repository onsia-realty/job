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
  const data = fetched ?? detail;        // hook 우선, prop fallback (첫 렌더 즉시 표시)
  const busy = isFetching || loading;

  const name = data?.complex_name || point?.complex_name || '단지';
  const isTrade = dealType === 'trade';
  const dealColor = DEAL_COLORS[dealType];

  // 평당가(매매 전용) — monthly MV의 ym → avg_pyeong_price 매핑
  const pyeongByYm = new Map(
    (data?.monthly ?? []).map((m) => [String(m.ym).slice(0, 7), m.avg_pyeong_price]),
  );

  const chartData = (data?.monthly_split ?? []).map((m) => ({
    ym: m.ym.slice(2),
    매매: m.trade_avg,
    전세: m.rent_avg,
    분양권: m.presale_avg ?? null,
    평당: pyeongByYm.get(m.ym.slice(0, 7)) ?? null,
    거래량:
      dealType === 'trade' ? m.trade_count
      : dealType === 'presale' ? (m.presale_count ?? 0)
      : m.rent_count,
  }));

  const unitDist = data?.unit_distribution ?? [];
  const hasChart = chartData.length >= 2;
  const hasUnits = unitDist.length > 0;

  // 가격 라인 dataKey — 거래유형(매매/전세/분양권) 또는 평당가(매매 한정)
  const priceKey = isTrade ? '매매' : dealType === 'presale' ? '분양권' : '전세';
  const showMetricToggle = isTrade; // 평당가 데이터는 매매만 존재
  const lineKey = metric === 'pyeong' && showMetricToggle ? '평당' : priceKey;
  const metricUnit = lineKey === '평당' ? '만원/평' : '만원';

  return (
    <div className="h-full flex flex-col bg-market-surface font-jakarta text-market-text overflow-hidden">
      {/* 헤더 — 단지명 + KPI 요약 + AI 분석 링크 */}
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
        {isTrade && data?.growth_pct != null && (
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                data.growth_pct > 0
                  ? 'bg-deal-trade-soft text-deal-trade'
                  : data.growth_pct < 0
                  ? 'bg-deal-jeonse-soft text-deal-jeonse'
                  : 'bg-market-surface-2 text-market-text-mute'
              }`}
            >
              {data.growth_pct > 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {data.growth_pct > 0 ? '+' : ''}
              {data.growth_pct.toFixed(1)}%
            </span>
            <span className="text-xs text-market-text-mute">전월 대비</span>
          </div>
        )}
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
        {/* 큰 가격 추이 차트 */}
        <div className="px-6 py-5 border-b border-market-border">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="text-sm font-bold text-market-text">가격 추이</div>
              <div className="text-[11px] text-market-text-faint mt-0.5 tabular-nums">
                {RANGE_LABEL[range]} · 단위 {metricUnit}
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: dealColor }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: dealColor }} />
              {lineKey === '평당' ? '평당가' : DEAL_LABELS[dealType]}
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
            {showMetricToggle && (
              <div className="flex gap-0.5 bg-market-surface-2 rounded-md p-0.5 flex-shrink-0">
                {([['price', '총액'], ['pyeong', '평당가']] as Array<[Metric, string]>).map(
                  ([m, label]) => (
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
                  ),
                )}
              </div>
            )}
          </div>

          {hasChart ? (
            <div className={`h-[320px] -ml-2 transition-opacity ${busy ? 'opacity-60' : ''}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dealGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={dealColor} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={dealColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f3" vertical={false} />
                  <XAxis
                    dataKey="ym"
                    tick={{ fontSize: 11, fill: '#9aa0a6' }}
                    axisLine={{ stroke: '#e4e7eb' }}
                    tickLine={false}
                    dy={4}
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
                    formatter={(v) => {
                      const n = typeof v === 'number' ? v : 0;
                      return n ? [`${KRW(n)}만`, ''] : ['-', ''];
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={lineKey}
                    stroke={dealColor}
                    strokeWidth={3}
                    dot={{ r: 4, fill: dealColor, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-sm text-market-text-faint border border-dashed border-market-border rounded-xl text-center px-4">
              {busy
                ? '차트 로딩 중…'
                : `${RANGE_LABEL[range]} 추이 데이터 부족 (2개월 이상 필요)\n실거래가 누적되면 표시됩니다`}
            </div>
          )}
        </div>

        {/* 월별 거래량 */}
        {hasChart && (
          <div className="px-6 py-5 border-b border-market-border">
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-sm font-bold text-market-text">월별 거래량</div>
              <div className="text-[11px] text-market-text-faint">건수</div>
            </div>
            <div className="h-[120px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
                  <XAxis
                    dataKey="ym"
                    tick={{ fontSize: 10, fill: '#9aa0a6' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9aa0a6' }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e4e7eb',
                      borderRadius: '10px',
                      fontSize: '12px',
                      padding: '8px 12px',
                    }}
                    formatter={(v) => [`${typeof v === 'number' ? v : 0}건`, '거래량']}
                  />
                  <Bar dataKey="거래량" fill={dealColor} opacity={0.65} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 평형별 분포 (매매만) */}
        {isTrade && hasUnits && (
          <div className="px-6 py-5 border-b border-market-border">
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-sm font-bold text-market-text">평형별 평균</div>
              <div className="text-[11px] text-market-text-faint">단위 만원</div>
            </div>
            <div className="h-[160px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={unitDist}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f3" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#9aa0a6' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatPrice}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#5a5d63' }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e4e7eb',
                      borderRadius: '10px',
                      fontSize: '12px',
                      padding: '8px 12px',
                    }}
                    formatter={(v, _name, item) => {
                      const n = typeof v === 'number' ? v : 0;
                      const count = (item?.payload as { count?: number })?.count ?? 0;
                      return [`${KRW(n)}만 (${count}건)`, '평균'];
                    }}
                  />
                  <Bar dataKey="avg_price_manwon" radius={[0, 4, 4, 0]} barSize={18}>
                    {unitDist.map((_, idx) => (
                      <Cell key={idx} fill={dealColor} opacity={0.45 + (idx * 0.1)} />
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
            <span className="text-[11px] text-market-text-faint">
              실거래 신고가 누적되면 자동으로 표시됩니다.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
