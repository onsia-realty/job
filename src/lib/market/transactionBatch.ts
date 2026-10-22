import type { NormalizedTransaction } from './realEstate';

// Keep in sync with migration 026: monthly_manwon is deliberately NOT in this index.
export const TRANSACTION_CONFLICT_COLUMNS = [
  'property_type', 'deal_type', 'lawd_cd', 'deal_ymd', 'complex_name', 'jibun',
  'exclusive_area', 'floor', 'deal_date', 'price_manwon', 'deposit_manwon',
] as const;

type BatchTransaction = NormalizedTransaction & { fetched_at?: string };

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key =>
      `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`,
    ).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function fetchedTime(row: BatchTransaction): number {
  const time = Date.parse(row.fetched_at ?? '');
  return Number.isFinite(time) ? time : -Infinity;
}

/** Deduplicate one fetched batch only; this does not resolve conflicts with existing DB rows.
 * Cancellation wins, then the most recently fetched row, then a stable content tie-break.
 * The greatest fetched_at is retained even when it belongs to the non-cancelled duplicate.
 * Input rows are never mutated. Legacy nullable index columns use migration 026 defaults.
 */
export function deduplicateTransactionBatch<T extends BatchTransaction>(input: readonly T[]): T[] {
  const groups = new Map<string, T[]>();
  for (const row of input) {
    const key = JSON.stringify(TRANSACTION_CONFLICT_COLUMNS.map(column =>
      row[column] ?? (column === 'jibun' ? '' : 0),
    ));
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return [...groups.keys()].sort().map(key => {
    const group = groups.get(key)!;
    group.sort((a, b) => {
      if (a.cancel_yn !== b.cancel_yn) return a.cancel_yn ? -1 : 1;
      const at = fetchedTime(a), bt = fetchedTime(b);
      if (at !== bt) return at > bt ? -1 : 1;
      const av = stableJson(a), bv = stableJson(b);
      return av < bv ? -1 : av > bv ? 1 : 0;
    });
    const winner = { ...group[0] };
    const latest = group.filter(row => Number.isFinite(fetchedTime(row))).sort((a, b) =>
      fetchedTime(b) - fetchedTime(a) || (a.fetched_at! < b.fetched_at! ? -1 : a.fetched_at! > b.fetched_at! ? 1 : 0),
    )[0];
    if (latest) winner.fetched_at = latest.fetched_at;
    return winner;
  });
}
