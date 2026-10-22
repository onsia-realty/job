// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

type Row = Record<string, unknown>;
const mock = vi.hoisted(() => ({
  getUser: vi.fn(), from: vi.fn(), rpc: vi.fn(), recompute: vi.fn(),
  tables: {} as Record<string, Row[]>, errors: {} as Record<string, unknown>,
  beforeUpdate: null as (() => void) | null,
}));
vi.mock('@/lib/supabase-server', () => ({ supabaseAdmin: { auth: { getUser: mock.getUser }, from: mock.from, rpc: mock.rpc } }));
vi.mock('@/lib/ad-entitlement', () => ({ recomputeJobAd: mock.recompute }));
import { POST as confirm } from './route';
import { POST as orders } from '../orders/route';
import { POST as webhook } from '../webhook/route';
import { GET as adminPayments } from '../../admin/payments/route';

const jobId = '11111111-1111-4111-8111-111111111111';
const order = () => ({ order_id: 'order-one', user_id: 'user-a', amount: 5390, currency: 'KRW', product_key: 'agent-basic',
  product_name: 'Snapshot name', days: 5, duration: '5일', tier: 'basic', category: 'agent', job_id: jobId,
  job_id_snapshot: jobId, payment_key: null, status: 'pending', idempotency_key: '11111111-1111-4111-8111-222222222222' });
const approved = () => ({ paymentKey: 'key', orderId: 'order-one', totalAmount: 5390, currency: 'KRW', status: 'DONE', balanceAmount: 5390, cancels: [] });
const body = () => ({ paymentKey: 'key', orderId: 'order-one', amount: 5390 });
function request(payload: unknown, auth = true) {
  return new NextRequest('http://localhost/api/payment/confirm', { method: 'POST',
    headers: { 'content-type': 'application/json', ...(auth ? { authorization: 'Bearer token' } : {}) }, body: JSON.stringify(payload) });
}
function provider(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('TOSS_SECRET_KEY', 'secret');
  vi.stubEnv('TOSS_WEBHOOK_SECRET', '');
  mock.tables = { payment_orders: [order()], payments: [], jobs: [{ id: jobId, user_id: 'user-a', category: 'agent', title: 'Job', is_active: true, is_approved: true, deadline: null }] };
  mock.errors = {};
  mock.beforeUpdate = null;
  mock.getUser.mockResolvedValue({ data: { user: { id: 'user-a' } } });
  mock.from.mockImplementation((table: string) => {
    let rows = [...(mock.tables[table] ?? [])];
    let update: Row | null = null;
    const chain = {
      select: vi.fn(() => chain), eq: vi.fn((key: string, value: unknown) => { rows = rows.filter(row => row[key] === value); return chain; }),
      is: vi.fn((key: string) => { rows = rows.filter(row => row[key] == null); return chain; }),
      maybeSingle: vi.fn(async () => ({ data: rows[0] ? { ...rows[0] } : null, error: mock.errors[table] ?? null })),
      order: vi.fn(() => chain), limit: vi.fn(() => chain), gte: vi.fn(() => chain),
      insert: vi.fn((payload: Row) => { if (!mock.errors[table]) mock.tables[table].push(payload); return chain; }),
      update: vi.fn((payload: Row) => { mock.beforeUpdate?.(); update = payload; return chain; }),
      then: (resolve: (value: unknown) => unknown) => {
        if (update && !mock.errors[table]) rows.forEach(row => Object.assign(row, update));
        return Promise.resolve({ data: rows, error: mock.errors[table] ?? null }).then(resolve);
      },
    };
    return chain;
  });
  mock.rpc.mockImplementation(async (name: string) => ({ data: name === 'apply_payment_order'
    ? { payment_status: 'completed', starts_at: '2026-10-16T00:00:00Z', expires_at: '2026-10-21T00:00:00Z' } : order(), error: null }));
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => provider(approved())));
});

