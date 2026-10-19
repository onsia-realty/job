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
import { PUBLIC_STAY_DETAIL_SELECT, PUBLIC_STAY_SELECT } from '@/lib/stay/public-dto';

const row = {
  id: 'stay-test', user_id: 'owner-test', title: 'Test stay',
  is_active: true, is_approved: true, phone: 'PRIVATE_PHONE',
  contact_name: 'PRIVATE_NAME', detail_address: 'PRIVATE_UNIT',
  kakao_url: 'PRIVATE_URL', lead_id: 12, future_private_column: 'PRIVATE_FUTURE',
  agent_phone: 'PRIVATE_LEGACY_PROFILE_PHONE', agent_reg_no: 'PUBLIC_REG',
  owner_type: 'agent', source: 'PRIVATE_SOURCE', broker_office_id: 'PRIVATE_BROKER_ID',
  agent_snapshot_at: 'PRIVATE_SNAPSHOT',
};
function result(data: unknown) {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ['select', 'eq', 'order', 'insert', 'update', 'limit']) query[method] = vi.fn(() => query);
  query.maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  query.range = vi.fn().mockResolvedValue({ data, error: null, count: 1 });
  return query;
}
function request(query = '') { return new NextRequest(`http://localhost/api/stays${query}`); }
function assertPublic(body: Record<string, unknown>) {
  for (const key of ['user_id', 'phone', 'contact_name', 'detail_address', 'kakao_url', 'lead_id', 'source', 'broker_office_id', 'agent_snapshot_at', 'future_private_column']) {
    expect(body).not.toHaveProperty(key);
  }
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
    const item = (await response.json()).items[0];
    assertPublic(item);
    expect(item).not.toHaveProperty('agent_reg_no');
    expect(item).not.toHaveProperty('agent_phone');
    expect(PUBLIC_STAY_SELECT.split(',')).not.toContain('agent_reg_no');
    expect(PUBLIC_STAY_SELECT.split(',')).not.toContain('agent_phone');
    expect(query.select).toHaveBeenCalledWith(PUBLIC_STAY_SELECT, { count: 'exact' });
  });
  it('own list retains private fields after authentication', async () => {
    mocks.verifyUser.mockResolvedValue({ id: 'owner-test' });
    const query = result([row]); mocks.from.mockReturnValue(query);
    const response = await list(request('?mine=1'));
    expect((await response.json()).items[0]).toEqual(row);
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
    const office = result({ tel_no: ' PUBLIC_OFFICE ' });
    mocks.from.mockReturnValueOnce(access).mockReturnValueOnce(query).mockReturnValueOnce(office);
    const response = await detail(request(), { params: Promise.resolve({ id: row.id }) });
    const item = await response.json();
    assertPublic(item);
    expect(item.agent_reg_no).toBe('PUBLIC_REG');
    expect(item.agent_phone).toBe('PUBLIC_OFFICE');
    expect(office.select).toHaveBeenCalledWith('tel_no');
    expect(office.eq).toHaveBeenCalledWith('estbl_reg_no', 'PUBLIC_REG');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('vary')).toBe('Authorization');
    expect(query.select).toHaveBeenCalledWith(PUBLIC_STAY_DETAIL_SELECT);
    expect(query.eq).toHaveBeenCalledWith('is_approved', true);
  });
  it.each(['list', 'detail'])('strips stale broker fields from direct-owner public %s', async (mode) => {
    const ownerRow = { ...row, owner_type: 'owner' };
    if (mode === 'list') mocks.from.mockReturnValue(result([ownerRow]));
    else mocks.from.mockReturnValue(result(ownerRow));
    const response = mode === 'list'
      ? await list(request())
      : await detail(request(), { params: Promise.resolve({ id: row.id }) });
    const body = await response.json();
    const item = mode === 'list' ? body.items[0] : body;
    expect(item).not.toHaveProperty('agent_reg_no');
    expect(item).not.toHaveProperty('agent_phone');
    expect(item.agent_office_name).toBeNull();
    expect(item.agent_office_address).toBeNull();
    expect(item.agent_representative).toBeNull();
    for (const key of ['user_id', 'phone', 'contact_name', 'detail_address', 'kakao_url', 'lead_id', 'source']) {
      expect(item).not.toHaveProperty(key);
    }
  });
  it.each(['unmatched', 'error', 'throws', 'blank'])('keeps detail but never leaks legacy private phone when office lookup %s', async (mode) => {
    const office = result(mode === 'blank' ? { tel_no: ' ' } : null);
    if (mode === 'error') office.maybeSingle.mockResolvedValue({ data: { tel_no: 'UNTRUSTED' }, error: { message: 'failed' } });
    if (mode === 'throws') office.maybeSingle.mockRejectedValue(new Error('network unavailable'));
    mocks.from.mockReturnValueOnce(result(row)).mockReturnValueOnce(result(row)).mockReturnValueOnce(office);
    const response = await detail(request(), { params: Promise.resolve({ id: row.id }) });
    expect(response.status).toBe(200);
    const item = await response.json();
    assertPublic(item);
    expect(item.agent_phone).toBeNull();
    expect(JSON.stringify(item)).not.toContain('PRIVATE_LEGACY_PROFILE_PHONE');
    expect(item.agent_reg_no).toBe('PUBLIC_REG');
  });
  it.each(['owner-test', 'admin-test'])('keeps private edit fields for %s even on public rows', async (id) => {
    mocks.verifyUser.mockResolvedValue({ id }); mocks.isAdmin.mockResolvedValue(id === 'admin-test');
    mocks.from.mockReturnValue(result(row));
    const response = await detail(request(), { params: Promise.resolve({ id: row.id }) });
    expect(await response.json()).toEqual(row);
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
