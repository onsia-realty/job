import type { TransactionMetadata } from '@/lib/market/transactionData';

export type MarketMetadata = Partial<TransactionMetadata> & { rankingComputedAt?: string | null; missing?: boolean };

// Every participating response matters, including empty responses and reference deal types.
export function combineMarketMetadata(parts: (MarketMetadata | null | undefined)[]): MarketMetadata {
  const missing = !parts.length || parts.some(p => !p || p.missing);
  const range = (key: 'periodStart' | 'periodEnd' | 'collectionOldestAt' | 'collectionNewestAt', last = false) => {
    if (parts.some(p => !p?.[key])) return null;
    const values = parts.map(p => p?.[key]).filter((v): v is string => !!v).sort();
    return (last ? values.at(-1) : values[0]) ?? null;
  };
  return {
    missing, periodStart: range('periodStart'), periodEnd: range('periodEnd', true),
    collectionOldestAt: range('collectionOldestAt'), collectionNewestAt: range('collectionNewestAt', true),
    aggregateRefreshedAt: null,
    stale: missing || parts.some(p => p?.stale !== false),
    truncated: parts.some(p => p?.truncated === true),
    persistenceError: parts.some(p => p?.persistenceError) ? '저장 실패' : undefined,
  };
}

const stamp = (value?: string | null) => value ? value.replace('T', ' ').replace(/(?:\.\d+)?Z$/, ' UTC') : '확인 불가';

export default function MarketDataNotice({ metadata, label = '거래 데이터' }: { metadata?: MarketMetadata | null; label?: string }) {
  return (
    <div className="px-4 py-2 text-[10px] leading-relaxed text-market-text-mute border-b border-market-border" role="note" aria-label={`${label} 기준 안내`}>
      <p>{label} · 거래 대상 기간 {metadata?.periodStart ?? '확인 불가'} ~ {metadata?.periodEnd ?? '확인 불가'}</p>
      <p>조회 행 수집 시각 {stamp(metadata?.collectionOldestAt)} ~ {stamp(metadata?.collectionNewestAt)} (전체 수집 완료 시각 아님)</p>
      <p>집계 갱신 시각 확인 불가</p>
      {metadata && 'rankingComputedAt' in metadata && <p>순위 계산 시각 {stamp(metadata.rankingComputedAt)} (수집 시각과 별개)</p>}
      {(!metadata || metadata.missing) && <p>일부 데이터 기준 정보 누락 · 최신 여부 확인 불가</p>}
      {metadata?.stale && <p>오래되었거나 최신 여부를 확인할 수 없는 데이터가 포함됩니다.</p>}
      {metadata?.truncated && <p>조회 한도로 일부 데이터만 표시됩니다. 범위를 좁혀 주세요.</p>}
      {metadata?.persistenceError && <p>수집 결과 저장 실패 · 다음 조회 결과가 달라질 수 있습니다.</p>}
    </div>
  );
}
