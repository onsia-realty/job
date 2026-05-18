'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, MapPin, Building2, Crown } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

type Metric = 'count' | 'price' | 'pyeong';
type PropertyType = 'apt' | 'officetel';
type SidoFilter = 'all' | '서울특별시' | '경기도';

interface RankingItem {
  complex_key: string;
  complex_name: string;
  lawd_cd: string;
  trade_count: number;
  avg_price_manwon: number;
  avg_pyeong_price: number;
  median_price_manwon: number;
  ym: string;
}

const KRW = (n: number) => Math.round(n).toLocaleString('ko-KR');
const formatPrice = (v: number) =>
  v >= 10000 ? `${(v / 10000).toFixed(1).replace(/\.0$/, '')}억` : `${Math.round(v / 1000)}천`;

const METRIC_META: Record<Metric, { label: string; unit: string; color: string }> = {
  count: { label: '거래량', unit: '건', color: '#2563eb' },
  price: { label: '평균 매매가', unit: '만원', color: '#e11d48' },
  pyeong: { label: '평당가', unit: '만원/평', color: '#ea580c' },
};

export default function MarketRankingsPage() {
  const [metric, setMetric] = useState<Metric>('count');
  const [property_type, setPropertyType] = useState<PropertyType>('apt');
  const [sido, setSido] = useState<SidoFilter>('all');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<RankingItem[]>([]);
  const [ym, setYm] = useState<string>('');
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    setEnabled(process.env.NEXT_PUBLIC_MARKET_ENABLED === 'true');
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ metric, type: property_type });
        if (sido !== 'all') params.set('sido', sido);
        const res = await fetch(`/api/market/rankings/top10?${params}`);
        if (!res.ok) {
          setItems([]);
          return;
        }
        const data = await res.json();
        setItems(data.rankings || []);
        setYm(data.ym || '');
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [metric, property_type, sido]);

  if (!enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-market-bg text-market-text font-jakarta">
        <p className="text-market-text-mute">준비 중입니다.</p>
      </div>
    );
  }

  const meta = METRIC_META[metric];
  const chartData = items.map((it, idx) => ({
    rank: idx + 1,
    name: it.complex_name.length > 10 ? `${it.complex_name.slice(0, 9)}…` : it.complex_name,
    value:
      metric === 'count' ? it.trade_count
      : metric === 'price' ? it.avg_price_manwon
      : it.avg_pyeong_price,
  }));

  return (
    <div className="min-h-screen bg-market-bg font-jakarta text-market-text">
      <header className="sticky top-0 z-10 bg-market-surface/95 backdrop-blur border-b border-market-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/market" className="p-2 rounded-lg hover:bg-market-surface-2 text-market-text-mute transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-deal-jeonse" />
            TOP 10 랭킹
          </h1>
          {ym && (
            <span className="ml-auto text-[11px] text-market-text-faint tabular-nums">
              {ym.slice(0, 7)} 기준
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-5">
        {/* 필터 */}
        <div className="flex flex-wrap gap-2">
          <ButtonGroup
            value={metric}
            onChange={(v) => setMetric(v as Metric)}
            options={[
              { value: 'count', label: '거래량' },
              { value: 'price', label: '평균가' },
              { value: 'pyeong', label: '평당가' },
            ]}
          />
          <ButtonGroup
            value={property_type}
            onChange={(v) => setPropertyType(v as PropertyType)}
            options={[
              { value: 'apt', label: '아파트' },
              { value: 'officetel', label: '오피스텔' },
            ]}
          />
          <ButtonGroup
            value={sido}
            onChange={(v) => setSido(v as SidoFilter)}
            options={[
              { value: 'all', label: '전체' },
              { value: '서울특별시', label: '서울' },
              { value: '경기도', label: '경기' },
            ]}
          />
        </div>

        {loading ? (
          <div className="py-20 text-center text-market-text-faint text-sm">불러오는 중…</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-market-text-faint text-sm">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            데이터가 아직 수집되지 않았습니다. cron 동기화 후 다시 확인해주세요.
          </div>
        ) : (
          <>
            {/* 차트 */}
            <section className="bg-market-surface border border-market-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-baseline justify-between mb-3">
                <div className="text-sm font-bold">{meta.label} TOP 10</div>
                <div className="text-[11px] text-market-text-faint">{meta.unit}</div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: '#9aa0a6' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={metric === 'count' ? (v) => `${v}` : formatPrice}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#5a5d63' }}
                      axisLine={false}
                      tickLine={false}
                      width={88}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #e4e7eb',
                        borderRadius: '10px',
                        fontSize: '12px',
                        padding: '8px 12px',
                      }}
                      formatter={(v) => {
                        const n = typeof v === 'number' ? v : 0;
                        if (metric === 'count') return [`${n}건`, meta.label];
                        return [`${KRW(n)}만`, meta.label];
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                      {chartData.map((_, idx) => (
                        <Cell key={idx} fill={meta.color} opacity={idx < 3 ? 1 : 0.45 + (10 - idx) * 0.04} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* 리스트 */}
            <ol className="bg-market-surface rounded-2xl border border-market-border divide-y divide-market-border shadow-sm">
              {items.map((item, idx) => (
                <li key={item.complex_key} className="px-4 py-3 flex items-center gap-3 hover:bg-market-surface-2 transition-colors">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    idx === 0 ? 'bg-amber-400 text-white' :
                    idx === 1 ? 'bg-slate-400 text-white' :
                    idx === 2 ? 'bg-orange-300 text-white' :
                    'bg-market-surface-2 text-market-text-mute'
                  }`}>
                    {idx < 3 ? <Crown className="w-4 h-4" /> : idx + 1}
                  </span>
                  <Link
                    href={`/market/insights/${encodeURIComponent(item.complex_key)}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="font-semibold text-sm text-market-text truncate hover:text-deal-jeonse">
                      {item.complex_name}
                    </div>
                    <div className="text-[11px] text-market-text-faint flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="tabular-nums">{item.lawd_cd}</span>
                    </div>
                  </Link>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-extrabold tabular-nums" style={{ color: meta.color }}>
                      {metric === 'count' && `${item.trade_count}건`}
                      {metric === 'price' && `${KRW(item.avg_price_manwon)}만`}
                      {metric === 'pyeong' && `${KRW(item.avg_pyeong_price)}만`}
                    </div>
                    <div className="text-[10px] text-market-text-faint tabular-nums">
                      평균 {KRW(item.avg_price_manwon)}만 · {item.trade_count}건
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}

        <div className="text-[11px] text-market-text-faint text-center pt-2 pb-4">
          데이터 출처: 국토교통부 실거래가 공개시스템
        </div>
      </main>
    </div>
  );
}

function ButtonGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="flex bg-market-surface-2 rounded-lg p-0.5 border border-market-border">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors font-medium ${
            value === o.value
              ? 'bg-market-text text-white shadow-sm'
              : 'text-market-text-mute hover:text-market-text'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
