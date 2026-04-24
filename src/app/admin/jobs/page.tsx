'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle, Check, X, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/auth';

interface Job {
  id: string;
  title: string;
  company: string;
  category: 'agent' | 'sales';
  tier: string;
  region: string;
  is_active: boolean;
  is_approved: boolean;
  application_count: number;
  views: number;
  created_at: string;
}

export default function AdminJobsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'inactive'>('all');
  const [actioning, setActioning] = useState<string | null>(null);

  const reload = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch('/api/admin/jobs', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.status === 403) { setError('관리자 권한이 없습니다'); return; }
    if (!res.ok) throw new Error('공고 조회 실패');
    setJobs(await res.json());
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setError('로그인이 필요합니다'); setLoading(false); return; }
    reload().catch((e) => setError(e.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'toggle_active') => {
    setActioning(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('처리 실패');
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류');
    } finally {
      setActioning(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 공고를 영구 삭제하시겠습니까?`)) return;
    setActioning(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('삭제 실패');
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류');
    } finally {
      setActioning(null);
    }
  };

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

  const filtered = jobs.filter((j) => {
    if (filter === 'pending') return !j.is_approved && j.is_active;
    if (filter === 'approved') return j.is_approved && j.is_active;
    if (filter === 'inactive') return !j.is_active;
    return true;
  });

  const counts = {
    all: jobs.length,
    pending: jobs.filter((j) => !j.is_approved && j.is_active).length,
    approved: jobs.filter((j) => j.is_approved && j.is_active).length,
    inactive: jobs.filter((j) => !j.is_active).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-gray-100" aria-label="대시보드로">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">공고 관리</h1>
          <span className="ml-auto text-sm text-gray-500">{filtered.length}건</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 overflow-x-auto">
          {([
            { key: 'all', label: `전체 ${counts.all}` },
            { key: 'pending', label: `대기 ${counts.pending}` },
            { key: 'approved', label: `승인 ${counts.approved}` },
            { key: 'inactive', label: `비활성 ${counts.inactive}` },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex-shrink-0 ${
                filter === f.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <ul className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <li className="px-4 py-12 text-center text-sm text-gray-400">결과 없음</li>
            ) : filtered.map((j) => (
              <li key={j.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 flex-shrink-0">
                        {j.category === 'agent' ? '중개사' : '분양'}
                      </span>
                      {j.tier !== 'normal' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 flex-shrink-0 font-bold">
                          {j.tier.toUpperCase()}
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                        j.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {j.is_approved ? '승인' : '대기'}
                      </span>
                      {!j.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 flex-shrink-0">
                          비활성
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/${j.category}/jobs/${j.id}`}
                      target="_blank"
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 inline-flex items-center gap-1"
                    >
                      <span className="truncate max-w-[260px] sm:max-w-none">{j.title}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </Link>
                    <div className="text-xs text-gray-500 truncate">
                      {j.company} · {j.region} · 지원 {j.application_count} · 조회 {j.views}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {!j.is_approved && (
                    <button
                      onClick={() => handleAction(j.id, 'approve')}
                      disabled={actioning === j.id}
                      className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-1 min-h-[32px]"
                    >
                      <Check className="w-3 h-3" /> 승인
                    </button>
                  )}
                  {j.is_approved && (
                    <button
                      onClick={() => handleAction(j.id, 'reject')}
                      disabled={actioning === j.id}
                      className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 inline-flex items-center gap-1 min-h-[32px]"
                    >
                      <X className="w-3 h-3" /> 반려
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(j.id, 'toggle_active')}
                    disabled={actioning === j.id}
                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 min-h-[32px]"
                  >
                    {j.is_active ? '비활성화' : '활성화'}
                  </button>
                  <button
                    onClick={() => handleDelete(j.id, j.title)}
                    disabled={actioning === j.id}
                    className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 inline-flex items-center gap-1 min-h-[32px]"
                  >
                    <Trash2 className="w-3 h-3" /> 삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
