import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import MarketPageClient from '@/app/market/MarketPageClient';
import ComplexListPanel from '@/components/market/ComplexListPanel';

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => mocks, useSearchParams: () => new URLSearchParams() }));
vi.mock('next/script', () => ({ default: () => null }));
vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('@/lib/market/queries', () => ({ useBrokersNearby: () => ({}), useJobsNearby: () => ({}), useGuAggregates: () => ({}) }));
vi.mock('@/components/market/MarketSearch', () => ({ default: () => null }));
vi.mock('@/components/market/MarketFilterSheet', () => ({ default: () => null }));
vi.mock('@/components/market/ComplexDetailView', () => ({ default: ({ complexKey }: { complexKey: string }) => <div>상세 {complexKey}</div> }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('opens real indicator content in the mobile sheet, returns to list, and selects ranking detail', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
    ok: true,
    json: async () => url.includes('/rankings/')
      ? { rankings: [{ complex_key: 'A', complex_name: '랭킹 단지', recent_price_manwon: 100000 }] }
      : { transactions: [] },
  })));
  const { container } = render(<MarketPageClient />);
  expect(screen.queryByRole('button', { name: '지표 닫고 목록으로' })).not.toBeInTheDocument();
  const chip = screen.getByRole('button', { name: '최근상승' });
  expect(chip).toHaveAttribute('aria-pressed', 'false');
  fireEvent.click(chip);
  expect(chip).toHaveAttribute('aria-pressed', 'true');
  // The existing sheet is the parent of its accessible resize handle.
  const sheet = screen.getByRole('button', { name: '시트 크기 조절' }).parentElement!;
  expect(sheet).toHaveStyle({ height: '50dvh' });
  await within(sheet).findByRole('button', { name: /랭킹 단지/ });
  fireEvent.click(within(sheet).getByRole('button', { name: '지표 닫고 목록으로' }));
  expect(chip).toHaveAttribute('aria-pressed', 'false');
  expect(within(sheet).getByText('지도 내 단지')).toBeInTheDocument();
  fireEvent.click(chip);
  fireEvent.click(await within(sheet).findByRole('button', { name: /랭킹 단지/ }));
  await waitFor(() => expect(within(sheet).getByText('상세 A')).toBeInTheDocument());
  expect(within(sheet).queryByRole('button', { name: '지표 닫고 목록으로' })).not.toBeInTheDocument();
  expect(container.firstChild).toHaveClass('h-dvh', 'min-w-0');
});

it('distinguishes mixed-area averages, representative area, and dated recent transactions', () => {
  render(<ComplexListPanel points={[{
    complex_key: 'A', complex_name: '테스트 단지', lat: 37, lng: 127,
    avg_price_manwon: 100000, latest_price_manwon: 110000,
    latest_deal_date: '2026-09-01', rep_area: 84, trade_count: 3, property_type: 'apt',
  }]} dealType="trade" loading={false} markerMode="complex" onSelect={vi.fn()} />);
  expect(screen.getByText('평균 약')).toBeInTheDocument();
  expect(screen.getByText(/최근 거래/)).toBeInTheDocument();
  expect(screen.getByText(/대표면적 약 84㎡/)).toBeInTheDocument();
  expect(screen.getByText('거래일 2026-09-01')).toBeInTheDocument();
  expect(screen.getByText(/전체 면적 혼합 평균/)).toBeInTheDocument();
  expect(screen.getByText(/현재 거래 가능한 매물 정보가 아닙니다/)).toBeInTheDocument();
  expect(screen.queryByText(/최근 6개월 평균/)).not.toBeInTheDocument();
});
