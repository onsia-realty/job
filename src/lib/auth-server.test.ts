import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
const db = vi.hoisted(() => ({ maybeSingle: vi.fn() }));
vi.mock('@/lib/supabase-server', () => ({ supabaseAdmin: { from: () => ({ select: () => ({ eq: () => db }) }) } }));
import { isVerifiedBusinessUser } from './auth-server';
const baseUser = { id: 'a', aud: 'authenticated', created_at: '2026-09-15', user_metadata: {}, app_metadata: {} };

describe('기업회원 인증 신뢰 경계', () => {
  beforeEach(() => db.maybeSingle.mockResolvedValue({ data: { user_type: 'employer' }, error: null }));
  it('사용자가 위조한 메타데이터는 인증을 부여하지 않는다', async () => {
    expect(await isVerifiedBusinessUser({ ...baseUser, user_metadata: { brokerVerified: true, businessVerified: true } } as User)).toBe(false);
  });
  it('서버가 부여한 인증만 허용한다', async () => {
    expect(await isVerifiedBusinessUser({ ...baseUser, app_metadata: { businessVerified: true } } as User)).toBe(true);
  });
  it('문자열 true는 인증 플래그가 아니다', async () => {
    expect(await isVerifiedBusinessUser({ ...baseUser, app_metadata: { brokerVerified: 'true' } } as User)).toBe(false);
  });
  it('중개사 인증에는 승인된 사무소 연결이 필요하다', async () => {
    expect(await isVerifiedBusinessUser({ ...baseUser, app_metadata: { brokerVerified: true } } as User)).toBe(false);
    expect(await isVerifiedBusinessUser({ ...baseUser, app_metadata: { brokerVerified: true, brokerRegNo: '11111-2020-00001' } } as User)).toBe(true);
  });
});
