'use client';

import { X } from 'lucide-react';
import {
  type PropertyTypeFilter, type AreaBand, type AgeBand, type HouseholdBand,
  AREA_OPTIONS, AGE_OPTIONS, HOUSEHOLD_OPTIONS,
} from '@/lib/market/filters';

interface Props {
  open: boolean;
  onClose: () => void;
  propertyType: PropertyTypeFilter;
  onPropertyType: (v: PropertyTypeFilter) => void;
  areaBand: AreaBand;
  onAreaBand: (v: AreaBand) => void;
  ageBand: AgeBand;
  onAgeBand: (v: AgeBand) => void;
  householdBand: HouseholdBand;
  onHouseholdBand: (v: HouseholdBand) => void;
}

// 모바일 전용 필터 바텀시트 — 매물유형/평형/연식/세대수 일괄 설정
export default function MarketFilterSheet({
  open,
  onClose,
  propertyType,
  onPropertyType,
  areaBand,
  onAreaBand,
  ageBand,
  onAgeBand,
  householdBand,
  onHouseholdBand,
}: Props) {
  if (!open) return null;

  const hasActive = areaBand !== 'all' || ageBand !== 'all' || householdBand !== 'all';

  return (
    <div className="md:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="absolute left-0 right-0 bottom-0 bg-market-surface rounded-t-2xl shadow-2xl max-h-[80dvh] flex flex-col font-jakarta">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-market-border flex-shrink-0">
          <div className="text-base font-bold text-market-text">필터</div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 rounded-full text-market-text-mute hover:bg-market-surface-2"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5">
          <FilterGroup label="매물 유형">
            {([['apt', '아파트'], ['officetel', '오피스텔']] as Array<[PropertyTypeFilter, string]>).map(([v, label]) => (
              <Chip key={v} active={propertyType === v} onClick={() => onPropertyType(v)}>{label}</Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="평형">
            {AREA_OPTIONS.map((o) => (
              <Chip key={o.value} active={areaBand === o.value} onClick={() => onAreaBand(o.value)}>{o.label}</Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="연식">
            {AGE_OPTIONS.map((o) => (
              <Chip key={o.value} active={ageBand === o.value} onClick={() => onAgeBand(o.value)}>{o.label}</Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="세대수">
            {HOUSEHOLD_OPTIONS.map((o) => (
              <Chip key={o.value} active={householdBand === o.value} onClick={() => onHouseholdBand(o.value)}>{o.label}</Chip>
            ))}
          </FilterGroup>
        </div>

        <div className="px-5 py-3 border-t border-market-border flex gap-2 flex-shrink-0 pb-[calc(12px+env(safe-area-inset-bottom))]">
          {hasActive && (
            <button
              onClick={() => {
                onAreaBand('all');
                onAgeBand('all');
                onHouseholdBand('all');
              }}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-market-surface-2 text-market-text-mute"
            >
              초기화
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-market-text text-white"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-market-text-mute uppercase tracking-wider mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
        active
          ? 'bg-market-text text-white font-semibold shadow-sm'
          : 'bg-market-surface-2 text-market-text-mute'
      }`}
    >
      {children}
    </button>
  );
}
