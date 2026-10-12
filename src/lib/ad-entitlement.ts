// 광고 기간(엔타이틀먼트) 계산 — 결제 1건 = 광고 창(window) 1개 [starts_at, expires_at).
// 순수 함수(tierRank/computeWindow/projectJobAd/effectiveJobTier)는 I/O 없음 → 클라이언트에서도 사용.
// recomputeJobAd 만 DB 를 건드리며, 호출자가 service_role 클라이언트를 넘긴다.
// 전제: migration 046(jobs.ad_expires_at, payments.starts_at) 적용.
import type { SupabaseClient } from '@supabase/supabase-js';

const DAY_MS = 24 * 60 * 60 * 1000;
/** 무료(일반) 공고 노출 시간 — 등록 시점 또는 유료 광고 종료 시점부터 */
export const FREE_EXPOSURE_MS = DAY_MS;

type DateLike = string | Date | null | undefined;

export interface AdWindowInput {
  tier: string;
  starts_at: DateLike;
  expires_at: DateLike;
}

interface Win {
  tier: string;
  start: number;
  end: number;
}

// 카테고리별 등급 서열. 표시명과 id 가 다르다(sales-premium = 베이직).
const RANKS: Record<'sales' | 'agent', Record<string, number>> = {
  sales: { premium: 1, superior: 2, dia: 3, unique: 4 },
  agent: { basic: 1, premium: 2, vip: 3 },
};

const TIER_LABELS: Record<'sales' | 'agent', Record<string, string>> = {
  sales: { normal: '일반', premium: '베이직', superior: '슈페리어', dia: '다이아', unique: '유니크' },
  agent: { normal: '일반', basic: 'BASIC', premium: '프리미엄', vip: 'VIP' },
};

function cat(category: string | null | undefined): 'sales' | 'agent' {
  return category === 'sales' ? 'sales' : 'agent';
}

/** 등급 서열 (normal/알 수 없음 = 0). category 가 sales 가 아니면 agent 서열. */
export function tierRank(category: string | null | undefined, tier: string | null | undefined): number {
  if (!tier) return 0;
  return RANKS[cat(category)][tier] ?? 0;
}

/** 등급 표시명 (베이직/슈페리어/다이아/유니크/일반 · BASIC/프리미엄/VIP) */
export function tierLabel(category: string | null | undefined, tier: string | null | undefined): string {
  const t = tier || 'normal';
  return TIER_LABELS[cat(category)][t] ?? t;
}

function toMs(v: DateLike): number | null {
  if (v == null) return null;
  const ms = v instanceof Date ? v.getTime() : Date.parse(v);
  return Number.isFinite(ms) ? ms : null;
}

function normalize(windows: AdWindowInput[]): Win[] {
  const out: Win[] = [];
  for (const w of windows) {
    const start = toMs(w.starts_at);
    const end = toMs(w.expires_at);
    if (start == null || end == null || end <= start || !w.tier) continue;
    out.push({ tier: w.tier, start, end });
  }
  return out;
}

// now 를 덮는 창 중 서열 최고(동률이면 늦게 끝나는 것)
function pickActive(now: number, wins: Win[], category: string | null | undefined): Win | null {
  let best: Win | null = null;
  for (const w of wins) {
    if (!(w.start <= now && now < w.end)) continue;
    if (tierRank(category, w.tier) <= 0) continue;
    if (
      !best ||
      tierRank(category, w.tier) > tierRank(category, best.tier) ||
      (tierRank(category, w.tier) === tierRank(category, best.tier) && w.end > best.end)
    ) {
      best = w;
    }
  }
  return best;
}

export interface ComputeWindowInput {
  newTier: string;
  category: string | null | undefined;
  exposureDays: number;
  approvedAt: Date | string;
  existing: AdWindowInput[];
}

/**
 * 새 결제의 광고 창 계산.
 * - 활성 창 없음 → approvedAt 부터
 * - 새 등급 서열 > 현재 활성 등급 → approvedAt 부터 (즉시 업그레이드. 아래 등급 창은 시계대로 흘러가고,
 *   상위 창이 끝난 뒤에도 남아 있으면 그 등급으로 이어진다)
 * - 같거나 낮은 등급 → 미래에 끝나는 기존 창 중 가장 늦은 expires_at 부터 (이어 붙이기 = 연장/대기)
 */
export function computeWindow(input: ComputeWindowInput): { startsAt: Date; expiresAt: Date } {
  const at = toMs(input.approvedAt) ?? Date.now();
  const wins = normalize(input.existing);
  const active = pickActive(at, wins, input.category);

  let start = at;
  if (active && tierRank(input.category, input.newTier) <= tierRank(input.category, active.tier)) {
    const latestFutureEnd = wins.reduce((m, w) => (w.end > at && w.end > m ? w.end : m), 0);
    if (latestFutureEnd > at) start = latestFutureEnd;
  }
  return { startsAt: new Date(start), expiresAt: new Date(start + input.exposureDays * DAY_MS) };
}

export interface AdPurchasePlan {
  startsAt: Date;
  expiresAt: Date;
  /** 결제 즉시 시작하는지 (false = 기존 기간 뒤에 이어 붙음) */
  startsNow: boolean;
  /** 업그레이드 후에도 남아서 새 창이 끝난 뒤 이어지는 하위 등급 기간 */
  resumes: { tier: string; until: Date }[];
  /** 업그레이드 창 안에서 함께 지나가 버리는 하위 등급 */
  overlapped: string[];
}

