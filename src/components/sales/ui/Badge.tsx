import type { SalesJobType, SalesJobTier, SalesJobBadge } from '@/types';
import { SALES_JOB_TYPE_LABELS } from '@/types';

type BadgeProps =
  | { variant: 'tier'; value: SalesJobTier; size?: 'sm' | 'md' }
  | { variant: 'type'; value: SalesJobType; size?: 'sm' | 'md' }
  | { variant: 'badge'; value: SalesJobBadge; size?: 'sm' | 'md' };

const TIER_LABEL: Record<SalesJobTier, string> = {
  unique: 'UNIQUE',
  superior: 'SUPERIOR',
  premium: 'PREMIUM',
  normal: '일반',
};

const TIER_CLASS: Record<SalesJobTier, string> = {
  unique: 'bg-tier-unique text-white',
  superior: 'bg-tier-superior text-white',
  premium: 'bg-tier-premium text-white',
  normal: 'bg-gray-100 text-gray-600',
};

const BADGE_META: Record<SalesJobBadge, { label: string; cls: string }> = {
  new: { label: 'NEW', cls: 'bg-emerald-50 text-emerald-600' },
  hot: { label: 'HOT', cls: 'bg-red-50 text-red-600' },
  jackpot: { label: '대박', cls: 'bg-amber-50 text-amber-600' },
  popular: { label: '인기', cls: 'bg-sales-primary-soft text-sales-primary' },
};

/** 분양상담사 공고용 뱃지 — tier / 매물유형 / 상태뱃지 공용 */
export default function Badge(props: BadgeProps) {
  const size = props.size ?? 'md';
  const base = `inline-flex items-center justify-center rounded-md font-bold whitespace-nowrap ${
    size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
  }`;

  if (props.variant === 'tier') {
    return <span className={`${base} ${TIER_CLASS[props.value]}`}>{TIER_LABEL[props.value]}</span>;
  }
  if (props.variant === 'type') {
    return (
      <span className={`${base} bg-sales-primary-soft text-sales-primary`}>
        {SALES_JOB_TYPE_LABELS[props.value]}
      </span>
    );
  }
  const m = BADGE_META[props.value];
  return <span className={`${base} ${m.cls}`}>{m.label}</span>;
}
