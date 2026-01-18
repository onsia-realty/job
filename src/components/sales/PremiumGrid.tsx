'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Building2, Eye, MapPin } from 'lucide-react';
import type { SalesJobListing } from '@/types';
import { SALES_JOB_TYPE_LABELS, POSITION_LABELS } from '@/types';

interface PremiumGridProps {
  jobs: SalesJobListing[];
  tier: 'unique' | 'superior' | 'premium';
}

// 티어별 스타일
const TIER_STYLES = {
  unique: {
    badge: 'bg-gradient-to-r from-purple-600 to-purple-500',
    border: 'border-purple-200 hover:border-purple-400',
    accent: 'text-purple-600',
    overlay: 'from-purple-900/80 to-purple-600/60',
  },
  superior: {
    badge: 'bg-gradient-to-r from-blue-600 to-blue-500',
    border: 'border-blue-200 hover:border-blue-400',
    accent: 'text-blue-600',
    overlay: 'from-blue-900/80 to-blue-600/60',
  },
  premium: {
    badge: 'bg-gradient-to-r from-cyan-500 to-cyan-400',
    border: 'border-cyan-200 hover:border-cyan-400',
    accent: 'text-cyan-600',
    overlay: 'from-cyan-900/80 to-cyan-600/60',
  },
};

// 배지 스타일
const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: 'bg-green-500', text: 'text-white' },
  hot: { bg: 'bg-red-500', text: 'text-white' },
  jackpot: { bg: 'bg-yellow-500', text: 'text-black' },
  popular: { bg: 'bg-purple-500', text: 'text-white' },
};

export default function PremiumGrid({ jobs, tier }: PremiumGridProps) {
  const styles = TIER_STYLES[tier];
  const tierLabel = tier === 'unique' ? '유니크' : tier === 'superior' ? '슈페리어' : '프리미엄';

  if (jobs.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {jobs.map((job) => (
        <Link
          key={job.id}
          href={`/sales/jobs/${job.id}`}
          className={`bg-white rounded-xl overflow-hidden border ${styles.border} shadow-sm transition-all hover:shadow-md`}
        >
          {/* 썸네일 영역 */}
          <div className="relative aspect-[4/3] overflow-hidden">
            {job.thumbnail ? (
              <Image
                src={job.thumbnail}
                alt={job.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${styles.overlay} flex items-center justify-center`}>
                <Building2 className="w-12 h-12 text-white/40" />
              </div>
            )}

            {/* 오버레이 그라디언트 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {/* 티어 배지 */}
            <div className="absolute top-2 left-2">
              <span className={`${styles.badge} text-white text-[10px] font-bold px-2 py-0.5 rounded`}>
                {tierLabel}
              </span>
            </div>

            {/* 상태 배지들 */}
            {job.badges.length > 0 && (
              <div className="absolute top-2 right-2 flex gap-1">
                {job.badges.map((badge) => (
                  <span
                    key={badge}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${BADGE_COLORS[badge]?.bg} ${BADGE_COLORS[badge]?.text}`}
                  >
                    {badge === 'new' ? 'NEW' : badge === 'hot' ? 'HOT' : badge === 'jackpot' ? '대박' : '인기'}
                  </span>
                ))}
              </div>
            )}

            {/* 하단 정보 (썸네일 위) */}
            <div className="absolute bottom-2 left-2 right-2">
              <div className="flex items-center gap-1 text-white text-[10px]">
                <MapPin className="w-3 h-3" />
                <span>{job.region}</span>
                <span className="mx-1">|</span>
                <span>{SALES_JOB_TYPE_LABELS[job.type]}</span>
              </div>
            </div>
          </div>

          {/* 정보 영역 */}
          <div className="p-3">
            {/* 타이틀 */}
            <h3 className="font-bold text-sm text-gray-900 line-clamp-1 mb-1">
              {job.title}
            </h3>

            {/* 설명 */}
            <p className="text-xs text-gray-500 line-clamp-1 mb-2">
              {job.description}
            </p>

            {/* 태그들 */}
            <div className="flex flex-wrap gap-1 mb-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${styles.accent} bg-gray-100`}>
                {POSITION_LABELS[job.position]}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                {job.salary.type === 'commission' ? '수수료' : job.salary.type === 'base_incentive' ? '기본급+인센' : '일급'}
              </span>
              {job.benefits.slice(0, 1).map((benefit) => (
                <span key={benefit} className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                  {benefit}
                </span>
              ))}
            </div>

            {/* 하단: 회사명 + 조회수 */}
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span className="truncate">{job.company}</span>
              <div className="flex items-center gap-0.5">
                <Eye className="w-3 h-3" />
                <span>{job.views.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
