// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const db = vi.hoisted(() => ({ from: vi.fn(), getUser: vi.fn(), rpc: vi.fn(), updateUserById: vi.fn() }));
vi.mock('@/lib/supabase-server', () => ({ supabaseAdmin: { from: db.from, rpc: db.rpc, auth: { getUser: db.getUser, admin: { updateUserById: db.updateUserById } } } }));
vi.mock('@/lib/danal', () => ({ getConfirmedVerificationByToken: vi.fn(), isDiTaken: vi.fn(), markVerificationConsumed: vi.fn() }));
vi.mock('@/lib/stay/agent-snapshot', () => ({ buildAgentSnapshot: vi.fn().mockResolvedValue(null) }));
import { GET as resumeGet } from '@/app/api/resumes/[id]/route';
import { GET as jobGet, PATCH as jobPatch, DELETE as jobDelete } from '@/app/api/jobs/[id]/route';
import { POST as jobPost } from '@/app/api/jobs/route';
import { POST as applyPost } from '@/app/api/jobs/[id]/apply/route';
import { GET as applicantsGet, PATCH as applicantsPatch } from '@/app/api/jobs/[id]/applicants/route';
import { GET as stayGet, PATCH as stayPatch, DELETE as stayDelete } from '@/app/api/stays/[id]/route';
import { GET as staysGet, POST as stayPost } from '@/app/api/stays/route';
import { GET as adminPayments } from '@/app/api/admin/payments/route';
import { GET as myPayments } from '@/app/api/payments/my/route';
import { POST as confirmPost } from '@/app/api/payment/confirm/route';
import { POST as webhookPost } from '@/app/api/payment/webhook/route';
import { getTotalPrice, resolveProduct } from '@/lib/toss';
import { POST as jobView } from '@/app/api/jobs/[id]/view/route';
import { POST as stayView } from '@/app/api/stays/[id]/view/route';
import { POST as completeProfile } from '@/app/api/auth/complete-profile/route';

type Row = Record<string, unknown>;
let tables: Record<string, Row[]>;
let writes: { table: string; payload: Row }[];
const params = { params: Promise.resolve({ id: 'item' }) };
function request(path: string, user?: string, body?: Row, method = body ? 'POST' : 'GET') {
  return new NextRequest(`http://localhost${path}`, { method,
    headers: { ...(user ? { authorization: `Bearer ${user}` } : {}), 'content-type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  tables = { users: [{ id: 'A', user_type: 'seeker' }, { id: 'B', user_type: 'seeker' }, { id: 'admin', user_type: 'admin' }],
    jobs: [{ id: 'item', user_id: 'A', category: 'agent', is_active: true, is_approved: true, tier: 'premium' }],
    stays: [{ id: 'item', user_id: 'A', is_active: false, is_approved: false }],
    resumes: [{ id: 'item', user_id: 'A', is_public: false, phone: 'private' }], applications: [], payments: [] };
  writes = [];
  db.rpc.mockResolvedValue({ error: { message: 'missing RPC' } });
  db.getUser.mockImplementation(async (id: string) => ({ data: { user: { id, user_metadata: { brokerVerified: true }, app_metadata: {} } }, error: null }));
  db.from.mockImplementation((table: string) => {
    let rows = [...(tables[table] || [])];
    const chain: Record<string, unknown> = {};
    const result = () => ({ data: rows, error: null, count: rows.length });
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn((key: string, value: unknown) => { rows = rows.filter(r => r[key] === value); return chain; });
    chain.in = vi.fn((key: string, values: unknown[]) => { rows = rows.filter(r => values.includes(r[key])); return chain; });
    for (const method of ['order', 'limit', 'range', 'not', 'gte']) chain[method] = vi.fn(() => chain);
    chain.insert = vi.fn((payload: Row) => { writes.push({ table, payload }); rows = [payload]; return chain; });
    chain.update = vi.fn((payload: Row) => { writes.push({ table, payload }); return chain; });
    chain.delete = vi.fn(() => { writes.push({ table, payload: {} }); return chain; });
    chain.maybeSingle = vi.fn(async () => ({ data: rows[0] ?? null, error: null }));
    chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve);
    return chain;
  });
});

