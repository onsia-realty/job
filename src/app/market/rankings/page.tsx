'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, TrendingUp, TrendingDown, BarChart3, Coins, Ruler,
  Crown, MapPin, Lock, Building2, Search, Loader2, Users,
} from 'lucide-react';
import { formatKoreanPrice } from '@/lib/market/format';

type Metric = 'count' | 'price' | 'pyeong' | 'highest' | 'region_up' | 'region_down';
type PropertyType = 'apt' | 'officetel';
type RegionSel = 'all' | '서울특별시' | '경기도';

interface RankingItem {
  // 공통/단지
  complex_key?: string;
  complex_name?: string;
  lawd_cd?: string;
  region_name?: string;
  trade_count?: number;
  avg_price_manwon?: number;
  avg_pyeong_price?: number;
  ym?: string;
  // 신고가
  pyeong?: number;
  exclusive_area?: number;
  hhld_cnt?: number | null;
  recent_date?: string;
  recent_price_manwon?: number;
  recent_floor?: number | null;
  // 지역 변동률
  cur_avg_manwon?: number;
  prev_avg_manwon?: number;
  diff_pct?: number;
}

interface SearchResult {
  complex_key: string;
  complex_name: string;
  address: string | null;
}

const isRegion = (m: Metric) => m === 'region_up' || m === 'region_down';
const isHighest = (m: Metric) => m === 'highest';
const VALID_METRICS: Metric[] = ['count', 'price', 'pyeong', 'highest'];
const fmtDate = (d?: string) => (d ? d.slice(2).replace(/-/g, '.') : '');

interface Indicator { key: Metric; label: string; desc: string; Icon: typeof TrendingUp; accent: string; }

// "온시아 시세자료 지표" — 활성 지표 (모두 노이즈에 강한 집계/절대값 기반)
const INDICATORS: Indicator[] = [
  { key: 'highest',     label: '신고가',   desc: '최고 실거래가 단지',   Icon: Crown,        accent: '#7c3aed' },
  { key: 'count',       label: '거래량',   desc: '이번 달 거래 많은 단지', Icon: BarChart3,  accent: '#2563eb' },
  { key: 'price',       label: '평균 매매가', desc: '평균 매매가 높은 단지', Icon: Coins,    accent: '#e11d48' },
  { key: 'pyeong',      label: '평당가',   desc: '평당 가격 순위',        Icon: Ruler,       accent: '#ea580c' },
];

// 준비 중 (데이터·정제 보강 후 오픈)
const COMING = [
  { label: '지역변동률', desc: '구별 평균 상승·하락', Icon: TrendingUp },
  { label: '갭투자', desc: '매매−전세 갭', Icon: Coins },
  { label: '인구변화', desc: '지역 인구 이동', Icon: Users },
];

