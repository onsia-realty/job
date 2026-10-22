import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as ensure } from '@/app/api/auth/ensure-user/route';
import { POST as complete } from '@/app/api/auth/complete-profile/route';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), from: vi.fn(), updateUserById: vi.fn(),
  verification: vi.fn(), taken: vi.fn(), consume: vi.fn(),
}));
vi.mock('@/lib/supabase-server', () => ({ supabaseAdmin: {
  from: mocks.from, auth: { getUser: mocks.getUser, admin: { updateUserById: mocks.updateUserById } },
} }));
vi.mock('@/lib/danal', () => ({
  getConfirmedVerificationByToken: mocks.verification,
  isDiTaken: mocks.taken, markVerificationConsumed: mocks.consume,
}));

let profile: Record<string, unknown> | null;
let metadata: Record<string, unknown>;
let provider: string;
let lookupError: object | null;
const writes = vi.fn();
function request(body?: object) {
  return new NextRequest('http://localhost/api/auth/test', {
    method: 'POST', headers: { authorization: 'Bearer test', 'content-type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
const form = { name: '회원', nickname: '테스트회원', phone: '01012345678', role: 'seeker' };
const verified = { id: 'u1', name: '인증실명', realname_verified: true, di: 'di1', verified_at: '2026-10-23', phone: '01098765432' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_DANAL_REQUIRED', 'false');
  profile = null; metadata = {}; provider = 'email'; lookupError = null;
  mocks.getUser.mockImplementation(async () => ({ data: { user: {
    id: 'u1', email: 'test@example.com', user_metadata: metadata, app_metadata: { provider },
  } } }));
  mocks.verification.mockResolvedValue(null);
  mocks.taken.mockResolvedValue(false);
  mocks.updateUserById.mockResolvedValue({ error: null });
  mocks.from.mockImplementation(() => {
    let writing = false;
    const chain = {
      select: vi.fn(() => chain), eq: vi.fn(() => chain),
      maybeSingle: vi.fn(async () => writing
        ? { data: { id: 'u1' }, error: null } : { data: profile, error: lookupError }),
      insert: vi.fn((data) => { writing = true; writes(data); return chain; }),
      update: vi.fn((data) => { writing = true; writes(data); return chain; }),
      then: (resolve: (value: object) => unknown) => Promise.resolve({ error: null }).then(resolve),
    };
    return chain;
  });
});
afterEach(() => vi.unstubAllEnvs());

describe('Danal application profile boundary', () => {
  it('required missing token rejects completion despite forged metadata', async () => {
    vi.stubEnv('NEXT_PUBLIC_DANAL_REQUIRED', 'true');
    metadata = { profile_completed: true, realname_verified: true, di: 'forged' };
    expect((await complete(request(form))).status).toBe(400);
    expect(writes).not.toHaveBeenCalled();
  });
  it.each([null, '', false, 123, 'invalid'])('rejects supplied invalid token %s in both endpoints', async (danalToken) => {
    metadata = { danalToken };
    expect((await ensure(request())).status).toBe(400);
    expect((await complete(request({ ...form, danalToken }))).status).toBe(400);
    expect(writes).not.toHaveBeenCalled();
    expect(mocks.consume).not.toHaveBeenCalled();
  });
  it('optional no-token email creation and social completion remain valid', async () => {
    expect((await ensure(request())).status).toBe(200);
    expect((await complete(request(form))).status).toBe(200);
    expect(writes).toHaveBeenCalledTimes(2);
    expect(writes.mock.calls.every(([data]) => !data.realname_verified)).toBe(true);
  });
  it('preserves verified name/phone against forged input while allowing nickname edits', async () => {
    vi.stubEnv('NEXT_PUBLIC_DANAL_REQUIRED', 'true'); profile = verified;
    metadata = { name: '위조이름', phone: form.phone, danalToken: 'old-consumed' };
    expect((await complete(request(form))).status).toBe(200);
    expect(writes).toHaveBeenCalledWith(expect.objectContaining({ name: verified.name, phone: verified.phone, nickname: form.nickname }));
    const result = await (await ensure(request())).json();
    expect(result).toMatchObject({ exists: true, needsIdentityVerification: false, needsProfileCompletion: null });
    expect(mocks.updateUserById).toHaveBeenCalledTimes(2);
    for (const [, data] of mocks.updateUserById.mock.calls) {
      expect(data.user_metadata).toMatchObject({ name: verified.name, phone: verified.phone });
    }
    expect(mocks.verification).not.toHaveBeenCalled();
    expect(mocks.consume).not.toHaveBeenCalled();
  });
  it('verified profiles still reject an explicitly supplied invalid replacement token', async () => {
    profile = verified;
    expect((await complete(request({ ...form, danalToken: 'invalid' }))).status).toBe(400);
    expect(writes).not.toHaveBeenCalled();
  });
  it('existing unverified profile reports identity required, not metadata completion', async () => {
    vi.stubEnv('NEXT_PUBLIC_DANAL_REQUIRED', 'true'); profile = { id: 'u1' };
    metadata = { profile_completed: true, realname_verified: true };
    expect(await (await ensure(request())).json()).toMatchObject({ needsIdentityVerification: true, needsProfileCompletion: null });
  });
  it('repeated social ensure calls cannot create a premature completed profile', async () => {
    provider = 'google'; metadata = { profile_completed: true };
    for (let i = 0; i < 2; i++) {
      expect(await (await ensure(request())).json()).toMatchObject({ needsProfileCompletion: true });
    }
    expect(writes).not.toHaveBeenCalled();
  });
  it.each(['ensure', 'complete'])('%s ignores forged name/phone in favor of confirmed server proof', async (endpoint) => {
    vi.stubEnv('NEXT_PUBLIC_DANAL_REQUIRED', 'true');
    metadata = { ...form, danalToken: 'confirmed' };
    mocks.verification.mockResolvedValue({ name: ' 인증실명 ', di: 'server-di', ci: 'server-ci', phone: '010-9876-5432' });
    const response = endpoint === 'ensure' ? await ensure(request()) : await complete(request(metadata));
    expect(response.status).toBe(200);
    expect(writes).toHaveBeenCalledWith(expect.objectContaining({ name: verified.name, phone: verified.phone, di: 'server-di', realname_verified: true }));
    expect(mocks.updateUserById).toHaveBeenCalledWith('u1', expect.objectContaining({
      user_metadata: expect.objectContaining({ name: verified.name, phone: verified.phone, nickname: form.nickname }),
    }));
    expect(mocks.consume).toHaveBeenCalledWith('confirmed');
  });
  it.each([
    { phone: '01098765432' }, { name: '   ', phone: '01098765432' },
    { name: '인증실명' }, { name: '인증실명', phone: 'invalid' },
  ])('rejects incomplete confirmed proof %j without writes or consumption', async (identity) => {
    metadata = { ...form, danalToken: 'confirmed' };
    mocks.verification.mockResolvedValue({ di: 'server-di', ...identity });
    expect((await ensure(request())).status).toBe(400);
    expect((await complete(request(metadata))).status).toBe(400);
    expect(writes).not.toHaveBeenCalled();
    expect(mocks.updateUserById).not.toHaveBeenCalled();
    expect(mocks.consume).not.toHaveBeenCalled();
  });
  it('required new email user needs completion on repeated calls without creating a profile', async () => {
    vi.stubEnv('NEXT_PUBLIC_DANAL_REQUIRED', 'true');
    metadata = { ...form, profile_completed: true, realname_verified: true, di: 'forged' };
    for (let i = 0; i < 2; i++) {
      expect(await (await ensure(request())).json()).toMatchObject({ needsProfileCompletion: true, needsIdentityVerification: true });
    }
    expect(writes).not.toHaveBeenCalled();
    expect(mocks.updateUserById).not.toHaveBeenCalled();
    expect(mocks.verification).not.toHaveBeenCalled();
  });
  it('fails closed on profile lookup failure', async () => {
    lookupError = { message: 'test lookup failure' };
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await ensure(request())).status).toBe(500);
    expect((await complete(request(form))).status).toBe(500);
    expect(writes).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
