import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PRICING_TIERS } from '@/lib/toss';
import PremiumPricingPage from './page';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
const mocks = vi.hoisted(() => ({ user: null as { id: string; user_metadata: object } | null, query: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: mocks.user, isLoading: false, session: null }) }));
vi.mock('@/lib/supabase', () => ({ supabase: { from: () => {
  const chain = { select: () => chain, eq: () => chain, order: mocks.query };
  return chain;
} } }));
beforeEach(() => { mocks.user = null; mocks.query.mockReset(); });
vi.mock('@/components/shared/Footer', () => ({ default: () => <footer /> }));

afterEach(cleanup);

describe('commercial product information', () => {
  it('updates duration and bonus copy from available category tiers when switching tabs', () => {
    render(<PremiumPricingPage />);
    const heading = screen.getByRole('heading', { name: '광고 상품 안내' });
    const description = () => heading.nextElementSibling!.textContent!;
    expect(description()).toContain('BASIC: 5일');
    expect(description()).toContain('프리미엄·VIP: 7일');
    expect(description()).not.toContain('10·20·30일');
    fireEvent.click(screen.getByRole('button', { name: '분양상담사' }));
    for (const tier of Object.values(PRICING_TIERS).filter(t => t.category === 'sales' && t.purchaseEnabled !== false)) {
      expect(description()).toContain(tier.name);
      expect(description()).toContain(`${tier.options.map(o => o.days).join('·')}일`);
      for (const option of tier.options.filter(o => o.bonusDays > 0)) {
        expect(description()).toContain(`${option.days}일 구매 시 ${option.bonusDays}일`);
      }
    }
    expect(description()).not.toContain('다이아');
    expect(description()).toContain('표시 가격은 공급가, 부가세 별도');
    expect(screen.getByRole('button', { name: '준비 중' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '공인중개사' }));
    expect(description()).toContain('BASIC: 5일');
  });

  it('labels preview ads and replaces unsubstantiated results in both categories', () => {
    const { container } = render(<PremiumPricingPage />);
    for (const category of ['공인중개사', '분양상담사']) {
      fireEvent.click(screen.getByRole('button', { name: category }));
      expect(container.textContent).not.toMatch(/\d+(\.\d+)?배|48시간|36시간|89%|92%|광고주 만족도/);
      expect(screen.getByText(/아래 업체·채용 조건은 실제 모집 공고가 아닙니다/)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '광고 상품으로 달라지는 점' })).toBeInTheDocument();
      expect(screen.getByText('부가세(10%) 별도')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /환불 정책 전문/ })).toHaveAttribute('href', '/refund');
      expect(container.textContent).toContain('승인된 활성 공고에 대해 결제가 완료되면');
      expect(container.textContent).not.toContain('관리자 승인 없이');
    }
  });
});


describe('real advertisement target selection', () => {
  const openSelector = () => fireEvent.click(screen.getAllByRole('button', { name: '신청하기' })[0]);
  it('asks anonymous visitors to log in without fake jobs', async () => {
    render(<PremiumPricingPage />);
    openSelector();
    expect(await screen.findByText('로그인 후 본인의 공고를 선택해주세요.')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it('shows an empty state and creates a job before purchasing', async () => {
    mocks.user = { id: 'owner', user_metadata: {} };
    mocks.query.mockResolvedValue({ data: [], error: null });
    render(<PremiumPricingPage />);
    openSelector();
    expect(await screen.findByText('광고를 적용할 수 있는 공고가 없습니다')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '새 공고 작성하기' })).toHaveAttribute('href', '/agent/jobs/new');
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /프리미엄 결제하기/ })).not.toBeInTheDocument();
  });
  it('distinguishes loading and query errors from empty results, then retries', async () => {
    mocks.user = { id: 'owner', user_metadata: {} };
    let finish!: (value: unknown) => void;
    mocks.query.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    render(<PremiumPricingPage />);
    openSelector();
    expect(screen.getByText('공고 목록을 불러오는 중...')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    finish({ data: null, error: new Error('query failed') });
    expect(await screen.findByRole('alert')).toHaveTextContent('공고 목록을 불러오지 못했습니다');
    expect(screen.queryByText('광고를 적용할 수 있는 공고가 없습니다')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /프리미엄 결제하기/ })).not.toBeInTheDocument();
    mocks.query.mockResolvedValue({ data: [], error: null });
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('광고를 적용할 수 있는 공고가 없습니다')).toBeInTheDocument();
  });
  it.each([false, null, undefined])('does not offer an active job without explicit approval (%s)', async is_approved => {
    mocks.user = { id: 'owner', user_metadata: {} };
    mocks.query.mockResolvedValue({ data: [{
      id: '11111111-1111-4111-8111-111111111111', user_id: 'owner', title: 'Pending job',
      category: 'agent', tier: 'normal', is_active: true, is_approved, deadline: null, created_at: '2026-01-01',
    }], error: null });
    render(<PremiumPricingPage />);
    openSelector();
    expect(await screen.findByText('광고를 적용할 수 있는 공고가 없습니다')).toBeInTheDocument();
    if (is_approved === false) expect(screen.getByRole('status')).toHaveTextContent('승인 대기 중인 공고는 승인 후 선택');
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /프리미엄 결제하기/ })).not.toBeInTheDocument();
  });
  it('offers only real, owned, approved, active, unclosed jobs of the selected category', async () => {
    mocks.user = { id: 'owner', user_metadata: {} };
    const job = { id: '11111111-1111-4111-8111-111111111111', user_id: 'owner', title: 'Owned job', category: 'agent', tier: 'normal', is_active: true, is_approved: true, deadline: null, created_at: '2026-01-01' };
    mocks.query.mockResolvedValue({ data: [job,
      { ...job, id: 'mock-agent-1' }, { ...job, user_id: 'other' },
      { ...job, category: 'sales' }, { ...job, is_active: false }, { ...job, deadline: '2000-01-01' },
      { ...job, is_approved: false }, { ...job, is_approved: null }, { ...job, is_approved: undefined },
    ], error: null });
    render(<PremiumPricingPage />);
    openSelector();
    const radio = await screen.findByRole('radio');
    const pay = screen.getByRole('button', { name: /프리미엄 결제하기/ });
    expect(pay).toBeDisabled();
    fireEvent.click(radio);
    expect(pay).toBeEnabled();
  });
});