describe('server payment orders', () => {
  it('requires authentication', async () => expect((await orders(request({ productKey: 'agent-basic' }, false))).status).toBe(401));
  it.each([{ productKey: 'sales-dia' }, { productKey: 'agent-basic', days: '5' }, { productKey: 'agent-basic', days: null },
    { productKey: 'agent-basic', jobId: 1 }, { productKey: 'agent-basic', jobId: 'invalid' }, { productKey: 5 }])('rejects invalid purchase %j', async payload => {
    expect((await orders(request(payload))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('creates a VAT-inclusive immutable server snapshot for an approved active job with independent UUIDs', async () => {
    const response = await orders(request({ productKey: 'agent-basic', jobId }));
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(mock.tables.payment_orders[1]).toMatchObject({ amount: 5390, job_id_snapshot: jobId, job_title: 'Job', exposure_days: 5, user_id: 'user-a' });
    expect(mock.tables.payment_orders[1].order_id).not.toBe(mock.tables.payment_orders[1].idempotency_key);
    expect(json.data).not.toHaveProperty('idempotency_key');
    expect(json.data).not.toHaveProperty('user_id');
  });
  it.each([undefined, null, '', '   ', 'invalid', 1])('rejects missing or invalid target %j without inserting', async jobId => {
    expect((await orders(request({ productKey: 'agent-basic', jobId }))).status).toBe(400);
    expect(mock.tables.payment_orders).toHaveLength(1);
    expect(mock.from).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects a nonexistent job without inserting', async () => {
    mock.tables.jobs = [];
    expect((await orders(request({ productKey: 'agent-basic', jobId }))).status).toBe(404);
    expect(mock.tables.payment_orders).toHaveLength(1);
  });
  it.each([{ is_active: false }, { is_active: null }, { deadline: '2000-01-01' }])('rejects an ineligible job %j', async patch => {
    Object.assign(mock.tables.jobs[0], patch);
    expect((await orders(request({ productKey: 'agent-basic', jobId }))).status).toBe(400);
    expect(mock.tables.payment_orders).toHaveLength(1);
  });
  it('fails closed on job lookup failure', async () => {
    mock.errors.jobs = new Error('unavailable');
    expect((await orders(request({ productKey: 'agent-basic', jobId }))).status).toBe(503);
    expect(mock.tables.payment_orders).toHaveLength(1);
  });
  it.each([false, null, undefined])('rejects an active unapproved job (%s) before order insertion or provider calls', async is_approved => {
    mock.tables.jobs[0].is_approved = is_approved;
    const response = await orders(request({ productKey: 'agent-basic', jobId }));
    expect(response.status).toBe(400);
    expect((await response.json()).message).toContain('승인된 활성 공고');
    expect(mock.tables.payment_orders).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it('keeps DIA disabled even with an owned eligible sales job', async () => {
    mock.tables.jobs[0].category = 'sales';
    expect((await orders(request({ productKey: 'sales-dia', jobId }))).status).toBe(400);
    expect(mock.tables.payment_orders).toHaveLength(1);
  });
  it('rejects another owner', async () => {
    mock.tables.jobs[0].user_id = 'other';
    expect((await orders(request({ productKey: 'agent-basic', jobId }))).status).toBe(403);
    expect(mock.tables.payment_orders).toHaveLength(1);
  });
  it('rejects category mismatch', async () => {
    mock.tables.jobs[0].category = 'sales';
    expect((await orders(request({ productKey: 'agent-basic', jobId }))).status).toBe(400);
    expect(mock.tables.payment_orders).toHaveLength(1);
  });
  it('fails closed without order migration', async () => {
    mock.errors.payment_orders = new Error('missing relation');
    expect((await orders(request({ productKey: 'agent-basic', jobId }))).status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('snapshot confirmation and recovery', () => {
  it('preserves confirmation of an existing order even when its job is now unapproved', async () => {
    mock.tables.jobs[0].is_approved = false;
    expect((await confirm(request(body()))).status).toBe(200);
    expect(mock.rpc).toHaveBeenCalledWith('apply_payment_order', expect.anything());
  });
  it('still confirms an existing unattached order', async () => {
    Object.assign(mock.tables.payment_orders[0], { job_id: null, job_id_snapshot: null });
    const response = await confirm(request(body()));
    expect(response.status).toBe(200);
    expect((await response.json()).data.jobId).toBeNull();
    expect(mock.rpc).toHaveBeenCalledWith('apply_payment_order', expect.anything());
  });
  it('still recovers an unattached paid legacy record without provider approval', async () => {
    mock.tables.payment_orders = [];
    mock.tables.payments = [{ payment_id: 'key', user_id: 'user-a', amount: 5390, payment_status: 'completed', job_id: null, job_id_snapshot: null }];
    expect((await confirm(request(body()))).status).toBe(200);
    expect(mock.recompute).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('requires authentication', async () => expect((await confirm(request(body(), false))).status).toBe(401));
  it('rejects unknown orders before provider approval', async () => {
    mock.tables.payment_orders = [];
    expect((await confirm(request(body()))).status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([{ amount: 1 }, { productKey: 'sales-premium' }, { days: 7 }, { jobId: 'different' }])('rejects tampered snapshot hints %j', async patch => {
    expect((await confirm(request({ ...body(), ...patch }))).status).toBe(409);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('uses original price and name even after product is disabled or changed', async () => {
    Object.assign(mock.tables.payment_orders[0], { product_key: 'sales-dia', product_name: 'Old product', amount: 12345 });
    vi.mocked(fetch).mockResolvedValue(provider({ ...approved(), totalAmount: 12345 }));
    const response = await confirm(request({ ...body(), amount: 12345 }));
    expect(response.status).toBe(200);
    expect((await response.json()).data.productName).toBe('Old product');
  });
  it('rejects a different payment key without provider calls', async () => {
    mock.tables.payment_orders[0].payment_key = 'another';
    expect((await confirm(request(body()))).status).toBe(409);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('claims before networking and uses the server idempotency key for approval', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(provider({}, 404)).mockResolvedValueOnce(provider(approved()));
    expect((await confirm(request(body()))).status).toBe(200);
    expect(mock.rpc.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(fetch).mock.invocationCallOrder[0]);
    expect(vi.mocked(fetch).mock.calls[1][1]).toMatchObject({ method: 'POST', headers: { 'Idempotency-Key': order().idempotency_key } });
  });
  it('recovers a confirmation timeout with verified GET', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(provider({}, 404)).mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce(provider(approved()));
    expect((await confirm(request(body()))).status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it.each([{ paymentKey: 'other' }, { orderId: 'other' }, { totalAmount: 1 }, { currency: 'USD' }])('rejects provider identity mismatch %j', async patch => {
    vi.mocked(fetch).mockResolvedValue(provider({ ...approved(), ...patch }));
    expect((await confirm(request(body()))).status).toBe(409);
    expect(mock.rpc).not.toHaveBeenCalledWith('apply_payment_order', expect.anything());
  });
  it('returns retryable failure on atomic apply failure then recovers the same order', async () => {
    mock.rpc.mockResolvedValueOnce({ data: order(), error: null }).mockResolvedValueOnce({ data: null, error: new Error('insert failed') });
    const failed = await confirm(request(body()));
    expect(failed.status).toBe(503);
    expect((await failed.json()).retryable).toBe(true);
    expect((await confirm(request(body()))).status).toBe(200);
    expect(vi.mocked(fetch).mock.calls.every(([, options]) => options?.method !== 'POST')).toBe(true);
  });
  it('reconfirms without a second provider charge', async () => {
    expect((await confirm(request(body()))).status).toBe(200);
    mock.tables.payment_orders[0].status = 'completed';
    mock.tables.payment_orders[0].payment_key = 'key';
    expect((await confirm(request(body()))).status).toBe(200);
    expect(vi.mocked(fetch).mock.calls.every(([, options]) => options?.method !== 'POST')).toBe(true);
  });
  it('reports a concurrent key claim conflict without provider calls', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { code: '23505' } });
    expect((await confirm(request(body()))).status).toBe(409);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('replays a persisted legacy payment without current catalog or provider approval', async () => {
    mock.tables.payment_orders = [];
    mock.tables.payments = [{ payment_id: 'key', user_id: 'user-a', amount: 5390, product_key: 'disabled-old', payment_status: 'completed', job_id: jobId }];
    expect((await confirm(request({ ...body(), productKey: 'disabled-old' }))).status).toBe(200);
    expect(mock.recompute).toHaveBeenCalledWith(expect.anything(), jobId);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('verified webhook reconciliation', () => {
  const event = () => request({ data: { paymentKey: 'key' } });
  it('accepts native missing custom header only after provider identity verification', async () => {
    vi.stubEnv('TOSS_WEBHOOK_SECRET', 'custom-proxy-secret');
    mock.tables.payment_orders[0].payment_key = 'key';
    expect((await webhook(event())).status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('rejects an explicitly wrong custom proxy secret before provider calls', async () => {
    vi.stubEnv('TOSS_WEBHOOK_SECRET', 'custom-proxy-secret');
    const req = event();
    req.headers.set('x-webhook-secret', 'wrong');
    expect((await webhook(req)).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('does not bind an unclaimed order', async () => {
    expect((await webhook(event())).status).toBe(409);
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it.each(['DONE', 'PARTIAL_CANCELED', 'CANCELED', 'ABORTED', 'EXPIRED'])('reconciles bound %s even if payment insertion was missing', async status => {
    mock.tables.payment_orders[0].payment_key = 'key';
    vi.mocked(fetch).mockResolvedValue(provider({ ...approved(), status, ...(status === 'PARTIAL_CANCELED' ? { balanceAmount: 4390 } : {}) }));
    expect((await webhook(event())).status).toBe(200);
    expect(mock.rpc).toHaveBeenCalledWith('apply_payment_order', expect.objectContaining({ p_order_id: 'order-one', p_payment_key: 'key', p_provider: expect.objectContaining({ status }) }));
  });
  it('returns non-2xx for unknown status', async () => {
    vi.mocked(fetch).mockResolvedValue(provider({ ...approved(), status: 'NEW_STATUS' }));
    expect((await webhook(event())).status).toBe(400);
  });
  it('returns non-2xx on DB failure for provider retry', async () => {
    mock.tables.payment_orders[0].payment_key = 'key';
    mock.rpc.mockResolvedValue({ data: null, error: new Error('DB down') });
    expect((await webhook(event())).status).toBe(503);
  });
  it('persists full partial refund history and recomputes legacy entitlement', async () => {
    mock.tables.payment_orders = [];
    mock.tables.payments = [{ payment_id: 'key', job_id: jobId, amount: 5390, currency: 'KRW', payment_status: 'completed' }];
    const cancels = [{ transactionKey: 'refund-1', cancelAmount: 1000 }];
    vi.mocked(fetch).mockResolvedValue(provider({ ...approved(), status: 'PARTIAL_CANCELED', balanceAmount: 4390, cancels }));
    expect((await webhook(event())).status).toBe(200);
    expect(mock.tables.payments[0]).toMatchObject({ payment_status: 'completed', provider_status: 'PARTIAL_CANCELED', balance_amount: 4390, cancels });
    expect(mock.recompute).toHaveBeenCalled();
  });
  it('persists full refund and revokes only through entitlement recomputation', async () => {
    mock.tables.payment_orders = [];
    mock.tables.payments = [{ payment_id: 'key', job_id: jobId, amount: 5390, currency: 'KRW', payment_status: 'completed' }];
    vi.mocked(fetch).mockResolvedValue(provider({ ...approved(), status: 'CANCELED', balanceAmount: 0 }));
    expect((await webhook(event())).status).toBe(200);
    expect(mock.tables.payments[0].payment_status).toBe('refunded');
    expect(mock.recompute).toHaveBeenCalled();
  });
  it.each(['READY', 'IN_PROGRESS', 'WAITING_FOR_DEPOSIT', 'EXPIRED', 'ABORTED'])('rejects legacy completed regression to %s', async status => {
    mock.tables.payment_orders = [];
    mock.tables.payments = [{ payment_id: 'key', amount: 5390, currency: 'KRW', payment_status: 'completed' }];
    vi.mocked(fetch).mockResolvedValue(provider({ ...approved(), status }));
    expect((await webhook(event())).status).toBe(409);
    expect(mock.tables.payments[0].payment_status).toBe('completed');
  });
  it('rejects stale DONE after a persisted partial refund', async () => {
    mock.tables.payment_orders = [];
    mock.tables.payments = [{ payment_id: 'key', amount: 5390, currency: 'KRW', payment_status: 'completed', provider_status: 'PARTIAL_CANCELED', balance_amount: 4390 }];
    expect((await webhook(event())).status).toBe(409);
    expect(mock.tables.payments[0].balance_amount).toBe(4390);
  });
  it('rejects malformed partial refund balance and inherited status keys', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(provider({ ...approved(), status: 'PARTIAL_CANCELED', balanceAmount: undefined }))
      .mockResolvedValueOnce(provider({ ...approved(), status: '__proto__' }));
    expect((await webhook(event())).status).toBe(400);
    expect((await webhook(event())).status).toBe(400);
  });
  it('does not overwrite a concurrent full refund with a stale DONE read', async () => {
    mock.tables.payment_orders = [];
    mock.tables.payments = [{ payment_id: 'key', amount: 5390, currency: 'KRW', payment_status: 'completed', provider_status: 'DONE', balance_amount: 5390 }];
    mock.beforeUpdate = () => { Object.assign(mock.tables.payments[0], { payment_status: 'refunded', provider_status: 'CANCELED', balance_amount: 0 }); };
    expect((await webhook(event())).status).toBe(503);
    expect(mock.tables.payments[0]).toMatchObject({ payment_status: 'refunded', provider_status: 'CANCELED', balance_amount: 0 });
  });
});

describe('admin payment revenue', () => {
  it('counts remaining partial-refund balance, includes legacy amount, and excludes full refunds', async () => {
    mock.tables.users = [{ id: 'user-a', user_type: 'admin' }];
    mock.tables.payments = [
      { payment_status: 'completed', amount: 5390, balance_amount: 4390, job_title: 'Deleted job snapshot' },
      { payment_status: 'completed', amount: 1000, balance_amount: null },
      { payment_status: 'refunded', amount: 2000, balance_amount: 0 },
    ];
    const response = await adminPayments(request({}));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.stats.totalRevenue).toBe(5390);
    expect(json.stats.monthRevenue).toBe(5390);
    expect(json.payments[0].job_title).toBe('Deleted job snapshot');
  });
});
