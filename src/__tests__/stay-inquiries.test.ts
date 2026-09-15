// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ user: vi.fn(), admin: vi.fn(), from: vi.fn() }));
vi.mock('@/lib/auth-server', () => ({ verifyUser: mocks.user, isAdminUserId: mocks.admin }));
vi.mock('@/lib/supabase-server', () => ({ supabaseAdmin: { from: mocks.from } }));
import { GET, POST, PATCH } from '@/app/api/stay-inquiries/route';
const stayId = '11111111-1111-4111-8111-111111111111';
const request = (method: string, body?: object) => new NextRequest('http://localhost/api/stay-inquiries', { method, ...(body ? { body: JSON.stringify(body) } : {}) });
const inquiry = { stay_id: stayId, message: '입주 가능한 날짜를 확인하고 싶습니다.', consent: true };
function chain(result: object) {
  const q: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ['select', 'eq', 'or', 'order', 'limit', 'gte', 'update']) q[method] = vi.fn(() => q);
  q.maybeSingle = vi.fn(async () => result);
  q.then = vi.fn((resolve: (r: object) => unknown) => Promise.resolve(result).then(resolve));
  return q;
}
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: 'guest' }); mocks.admin.mockResolvedValue(false); });
describe('stay inquiry boundaries', () => {
  it('requires authentication for every action', async () => {
    mocks.user.mockResolvedValue(null);
    expect((await GET(request('GET'))).status).toBe(401);
    expect((await POST(request('POST', inquiry))).status).toBe(401);
    expect((await PATCH(request('PATCH', {}))).status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it.each([null, { user_id: null, is_active: true, is_approved: true }, { user_id: 'host', is_active: false, is_approved: true }, { user_id: 'host', is_active: true, is_approved: false }, { user_id: 'host', is_active: true, is_approved: true, status: 'occupied' }])('rejects unavailable listings', async stay => {
    mocks.from.mockReturnValue(chain({ data: stay, error: null }));
    expect((await POST(request('POST', inquiry))).status).toBe(404);
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
  it('requires explicit sharing consent', async () => {
    expect((await POST(request('POST', { ...inquiry, consent: false }))).status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('applies participant filter and strips host identity', async () => {
    const q = chain({ data: [{ id: 'inquiry', host_id: 'host', stays: { title: '집' } }], error: null }); mocks.from.mockReturnValue(q);
    const response = await GET(request('GET'));
    expect(q.or).toHaveBeenCalledWith('guest_id.eq.guest,host_id.eq.guest');
    expect(await response.text()).not.toContain('host_id');
  });
  it('rejects reply by unrelated user through host filter', async () => {
    const q = chain({ data: null, error: null }); mocks.from.mockReturnValue(q);
    expect((await PATCH(request('PATCH', { id: stayId, reply: '답변' }))).status).toBe(403);
    expect(q.eq).toHaveBeenCalledWith('host_id', 'guest');
  });
  it('returns service error when migration is missing, never success', async () => {
    mocks.from.mockReturnValue(chain({ data: null, error: { code: '42P01' } }));
    expect((await GET(request('GET'))).status).toBe(503);
  });
});
