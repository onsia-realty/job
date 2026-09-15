// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ from: vi.fn(), verifyUser: vi.fn(), isAdmin: vi.fn() }));
vi.mock('@/lib/supabase-server', () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock('@/lib/auth-server', () => ({
  verifyUser: mocks.verifyUser, isAdminUserId: mocks.isAdmin, isVerifiedBusinessUser: vi.fn(),
}));
vi.mock('@/lib/stay/agent-snapshot', () => ({ buildAgentSnapshot: vi.fn() }));
import { GET as list, POST as create } from '@/app/api/stays/route';
import { GET as detail, PATCH as update } from '@/app/api/stays/[id]/route';
import { PUBLIC_STAY_SELECT } from '@/lib/stay/public-dto';

const row = {
  id: 'stay-test', user_id: 'owner-test', title: 'Test stay',
  is_active: true, is_approved: true, phone: 'PRIVATE_PHONE',
  contact_name: 'PRIVATE_NAME', detail_address: 'PRIVATE_UNIT',
  kakao_url: 'PRIVATE_URL', lead_id: 12, future_private_column: 'PRIVATE_FUTURE',
  agent_phone: 'PUBLIC_OFFICE', agent_reg_no: 'PUBLIC_REG',
};
function result(data: unknown) {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ['select', 'eq', 'order', 'insert', 'update']) query[method] = vi.fn(() => query);
  query.maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  query.range = vi.fn().mockResolvedValue({ data, error: null, count: 1 });
  return query;
}
function request(query = '') { return new NextRequest(`http://localhost/api/stays${query}`); }
function assertPublic(body: Record<string, unknown>) {
  for (const key of ['user_id', 'phone', 'contact_name', 'detail_address', 'kakao_url', 'lead_id', 'future_private_column']) {
    expect(body).not.toHaveProperty(key);
  }
  expect(body.agent_phone).toBe('PUBLIC_OFFICE');
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.verifyUser.mockResolvedValue(null);
  mocks.isAdmin.mockResolvedValue(false);
});
describe('public stays privacy boundary', () => {
  it.each([
    [{ title: 'Changed advertising' }, true],
    [{ status: 'occupied' }, false],
    [{ is_active: false }, false],
  ])('re-reviews content but preserves status-only approval: %j', async (body, requiresReview) => {
    mocks.verifyUser.mockResolvedValue({ id: 'owner-test' });
    const query = result({ ...row, owner_type: 'owner' }); mocks.from.mockReturnValue(query);
    const response = await update(new NextRequest('http://localhost/api/stays/stay-test', {
      method: 'PATCH', body: JSON.stringify(body),
    }), { params: Promise.resolve({ id: row.id }) });
    expect(response.status).toBe(200);
    const payload = query.update.mock.calls[0][0];
    if (requiresReview) expect(payload.is_approved).toBe(false);
    else expect(payload).not.toHaveProperty('is_approved');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'owner-test');
  });
  it('new listings require review even for verified hosts and discard approval injection', async () => {
    mocks.verifyUser.mockResolvedValue({ id: 'owner-test', app_metadata: { businessVerified: true } });
    const query = result({ ...row, is_approved: false }); mocks.from.mockReturnValue(query);
    const response = await create(new NextRequest('http://localhost/api/stays', {
      method: 'POST', body: JSON.stringify({
        stay_type: 'officetel', deal_type: 'short_term', title: 'Test stay',
        daily_fee_won: 50000, owner_type: 'owner', is_approved: true, user_id: 'attacker',
      }),
    }));
    expect(response.status).toBe(201);
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'owner-test', is_approved: false, agent_phone: null,
    }));
    expect((await response.json()).is_approved).toBe(false);
  });
  it('public list selects an allowlist and strips unexpected private fields', async () => {
    const query = result([row]); mocks.from.mockReturnValue(query);
    const response = await list(request());
    assertPublic((await response.json()).items[0]);
    expect(query.select).toHaveBeenCalledWith(PUBLIC_STAY_SELECT, { count: 'exact' });
  });
  it('own list retains private fields after authentication', async () => {
    mocks.verifyUser.mockResolvedValue({ id: 'owner-test' });
    const query = result([row]); mocks.from.mockReturnValue(query);
    const response = await list(request('?mine=1'));
    expect((await response.json()).items[0].user_id).toBe('owner-test');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'owner-test');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
  it('rejects unauthenticated own-list requests', async () => {
    expect((await list(request('?mine=1'))).status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it.each([null, { id: 'other-user' }])('returns only public detail to visitor %j', async (user) => {
    mocks.verifyUser.mockResolvedValue(user);
    const access = result(row), query = result(row);
    mocks.from.mockReturnValueOnce(access).mockReturnValueOnce(query);
    const response = await detail(request(), { params: Promise.resolve({ id: row.id }) });
    assertPublic(await response.json());
    expect(query.select).toHaveBeenCalledWith(PUBLIC_STAY_SELECT);
    expect(query.eq).toHaveBeenCalledWith('is_approved', true);
  });
  it.each(['owner-test', 'admin-test'])('keeps private edit fields for %s even on public rows', async (id) => {
    mocks.verifyUser.mockResolvedValue({ id }); mocks.isAdmin.mockResolvedValue(id === 'admin-test');
    mocks.from.mockReturnValue(result(row));
    const response = await detail(request(), { params: Promise.resolve({ id: row.id }) });
    expect((await response.json()).phone).toBe('PRIVATE_PHONE');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
  it('hides unpublished details from other users', async () => {
    mocks.verifyUser.mockResolvedValue({ id: 'other-user' });
    mocks.from.mockReturnValue(result({ ...row, is_approved: false }));
    expect((await detail(request(), { params: Promise.resolve({ id: row.id }) })).status).toBe(404);
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
  it('does not return a listing withdrawn between authorization and public read', async () => {
    mocks.from.mockReturnValueOnce(result(row)).mockReturnValueOnce(result(null));
    expect((await detail(request(), { params: Promise.resolve({ id: row.id }) })).status).toBe(404);
  });
});
