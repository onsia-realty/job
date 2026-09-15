import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mock = vi.hoisted(() => ({ user: vi.fn(), from: vi.fn(), result: vi.fn() }));
vi.mock('@/lib/auth-server', () => ({ verifyUser: mock.user }));
vi.mock('@/lib/supabase-server', () => ({ supabaseAdmin: { from: mock.from } }));
import { POST } from './route';
const req = (brokerRegNo = '11111-2020-00001') => new NextRequest('http://localhost/api/agent/broker-sync', { method: 'POST', body: JSON.stringify({ brokerRegNo }) });
describe('사무소 소속 동기화', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), maybeSingle: mock.result };
    mock.from.mockReturnValue(chain);
  });
  it('비로그인 요청을 거절한다', async () => {
    mock.user.mockResolvedValue(null);
    expect((await POST(req())).status).toBe(401);
  });
  it('사용자 메타데이터와 임의 등록번호는 소속을 부여하지 않는다', async () => {
    mock.user.mockResolvedValue({ id: 'a', user_metadata: { brokerVerified: true, brokerRegNo: '11111-2020-00001' }, app_metadata: {} });
    expect((await POST(req())).status).toBe(403);
    expect(mock.from).not.toHaveBeenCalled();
  });
  it('승인받은 사무소와 다른 등록번호를 거절한다', async () => {
    mock.user.mockResolvedValue({ id: 'a', app_metadata: { brokerVerified: true, brokerRegNo: 'other' } });
    expect((await POST(req())).status).toBe(403);
    expect(mock.from).not.toHaveBeenCalled();
  });
  it('회원 행이 없으면 저장 성공을 반환하지 않는다', async () => {
    mock.user.mockResolvedValue({ id: 'a', app_metadata: { brokerVerified: true, brokerRegNo: '11111-2020-00001' } });
    mock.result.mockResolvedValueOnce({ data: { id: 'office', estbl_reg_no: '11111-2020-00001' }, error: null }).mockResolvedValueOnce({ data: null, error: null });
    expect((await POST(req())).status).toBe(409);
  });
  it('승인된 사무소와 회원 행이 있을 때만 성공한다', async () => {
    mock.user.mockResolvedValue({ id: 'a', app_metadata: { brokerVerified: true, brokerRegNo: '11111-2020-00001' } });
    mock.result.mockResolvedValueOnce({ data: { id: 'office', estbl_reg_no: '11111-2020-00001' }, error: null }).mockResolvedValueOnce({ data: { id: 'a' }, error: null });
    expect((await POST(req())).status).toBe(200);
  });
});
