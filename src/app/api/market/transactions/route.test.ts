import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { TRANSACTION_CONFLICT_COLUMNS } from '@/lib/market/transactionBatch';

const mocks = vi.hoisted(() => ({ from: vi.fn(), provider: vi.fn(), upsert: vi.fn(), range: vi.fn(), order: vi.fn(), limit: vi.fn(), filters: vi.fn() }));
vi.mock('@/lib/supabase-server', () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock('@/lib/market/realEstate', () => ({
  fetchApartmentTrades: mocks.provider, fetchApartmentRents: mocks.provider,
  fetchOfficetelTrades: mocks.provider, fetchOfficetelRents: mocks.provider,
  fetchApartmentSilvTrades: mocks.provider,
}));
import { GET } from './route';

const row = { id: 1, property_type: 'apt', deal_type: 'trade', lawd_cd: '11110', deal_ymd: '202610',
  deal_date: '2026-10-01', complex_name: 'fixture', complex_key: 'fixture', dong: 'dong', jibun: '',
  exclusive_area: 84, floor: 1, build_year: 2000, price_manwon: 100, deposit_manwon: 0,
  monthly_manwon: 0, cancel_yn: false, deal_channel: null, raw: {}, fetched_at: '2020-01-01T00:00:00Z' };
let cached: typeof row[];
let complexes: { complex_key: string }[];
const request = () => new NextRequest('http://localhost/api/market/transactions?lawd_cd=11110&ym=202610');

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('DATA_GO_KR_API_KEY', 'test-only');
  cached = []; complexes = [];
  mocks.provider.mockResolvedValue([]);
  mocks.upsert.mockResolvedValue({ error: null });
  mocks.from.mockImplementation((table: string) => {
    const query: Record<string, unknown> = {};
    for (const key of ['select', 'eq', 'gte', 'lte', 'in']) query[key] = (...args: unknown[]) => { mocks.filters(table, key, ...args); return query; };
    query.order = (...args: unknown[]) => { mocks.order(...args); return query; };
    query.range = (from: number, to: number) => { mocks.range(from, to); return Promise.resolve({ data: cached.slice(from, to + 1), error: null }); };
    query.limit = (n: number) => { mocks.limit(n); return Promise.resolve({ data: complexes.slice(0, n), error: null }); };
    query.upsert = mocks.upsert;
    query.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: table === 'complexes' ? complexes : cached, error: null }).then(resolve);
    return query;
  });
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe('transaction route', () => {
  it.each([
    ['2026-03-31T00:00:00Z', '2026-02-28', '2026-03-31'],
    ['2026-03-31T15:00:00Z', '2026-03-01', '2026-04-01'],
  ])('bounds use Korean dates and inclusive upper bound at %s', async (at, start, end) => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(at));
    complexes = [{ complex_key: 'fixture' }];
    const body = await (await GET(new NextRequest('http://localhost/api/market/transactions?bounds=1,2,3,4&months=1'))).json();
    expect(body.metadata).toMatchObject({ periodStart: start, periodEnd: end });
    expect(mocks.filters).toHaveBeenCalledWith('price_transactions', 'gte', 'deal_date', start);
    expect(mocks.filters).toHaveBeenCalledWith('price_transactions', 'lte', 'deal_date', end);
    expect(mocks.provider).not.toHaveBeenCalled();
  });
  it.each(['type=invalid', 'deal=invalid', 'type=officetel&deal=presale_resale'])('rejects invalid filters before either route mode: %s', async (filter) => {
    for (const mode of ['bounds=1,2,3,4', 'lawd_cd=11110&ym=202610']) {
      expect((await GET(new NextRequest(`http://localhost/api/market/transactions?${mode}&${filter}`))).status).toBe(400);
    }
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.provider).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it('deduplicates cancellation before updating the existing conflict key and hides it', async () => {
    mocks.provider.mockResolvedValue([row, { ...row, cancel_yn: true }]);
    const response = await GET(request());
    const body = await response.json();
    expect(body.transactions).toEqual([]);
    expect(mocks.upsert).toHaveBeenCalledWith([expect.objectContaining({ cancel_yn: true, fetched_at: expect.any(String) })], {
      onConflict: TRANSACTION_CONFLICT_COLUMNS.join(','), ignoreDuplicates: false,
    });
    expect(body.metadata).toMatchObject({ source: 'molit', stale: false, aggregateRefreshedAt: null });
    expect(body.metadata.collectionOldestAt).not.toBe(row.fetched_at);
  });
  it('reads 1001 cache rows in stable pages and filters cancellations', async () => {
    cached = Array.from({ length: 1001 }, (_, id) => ({ ...row, id, fetched_at: new Date().toISOString(), cancel_yn: id === 1000 }));
    const body = await (await GET(request())).json();
    expect(body.count).toBe(1000);
    expect(mocks.range.mock.calls).toEqual([[0, 999], [1000, 1999]]);
    expect(mocks.order).toHaveBeenCalledWith('id', { ascending: false });
    expect(mocks.provider).not.toHaveBeenCalled();
  });
  it('flags stale cache with missing key and never substitutes samples', async () => {
    vi.stubEnv('DATA_GO_KR_API_KEY', '');
    cached = [row, { ...row, id: 2, cancel_yn: true }];
    const body = await (await GET(request())).json();
    expect(body.count).toBe(1);
    expect(body.metadata).toMatchObject({ source: 'cache-stale', stale: true, error: expect.any(String) });
    cached = [];
    expect((await GET(request())).status).toBe(503);
  });
  it('returns 503 on provider failure without cache and exposes persistence failure', async () => {
    mocks.provider.mockRejectedValue(new Error('provider failed'));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect((await response.json()).metadata).toMatchObject({ stale: true, collectionOldestAt: null });
    mocks.provider.mockResolvedValue([row]);
    mocks.upsert.mockResolvedValue({ error: { message: 'failed' } });
    expect((await (await GET(request())).json()).metadata.persistenceError).toBeTruthy();
  });
  it('probes 501 sorted complexes, returns 500 and reports truncation', async () => {
    complexes = Array.from({ length: 501 }, (_, i) => ({ complex_key: String(i).padStart(3, '0') }));
    const body = await (await GET(new NextRequest('http://localhost/api/market/transactions?bounds=1,2,3,4'))).json();
    expect(mocks.limit).toHaveBeenCalledWith(501);
    expect(mocks.order).toHaveBeenCalledWith('complex_key', { ascending: true });
    expect(Object.keys(body.complex_coords)).toHaveLength(500);
    expect(body.metadata).toMatchObject({ truncated: true, complexLimit: 500 });
  });
});
