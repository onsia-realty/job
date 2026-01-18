'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Building2 } from 'lucide-react';
import type { SalesJobListing, SalesJobType, SalesJobTier, SalesJobBadge, SalesPosition, SalaryType } from '@/types';

interface JobCardProps {
  job: SalesJobListing;
  variant?: 'default' | 'compact';
}

const TYPE_LABELS: Record<SalesJobType, string> = {
  apartment: '아파트',
  officetel: '오피스텔',
  store: '상가/쇼핑몰',
  industrial: '지식산업센터',
};

const TYPE_COLORS: Record<SalesJobType, string> = {
  apartment: 'bg-blue-500',
  officetel: 'bg-purple-500',
  store: 'bg-orange-500',
  industrial: 'bg-green-500',
};

const TIER_STYLES: Record<SalesJobTier, { border: string; labelBg: string; labelText: string }> = {
  unique: {
    border: 'border-l-4 border-l-purple-600',
    labelBg: 'bg-purple-600',
    labelText: 'text-white',
  },
  superior: {
    border: 'border-l-4 border-l-blue-600',
    labelBg: 'bg-blue-600',
    labelText: 'text-white',
  },
  premium: {
    border: 'border-l-4 border-l-cyan-500',
    labelBg: 'bg-cyan-500',
    labelText: 'text-white',
  },
  normal: {
    border: 'border-l-4 border-l-gray-300',
    labelBg: 'bg-gray-200',
    labelText: 'text-gray-700',
  },
};

const BADGE_STYLES: Record<SalesJobBadge, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-green-500', text: 'text-white', label: '신규' },
  hot: { bg: 'bg-red-500', text: 'text-white', label: 'HOT' },
  jackpot: { bg: 'bg-yellow-500', text: 'text-white', label: '대박' },
  popular: { bg: 'bg-orange-500', text: 'text-white', label: '인기현장' },
};

const POSITION_LABELS: Record<SalesPosition, string> = {
  headTeam: '본부/팀장',
  teamLead: '팀장/팀원',
  member: '팀원',
};

const SALARY_LABELS: Record<SalaryType, string> = {
  commission: '계약 수수료',
  base_incentive: '기본급 +인센',
  daily: '일급',
};

// 임시 썸네일 이미지 URL (실제로는 DB에서 가져옴)
const PLACEHOLDER_THUMBNAILS = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=200&fit=crop',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300&h=200&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=200&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=300&h=200&fit=crop',
];

export default function JobCard({ job, variant = 'default' }: JobCardProps) {
  const styles = TIER_STYLES[job.tier];
  const thumbnailUrl = job.thumbnail || PLACEHOLDER_THUMBNAILS[parseInt(job.id) % PLACEHOLDER_THUMBNAILS.length];

  if (variant === 'compact') {
    // 베스트 현장용 컴팩트 카드
    return (
      <Link href={`/sales/jobs/${job.id}`}>
        <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
          <div className="relative h-32 bg-gray-100">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={job.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-12 h-12 text-gray-300" />
              </div>
            )}
          </div>
          <div className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <span className={`text-xs px-1.5 py-0.5 rounded ${TYPE_COLORS[job.type]} text-white`}>
                {TYPE_LABELS[job.type]}
              </span>
            </div>
            <h4 className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">{job.title}</h4>
            <p className="text-xs text-gray-500 line-clamp-1 mb-2">{job.description}</p>
            <div className="flex flex-wrap gap-1 text-xs text-gray-600">
              <span>{POSITION_LABELS[job.position]}</span>
              <span>·</span>
              <span>{SALARY_LABELS[job.salary.type]}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">{job.company}</div>
          </div>
        </div>
      </Link>
    );
  }

  // 기본 카드 (분양라인 스타일)
  return (
    <Link href={`/sales/jobs/${job.id}`}>
      <div className={`bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all cursor-pointer ${styles.border}`}>
        <div className="flex">
          {/* 썸네일 */}
          <div className="relative w-32 h-32 md:w-40 md:h-32 flex-shrink-0 bg-gray-100">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={job.title}
                fill
                className="object-cover rounded-l-lg"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center rounded-l-lg">
                <Building2 className="w-12 h-12 text-gray-300" />
              </div>
            )}
            {/* 배지 */}
            {job.badges.length > 0 && (
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {job.badges.map((badge) => (
                  <span
                    key={badge}
                    className={`text-xs px-2 py-0.5 rounded ${BADGE_STYLES[badge].bg} ${BADGE_STYLES[badge].text} font-medium`}
                  >
                    {BADGE_STYLES[badge].label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 정보 영역 */}
          <div className="flex-1 p-3 md:p-4 flex flex-col justify-between min-w-0">
            {/* 상단: 유형 + 제목 */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLORS[job.type]} text-white font-medium`}>
                  {TYPE_LABELS[job.type]}
                </span>
                {job.region && (
                  <span className="text-xs text-gray-400">{job.region}</span>
                )}
              </div>
              <h3 className="text-sm md:text-base font-bold text-gray-900 line-clamp-1 mb-0.5">
                {job.title}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 line-clamp-1">
                {job.description}
              </p>
            </div>

            {/* 하단: 모집 정보 */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className="text-gray-700 font-medium">{POSITION_LABELS[job.position]}</span>
              <span className="text-gray-700">{SALARY_LABELS[job.salary.type]}</span>
              {job.benefits.length > 0 && (
                <span className="text-green-600">{job.benefits.slice(0, 2).join(' ')}</span>
              )}
              <span className="text-gray-500">{job.experience}</span>
              <span className="text-gray-400">{job.company}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
