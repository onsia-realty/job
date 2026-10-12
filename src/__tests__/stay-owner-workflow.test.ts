// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  user: vi.fn(), admin: vi.fn(), rpc: vi.fn(), from: vi.fn(),
}));
vi.mock('@/lib/auth-server', () => ({ verifyUser: mocks.user, verifyAdmin: mocks.admin }));
vi.mock('@/lib/supabase-server', () => ({ supabaseAdmin: { rpc: mocks.rpc, from: mocks.from } }));

import { GET as mine, POST as intake, PATCH as confirm } from '@/app/api/stay-owner-leads/route';
import { POST as createDraft } from '@/app/api/admin/stay-leads/route';
import { PATCH as reviewStay } from '@/app/api/admin/stays/[id]/route';

function request(path: string, body?: Record<string, unknown>, method = body ? 'POST' : 'GET') {
  return new NextRequest(`http://localhost${path}`, {
    method, headers: { 'content-type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

const validIntake = {
  name: '홍길동', phone: '01012345678', address: '서울시 중구 세종대로 1',
  privacy_agreed: true, publication_agreed: true,
};
const validStay = {
  stay_type: 'officetel', deal_type: 'short_term', title: '운영자 작성 초안',
  weekly_fee_won: 500_000, owner_type: 'agent',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: 'host-a' });
  mocks.admin.mockResolvedValue({ id: 'admin-a' });
  mocks.rpc.mockResolvedValue({ data: {}, error: null });
});

describe('owner intake authorization and consent', () => {
  it('does not reveal or query another applicant when unauthenticated', async () => {
    mocks.user.mockResolvedValue(null);
    expect((await mine(request('/api/stay-owner-leads'))).status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('scopes the private lead query to the authenticated applicant', async () => {
    const query: Record<string, unknown> = {};
    query.select = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.order = vi.fn(() => query);
    query.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve);
    mocks.from.mockReturnValue(query);
    const response = await mine(request('/api/stay-owner-leads'));
    expect(response.status).toBe(200);
    expect(query.eq).toHaveBeenCalledWith('applicant_user_id', 'host-a');
  });

  it.each(['privacy_agreed', 'publication_agreed'] as const)('rejects false %s before database access', async field => {
    const response = await intake(request('/api/stay-owner-leads', { ...validIntake, [field]: false }));
    expect(response.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('binds confirmation to the authenticated applicant and ignores forged identity fields', async () => {
    mocks.rpc.mockResolvedValue({ data: { lead_id: 7 }, error: null });
    await confirm(request('/api/stay-owner-leads', {
      id: 7, action: 'confirm', stay_updated_at: '2026-09-15T00:00:00.000Z',
      applicant_user_id: 'victim',
    }, 'PATCH'));
    expect(mocks.rpc).toHaveBeenCalledWith('confirm_stay_owner_draft', {
      p_lead_id: 7, p_applicant_user_id: 'host-a',
      p_expected_stay_updated_at: '2026-09-15T00:00:00.000Z',
    });
  });

  it('fails closed when the workflow migration is absent', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'function missing' } });
    const response = await intake(request('/api/stay-owner-leads', validIntake));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'MIGRATION_REQUIRED' });
  });
});

describe('delegated draft and approval boundary', () => {
  it('never passes a client-selected owner or server-controlled identity to draft RPC', async () => {
    mocks.rpc.mockResolvedValue({ data: { id: 'draft-a', user_id: 'host-a' }, error: null });
    const response = await createDraft(request('/api/admin/stay-leads', {
      lead_id: 7,
      stay: { ...validStay, user_id: 'victim', source: 'self', lead_id: 999, is_approved: true },
    }));
    expect(response.status).toBe(201);
    const args = mocks.rpc.mock.calls[0][1];
    expect(args.p_stay).not.toHaveProperty('owner_type');
    for (const field of ['user_id', 'source', 'lead_id', 'is_approved']) {
      expect(args.p_stay).not.toHaveProperty(field);
    }
    expect(args).toMatchObject({ p_lead_id: 7, p_admin_user_id: 'admin-a' });
  });

  it('reports duplicate draft conversion without attempting a fallback insert', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'ALREADY_CONVERTED' } });
    const response = await createDraft(request('/api/admin/stay-leads', { lead_id: 7, stay: validStay }));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: 'ALREADY_CONVERTED' });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it.each([
    ['OWNER_CONFIRMATION_REQUIRED', 'OWNER_CONFIRMATION_REQUIRED'],
    ['DRAFT_CHANGED', 'DRAFT_CHANGED'],
  ])('keeps delegated approval blocked when RPC reports %s', async (message, code) => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message } });
    const response = await reviewStay(request('/api/admin/stays/draft-a', { is_approved: true }, 'PATCH'),
      { params: Promise.resolve({ id: 'draft-a' }) });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code });
  });

  it.each([null, [], 'approve'])('rejects malformed admin patch body %j', async body => {
    const response = await reviewStay(new NextRequest('http://localhost/api/admin/stays/draft-a', {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    }), { params: Promise.resolve({ id: 'draft-a' }) });
    expect(response.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
