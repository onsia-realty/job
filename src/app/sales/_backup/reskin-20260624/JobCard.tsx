'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Building2, Eye, Bookmark } from 'lucide-react';
import type { SalesJobListing, SalesJobType, SalesJobTier, SalesJobBadge, SalesPosition, SalaryType } from '@/types';
import Badge from '@/components/sales/ui/Badge';
import CommissionChips from '@/components/sales/ui/CommissionChips';
import type { CommissionItem } from '@/components/sales/ui/CommissionChips';

interface JobCardProps {
  job: SalesJobListing;
  variant?: 'default' | 'compact' | 'card';
}

const TYPE_COLORS: Record<SalesJobType, string> = {
  apartment: 'bg-blue-500',
  officetel: 'bg-purple-500',
  store: 'bg-orange-500',
  industrial: 'bg-green-500',
};

const TIER_STYLES: Record<SalesJobTier, { border: string; accent: string }> = {
  unique: {
    border: 'border-l-4 border-l-violet-600',
    accent: 'text-violet-600',
  },
  superior: {
    border: 'border-l-4 border-l-blue-600',
    accent: 'text-blue-600',
  },
  premium: {
    border: 'border-l-4 border-l-cyan-500',
    accent: 'text-cyan-600',
  },
  normal: {
    border: 'border-l-4 border-l-gray-300',
    accent: 'text-gray-600',
  },
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

// 썸네일 없을 때 쓰는 현장 톤 그라데이션 (원격 이미지 의존 X)
const PLACEHOLDER_GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-blue-500 to-cyan-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
  'from-cyan-500 to-teal-600',
];

function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % 997;
  return PLACEHOLDER_GRADIENTS[h % PLACEHOLDER_GRADIENTS.length];
}

