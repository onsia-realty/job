'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/auth';

export default function ComplexInsightsPage({
  params,
}: {
  params: Promise<{ complex: string }>;
}) {
  const { complex } = use(params);
  const complex_key = decodeURIComponent(complex);
  const { user, isLoading: authLoading } = useAuth();

  const [insight, setInsight] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    current_avg_price: number;
    current_trade_count: number;
    growth_pct: number | null;
    broker_count: number;
    job_count: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    (async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('세션이 만료되었습니다');
          return;
        }
        const res = await fetch(`/api/market/insights/${encodeURIComponent(complex_key)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || '조회 실패');
          return;
        }
        const data = await res.json();
        setInsight(data.insight);
        setStats(data.stats);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'unknown');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, complex_key]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">로딩 중…</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm text-center">
          <Sparkles className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
          <h1 className="text-lg font-bold mb-2">로그인 필요</h1>
          <p className="text-slate-400 text-sm mb-4">AI 단지 분석은 회원 전용 기능입니다.</p>
          <Link
            href={`/agent/auth/login?redirect=/market/insights/${encodeURIComponent(complex_key)}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-[#0B0F14] rounded font-bold text-sm"
          >
            <LogIn className="w-4 h-4" />
            로그인
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <header className="sticky top-0 z-10 bg-[#0B0F14]/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/market/${encodeURIComponent(complex_key)}`} className="p-2 rounded-lg hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            AI 단지 분석
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">AI가 분석 중…</div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-5 text-sm text-red-300">
            {error}
          </div>
        ) : (
          <>
            <article className="bg-gradient-to-br from-cyan-900/20 to-pink-900/20 border border-cyan-500/30 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-sm text-slate-500 mb-1">AI 인사이트</h2>
                  <p className="text-base text-slate-100 leading-relaxed whitespace-pre-line">
                    {insight}
                  </p>
                </div>
              </div>
            </article>

            {stats && (
              <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard label="평균 매매가" value={`${Math.round(stats.current_avg_price).toLocaleString()}만`} />
                <StatCard label="월간 거래" value={`${stats.current_trade_count}건`} />
                <StatCard
                  label="변동률"
                  value={stats.growth_pct != null ? `${stats.growth_pct > 0 ? '+' : ''}${stats.growth_pct.toFixed(1)}%` : '-'}
                  accent={stats.growth_pct && stats.growth_pct > 0 ? 'red' : 'blue'}
                />
                <StatCard label="지역 중개사" value={`${stats.broker_count}곳`} />
                <StatCard label="지역 공고" value={`${stats.job_count}건`} />
              </section>
            )}
          </>
        )}

        <div className="text-[11px] text-slate-600 text-center pt-4">
          본 분석은 AI가 공공 데이터를 기반으로 생성한 참고 자료입니다.
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const color = accent === 'red' ? 'text-red-300' : accent === 'blue' ? 'text-blue-300' : 'text-cyan-300';
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}
