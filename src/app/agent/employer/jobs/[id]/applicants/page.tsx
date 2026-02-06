'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Briefcase,
  Clock,
  CheckCircle2,
  MessageSquare,
  Eye,
  ChevronRight,
  Filter,
  Search,
  Building2,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchJobById, fetchApplicationsForJob, updateApplicationStatus, fetchResumeById } from '@/lib/supabase';
import type { AgentResume } from '@/types';

interface Application {
  id: string;
  job_id: string;
  user_id: string;
  resume_id: string;
  message: string | null;
  status: 'pending' | 'viewed' | 'contacted' | 'rejected' | 'hired';
  created_at: string;
  resumes: {
    id: string;
    name: string;
    phone: string;
    email: string;
    photo: string | null;
    total_experience: string;
    preferred_regions: string[];
    preferred_types: string[];
    license_number: string | null;
  } | null;
}

const STATUS_CONFIG = {
  pending: {
    label: '신규',
    color: 'bg-blue-100 text-blue-700',
    nextAction: 'viewed',
    nextLabel: '열람완료',
  },
  viewed: {
    label: '열람완료',
    color: 'bg-gray-100 text-gray-600',
    nextAction: 'contacted',
    nextLabel: '연락함',
  },
  contacted: {
    label: '연락함',
    color: 'bg-amber-100 text-amber-700',
    nextAction: 'hired',
    nextLabel: '채용',
  },
  rejected: {
    label: '불합격',
    color: 'bg-red-100 text-red-700',
    nextAction: null,
    nextLabel: null,
  },
  hired: {
    label: '채용',
    color: 'bg-green-100 text-green-700',
    nextAction: null,
    nextLabel: null,
  },
};

const EXPERIENCE_LABELS: Record<string, string> = {
  'none': '신입',
  '6month': '6개월',
  '1year': '1년',
  '2year': '2년',
  '3year': '3년',
  '5year': '5년 이상',
};

export default function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState<AgentResume | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user?.id || !resolvedParams.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch job details
        const jobData = await fetchJobById(resolvedParams.id);
        setJob(jobData);

        // Fetch applications
        const apps = await fetchApplicationsForJob(resolvedParams.id);
        setApplications(apps);
      } catch (error) {
        console.error('Error loading applicants:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user?.id, resolvedParams.id]);

  const handleStatusChange = async (applicationId: string, newStatus: Application['status']) => {
    setUpdatingId(applicationId);
    try {
      const success = await updateApplicationStatus(applicationId, newStatus);
      if (success) {
        setApplications(apps =>
          apps.map(app =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewResume = async (resumeId: string) => {
    try {
      const resume = await fetchResumeById(resumeId);
      if (resume) {
        setSelectedResume(resume);
        setShowResumeModal(true);
      }
    } catch (error) {
      console.error('Error loading resume:', error);
    }
  };

  const filteredApplications = statusFilter === 'all'
    ? applications
    : applications.filter(app => app.status === statusFilter);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
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
              href="/agent/employer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-gray-900">지원자 관리</h1>
            <div className="w-5" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 공고 정보 */}
        {job && (
          <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-gray-900">{job.title}</h2>
                <p className="text-sm text-gray-500">{job.company} · {job.region}</p>
              </div>
              <Link
                href={`/agent/jobs/${resolvedParams.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                공고 보기
              </Link>
            </div>
          </div>
        )}

        {/* 필터 & 통계 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">전체 {applications.length}명</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-blue-600">
              신규 {applications.filter(a => a.status === 'pending').length}명
            </span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 상태</option>
            <option value="pending">신규</option>
            <option value="viewed">열람완료</option>
            <option value="contacted">연락함</option>
            <option value="hired">채용</option>
            <option value="rejected">불합격</option>
          </select>
        </div>

        {/* 지원자 목록 */}
        {isLoading ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">지원자를 불러오는 중...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {statusFilter === 'all' ? '아직 지원자가 없습니다' : '해당 상태의 지원자가 없습니다'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const resume = application.resumes;
              const statusConfig = STATUS_CONFIG[application.status];

              return (
                <div
                  key={application.id}
                  className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* 프로필 사진 */}
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {resume?.photo ? (
                        <img src={resume.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-7 h-7 text-gray-400" />
                      )}
                    </div>

                    {/* 지원자 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{resume?.name || '이름 없음'}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        {resume?.total_experience && (
                          <span className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            {EXPERIENCE_LABELS[resume.total_experience] || resume.total_experience}
                          </span>
                        )}
                        {resume?.preferred_regions && resume.preferred_regions.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {resume.preferred_regions.slice(0, 2).join(', ')}
                          </span>
                        )}
                        {resume?.license_number && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            자격증 보유
                          </span>
                        )}
                      </div>

                      {application.message && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                          <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                          {application.message}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(application.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleViewResume(application.resume_id)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        이력서
                      </button>

                      {resume?.phone && (
                        <a
                          href={`tel:${resume.phone}`}
                          className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          연락
                        </a>
                      )}

                      {statusConfig.nextAction && (
                        <button
                          onClick={() => handleStatusChange(application.id, statusConfig.nextAction as Application['status'])}
                          disabled={updatingId === application.id}
                          className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          {updatingId === application.id ? '처리중...' : statusConfig.nextLabel}
                        </button>
                      )}

                      {application.status !== 'rejected' && application.status !== 'hired' && (
                        <button
                          onClick={() => handleStatusChange(application.id, 'rejected')}
                          disabled={updatingId === application.id}
                          className="px-3 py-2 text-red-500 text-sm hover:bg-red-50 rounded-lg transition-colors"
                        >
                          불합격
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 이력서 모달 */}
      {showResumeModal && selectedResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">이력서</h2>
              <button
                onClick={() => setShowResumeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* 기본 정보 */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                  {selectedResume.photo ? (
                    <img src={selectedResume.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedResume.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {selectedResume.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {selectedResume.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* 자격증 */}
              {selectedResume.licenseNumber && (
                <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700">공인중개사 자격증 보유</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    자격번호: {selectedResume.licenseNumber} ({selectedResume.licenseDate})
                  </p>
                </div>
              )}

              {/* 경력 */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-3">경력</h4>
                <p className="text-gray-600">
                  총 경력: {EXPERIENCE_LABELS[selectedResume.totalExperience || 'none']}
                </p>
                {selectedResume.careers && selectedResume.careers.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedResume.careers.map((career, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">{career.company}</p>
                        <p className="text-sm text-gray-500">
                          {career.position || career.type} · {career.startDate} ~ {career.isCurrent ? '현재' : career.endDate}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 희망 조건 */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-3">희망 조건</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedResume.preferredRegions?.map((region, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {region}
                    </span>
                  ))}
                  {selectedResume.preferredTypes?.map((type, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* 자기소개 */}
              {selectedResume.introduction && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3">자기소개</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedResume.introduction}</p>
                </div>
              )}

              {/* 강점 */}
              {selectedResume.strengths && selectedResume.strengths.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">강점</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedResume.strengths.map((strength, index) => (
                      <span key={index} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <a
                href={`tel:${selectedResume.phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                <Phone className="w-5 h-5" />
                전화하기
              </a>
              <a
                href={`mailto:${selectedResume.email}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                <Mail className="w-5 h-5" />
                이메일
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
