import { describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ getUserById: vi.fn(), from: vi.fn() }));
vi.mock('@/lib/supabase-server', () => ({ supabaseAdmin: { auth: { admin: { getUserById: mock.getUserById } }, from: mock.from } }));
import { buildAgentSnapshot, composeAgentSnapshot } from './agent-snapshot';
describe('법정표기 출처', () => {
  it('사용자 프로필을 사무소나 대표자의 증거로 사용하지 않는다', () => {
    const snapshot = composeAgentSnapshot({ name: '보조원', company_name: '임의 회사', broker_address: '주소', broker_reg_no: '123' }, null, 'now');
    expect(snapshot.agent_representative).toBeNull();
    expect(snapshot.agent_reg_no).toBeNull();
    expect(snapshot.agent_office_name).toBeNull();
    expect(snapshot.agent_office_address).toBeNull();
  });
  it('사용자 메타데이터의 사무소 연결만 있으면 빈 스냅샷을 반환한다', async () => {
    mock.getUserById.mockResolvedValue({ data: { user: { user_metadata: { brokerVerified: true, brokerRegNo: '123' }, app_metadata: {} } }, error: null });
    expect((await buildAgentSnapshot('a')).missing).toHaveLength(5);
    expect(mock.from).not.toHaveBeenCalled();
  });
});
