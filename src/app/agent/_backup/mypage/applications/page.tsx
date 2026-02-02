'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Building2,
  MapPin,
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
} from 'lucide-react';
import type { QuickApplication, ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/types';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<QuickApplication[]>([]);
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    // localStorage에서 지원 내역 불러오기
    const savedApplications = JSON.parse(localStorage.getItem('agent_applications') || '[]');
    // 최신순 정렬
    savedApplications.sort((a: QuickApplication, b: QuickApplication) =>
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );
    setApplications(savedApplications);
  }, []);

  const filteredApplications = filter === 'all'
    ? applications
    : applications.filter((app) => app.status === filter);

  const handleDelete = (id: string) => {
    const newApplications = applications.filter((app) => app.id !== id);
    setApplications(newApplications);
    localStorage.setItem('agent_applications', JSON.stringify(newApplications));
    setShowDeleteConfirm(null);
  };

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

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    viewed: applications.filter((a) => a.status === 'viewed').length,
    contacted: applications.filter((a) => a.status === 'contacted').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
    hired: applications.filter((a) => a.status === 'hired').length,
  };

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
          <button
            onClick={() => setFilter('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            전체 {statusCounts.all}
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            검토중 {statusCounts.pending}
          </button>
          <button
            onClick={() => setFilter('viewed')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'viewed'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            열람완료 {statusCounts.viewed}
          </button>
          <button
            onClick={() => setFilter('contacted')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'contacted'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            연락완료 {statusCounts.contacted}
          </button>
        </div>

        {/* 지원 내역 목록 */}
        {filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
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
                        {formatDate(application.appliedAt)}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm(application.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Link href={`/agent/jobs/${application.jobId}`}>
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500">{application.company}</p>
                        <h3 className="font-medium text-gray-900 line-clamp-1">{application.jobTitle}</h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </Link>

                  {/* 지원 정보 */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {application.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {application.phone}
                    </span>
                    {application.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {application.email}
                      </span>
                    )}
                  </div>

                  {application.message && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 line-clamp-2">{application.message}</p>
                    </div>
                  )}
                </div>

                {/* 삭제 확인 */}
                {showDeleteConfirm === application.id && (
                  <div className="p-4 bg-red-50 border-t border-red-100">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <p className="text-sm text-red-700">이 지원 내역을 삭제하시겠습니까?</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="flex-1 py-2 bg-white text-gray-700 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleDelete(application.id)}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? '아직 지원한 공고가 없습니다' : `${APPLICATION_STATUS_LABELS[filter]} 상태인 지원 내역이 없습니다`}
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
