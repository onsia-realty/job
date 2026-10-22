import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { koreanDate, marketMonthStart, marketMonthsAgo, marketMonthEnd } from './types';

const mocks = vi.hoisted(() => ({ from: vi.fn(), calls: [] as Array<[string, string, ...unknown[]]>, fail: '', full: false, cache: null as null | { data: unknown[]; updated_at: string }, count: 1001, ym: '2026-10-01' }));
vi.mock('@/lib/supabase-server', () => ({ supabaseAdmin: { from: mocks.from } }));
import { GET as complex } from '@/app/api/market/complex/[key]/route';
import { GET as aggregates } from '@/app/api/market/aggregates/route';
import { GET as rankings } from '@/app/api/market/rankings/top10/route';
import { buildSlowRankings } from './rankings';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-23T00:00:00Z'));
  mocks.calls = []; mocks.fail = ''; mocks.full = false; mocks.cache = null; mocks.count = 1001; mocks.ym = '2026-10-01';
  mocks.from.mockImplementation((table: string) => {
    const q: Record<string, unknown> = {};
    for (const method of ['select', 'eq', 'neq', 'gte', 'lte', 'like', 'in', 'order']) {
      q[method] = (...args: unknown[]) => { mocks.calls.push([table, method, ...args]); return q; };
    }
    const result = (data: unknown) => ({ data, error: mocks.fail === table ? { message: 'fixture failure' } : null });
    q.range = (from: number, to: number) => {
      mocks.calls.push([table, 'range', from, to]);
      const size = mocks.full ? 1000 : Math.max(0, Math.min(to + 1, mocks.count) - from);
      const rows = Array.from({ length: size }, (_, i) => table === 'price_transactions' ? {
        id: from + i, deal_date: '2026-10-01', price_manwon: 100, exclusive_area: 84,
        deal_type: 'trade', cancel_yn: false, complex_key: 'fixture', lawd_cd: '11110',
        fetched_at: '2026-10-01T00:00:00Z',
      } : { complex_key: 'fixture', lawd_cd: '11110', avg_price_manwon: 100, trade_count: 1, ym: mocks.ym });
      return Promise.resolve(result(rows));
    };
    q.limit = () => Promise.resolve(result(table === 'complex_aggregates' ? [{ ym: mocks.ym, avg_price_manwon: 100, trade_count: 1 }] : []));
    q.maybeSingle = () => Promise.resolve(result(table === 'market_rankings' ? mocks.cache : null));
    q.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result([])).then(resolve);
    return q;
  });
});

const detail = () => complex(new NextRequest('http://localhost/api/market/complex/fixture'), { params: Promise.resolve({ key: 'fixture' }) });
afterEach(() => vi.useRealTimers());
const aggregate = () => aggregates(new NextRequest('http://localhost/api/market/aggregates'));
const ranking = (metric = 'highest') => rankings(new NextRequest(`http://localhost/api/market/rankings/top10?metric=${metric}`));

