import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CheckoutPage from './page';

const mock = vi.hoisted(() => ({
  params: new URLSearchParams(), load: vi.fn(), pay: vi.fn(), fetch: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useSearchParams: () => mock.params }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({
  user: { id: 'owner', user_metadata: {} }, session: { access_token: 'test-token' }, isLoading: false,
}) }));
vi.mock('@tosspayments/tosspayments-sdk', () => ({ loadTossPayments: mock.load, ANONYMOUS: 'test' }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', mock.fetch);
  mock.load.mockResolvedValue({ widgets: () => ({
    setAmount: vi.fn().mockResolvedValue(undefined),
    renderPaymentMethods: vi.fn().mockResolvedValue({ destroy: vi.fn().mockResolvedValue(undefined) }),
    renderAgreement: vi.fn().mockResolvedValue({ destroy: vi.fn().mockResolvedValue(undefined) }),
    requestPayment: mock.pay,
  }) });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('checkout target requirement', () => {
  it.each(['', '&jobId=', '&jobId=%20%20', '&jobId=mock-agent-1'])('blocks an absent or malformed target %s before loading payment', async suffix => {
    mock.params = new URLSearchParams(`productKey=agent-basic${suffix}`);
    render(<CheckoutPage />);
    expect(screen.getByRole('link', { name: '공고 먼저 등록하기' })).toHaveAttribute('href', '/agent/jobs/new');
    expect(screen.getByRole('link', { name: '기존 공고 선택하기' })).toHaveAttribute('href', '/premium?category=agent');
    expect(mock.load).not.toHaveBeenCalled();
    expect(mock.fetch).not.toHaveBeenCalled();
    expect(mock.pay).not.toHaveBeenCalled();
  });
  it('keeps DIA disabled with a valid target', () => {
    mock.params = new URLSearchParams('productKey=sales-dia&jobId=11111111-1111-4111-8111-111111111111');
    render(<CheckoutPage />);
    expect(screen.getByText('이 상품은 준비 중입니다.')).toBeInTheDocument();
    expect(mock.load).not.toHaveBeenCalled();
  });
  it.each(['본인의 공고만 결제할 수 있습니다.', '승인된 활성 공고만 결제할 수 있습니다.'])('never requests provider payment if the server rejects the selected target: %s', async message => {
    const jobId = '11111111-1111-4111-8111-111111111111';
    mock.params = new URLSearchParams(`productKey=agent-basic&jobId=${jobId}`);
    mock.fetch.mockResolvedValue({ ok: false, json: async () => ({ message }) });
    render(<CheckoutPage />);
    fireEvent.click(await screen.findByRole('button', { name: /원 결제하기/ }));
    await waitFor(() => expect(mock.fetch).toHaveBeenCalledWith('/api/payment/orders', expect.objectContaining({
      body: JSON.stringify({ productKey: 'agent-basic', jobId }),
    })));
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(mock.pay).not.toHaveBeenCalled();
  });
});
