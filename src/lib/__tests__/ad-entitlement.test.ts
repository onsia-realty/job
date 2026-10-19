// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  computeWindow,
  effectiveJobTier,
  isFreeExposureOver,
  planAdPurchase,
  projectJobAd,
  recomputeJobAd,
  tierLabel,
  tierRank,
  toKstDate,
} from '@/lib/ad-entitlement';

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);
const iso = (s: string) => d(s).toISOString();
const win = (tier: string, s: string, e: string) => ({ tier, starts_at: iso(s), expires_at: iso(e) });

describe('tierRank / tierLabel', () => {
  it('ranks sales and agent tiers separately', () => {
    expect(tierRank('sales', 'premium')).toBe(1);
    expect(tierRank('sales', 'superior')).toBe(2);
    expect(tierRank('sales', 'dia')).toBe(3);
    expect(tierRank('sales', 'unique')).toBe(4);
    expect(tierRank('agent', 'basic')).toBe(1);
    expect(tierRank('agent', 'premium')).toBe(2);
    expect(tierRank('agent', 'vip')).toBe(3);
    expect(tierRank('sales', 'normal')).toBe(0);
    expect(tierRank(null, 'vip')).toBe(3);
  });
  it('uses sales display names', () => {
    expect(tierLabel('sales', 'premium')).toBe('베이직');
    expect(tierLabel('sales', 'normal')).toBe('일반');
    expect(tierLabel('sales', null)).toBe('일반');
  });
});

describe('computeWindow', () => {
  it('fresh purchase starts at approval', () => {
    const w = computeWindow({ newTier: 'premium', category: 'sales', exposureDays: 14, approvedAt: d('2026-10-01'), existing: [] });
    expect(w.startsAt.toISOString()).toBe(iso('2026-10-01'));
    expect(w.expiresAt.toISOString()).toBe(iso('2026-10-15'));
  });

  it('same-tier extension is appended contiguously', () => {
    const existing = [win('superior', '2026-10-01', '2026-10-11')];
    const w = computeWindow({ newTier: 'superior', category: 'sales', exposureDays: 10, approvedAt: d('2026-10-05'), existing });
    expect(w.startsAt.toISOString()).toBe(iso('2026-10-11'));
    expect(w.expiresAt.toISOString()).toBe(iso('2026-10-21'));

    const all = [...existing, { tier: 'superior', starts_at: w.startsAt, expires_at: w.expiresAt }];
    expect(projectJobAd(d('2026-10-12'), all, 'sales')).toEqual({ tier: 'superior', adExpiresAt: d('2026-10-21') });
  });

  it('upgrade starts now and falls back to the remaining lower window', () => {
    const existing = [win('superior', '2026-10-01', '2026-10-21')];
    const w = computeWindow({ newTier: 'unique', category: 'sales', exposureDays: 10, approvedAt: d('2026-10-05'), existing });
    expect(w.startsAt.toISOString()).toBe(iso('2026-10-05'));
    expect(w.expiresAt.toISOString()).toBe(iso('2026-10-15'));

    const all = [...existing, { tier: 'unique', starts_at: w.startsAt, expires_at: w.expiresAt }];
    expect(projectJobAd(d('2026-10-10'), all, 'sales')).toEqual({ tier: 'unique', adExpiresAt: d('2026-10-15') });
    expect(projectJobAd(d('2026-10-16'), all, 'sales')).toEqual({ tier: 'superior', adExpiresAt: d('2026-10-21') });
    expect(projectJobAd(d('2026-10-22'), all, 'sales')).toEqual({ tier: 'normal', adExpiresAt: d('2026-10-21') });
  });

  it('lower-tier purchase is queued after the latest future end', () => {
    const existing = [win('unique', '2026-10-01', '2026-10-11')];
    const w = computeWindow({ newTier: 'premium', category: 'sales', exposureDays: 14, approvedAt: d('2026-10-05'), existing });
    expect(w.startsAt.toISOString()).toBe(iso('2026-10-11'));
    expect(w.expiresAt.toISOString()).toBe(iso('2026-10-25'));

    const all = [...existing, { tier: 'premium', starts_at: w.startsAt, expires_at: w.expiresAt }];
    expect(projectJobAd(d('2026-10-06'), all, 'sales').tier).toBe('unique');
    expect(projectJobAd(d('2026-10-12'), all, 'sales')).toEqual({ tier: 'premium', adExpiresAt: d('2026-10-25') });
  });

  it('ignores expired windows (no active window → starts now)', () => {
    const existing = [win('superior', '2026-09-01', '2026-09-11')];
    const w = computeWindow({ newTier: 'superior', category: 'sales', exposureDays: 10, approvedAt: d('2026-10-05'), existing });
    expect(w.startsAt.toISOString()).toBe(iso('2026-10-05'));
  });

  it('agent tiers use the agent ladder (premium is above basic)', () => {
    const existing = [win('basic', '2026-10-01', '2026-10-06')];
    const w = computeWindow({ newTier: 'premium', category: 'agent', exposureDays: 7, approvedAt: d('2026-10-02'), existing });
    expect(w.startsAt.toISOString()).toBe(iso('2026-10-02'));
  });
});

describe('planAdPurchase', () => {
  it('reports lower windows that resume after an upgrade, and ones that are overlapped', () => {
    const existing = [win('superior', '2026-10-01', '2026-10-21'), win('premium', '2026-10-01', '2026-10-08')];
    const plan = planAdPurchase({ newTier: 'unique', category: 'sales', exposureDays: 10, approvedAt: d('2026-10-05'), existing });
    expect(plan.startsNow).toBe(true);
    expect(plan.resumes).toEqual([{ tier: 'superior', until: d('2026-10-21') }]);
    expect(plan.overlapped).toEqual(['premium']);
  });
  it('extension does not start now', () => {
    const plan = planAdPurchase({ newTier: 'superior', category: 'sales', exposureDays: 10, approvedAt: d('2026-10-05'), existing: [win('superior', '2026-10-01', '2026-10-12')] });
    expect(plan.startsNow).toBe(false);
    expect(plan.startsAt).toEqual(d('2026-10-12'));
    expect(plan.expiresAt).toEqual(d('2026-10-22'));
  });
});

