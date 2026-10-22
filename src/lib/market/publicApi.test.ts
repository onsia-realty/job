import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchMolit } from './publicApi';

const params = { endpoint: 'https://fixture.invalid/molit', lawd_cd: '11110', deal_ymd: '202610', service_key: 'fixture-secret' };
function fixture(total: number | string, page: number, ids: number[], size = 1000) {
  return new Response(`<response><header><resultCode>000</resultCode></header><body><items>${ids.map(id => `<item><id>${id}</id></item>`).join('')}</items><totalCount>${total}</totalCount><pageNo>${page}</pageNo><numOfRows>${size}</numOfRows></body></response>`);
}
const ids = (start: number, length: number) => Array.from({ length }, (_, i) => start + i);
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('complete MOLIT pagination', () => {
  it('collects all 1001 rows with the default 1000-row page', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(fixture(1001, 1, ids(0, 1000)))
      .mockResolvedValueOnce(fixture(1001, 2, [1000]));
    vi.stubGlobal('fetch', fetcher);
    const result = await fetchMolit<{ id: string }>(params);
    expect(result).toHaveLength(1001);
    expect(result[1000].id).toBe('1000');
    expect(new URL(fetcher.mock.calls[1][0]).searchParams.get('pageNo')).toBe('2');
    expect(new URL(fetcher.mock.calls[0][0]).searchParams.get('numOfRows')).toBe('1000');
  });
  it('accepts a valid empty response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fixture(0, 1, [])));
    await expect(fetchMolit(params)).resolves.toEqual([]);
  });
  it('rejects a middle-page failure without leaking the request URL', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(fixture(2001, 1, ids(0, 1000)))
      .mockRejectedValueOnce(new Error(`${params.endpoint}?serviceKey=${params.service_key}`));
    vi.stubGlobal('fetch', fetcher);
    await expect(fetchMolit(params)).rejects.toThrow(/^MOLIT API incomplete response$/);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('rejects repeated content even when pageNo advances', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(fixture(2000, 1, ids(0, 1000)))
      .mockResolvedValueOnce(fixture(2000, 2, ids(0, 1000).reverse())));
    await expect(fetchMolit(params)).rejects.toThrow('incomplete response');
  });
  it.each([[20001, 1000], [21, 1]])('rejects a total beyond row/page budget (%i/%i)', async (total, size) => {
    const fetcher = vi.fn().mockResolvedValue(fixture(total, 1, ids(0, size), size));
    vi.stubGlobal('fetch', fetcher);
    await expect(fetchMolit({ ...params, num_of_rows: size })).rejects.toThrow('incomplete response');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('accepts exactly 20 pages / 20000 rows', async () => {
    const fetcher = vi.fn(async (url: string) => {
      const page = Number(new URL(url).searchParams.get('pageNo'));
      return fixture(20000, page, ids((page - 1) * 1000, 1000));
    });
    vi.stubGlobal('fetch', fetcher);
    await expect(fetchMolit(params)).resolves.toHaveLength(20000);
    expect(fetcher).toHaveBeenCalledTimes(20);
  });
  it.each(['', '-1', '1.5', 'NaN', '1e3', '9007199254740992'])('rejects invalid count %s', async total => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fixture(total, 1, [])));
    await expect(fetchMolit(params)).rejects.toThrow('incomplete response');
  });
  it('rejects an incomplete page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fixture(1001, 1, [1])));
    await expect(fetchMolit(params)).rejects.toThrow('incomplete response');
  });
  it('rejects changing totals and incorrect page metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(fixture(1001, 1, ids(0, 1000)))
      .mockResolvedValueOnce(fixture(1002, 2, [1000, 1001])));
    await expect(fetchMolit(params)).rejects.toThrow('incomplete response');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fixture(0, 2, [])));
    await expect(fetchMolit(params)).rejects.toThrow('incomplete response');
  });
  it('sanitizes HTTP and provider error messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500, statusText: params.service_key })));
    await expect(fetchMolit(params)).rejects.toThrow(/^MOLIT API incomplete response$/);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`<response><header><resultCode>99</resultCode><resultMsg>${params.service_key}</resultMsg></header></response>`)));
    await expect(fetchMolit(params)).rejects.toThrow(/^MOLIT API incomplete response$/);
  });
  it('aborts a hanging request after the whole-call timeout', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal('fetch', vi.fn((_url, init: RequestInit) => {
      signal = init.signal!;
      return new Promise(() => {});
    }));
    const pending = expect(fetchMolit(params)).rejects.toThrow('MOLIT API timeout');
    await vi.advanceTimersByTimeAsync(30000);
    await pending;
    expect(signal?.aborted).toBe(true);
  });
});
