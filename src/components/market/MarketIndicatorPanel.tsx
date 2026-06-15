'use client';

import { useState, useEffect } from 'react';
import { X, BarChart3 } from 'lucide-react';
import { formatKoreanPrice } from '@/lib/market/format';

export type IndicatorMetric = 'drop' | 'rise' | 'highest' | 'count' | 'price' | 'pyeong';
type Sido = 'all' | '서울특별시' | '경기도';
type PT = 'apt' | 'officetel';

interface PanelItem {
  complex_key?: string;
  complex_name?: string;
  lawd_cd?: string;
  region_name?: string;
  trade_count?: number;
  avg_price_manwon?: number;
  avg_pyeong_price?: number;
  pyeong?: number;
  exclusive_area?: number;
  hhld_cnt?: number | null;
  recent_date?: string;
  recent_price_manwon?: number;
  recent_floor?: number | null;
  base_date?: string;
  base_price_manwon?: number;
  base_floor?: number | null;
  diff_manwon?: number;
  diff_pct?: number;
}

const TABS: { key: IndicatorMetric; label: string; accent: string }[] = [
  { key: 'drop', label: '최근하락', accent: '#2563eb' },
  { key: 'rise', label: '최근상승', accent: '#dc2626' },
  { key: 'highest', label: '신고가', accent: '#7c3aed' },
  { key: 'count', label: '거래량', accent: '#2563eb' },
  { key: 'price', label: '평균가', accent: '#e11d48' },
  { key: 'pyeong', label: '평당가', accent: '#ea580c' },
];

const fmtDate = (d?: string) => (d ? d.slice(2).replace(/-/g, '.') : '');
const isGap = (m: IndicatorMetric) => m === 'drop' || m === 'rise';

