import { describe, it, expect } from 'vitest';
import {
  amountNum,
  applySalesJobsQuery,
  createdAtMs,
  freeHoursLeft,
  mergeSalesJobs,
  parseSalesJobsQuery,
  sortSalesJobs,
} from '@/lib/sales-jobs-list';
import type { SalesJobListing } from '@/types';

const REGIONS = ['서울', '경기', '부산'] as const;

function job(id: string, over: Partial<SalesJobListing> = {}): SalesJobListing {
  return {
    id,
    title: `공고 ${id}`,
    description: '',
    type: 'apartment',
    tier: 'normal',
    badges: [],
    position: 'member',
    salary: { type: 'commission', amount: undefined },
    benefits: [],
    experience: 'none',
    company: '회사',
    region: '서울',
    views: 0,
    createdAt: '2026.01.01',
    ...over,
  } as SalesJobListing;
}

const getter = (qs: string) => {
  const p = new URLSearchParams(qs);
  return (k: string) => p.get(k);
};

describe('parseSalesJobsQuery', () => {
  it('허용 값은 그대로 읽는다', () => {
    expect(parseSalesJobsQuery(getter('tier=superior&region=경기&type=store&sort=commission'), REGIONS)).toEqual({
      tier: 'superior',
      region: '경기',
      type: 'store',
      sort: 'commission',
    });
    expect(parseSalesJobsQuery(getter('tier=premium'), REGIONS).tier).toBe('premium');
    expect(parseSalesJobsQuery(getter('tier=normal'), REGIONS).tier).toBe('normal');
  });

  it('없는 값·잘못된 값은 기본값', () => {
    expect(parseSalesJobsQuery(getter('tier=gold&region=화성&type=x&sort=random'), REGIONS)).toEqual({
      tier: 'all',
      region: '전체',
      type: 'all',
      sort: 'latest',
    });
    expect(parseSalesJobsQuery(getter(''), REGIONS).sort).toBe('latest');
  });
});

describe('applySalesJobsQuery', () => {
  it('기본값이면 키를 지우고, 아니면 설정한다', () => {
    const p = new URLSearchParams('tier=premium&foo=1');
    applySalesJobsQuery(p, { tier: 'all', sort: 'views', region: '부산' });
    expect(p.get('tier')).toBeNull();
    expect(p.get('sort')).toBe('views');
    expect(p.get('region')).toBe('부산');
    expect(p.get('foo')).toBe('1');
    applySalesJobsQuery(p, { sort: 'latest', region: '전체' });
    expect(p.toString()).toBe('foo=1');
  });
});

describe('amountNum / createdAtMs', () => {
  it('수수료 문구에서 숫자를 뽑는다', () => {
    expect(amountNum('최대 400만')).toBe(400);
    expect(amountNum('1,500만원')).toBe(1500);
    expect(amountNum('협의')).toBe(0);
    expect(amountNum(undefined)).toBe(0);
  });
  it('날짜 문자열을 파싱한다', () => {
    expect(createdAtMs('2026.03.02')).toBeGreaterThan(createdAtMs('2026.01.17'));
    expect(createdAtMs('bad')).toBe(0);
    expect(createdAtMs(undefined)).toBe(0);
  });
});

describe('freeHoursLeft', () => {
  const now = Date.parse('2026-09-29T12:00:00.000Z');
  it('등록 시각(ISO) 기준 24시간', () => {
    expect(freeHoursLeft({ createdAt: '2026.09.29', createdAtIso: '2026-09-29T10:00:00.000Z' }, now)).toBe(22);
  });
  it('유료 광고가 끝났으면 광고 종료 시각부터 24시간', () => {
    expect(freeHoursLeft({ createdAt: '2026.09.01', createdAtIso: '2026-09-01T00:00:00.000Z', adExpiresAt: '2026-09-29T06:00:00.000Z' }, now)).toBe(18);
  });
  it('지났으면 0, ISO 가 없으면 표시용 날짜로 대체, 파싱 불가면 null', () => {
    expect(freeHoursLeft({ createdAt: '2026.09.01', createdAtIso: '2026-09-01T00:00:00.000Z' }, now)).toBe(0);
    expect(freeHoursLeft({ createdAt: '2026.09.29' }, now)).toBe(12);
    expect(freeHoursLeft({ createdAt: 'bad' }, now)).toBeNull();
  });
});

describe('mergeSalesJobs', () => {
  it('DB 를 앞에, 샘플을 뒤에 두고 id 중복은 DB 우선으로 제거한다', () => {
    const merged = mergeSalesJobs(
      [job('a', { title: 'DB-a' }), job('b'), job('a', { title: 'DB-a-dup' })],
      [job('a', { title: 'S-a' }), job('1'), job('2')],
    );
    expect(merged.map((j) => j.id)).toEqual(['a', 'b', '1', '2']);
    expect(merged[0].title).toBe('DB-a');
    expect(merged.map((j) => j.isSample)).toEqual([false, false, true, true]);
  });
});

describe('sortSalesJobs', () => {
  const list = mergeSalesJobs(
    [
      job('db-low', { salary: { type: 'commission', amount: '100만' }, views: 5, createdAt: '2026.09.01' }),
      job('db-high', { salary: { type: 'commission', amount: '900만' }, views: 1, createdAt: '2026.09.20' }),
    ],
    [
      job('s-top', { salary: { type: 'commission', amount: '최대 5,000만' }, views: 999, createdAt: '2026.12.31' }),
      job('s-mid', { salary: { type: 'commission', amount: '300만' }, views: 10, createdAt: '2026.01.01' }),
    ],
  );

  it('수수료 높은순: 숫자 비교, 실공고가 샘플보다 먼저', () => {
    expect(sortSalesJobs(list, 'commission').map((j) => j.id)).toEqual(['db-high', 'db-low', 's-top', 's-mid']);
  });
  it('조회순', () => {
    expect(sortSalesJobs(list, 'views').map((j) => j.id)).toEqual(['db-low', 'db-high', 's-top', 's-mid']);
  });
  it('최신순', () => {
    expect(sortSalesJobs(list, 'latest').map((j) => j.id)).toEqual(['db-high', 'db-low', 's-top', 's-mid']);
  });
  it('원본 배열을 바꾸지 않는다', () => {
    const before = list.map((j) => j.id);
    sortSalesJobs(list, 'commission');
    expect(list.map((j) => j.id)).toEqual(before);
  });
});
