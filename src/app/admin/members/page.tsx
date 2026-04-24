'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/auth';

interface Member {
  id: string;
  email: string;
  name: string | null;
  nickname: string | null;
  phone: string | null;
  user_type: 'admin' | 'employer' | 'seeker';
  is_active?: boolean;
  created_at: string;
}

const ROLE_LABEL: Record<string, string> = {
  admin: '관리자',
  employer: '기업',
  seeker: '개인',
};
const ROLE_COLOR: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  employer: 'bg-purple-100 text-purple-700',
  seeker: 'bg-blue-100 text-blue-700',
};

export default function AdminMembersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'admin' | 'employer' | 'seeker'>('all');
  const [search, setSearch] = useState('');
  const [actioning, setActioning] = useState<string | null>(null);

  const reload = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch('/api/admin/members', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.status === 403) { setError('관리자 권한이 없습니다'); return; }
    if (!res.ok) throw new Error('회원 조회 실패');
    setMembers(await res.json());
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setError('로그인이 필요합니다'); setLoading(false); return; }
    reload().catch((e) => setError(e.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleAction = async (id: string, action: 'set_role' | 'toggle_status', extra?: Record<string, unknown>) => {
    if (!confirm(action === 'set_role' ? '권한을 변경하시겠습니까?' : '활성 상태를 변경하시겠습니까?')) return;
    setActioning(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/members/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) throw new Error('변경 실패');
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류');
    } finally {
      setActioning(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 회원을 영구 삭제하시겠습니까? (취소 불가)`)) return;
    setActioning(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/members/${id}`, {
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

  const filtered = members.filter((m) => {
    if (filter !== 'all' && m.user_type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (m.name || '').toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.nickname || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-gray-100" aria-label="대시보드로">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">회원 관리</h1>
          <span className="ml-auto text-sm text-gray-500">{filtered.length}명</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름·이메일·닉네임 검색"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
            />
          </div>
          <div className="flex bg-white rounded-lg border border-gray-200 p-0.5">
            {(['all', 'admin', 'employer', 'seeker'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filter === f ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f === 'all' ? '전체' : ROLE_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <ul className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <li className="px-4 py-12 text-center text-sm text-gray-400">결과 없음</li>
            ) : filtered.map((m) => (
              <li key={m.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {m.name || m.nickname || m.email.split('@')[0]}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${ROLE_COLOR[m.user_type]}`}>
                      {ROLE_LABEL[m.user_type]}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{m.email}</div>
                  {m.phone && <div className="text-[11px] text-gray-400 truncate">{m.phone}</div>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <select
                    value={m.user_type}
                    onChange={(e) => handleAction(m.id, 'set_role', { role: e.target.value })}
                    disabled={actioning === m.id || m.id === user?.id}
                    className="text-xs border border-gray-200 rounded px-2 py-1 disabled:opacity-50"
                  >
                    <option value="seeker">개인</option>
                    <option value="employer">기업</option>
                    <option value="admin">관리자</option>
                  </select>
                  <button
                    onClick={() => handleDelete(m.id, m.name || m.email)}
                    disabled={actioning === m.id || m.id === user?.id}
                    className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-30 min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
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
