import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SectionCardProps {
  icon?: LucideIcon;
  title?: string;
  accent?: boolean;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** 아이콘+제목 헤더가 있는 흰 카드 섹션 래퍼 */
export default function SectionCard({
  icon: Icon,
  title,
  accent,
  right,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <section
      className={`rounded-2xl border bg-sales-surface ${
        accent ? 'border-sales-primary/30' : 'border-sales-border'
      } ${className}`}
    >
      {title && (
        <header className="flex items-center justify-between gap-2 border-b border-sales-border px-4 py-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-sales-primary" />}
            <h2 className="text-sm font-bold text-sales-text">{title}</h2>
          </div>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
