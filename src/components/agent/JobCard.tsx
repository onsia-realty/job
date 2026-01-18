'use client';

import Link from 'next/link';
import { Eye, MapPin, Clock, Flame, Sparkles, AlertCircle } from 'lucide-react';
import type { AgentJobListing, AgentJobType, AgentJobTier } from '@/types';

interface JobCardProps {
  job: AgentJobListing;
}

const TYPE_LABELS: Record<AgentJobType, string> = {
  apartment: '아파트',
  villa: '빌라',
  store: '상가',
  oneroom: '원룸',
  office: '오피스',
};

const TIER_STYLES: Record<AgentJobTier, { container: string; badge: string }> = {
  premium: {
    container: 'border-2 border-blue-500 bg-blue-50/50',
    badge: 'bg-blue-600 text-white',
  },
  normal: {
    container: 'border border-gray-200 bg-white',
    badge: '',
  },
};

const BADGE_CONFIG = {
  new: { label: '신규', icon: Sparkles, color: 'bg-green-500 text-white' },
  hot: { label: 'HOT', icon: Flame, color: 'bg-red-500 text-white' },
  urgent: { label: '급구', icon: AlertCircle, color: 'bg-orange-500 text-white' },
};

const SALARY_LABELS = {
  monthly: '월급',
  commission: '수수료',
  mixed: '기본급+수수료',
};

export default function AgentJobCard({ job }: JobCardProps) {
  const styles = TIER_STYLES[job.tier];

  return (
    <Link href={`/agent/jobs/${job.id}`}>
      <div className={`rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${styles.container}`}>
        <div className="p-4">
          {/* 상단 - 유형 + 배지 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                {TYPE_LABELS[job.type]}
              </span>
              {job.tier === 'premium' && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${styles.badge}`}>
                  PREMIUM
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {job.badges.map((badge) => {
                const config = BADGE_CONFIG[badge];
                const Icon = config.icon;
                return (
                  <span
                    key={badge}
                    className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${config.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* 제목 */}
          <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
            {job.title}
          </h3>

          {/* 회사명 */}
          <p className="text-sm text-gray-600 mb-2">
            {job.company}
          </p>

          {/* 지역 */}
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            {job.region}
            {job.address && <span className="ml-1 text-gray-400">· {job.address}</span>}
          </div>

          {/* 급여 정보 */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {SALARY_LABELS[job.salary.type]}
              </span>
              <span className="text-blue-600 font-bold">
                {job.salary.amount || '협의'}
              </span>
            </div>
          </div>

          {/* 경력 요건 */}
          <div className="text-xs text-gray-500 mb-3">
            경력: {job.experience}
          </div>

          {/* 하단 정보 */}
          <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
            <span className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {job.views.toLocaleString()}
            </span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {job.createdAt}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
