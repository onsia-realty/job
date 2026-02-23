'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Users,
  Eye,
  ChevronRight,
  PenSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  MapPin,
  Crown,
  Star,
  MoreVertical,
  Power,
  Trash2,
  Edit3,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyJobs, fetchApplicationCounts, toggleJobActive, deleteJob } from '@/lib/supabase';

interface JobPosting {
  id: string;
  title: string;
  company: string;
  region: string;
  tier: 'vip' | 'premium' | 'normal';
  type: string;
  category?: string;
  property_category?: 'residential' | 'commercial' | null;
  is_active: boolean;
  is_approved: boolean;
  views: number;
  created_at: string;
  deadline: string | null;
}

const TIER_STYLES = {
  vip: {
    bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
    border: 'border-amber-300',
    badge: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white',
    icon: Crown,
    label: 'VIP',
  },
  premium: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    badge: 'bg-blue-600 text-white',
    icon: Star,
    label: 'PREMIUM',
  },
  normal: {
    bg: 'bg-white',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-600',
    icon: Briefcase,
    label: '일반',
  },
};

const STATUS_CONFIG = {
  active: {
    label: '게시중',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
  },
  pending: {
    label: '승인대기',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  rejected: {
    label: '반려됨',
    color: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
  inactive: {
    label: '비활성',
    color: 'bg-gray-100 text-gray-600',
    icon: AlertCircle,
  },
};

export default function EmployerDashboardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    totalViews: 0,
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const myJobs = await fetchMyJobs(user.id);
        setJobs(myJobs);

        if (myJobs.length > 0) {
          const jobIds = myJobs.map((job: JobPosting) => job.id);
          const counts = await fetchApplicationCounts(jobIds);
          setApplicationCounts(counts);
        }
      } catch (error) {
        console.error('Error loading employer data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user?.id]);

  // 통계 계산
  useEffect(() => {
    const totalApplications = Object.values(applicationCounts).reduce((sum, count) => sum + count, 0);
    const totalViews = jobs.reduce((sum, job) => sum + (job.views || 0), 0);
    setStats({
      totalJobs: jobs.length,
      activeJobs: jobs.filter(job => job.is_active && job.is_approved).length,
      totalApplications,
      totalViews,
    });
  }, [jobs, applicationCounts]);

  const getJobStatus = (job: JobPosting) => {
    if (!job.is_approved) return 'pending';
    if (!job.is_active) return 'inactive';
    return 'active';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleToggleActive = async (jobId: string, currentActive: boolean) => {
    const success = await toggleJobActive(jobId, !currentActive);
    if (success) {
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_active: !currentActive } : j));
    }
    setOpenMenuId(null);
  };

  const handleDeleteJob = async (jobId: string) => {
    const success = await deleteJob(jobId);
    if (success) {
      setJobs(prev => prev.filter(j => j.id !== jobId));
      const newCounts = { ...applicationCounts };
      delete newCounts[jobId];
      setApplicationCounts(newCounts);
    }
    setDeleteConfirmId(null);
    setOpenMenuId(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 mb-6">기업회원 대시보드를 이용하려면 로그인해주세요</p>
          <Link
            href="/agent/auth/login"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/agent/mypage"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-gray-900">기업회원 대시보드</h1>
            <Link
              href="/agent/jobs/new"
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <PenSquare className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
                <p className="text-xs text-gray-500">전체 공고</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
                <p className="text-xs text-gray-500">게시중</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                <p className="text-xs text-gray-500">총 지원자</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
                <p className="text-xs text-gray-500">조회수</p>
              </div>
            </div>
          </div>
        </div>

        {/* 새 공고 등록 CTA */}
        <Link
          href="/agent/jobs/new"
          className="flex items-center gap-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl p-5 mb-6 hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg group"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <PenSquare className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">새 구인공고 등록</p>
            <p className="text-sm text-white/80">우수한 인재를 채용하세요</p>
          </div>
          <ChevronRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* 내 공고 목록 */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">내 공고 목록</h3>
            <span className="text-sm text-gray-500">{jobs.length}개</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">공고를 불러오는 중...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">등록된 공고가 없습니다</p>
              <Link
                href="/agent/jobs/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                첫 공고 등록하기
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {jobs.map((job) => {
                const status = getJobStatus(job);
                const statusConfig = STATUS_CONFIG[status];
                const tierStyle = TIER_STYLES[job.tier || 'normal'];
                const TierIcon = tierStyle.icon;
                const StatusIcon = statusConfig.icon;
                const applicationCount = applicationCounts[job.id] || 0;
                const daysRemaining = getDaysRemaining(job.deadline);

                return (
                  <div
                    key={job.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${tierStyle.bg}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* 회사 아이콘 */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        job.tier === 'vip' ? 'bg-gradient-to-br from-amber-400 to-yellow-500' :
                        job.tier === 'premium' ? 'bg-blue-600' : 'bg-gray-100'
                      }`}>
                        <TierIcon className={`w-6 h-6 ${
                          job.tier === 'normal' ? 'text-gray-500' : 'text-white'
                        }`} />
                      </div>

                      {/* 공고 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${tierStyle.badge}`}>
                            {tierStyle.label}
                          </span>
                          {job.property_category && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                              job.property_category === 'residential'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {job.property_category === 'residential' ? '🏠 주거용' : '🏢 상업용'}
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 truncate">{job.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {job.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.region}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(job.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {job.views || 0}회
                          </span>
                          {daysRemaining !== null && (
                            <span className={`flex items-center gap-1 ${
                              daysRemaining <= 3 ? 'text-red-500' : 'text-gray-400'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {daysRemaining > 0 ? `D-${daysRemaining}` : '마감'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 지원자 수 & 관리 버튼 */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/agent/employer/jobs/${job.id}/applicants`}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Users className="w-4 h-4" />
                            <span className="font-bold">{applicationCount}</span>
                            <span className="text-sm hidden sm:inline">지원자</span>
                          </Link>

                          {/* 더보기 메뉴 */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openMenuId === job.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1">
                                  <Link
                                    href={`/agent/jobs/${job.id}`}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <Eye className="w-4 h-4" />
                                    공고 보기
                                  </Link>
                                  <Link
                                    href={`/agent/jobs/new?edit=${job.id}`}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <Edit3 className="w-4 h-4" />
                                    수정하기
                                  </Link>
                                  <button
                                    onClick={() => handleToggleActive(job.id, job.is_active)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full"
                                  >
                                    <Power className="w-4 h-4" />
                                    {job.is_active ? '비활성화' : '활성화'}
                                  </button>
                                  <div className="border-t border-gray-100 my-1" />
                                  <button
                                    onClick={() => { setDeleteConfirmId(job.id); setOpenMenuId(null); }}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    삭제하기
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 도움말 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">더 많은 지원자를 받으려면?</h4>
              <p className="text-sm text-blue-700 mt-1">
                VIP 또는 프리미엄 등급으로 업그레이드하면 상위 노출되어 더 많은 지원자를 받을 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 삭제 확인 모달 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">공고 삭제</h3>
                <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              공고를 삭제하면 해당 공고에 대한 모든 지원 내역도 함께 삭제됩니다. 정말 삭제하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteJob(deleteConfirmId)}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
