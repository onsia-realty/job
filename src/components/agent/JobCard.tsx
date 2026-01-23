'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  MapPin,
  Clock,
  Flame,
  Sparkles,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Users,
  Building2,
  Calendar,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import type { AgentJobListing, AgentJobType, AgentJobTier, AgentBenefit } from '@/types';
import { AGENT_BENEFIT_LABELS } from '@/types';

interface JobCardProps {
  job: AgentJobListing;
  variant?: 'card' | 'list';
  onBookmark?: (id: string) => void;
}

const TYPE_LABELS: Record<AgentJobType, string> = {
  apartment: '아파트',
  villa: '빌라',
  store: '상가',
  oneroom: '원룸',
  office: '오피스',
};

const TYPE_COLORS: Record<AgentJobType, string> = {
  apartment: 'bg-blue-100 text-blue-700',
  villa: 'bg-green-100 text-green-700',
  store: 'bg-purple-100 text-purple-700',
  oneroom: 'bg-orange-100 text-orange-700',
  office: 'bg-cyan-100 text-cyan-700',
};

const TIER_STYLES: Record<AgentJobTier, { container: string; badge: string; glow: string }> = {
  premium: {
    container: 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white',
    badge: 'bg-gradient-to-r from-blue-600 to-blue-500 text-white',
    glow: 'shadow-blue-100',
  },
  normal: {
    container: 'border border-gray-200 bg-white',
    badge: '',
    glow: '',
  },
};

const BADGE_CONFIG = {
  new: { label: 'NEW', icon: Sparkles, color: 'bg-emerald-500 text-white' },
  hot: { label: 'HOT', icon: Flame, color: 'bg-red-500 text-white' },
  urgent: { label: '급구', icon: AlertCircle, color: 'bg-orange-500 text-white' },
};

const SALARY_LABELS = {
  monthly: '월급',
  commission: '수수료',
  mixed: '기본급+α',
};

// D-Day 계산 함수
function getDDay(deadline?: string, isAlwaysRecruiting?: boolean): { text: string; color: string; urgent: boolean } {
  if (isAlwaysRecruiting) {
    return { text: '상시채용', color: 'text-blue-600 bg-blue-50', urgent: false };
  }

  if (!deadline) {
    return { text: '채용중', color: 'text-gray-600 bg-gray-100', urgent: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: '마감', color: 'text-gray-400 bg-gray-100', urgent: false };
  }
  if (diffDays === 0) {
    return { text: 'D-DAY', color: 'text-red-600 bg-red-50', urgent: true };
  }
  if (diffDays <= 3) {
    return { text: `D-${diffDays}`, color: 'text-red-600 bg-red-50', urgent: true };
  }
  if (diffDays <= 7) {
    return { text: `D-${diffDays}`, color: 'text-orange-600 bg-orange-50', urgent: false };
  }
  return { text: `D-${diffDays}`, color: 'text-gray-600 bg-gray-100', urgent: false };
}

export default function AgentJobCard({ job, variant = 'card', onBookmark }: JobCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(job.isBookmarked || false);
  const styles = TIER_STYLES[job.tier];
  const dday = getDDay(job.deadline, job.isAlwaysRecruiting);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    onBookmark?.(job.id);
  };

  // 카드 뷰
  if (variant === 'card') {
    return (
      <Link href={`/agent/jobs/${job.id}`}>
        <div
          className={`rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${styles.container} ${styles.glow}`}
        >
          <div className="p-5">
            {/* 상단 - D-Day + 스크랩 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${dday.color}`}>
                  {dday.text}
                </span>
                {job.tier === 'premium' && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${styles.badge}`}>
                    PREMIUM
                  </span>
                )}
              </div>
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-full transition-colors ${
                  isBookmarked
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-5 h-5" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* 배지 */}
            {job.badges.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3">
                {job.badges.map((badge) => {
                  const config = BADGE_CONFIG[badge];
                  const Icon = config.icon;
                  return (
                    <span
                      key={badge}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}
                    >
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* 회사명 */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {job.companyLogo ? (
                  <img src={job.companyLogo} alt="" className="w-6 h-6 object-contain" />
                ) : (
                  <Building2 className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <span className="text-sm text-gray-600 truncate">{job.company}</span>
            </div>

            {/* 제목 */}
            <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 leading-tight">
              {job.title}
            </h3>

            {/* 유형 태그 */}
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded mb-3 ${TYPE_COLORS[job.type]}`}>
              {TYPE_LABELS[job.type]}
            </span>

            {/* 급여 정보 */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {SALARY_LABELS[job.salary.type]}
                </span>
                <span className="text-blue-600 font-bold text-lg">
                  {job.salary.amount || '협의'}
                </span>
              </div>
            </div>

            {/* 조건 정보 */}
            <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.region}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {job.experience}
              </span>
            </div>

            {/* 복리후생 태그 */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {job.benefits.slice(0, 3).map((benefit) => (
                  <span
                    key={benefit}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                  >
                    {AGENT_BENEFIT_LABELS[benefit]}
                  </span>
                ))}
                {job.benefits.length > 3 && (
                  <span className="text-xs text-gray-400">+{job.benefits.length - 3}</span>
                )}
              </div>
            )}

            {/* 하단 정보 */}
            <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {job.views.toLocaleString()}
                </span>
                {job.applicants !== undefined && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    지원 {job.applicants}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {job.createdAt}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // 리스트 뷰
  return (
    <Link href={`/agent/jobs/${job.id}`}>
      <div
        className={`rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:bg-gray-50 ${styles.container}`}
      >
        <div className="p-4 flex gap-4">
          {/* 회사 로고 */}
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            {job.companyLogo ? (
              <img src={job.companyLogo} alt="" className="w-12 h-12 object-contain" />
            ) : (
              <Building2 className="w-8 h-8 text-gray-400" />
            )}
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1 min-w-0">
            {/* 상단 - 배지 + D-Day */}
            <div className="flex items-center gap-2 mb-1">
              {job.tier === 'premium' && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${styles.badge}`}>
                  PREMIUM
                </span>
              )}
              {job.badges.map((badge) => {
                const config = BADGE_CONFIG[badge];
                return (
                  <span
                    key={badge}
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${config.color}`}
                  >
                    {config.label}
                  </span>
                );
              })}
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${dday.color}`}>
                {dday.text}
              </span>
            </div>

            {/* 회사명 */}
            <p className="text-sm text-gray-500 mb-0.5">{job.company}</p>

            {/* 제목 */}
            <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{job.title}</h3>

            {/* 조건 */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className={`text-xs px-1.5 py-0.5 rounded ${TYPE_COLORS[job.type]}`}>
                {TYPE_LABELS[job.type]}
              </span>
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {job.region}
              </span>
              <span>·</span>
              <span>{job.experience}</span>
              <span>·</span>
              <span className="text-blue-600 font-medium">{job.salary.amount || '급여협의'}</span>
            </div>

            {/* 복리후생 */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="flex gap-1 mt-2">
                {job.benefits.slice(0, 4).map((benefit) => (
                  <span
                    key={benefit}
                    className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"
                  >
                    {AGENT_BENEFIT_LABELS[benefit]}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 우측 액션 */}
          <div className="flex flex-col items-end justify-between">
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-full transition-colors ${
                isBookmarked
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-5 h-5" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-0.5">
                <Eye className="w-3 h-3" />
                {job.views.toLocaleString()}
              </span>
              {job.applicants !== undefined && (
                <span className="flex items-center gap-0.5">
                  <Users className="w-3 h-3" />
                  {job.applicants}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
