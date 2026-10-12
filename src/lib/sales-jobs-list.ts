// /sales/jobs 목록용 순수 헬퍼 — URL 파라미터 파싱/직렬화, DB+샘플 병합, 정렬.
// UI 없이 테스트 가능하도록 페이지에서 분리.
import type { SalesJobListing, SalesJobTier, SalesJobType } from '@/types';

export type SalesJobSort = 'latest' | 'commission' | 'views';

/** 목록 표시용 공고. isSample=true 는 샘플 데이터(사용자에게 라벨 노출 안 함, 내부 동작 분기용). */
export type ListedSalesJob = SalesJobListing & { isSample?: boolean };

export const SALES_JOB_SORTS: readonly SalesJobSort[] = ['latest', 'commission', 'views'];
const TIERS: readonly SalesJobTier[] = ['unique', 'superior', 'premium', 'normal'];
const TYPES: readonly SalesJobType[] = ['apartment', 'officetel', 'store', 'industrial'];

export interface SalesJobsQuery {
  tier: SalesJobTier | 'all';
  region: string; // '전체' = 필터 없음
  type: SalesJobType | 'all';
  sort: SalesJobSort;
}

export const DEFAULT_SALES_JOBS_QUERY: SalesJobsQuery = {
  tier: 'all',
  region: '전체',
  type: 'all',
  sort: 'latest',
};

/** URL 검색 파라미터 → 필터 상태. 허용되지 않은 값은 기본값으로. */
export function parseSalesJobsQuery(
  get: (key: string) => string | null,
  regions: readonly string[],
): SalesJobsQuery {
  const tier = get('tier');
  const region = get('region');
  const type = get('type');
  const sort = get('sort');
  return {
    tier: TIERS.includes(tier as SalesJobTier) ? (tier as SalesJobTier) : 'all',
    region: region && regions.includes(region) ? region : '전체',
    type: TYPES.includes(type as SalesJobType) ? (type as SalesJobType) : 'all',
    sort: SALES_JOB_SORTS.includes(sort as SalesJobSort) ? (sort as SalesJobSort) : 'latest',
  };
}

/** 필터 상태 변경분을 URLSearchParams 에 반영. 기본값이면 키를 지운다(깨끗한 URL). */
export function applySalesJobsQuery(params: URLSearchParams, patch: Partial<SalesJobsQuery>): void {
  (Object.keys(patch) as (keyof SalesJobsQuery)[]).forEach((key) => {
    const value = patch[key];
    if (value === undefined || value === DEFAULT_SALES_JOBS_QUERY[key]) params.delete(key);
    else params.set(key, value);
  });
}

/** 수수료 문구('최대 400만', '1,500만원')에서 숫자만 추출. 없으면 0. (/sales 의 amountNum 과 동일 규칙) */
export function amountNum(s?: string | null): number {
  return Number((s || '').replace(/[^\d]/g, '')) || 0;
}

/** 'YYYY.MM.DD' / 'YYYY-MM-DD' → epoch ms. 파싱 불가면 0. */
export function createdAtMs(s?: string | null): number {
  if (!s) return 0;
  const t = Date.parse(s.trim().replace(/\./g, '-'));
  return Number.isNaN(t) ? 0 : t;
}

const FREE_EXPOSURE_MS = 24 * 60 * 60 * 1000;

/**
 * 무료 노출 남은 시간(시간 단위, 올림, 0 이상). 크론 규칙과 동일하게 coalesce(adExpiresAt, createdAtIso) + 24h.
 * ISO 원본이 없으면(구버전 데이터) 표시용 createdAt(날짜만)으로 대체. 계산 불가면 null.
 */
export function freeHoursLeft(
  job: Pick<SalesJobListing, 'createdAt' | 'createdAtIso' | 'adExpiresAt'>,
  now: number = Date.now(),
): number | null {
  const iso = job.adExpiresAt || job.createdAtIso;
  const base = iso ? Date.parse(iso) : createdAtMs(job.createdAt) || NaN;
  if (!Number.isFinite(base)) return null;
  return Math.max(0, Math.ceil((base + FREE_EXPOSURE_MS - now) / (60 * 60 * 1000)));
}

/** DB 공고를 앞에, 샘플을 뒤에. id 중복은 DB 가 우선(먼저 나온 것 유지). 샘플엔 isSample 표시. */
export function mergeSalesJobs(
  dbJobs: readonly SalesJobListing[],
  samples: readonly SalesJobListing[],
): ListedSalesJob[] {
  const seen = new Set<string>();
  const out: ListedSalesJob[] = [];
  for (const j of dbJobs) {
    if (seen.has(j.id)) continue;
    seen.add(j.id);
    out.push({ ...j, isSample: false });
  }
  for (const j of samples) {
    if (seen.has(j.id)) continue;
    seen.add(j.id);
    out.push({ ...j, isSample: true });
  }
  return out;
}

/**
 * 정렬. 실공고(DB)는 항상 샘플보다 앞(운영 방침: 실공고 우선 노출),
 * 각 그룹 안에서 기준값 내림차순. 동률은 원래 순서 유지(안정 정렬).
 */
export function sortSalesJobs<T extends ListedSalesJob>(jobs: readonly T[], sort: SalesJobSort): T[] {
  const key = (j: T): number => {
    if (sort === 'commission') return amountNum(j.salary?.amount);
    if (sort === 'views') return j.views || 0;
    return createdAtMs(j.createdAt);
  };
  return jobs
    .map((job, idx) => ({ job, idx, k: key(job), s: job.isSample ? 1 : 0 }))
    .sort((a, b) => a.s - b.s || b.k - a.k || a.idx - b.idx)
    .map((x) => x.job);
}
