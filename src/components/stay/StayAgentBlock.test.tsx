import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StayAgentBlock from './StayAgentBlock';
import type { Stay } from '@/types/stay';

const stay = {
  owner_type: 'agent', is_exclusive: false,
  agent_office_name: '테스트 공인중개사무소',
  agent_office_address: '서울시 테스트로 10',
  agent_representative: '테스트 대표',
  agent_reg_no: 'TEST-REGISTRATION', agent_phone: '02-0000-0000',
  contact_name: 'PRIVATE_OWNER', phone: 'PRIVATE_PHONE', kakao_url: 'PRIVATE_URL',
  detail_address: 'PRIVATE_UNIT',
} as Stay;

describe('StayAgentBlock detail disclosure', () => {
  it('shows office registration once with the broker contact, not owner contact fields', () => {
    render(<StayAgentBlock stay={stay} />);
    expect(screen.getByRole('heading', { name: '담당 중개사' })).toBeInTheDocument();
    expect(screen.getByText('개설등록번호')).toBeInTheDocument();
    expect(screen.getAllByText('TEST-REGISTRATION')).toHaveLength(1);
    expect(screen.getByRole('link', { name: '02-0000-0000' })).toHaveAttribute('href', 'tel:02-0000-0000');
    for (const text of ['PRIVATE_OWNER', 'PRIVATE_PHONE', 'PRIVATE_URL', 'PRIVATE_UNIT']) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
  });

  it('does not display stale broker registration or phone on direct-owner listings', () => {
    render(<StayAgentBlock stay={{ ...stay, owner_type: 'owner' }} />);
    expect(screen.getByText('임대인이 직접 등록한 매물입니다.')).toBeInTheDocument();
    expect(screen.queryByText('개설등록번호')).not.toBeInTheDocument();
    expect(screen.queryByText('TEST-REGISTRATION')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '02-0000-0000' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '중개사와 안전하게 계약 진행하기' })).toHaveAttribute('href', '/stay/agents');
  });

  it('does not create an empty telephone link when public office contact is unavailable', () => {
    render(<StayAgentBlock stay={{ ...stay, agent_phone: null }} />);
    expect(screen.getByText('매물 문의를 이용해 주세요')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('TEST-REGISTRATION')).toBeInTheDocument();
  });
});
