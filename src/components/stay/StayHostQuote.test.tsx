import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import StayHostQuote from './StayHostQuote';
import type { HostQuoteStay } from '@/lib/stay/host-pricing';

vi.mock('./StayInquiryForm', () => ({ default: ({ contextMessage }: { contextMessage?: string }) => <div data-testid="inquiry-context">{contextMessage}</div> }));
const stay: HostQuoteStay & { id: string } = { id: 'test', owner_type: 'owner', deal_type: 'short_term', status: 'available', weekly_fee_won: 280000, daily_fee_won: null, monthly_fee_won: null, maintenance_fee_won: 90000, maintenance_included: false, utilities_included: false, deposit_won: 300000, min_stay_days: 7, max_stay_days: 90, available_from: '2026-09-15', available_to: null };
function dates() {
  fireEvent.change(screen.getByLabelText('체크인 · 입주'), { target: { value: '2026-09-20' } });
  fireEvent.click(screen.getByRole('button', { name: '1주' }));
}
afterEach(() => vi.useRealTimers());
describe('host quote', () => {
  it('quotes a week excluding deposit and resets inquiry after changing dates', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-15T00:00:00Z'));
    render(<StayHostQuote stay={stay} />);
    const button = screen.getByRole('button', { name: '선택한 날짜로 호스트에게 문의' });
    expect(button).toBeDisabled(); dates();
    expect(screen.getByText('301,000원')).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.getByTestId('inquiry-context')).toHaveTextContent('2026-09-27 (7일)');
    fireEvent.change(screen.getByLabelText('체크아웃 · 퇴실'), { target: { value: '2026-09-19' } });
    expect(screen.queryByTestId('inquiry-context')).not.toBeInTheDocument();
    expect(button).toBeDisabled();
  });
  it('keeps monthly-only hosts on general inquiry', () => {
    render(<StayHostQuote stay={{ ...stay, weekly_fee_won: null, monthly_fee_won: 1200000 }} />);
    fireEvent.click(screen.getByRole('button', { name: '호스트에게 일반 문의' }));
    expect(screen.getByTestId('inquiry-context')).toBeEmptyDOMElement();
  });
  it('never mounts a sending inquiry in preview', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-15T00:00:00Z'));
    render(<StayHostQuote stay={stay} preview />); dates();
    fireEvent.click(screen.getByRole('button', { name: '선택한 날짜로 호스트에게 문의' }));
    expect(screen.queryByTestId('inquiry-context')).not.toBeInTheDocument();
    expect(screen.getByText(/실제 문의는 전송되지 않습니다/)).toBeInTheDocument();
  });
  it('blocks general inquiry for an occupied monthly-only host', () => {
    render(<StayHostQuote stay={{ ...stay, weekly_fee_won: null, status: 'occupied' }} />);
    expect(screen.getByRole('button', { name: '호스트에게 일반 문의' })).toBeDisabled();
  });
});