describe('Phase 3 market reads', () => {
  it('uses KST calendar dates and clamps month-end subtraction', () => {
    const at = new Date('2026-03-31T15:30:00Z');
    expect(koreanDate(at)).toBe('2026-04-01');
    expect(marketMonthStart(1, at)).toBe('2026-03-01');
    expect(marketMonthsAgo(1, new Date('2026-03-31T00:00:00Z'))).toBe('2026-02-28');
    expect(marketMonthEnd('2026-09-01')).toBe('2026-09-30');
    expect(marketMonthEnd('2026-10-01')).toBe('2026-10-23');
    expect(marketMonthEnd('2026-04-01', at)).toBe('2026-04-01');
  });
  it('reads all detail pages with stable ties and reports actual collection time', async () => {
    const body = await (await detail()).json();
    expect(body.chart_deals).toHaveLength(1001);
    expect(mocks.calls).toContainEqual(['price_transactions', 'range', 1000, 1999]);
    expect(mocks.calls).toContainEqual(['price_transactions', 'order', 'id', { ascending: false }]);
    expect(mocks.calls).toContainEqual(['price_transactions', 'eq', 'cancel_yn', false]);
    expect(body.metadata).toMatchObject({ periodStart: '2026-04-23', periodEnd: '2026-10-23', collectionNewestAt: '2026-10-01T00:00:00.000Z', aggregateRefreshedAt: null, stale: true });
  });
  it('fails detail reads rather than returning empty or partial charts', async () => {
    mocks.fail = 'price_transactions';
    expect((await detail()).status).toBe(500);
    mocks.fail = ''; mocks.full = true;
    expect((await detail()).status).toBe(500);
  });
  it('bounds and orders aggregate pages and explicitly leaves MV freshness unknown', async () => {
    const body = await (await aggregate()).json();
    expect(mocks.calls).toContainEqual(['complex_aggregates', 'order', 'complex_key', { ascending: true }]);
    expect(mocks.calls).toContainEqual(['complex_aggregates', 'range', 1000, 1999]);
    expect(body.metadata).toMatchObject({ periodStart: '2026-07-01', periodEnd: '2026-10-23', aggregateRefreshedAt: null, collectionNewestAt: null });
    expect(mocks.calls).toContainEqual(['complex_aggregates', 'lte', 'ym', '2026-10-01']);
    mocks.full = true;
    expect((await aggregate()).status).toBe(500);
  });
  it('anchors stale cached ranking periods to computation, never collection freshness', async () => {
    mocks.cache = { data: [], updated_at: '2026-08-31T16:00:00Z' };
    const body = await (await ranking()).json();
    expect(body.metadata).toMatchObject({ periodStart: '2026-03-01', periodEnd: '2026-09-01', rankingComputedAt: mocks.cache.updated_at, collectionNewestAt: null, aggregateRefreshedAt: null, stale: true });
    expect(body.metadata.servedAt).not.toBe(body.rankingComputedAt);
  });
  it('timestamps successful live computation and reports MV requested month', async () => {
    mocks.count = 0;
    const live = await (await ranking()).json();
    expect(live).toMatchObject({ source: 'live', rankingComputedAt: '2026-10-23T00:00:00.000Z', stale: false });
    const mv = await (await ranking('count')).json();
    expect(mv.metadata).toMatchObject({ periodStart: '2026-09-01', periodEnd: '2026-09-30', aggregateRefreshedAt: null, collectionNewestAt: null });
    expect(mocks.calls).toContainEqual(['complex_aggregates', 'eq', 'ym', '2026-09-01']);
    mocks.fail = 'price_transactions';
    const failed = await ranking();
    expect(failed.status).toBe(500);
    expect(await failed.json()).not.toHaveProperty('rankingComputedAt');
  });
  it('rejects the former silent 80-page ranking truncation', async () => {
    mocks.full = true;
    await expect(buildSlowRankings('apt', 'all')).rejects.toThrow('budget exceeded');
    expect(mocks.calls.filter(c => c[1] === 'range')).toHaveLength(80);
    expect(mocks.calls).toContainEqual(['price_transactions', 'order', 'id', { ascending: false }]);
  });
  it.each([['2026-09-01', '2026-09-30'], ['2026-10-01', '2026-10-23']])('reports covered monthly end for %s', async (ym, end) => {
    mocks.ym = ym;
    expect((await (await detail()).json()).monthlyMetadata.periodEnd).toBe(end);
    expect((await (await aggregate()).json()).metadata.periodEnd).toBe(end);
  });
  it('caps current monthly coverage at the Korean midnight boundary', async () => {
    vi.setSystemTime(new Date('2026-09-30T15:00:00Z'));
    expect((await (await detail()).json()).monthlyMetadata.periodEnd).toBe('2026-10-01');
    expect((await (await aggregate()).json()).metadata.periodEnd).toBe('2026-10-01');
  });
});
