'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Building2, Eye, MapPin } from 'lucide-react';
import type { SalesJobListing, SalesJobType, SalesJobTier, SalesJobBadge, SalesPosition, SalaryType } from '@/types';

interface JobCardProps {
  job: SalesJobListing;
  variant?: 'default' | 'compact' | 'card';
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

const TIER_STYLES: Record<SalesJobTier, { border: string; labelBg: string; labelText: string; accent: string }> = {
  unique: {
    border: 'border-l-4 border-l-purple-600',
    labelBg: 'bg-purple-600',
    labelText: 'text-white',
    accent: 'text-purple-600',
  },
  superior: {
    border: 'border-l-4 border-l-blue-600',
    labelBg: 'bg-blue-600',
    labelText: 'text-white',
    accent: 'text-blue-600',
  },
  premium: {
    border: 'border-l-4 border-l-cyan-500',
    labelBg: 'bg-cyan-500',
    labelText: 'text-white',
    accent: 'text-cyan-600',
  },
  normal: {
    border: 'border-l-4 border-l-gray-300',
    labelBg: 'bg-gray-200',
    labelText: 'text-gray-700',
    accent: 'text-gray-600',
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

const EXPERIENCE_LABELS: Record<string, string> = {
  none: '경력무관',
  '1month': '1개월이상',
  '3month': '3개월이상',
  '6month': '6개월이상',
  '12month': '12개월이상',
};

const PLACEHOLDER_THUMBNAILS = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=250&fit=crop',
];

export default function JobCard({ job, variant = 'default' }: JobCardProps) {
  const styles = TIER_STYLES[job.tier];
  const thumbnailUrl = job.thumbnail || PLACEHOLDER_THUMBNAILS[parseInt(job.id) % PLACEHOLDER_THUMBNAILS.length];
  const expLabel = EXPERIENCE_LABELS[job.experience] || job.experience;

  // ── PC 그리드용 카드 (분양라인 스타일 - 썸네일 상단 + 조건 태그) ──
  if (variant === 'card') {
    return (
      <Link href={`/sales/jobs/${job.id}`}>
        <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all cursor-pointer overflow-hidden group h-full">
          {/* 썸네일 */}
          <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={job.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                <Building2 className="w-16 h-16 text-gray-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* 배지 */}
            {job.badges.length > 0 && (
              <div className="absolute top-3 left-3 flex gap-1.5">
                {job.badges.map((badge) => (
                  <span
                    key={badge}
                    className={`text-xs px-2.5 py-1 rounded-md ${BADGE_STYLES[badge].bg} ${BADGE_STYLES[badge].text} font-bold shadow-sm`}
                  >
                    {BADGE_STYLES[badge].label}
                  </span>
                ))}
              </div>
            )}

            {/* 하단 유형/지역 */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded ${TYPE_COLORS[job.type]} text-white text-xs font-medium`}>
                {TYPE_LABELS[job.type]}
              </span>
              <span className="flex items-center gap-1 text-xs text-white/90">
                <MapPin className="w-3.5 h-3.5" />
                {job.region}
              </span>
            </div>
          </div>

          {/* 정보 영역 */}
          <div className="p-4">
            <h3 className="font-bold text-gray-900 text-[15px] leading-snug mb-1 line-clamp-2 group-hover:text-purple-600 transition-colors">
              {job.title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-1 mb-3">
              {job.description}
            </p>

            {/* 조건 태그 (분양라인 스타일) */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className={`text-xs px-2 py-1 rounded-md bg-gray-100 font-medium ${styles.accent}`}>
                {POSITION_LABELS[job.position]}
              </span>
              <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                {SALARY_LABELS[job.salary.type]}
              </span>
              {job.benefits.slice(0, 2).map((benefit) => (
                <span key={benefit} className="text-xs px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                  {benefit}
                </span>
              ))}
              <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-500">
                {expLabel}
              </span>
            </div>

            {/* 하단: 회사명 + 조회수 */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-600 font-medium truncate">{job.company}</span>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Eye className="w-3.5 h-3.5" />
                <span>{job.views.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // ── 컴팩트 카드 (베스트 현장 / 프리미엄 3열 그리드) ──
  if (variant === 'compact') {
    return (
      <Link href={`/sales/jobs/${job.id}`}>
        <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden group h-full">
          <div className="relative h-32 md:h-36 bg-gray-100 overflow-hidden">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={job.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-12 h-12 text-gray-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <span className={`text-[11px] px-1.5 py-0.5 rounded ${TYPE_COLORS[job.type]} text-white`}>
                {TYPE_LABELS[job.type]}
              </span>
              <span className="text-[11px] text-white/90">{job.region}</span>
            </div>
            {job.badges.length > 0 && (
              <div className="absolute top-2 left-2 flex gap-1">
                {job.badges.slice(0, 1).map((badge) => (
                  <span
                    key={badge}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${BADGE_STYLES[badge].bg} ${BADGE_STYLES[badge].text} font-bold`}
                  >
                    {BADGE_STYLES[badge].label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="p-3">
            <h4 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-purple-600 transition-colors">
              {job.title}
            </h4>
            <p className="text-xs text-gray-500 line-clamp-1 mb-2">{job.description}</p>
            <div className="flex flex-wrap gap-1 text-xs">
              <span className={`font-medium ${styles.accent}`}>{POSITION_LABELS[job.position]}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-600">{SALARY_LABELS[job.salary.type]}</span>
              {job.benefits.length > 0 && (
                <>
                  <span className="text-gray-400">·</span>
                  <span className="text-yellow-600">{job.benefits[0]}</span>
                </>
              )}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span className="truncate">{job.company}</span>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Eye className="w-3 h-3" />
                <span>{job.views.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // ── 기본 카드 (리스트형 - PC 가독성 강화) ──
  return (
    <Link href={`/sales/jobs/${job.id}`}>
      <div className={`bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all cursor-pointer ${styles.border} group`}>
        <div className="flex">
          {/* 썸네일 */}
          <div className="relative w-36 md:w-52 flex-shrink-0 bg-gray-100 overflow-hidden">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={job.title}
                fill
                className="object-cover rounded-l-lg group-hover:scale-105 transition-transform duration-300"
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
                    className={`text-xs px-2 py-0.5 rounded ${BADGE_STYLES[badge].bg} ${BADGE_STYLES[badge].text} font-bold`}
                  >
                    {BADGE_STYLES[badge].label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 정보 영역 */}
          <div className="flex-1 p-3 md:p-4 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLORS[job.type]} text-white font-medium`}>
                  {TYPE_LABELS[job.type]}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  {job.region}
                </span>
              </div>
              <h3 className="text-sm md:text-base font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-purple-600 transition-colors">
                {job.title}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 line-clamp-1">
                {job.description}
              </p>
            </div>

            {/* 조건 태그 (분양라인 스타일) */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className={`text-xs px-2 py-0.5 rounded-md bg-gray-100 font-medium ${styles.accent}`}>
                {POSITION_LABELS[job.position]}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                {SALARY_LABELS[job.salary.type]}
              </span>
              {job.benefits.slice(0, 2).map((benefit) => (
                <span key={benefit} className="text-xs px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-700">
                  {benefit}
                </span>
              ))}
              <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                {expLabel}
              </span>
              <span className="text-xs text-gray-400 ml-auto hidden md:inline">{job.company}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
