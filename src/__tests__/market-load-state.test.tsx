import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import MarketPageClient from '@/app/market/MarketPageClient';

const mocks = vi.hoisted(() => ({ replace: vi.fn(), map: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => mocks, useSearchParams: () => new URLSearchParams('lat=37.51720&lng=127.04730&zoom=14&deal=trade&type=apt&region=11680') }));
vi.mock('next/script', () => ({ default: () => null }));
vi.mock('next/dynamic', () => ({ default: () => (props: { loading?: boolean; error?: boolean; onViewChanged: (lat: number, lng: number, zoom: number) => void; onBoundsChanged: (a: number, b: number, c: number, d: number) => void }) => {
  mocks.map(props);
  return <><button onClick={() => props.onViewChanged(37.5172, 127.0473, 11)}>zoom out</button><button onClick={() => props.onBoundsChanged(37, 127, 38, 128)}>bounds</button></>;
} }));
vi.mock('@/lib/market/queries', () => ({ useBrokersNearby: () => ({}), useJobsNearby: () => ({}), useGuAggregates: () => ({}) }));
vi.mock('@/components/market/MarketSearch', () => ({ default: () => null }));
vi.mock('@/components/market/MarketIndicatorPanel', () => ({ default: () => null }));
vi.mock('@/components/market/MarketFilterSheet', () => ({ default: () => null }));
vi.mock('@/components/market/ComplexDetailView', () => ({ default: () => null }));
vi.mock('@/components/market/BottomSheet', () => ({ default: ({ children, peekContent }: { children: ReactNode; peekContent: ReactNode }) => <section>{peekContent}{children}</section> }));
const response = (ok = true) => ({ ok, status: ok ? 200 : 503, json: async () => ({ transactions: [] }) }) as Response;
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); });

it('HTTP failure is an error in both panels, retry can reach honest empty', async () => {
  const fetchMock = vi.fn().mockResolvedValue(response(false));
  vi.stubGlobal('fetch', fetchMock);
  render(<MarketPageClient />);
  await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2));
  expect(mocks.map).toHaveBeenLastCalledWith(expect.objectContaining({ loading: false, error: true }));
  expect(screen.getAllByText('거래 데이터 조회 실패')).toHaveLength(2);
  expect(screen.queryByText('0개 단지')).not.toBeInTheDocument();
  expect(screen.queryByText('이 영역에 거래 단지가 없습니다')).not.toBeInTheDocument();
  fetchMock.mockResolvedValue(response());
  fireEvent.click(screen.getAllByRole('button', { name: '다시 시도' })[0]);
  await waitFor(() => expect(screen.getAllByText('이 영역에 거래 단지가 없습니다')).toHaveLength(2));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(mocks.map).toHaveBeenLastCalledWith(expect.objectContaining({ loading: false, error: false }));
  expect(screen.getByText('0개 단지')).toBeInTheDocument();
});

it('reference-deal failure fails closed even if active deal succeeds', async () => {
  vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(response(!url.includes('deal=rent')))));
  render(<MarketPageClient />);
  await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2));
});

it('changing the active deal clears old trade results while loading and on failure', async () => {
  const payload = {
    metadata: { periodStart: '2026-09-01', periodEnd: '2026-09-30', stale: false, truncated: false },
    transactions: [{ complex_key: 'A', complex_name: '기존 매매 단지', price_manwon: 100000, exclusive_area: 84, deal_date: '2026-09-01' }],
    complex_coords: { A: { lat: 37.5, lng: 127, hhld_cnt: 100, build_year: 2000 } },
  };
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
  vi.stubGlobal('fetch', fetchMock);
  render(<MarketPageClient />);
  await waitFor(() => expect(screen.getAllByText('기존 매매 단지')).toHaveLength(2));
  expect(screen.getAllByRole('note')[0]).toHaveTextContent('2026-09-01 ~ 2026-09-30');
  expect(screen.getAllByAltText('도시 건물과 시세·거래량을 표현한 일러스트')[0]).toHaveAttribute('src');
  let finish!: (value: Response) => void;
  fetchMock.mockImplementation(() => new Promise<Response>((resolve) => { finish = resolve; }));
  fireEvent.click(screen.getByRole('button', { name: '전세' }));
  expect(screen.queryByText('기존 매매 단지')).not.toBeInTheDocument();
  expect(screen.getAllByText('단지를 불러오는 중…')).toHaveLength(2);
  expect(screen.queryByRole('note')).not.toBeInTheDocument();
  expect(mocks.map).toHaveBeenLastCalledWith(expect.objectContaining({ loading: true, error: false }));
  await act(async () => finish(response(false)));
  await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2));
  expect(screen.queryByText('기존 매매 단지')).not.toBeInTheDocument();
  expect(screen.queryByText('이 영역에 거래 단지가 없습니다')).not.toBeInTheDocument();
});

it('obsolete rejection/finally cannot replace a newer successful bounds result', async () => {
  let reject!: (error: Error) => void;
  vi.stubGlobal('fetch', vi.fn((url: string) => url.includes('bounds=') ? Promise.resolve(response()) : new Promise<Response>((_resolve, fail) => { reject = fail; })));
  render(<MarketPageClient />);
  fireEvent.click(screen.getByText('bounds'));
  await waitFor(() => expect(screen.getAllByText('이 영역에 거래 단지가 없습니다')).toHaveLength(2));
  await act(async () => reject(new Error('old request')));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('entering gu mode invalidates pending errors', async () => {
  let reject!: (error: Error) => void;
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((_resolve, fail) => { reject = fail; })));
  render(<MarketPageClient />);
  fireEvent.click(screen.getByText('zoom out'));
  await act(async () => reject(new Error('obsolete')));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.queryByText('단지를 불러오는 중…')).not.toBeInTheDocument();
});
