// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

function body(productKey: string, jobId?: string, days?: number, paymentKey = 'payment-key') {
  const product = resolveProduct(productKey, days)!;
  return {
    paymentKey,
    orderId: 'order-id',
    productKey,
    ...(jobId ? { jobId } : {}),
    ...(days ? { days } : {}),
    amount: getTotalPrice(product.price),
  };
}

function tossDone(totalAmount: number, approvedAt = '2026-09-15T00:00:00.000Z') {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ status: 'DONE', totalAmount, approvedAt, method: 'CARD' }),
  } as Response);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('TOSS_SECRET_KEY', 'test-secret');
  mock.tables = { jobs: [], payments: [] };
  mock.jobUpdateError = null;
  mock.getUser.mockResolvedValue({ data: { user: { id: 'user-a' } }, error: null });
  // 필터·업데이트를 실제로 반영하는 얕은 인메모리 테이블
  mock.from.mockImplementation((table: string) => {
    let rows = [...(mock.tables[table] ?? [])];
    let operation: 'select' | 'insert' | 'update' = 'select';
    let updatePayload: Row = {};
    const filters: [string, unknown][] = [];
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn((key: string, value: unknown) => {
      filters.push([key, value]);
      rows = rows.filter((row) => row[key] === value);
      return chain;
    });
    chain.maybeSingle = vi.fn(async () => ({ data: rows[0] ?? null, error: null }));
    chain.insert = vi.fn((payload: Row) => {
      operation = 'insert';
      mock.tables[table].push(payload);
      return chain;
    });
    chain.update = vi.fn((payload: Row) => {
      operation = 'update';
      updatePayload = payload;
      return chain;
    });
    chain.then = (resolve: (value: unknown) => unknown) => {
      const error = operation === 'update' && table === 'jobs' ? mock.jobUpdateError : null;
      if (operation === 'update' && !error) {
        for (const row of mock.tables[table]) {
          if (filters.every(([k, v]) => row[k] === v)) Object.assign(row, updatePayload);
        }
      }
      return Promise.resolve({ data: operation === 'select' ? rows : null, error }).then(resolve);
    };
    return chain;
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ status: 'DONE', totalAmount: 5390, approvedAt: '2026-09-15T00:00:00.000Z', method: 'CARD' }),
  }));
});

afterEach(() => {
  vi.useRealTimers();
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
    tossDone(body(productKey, 'job-1', days).amount);

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

describe('POST /api/payment/confirm ad window', () => {
  const NOW = new Date('2026-09-15T00:00:00.000Z');
  const priorSuperior = {
    payment_id: 'older', user_id: 'user-a', job_id: 'job-1', payment_status: 'completed', tier: 'superior',
    starts_at: '2026-09-10T00:00:00.000Z', paid_at: '2026-09-10T00:00:00.000Z', expires_at: '2026-09-20T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  it('stacks a same-tier extension on the existing expiry and pulls the deadline up', async () => {
    mock.tables.jobs = [{ id: 'job-1', user_id: 'user-a', category: 'sales', tier: 'superior', deadline: '2026-09-16', is_active: false }];
    mock.tables.payments = [{ ...priorSuperior }];
    tossDone(body('sales-superior', 'job-1', 10).amount);

    const response = await POST(request(body('sales-superior', 'job-1', 10)));
    const json = await response.json();

    expect(response.status).toBe(200);
    const inserted = mock.tables.payments[1];
    expect(inserted.starts_at).toBe('2026-09-20T00:00:00.000Z');
    expect(inserted.expires_at).toBe('2026-09-30T00:00:00.000Z');
    expect(json.data.expires_at).toBe('2026-09-30T00:00:00.000Z');
    // 지금은 기존 창이 유효 → 등급 유지, 현재 창 끝. 마감일은 전체 광고 끝(KST)까지.
    expect(mock.tables.jobs[0]).toMatchObject({
      tier: 'superior',
      ad_expires_at: '2026-09-20T00:00:00.000Z',
      deadline: '2026-09-30',
      is_active: true,
    });
  });

  it('starts an upgrade immediately', async () => {
    mock.tables.jobs = [{ id: 'job-1', user_id: 'user-a', category: 'sales', tier: 'superior', deadline: '2026-12-31' }];
    mock.tables.payments = [{ ...priorSuperior }];
    tossDone(body('sales-unique', 'job-1', 10).amount);

    const response = await POST(request(body('sales-unique', 'job-1', 10)));

    expect(response.status).toBe(200);
    expect(mock.tables.payments[1]).toMatchObject({
      starts_at: '2026-09-15T00:00:00.000Z',
      expires_at: '2026-09-25T00:00:00.000Z',
    });
    // 더 늦은 마감일은 당기지 않는다
    expect(mock.tables.jobs[0]).toMatchObject({ tier: 'unique', ad_expires_at: '2026-09-25T00:00:00.000Z', deadline: '2026-12-31' });
  });

  it('sets deadline for a fresh purchase when the free +24h deadline would close the ad early', async () => {
    mock.tables.jobs = [{ id: 'job-1', user_id: 'user-a', category: 'sales', tier: 'normal', deadline: '2026-09-16' }];
    tossDone(body('sales-premium', 'job-1', 7).amount);

    const response = await POST(request(body('sales-premium', 'job-1', 7)));

    expect(response.status).toBe(200);
    expect(mock.tables.jobs[0]).toMatchObject({ tier: 'premium', ad_expires_at: '2026-09-29T00:00:00.000Z', deadline: '2026-09-29' });
  });

  it('re-confirm is idempotent (no second window, no second Toss call)', async () => {
    mock.tables.jobs = [{ id: 'job-1', user_id: 'user-a', category: 'sales', tier: 'normal', deadline: null }];
    tossDone(body('sales-superior', 'job-1', 10).amount);

    const first = await POST(request(body('sales-superior', 'job-1', 10)));
    expect(first.status).toBe(200);
    const snapshot = { ...mock.tables.jobs[0] };

    const second = await POST(request(body('sales-superior', 'job-1', 10)));
    const json = await second.json();

    expect(second.status).toBe(200);
    expect(json.message).toBe('이미 처리된 결제입니다.');
    expect(json.data.expires_at).toBe('2026-09-25T00:00:00.000Z');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mock.tables.payments).toHaveLength(1);
    expect(mock.tables.jobs[0]).toEqual(snapshot);
  });
});
