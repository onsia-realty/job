import { describe, expect, it } from 'vitest';
import { calculateHostQuote, type HostQuoteStay } from '@/lib/stay/host-pricing';

const stay: HostQuoteStay = {
  owner_type: 'owner', deal_type: 'short_term', status: 'available',
  weekly_fee_won: 250000, daily_fee_won: null, monthly_fee_won: null,
  maintenance_fee_won: 90000, maintenance_included: false, utilities_included: false,
  deposit_won: 300000, min_stay_days: 7, max_stay_days: 30,
  available_from: '2026-09-15', available_to: '2026-10-31',
};
const quote = (end: string, changes: Partial<HostQuoteStay> = {}, start = '2026-09-15') => calculateHostQuote({ ...stay, ...changes }, start, end, '2026-09-15');

describe('host period quote', () => {
  it('calculates 7 and 14 days with monthly management and separate refundable deposit', () => {
    expect(quote('2026-09-22')).toMatchObject({ ok: true, days: 7, rentWon: 250000, maintenanceWon: 21000, totalWon: 271000, depositWon: 300000 });
    expect(quote('2026-09-29')).toMatchObject({ ok: true, rentWon: 500000, maintenanceWon: 42000, totalWon: 542000 });
  });
  it('rounds the fractional remaining rent once or uses the explicit daily price', () => {
    expect(quote('2026-09-23')).toMatchObject({ ok: true, rentWon: 285714 });
    expect(quote('2026-09-23', { daily_fee_won: 40000 })).toMatchObject({ ok: true, rentWon: 290000 });
  });
  it('does not treat unknown management or monthly-only legacy pricing as free/weekly', () => {
    expect(quote('2026-09-22', { maintenance_fee_won: null }).ok).toBe(false);
    expect(quote('2026-09-22', { maintenance_fee_won: null, maintenance_included: true })).toMatchObject({ ok: true, maintenanceWon: 0 });
    expect(quote('2026-09-22', { weekly_fee_won: null, monthly_fee_won: 900000 }).ok).toBe(false);
  });
  it('rejects impossible, past, reversed and same-day dates', () => {
    for (const [start, end] of [['2026-02-30', '2026-03-10'], ['2026-09-14', '2026-09-22'], ['2026-09-15', '2026-09-15'], ['2026-09-16', '2026-09-15']]) {
      expect(quote(end, {}, start).ok).toBe(false);
    }
  });
  it('enforces min/max and availability with exclusive departure', () => {
    expect(quote('2026-09-21').ok).toBe(false);
    expect(quote('2026-10-16').ok).toBe(false);
    expect(quote('2026-09-22', { available_to: '2026-09-22' }).ok).toBe(true);
    expect(quote('2026-09-23', { available_to: '2026-09-22' }).ok).toBe(false);
    expect(quote('2026-09-23', { available_from: '2026-09-16' }).ok).toBe(false);
  });
  it('keeps agent and unavailable listings out of host quote flow', () => {
    expect(quote('2026-09-22', { owner_type: 'agent' }).ok).toBe(false);
    expect(quote('2026-09-22', { status: 'occupied' }).ok).toBe(false);
    expect(quote('2026-09-22', { deposit_won: -1 }).ok).toBe(false);
  });
});