describe('private rows and ownership', () => {
  it.each([undefined, 'B', 'admin'])('hides private resume from unrelated %s', async user => {
    const response = await resumeGet(request('/api/resumes/item', user), params);
    expect(response.status).toBe(user ? 404 : 401);
    expect(await response.text()).not.toContain('private');
  });
  it('permits own and explicitly public resumes', async () => {
    expect((await resumeGet(request('/api/resumes/item', 'A'), params)).status).toBe(200);
    tables.resumes[0].is_public = true;
    expect((await resumeGet(request('/api/resumes/item', 'B'), params)).status).toBe(200);
  });
  it('permits private resume submitted to requester owned job only', async () => {
    tables.applications.push({ id: 'app', resume_id: 'item', user_id: 'A', 'jobs.user_id': 'B' });
    expect((await resumeGet(request('/api/resumes/item', 'B'), params)).status).toBe(200);
    tables.applications[0].user_id = 'forged';
    expect((await resumeGet(request('/api/resumes/item', 'B'), params)).status).toBe(404);
  });
  it.each([[undefined, 404], ['B', 404], ['A', 200], ['admin', 200]] as const)('private stay access %s', async (user, status) => {
    expect((await stayGet(request('/api/stays/item', user), params)).status).toBe(status);
  });
  it('lists only public stays or authenticated own stays', async () => {
    expect((await staysGet(request('/api/stays?mine=1'))).status).toBe(401);
    expect((await (await staysGet(request('/api/stays'))).json()).items).toEqual([]);
    expect((await (await staysGet(request('/api/stays?mine=1', 'B'))).json()).items).toEqual([]);
    expect((await (await staysGet(request('/api/stays?mine=1', 'A'))).json()).items).toHaveLength(1);
  });
  it.each([undefined, 'B', 'admin'])('denies nonowner mutations %s', async user => {
    for (const handler of [jobPatch, stayPatch]) expect((await handler(request('/item', user, { title: 'changed' }, 'PATCH'), params)).status).toBe(user ? 403 : 401);
    for (const handler of [jobDelete, stayDelete]) expect((await handler(request('/item', user, undefined, 'DELETE'), params)).status).toBe(user ? 403 : 401);
    expect(writes).toEqual([]);
  });
  it('hides unapproved jobs while preserving owner edit read', async () => {
    tables.jobs[0].is_approved = false;
    expect((await jobGet(request('/api/jobs/item'), params)).status).toBe(404);
    expect((await jobGet(request('/api/jobs/item?mine=true', 'A'), params)).status).toBe(200);
  });
  it('rejects borrowed resume and unapproved application targets', async () => {
    expect((await applyPost(request('/item/apply', 'B', { resumeId: 'item' }), params)).status).toBe(403);
    tables.jobs[0].is_approved = false;
    expect((await applyPost(request('/item/apply', 'A', { resumeId: 'item' }), params)).status).toBe(404);
    expect(writes).toEqual([]);
  });
  it('does not attach unsubmitted or wrongly owned resumes to applicants', async () => {
    tables.applications = [{ id: 'one', job_id: 'item', user_id: 'B', resume_id: 'item' }, { id: 'two', job_id: 'item', user_id: 'A', resume_id: null }];
    const response = await applicantsGet(request('/item/applicants', 'A'), params);
    expect((await response.json()).map((r: Row) => r.resume)).toEqual([null, null]);
  });
  it('rejects unsupported application status values', async () => {
    const response = await applicantsPatch(
      request('/item/applicants', 'A', { applicationId: 'app', status: 'admin_override' }, 'PATCH'),
      params
    );
    expect(response.status).toBe(400);
    expect(writes).toEqual([]);
  });
});

