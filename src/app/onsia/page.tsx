'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Briefcase, CreditCard, Megaphone, Settings,
  TrendingUp, TrendingDown, UserPlus, DollarSign, FileText, Send,
  Search, Ban, Trash2, CheckCircle2, XCircle, Eye,
  ArrowLeft, ToggleLeft, ToggleRight,
  Activity, Bell, Image as ImageIcon, Shield, Loader2,
  Lock, Mail, KeyRound,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// ============================================================
// TYPES
// ============================================================
type TabId = 'dashboard' | 'members' | 'jobs' | 'payments' | 'ads' | 'settings';

interface DbMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  user_type: 'employer' | 'seeker' | 'admin';
  is_active?: boolean;
  created_at: string;
}

interface DbJob {
  id: string;
  title: string;
  description: string;
  type: string;
  tier: string;
  category: string;
  company: string;
  region: string;
  views: number;
  is_active: boolean;
  is_approved: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  deadline: string | null;
  application_count: number;
}

interface DashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeJobs: number;
  totalJobs: number;
  pendingJobs: number;
  totalApplications: number;
  recentUsers: { id: string; name: string; email: string; user_type: string; created_at: string }[];
  recentJobs: { id: string; title: string; company: string; is_approved: boolean; created_at: string }[];
}

interface DbPayment {
  id: string;
  user_id: string;
  job_id: string | null;
  tier: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  users: { name: string; email: string } | null;
  jobs: { title: string; company: string } | null;
}

interface PaymentStats {
  totalRevenue: number;
  monthRevenue: number;
  completedCount: number;
  pendingCount: number;
}

interface Ad {
  id: number;
  advertiser: string;
  tier: 'VIP' | 'Premium' | 'Standard';
  startDate: string;
  endDate: string;
  remainDays: number;
  impressions: number;
  clicks: number;
  status: '활성' | '만료' | '일시중지';
}

interface Banner {
  id: number;
  title: string;
  position: string;
  active: boolean;
}

interface Notice {
  id: number;
  title: string;
  badge: '공지' | '이벤트' | '업데이트' | '긴급';
  active: boolean;
  createdAt: string;
}

// ============================================================
// MOCK DATA (광고/설정 - 아직 DB 테이블 없음)
// ============================================================

const mockAds: Ad[] = [
  { id: 1, advertiser: '강남부동산', tier: 'VIP', startDate: '2025-01-01', endDate: '2025-03-01', remainDays: 22, impressions: 45230, clicks: 1234, status: '활성' },
  { id: 2, advertiser: '한화 포레나', tier: 'Premium', startDate: '2025-01-15', endDate: '2025-03-15', remainDays: 36, impressions: 32100, clicks: 890, status: '활성' },
  { id: 3, advertiser: '래미안 송도', tier: 'VIP', startDate: '2024-11-01', endDate: '2025-01-01', remainDays: 0, impressions: 89450, clicks: 3456, status: '만료' },
];

const mockBanners: Banner[] = [
  { id: 1, title: '프리미엄 광고 50% 할인 배너', position: '홈 상단', active: true },
  { id: 2, title: 'AI 매칭 서비스 소개 배너', position: '홈 상단', active: true },
  { id: 3, title: '신규 가입 이벤트 배너', position: '홈 중간', active: false },
];

const mockNotices: Notice[] = [
  { id: 1, title: '부동산인 정식 오픈!', badge: '공지', active: true, createdAt: '2025-01-01' },
  { id: 2, title: '프리미엄 광고 50% 할인 이벤트', badge: '이벤트', active: true, createdAt: '2025-01-15' },
  { id: 3, title: 'AI 매칭 시스템 업그레이드', badge: '업데이트', active: true, createdAt: '2025-02-01' },
];

// ============================================================
// TABS CONFIG
// ============================================================
const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'members', label: '회원관리', icon: Users },
  { id: 'jobs', label: '공고관리', icon: Briefcase },
  { id: 'payments', label: '결제관리', icon: CreditCard },
  { id: 'ads', label: '광고관리', icon: Megaphone },
  { id: 'settings', label: '사이트설정', icon: Settings },
];

