'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Briefcase, Building2, ChevronRight, Eye, Clock,
  CheckCircle2, XCircle, Phone, FileText, User, MapPin,
  Sparkles, TrendingUp, MessageSquare, Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/types';

const JOB_TYPE_LABELS: Record<string, string> = {
  apartment: '아파트', office: '오피스텔', commercial: '상가', villa: '빌라/주택',
  industrial: '지식산업센터', land: '토지', other: '기타',
};

const TIER_BADGES: Record<string, { label: string; className: string }> = {
  vip: { label: 'VIP', className: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white' },
  premium: { label: 'PREMIUM', className: 'bg-gradient-to-r from-violet-600 to-purple-500 text-white' },
  basic: { label: 'BASIC', className: 'bg-emerald-600 text-white' },
};

const STATUS_CONFIG: Record<ApplicationStatus, {
  icon: typeof Clock;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  description: string;
}> = {
  pending: {
    icon: Clock, label: '검토중',
    bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200',
    description: '담당자가 곧 이력서를 확인할 예정입니다',
  },
  viewed: {
    icon: Eye, label: '열람완료',
    bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200',
    description: '담당자가 이력서를 열람했습니다',
  },
  contacted: {
    icon: Phone, label: '연락완료',
    bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200',
    description: '담당자가 연락을 시도했습니다. 전화를 확인해주세요!',
  },
  rejected: {
    icon: XCircle, label: '불합격',
    bgColor: 'bg-gray-50', textColor: 'text-gray-500', borderColor: 'border-gray-200',
    description: '아쉽지만 이번 채용에서 불합격되었습니다',
  },
  hired: {
    icon: CheckCircle2, label: '채용확정',
    bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200',
    description: '축하합니다! 채용이 확정되었습니다',
  },
};

interface ApplicationWithJob {
  id: string;
  job_id: string;
  user_id: string;
  resume_id: string | null;
  message: string | null;
  status: ApplicationStatus;
  created_at: string;
  jobs: {
    id: string;
    title: string;
    company: string;
    region: string;
    tier: string;
    type: string;
    deadline: string | null;
  } | null;
}

export default function ApplicationsPage() {
  const { user, session } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadApplications() {
      if (!user?.id || !session?.access_token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/applications/my', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setApplications(data);
        }
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadApplications();
  }, [user?.id, session?.access_token]);

  const filteredApplications = filter === 'all'
    ? applications
    : applications.filter((app) => app.status === filter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  const getDeadlineInfo = (deadline: string | null) => {
    if (!deadline) return { text: '상시채용', color: 'text-blue-600', urgent: false };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dl = new Date(deadline); dl.setHours(0, 0, 0, 0);
    const diff = Math.ceil((dl.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return { text: '마감', color: 'text-gray-400', urgent: false };
    if (diff === 0) return { text: 'D-DAY', color: 'text-red-600', urgent: true };
    if (diff <= 3) return { text: `D-${diff}`, color: 'text-red-600', urgent: true };
    if (diff <= 7) return { text: `D-${diff}`, color: 'text-orange-500', urgent: false };
    return { text: `D-${diff}`, color: 'text-gray-500', urgent: false };
  };

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    viewed: applications.filter((a) => a.status === 'viewed').length,
    contacted: applications.filter((a) => a.status === 'contacted').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
    hired: applications.filter((a) => a.status === 'hired').length,
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center h-14">
              <Link href="/agent/mypage" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">마이페이지</span>
              </Link>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
            <p className="text-gray-500 mb-6">지원 내역을 확인하려면 로그인해주세요</p>
            <Link href="/agent/auth/login" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
              로그인하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-gray-50 pb-20 md:pb-0">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/agent/mypage" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">마이페이지</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* 타이틀 + 통계 요약 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">지원 내역</h1>

          {/* 통계 카드 */}
          {applications.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-xl p-3 border border-gray-100 text-center shadow-sm">
                <p className="text-2xl font-bold text-blue-600">{statusCounts.all}</p>
                <p className="text-xs text-gray-500 mt-0.5">전체 지원</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100 text-center shadow-sm">
                <p className="text-2xl font-bold text-amber-500">{statusCounts.pending + statusCounts.viewed}</p>
                <p className="text-xs text-gray-500 mt-0.5">진행중</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100 text-center shadow-sm">
                <p className="text-2xl font-bold text-green-600">{statusCounts.contacted}</p>
                <p className="text-xs text-gray-500 mt-0.5">연락받음</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100 text-center shadow-sm">
                <p className="text-2xl font-bold text-emerald-600">{statusCounts.hired}</p>
                <p className="text-xs text-gray-500 mt-0.5">채용확정</p>
              </div>
            </div>
          )}
        </div>

        {/* 상태별 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 mb-4 scrollbar-hide">
          {([
            { key: 'all' as const, label: '전체' },
            { key: 'pending' as const, label: '검토중' },
            { key: 'viewed' as const, label: '열람완료' },
            { key: 'contacted' as const, label: '연락완료' },
            { key: 'hired' as const, label: '채용' },
            { key: 'rejected' as const, label: '불합격' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label} {statusCounts[key] > 0 && <span className={`ml-1 ${filter === key ? 'text-blue-200' : 'text-gray-400'}`}>{statusCounts[key]}</span>}
            </button>
          ))}
        </div>

        {/* 지원 내역 목록 */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">지원 내역을 불러오는 중...</p>
          </div>
        ) : filteredApplications.length > 0 ? (
          <div className="space-y-3">
            {filteredApplications.map((application) => {
              const job = application.jobs;
              const deadline = job ? getDeadlineInfo(job.deadline) : null;
              const statusConfig = STATUS_CONFIG[application.status];
              const StatusIcon = statusConfig.icon;
              const tierBadge = job ? TIER_BADGES[job.tier] : null;

              return (
                <div
                  key={application.id}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${statusConfig.borderColor}`}
                >
                  {/* 상태 표시 상단 바 */}
                  <div className={`px-4 py-2.5 ${statusConfig.bgColor} border-b ${statusConfig.borderColor} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${statusConfig.textColor}`} />
                      <span className={`text-sm font-semibold ${statusConfig.textColor}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {deadline && (
                        <span className={`text-xs font-bold ${deadline.color} ${deadline.urgent ? 'animate-pulse' : ''}`}>
                          {deadline.text}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(application.created_at)}</span>
                    </div>
                  </div>

                  {/* 공고 정보 */}
                  <div className="p-4">
                    {job ? (
                      <Link href={`/agent/jobs/${job.id}`} className="block group">
                        <div className="flex gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-blue-200 group-hover:to-blue-100 transition-all">
                            <Building2 className="w-7 h-7 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm text-gray-500 font-medium">{job.company}</p>
                              {tierBadge && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${tierBadge.className}`}>
                                  {tierBadge.label}
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <MapPin className="w-3 h-3" />
                                {job.region}
                              </span>
                              <span className="text-xs text-gray-400">
                                {JOB_TYPE_LABELS[job.type] || job.type}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-4 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    ) : (
                      <div className="flex gap-4 opacity-50">
                        <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-7 h-7 text-gray-300" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-400 font-medium">삭제된 공고</p>
                          <p className="text-xs text-gray-300 mt-1">이 공고는 더 이상 존재하지 않습니다</p>
                        </div>
                      </div>
                    )}

                    {/* 지원 메시지 */}
                    {application.message && (
                      <div className="mt-3 flex gap-2 p-3 bg-gray-50 rounded-xl">
                        <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 line-clamp-2">{application.message}</p>
                      </div>
                    )}

                    {/* 상태별 안내 메시지 */}
                    {application.status !== 'pending' && (
                      <div className={`mt-3 px-3 py-2 rounded-xl ${statusConfig.bgColor}`}>
                        <p className={`text-xs font-medium ${statusConfig.textColor}`}>
                          {statusConfig.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {filter === 'all' ? '아직 지원한 공고가 없습니다' : '해당 상태의 지원 내역이 없습니다'}
            </h3>
            <p className="text-gray-500 mb-8">관심있는 공고에 지원해보세요!</p>
            <Link
              href="/agent/jobs"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium px-8 py-3.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all"
            >
              <Briefcase className="w-5 h-5" />
              채용공고 보러가기
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
