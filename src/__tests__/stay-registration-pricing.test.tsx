import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import StayCreateForm from '@/components/stay/StayCreateForm';

const { auth } = vi.hoisted(() => ({ auth: {
  user: { id: 'host-1', app_metadata: {}, user_metadata: {} },
  session: { access_token: 'test-token' }, isLoading: false,
} }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/components/shared/AddressSearch', () => ({ default: () => <div>주소 검색</div> }));
vi.mock('@/components/stay/StayImageUploader', () => ({ default: () => <div>사진 등록</div> }));
vi.mock('@/components/stay/StayAgentFields', () => ({ default: () => <div>중개사 정보</div> }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('registration pricing separation', () => {
  it('offers weekly host pricing with a default seven-day minimum', () => {
    render(<StayCreateForm initialOwnerType="owner" />);
    expect(screen.getByLabelText(/주 임대료 · 7일/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/월 임대료 \(만원\)/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/최소 계약기간/)).toHaveValue('7');
  });

  it('retains monthly pricing for an agent', () => {
    render(<StayCreateForm initialOwnerType="agent" />);
    expect(screen.getByLabelText(/월 임대료 \(만원\)/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/주 임대료 · 7일/)).not.toBeInTheDocument();
  });

  it('keeps a legacy monthly host price until the host explicitly switches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      id: 'legacy-1', user_id: 'host-1', owner_type: 'owner', deal_type: 'short_term',
      monthly_fee_won: 900000, weekly_fee_won: null, daily_fee_won: null,
      title: '기존 월 임대 매물', status: 'available',
    }) }));
    render(<StayCreateForm editId="legacy-1" initialOwnerType="owner" />);
    expect(await screen.findByLabelText(/월 임대료 \(만원\)/)).toHaveValue('90');
    expect(screen.queryByLabelText(/주 임대료 · 7일/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('기존 호스트 매물의 요금 방식'), { target: { value: 'weekly' } });
    expect(screen.getByLabelText(/주 임대료 · 7일/)).toHaveValue('');
    expect(screen.queryByLabelText(/월 임대료 \(만원\)/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('기존 호스트 매물의 요금 방식'), { target: { value: 'monthly' } });
    expect(screen.getByLabelText(/월 임대료 \(만원\)/)).toHaveValue('90');
  });
});
