'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, BarChart3, MapPin, Building2 } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-slate-400">준비 중입니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <header className="sticky top-0 z-10 bg-[#0B0F14]/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/market" className="p-2 rounded-lg hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            TOP 10 랭킹
          </h1>
          {ym && (
            <span className="ml-auto text-[11px] text-slate-500">
              {ym.slice(0, 7)} 기준
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-4">
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

        {/* 리스트 */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">불러오는 중…</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            데이터가 아직 수집되지 않았습니다. cron 동기화 후 다시 확인해주세요.
          </div>
        ) : (
          <ol className="bg-slate-900 rounded-xl border border-slate-800 divide-y divide-slate-800">
            {items.map((item, idx) => (
              <li key={item.complex_key} className="px-4 py-3 flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  idx < 3 ? 'bg-cyan-500 text-[#0B0F14]' : 'bg-slate-800 text-slate-400'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{item.complex_name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    {item.lawd_cd}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-cyan-300">
                    {metric === 'count' && `${item.trade_count}건`}
                    {metric === 'price' && `${KRW(item.avg_price_manwon)}만`}
                    {metric === 'pyeong' && `${KRW(item.avg_pyeong_price)}만/평`}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    평균 {KRW(item.avg_price_manwon)}만 · {item.trade_count}건
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="text-[11px] text-slate-600 text-center pt-4">
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
    <div className="flex bg-slate-800 rounded-lg p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
            value === o.value
              ? 'bg-cyan-500 text-[#0B0F14] font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
