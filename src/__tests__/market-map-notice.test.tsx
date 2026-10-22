import { cleanup, render, screen } from '@testing-library/react';
import MarketMapNotice from '@/components/market/MarketMapNotice';

afterEach(cleanup);

it('distinguishes loading, failure and successful filtered emptiness', () => {
  const { rerender } = render(<MarketMapNotice enabled pointCount={0} loading />);
  expect(screen.getByRole('status')).toHaveTextContent('거래 데이터를 불러오는 중…');
  rerender(<MarketMapNotice enabled pointCount={0} error />);
  expect(screen.getByRole('alert')).toHaveTextContent('거래 데이터를 불러오지 못했습니다');
  rerender(<MarketMapNotice enabled pointCount={0} />);
  expect(screen.getByRole('status')).toHaveTextContent('현재 조건에 맞는 거래가 없습니다');
  expect(screen.queryByText(/수집되지/)).not.toBeInTheDocument();
});

it('hides successful nonempty results and aggregate modes', () => {
  const { container, rerender } = render(<MarketMapNotice enabled pointCount={1} />);
  expect(container).toBeEmptyDOMElement();
  rerender(<MarketMapNotice enabled={false} pointCount={0} loading error />);
  expect(container).toBeEmptyDOMElement();
});

it('prioritizes pending requests over stale errors or points', () => {
  render(<MarketMapNotice enabled pointCount={1} loading error />);
  expect(screen.getByRole('status')).toHaveTextContent('거래 데이터를 불러오는 중…');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
