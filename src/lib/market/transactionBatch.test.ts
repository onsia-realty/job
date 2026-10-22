import { describe, expect, it } from 'vitest';
import type { NormalizedTransaction } from './realEstate';
import { deduplicateTransactionBatch, TRANSACTION_CONFLICT_COLUMNS } from './transactionBatch';

const base: NormalizedTransaction & { fetched_at: string } = {
  property_type: 'apt', deal_type: 'trade', lawd_cd: '11110', deal_ymd: '202610',
  deal_date: '2026-10-01', complex_name: 'fixture', complex_key: 'fixture', dong: '동',
  jibun: '', exclusive_area: 84, floor: 1, build_year: 2000, price_manwon: 10000,
  deposit_manwon: 0, monthly_manwon: 0, cancel_yn: false, deal_channel: null, raw: {},
  fetched_at: '2026-10-22T00:00:00Z',
};

describe('transaction batch deduplication', () => {
  it('matches all eleven migration 026 columns', () => {
    expect(TRANSACTION_CONFLICT_COLUMNS).toEqual([
      'property_type', 'deal_type', 'lawd_cd', 'deal_ymd', 'complex_name', 'jibun',
      'exclusive_area', 'floor', 'deal_date', 'price_manwon', 'deposit_manwon',
    ]);
    for (const column of TRANSACTION_CONFLICT_COLUMNS) {
      const value = base[column];
      const distinct = { ...base, [column]: typeof value === 'number' ? value + 1 : `${value}2` };
      expect(deduplicateTransactionBatch([base, distinct])).toHaveLength(2);
    }
  });
  it('cancellation wins in either order while preserving the latest fetched_at', () => {
    const cancelled = { ...base, cancel_yn: true, monthly_manwon: 10 };
    const active = { ...base, fetched_at: '2026-10-23T00:00:00Z', monthly_manwon: 20 };
    const expected = [{ ...cancelled, fetched_at: active.fetched_at }];
    expect(deduplicateTransactionBatch([cancelled, active])).toEqual(expected);
    expect(deduplicateTransactionBatch([active, cancelled])).toEqual(expected);
    expect(cancelled.fetched_at).toBe(base.fetched_at);
  });
  it('uses latest time then deterministic content for equal-status duplicates', () => {
    const newer = { ...base, fetched_at: '2026-10-23T00:00:00Z', monthly_manwon: 20 };
    expect(deduplicateTransactionBatch([newer, base])).toEqual([newer]);
    const other = { ...base, monthly_manwon: 30 };
    expect(deduplicateTransactionBatch([base, other])).toEqual(deduplicateTransactionBatch([other, base]));
  });
  it('normalizes legacy null index defaults and leaves distinct keys separate', () => {
    const nullable = { ...base, jibun: null, floor: null, price_manwon: null, deposit_manwon: null };
    const defaults = { ...base, jibun: '', floor: 0, price_manwon: 0, deposit_manwon: 0 };
    expect(deduplicateTransactionBatch([nullable, defaults])).toHaveLength(1);
    expect(deduplicateTransactionBatch([base, { ...base, deal_date: '2026-10-02' }])).toHaveLength(2);
    expect(deduplicateTransactionBatch([])).toEqual([]);
  });
});
