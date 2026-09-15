// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

type Row = Record<string, unknown>;

const mock = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  tables: {} as Record<string, Row[]>,
  jobUpdateError: null as Error | null,
}));

vi.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: { auth: { getUser: mock.getUser }, from: mock.from },
}));

import { POST } from './route';
import { getTotalPrice, resolveProduct } from '@/lib/toss';

function request(body: Row) {
  return new NextRequest('http://localhost/api/payment/confirm', {
    method: 'POST',
    headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function body(productKey: string, jobId?: string, days?: number) {
  const product = resolveProduct(productKey, days)!;
  return {
    paymentKey: 'payment-key',
    orderId: 'order-id',
    productKey,
    ...(jobId ? { jobId } : {}),
    ...(days ? { days } : {}),
    amount: getTotalPrice(product.price),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('TOSS_SECRET_KEY', 'test-secret');
  mock.tables = { jobs: [], payments: [] };
  mock.jobUpdateError = null;
  mock.getUser.mockResolvedValue({ data: { user: { id: 'user-a' } }, error: null });
  mock.from.mockImplementation((table: string) => {
    let rows = [...(mock.tables[table] ?? [])];
    let operation: 'select' | 'insert' | 'update' = 'select';
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn((key: string, value: unknown) => {
      rows = rows.filter((row) => row[key] === value);
      return chain;
    });
    chain.maybeSingle = vi.fn(async () => ({ data: rows[0] ?? null, error: null }));
    chain.insert = vi.fn((payload: Row) => {
      operation = 'insert';
      mock.tables[table].push(payload);
      return chain;
    });
    chain.update = vi.fn(() => {
      operation = 'update';
      return chain;
    });
    chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve({
      data: null,
      error: operation === 'update' && table === 'jobs' ? mock.jobUpdateError : null,
    }).then(resolve);
    return chain;
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ status: 'DONE', totalAmount: 5390, approvedAt: '2026-09-15T00:00:00.000Z', method: 'CARD' }),
  }));
});

describe('POST /api/payment/confirm product and job integrity', () => {
  it.each([
    ['sales job with agent product', 'sales', 'agent-basic'],
    ['agent job with sales product', 'agent', 'sales-premium'],
    ['job with null category', null, 'agent-basic'],
  ])('rejects %s before Toss confirm', async (_name, category, productKey) => {
    mock.tables.jobs = [{ id: 'job-1', user_id: 'user-a', category, tier: 'normal' }];

    const response = await POST(request(body(productKey as string, 'job-1', productKey === 'sales-premium' ? 7 : undefined)));

    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects sales-dia on the server before Toss confirm', async () => {
    const response = await POST(request(body('sales-dia', undefined, 20)));

    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['agent', 'agent-basic', undefined],
    ['sales', 'sales-premium', 7],
  ] as const)('keeps valid %s job and product combinations working', async (category, productKey, days) => {
    mock.tables.jobs = [{ id: 'job-1', user_id: 'user-a', category, tier: 'normal' }];
    const expectedAmount = body(productKey, 'job-1', days).amount;
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'DONE', totalAmount: expectedAmount, approvedAt: '2026-09-15T00:00:00.000Z', method: 'CARD' }),
    } as Response);

    const response = await POST(request(body(productKey, 'job-1', days)));

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns non-2xx when the job tier update fails after payment insertion', async () => {
    mock.tables.jobs = [{ id: 'job-1', user_id: 'user-a', category: 'agent', tier: 'normal' }];
    mock.jobUpdateError = new Error('update failed');

    const response = await POST(request(body('agent-basic', 'job-1')));

    expect(response.status).toBe(500);
    expect(mock.tables.payments).toHaveLength(1);
  });
});
