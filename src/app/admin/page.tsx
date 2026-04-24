'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, FileText, ClipboardCheck, Clock, Wallet, CreditCard,
  TrendingUp, Loader2, ArrowLeft, AlertTriangle, ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/auth';

type DailyPoint = { date: string; signups: number; jobs: number; revenue: number; paymentCount: number };

interface AdminStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeJobs: number;
  totalJobs: number;
  pendingJobs: number;
  totalApplications: number;
  monthlyRevenue: number;
  monthlyPaymentCount: number;
  recentUsers: Array<{ id: string; name: string; email: string; user_type: string; created_at: string }>;
  recentJobs: Array<{ id: string; title: string; company: string; is_approved: boolean; created_at: string }>;
  daily: DailyPoint[];
}

type ChartMetric = 'signups' | 'jobs' | 'revenue';

const KRW = (n: number) => new Intl.NumberFormat('ko-KR').format(n);
const formatDateMD = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};
const formatRelative = (iso: string) => {
  const d = new Date(iso);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return '방금 전';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
  return `${Math.floor(diffSec / 86400)}일 전`;
};

function StatCard({ icon: Icon, label, value, hint, color }: {
  icon: any; label: string; value: string; hint?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
      </div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl sm:text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function TrendChart({ daily, metric }: { daily: DailyPoint[]; metric: ChartMetric }) {
  const max = useMemo(() => {
    return Math.max(1, ...daily.map((d) => d[metric] as number));
  }, [daily, metric]);
  const total = daily.reduce((s, d) => s + (d[metric] as number), 0);
  const W = 600;
  const H = 160;
  const padX = 8;
  const padY = 16;
  const barCount = daily.length;
  const barW = (W - padX * 2) / barCount - 2;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs text-gray-500">최근 30일 합계</div>
          <div className="text-lg font-bold text-gray-900">
            {metric === 'revenue' ? `${KRW(total)}원` : `${KRW(total)}건`}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40 min-w-[480px]">
          {daily.map((d, i) => {
            const v = d[metric] as number;
            const h = (v / max) * (H - padY * 2);
            const x = padX + i * ((W - padX * 2) / barCount);
            const y = H - padY - h;
            const isToday = i === barCount - 1;
            return (
              <g key={d.date}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(h, 1)}
                  rx={2}
                  className={isToday ? 'fill-blue-600' : v > 0 ? 'fill-blue-400' : 'fill-gray-200'}
                />
                {(i === 0 || i === barCount - 1 || i === Math.floor(barCount / 2)) && (
                  <text
                    x={x + barW / 2}
                    y={H - 2}
                    textAnchor="middle"
                    className="fill-gray-400"
                    style={{ fontSize: 9 }}
                  >
                    {formatDateMD(d.date)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('signups');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError('로그인이 필요합니다');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('세션이 만료되었습니다');
          setLoading(false);
          return;
        }
        const res = await fetch('/api/admin', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.status === 403) {
          setError('관리자 권한이 없습니다');
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error('통계 조회 실패');
        const data = await res.json();
        setStats(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : '오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">접근 불가</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            메인으로
          </Link>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg hover:bg-gray-100" aria-label="메인으로">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>
            <h1 className="text-lg font-bold text-gray-900">관리자 대시보드</h1>
          </div>
          <div className="text-xs text-gray-500 truncate max-w-[140px] sm:max-w-none">
            {user?.email}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 통계 카드 */}
        <section className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            icon={Users}
            label="전체 회원"
            value={`${KRW(stats.totalUsers)}명`}
            hint={`이번달 +${stats.newUsersThisMonth}`}
            color="bg-blue-500"
          />
          <StatCard
            icon={FileText}
            label="활성 공고"
            value={`${KRW(stats.activeJobs)}건`}
            hint={`전체 ${stats.totalJobs}`}
            color="bg-emerald-500"
          />
          <StatCard
            icon={Clock}
            label="승인 대기"
            value={`${KRW(stats.pendingJobs)}건`}
            color="bg-amber-500"
          />
          <StatCard
            icon={ClipboardCheck}
            label="총 지원수"
            value={`${KRW(stats.totalApplications)}건`}
            color="bg-purple-500"
          />
          <StatCard
            icon={Wallet}
            label="이번달 매출"
            value={`${KRW(stats.monthlyRevenue)}원`}
            hint="VAT 포함"
            color="bg-rose-500"
          />
          <StatCard
            icon={CreditCard}
            label="이번달 결제"
            value={`${KRW(stats.monthlyPaymentCount)}건`}
            color="bg-indigo-500"
          />
        </section>

        {/* 일별 추이 차트 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
              <TrendingUp className="w-4 h-4" />
              일별 추이 (최근 30일)
            </h2>
            <div className="flex bg-gray-200 rounded-lg p-0.5">
              {([
                { key: 'signups', label: '가입' },
                { key: 'jobs', label: '공고' },
                { key: 'revenue', label: '매출' },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setChartMetric(t.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    chartMetric === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <TrendChart daily={stats.daily} metric={chartMetric} />
        </section>

        {/* 최근 활동 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">최근 가입</h3>
              <Link href="/admin/members" className="text-xs text-blue-600 hover:text-blue-700">
                전체 보기 →
              </Link>
            </div>
            {stats.recentUsers.length === 0 ? (
              <p className="text-sm text-gray-400">데이터 없음</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {stats.recentUsers.map((u) => (
                  <li key={u.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {u.name || u.email?.split('@')[0] || '이름 없음'}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{u.email}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          u.user_type === 'employer' ? 'bg-purple-100 text-purple-700' : u.user_type === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {u.user_type === 'employer' ? '기업' : u.user_type === 'admin' ? '관리자' : '개인'}
                      </span>
                      <div className="text-[11px] text-gray-400 mt-1">{formatRelative(u.created_at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">최근 공고</h3>
              <Link href="/admin/jobs" className="text-xs text-blue-600 hover:text-blue-700">
                전체 보기 →
              </Link>
            </div>
            {stats.recentJobs.length === 0 ? (
              <p className="text-sm text-gray-400">데이터 없음</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {stats.recentJobs.map((j) => (
                  <li key={j.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">{j.title}</div>
                      <div className="text-xs text-gray-500 truncate">{j.company}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          j.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {j.is_approved ? '승인' : '대기'}
                      </span>
                      <div className="text-[11px] text-gray-400 mt-1">{formatRelative(j.created_at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 관리 메뉴 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">관리 메뉴</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/admin/members"
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all min-h-[80px] flex flex-col justify-center"
            >
              <Users className="w-5 h-5 text-blue-600 mb-2" />
              <div className="font-bold text-sm text-gray-900">회원 관리</div>
              <div className="text-[11px] text-gray-500">권한·삭제</div>
            </Link>
            <Link
              href="/admin/jobs"
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-emerald-300 hover:shadow-md transition-all min-h-[80px] flex flex-col justify-center"
            >
              <FileText className="w-5 h-5 text-emerald-600 mb-2" />
              <div className="font-bold text-sm text-gray-900">공고 관리</div>
              <div className="text-[11px] text-gray-500">승인·반려</div>
            </Link>
            <Link
              href="/admin/payments"
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-rose-300 hover:shadow-md transition-all min-h-[80px] flex flex-col justify-center"
            >
              <Wallet className="w-5 h-5 text-rose-600 mb-2" />
              <div className="font-bold text-sm text-gray-900">결제 관리</div>
              <div className="text-[11px] text-gray-500">내역·환불</div>
            </Link>
            <a
              href="https://vercel.com/onsia-realty/job/analytics"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-purple-300 hover:shadow-md transition-all min-h-[80px] flex flex-col justify-center"
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </div>
              <div className="font-bold text-sm text-gray-900">트래픽 분석</div>
              <div className="text-[11px] text-gray-500">Vercel</div>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
