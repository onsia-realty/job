// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/lib/supabase-server', () => ({ supabaseAdmin: { rpc } }));

import { GET, POST } from './route';

beforeEach(() => {
  rpc.mockReset();
  vi.stubEnv('CRON_SECRET', 'cron-test-secret');
});
afterEach(() => vi.unstubAllEnvs());

describe.each([['GET', GET], ['POST', POST]] as const)('%s aggregate refresh', (method, handler) => {
  const request = (authorization?: string) => new NextRequest('https://example.test/api/cron/refresh-aggregates', {
    method,
    headers: authorization ? { authorization } : {},
  });

  it('fails closed when CRON_SECRET is absent', async () => {
    vi.stubEnv('CRON_SECRET', '');
    const response = await handler(request('Bearer '));
    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([undefined, 'Bearer wrong-secret'])('rejects unauthorized request %s before calling RPC', async (authorization) => {
    const response = await handler(request(authorization));
    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('reports success only after the refresh RPC succeeds', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    const response = await handler(request('Bearer cron-test-secret'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledExactlyOnceWith('refresh_market_aggregates');
  });

  it('returns 500 instead of a false success when RPC returns a database error', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'must be owner of materialized view' } });
    const response = await handler(request('Bearer cron-test-secret'));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.ok).not.toBe(true);
    expect(body.error).not.toContain('materialized view');
  });

  it('returns 500 when the RPC transport throws', async () => {
    rpc.mockRejectedValue(new Error('network failed'));
    const response = await handler(request('Bearer cron-test-secret'));
    expect(response.status).toBe(500);
    expect((await response.json()).ok).not.toBe(true);
  });
});
