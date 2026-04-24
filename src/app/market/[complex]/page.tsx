'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, Briefcase, Sparkles } from 'lucide-react';

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

const KRW = (n: number) => Math.round(n).toLocaleString('ko-KR');

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

        // 해당 지역의 brokers/jobs 병렬 로드
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

  if (!data || data.monthly.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-slate-400 mb-4">단지 정보를 찾을 수 없습니다.</p>
          <Link href="/market" className="text-cyan-400 hover:underline">시세지도로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const current = data.monthly[0];

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <header className="sticky top-0 z-10 bg-[#0B0F14]/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/market" className="p-2 rounded-lg hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold truncate">{current.avg_price_manwon ? (data as unknown as { complex_name?: string }).complex_name || '단지 상세' : '단지 상세'}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {/* 핵심 지표 카드 */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox
            label="평균 매매가"
            value={`${KRW(current.avg_price_manwon)}만`}
            accent="cyan"
          />
          <StatBox
            label="평당가"
            value={`${KRW(current.avg_pyeong_price)}만`}
            accent="emerald"
          />
          <StatBox
            label={`${current.ym.slice(0, 7)} 거래`}
            value={`${current.trade_count}건`}
            accent="amber"
          />
          <StatBox
            label="월간 변동"
            value={data.growth_pct != null ? `${data.growth_pct > 0 ? '+' : ''}${data.growth_pct.toFixed(1)}%` : '-'}
            accent={data.growth_pct && data.growth_pct > 0 ? 'red' : 'blue'}
          />
        </section>

        {/* 월별 추이 (SVG 바차트) */}
        <section className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            월별 평균 매매가 (최근 6개월)
          </h2>
          <MonthlyChart data={data.monthly.slice().reverse()} />
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
                    <a href={`tel:${b.tel_no}`} className="text-cyan-400 hover:underline text-[11px] flex-shrink-0">
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

        {/* AI 인사이트 CTA (로그인 유저만) */}
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
          <h2 className="text-sm font-bold mb-3">최근 거래</h2>
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
                    <td className="py-2 text-right font-bold text-cyan-300">
                      {t.price_manwon ? KRW(t.price_manwon) + '만' : '-'}
                    </td>
                    <td className="py-2 text-right text-slate-400">{t.exclusive_area.toFixed(1)}</td>
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

function StatBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-300',
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    red: 'text-red-300',
    blue: 'text-blue-300',
  };
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-3">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className={`text-base font-bold ${colorMap[accent] || 'text-slate-100'}`}>{value}</div>
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
