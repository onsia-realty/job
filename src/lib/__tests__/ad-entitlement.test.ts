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
  function fakeDb(payments: Record<string, unknown>[]) {
    const updates: Record<string, unknown>[] = [];
    const from = vi.fn((table: string) => {
      const chain: Record<string, unknown> = {};
      let rows = table === 'payments' ? [...payments] : [{ id: 'job-1', category: 'sales' }];
      let isUpdate = false;
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn((k: string, v: unknown) => {
        if (!isUpdate) rows = rows.filter((r) => r[k] === v);
        return chain;
      });
      chain.update = vi.fn((payload: Record<string, unknown>) => {
        isUpdate = true;
        updates.push(payload);
        return chain;
      });
      chain.maybeSingle = vi.fn(async () => ({ data: rows[0] ?? null, error: null }));
      chain.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: isUpdate ? null : rows, error: null }).then(resolve);
      return chain;
    });
    return { db: { from } as unknown as SupabaseClient, updates };
  }

  it('is idempotent and ignores non-completed payments', async () => {
    const { db, updates } = fakeDb([
      { job_id: 'job-1', payment_status: 'completed', tier: 'superior', starts_at: null, paid_at: iso('2026-10-01'), expires_at: iso('2026-10-21') },
      { job_id: 'job-1', payment_status: 'refunded', tier: 'unique', starts_at: iso('2026-10-05'), paid_at: iso('2026-10-05'), expires_at: iso('2026-10-15') },
    ]);
    const a = await recomputeJobAd(db, 'job-1', d('2026-10-10'));
    const b = await recomputeJobAd(db, 'job-1', d('2026-10-10'));
    expect(a).toEqual(b);
    expect(updates).toHaveLength(2);
    expect(updates[0]).toEqual({ tier: 'superior', ad_expires_at: iso('2026-10-21') });
    expect(updates[1]).toEqual(updates[0]);
  });
});