describe('server controlled fields and payments', () => {
  it('rejects missing trusted office snapshot on agent create and update', async () => {
    const response = await stayPost(request('/api/stays', 'A', { title: 'stay', stay_type: 'officetel', deal_type: 'short_term', owner_type: 'agent', daily_fee_won: 50000 }));
    expect(response.status).toBe(403);
    expect((await stayPatch(request('/item', 'A', { owner_type: 'agent' }, 'PATCH'), params)).status).toBe(403);
    expect(writes).toEqual([]);
  });
  it('view fallbacks never update unapproved rows', async () => {
    tables.jobs[0].is_approved = false;
    await jobView(request('/item/view'), params);
    await stayView(request('/item/view'), params);
    expect(writes).toEqual([]);
    expect(db.rpc).toHaveBeenCalledWith('increment_public_job_views', { job_id: 'item' });
  });
  it('profile completion rejects missing public user instead of setting completed metadata', async () => {
    tables.users = [];
    const response = await completeProfile(request('/api/auth/complete-profile', 'A', { name: '홍길동', nickname: '테스트', phone: '01012345678', role: 'admin' }));
    expect(response.status).toBe(409);
    expect(db.updateUserById).not.toHaveBeenCalled();
    expect(writes[0].payload.user_type).toBe('seeker');
  });
  it('strips stay approval/ownership injection despite forged user metadata', async () => {
    const response = await stayPost(request('/api/stays', 'A', { title: 'stay', stay_type: 'officetel', deal_type: 'short_term', owner_type: 'owner', daily_fee_won: 50000, user_id: 'B', is_approved: true, views: 999, agent_reg_no: 'forged' }));
    expect(response.status).toBe(201);
    expect(writes[0].payload).toMatchObject({ user_id: 'A', is_approved: false, views: 0, agent_reg_no: null });
  });
  it('strips job time/paid/ownership injection and retains actual form fields', async () => {
    const response = await jobPost(request('/api/jobs', 'A', { title: 'job', company: 'company', region: '서울', type: 'apartment', position: 'member', salary_type: 'commission', html_content: 'description', phone: '01000000000', created_at: '2099-01-01', id: 'chosen', tier: 'unique', user_id: 'B' }));
    expect(response.status).toBe(201);
    expect(writes[0].payload).toMatchObject({ tier: 'normal', user_id: 'A', html_content: 'description', is_approved: false });
    expect(writes[0].payload).not.toHaveProperty('created_at');
    expect(writes[0].payload).not.toHaveProperty('id');
  });
  it.each([undefined, 'A', 'B'])('denies payment admin access %s', async user => {
    expect((await adminPayments(request('/api/admin/payments', user))).status).toBe(403);
  });
  it('allows database admin and limits own payments', async () => {
    expect((await adminPayments(request('/api/admin/payments', 'admin'))).status).toBe(200);
    tables.payments = [{ user_id: 'B', payment_status: 'completed', job_id: 'secret' }];
    expect(await (await myPayments(request('/api/payments/my', 'A'))).json()).toEqual({});
  });
  it.each([['B', 'completed', 404], ['A', 'refunded', 409], ['A', 'completed', 200]] as const)('payment replay owner/status %s %s', async (owner, status, expected) => {
    const amount = getTotalPrice(resolveProduct('agent-basic')!.price);
    tables.payments = [{ payment_id: 'key', user_id: owner, job_id: null, product_key: 'agent-basic', amount, payment_status: status }];
    expect((await confirmPost(request('/api/payment/confirm', 'A', { paymentKey: 'key', orderId: 'order', productKey: 'agent-basic', amount }))).status).toBe(expected);
    expect(writes).toEqual([]);
  });
  it('requires configured webhook secret even when header omitted', async () => {
    vi.stubEnv('TOSS_WEBHOOK_SECRET', 'test-secret');
    expect((await webhookPost(request('/api/payment/webhook', undefined, { data: { paymentKey: 'key' } }))).status).toBe(401);
    expect(db.from).not.toHaveBeenCalled();
  });
  it('payment replay rejects another job and changed duration', async () => {
    const amount = getTotalPrice(resolveProduct('sales-premium', 7)!.price);
    tables.jobs = [
      { id: 'other', user_id: 'A', category: 'sales', tier: 'normal' },
      { id: 'original', user_id: 'A', category: 'sales', tier: 'normal' },
    ];
    tables.payments = [{ payment_id: 'key', user_id: 'A', job_id: 'original', product_key: 'sales-premium', amount, payment_status: 'completed' }];
    expect((await confirmPost(request('/api/payment/confirm', 'A', { paymentKey: 'key', orderId: 'order', productKey: 'sales-premium', days: 7, amount, jobId: 'other' }))).status).toBe(409);
    expect((await confirmPost(request('/api/payment/confirm', 'A', { paymentKey: 'key', orderId: 'order', productKey: 'sales-premium', days: 20, amount: getTotalPrice(resolveProduct('sales-premium', 20)!.price), jobId: 'original' }))).status).toBe(409);
    expect(writes).toEqual([]);
  });
});