const REGIONS: Array<{ label: string; sido: RegionSel }> = [
  { label: '전체', sido: 'all' },
  { label: '서울', sido: '서울특별시' },
  { label: '경기', sido: '경기도' },
];
const COMING_REGIONS = ['인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

function MarketIndicatorsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramMetric = searchParams.get('metric') as Metric | null;
  const [metric, setMetric] = useState<Metric>(
    paramMetric && VALID_METRICS.includes(paramMetric) ? paramMetric : 'highest'
  );
  const [property_type, setPropertyType] = useState<PropertyType>('apt');
  const [sido, setSido] = useState<RegionSel>('서울특별시');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<RankingItem[]>([]);
  const [enabled, setEnabled] = useState(true);

  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setEnabled(process.env.NEXT_PUBLIC_MARKET_ENABLED === 'true'); }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ metric, type: property_type });
        if (sido !== 'all') params.set('sido', sido);
        const res = await fetch(`/api/market/rankings/top10?${params}`);
        if (!res.ok) { setItems([]); return; }
        const data = await res.json();
        setItems(data.rankings || []);
      } catch { setItems([]); }
      finally { setLoading(false); }
    })();
  }, [metric, property_type, sido]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.trim().length < 1) { setSearchResults([]); setShowResults(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setSearchResults(data.results || []);
        setShowResults(true);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 250);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [q]);

  if (!enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-market-bg text-market-text font-jakarta">
        <p className="text-market-text-mute">준비 중입니다.</p>
      </div>
    );
  }

  const active = INDICATORS.find((i) => i.key === metric)!;

  return (
    <div className="min-h-screen bg-market-bg font-jakarta text-market-text">
      <header className="sticky top-0 z-20 bg-market-surface/95 backdrop-blur border-b border-market-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/market" className="p-2 rounded-lg hover:bg-market-surface-2 text-market-text-mute transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-deal-jeonse" />
            부인(BOOIN) 시세자료 지표
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-6">
        {/* 검색 */}
        <section className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-market-text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => { if (searchResults.length) setShowResults(true); }}
              placeholder="아파트명을 검색해보세요"
              spellCheck={false}
              autoComplete="off"
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-market-border bg-market-surface text-market-text placeholder:text-market-text-faint focus:outline-none focus:ring-2 focus:ring-deal-jeonse/40 shadow-sm"
            />
            {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-market-text-faint" />}
          </div>
          {showResults && searchResults.length > 0 && (
            <ul className="absolute z-30 mt-2 w-full bg-market-surface border border-market-border rounded-2xl shadow-lg overflow-hidden max-h-80 overflow-y-auto">
              {searchResults.map((r) => (
                <li key={r.complex_key}>
                  <button onClick={() => { setShowResults(false); router.push(`/market/insights/${encodeURIComponent(r.complex_key)}`); }} className="w-full text-left px-4 py-3 hover:bg-market-surface-2 transition-colors flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-market-text-faint flex-shrink-0" />
                    <span className="font-semibold text-sm text-market-text truncate">{r.complex_name}</span>
                    {r.address && <span className="text-[11px] text-market-text-faint truncate ml-auto">{r.address}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 지역 선택 */}
        <section>
          <div className="text-xs font-bold text-market-text-mute mb-2">지역 선택</div>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button key={r.sido} onClick={() => setSido(r.sido)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${sido === r.sido ? 'bg-market-text text-white border-transparent shadow-sm' : 'bg-market-surface text-market-text-mute border-market-border hover:border-market-text-faint'}`}>
                {r.label}
              </button>
            ))}
            {COMING_REGIONS.map((label) => (
              <span key={label} className="px-4 py-2 rounded-xl text-sm font-medium border border-dashed border-market-border text-market-text-faint opacity-50 cursor-not-allowed select-none">{label}</span>
            ))}
          </div>
          <div className="text-[11px] text-market-text-faint mt-1.5">서울·경기 우선 제공, 그 외 지역은 단계적으로 확대됩니다.</div>
        </section>

        {/* 시세자료 지표 카드 */}
        <section>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-xs font-bold text-market-text-mute">시세자료 지표</span>
            <span className="text-[11px] text-market-text-faint">보고 싶은 지표를 선택하세요</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {INDICATORS.map((ind) => {
              const on = metric === ind.key;
              const Icon = ind.Icon;
              return (
                <button key={ind.key} onClick={() => setMetric(ind.key)}
                  className={`text-left rounded-2xl border p-3.5 transition-all ${on ? 'bg-market-surface shadow-md ring-2 border-transparent' : 'bg-market-surface border-market-border hover:border-market-text-faint hover:shadow-sm'}`}
                  style={on ? ({ '--tw-ring-color': ind.accent } as React.CSSProperties) : undefined}>
                  <Icon className="w-5 h-5 mb-2" style={{ color: ind.accent }} />
                  <div className="text-sm font-bold text-market-text">{ind.label}</div>
                  <div className="text-[11px] text-market-text-faint mt-0.5 leading-tight">{ind.desc}</div>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-2.5 mt-2.5">
            {COMING.map((c) => {
              const Icon = c.Icon;
              return (
                <div key={c.label} className="rounded-2xl border border-dashed border-market-border p-3 opacity-60">
                  <div className="flex items-center gap-1.5 text-market-text-faint">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold">{c.label}</span>
                    <Lock className="w-3 h-3 ml-auto" />
                  </div>
                  <div className="text-[10px] text-market-text-faint mt-1">{c.desc} · 준비 중</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 결과 */}
        <section className="bg-market-surface border border-market-border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-market-border">
            <active.Icon className="w-4 h-4" style={{ color: active.accent }} />
            <span className="text-sm font-bold">{active.label}{isRegion(metric) ? ' 순위' : ' TOP'}</span>
            <div className="ml-auto flex bg-market-surface-2 rounded-lg p-0.5 border border-market-border">
              {(['apt', 'officetel'] as PropertyType[]).map((t) => (
                <button key={t} onClick={() => setPropertyType(t)}
                  className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors ${property_type === t ? 'bg-market-text text-white' : 'text-market-text-mute hover:text-market-text'}`}>
                  {t === 'apt' ? '아파트' : '오피스텔'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-market-text-faint text-sm">불러오는 중…</div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-market-text-faint text-sm">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              조건에 맞는 데이터가 없습니다. 다른 지역/유형을 선택해보세요.
            </div>
          ) : (
            <ol className="divide-y divide-market-border">
              {items.map((item, idx) => {
                const rankBadge = (
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                    idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-400 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-market-surface-2 text-market-text-mute'
                  }`}>{idx + 1}</span>
                );

                // 지역(구) 변동률 행
                if (isRegion(metric)) {
                  return (
                    <li key={item.lawd_cd} className="px-4 py-3.5 flex items-center gap-3">
                      {rankBadge}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-market-text">{item.region_name}</div>
                        <div className="text-[11px] text-market-text-faint mt-0.5">아파트 {item.trade_count?.toLocaleString()}건 거래</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-base font-extrabold tabular-nums" style={{ color: active.accent }}>
                          {(item.diff_pct ?? 0) > 0 ? '+' : ''}{item.diff_pct ?? 0}%
                        </div>
                        <div className="text-[10px] text-market-text-faint tabular-nums mt-0.5">
                          {formatKoreanPrice(item.prev_avg_manwon ?? 0, 'compact')} → {formatKoreanPrice(item.cur_avg_manwon ?? 0, 'compact')}
                        </div>
                      </div>
                    </li>
                  );
                }

                // 신고가 행
                if (isHighest(metric)) {
                  return (
                    <li key={item.complex_key} className="px-4 py-3.5 flex items-center gap-3 hover:bg-market-surface-2 transition-colors">
                      {rankBadge}
                      <Link href={`/market/insights/${encodeURIComponent(item.complex_key || '')}`} className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-sm text-market-text truncate hover:text-deal-jeonse">{item.complex_name}</span>
                          <span className="text-[11px] font-semibold text-market-text-mute flex-shrink-0">{item.pyeong}평{item.exclusive_area ? `·${item.exclusive_area}㎡` : ''}</span>
                        </div>
                        <div className="text-[11px] text-market-text-faint flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.region_name || item.lawd_cd}{item.hhld_cnt ? ` · ${item.hhld_cnt.toLocaleString()}세대` : ''}</span>
                        </div>
                      </Link>
                      <div className="text-right flex-shrink-0">
                        <div className="text-base font-extrabold tabular-nums" style={{ color: active.accent }}>{formatKoreanPrice(item.recent_price_manwon ?? 0)}</div>
                        <div className="text-[10px] text-market-text-faint tabular-nums mt-0.5">{fmtDate(item.recent_date)}{item.recent_floor != null ? ` · ${item.recent_floor}층` : ''}</div>
                      </div>
                    </li>
                  );
                }

                // 거래량 / 평균가 / 평당가 행
                return (
                  <li key={item.complex_key} className="px-4 py-3.5 flex items-center gap-3 hover:bg-market-surface-2 transition-colors">
                    {rankBadge}
                    <Link href={`/market/insights/${encodeURIComponent(item.complex_key || '')}`} className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-market-text truncate hover:text-deal-jeonse">{item.complex_name}</div>
                      <div className="text-[11px] text-market-text-faint flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{item.region_name || item.lawd_cd}</span>
                      </div>
                    </Link>
                    <div className="text-right flex-shrink-0">
                      <div className="text-base font-extrabold tabular-nums" style={{ color: active.accent }}>
                        {metric === 'count' && `${item.trade_count}건`}
                        {metric === 'price' && formatKoreanPrice(item.avg_price_manwon ?? 0)}
                        {metric === 'pyeong' && formatKoreanPrice(item.avg_pyeong_price ?? 0)}
                      </div>
                      <div className="text-[10px] text-market-text-faint tabular-nums mt-0.5">평균 {formatKoreanPrice(item.avg_price_manwon ?? 0, 'compact')} · {item.trade_count}건</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <p className="text-[11px] text-market-text-faint leading-relaxed px-1">
          {isRegion(metric) && '※ 구별 평균 매매가의 최근 2개월 변동률입니다. 거래량이 많은 구 단위 집계라 통계적으로 안정적입니다.'}
          {isHighest(metric) && '※ 최근 6개월 실거래 중 단지·면적별 최고가입니다. 직거래 및 이상치(오기재·특수거래 추정)는 제외했습니다.'}
          {!isRegion(metric) && !isHighest(metric) && '※ 국토교통부 실거래가 기준 집계입니다.'}
        </p>

        <div className="text-[11px] text-market-text-faint text-center pt-1 pb-4">
          데이터 출처: 국토교통부 실거래가 공개시스템
        </div>
      </main>
    </div>
  );
}

export default function MarketIndicatorsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-market-bg" />}>
      <MarketIndicatorsContent />
    </Suspense>
  );
}
