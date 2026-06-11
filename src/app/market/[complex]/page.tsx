'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, Briefcase, Sparkles, Building2, Calendar, Layers } from 'lucide-react';
import { formatKoreanPrice } from '@/lib/market/format';

interface MonthlyAgg {
  ym: string;
  avg_price_manwon: number;
  trade_count: number;
  avg_pyeong_price: number;
}
interface Transaction {
  deal_date: string;
  price_manwon: number;
  exclusive_area: number;
  floor: number | null;
  deal_type: string;
  deal_channel: string | null;
}
interface Broker {
  estbl_reg_no: string;
  med_office_nm: string;
  rprsv_nm: string;
  lctn_road_nm_addr: string;
  tel_no: string;
}
interface Job {
  id: string;
  title: string;
  company: string;
  category: string;
  tier: string;
  region: string;
}
interface UnitBucket {
  label: string;
  count: number;
  avg_price_manwon: number;
  avg_pyeong_price: number;
}
interface MonthlySplit {
  ym: string;
  trade_avg: number | null;
  rent_avg: number | null;
  trade_count: number;
  rent_count: number;
}
interface ComplexMeta {
  lat: number | null;
  lng: number | null;
  road_address: string | null;
  hhld_cnt: number | null;
  build_year: number | null;
  grnd_flr_cnt: number | null;
}

const formatBigPrice = formatKoreanPrice;