/** 화면 안내용: computeWindow 결과 + 기존 하위 등급 창이 어떻게 되는지 */
export function planAdPurchase(input: ComputeWindowInput): AdPurchasePlan {
  const { startsAt, expiresAt } = computeWindow(input);
  const at = toMs(input.approvedAt) ?? Date.now();
  const startsNow = startsAt.getTime() <= at;
  const resumes: { tier: string; until: Date }[] = [];
  const overlapped: string[] = [];
  if (startsNow) {
    const newRank = tierRank(input.category, input.newTier);
    for (const w of normalize(input.existing)) {
      if (w.end <= at || tierRank(input.category, w.tier) >= newRank) continue;
      if (w.end > expiresAt.getTime()) resumes.push({ tier: w.tier, until: new Date(w.end) });
      else if (!overlapped.includes(w.tier)) overlapped.push(w.tier);
    }
  }
  return { startsAt, expiresAt, startsNow, resumes, overlapped };
}

export interface JobAdProjection {
  tier: string;
  adExpiresAt: Date | null;
}

/**
 * 시점 now 의 공고 등급.
 * - now 를 덮는 창 중 서열 최고(동률 → 늦게 끝나는 것). 없으면 'normal'
 * - adExpiresAt = 선택된 창의 끝 / 활성 창이 없으면 모든 창 중 가장 늦은 끝 / 창이 없으면 null
 */
export function projectJobAd(
  now: Date | string,
  windows: AdWindowInput[],
  category?: string | null,
): JobAdProjection {
  const at = toMs(now) ?? Date.now();
  const wins = normalize(windows);
  const active = pickActive(at, wins, category);
  if (active) return { tier: active.tier, adExpiresAt: new Date(active.end) };
  if (wins.length === 0) return { tier: 'normal', adExpiresAt: null };
  const latest = wins.reduce((m, w) => Math.max(m, w.end), 0);
  return { tier: 'normal', adExpiresAt: new Date(latest) };
}

/**
 * 읽기 경로용: 크론이 돌기 전이라도 ad_expires_at 이 지났으면 일반으로 본다.
 * ad_expires_at 이 없는 유료 등급(수동 지정·레거시)은 그대로 둔다.
 */
export function effectiveJobTier(
  job: { tier?: string | null; ad_expires_at?: string | null },
  now: Date = new Date(),
): string {
  const tier = job.tier || 'normal';
  if (tier === 'normal') return 'normal';
  const exp = toMs(job.ad_expires_at);
  if (exp != null && exp <= now.getTime()) return 'normal';
  return tier;
}

/**
 * 무료 노출 만료 여부: 일반 등급(유효 등급 기준)이면 coalesce(ad_expires_at, created_at) + 24h 가 지났는지.
 */
export function isFreeExposureOver(
  job: { tier?: string | null; ad_expires_at?: string | null; created_at?: string | null },
  now: Date = new Date(),
): boolean {
  if (effectiveJobTier(job, now) !== 'normal') return false;
  const base = toMs(job.ad_expires_at) ?? toMs(job.created_at);
  if (base == null) return false;
  return now.getTime() > base + FREE_EXPOSURE_MS;
}

/** KST 날짜(YYYY-MM-DD) */
export function toKstDate(d: Date): string {
  return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// ────────────────────────────────────────────────────────────
// 서버 헬퍼 (I/O)
// ────────────────────────────────────────────────────────────

export class AdEntitlementError extends Error {}

export interface JobWindowRow {
  tier: string;
  starts_at: string | null;
  paid_at: string | null;
  expires_at: string | null;
}

/** 공고의 완료 결제 → 광고 창 목록 (starts_at 이 비어 있으면 paid_at) */
export async function loadJobWindows(db: SupabaseClient, jobId: string): Promise<AdWindowInput[]> {
  const { data, error } = await db
    .from('payments')
    .select('tier, starts_at, paid_at, expires_at')
    .eq('job_id', jobId)
    .eq('payment_status', 'completed');
  if (error) {
    console.error('[ad-entitlement] payments 조회 실패 — migration 046(payments.starts_at) 적용 여부를 확인하세요:', error);
    throw new AdEntitlementError('payments 조회 실패');
  }
  return ((data ?? []) as JobWindowRow[]).map((r) => ({
    tier: r.tier,
    starts_at: r.starts_at ?? r.paid_at,
    expires_at: r.expires_at,
  }));
}

/**
 * 완료 결제로부터 jobs.tier / jobs.ad_expires_at 를 다시 계산해 저장한다. 멱등.
 * extraUpdate 는 같은 UPDATE 에 함께 실어 보낼 필드(예: is_active, deadline).
 */
export async function recomputeJobAd(
  db: SupabaseClient,
  jobId: string,
  now: Date = new Date(),
  opts: { category?: string | null; extraUpdate?: Record<string, unknown> } = {},
): Promise<JobAdProjection | null> {
  let category = opts.category;
  if (category === undefined) {
    const { data: job, error } = await db.from('jobs').select('category').eq('id', jobId).maybeSingle();
    if (error) {
      console.error('[ad-entitlement] jobs 조회 실패:', error);
      throw new AdEntitlementError('jobs 조회 실패');
    }
    if (!job) return null;
    category = (job as { category: string | null }).category;
  }

  const windows = await loadJobWindows(db, jobId);
  const projection = projectJobAd(now, windows, category);

  const { error: updateError } = await db
    .from('jobs')
    .update({
      ...(opts.extraUpdate ?? {}),
      tier: projection.tier,
      ad_expires_at: projection.adExpiresAt ? projection.adExpiresAt.toISOString() : null,
    })
    .eq('id', jobId);
  if (updateError) {
    console.error('[ad-entitlement] jobs.tier/ad_expires_at 갱신 실패 — migration 046(jobs.ad_expires_at, jobs_tier_check dia) 적용 여부를 확인하세요:', updateError);
    throw new AdEntitlementError('jobs 갱신 실패');
  }
  return projection;
}