export default function JobCard({ job, variant = 'default' }: JobCardProps) {
  const styles = TIER_STYLES[job.tier];
  const thumbnailUrl = job.thumbnail || null;
  const phGradient = gradientFor(job.id);
  const expLabel = EXPERIENCE_LABELS[job.experience] || job.experience;

  // CommissionChips: position + salary.amount로 단일 chip 생성
  const commissionItems: CommissionItem[] = [{ position: job.position, amount: job.salary.amount }];

  // ── PC 그리드용 카드 (썸네일 상단 + Badge + CommissionChips) ──
  if (variant === 'card') {
    return (
      <Link href={`/sales/jobs/${job.id}`}>
        <div className="bg-white rounded-2xl border border-sales-border hover:shadow-lg transition-all cursor-pointer overflow-hidden group h-full">
          {/* 썸네일 */}
          <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={job.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${phGradient}`}>
                <Building2 className="w-14 h-14 text-white/70" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* 상단 좌: 상태 배지 */}
            {job.badges.length > 0 && (
              <div className="absolute top-3 left-3 flex gap-1.5">
                {job.badges.map((badge) => (
                  <Badge key={badge} variant="badge" value={badge as SalesJobBadge} size="sm" />
                ))}
              </div>
            )}

            {/* 상단 우: 북마크 */}
            <button
              type="button"
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              onClick={(e) => e.preventDefault()}
              aria-label="북마크"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>

            {/* 하단: 유형 Badge + 지역 */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <Badge variant="type" value={job.type} size="sm" />
              <span className="text-xs text-white/90 flex items-center gap-1">
                {job.region}
              </span>
            </div>
          </div>

          {/* 정보 영역 */}
          <div className="p-4">
            <h3 className="font-bold text-sales-text text-[15px] leading-snug mb-1 line-clamp-2 group-hover:text-violet-600 transition-colors">
              {job.title}
            </h3>
            <p className="text-sm text-sales-text-mute line-clamp-1 mb-3">
              {job.description}
            </p>

            {/* CommissionChips */}
            <div className="mb-3">
              <CommissionChips items={commissionItems} dense />
            </div>

            {/* 조건 태그 */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-xs px-2 py-1 rounded-lg bg-sales-bg text-sales-text-mute font-medium">
                {SALARY_LABELS[job.salary.type]}
              </span>
              {job.benefits.slice(0, 2).map((benefit) => (
                <span key={benefit} className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 font-medium">
                  {benefit}
                </span>
              ))}
              <span className="text-xs px-2 py-1 rounded-lg bg-sales-bg text-sales-text-mute">
                {expLabel}
              </span>
            </div>

            {/* 하단: 회사명 + 조회수 */}
            <div className="flex items-center justify-between pt-3 border-t border-sales-border">
              <span className="text-sm text-sales-text-mute font-medium truncate">{job.company}</span>
              <div className="flex items-center gap-1 text-xs text-sales-text-mute">
                <Eye className="w-3.5 h-3.5" />
                <span>{job.views.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // ── 컴팩트 카드 (UNIQUE 그리드 2×4) ──
  if (variant === 'compact') {
    return (
      <Link href={`/sales/jobs/${job.id}`}>
        <div className="bg-white rounded-2xl border border-sales-border hover:shadow-md transition-shadow cursor-pointer overflow-hidden group h-full">
          {/* 썸네일 */}
          <div className="relative h-28 md:h-32 bg-gray-100 overflow-hidden">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={job.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${phGradient}`}>
                <Building2 className="w-10 h-10 text-white/70" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* 상태 배지 */}
            {job.badges.length > 0 && (
              <div className="absolute top-2 left-2">
                <Badge variant="badge" value={job.badges[0] as SalesJobBadge} size="sm" />
              </div>
            )}

            {/* 하단: 유형 + 지역 */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1">
              <Badge variant="type" value={job.type} size="sm" />
              <span className="text-[11px] text-white/90">{job.region}</span>
            </div>
          </div>

          {/* 정보 */}
          <div className="p-3">
            <h4 className="text-sm font-bold text-sales-text line-clamp-1 mb-1 group-hover:text-violet-600 transition-colors">
              {job.title}
            </h4>
            <p className="text-xs text-sales-text-mute line-clamp-1 mb-2">{job.description}</p>

            {/* CommissionChips dense */}
            <CommissionChips items={commissionItems} dense />

            {/* 혜택 첫 번째 */}
            {job.benefits.length > 0 && (
              <span className="inline-block mt-1.5 text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-md font-semibold">
                {job.benefits[0]}
              </span>
            )}

            {/* 회사명 + 조회수 */}
            <div className="flex items-center justify-between mt-2 text-xs text-sales-text-mute">
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

  // ── 기본 카드 (리스트형 — default variant) ──
  return (
    <Link href={`/sales/jobs/${job.id}`}>
      <div className={`bg-white rounded-2xl border border-sales-border hover:shadow-md transition-all cursor-pointer overflow-hidden ${styles.border} group`}>
        <div className="flex">
          {/* 썸네일 */}
          <div className="relative w-32 md:w-48 flex-shrink-0 bg-gray-100 overflow-hidden">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={job.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 33vw, 25vw"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${phGradient}`}>
                <Building2 className="w-10 h-10 text-white/70" />
              </div>
            )}
            {/* 배지 */}
            {job.badges.length > 0 && (
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {job.badges.map((badge) => (
                  <Badge key={badge} variant="badge" value={badge as SalesJobBadge} size="sm" />
                ))}
              </div>
            )}
          </div>

          {/* 정보 영역 */}
          <div className="flex-1 p-3 md:p-4 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="type" value={job.type} size="sm" />
                <span className="text-xs text-sales-text-mute">{job.region}</span>
              </div>
              <h3 className="text-sm md:text-base font-bold text-sales-text line-clamp-1 mb-1 group-hover:text-violet-600 transition-colors">
                {job.title}
              </h3>
              <p className="text-xs md:text-sm text-sales-text-mute line-clamp-1">
                {job.description}
              </p>
            </div>

            {/* 하단 메타 */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {/* CommissionChips */}
              <CommissionChips items={commissionItems} dense />

              <span className="text-xs px-2 py-0.5 rounded-md bg-sales-bg text-sales-text-mute">
                {SALARY_LABELS[job.salary.type]}
              </span>
              {job.benefits.slice(0, 2).map((benefit) => (
                <span key={benefit} className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                  {benefit}
                </span>
              ))}
              <span className="text-xs px-2 py-0.5 rounded-md bg-sales-bg text-sales-text-mute">
                {expLabel}
              </span>
              <span className="text-xs text-sales-text-mute ml-auto hidden md:inline">{job.company}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
