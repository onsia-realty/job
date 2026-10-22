import { describe, expect, it, vi } from 'vitest';
import { readTransactionPages, transactionMetadata } from './transactionData';

describe('transaction data completeness', () => {
  it('collects 1001 rows and propagates later-page errors', async () => {
    const rows = Array.from({ length: 1001 }, (_, id) => ({ id }));
    const page = vi.fn(async (from: number, to: number) => ({ data: rows.slice(from, to + 1), error: null }));
    expect(await readTransactionPages(page)).toHaveLength(1001);
    expect(page.mock.calls).toEqual([[0, 999], [1000, 1999]]);
    await expect(readTransactionPages(async from => from === 0
      ? { data: rows.slice(0, 1000), error: null }
      : { data: null, error: { message: 'failed' } })).rejects.toThrow('failed');
  });
  it('shares a global page budget and rejects partial results', async () => {
    const budget = { pages: 0, maxPages: 1 };
    await readTransactionPages(async () => ({ data: [], error: null }), budget);
    await expect(readTransactionPages(async () => ({ data: [], error: null }), budget)).rejects.toThrow('budget');
  });
  it('uses the oldest actual collection time and treats missing times as stale', () => {
    const options = { source: 'cache', periodStart: '2026-10-01', periodEnd: '2026-10-31' };
    const metadata = transactionMetadata([{ fetched_at: new Date().toISOString() }, { fetched_at: '2020-01-01T00:00:00Z' }], options);
    expect(metadata.stale).toBe(true);
    expect(metadata.collectionOldestAt).toBe('2020-01-01T00:00:00.000Z');
    expect(metadata.aggregateRefreshedAt).toBeNull();
    expect(transactionMetadata([{}], options)).toMatchObject({ stale: true, collectionOldestAt: null, collectionNewestAt: null });
  });
});