// 시도 — 서울/경기/전국만 데이터 제공, 나머지는 준비중(disabled)
const SIDO_COMING = ['인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

export default function MarketIndicatorPanel({
  metric,
  onMetricChange,
  onClose,
  onSelectComplex,
}: {
  metric: IndicatorMetric;
  onMetricChange: (m: IndicatorMetric) => void;
  onClose: () => void;
  onSelectComplex: (key: string) => void;
}) {
  const [sido, setSido] = useState<Sido>('서울특별시');
  const [pt, setPt] = useState<PT>('apt');
  const [items, setItems] = useState<PanelItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams({ metric, type: pt });
        if (sido !== 'all') p.set('sido', sido);
        const r = await fetch(`/api/market/rankings/top10?${p}`);
        const d = await r.json();
        if (alive) setItems(d.rankings || []);
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [metric, sido, pt]);

  const accent = TABS.find((t) => t.key === metric)!.accent;

  return (
    <div className="flex flex-col h-full w-full bg-market-surface font-jakarta">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-market-border flex-shrink-0">
        <BarChart3 className="w-4 h-4 text-deal-jeonse" />
        <span className="text-sm font-bold text-market-text">부인(BOOIN) 시세자료 지표</span>
        <button onClick={onClose} className="ml-auto text-market-text-faint hover:text-market-text" aria-label="닫기">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 지표 탭 */}
      <div className="flex gap-1 px-3 py-2 border-b border-market-border overflow-x-auto scrollbar-hide flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => onMetricChange(t.key)}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold whitespace-nowrap transition-colors ${
              metric === t.key ? 'text-white' : 'text-market-text-mute hover:text-market-text bg-market-surface-2'
            }`}
            style={metric === t.key ? { background: t.accent } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 필터: 시도 셀렉트 + 매물유형 + 직거래 제외 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-market-border flex-shrink-0">
        <select
          value={sido}
          onChange={(e) => setSido(e.target.value as Sido)}
          className="text-xs border border-market-border rounded-lg px-2 py-1.5 bg-market-surface text-market-text focus:outline-none focus:ring-1 focus:ring-deal-jeonse"
        >
          <option value="all">전국</option>
          <option value="서울특별시">서울</option>
          <option value="경기도">경기</option>
          <optgroup label="준비 중">
            {SIDO_COMING.map((s) => <option key={s} value={s} disabled>{s}</option>)}
          </optgroup>
        </select>
        <div className="flex bg-market-surface-2 rounded-lg p-0.5 border border-market-border">
          {(['apt', 'officetel'] as PT[]).map((p) => (
            <button key={p} onClick={() => setPt(p)}
              className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors ${pt === p ? 'bg-market-text text-white' : 'text-market-text-mute hover:text-market-text'}`}>
              {p === 'apt' ? '아파트' : '오피스텔'}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px] text-market-text-faint">매매 · 직거래 제외</span>
      </div>

      {/* 리스트 */}
      <div className="overflow-y-auto overscroll-contain flex-1">
        {loading ? (
          <div className="py-16 text-center text-sm text-market-text-faint">불러오는 중…</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-market-text-faint">데이터가 없습니다</div>
        ) : (
          <ol className="divide-y divide-market-border">
            {items.map((it, idx) => {
              const badge = (
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5 ${
                  idx < 3 ? 'bg-amber-400 text-white' : 'bg-market-surface-2 text-market-text-mute'
                }`}>{idx + 1}</span>
              );
              const onClick = () => it.complex_key && onSelectComplex(it.complex_key);

              // 최근하락 / 최근상승 — 아실식 (거래 2줄 + 층 + 고점 대비)
              if (isGap(metric)) {
                return (
                  <li key={(it.complex_key || idx) + ''}>
                    <button onClick={onClick} className="w-full text-left px-4 py-3 flex items-start gap-2.5 hover:bg-market-surface-2 transition-colors">
                      {badge}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-sm text-market-text truncate">{it.complex_name}</span>
                          <span className="text-[11px] font-semibold text-market-text-mute flex-shrink-0">{it.pyeong}평</span>
                        </div>
                        <div className="text-[10px] text-market-text-faint truncate mb-1">
                          {it.region_name || it.lawd_cd}{it.hhld_cnt ? ` · ${it.hhld_cnt.toLocaleString()}세대` : ''}{it.exclusive_area ? ` · ${it.exclusive_area}㎡` : ''}
                        </div>
                        <div className="text-[11px] tabular-nums flex gap-2">
                          <span className="text-market-text-faint w-12 flex-shrink-0">최근</span>
                          <span className="text-market-text-mute">{fmtDate(it.recent_date)}</span>
                          <span className="font-semibold text-market-text">{formatKoreanPrice(it.recent_price_manwon ?? 0)}</span>
                          {it.recent_floor != null && <span className="text-market-text-faint">{it.recent_floor}층</span>}
                        </div>
                        <div className="text-[11px] tabular-nums flex gap-2">
                          <span className="text-market-text-faint w-12 flex-shrink-0">과거최고</span>
                          <span className="text-market-text-mute">{fmtDate(it.base_date)}</span>
                          <span className="font-semibold text-market-text">{formatKoreanPrice(it.base_price_manwon ?? 0)}</span>
                          {it.base_floor != null && <span className="text-market-text-faint">{it.base_floor}층</span>}
                        </div>
                        <div className="text-[11px] font-bold mt-1" style={{ color: accent }}>
                          최고가 대비 {formatKoreanPrice(Math.abs(it.diff_manwon ?? 0), 'compact')} {(it.diff_pct ?? 0) < 0 ? '하락' : '상승'} ({(it.diff_pct ?? 0) > 0 ? '+' : ''}{it.diff_pct ?? 0}%)
                        </div>
                      </div>
                    </button>
                  </li>
                );
              }

              // 신고가
              if (metric === 'highest') {
                return (
                  <li key={(it.complex_key || idx) + ''}>
                    <button onClick={onClick} className="w-full text-left px-4 py-3 flex items-center gap-2.5 hover:bg-market-surface-2 transition-colors">
                      {badge}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-sm text-market-text truncate">{it.complex_name}</span>
                          <span className="text-[11px] font-semibold text-market-text-mute flex-shrink-0">{it.pyeong}평</span>
                        </div>
                        <div className="text-[10px] text-market-text-faint truncate">{it.region_name || it.lawd_cd}{it.hhld_cnt ? ` · ${it.hhld_cnt.toLocaleString()}세대` : ''}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-extrabold tabular-nums" style={{ color: accent }}>{formatKoreanPrice(it.recent_price_manwon ?? 0)}</div>
                        <div className="text-[10px] text-market-text-faint tabular-nums">{fmtDate(it.recent_date)}{it.recent_floor != null ? ` · ${it.recent_floor}층` : ''}</div>
                      </div>
                    </button>
                  </li>
                );
              }

              // 거래량 / 평균가 / 평당가
              return (
                <li key={(it.complex_key || idx) + ''}>
                  <button onClick={onClick} className="w-full text-left px-4 py-3 flex items-center gap-2.5 hover:bg-market-surface-2 transition-colors">
                    {badge}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-market-text truncate">{it.complex_name}</div>
                      <div className="text-[10px] text-market-text-faint truncate">{it.region_name || it.lawd_cd}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-extrabold tabular-nums" style={{ color: accent }}>
                        {metric === 'count' && `${it.trade_count}건`}
                        {metric === 'price' && formatKoreanPrice(it.avg_price_manwon ?? 0)}
                        {metric === 'pyeong' && formatKoreanPrice(it.avg_pyeong_price ?? 0)}
                      </div>
                      <div className="text-[10px] text-market-text-faint tabular-nums">평균 {formatKoreanPrice(it.avg_price_manwon ?? 0, 'compact')} · {it.trade_count}건</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="px-4 py-2 text-[10px] text-market-text-faint border-t border-market-border flex-shrink-0">
        국토교통부 실거래가 · 단지 클릭 시 상세
      </div>
    </div>
  );
}
