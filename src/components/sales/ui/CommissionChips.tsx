import type { SalesPosition } from '@/types';
import { POSITION_LABELS } from '@/types';

export interface CommissionItem {
  position: SalesPosition;
  amount?: string;
}

interface Props {
  items: CommissionItem[];
  dense?: boolean;
}

/** 직책별 수수료 칩 (본부장/팀장/팀원 + 금액). bunshin "직책별 RT" 대응. */
export default function CommissionChips({ items, dense = false }: Props) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <span
          key={`${it.position}-${i}`}
          className={`inline-flex items-center gap-1 rounded-lg bg-sales-primary-soft font-semibold text-sales-primary ${
            dense ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs'
          }`}
        >
          <span className="rounded bg-sales-primary px-1 text-[10px] font-bold text-white">
            {POSITION_LABELS[it.position]}
          </span>
          <span>{it.amount ?? '상담'}</span>
        </span>
      ))}
    </div>
  );
}