describe('projectJobAd', () => {
  it('refund removal drops the window from the projection', () => {
    const superior = win('superior', '2026-10-01', '2026-10-21');
    const unique = win('unique', '2026-10-05', '2026-10-15');
    expect(projectJobAd(d('2026-10-10'), [superior, unique], 'sales').tier).toBe('unique');
    // unique 환불 → superior 로 복귀 (normal 로 떨어지지 않음)
    expect(projectJobAd(d('2026-10-10'), [superior], 'sales')).toEqual({ tier: 'superior', adExpiresAt: d('2026-10-21') });
    // 전부 환불 → normal, 만료일 없음
    expect(projectJobAd(d('2026-10-10'), [], 'sales')).toEqual({ tier: 'normal', adExpiresAt: null });
  });

  it('all expired → normal with the latest end', () => {
    const all = [win('premium', '2026-09-01', '2026-09-15'), win('superior', '2026-09-10', '2026-09-20')];
    expect(projectJobAd(d('2026-10-01'), all, 'sales')).toEqual({ tier: 'normal', adExpiresAt: d('2026-09-20') });
  });

  it('tie on rank picks the later end', () => {
    const all = [win('superior', '2026-10-01', '2026-10-11'), win('superior', '2026-10-02', '2026-10-20')];
    expect(projectJobAd(d('2026-10-05'), all, 'sales').adExpiresAt).toEqual(d('2026-10-20'));
  });
});

describe('read-path helpers', () => {
  const now = d('2026-10-10');
  it('treats a lapsed paid tier as normal', () => {
    expect(effectiveJobTier({ tier: 'unique', ad_expires_at: iso('2026-10-09') }, now)).toBe('normal');
    expect(effectiveJobTier({ tier: 'unique', ad_expires_at: iso('2026-10-11') }, now)).toBe('unique');
    expect(effectiveJobTier({ tier: 'unique', ad_expires_at: null }, now)).toBe('unique');
  });
  it('free exposure counts 24h from ad end, else from creation', () => {
    expect(isFreeExposureOver({ tier: 'normal', created_at: iso('2026-10-08') }, now)).toBe(true);
    expect(isFreeExposureOver({ tier: 'normal', created_at: iso('2026-10-01'), ad_expires_at: '2026-10-09T12:00:00.000Z' }, now)).toBe(false);
    expect(isFreeExposureOver({ tier: 'unique', created_at: iso('2026-10-01'), ad_expires_at: iso('2026-10-08') }, now)).toBe(true);
    expect(isFreeExposureOver({ tier: 'unique', created_at: iso('2026-10-01'), ad_expires_at: iso('2026-10-20') }, now)).toBe(false);
  });
  it('formats KST date', () => {
    expect(toKstDate(new Date('2026-10-10T15:30:00.000Z'))).toBe('2026-10-11');
  });
});

describe('recomputeJobAd', () => {
  function fakeDb() {
    const rpc = vi.fn().mockResolvedValue({ data: { tier: 'superior', ad_expires_at: iso('2026-10-21') }, error: null });
    const from = vi.fn(() => { throw new Error('Non-atomic projection query forbidden'); });
    return { db: { rpc, from } as unknown as SupabaseClient, rpc, from };
  }

  it('delegates every replay to the atomic projection RPC and maps its timestamp', async () => {
    const { db, rpc, from } = fakeDb();
    const a = await recomputeJobAd(db, 'job-1', d('2026-10-10'));
    const b = await recomputeJobAd(db, 'job-1', d('2026-10-10'));
    expect(a).toEqual(b);
    expect(a).toEqual({ tier: 'superior', adExpiresAt: d('2026-10-21') });
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenCalledWith('recompute_payment_job_ad', { p_job_id: 'job-1', p_now: iso('2026-10-10') });
    expect(from).not.toHaveBeenCalled();
  });
  it('returns null when the locked job was deleted', async () => {
    const { db, rpc } = fakeDb();
    rpc.mockResolvedValueOnce({ data: null, error: null });
    expect(await recomputeJobAd(db, 'deleted')).toBeNull();
  });
  it('fails closed when the transaction or RPC is unavailable', async () => {
    const { db, rpc, from } = fakeDb();
    rpc.mockResolvedValueOnce({ data: null, error: { code: '42883' } });
    await expect(recomputeJobAd(db, 'job-1')).rejects.toThrow('광고 재계산 실패');
    expect(from).not.toHaveBeenCalled();
  });
  it('uses the latest RPC projection after an interleaved legacy cancellation', async () => {
    const { db, rpc } = fakeDb();
    const canceled = { data: { tier: 'normal', ad_expires_at: null }, error: null };
    let resume: (value: typeof canceled) => void = () => undefined;
    // A waits for the DB lock; B commits a refund and projects before A resumes.
    rpc.mockImplementationOnce(() => new Promise(resolve => { resume = resolve; }))
      .mockResolvedValueOnce(canceled);
    const delayed = recomputeJobAd(db, 'job-1');
    expect(await recomputeJobAd(db, 'job-1')).toEqual({ tier: 'normal', adExpiresAt: null });
    resume(canceled);
    expect(await delayed).toEqual({ tier: 'normal', adExpiresAt: null });
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});