// ============================================================
// HELPER COMPONENTS
// ============================================================
function MetricCard({ label, value, sub, trend, icon: Icon, color }: {
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down';
  icon: typeof Users;
  color: string;
}) {
  return (
    <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {sub && trend && (
          <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {sub}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    unique: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white',
    superior: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    premium: 'bg-blue-600 text-white',
    normal: 'bg-gray-600 text-gray-300',
    VIP: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white',
    Premium: 'bg-blue-600 text-white',
    Standard: 'bg-gray-600 text-gray-300',
  };
  const labels: Record<string, string> = {
    unique: 'UNIQUE',
    superior: 'SUPERIOR',
    premium: 'PREMIUM',
    normal: '일반',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${styles[tier] || 'bg-gray-600 text-gray-300'}`}>
      {labels[tier] || tier}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    '활성': 'bg-green-500/20 text-green-400',
    '게시중': 'bg-green-500/20 text-green-400',
    '완료': 'bg-green-500/20 text-green-400',
    '승인대기': 'bg-amber-500/20 text-amber-400',
    '대기': 'bg-amber-500/20 text-amber-400',
    '정지': 'bg-red-500/20 text-red-400',
    '비활성': 'bg-red-500/20 text-red-400',
    '반려': 'bg-red-500/20 text-red-400',
    '취소': 'bg-red-500/20 text-red-400',
    '마감': 'bg-gray-500/20 text-gray-400',
    '만료': 'bg-gray-500/20 text-gray-400',
    '일시중지': 'bg-orange-500/20 text-orange-400',
  };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  );
}

// ============================================================
// API HELPER
// ============================================================
async function adminFetch(url: string, options?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('로그인이 필요합니다');

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ============================================================
// JOB STATUS HELPERS
// ============================================================
function getJobStatus(job: DbJob): string {
  if (!job.is_approved && job.is_active) return '승인대기';
  if (!job.is_approved && !job.is_active) return '반려';
  if (job.is_approved && !job.is_active) return '마감';
  if (job.deadline) {
    const now = new Date();
    const deadline = new Date(job.deadline);
    if (deadline < now) return '마감';
  }
  return '게시중';
}

function getCategoryLabel(category: string): string {
  return category === 'sales' ? '분양상담사' : '공인중개사';
}

function getUserTypeLabel(type: string): string {
  if (type === 'employer') return '구인';
  if (type === 'seeker') return '구직';
  return '관리자';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '-').replace(/\./g, '');
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return formatDate(dateStr);
}

// ============================================================
// ADMIN LOGIN FORM
// ============================================================
function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoginError(error.message === 'Invalid login credentials'
          ? '이메일 또는 비밀번호가 올바르지 않습니다'
          : error.message);
      }
    } catch {
      setLoginError('로그인 중 오류가 발생했습니다');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141517] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">관리자 인증</h1>
          <p className="text-sm text-gray-500 mt-1">승인된 계정만 접근할 수 있습니다</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-[#1C1D1F] text-white text-sm rounded-xl pl-10 pr-4 py-3 border border-white/10 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-[#1C1D1F] text-white text-sm rounded-xl pl-10 pr-4 py-3 border border-white/10 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{loginError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {loginLoading ? '인증 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Dashboard state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Members state
  const [members, setMembers] = useState<DbMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberTypeFilter, setMemberTypeFilter] = useState('전체');
  const [memberStatusFilter, setMemberStatusFilter] = useState('전체');

  // Jobs state
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [jobCategoryFilter, setJobCategoryFilter] = useState('전체');
  const [jobTierFilter, setJobTierFilter] = useState('전체');
  const [jobStatusFilter, setJobStatusFilter] = useState('전체');

  // Payment state (real)
  const [payments, setPayments] = useState<DbPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({ totalRevenue: 0, monthRevenue: 0, completedCount: 0, pendingCount: 0 });

  // Ad filter (mock)
  const [adFilter, setAdFilter] = useState('전체');

  // Settings state (mock)
  const [banners, setBanners] = useState<Banner[]>(mockBanners);
  const [notices, setNotices] = useState<Notice[]>(mockNotices);

  // Action loading state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ---- Data fetching ----
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await adminFetch('/api/admin');
      setStats(data);
    } catch (err: any) {
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const data = await adminFetch('/api/admin/members');
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const data = await adminFetch('/api/admin/jobs');
      setJobs(data);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const data = await adminFetch('/api/admin/payments');
      setPayments(data.payments || []);
      setPaymentStats(data.stats || { totalRevenue: 0, monthRevenue: 0, completedCount: 0, pendingCount: 0 });
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (!user) return;
    if (activeTab === 'dashboard') loadStats();
    if (activeTab === 'members') loadMembers();
    if (activeTab === 'jobs') loadJobs();
    if (activeTab === 'payments') loadPayments();
  }, [activeTab, user, loadStats, loadMembers, loadJobs, loadPayments]);

  // ---- Action handlers ----
  const handleJobAction = async (jobId: string, action: 'approve' | 'reject') => {
    setActionLoading(jobId);
    try {
      await adminFetch(`/api/admin/jobs/${jobId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      await loadJobs();
    } catch (err) {
      console.error('Job action failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('정말 삭제하시겠습니까? 관련 지원 내역도 모두 삭제됩니다.')) return;
    setActionLoading(jobId);
    try {
      await adminFetch(`/api/admin/jobs/${jobId}`, { method: 'DELETE' });
      await loadJobs();
    } catch (err) {
      console.error('Job delete failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleMemberStatus = async (memberId: string) => {
    setActionLoading(memberId);
    try {
      await adminFetch(`/api/admin/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'toggle_status' }),
      });
      await loadMembers();
    } catch (err) {
      console.error('Member toggle failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('정말 삭제하시겠습니까? 해당 회원의 모든 데이터가 삭제됩니다.')) return;
    setActionLoading(memberId);
    try {
      await adminFetch(`/api/admin/members/${memberId}`, { method: 'DELETE' });
      await loadMembers();
    } catch (err) {
      console.error('Member delete failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleBanner = (id: number) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };
  const toggleNotice = (id: number) => {
    setNotices(prev => prev.map(n => n.id === id ? { ...n, active: !n.active } : n));
  };

  // ---- Filtered data ----
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchSearch = !memberSearch || m.name?.includes(memberSearch) || m.email?.includes(memberSearch);
      const matchType = memberTypeFilter === '전체' || getUserTypeLabel(m.user_type) === memberTypeFilter;
      const matchStatus = memberStatusFilter === '전체' ||
        (memberStatusFilter === '활성' && m.is_active !== false) ||
        (memberStatusFilter === '정지' && m.is_active === false);
      return matchSearch && matchType && matchStatus;
    });
  }, [members, memberSearch, memberTypeFilter, memberStatusFilter]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const status = getJobStatus(j);
      const matchSearch = !jobSearch || j.title?.includes(jobSearch) || j.company?.includes(jobSearch);
      const matchCategory = jobCategoryFilter === '전체' || getCategoryLabel(j.category) === jobCategoryFilter;
      const matchTier = jobTierFilter === '전체' || j.tier === jobTierFilter;
      const matchStatus = jobStatusFilter === '전체' || status === jobStatusFilter;
      return matchSearch && matchCategory && matchTier && matchStatus;
    });
  }, [jobs, jobSearch, jobCategoryFilter, jobTierFilter, jobStatusFilter]);

  const filteredAds = useMemo(() => {
    if (adFilter === '전체') return mockAds;
    return mockAds.filter(a => a.status === adFilter);
  }, [adFilter]);

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#141517] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <AdminLoginForm />;
  }

  // ============================================================
  // RENDER HELPERS
  // ============================================================
  const renderLoading = () => (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
    </div>
  );

  const renderDashboard = () => {
    if (statsLoading) return renderLoading();
    if (statsError) {
      return (
        <div className="text-center py-20">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-medium mb-2">접근 권한이 없습니다</p>
          <p className="text-gray-500 text-sm">{statsError}</p>
        </div>
      );
    }
    if (!stats) return null;

    return (
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <MetricCard label="총 가입자" value={stats.totalUsers.toLocaleString()} icon={Users} color="bg-blue-600" />
          <MetricCard label="신규 가입 (이번달)" value={stats.newUsersThisMonth.toLocaleString()} icon={UserPlus} color="bg-green-600" />
          <MetricCard label="활성 공고" value={stats.activeJobs.toLocaleString()} icon={FileText} color="bg-orange-600" />
          <MetricCard label="전체 공고" value={stats.totalJobs.toLocaleString()} icon={Briefcase} color="bg-purple-600" />
          <MetricCard label="승인 대기" value={stats.pendingJobs.toLocaleString()} icon={DollarSign} color="bg-amber-600" />
          <MetricCard label="총 지원 수" value={stats.totalApplications.toLocaleString()} icon={Send} color="bg-pink-600" />
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> 최근 가입자
            </h3>
            <div className="space-y-3">
              {stats.recentUsers.length > 0 ? stats.recentUsers.map(u => (
                <div key={u.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <Users className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">{u.name || u.email}</p>
                    <p className="text-xs text-gray-600">{getUserTypeLabel(u.user_type)}</p>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">{timeAgo(u.created_at)}</span>
                </div>
              )) : (
                <p className="text-sm text-gray-600">가입자가 없습니다</p>
              )}
            </div>
          </div>
          <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> 최근 공고
            </h3>
            <div className="space-y-3">
              {stats.recentJobs.length > 0 ? stats.recentJobs.map(j => (
                <div key={j.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <Briefcase className={`w-4 h-4 shrink-0 ${j.is_approved ? 'text-green-400' : 'text-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">{j.title}</p>
                    <p className="text-xs text-gray-600">{j.company}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={j.is_approved ? '게시중' : '승인대기'} />
                    <span className="text-xs text-gray-600">{timeAgo(j.created_at)}</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-600">등록된 공고가 없습니다</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMembers = () => {
    if (membersLoading && members.length === 0) return renderLoading();

    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="bg-[#1C1D1F] rounded-xl p-4 border border-white/5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="이름 또는 이메일 검색..."
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                className="w-full bg-[#252628] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={memberTypeFilter}
                onChange={e => setMemberTypeFilter(e.target.value)}
                className="bg-[#252628] text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="전체">역할: 전체</option>
                <option value="구인">구인</option>
                <option value="구직">구직</option>
                <option value="관리자">관리자</option>
              </select>
              <select
                value={memberStatusFilter}
                onChange={e => setMemberStatusFilter(e.target.value)}
                className="bg-[#252628] text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="전체">상태: 전체</option>
                <option value="활성">활성</option>
                <option value="정지">정지</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">총 {filteredMembers.length}명</p>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-[#1C1D1F] rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-500 font-medium px-4 py-3">이름</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">이메일</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">역할</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">회사</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">가입일</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">상태</th>
                <th className="text-right text-gray-500 font-medium px-4 py-3">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(m => (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{m.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{m.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      m.user_type === 'employer' ? 'bg-blue-500/20 text-blue-400'
                      : m.user_type === 'admin' ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-teal-500/20 text-teal-400'
                    }`}>
                      {getUserTypeLabel(m.user_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{m.company_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(m.created_at)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.is_active !== false ? '활성' : '정지'} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {m.user_type !== 'admin' && (
                        <>
                          <button
                            onClick={() => handleToggleMemberStatus(m.id)}
                            disabled={actionLoading === m.id}
                            className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
                              m.is_active !== false
                                ? 'text-amber-400 hover:bg-amber-500/10'
                                : 'text-green-400 hover:bg-green-500/10'
                            }`}
                            title={m.is_active !== false ? '정지' : '해제'}
                          >
                            {actionLoading === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m.id)}
                            disabled={actionLoading === m.id}
                            className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMembers.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">
              {membersLoading ? '로딩 중...' : '검색 결과가 없습니다'}
            </div>
          )}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filteredMembers.map(m => (
            <div key={m.id} className="bg-[#1C1D1F] rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{m.name || '-'}</span>
                <StatusBadge status={m.is_active !== false ? '활성' : '정지'} />
              </div>
              <p className="text-xs text-gray-500 mb-1">{m.email}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  m.user_type === 'employer' ? 'bg-blue-500/20 text-blue-400' : 'bg-teal-500/20 text-teal-400'
                }`}>
                  {getUserTypeLabel(m.user_type)}
                </span>
                {m.company_name && <span className="text-xs text-gray-500">{m.company_name}</span>}
                <span className="text-xs text-gray-600">{formatDate(m.created_at)}</span>
              </div>
              {m.user_type !== 'admin' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleMemberStatus(m.id)}
                    disabled={actionLoading === m.id}
                    className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                      m.is_active !== false
                        ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                        : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                    }`}
                  >
                    {m.is_active !== false ? '정지' : '해제'}
                  </button>
                  <button
                    onClick={() => handleDeleteMember(m.id)}
                    disabled={actionLoading === m.id}
                    className="flex-1 text-xs py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredMembers.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">검색 결과가 없습니다</div>
          )}
        </div>
      </div>
    );
  };

  const renderJobs = () => {
    if (jobsLoading && jobs.length === 0) return renderLoading();

    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="bg-[#1C1D1F] rounded-xl p-4 border border-white/5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="제목 또는 회사명 검색..."
                value={jobSearch}
                onChange={e => setJobSearch(e.target.value)}
                className="w-full bg-[#252628] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={jobCategoryFilter}
                onChange={e => setJobCategoryFilter(e.target.value)}
                className="bg-[#252628] text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="전체">카테고리: 전체</option>
                <option value="공인중개사">공인중개사</option>
                <option value="분양상담사">분양상담사</option>
              </select>
              <select
                value={jobTierFilter}
                onChange={e => setJobTierFilter(e.target.value)}
                className="bg-[#252628] text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="전체">티어: 전체</option>
                <option value="unique">UNIQUE</option>
                <option value="superior">SUPERIOR</option>
                <option value="premium">PREMIUM</option>
                <option value="normal">일반</option>
              </select>
              <select
                value={jobStatusFilter}
                onChange={e => setJobStatusFilter(e.target.value)}
                className="bg-[#252628] text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="전체">상태: 전체</option>
                <option value="게시중">게시중</option>
                <option value="승인대기">승인대기</option>
                <option value="반려">반려</option>
                <option value="마감">마감</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">총 {filteredJobs.length}건</p>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-[#1C1D1F] rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-gray-500 font-medium px-4 py-3">제목</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">회사</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">카테고리</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">티어</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">등록일</th>
                  <th className="text-right text-gray-500 font-medium px-4 py-3">조회</th>
                  <th className="text-right text-gray-500 font-medium px-4 py-3">지원</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">상태</th>
                  <th className="text-right text-gray-500 font-medium px-4 py-3">액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(j => {
                  const status = getJobStatus(j);
                  return (
                    <tr key={j.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">{j.title}</td>
                      <td className="px-4 py-3 text-gray-400">{j.company}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{getCategoryLabel(j.category)}</td>
                      <td className="px-4 py-3"><TierBadge tier={j.tier} /></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(j.created_at)}</td>
                      <td className="px-4 py-3 text-gray-400 text-right">{j.views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-400 text-right">{j.application_count}</td>
                      <td className="px-4 py-3"><StatusBadge status={status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {status === '승인대기' && (
                            <>
                              <button
                                onClick={() => handleJobAction(j.id, 'approve')}
                                disabled={actionLoading === j.id}
                                className="p-1.5 rounded-md text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                                title="승인"
                              >
                                {actionLoading === j.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleJobAction(j.id, 'reject')}
                                disabled={actionLoading === j.id}
                                className="p-1.5 rounded-md text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                                title="반려"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteJob(j.id)}
                            disabled={actionLoading === j.id}
                            className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredJobs.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">
              {jobsLoading ? '로딩 중...' : '검색 결과가 없습니다'}
            </div>
          )}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filteredJobs.map(j => {
            const status = getJobStatus(j);
            return (
              <div key={j.id} className="bg-[#1C1D1F] rounded-xl p-4 border border-white/5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <TierBadge tier={j.tier} />
                      <StatusBadge status={status} />
                    </div>
                    <h4 className="text-white font-medium text-sm truncate">{j.title}</h4>
                    <p className="text-xs text-gray-500">{j.company} | {getCategoryLabel(j.category)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{j.views.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Send className="w-3 h-3" />{j.application_count}</span>
                  <span>{formatDate(j.created_at)}</span>
                </div>
                <div className="flex gap-2">
                  {status === '승인대기' && (
                    <>
                      <button
                        onClick={() => handleJobAction(j.id, 'approve')}
                        disabled={actionLoading === j.id}
                        className="flex-1 text-xs py-1.5 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleJobAction(j.id, 'reject')}
                        disabled={actionLoading === j.id}
                        className="flex-1 text-xs py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                      >
                        반려
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteJob(j.id)}
                    disabled={actionLoading === j.id}
                    className="flex-1 text-xs py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
          {filteredJobs.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">검색 결과가 없습니다</div>
          )}
        </div>
      </div>
    );
  };

  const getPaymentStatusLabel = (status: string): string => {
    const map: Record<string, string> = { completed: '완료', pending: '대기', cancelled: '취소', failed: '실패' };
    return map[status] || status;
  };

  const getTierLabel = (tier: string): string => {
    const map: Record<string, string> = { unique: 'UNIQUE 공고', superior: 'SUPERIOR 공고', premium: 'PREMIUM 공고', normal: '일반 공고' };
    return map[tier] || tier;
  };

  const getMethodLabel = (method: string): string => {
    const map: Record<string, string> = { card: '카드', transfer: '계좌이체', virtual_account: '가상계좌', phone: '휴대폰' };
    return map[method] || method;
  };

  const formatAmount = (amount: number): string => {
    if (amount >= 10000) return `₩${(amount / 10000).toLocaleString()}만`;
    return `₩${amount.toLocaleString()}`;
  };

  const renderPayments = () => {
    if (paymentsLoading && payments.length === 0) return renderLoading();

    return (
      <div className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
            <p className="text-xs text-gray-500 mb-1">이번달 매출</p>
            <p className="text-xl font-bold text-white">{formatAmount(paymentStats.monthRevenue)}</p>
          </div>
          <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
            <p className="text-xs text-gray-500 mb-1">누적 매출</p>
            <p className="text-xl font-bold text-white">{formatAmount(paymentStats.totalRevenue)}</p>
          </div>
          <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
            <p className="text-xs text-gray-500 mb-1">결제 완료</p>
            <p className="text-xl font-bold text-white">{paymentStats.completedCount}건</p>
          </div>
          <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
            <p className="text-xs text-gray-500 mb-1">결제 대기</p>
            <p className="text-xl font-bold text-amber-400">{paymentStats.pendingCount}건</p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="bg-[#1C1D1F] rounded-xl border border-white/5 py-16 text-center">
            <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-medium mb-1">결제 내역이 없습니다</p>
            <p className="text-gray-600 text-sm">결제가 발생하면 여기에 표시됩니다</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-[#1C1D1F] rounded-xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-gray-500 font-medium px-4 py-3">결제자</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">상품</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">결제수단</th>
                      <th className="text-right text-gray-500 font-medium px-4 py-3">금액</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">기간</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">결제일</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-white font-medium">{p.users?.name || '-'}</p>
                            <p className="text-xs text-gray-600">{p.users?.email || ''}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-gray-300">{getTierLabel(p.tier)}</p>
                            {p.jobs && <p className="text-xs text-gray-600 truncate max-w-[150px]">{p.jobs.title}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{getMethodLabel(p.payment_method)}</td>
                        <td className="px-4 py-3 text-gray-300 text-right font-medium">₩{p.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {p.start_date && p.end_date ? `${p.start_date} ~ ${p.end_date}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(p.created_at)}</td>
                        <td className="px-4 py-3"><StatusBadge status={getPaymentStatusLabel(p.payment_status)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {payments.map(p => (
                <div key={p.id} className="bg-[#1C1D1F] rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{p.users?.name || '-'}</span>
                    <StatusBadge status={getPaymentStatusLabel(p.payment_status)} />
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{getTierLabel(p.tier)}</p>
                  {p.jobs && <p className="text-xs text-gray-600 mb-2 truncate">{p.jobs.title} ({p.jobs.company})</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">₩{p.amount.toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">{getMethodLabel(p.payment_method)}</span>
                      <span className="text-xs text-gray-600">{formatDate(p.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderAds = () => (
    <div className="space-y-4">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
        <p className="text-amber-400 text-sm">광고 관리 기능은 추후 업데이트 예정입니다 (현재 샘플 데이터)</p>
      </div>
      {/* Sub filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['전체', '활성', '만료', '일시중지'].map(f => (
          <button
            key={f}
            onClick={() => setAdFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              adFilter === f
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                : 'bg-[#1C1D1F] text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            {f} {f !== '전체' && (
              <span className="ml-1 text-xs opacity-70">
                ({mockAds.filter(a => a.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Ad cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAds.map(ad => (
          <div key={ad.id} className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium text-sm">{ad.advertiser}</span>
              <StatusBadge status={ad.status} />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <TierBadge tier={ad.tier} />
              <span className="text-xs text-gray-600">{ad.startDate} ~ {ad.endDate}</span>
            </div>
            {ad.remainDays > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">잔여일</span>
                  <span className={`font-medium ${ad.remainDays <= 10 ? 'text-red-400' : 'text-cyan-400'}`}>{ad.remainDays}일</span>
                </div>
                <div className="w-full bg-[#252628] rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${ad.remainDays <= 10 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}
                    style={{ width: `${Math.min((ad.remainDays / 90) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
              <div>
                <p className="text-xs text-gray-500">노출수</p>
                <p className="text-sm font-medium text-white">{ad.impressions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">클릭수</p>
                <p className="text-sm font-medium text-white">{ad.clicks.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-2 text-right">
              <span className="text-[10px] text-gray-600">CTR {((ad.clicks / ad.impressions) * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Banner Management */}
      <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> 배너 관리
        </h3>
        <div className="space-y-3">
          {banners.map(b => (
            <div key={b.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{b.title}</p>
                <span className="text-xs text-gray-600">{b.position}</span>
              </div>
              <button onClick={() => toggleBanner(b.id)} className="ml-3 shrink-0">
                {b.active ? <ToggleRight className="w-7 h-7 text-cyan-400" /> : <ToggleLeft className="w-7 h-7 text-gray-600" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notice Management */}
      <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" /> 공지사항 관리
        </h3>
        <div className="space-y-3">
          {notices.map(n => {
            const badgeColors: Record<string, string> = {
              '공지': 'bg-blue-500/20 text-blue-400',
              '이벤트': 'bg-pink-500/20 text-pink-400',
              '업데이트': 'bg-green-500/20 text-green-400',
              '긴급': 'bg-red-500/20 text-red-400',
            };
            return (
              <div key={n.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeColors[n.badge] || 'bg-gray-500/20 text-gray-400'}`}>
                      {n.badge}
                    </span>
                    <span className="text-xs text-gray-600">{n.createdAt}</span>
                  </div>
                  <p className="text-sm text-white truncate">{n.title}</p>
                </div>
                <button onClick={() => toggleNotice(n.id)} className="ml-3 shrink-0">
                  {n.active ? <ToggleRight className="w-7 h-7 text-cyan-400" /> : <ToggleLeft className="w-7 h-7 text-gray-600" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'members': return renderMembers();
      case 'jobs': return renderJobs();
      case 'payments': return renderPayments();
      case 'ads': return renderAds();
      case 'settings': return renderSettings();
    }
  };

  return (
    <div className="min-h-screen bg-[#141517] text-white">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 z-50 bg-[#141517]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h1 className="text-lg font-bold">
                  <span className="text-white">관리자</span>
                  <span className="text-cyan-400 ml-1">대시보드</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden sm:block">
                {user?.email || 'admin@onsia.city'}
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-xs font-bold">
                A
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-white/5 sticky top-[57px] z-40 bg-[#141517]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide -mb-px gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                    isActive
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderTabContent()}
      </main>
    </div>
  );
}
