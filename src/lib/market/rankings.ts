import { supabaseAdmin } from '@/lib/supabase-server';

// 시세자료 지표 — 느린(원자료 스캔) 지표 계산 로직.
// cron이 미리 계산해 market_rankings에 저장하고, API는 읽기만 → 즉시 응답.
// 여기 함수는 cron(빌드)과 API(폴백) 양쪽에서 공유.

const PAGE = 1000;
const MAX_PAGES = 80;
const LOOKBACK_MONTHS = 6;
const RECENT_MONTHS = 3;       // "최근" 거래 인정 기간
const GAP_MAX_ABS_PCT = 70;    // 명백한 오기재만 컷 (아실도 −55% 등 큰 하락은 노출)
const TOP_N = 30;
const PY = 3.3058;

const SIDO_PREFIX: Record<string, string> = { '서울특별시': '11', '경기도': '41' };

export const RANK_SIDOS = ['all', '서울특별시', '경기도'] as const;
export const RANK_TYPES = ['apt', 'officetel'] as const;
export const SLOW_METRICS = ['highest', 'drop', 'rise'] as const;
export type SlowMetric = (typeof SLOW_METRICS)[number];

export const cacheKey = (metric: string, sido: string, type: string) => `${metric}|${sido}|${type}`;

type Tx = {
  complex_key: string; complex_name: string | null; lawd_cd: string | null;
  exclusive_area: number | null; price_manwon: number | null; deal_date: string; floor: number | null;
};
type Deal = { date: string; price: number; floor: number | null; area: number };
type Bucket = { complex_name: string | null; lawd_cd: string | null; deals: Deal[] };

const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };

async function fetchTrades(property_type: string, sido: string): Promise<Tx[]> {
  const since = new Date(); since.setMonth(since.getMonth() - LOOKBACK_MONTHS); since.setDate(1);
  const sinceStr = since.toISOString().slice(0, 10);
  const prefix = sido !== 'all' ? SIDO_PREFIX[sido] : undefined;
  const rows: Tx[] = [];
  for (let p = 0; p < MAX_PAGES; p++) {
    let q = supabaseAdmin.from('price_transactions')
      .select('complex_key, complex_name, lawd_cd, exclusive_area, price_manwon, deal_date, floor')
      .eq('property_type', property_type).eq('deal_type', 'trade').eq('cancel_yn', false)
      .neq('deal_channel', '직거래').gte('deal_date', sinceStr);
    if (prefix) q = q.like('lawd_cd', `${prefix}%`);
    const { data, error } = await q.range(p * PAGE, (p + 1) * PAGE - 1);
    if (error) throw error;
    rows.push(...((data || []) as Tx[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

function groupByComplexArea(rows: Tx[]): Map<string, Bucket> {
  const groups = new Map<string, Bucket>();
  for (const t of rows) {
    if (!t.exclusive_area || t.exclusive_area <= 0 || !t.price_manwon || t.price_manwon <= 0 || !t.deal_date) continue;
    const gk = `${t.complex_key}|${Math.round(t.exclusive_area)}`;
    let g = groups.get(gk);
    if (!g) { g = { complex_name: t.complex_name, lawd_cd: t.lawd_cd, deals: [] }; groups.set(gk, g); }
    g.deals.push({ date: t.deal_date, price: t.price_manwon, floor: t.floor, area: t.exclusive_area });
  }
  return groups;
}

function rankHighest(groups: Map<string, Bucket>) {
  const entries = [];
  for (const [gk, g] of groups) {
    const [complex_key] = gk.split('|');
    const prices = g.deals.map((d) => d.price).sort((a, b) => a - b);
    const med = prices[Math.floor(prices.length / 2)];
    const clean = g.deals.filter((d) => d.price <= med * 1.6 && d.price >= med * 0.5);
    if (!clean.length) continue;
    const top = clean.reduce((m, d) => (d.price > m.price ? d : m), clean[0]);
    entries.push({
      complex_key, complex_name: g.complex_name, lawd_cd: g.lawd_cd, region_name: g.lawd_cd,
      pyeong: Math.round(top.area / PY), exclusive_area: Math.round(top.area * 10) / 10,
      recent_date: top.date, recent_price_manwon: top.price, recent_floor: top.floor, hhld_cnt: null as number | null,
    });
  }
  entries.sort((a, b) => b.recent_price_manwon - a.recent_price_manwon);
  return dedupeByComplex(entries);
}

function rankGap(groups: Map<string, Bucket>, isRise: boolean) {
  const recentSince = new Date(); recentSince.setMonth(recentSince.getMonth() - RECENT_MONTHS); recentSince.setDate(1);
  const recentSinceStr = recentSince.toISOString().slice(0, 10);
  const entries = [];
  for (const [gk, g] of groups) {
    if (g.deals.length < 2) continue;
    const [complex_key] = gk.split('|');
    const prices = g.deals.map((d) => d.price).sort((a, b) => a - b);
    const med = prices[Math.floor(prices.length / 2)];
    const clean = g.deals.filter((d) => d.price >= med * 0.4 && d.price <= med * 2.2); // 극단 오기재만 컷
    if (clean.length < 2) continue;
    const sorted = [...clean].sort((a, b) => a.date.localeCompare(b.date));
    const recent = sorted[sorted.length - 1];
    if (recent.date < recentSinceStr) continue;
    const prior = sorted.slice(0, -1);
    let base: Deal;
    if (isRise) { base = prior.reduce((m, d) => (d.price > m.price ? d : m), prior[0]); if (recent.price <= base.price) continue; }
    else { base = sorted.reduce((m, d) => (d.price > m.price ? d : m), sorted[0]); if (recent.price >= base.price) continue; }
    const diff_manwon = recent.price - base.price;
    const diff_pct = Math.round((diff_manwon / base.price) * 1000) / 10;
    if (Math.abs(diff_pct) > GAP_MAX_ABS_PCT) continue;
    entries.push({
      complex_key, complex_name: g.complex_name, lawd_cd: g.lawd_cd, region_name: g.lawd_cd,
      pyeong: Math.round(recent.area / PY), exclusive_area: Math.round(recent.area * 10) / 10,
      recent_date: recent.date, recent_price_manwon: recent.price, recent_floor: recent.floor,
      base_date: base.date, base_price_manwon: base.price, base_floor: base.floor,
      diff_manwon, diff_pct, hhld_cnt: null as number | null,
    });
  }
  entries.sort((a, b) => (isRise ? b.diff_pct - a.diff_pct : a.diff_pct - b.diff_pct));
  return dedupeByComplex(entries);
}

function dedupeByComplex<T extends { complex_key: string }>(entries: T[]): T[] {
  const seen = new Set<string>(); const out: T[] = [];
  for (const e of entries) { if (seen.has(e.complex_key)) continue; seen.add(e.complex_key); out.push(e); if (out.length >= TOP_N) break; }
  return out;
}

async function enrich(rows: Array<{ complex_key: string; lawd_cd: string | null; region_name?: string | null; hhld_cnt?: number | null }>) {
  if (!rows.length) return;
  const keys = [...new Set(rows.map((r) => r.complex_key))];
  const codes = [...new Set(rows.map((r) => r.lawd_cd).filter((c): c is string => !!c))];
  const [{ data: cx }, { data: rc }] = await Promise.all([
    supabaseAdmin.from('complexes').select('complex_key, hhld_cnt').in('complex_key', keys.slice(0, 1000)),
    codes.length ? supabaseAdmin.from('region_codes').select('lawd_cd, sido, sigungu').in('lawd_cd', codes) : Promise.resolve({ data: [] as any[] }),
  ]);
  const hmap = new Map((cx || []).map((c) => [c.complex_key, c.hhld_cnt]));
  const nmap = new Map((rc || []).map((r) => [r.lawd_cd, r.sigungu || r.sido || r.lawd_cd]));
  for (const r of rows) { r.hhld_cnt = hmap.get(r.complex_key) ?? null; r.region_name = (r.lawd_cd && nmap.get(r.lawd_cd)) || r.lawd_cd || ''; }
}

// (sido,type) 1회 fetch로 highest/drop/rise 모두 계산 (cron 효율)
export async function buildSlowRankings(property_type: string, sido: string) {
  const rows = await fetchTrades(property_type, sido);
  const groups = groupByComplexArea(rows);
  const highest = rankHighest(groups);
  const drop = rankGap(groups, false);
  const rise = rankGap(groups, true);
  await enrich([...highest, ...drop, ...rise]);
  return { highest, drop, rise };
}

// API 폴백 — 테이블에 없을 때 1개만 계산
export async function computeSlowOne(metric: SlowMetric, property_type: string, sido: string) {
  const b = await buildSlowRankings(property_type, sido);
  return b[metric] ?? [];
}