function KpiInline({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${highlight ? 'text-blue-300' : 'text-slate-100'}`}>{value}</div>
    </div>
  );
}

export default function ComplexDetailPage({
  params,
}: {
  params: Promise<{ complex: string }>;
}) {
  const { complex } = use(params);
  const complex_key = decodeURIComponent(complex);

  const [data, setData] = useState<{
    complex_name: string | null;
    lawd_cd: string | null;
    growth_pct: number | null;
    monthly: MonthlyAgg[];
    recent_transactions: Transaction[];
    complex_meta: ComplexMeta | null;
    unit_distribution: UnitBucket[];
    monthly_split: MonthlySplit[];
    lease_ratio: number | null;
  } | null>(null);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/market/complex/${encodeURIComponent(complex_key)}`);
        if (!res.ok) return;
        const d = await res.json();
        setData(d);

        if (d.lawd_cd) {
          const [brRes, jbRes] = await Promise.all([
            fetch(`/api/market/brokers-nearby?lawd_cd=${d.lawd_cd}&limit=10`),
            fetch(`/api/market/jobs-nearby?lawd_cd=${d.lawd_cd}&limit=5`),
          ]);
          if (brRes.ok) {
            const bd = await brRes.json();
            setBrokers(bd.brokers || []);
          }
          if (jbRes.ok) {
            const jd = await jbRes.json();
            setJobs(jd.jobs || []);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [complex_key]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">로딩 중…</div>;
  }

  const hasAnyData =
    data &&
    (data.monthly.length > 0 ||
      (data.monthly_split?.length || 0) > 0 ||
      data.recent_transactions.length > 0);

  if (!hasAnyData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-slate-400 mb-4">단지 정보를 찾을 수 없습니다.</p>
          <Link href="/market" className="text-blue-400 hover:underline">시세지도로 돌아가기</Link>
        </div>
      </div>
    );
  }

  // monthly가 비어있으면 monthly_split + unit_distribution에서 합성
  const current: MonthlyAgg = data!.monthly[0] ?? (() => {
    const splits = data!.monthly_split || [];
    const lastSplit = splits[splits.length - 1];
    const units = data!.unit_distribution || [];
    const totalCount = units.reduce((s, u) => s + u.count, 0);
    const avgPyeong = totalCount > 0
      ? Math.round(units.reduce((s, u) => s + u.avg_pyeong_price * u.count, 0) / totalCount)
      : 0;
    return {
      ym: lastSplit?.ym || new Date().toISOString().slice(0, 7),
      avg_price_manwon: lastSplit?.trade_avg ?? 0,
      trade_count: lastSplit?.trade_count ?? data!.recent_transactions.length,
      avg_pyeong_price: avgPyeong,
    };
  })();
  const meta = data!.complex_meta;

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <header className="sticky top-0 z-10 bg-[#0B0F14]/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/market" className="p-2 rounded-lg hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold truncate">{data.complex_name || '단지 상세'}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {/* 히어로 카드 — 단지 정체성 + 핵심 가격 (차분 톤) */}
        <section className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500" />
          <div className="relative p-5">
            {/* 상단: 단지명 + 메타 라인 */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white tracking-tight mb-1.5">
                {data.complex_name || '단지'}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-400">
                {meta?.road_address && (
                  <span className="inline-flex items-center gap-1 text-slate-300">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    {meta.road_address}
                  </span>
                )}
                {meta?.hhld_cnt != null && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-500" />
                    {meta.hhld_cnt.toLocaleString()}세대
                  </span>
                )}
                {meta?.build_year != null && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {meta.build_year}년 입주
                  </span>
                )}
                {meta?.grnd_flr_cnt != null && (
                  <span className="inline-flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-500" />
                    최고 {meta.grnd_flr_cnt}층
                  </span>
                )}
              </div>
            </div>

            {/* 중단: 큰 가격 + 변동률 chip */}
            <div className="flex items-end gap-3 mb-4 flex-wrap">
              <div>
                <div className="text-[11px] text-slate-500 mb-1">평균 매매가</div>
                <div className="text-3xl md:text-4xl font-bold text-white tabular-nums leading-none whitespace-nowrap">
                  {formatBigPrice(current.avg_price_manwon)}
                  <span className="text-sm text-slate-400 ml-1 font-medium">원</span>
                </div>
              </div>
              {data.growth_pct != null && (
                <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
                  data.growth_pct > 0
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : data.growth_pct < 0
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-slate-700/40 text-slate-300 border border-slate-600/30'
                }`}>
                  <span>{data.growth_pct > 0 ? '▲' : data.growth_pct < 0 ? '▼' : '─'}</span>
                  <span className="tabular-nums">{data.growth_pct > 0 ? '+' : ''}{data.growth_pct.toFixed(1)}%</span>
                  <span className="opacity-70 font-normal">전월대비</span>
                </div>
              )}
            </div>

            {/* 하단: 보조 KPI 라인 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 pt-4 border-t border-slate-800">
              <KpiInline label="평당가" value={formatKoreanPrice(current.avg_pyeong_price)} />
              <KpiInline label={`${current.ym.slice(0, 7)} 거래`} value={`${current.trade_count}건`} />
              {data.lease_ratio != null
                ? <KpiInline label="전세가율" value={`${data.lease_ratio}%`} highlight />
                : <KpiInline label="전세가율" value="-" />}
              <KpiInline label="평형 종류" value={`${data.unit_distribution?.length || 0}종`} />
            </div>
          </div>
        </section>


        {/* 평형별 시세 분포 */}
        {data.unit_distribution && data.unit_distribution.length > 0 && (
          <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              평형별 시세 분포 (최근 6개월 매매)
            </h2>
            <UnitDistribution buckets={data.unit_distribution} />
          </section>
        )}

        {/* 월별 추이 — 매매/전세 분리 라인 + 거래량 보조 */}
        <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            매매·전세 월별 추이 (최근 6개월)
          </h2>
          {data.monthly_split && data.monthly_split.length > 0 ? (
            <MonthlySplitChart data={data.monthly_split} />
          ) : (
            <MonthlyChart data={data.monthly.slice().reverse()} />
          )}
        </section>

        {/* 부동산인만의 특별함: 주변 중개사 */}
        <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-pink-400" />
            주변 중개사무소
            <span className="ml-auto text-[11px] text-slate-500">{brokers.length}곳 표시</span>
          </h2>
          {brokers.length === 0 ? (
            <p className="text-slate-500 text-xs">정보 없음</p>
          ) : (
            <ul className="divide-y divide-slate-800 text-xs">
              {brokers.map((b) => (
                <li key={b.estbl_reg_no} className="py-2 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-200 truncate">{b.med_office_nm}</div>
                    <div className="text-slate-500 text-[10px] truncate">{b.lctn_road_nm_addr}</div>
                  </div>
                  {b.tel_no && (
                    <a href={`tel:${b.tel_no}`} className="text-blue-400 hover:underline text-[11px] flex-shrink-0">
                      {b.tel_no}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 부동산인만의 특별함: 주변 구인공고 */}
        <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            이 지역 채용중 공고
            <span className="ml-auto text-[11px] text-slate-500">{jobs.length}건</span>
          </h2>
          {jobs.length === 0 ? (
            <p className="text-slate-500 text-xs">공고 없음</p>
          ) : (
            <ul className="space-y-2">
              {jobs.map((j) => (
                <li key={j.id}>
                  <Link
                    href={`/${j.category === 'sales' ? 'sales' : 'agent'}/jobs/${j.id}`}
                    className="flex items-center gap-3 text-xs hover:bg-slate-800 rounded-lg p-2 -mx-2"
                  >
                    {j.tier !== 'normal' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {j.tier.toUpperCase()}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-200 truncate">{j.title}</div>
                      <div className="text-slate-500 text-[10px]">{j.company}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* AI 인사이트 CTA */}
        <section className="bg-gradient-to-br from-cyan-900/20 to-pink-900/20 rounded-xl border border-cyan-500/30 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold mb-1">AI 단지 분석 (로그인 전용)</h3>
              <p className="text-xs text-slate-400 mb-3">
                최근 거래 · 중개사 경쟁 · 채용 현황을 종합한 한 줄 요약.
              </p>
              <Link
                href={`/market/insights/${encodeURIComponent(complex_key)}`}
                className="inline-block text-xs px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-[#0B0F14] rounded font-bold"
              >
                인사이트 보기 →
              </Link>
            </div>
          </div>
        </section>

        {/* 최근 거래 내역 */}
        <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-bold mb-3">최근 매매 거래</h2>
          {data.recent_transactions.length === 0 ? (
            <p className="text-slate-500 text-xs">데이터 없음</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="text-left py-2">일자</th>
                  <th className="text-right py-2">금액</th>
                  <th className="text-right py-2">전용(㎡)</th>
                  <th className="text-right py-2">층</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_transactions.map((t, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td className="py-2 text-slate-300">{t.deal_date}</td>
                    <td className="py-2 text-right font-semibold text-red-300 tabular-nums">
                      {t.price_manwon ? formatKoreanPrice(t.price_manwon) : '-'}
                    </td>
                    <td className="py-2 text-right text-slate-400">{t.exclusive_area?.toFixed(1)}</td>
                    <td className="py-2 text-right text-slate-500">{t.floor ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

function UnitDistribution({ buckets }: { buckets: UnitBucket[] }) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div className="space-y-2">
      {buckets.map((b) => {
        const widthPct = (b.count / maxCount) * 100;
        return (
          <div key={b.label} className="flex items-center gap-3">
            <div className="w-20 text-xs text-slate-400 flex-shrink-0 tabular-nums">{b.label}</div>
            <div className="flex-1 h-8 bg-slate-800/50 rounded overflow-hidden relative ring-1 ring-slate-800">
              <div
                className="h-full bg-blue-500/40"
                style={{ width: `${widthPct}%` }}
              />
              <div className="absolute inset-0 px-2.5 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-white tabular-nums">{b.count}건</span>
                <span className="text-slate-300 tabular-nums">
                  평균 <strong className="text-white">{formatKoreanPrice(b.avg_price_manwon, 'compact')}</strong>
                  <span className="opacity-50 mx-1">·</span>
                  평당 <strong className="text-slate-100">{formatKoreanPrice(b.avg_pyeong_price, 'compact')}</strong>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthlySplitChart({ data }: { data: MonthlySplit[] }) {
  if (data.length === 0) return <div className="text-xs text-slate-500">데이터 없음</div>;

  const allValues = data.flatMap((d) => [d.trade_avg || 0, d.rent_avg || 0]).filter((v) => v > 0);
  if (allValues.length === 0) return <div className="text-xs text-slate-500">데이터 없음</div>;
  const max = Math.max(...allValues);
  const W = 500;
  const H = 160;
  const padding = 30;
  const innerW = W - padding * 2;
  const stepX = innerW / Math.max(1, data.length - 1);

  const tradePoints = data.map((d, i) => {
    const x = padding + i * stepX;
    const y = d.trade_avg ? H - padding - (d.trade_avg / max) * (H - padding * 2) : null;
    return y != null ? `${x},${y}` : null;
  }).filter((p) => p !== null) as string[];

  const rentPoints = data.map((d, i) => {
    const x = padding + i * stepX;
    const y = d.rent_avg ? H - padding - (d.rent_avg / max) * (H - padding * 2) : null;
    return y != null ? `${x},${y}` : null;
  }).filter((p) => p !== null) as string[];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        {/* y axis grid */}
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <line key={r} x1={padding} y1={H - padding - r * (H - padding * 2)} x2={W - padding} y2={H - padding - r * (H - padding * 2)} className="stroke-slate-800" strokeWidth={1} />
        ))}
        {/* trade line — 매매 = 빨강 */}
        {tradePoints.length >= 2 && (
          <polyline
            points={tradePoints.join(' ')}
            fill="none"
            className="stroke-red-400"
            strokeWidth={2}
          />
        )}
        {/* rent line — 전세 = 파랑 */}
        {rentPoints.length >= 2 && (
          <polyline
            points={rentPoints.join(' ')}
            fill="none"
            className="stroke-blue-400"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        )}
        {/* trade points */}
        {data.map((d, i) => {
          if (!d.trade_avg) return null;
          const x = padding + i * stepX;
          const y = H - padding - (d.trade_avg / max) * (H - padding * 2);
          return <circle key={'t' + i} cx={x} cy={y} r={3} className="fill-red-400" />;
        })}
        {/* rent points */}
        {data.map((d, i) => {
          if (!d.rent_avg) return null;
          const x = padding + i * stepX;
          const y = H - padding - (d.rent_avg / max) * (H - padding * 2);
          return <circle key={'r' + i} cx={x} cy={y} r={3} className="fill-blue-400" />;
        })}
        {/* x labels */}
        {data.map((d, i) => {
          const x = padding + i * stepX;
          return (
            <text key={'x' + i} x={x} y={H - 8} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 10 }}>
              {d.ym.slice(5, 7)}월
            </text>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-red-400" /> 매매 평균
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-blue-400" style={{ borderTopWidth: 1, borderTopStyle: 'dashed' }} /> 전세 보증금 평균
        </span>
      </div>
    </div>
  );
}

function MonthlyChart({ data }: { data: MonthlyAgg[] }) {
  if (data.length === 0) {
    return <div className="text-xs text-slate-500">데이터 없음</div>;
  }
  const max = Math.max(...data.map((d) => d.avg_price_manwon));
  const W = 500;
  const H = 120;
  const barW = (W - 20) / data.length - 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32">
      {data.map((d, i) => {
        const h = (d.avg_price_manwon / max) * (H - 30);
        const x = 10 + i * ((W - 20) / data.length);
        const y = H - 20 - h;
        return (
          <g key={d.ym}>
            <rect x={x} y={y} width={barW} height={Math.max(h, 2)} rx={3} className="fill-cyan-500/70" />
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 9 }}>
              {d.ym.slice(5, 7)}월
            </text>
            <text x={x + barW / 2} y={y - 3} textAnchor="middle" className="fill-slate-300" style={{ fontSize: 9, fontWeight: 'bold' }}>
              {Math.round(d.avg_price_manwon / 10000)}억
            </text>
          </g>
        );
      })}
    </svg>
  );
}
