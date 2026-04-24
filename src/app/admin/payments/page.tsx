'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle, Wallet, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/auth';

interface Payment {
  id: string;
  user_id: string;
  job_id: string | null;
  tier: string;
  amount: number;
  payment_method: string | null;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  users: { name: string; email: string } | null;
  jobs: { title: string; company: string } | null;
}

interface PaymentsResponse {
  payments: Payment[];
  stats: {
    totalRevenue: number;
    monthRevenue: number;
    completedCount: number;
    pendingCount: number;
  };
}

const KRW = (n: number) => new Intl.NumberFormat('ko-KR').format(n);
const STATUS_LABEL: Record<string, string> = {
  completed: '완료',
  pending: '대기',
  failed: '실패',
  refunded: '환불',
};
const STATUS_COLOR: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-200 text-gray-700',
};

export default function AdminPaymentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<PaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'refunded'>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setError('로그인이 필요합니다'); setLoading(false); return; }
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setError('세션 만료'); return; }
        const res = await fetch('/api/admin/payments', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.status === 403) { setError('관리자 권한이 없습니다'); return; }
        if (!res.ok) throw new Error('결제 조회 실패');
        setData(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : '오류');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">{error}</p>
          <Link href="/admin" className="text-blue-600 hover:text-blue-700">대시보드로</Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const filtered = data.payments.filter((p) => filter === 'all' || p.payment_status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-gray-100" aria-label="대시보드로">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">결제 관리</h1>
          <span className="ml-auto text-sm text-gray-500">{filtered.length}건</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <Wallet className="w-5 h-5 text-rose-500 mb-2" />
            <div className="text-xs text-gray-500">전체 매출</div>
            <div className="text-lg font-bold text-gray-900">{KRW(data.stats.totalRevenue)}원</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <Wallet className="w-5 h-5 text-blue-500 mb-2" />
            <div className="text-xs text-gray-500">이번달 매출</div>
            <div className="text-lg font-bold text-gray-900">{KRW(data.stats.monthRevenue)}원</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-2" />
            <div className="text-xs text-gray-500">완료 건수</div>
            <div className="text-lg font-bold text-gray-900">{KRW(data.stats.completedCount)}건</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <Clock className="w-5 h-5 text-amber-500 mb-2" />
            <div className="text-xs text-gray-500">대기 건수</div>
            <div className="text-lg font-bold text-gray-900">{KRW(data.stats.pendingCount)}건</div>
          </div>
        </section>

        <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 overflow-x-auto">
          {(['all', 'completed', 'pending', 'refunded'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap flex-shrink-0 ${
                filter === f ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f === 'all' ? '전체' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <ul className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <li className="px-4 py-12 text-center text-sm text-gray-400">결과 없음</li>
            ) : filtered.map((p) => (
              <li key={p.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${STATUS_COLOR[p.payment_status]}`}>
                      {STATUS_LABEL[p.payment_status]}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-bold flex-shrink-0">
                      {p.tier.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {p.users?.name || p.users?.email?.split('@')[0] || '알 수 없음'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {p.jobs?.title || '공고 없음'}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {new Date(p.created_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-900">{KRW(p.amount)}원</div>
                  {p.payment_method && (
                    <div className="text-[11px] text-gray-400 mt-1">{p.payment_method}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
