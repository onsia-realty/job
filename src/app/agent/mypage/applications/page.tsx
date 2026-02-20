'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  ChevronRight,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  AlertCircle,
  Trash2,
  FileText,
  User,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyApplications } from '@/lib/supabase';
import type { ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/types';

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
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    async function loadApplications() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await fetchMyApplications(user.id);
        setApplications(data);
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadApplications();
  }, [user?.id]);

  const filteredApplications = filter === 'all'
    ? applications
    : applications.filter((app) => app.status === filter);

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'viewed':
        return <Eye className="w-4 h-4" />;
      case 'contacted':
        return <Phone className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'hired':
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDeadlineText = (deadline: string | null) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return '마감';
    if (diff === 0) return '오늘 마감';
    if (diff <= 3) return `D-${diff}`;
    return null;
  };

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    viewed: applications.filter((a) => a.status === 'viewed').length,
    contacted: applications.filter((a) => a.status === 'contacted').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
    hired: applications.filter((a) => a.status === 'hired').length,
  };

  // 비로그인 상태
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center h-14">
              <Link href="/agent/mypage" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">마이페이지</span>
              </Link>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
            <p className="text-gray-500 mb-6">지원 내역을 확인하려면 로그인해주세요</p>
            <Link
              href="/agent/auth/login"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              로그인하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center h-14">
            <Link
              href="/agent/mypage"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">마이페이지</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">지원 내역</h1>

        {/* 상태별 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 mb-6">
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
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? key === 'all' ? 'bg-blue-600 text-white'
                  : key === 'pending' ? 'bg-yellow-500 text-white'
                  : key === 'viewed' ? 'bg-blue-500 text-white'
                  : key === 'contacted' ? 'bg-green-500 text-white'
                  : key === 'hired' ? 'bg-emerald-500 text-white'
                  : 'bg-red-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label} {statusCounts[key]}
            </button>
          ))}
        </div>

        {/* 지원 내역 목록 */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">지원 내역을 불러오는 중...</p>
          </div>
        ) : filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const job = application.jobs;
              const deadlineText = job ? getDeadlineText(job.deadline) : null;

              return (
                <div
                  key={application.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${APPLICATION_STATUS_COLORS[application.status]}`}>
                          {getStatusIcon(application.status)}
                          {APPLICATION_STATUS_LABELS[application.status]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(application.created_at)}
                        </span>
                        {deadlineText && (
                          <span className={`text-xs font-medium ${deadlineText === '마감' ? 'text-gray-400' : 'text-red-500'}`}>
                            {deadlineText}
                          </span>
                        )}
                      </div>
                    </div>

                    {job ? (
                      <Link href={`/agent/jobs/${job.id}`}>
                        <div className="flex gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-500">{job.company}</p>
                            <h3 className="font-medium text-gray-900 line-clamp-1">{job.title}</h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" />
                                {job.region}
                              </span>
                              <span>{job.type}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" />
                        </div>
                      </Link>
                    ) : (
                      <div className="flex gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-400">삭제된 공고</p>
                        </div>
                      </div>
                    )}

                    {application.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 line-clamp-2">{application.message}</p>
                      </div>
                    )}

                    {/* 상태별 안내 메시지 */}
                    {application.status === 'viewed' && (
                      <div className="mt-3 px-3 py-2 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600">담당자가 이력서를 열람했습니다</p>
                      </div>
                    )}
                    {application.status === 'contacted' && (
                      <div className="mt-3 px-3 py-2 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600">담당자가 연락을 시도했습니다. 전화를 확인해주세요!</p>
                      </div>
                    )}
                    {application.status === 'hired' && (
                      <div className="mt-3 px-3 py-2 bg-emerald-50 rounded-lg">
                        <p className="text-xs text-emerald-600 font-medium">축하합니다! 채용이 확정되었습니다</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? '아직 지원한 공고가 없습니다' : `${filter === 'pending' ? '검토중' : filter === 'viewed' ? '열람완료' : filter === 'contacted' ? '연락완료' : filter === 'hired' ? '채용' : '불합격'} 상태인 지원 내역이 없습니다`}
            </h3>
            <p className="text-gray-500 mb-6">
              관심있는 공고에 지원해보세요!
            </p>
            <Link
              href="/agent/jobs"
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
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
