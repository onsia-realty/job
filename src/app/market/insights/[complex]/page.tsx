'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, TrendingUp, TrendingDown, Building2 } from 'lucide-react';
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
import type { ComplexDetail } from '@/lib/market/types';
import { formatKoreanPrice, formatEokUnit } from '@/lib/market/format';

interface InsightStats {
  current_avg_price: number;
  current_trade_count: number;
  avg_pyeong_price: number;
  growth_pct: number | null;
  broker_count: number;
  job_count: number;
}

const KRW = (n: number) => Math.round(n).toLocaleString('ko-KR'); // 면적 등 비가격 수치용
const formatPriceAxis = formatEokUnit;

export default function ComplexInsightsPage({
  params,
}: {
  params: Promise<{ complex: string }>;
}) {
  const { complex } = use(params);
  const complex_key = decodeURIComponent(complex);

  const [insight, setInsight] = useState<string | null>(null);
  const [stats, setStats] = useState<InsightStats | null>(null);
  const [detail, setDetail] = useState<ComplexDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [insightRes, detailRes] = await Promise.all([
          fetch(`/api/market/insights/${encodeURIComponent(complex_key)}`),
          fetch(`/api/market/complex/${encodeURIComponent(complex_key)}`),
        ]);
        if (!insightRes.ok) {
          const err = await insightRes.json();
          setError(err.error || '분석 데이터 조회 실패');
        } else {
          const data = await insightRes.json();
          setInsight(data.insight);
          setStats(data.stats || null);
        }
        if (detailRes.ok) {
          setDetail(await detailRes.json());
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'unknown');
      } finally {
        setLoading(false);
      }
    })();
  }, [complex_key]);

  const name = detail?.complex_name || '단지';
  const meta = detail?.complex_meta;
  const buildingMeta = detail?.building_meta;
  const monthly = detail?.monthly_split ?? [];
  const unitDist = detail?.unit_distribution ?? [];

  const chartData = monthly.map((m) => ({
    ym: m.ym.slice(2),
    매매: m.trade_avg,
    전세: m.rent_avg,
    분양권: m.presale_avg ?? null,
  }));
  const volumeData = monthly.map((m) => ({
    ym: m.ym.slice(2),
    매매: m.trade_count,
    전세: m.rent_count,
    분양권: m.presale_count ?? 0,
  }));

  return (
    <div className="min-h-screen bg-market-bg font-jakarta text-market-text">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-market-surface/95 backdrop-blur border-b border-market-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/market/${encodeURIComponent(complex_key)}`}
            className="p-2 rounded-lg hover:bg-market-surface-2 text-market-text-mute transition-colors"
            aria-label="단지 상세로"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-market-text-faint uppercase tracking-wider">
              AI 단지 분석
            </div>
            <h1 className="text-base font-bold flex items-center gap-2 truncate">
              <Sparkles className="w-4 h-4 text-deal-jeonse flex-shrink-0" />
              {name}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* AI 인사이트 박스 */}
        {loading ? (
          <div className="py-16 text-center text-market-text-faint text-sm">
            AI가 분석 중…
          </div>
        ) : error ? (
          <div className="bg-deal-trade-soft border border-deal-trade/30 rounded-xl p-5 text-sm text-deal-trade">
            {error}
          </div>
        ) : (
          <article className="bg-market-surface border border-market-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-deal-jeonse-soft flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-deal-jeonse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-market-text-faint uppercase tracking-wider mb-1.5">
                  AI 인사이트
                </div>
                <p className="text-base text-market-text leading-relaxed whitespace-pre-line">
                  {insight}
                </p>
              </div>
            </div>
          </article>
        )}

        {/* 단지 메타 카드 */}
        {(meta || buildingMeta) && (
          <section className="bg-market-surface border border-market-border rounded-2xl p-5 shadow-sm">
            <div className="text-[11px] font-semibold text-market-text-faint uppercase tracking-wider mb-3">
              단지 정보
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {meta?.road_address && (
                <div className="col-span-2 md:col-span-4">
                  <div className="text-[10px] text-market-text-faint mb-0.5">주소</div>
                  <div className="text-sm font-medium text-market-text">{meta.road_address}</div>
                </div>
              )}
              {meta?.hhld_cnt != null && (
                <MetaItem label="세대수" value={meta.hhld_cnt.toLocaleString()} />
              )}
              {meta?.build_year != null && (
                <MetaItem label="입주연도" value={`${meta.build_year}년`} />
              )}
              {meta?.grnd_flr_cnt != null && (
                <MetaItem label="최고층" value={`${meta.grnd_flr_cnt}층`} />
              )}
              {buildingMeta?.strct && (
                <MetaItem label="구조" value={buildingMeta.strct} />
              )}
            </div>

            {/* 건축물대장 데이터 (아실 차별점) */}
            {buildingMeta && (
              buildingMeta.bc_rat != null || buildingMeta.vl_rat != null ||
              buildingMeta.land_share_per_hhld != null || buildingMeta.parking_total != null
            ) && (
              <>
                <div className="border-t border-market-border my-4" />
                <div className="text-[11px] font-semibold text-market-text-faint uppercase tracking-wider mb-3">
                  건축물대장
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {buildingMeta.bc_rat != null && (
                    <MetaItem label="건폐율" value={`${buildingMeta.bc_rat}%`} />
                  )}
                  {buildingMeta.vl_rat != null && (
                    <MetaItem label="용적률" value={`${buildingMeta.vl_rat}%`} />
                  )}
                  {buildingMeta.land_share_per_hhld != null && (
                    <MetaItem label="세대당 대지지분" value={`${buildingMeta.land_share_per_hhld}㎡`} />
                  )}
                  {buildingMeta.plat_area != null && (
                    <MetaItem label="대지면적" value={`${KRW(buildingMeta.plat_area)}㎡`} />
                  )}
                  {buildingMeta.tot_area != null && (
                    <MetaItem label="연면적" value={`${KRW(buildingMeta.tot_area)}㎡`} />
                  )}
                  {buildingMeta.parking_total != null && (
                    <MetaItem label="주차 대수" value={`${buildingMeta.parking_total}대`} />
                  )}
                  {buildingMeta.ride_elvt_cnt != null && (
                    <MetaItem label="승강기" value={`${buildingMeta.ride_elvt_cnt}대`} />
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {/* 핵심 통계 카드 */}
        {stats && (
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="평균 매매가" value={formatKoreanPrice(stats.current_avg_price)} accent="trade" />
            <StatCard label="평당가" value={formatKoreanPrice(stats.avg_pyeong_price)} />
            <StatCard
              label="변동률"
              value={stats.growth_pct != null ? `${stats.growth_pct > 0 ? '+' : ''}${stats.growth_pct.toFixed(1)}%` : '-'}
              accent={stats.growth_pct && stats.growth_pct > 0 ? 'trade' : 'jeonse'}
              icon={stats.growth_pct && stats.growth_pct > 0 ? 'up' : 'down'}
            />
            <StatCard label="월간 거래" value={`${stats.current_trade_count}건`} />
            <StatCard label="지역 중개사" value={`${stats.broker_count}곳`} />
          </section>
        )}

        {/* 가격 추이 큰 차트 */}
        {chartData.length >= 2 && (
          <section className="bg-market-surface border border-market-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-market-text">가격 추이 비교</div>
                <div className="text-[11px] text-market-text-faint mt-0.5">최근 {chartData.length}개월 · 매매/전세/분양권</div>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <Legend color="#e11d48" label="매매" />
                <Legend color="#2563eb" label="전세" />
                <Legend color="#7c3aed" label="분양권" />
              </div>
            </div>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
                    tickFormatter={formatPriceAxis}
                    width={50}
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
                    formatter={(v) => {
                      const n = typeof v === 'number' ? v : 0;
                      return n ? formatKoreanPrice(n) : '-';
                    }}
                  />
                  <Line type="monotone" dataKey="매매" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 3, fill: '#e11d48', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }} connectNulls />
                  <Line type="monotone" dataKey="전세" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }} connectNulls />
                  <Line type="monotone" dataKey="분양권" stroke="#7c3aed" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* 거래량 비교 */}
        {volumeData.length >= 2 && (
          <section className="bg-market-surface border border-market-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-sm font-bold text-market-text">월별 거래량</div>
              <div className="text-[11px] text-market-text-faint">건수 (적층)</div>
            </div>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <XAxis dataKey="ym" tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e4e7eb',
                      borderRadius: '10px',
                      fontSize: '12px',
                      padding: '8px 12px',
                    }}
                    formatter={(v, name) => [`${typeof v === 'number' ? v : 0}건`, name]}
                  />
                  <Bar dataKey="매매" stackId="vol" fill="#e11d48" opacity={0.75} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="전세" stackId="vol" fill="#2563eb" opacity={0.75} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="분양권" stackId="vol" fill="#7c3aed" opacity={0.75} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* 평형별 평균 */}
        {unitDist.length > 0 && (
          <section className="bg-market-surface border border-market-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-sm font-bold text-market-text">평형별 평균 매매가</div>
              <div className="text-[11px] text-market-text-faint">최근 6개월 매매 기준</div>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitDist} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} tickFormatter={formatPriceAxis} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#5a5d63' }} axisLine={false} tickLine={false} width={90} />
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
                      return [`${formatKoreanPrice(n)} (${count}건)`, '평균'];
                    }}
                  />
                  <Bar dataKey="avg_price_manwon" radius={[0, 4, 4, 0]} barSize={20}>
                    {unitDist.map((_, idx) => (
                      <Cell key={idx} fill="#e11d48" opacity={0.45 + idx * 0.12} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* 인근 단지 비교 */}
        {detail?.nearby_complexes && detail.nearby_complexes.length > 0 && (
          <section className="bg-market-surface border border-market-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-market-text">인근 비교 단지</div>
                <div className="text-[11px] text-market-text-faint mt-0.5">반경 2km 이내 · 최근 매매 평균</div>
              </div>
              <div className="text-[11px] text-market-text-faint">{detail.nearby_complexes.length}개 단지</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-market-text-faint border-b border-market-border">
                    <th className="text-left py-2 px-2 font-medium">단지명</th>
                    <th className="text-right py-2 px-2 font-medium">거리</th>
                    <th className="text-right py-2 px-2 font-medium">평균가</th>
                    <th className="text-right py-2 px-2 font-medium">평당가</th>
                    <th className="text-right py-2 px-2 font-medium">거래</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.nearby_complexes.map((n) => (
                    <tr key={n.complex_key} className="border-b border-market-border/40 hover:bg-market-surface-2 transition-colors">
                      <td className="py-2.5 px-2">
                        <Link
                          href={`/market/insights/${encodeURIComponent(n.complex_key)}`}
                          className="font-medium text-market-text hover:text-deal-jeonse hover:underline truncate block max-w-[180px]"
                        >
                          {n.complex_name}
                        </Link>
                      </td>
                      <td className="text-right py-2.5 px-2 text-xs text-market-text-mute tabular-nums">
                        {n.distance_km != null ? `${n.distance_km}km` : '-'}
                      </td>
                      <td className="text-right py-2.5 px-2 font-semibold text-deal-trade tabular-nums">
                        {formatKoreanPrice(n.avg_price_manwon)}
                      </td>
                      <td className="text-right py-2.5 px-2 text-market-text-mute tabular-nums">
                        {formatKoreanPrice(n.avg_pyeong_price)}
                      </td>
                      <td className="text-right py-2.5 px-2 text-xs text-market-text-mute tabular-nums">
                        {n.trade_count}건
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="text-[11px] text-market-text-faint text-center pt-2 pb-4">
          본 분석은 AI가 국토부 공공 데이터를 기반으로 생성한 참고 자료입니다.
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent?: 'trade' | 'jeonse' | 'wolse';
  icon?: 'up' | 'down';
}) {
  const accentColor =
    accent === 'trade' ? 'text-deal-trade' :
    accent === 'jeonse' ? 'text-deal-jeonse' :
    accent === 'wolse' ? 'text-deal-wolse' :
    'text-market-text';
  return (
    <div className="bg-market-surface border border-market-border rounded-xl p-4 shadow-sm">
      <div className="text-[10px] text-market-text-faint mb-1 flex items-center gap-1">
        {icon === 'up' && <TrendingUp className="w-3 h-3" />}
        {icon === 'down' && <TrendingDown className="w-3 h-3" />}
        {label}
      </div>
      <div className={`text-base font-extrabold tabular-nums ${accentColor}`}>{value}</div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-market-text-faint mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-market-text tabular-nums">{value}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-market-text-mute">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
