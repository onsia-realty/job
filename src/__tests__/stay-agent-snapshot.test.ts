import { describe, it, expect } from 'vitest';
import {
  composeAgentSnapshot,
  normalizeRegNo,
  type AgentUsersRow,
  type AgentBrokerRow,
} from '@/lib/stay/agent-snapshot';

const NOW = '2026-09-07T00:00:00.000Z';

const usersRow: AgentUsersRow = {
  name: '홍길동',
  phone: '010-1234-5678',
  company_name: '온시아공인중개사사무소',
  broker_reg_no: '11710－2022－00250', // 전각 하이픈
  broker_address: '서울특별시 송파구 올림픽로 1',
};

const brokerRow: AgentBrokerRow = {
  id: 'b0000000-0000-0000-0000-000000000001',
  estbl_reg_no: '11710-2022-00250',
  med_office_nm: '온시아 공인중개사사무소(레지스트리)',
  rprsv_nm: '김대표',
  lctn_road_nm_addr: '서울특별시 송파구 올림픽로 300',
  tel_no: '02-000-0000',
};

describe('composeAgentSnapshot', () => {
  it('① broker_offices 매칭 시 사무소 정보는 레지스트리 우선, 연락처는 users 우선', () => {
    const snap = composeAgentSnapshot(usersRow, brokerRow, NOW);

    expect(snap.agent_office_name).toBe('온시아 공인중개사사무소(레지스트리)');
    expect(snap.agent_office_address).toBe('서울특별시 송파구 올림픽로 300');
    expect(snap.agent_reg_no).toBe('11710-2022-00250');
    expect(snap.agent_representative).toBe('김대표');
    // 연락처만 반대 순서
    expect(snap.agent_phone).toBe('010-1234-5678');

    expect(snap.broker_office_id).toBe(brokerRow.id);
    expect(snap.source).toBe('broker_offices');
    expect(snap.missing).toEqual([]);
    expect(snap.agent_snapshot_at).toBe(NOW);
  });

  it('① -b 매칭됐지만 users.phone 이 비면 tel_no 로 폴백', () => {
    const snap = composeAgentSnapshot({ ...usersRow, phone: '' }, brokerRow, NOW);
    expect(snap.agent_phone).toBe('02-000-0000');
    expect(snap.source).toBe('broker_offices');
  });

  it('② 미매칭 시 users 폴백 + source users + 등록번호는 정규화본', () => {
    const snap = composeAgentSnapshot(usersRow, null, NOW);

    expect(snap.agent_office_name).toBe('온시아공인중개사사무소');
    expect(snap.agent_office_address).toBe('서울특별시 송파구 올림픽로 1');
    expect(snap.agent_reg_no).toBe('11710-2022-00250'); // 전각 → 반각
    expect(snap.agent_representative).toBe('홍길동');
    expect(snap.agent_phone).toBe('010-1234-5678');

    expect(snap.broker_office_id).toBeNull();
    expect(snap.source).toBe('users');
    expect(snap.missing).toEqual([]);
  });

  it('③ 둘 다 빈 값이면 source none + missing 5개', () => {
    const snap = composeAgentSnapshot(null, null, NOW);

    expect(snap.source).toBe('none');
    expect(snap.broker_office_id).toBeNull();
    expect(snap.missing).toEqual([
      'agent_office_name',
      'agent_office_address',
      'agent_phone',
      'agent_reg_no',
      'agent_representative',
    ]);
    expect(snap.agent_snapshot_at).toBe(NOW);
  });

  it('④ 빈 문자열/공백은 null 로 취급되고 missing 에 잡힌다', () => {
    const snap = composeAgentSnapshot(
      {
        name: '  ',
        phone: '',
        company_name: '온시아',
        broker_reg_no: '',
        broker_address: null,
      },
      null,
      NOW
    );

    expect(snap.agent_office_name).toBe('온시아');
    expect(snap.agent_representative).toBeNull();
    expect(snap.agent_phone).toBeNull();
    expect(snap.agent_reg_no).toBeNull();
    expect(snap.agent_office_address).toBeNull();
    expect(snap.source).toBe('users');
    expect(snap.missing).toEqual([
      'agent_office_address',
      'agent_phone',
      'agent_reg_no',
      'agent_representative',
    ]);
  });

  it('④ -b 레지스트리 값이 빈 문자열이면 users 값으로 폴백', () => {
    const snap = composeAgentSnapshot(
      usersRow,
      { ...brokerRow, med_office_nm: '', rprsv_nm: '   ' },
      NOW
    );
    expect(snap.agent_office_name).toBe('온시아공인중개사사무소');
    expect(snap.agent_representative).toBe('홍길동');
    expect(snap.source).toBe('broker_offices');
  });
});

describe('normalizeRegNo', () => {
  it('공백 제거 + 전각/긴 대시 → 반각 하이픈', () => {
    expect(normalizeRegNo(' 11710 － 2022 – 00250 ')).toBe('11710-2022-00250');
  });

  it('빈 값은 null', () => {
    expect(normalizeRegNo('')).toBeNull();
    expect(normalizeRegNo('   ')).toBeNull();
    expect(normalizeRegNo(null)).toBeNull();
    expect(normalizeRegNo(undefined)).toBeNull();
  });
});
