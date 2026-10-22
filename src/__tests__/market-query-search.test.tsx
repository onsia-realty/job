import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import MarketSearch from '@/components/market/MarketSearch';
import { useComplexDetail } from '@/lib/market/queries';

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return function QueryWrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; };
}
const response = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 503, json: async () => body }) as Response;
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('never lends A detail to B while B is loading or fails', async () => {
  let finish!: (value: Response) => void;
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ complex_name: 'A' })).mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; })));
  const { result, rerender } = renderHook(({ key }) => {
    const { data, isError } = useComplexDetail(key);
    return { data, isError };
  }, { initialProps: { key: 'A' }, wrapper: wrapper() });
  await waitFor(() => expect(result.current.data?.complex_name).toBe('A'));
  rerender({ key: 'B' });
  expect(result.current.data).toBeUndefined();
  await act(async () => finish(response({}, false)));
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.data).toBeUndefined();
});

it('opens for first input, distinguishes empty/error and retries', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(response({}, false)).mockResolvedValueOnce(response({ results: [] }));
  vi.stubGlobal('fetch', fetchMock);
  render(<MarketSearch onSelect={vi.fn()} />, { wrapper: wrapper() });
  fireEvent.change(screen.getByRole('textbox', { name: '단지명 검색' }), { target: { value: '없는단지' } });
  expect(screen.getByText('검색 중…')).toBeInTheDocument();
  await screen.findByRole('alert');
  expect(screen.queryByText('결과 없음')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
  await screen.findByText('결과 없음');
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it('hides previous results during debounce and Escape stays closed after response', async () => {
  let finish!: (value: Response) => void;
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ results: [{ complex_key: 'A', complex_name: 'A단지', lat: 37, lng: 127 }] })).mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; })));
  const select = vi.fn();
  render(<MarketSearch onSelect={select} />, { wrapper: wrapper() });
  const input = screen.getByRole('textbox', { name: '단지명 검색' });
  fireEvent.change(input, { target: { value: 'A' } });
  await screen.findByText('A단지');
  fireEvent.change(input, { target: { value: 'B' } });
  expect(screen.queryByText('A단지')).not.toBeInTheDocument();
  await waitFor(() => expect(finish).toBeDefined());
  fireEvent.keyDown(input, { key: 'Escape' });
  await act(async () => finish(response({ results: [] })));
  expect(screen.queryByText('결과 없음')).not.toBeInTheDocument();
  fireEvent.focus(input);
  await screen.findByText('결과 없음');
  fireEvent.click(screen.getByRole('button', { name: '검색어 지우기' }));
  expect(input).toHaveValue('');
  expect(select).not.toHaveBeenCalled();
});
