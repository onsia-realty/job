export interface TransactionMetadata {
  periodStart: string | null;
  periodEnd: string | null;
  collectionOldestAt: string | null;
  collectionNewestAt: string | null;
  aggregateRefreshedAt: null;
  servedAt: string;
  stale: boolean;
  truncated: boolean;
  source: string;
  complexLimit?: number;
  persistenceError?: string;
  error?: string;
}

export function transactionMetadata(
  rows: readonly { fetched_at?: string | null }[],
  options: { source: string; periodStart: string | null; periodEnd: string | null;
    stale?: boolean; truncated?: boolean; complexLimit?: number; completedAt?: string;
    persistenceError?: string; error?: string },
): TransactionMetadata {
  const times = rows.map(r => Date.parse(r.fetched_at ?? ''));
  const valid = times.filter(Number.isFinite);
  const oldest = valid.length ? new Date(valid.reduce((a, b) => Math.min(a, b), Infinity)).toISOString() : null;
  const newest = valid.length ? new Date(valid.reduce((a, b) => Math.max(a, b), -Infinity)).toISOString() : null;
  const { completedAt, ...rest } = options;
  return {
    ...rest,
    collectionOldestAt: completedAt ?? oldest,
    collectionNewestAt: completedAt ?? newest,
    aggregateRefreshedAt: null,
    servedAt: new Date().toISOString(),
    stale: options.stale ?? (!oldest || valid.length !== rows.length ||
      Date.now() - Date.parse(oldest) >= 24 * 60 * 60 * 1000),
    truncated: options.truncated ?? false,
  };
}

export class TransactionReadBudgetError extends Error {
  constructor() { super('Transaction read budget exceeded; narrow the requested area or period'); }
}

// Share one budget across all bounds chunks. Never return a partial successful result.
export function transactionReadBudget() { return { pages: 0, maxPages: 100 }; }

export async function readTransactionPages<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  budget = transactionReadBudget(),
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    if (++budget.pages > budget.maxPages) throw new TransactionReadBudgetError();
    const { data, error } = await page(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Transaction query returned no data');
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}
