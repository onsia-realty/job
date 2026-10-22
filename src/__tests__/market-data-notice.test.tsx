import { cleanup, render, screen, waitFor } from '@testing-library/react';
import MarketDataNotice, { combineMarketMetadata } from '@/components/market/MarketDataNotice';
import MarketIndicatorPanel from '@/components/market/MarketIndicatorPanel';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('distinguishes collection, ranking and unknown aggregate freshness without servedAt', () => {
  render(<MarketDataNotice metadata={{ periodStart: '2026-01-01', periodEnd: '2026-10-01', collectionOldestAt: '2026-10-01T00:00:00Z', collectionNewestAt: '2026-10-02T00:00:00Z', rankingComputedAt: '2026-10-03', servedAt: '2099-01-01', stale: true, truncated: true, persistenceError: 'internal details' }} />);
  expect(screen.getByRole('note')).toHaveTextContent('2026-01-01 ~ 2026-10-01');
  expect(screen.getByRole('note')).toHaveTextContent('전체 수집 완료 시각 아님');
  expect(screen.getByRole('note')).toHaveTextContent('집계 갱신 시각 확인 불가');
  expect(screen.getByRole('note')).toHaveTextContent('순위 계산 시각 2026-10-03');
  expect(screen.getByRole('note')).toHaveTextContent('조회 한도');
  expect(screen.getByRole('note')).toHaveTextContent('저장 실패');
  expect(screen.getByRole('note')).not.toHaveTextContent('2099');
  expect(screen.getByRole('note')).not.toHaveTextContent('internal details');
});

it('combines all responses conservatively and never substitutes served time', () => {
  const a = { periodStart: '2026-01', periodEnd: '2026-02', collectionOldestAt: '2026-03-01', collectionNewestAt: '2026-03-02', stale: false };
  expect(combineMarketMetadata([a, { ...a, periodEnd: '2026-04', stale: true, truncated: true, persistenceError: 'failed' }])).toMatchObject({ periodStart: '2026-01', periodEnd: '2026-04', stale: true, truncated: true, persistenceError: '저장 실패' });
  expect(combineMarketMetadata([a, undefined])).toMatchObject({ missing: true, stale: true, collectionOldestAt: null, periodStart: null });
  expect(combineMarketMetadata([])).toMatchObject({ missing: true, stale: true });
});

it('shows ranking HTTP errors instead of empty success and clears previous metadata', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ rankings: [], metadata: { periodStart: '2026-01-01' } }) }).mockResolvedValueOnce({ ok: false, status: 503 }));
  const props = { onMetricChange: vi.fn(), onClose: vi.fn(), onSelectComplex: vi.fn() };
  const { rerender } = render(<MarketIndicatorPanel metric="rise" {...props} />);
  await waitFor(() => expect(screen.getByRole('note')).toHaveTextContent('2026-01-01'));
  rerender(<MarketIndicatorPanel metric="drop" {...props} />);
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('불러오지 못했습니다'));
  expect(screen.queryByRole('note')).not.toBeInTheDocument();
  expect(screen.queryByText('데이터가 없습니다')).not.toBeInTheDocument();
});
