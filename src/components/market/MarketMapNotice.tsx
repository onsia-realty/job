interface MarketMapNoticeProps {
  enabled: boolean;
  pointCount: number;
  loading?: boolean;
  error?: boolean;
}

export default function MarketMapNotice({ enabled, pointCount, loading = false, error = false }: MarketMapNoticeProps) {
  if (!enabled || (!loading && !error && pointCount > 0)) return null;

  const message = loading
    ? '거래 데이터를 불러오는 중…'
    : error
      ? '거래 데이터를 불러오지 못했습니다'
      : '현재 조건에 맞는 거래가 없습니다';

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div role={error && !loading ? 'alert' : 'status'} className="bg-white/95 text-market-text-mute text-sm px-4 py-2.5 rounded-xl border border-market-border shadow-lg font-jakarta">
        {message}
      </div>
    </div>
  );
}
