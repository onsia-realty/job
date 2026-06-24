'use client';

interface TabItem {
  id: string;
  label: string;
}

interface Props {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

/** 세그먼트/앵커 탭 (현장정보 | 모집정보 등) */
export default function Tabs({ tabs, activeId, onChange }: Props) {
  return (
    <div className="flex gap-1 border-b border-sales-border">
      {tabs.map((t) => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`relative px-4 py-2.5 text-sm font-bold transition-colors ${
              active ? 'text-sales-primary' : 'text-sales-text-mute hover:text-sales-text'
            }`}
          >
            {t.label}
            {active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-sales-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
