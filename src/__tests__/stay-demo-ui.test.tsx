import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import StayInquiryForm from '@/components/stay/StayInquiryForm';
import StayInquiryBar from '@/components/stay/StayInquiryBar';
import StayCard from '@/components/stay/StayCard';
import type { Stay } from '@/types/stay';

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ session: { access_token: 'test' } }) }));
afterEach(cleanup);
const demoId = '5eed0000-0000-4000-8000-000000000001';
describe('demo UI boundary', () => {
  it.each(['row', 'tile'] as const)('labels %s cards', variant => {
    const stay = { id: demoId, title: '샘플', status: 'available', stay_type: 'apartment', deal_type: 'short_term', amenities: [] } as unknown as Stay;
    render(<StayCard stay={stay} variant={variant} />);
    expect(screen.getByText('샘플 매물')).toBeInTheDocument();
  });
  it('does not mount a demo submission form', () => {
    render(<StayInquiryForm stayId={demoId} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/stay/new');
  });
  it('keeps real listing submission controls', () => {
    render(<StayInquiryForm stayId="5eed0000-0000-4000-8000-000000000013" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '문의 보내기' })).toBeInTheDocument();
  });
  it.each(['sidebar', 'mobile'] as const)('replaces demo %s contact actions', variant => {
    render(<StayInquiryBar stayId={demoId} variant={variant} ownerType="agent" phone="0212345678" kakaoUrl={null} contactName={null} contactHours={null} depositWon={100} monthlyFeeWon={200} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/stay/new');
  });
});
