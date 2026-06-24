interface PillProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  tone?: 'primary' | 'neutral';
  size?: 'sm' | 'md';
}

/** 지역/혜택/필터용 라운드 칩. onClick 있으면 button, 없으면 span. */
export default function Pill({
  label,
  active = false,
  onClick,
  tone = 'primary',
  size = 'md',
}: PillProps) {
  const sz = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-sm';
  const activeCls =
    tone === 'primary'
      ? 'bg-sales-primary text-white border-sales-primary'
      : 'bg-gray-900 text-white border-gray-900';
  const idle =
    'bg-white text-sales-text-mute border-sales-border hover:border-sales-primary hover:text-sales-primary';
  const cls = `inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap transition-colors ${sz} ${
    active ? activeCls : idle
  }`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {label}
      </button>
    );
  }
  return <span className={cls}>{label}</span>;
}
