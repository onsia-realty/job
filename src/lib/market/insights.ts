/**
 * 단지 실거래 요약 — 순수 계산 모듈 (I/O 없음, LLM 없음)
 *
 * 입력: price_transactions 행 (한 단지)
 * 출력: 기간별 통계 + 템플릿 문장 3~5개 + 고정 고지 문구
 *
 * 기간 기준 (KST 오늘 T):
 *  - 최근 3개월   : T-3개월 < deal_date <= T
 *  - 직전 3개월   : T-6개월 < deal_date <= T-3개월
 *  - 최근 12개월  : T-12개월 < deal_date <= T
 *
 * 전용면적 구분: 전용면적의 정수부(Math.floor)를 타입으로 본다.
 *  (분양·중개 현장에서 쓰는 "59타입/84타입" 관행과 같다. 84.97㎡, 84.12㎡ → "84㎡대")
 *  구분별 평균가·건수는 최근 12개월 거래로 계산한다.
 *
 * 데이터가 적을 때(최근 6개월 매매 3건 미만)는 평균·변동률·최고/최저·면적별 통계를 내지 않고
 * "거래가 적어 추세를 말하기 어려워요" 문장과 가장 최근 거래만 보여준다.
 *
 * 문장 규칙: 사실만 적는다. 예측·투자 권유 표현(오를, 전망, 추천, 매수 등)을 쓰지 않는다.
 */
import { formatPrice } from './publicApi';

export const INSIGHT_DISCLAIMER =
  '국토교통부 실거래가 공개 자료를 계산한 결과이며, 투자 판단의 근거로 쓰기엔 충분하지 않아요.';

/** 이 건수 미만이면(최근 6개월 매매) 추세 통계를 내지 않는다 */
export const SPARSE_THRESHOLD_6M = 3;

const PYEONG_SQM = 3.3058;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export interface InsightTxRow {
  deal_date: string; // 'YYYY-MM-DD' (DATE 컬럼)
  price_manwon: number | null;
  exclusive_area: number | null;
  floor?: number | null;
  deal_type?: string | null;
  cancel_yn?: boolean | null;
}

export interface TradeSummary {
  date: string; // YYYY-MM-DD
  price_manwon: number;
  exclusive_area: number | null;
  floor: number | null;
}

export interface AreaBucket {
  /** 전용면적 정수부 (예: 84) */
  area_type: number;
  /** 표시용 라벨 (예: "84㎡대") */
  label: string;
  count: number;
  avg_price_manwon: number;
}

export interface ComplexInsight {
  /** 기준일 (KST, YYYY-MM-DD) */
  as_of: string;
  /** 최근 6개월 매매가 SPARSE_THRESHOLD_6M 건 미만이면 true — 통계 필드는 null/빈 배열 */
  sparse: boolean;
  trade_count_6m: number;
  trade_count_12m: number;
  recent_3m: {
    count: number;
    avg_price_manwon: number | null;
    median_price_manwon: number | null;
    /** 3.3㎡당 가격(전용면적 기준) 평균, 만원 */
    avg_price_per_3_3m2_manwon: number | null;
  };
  prev_3m: {
    count: number;
    avg_price_manwon: number | null;
    /** 3.3㎡당 가격(전용면적 기준) 평균, 만원 */
    avg_price_per_3_3m2_manwon: number | null;
  };
  /**
   * 직전 3개월 대비 최근 3개월 단순 평균가 변동률(%). 두 구간 모두 2건 이상일 때만 계산.
   * 면적 구성이 바뀌면 크게 흔들려서 문장에는 쓰지 않는다 (호환용으로만 유지).
   */
  avg_price_change_pct: number | null;
  /**
   * 직전 3개월 대비 최근 3개월 전용 3.3㎡당 평균가 변동률(%).
   * 거래별 (가격 × 3.3058 / 전용면적) 을 평균한 값끼리 비교한다.
   * 두 구간 모두 면적이 있는 거래가 2건 이상일 때만 계산. 문장·UI 는 이 값을 쓴다.
   */
  avg_price_per_pyeong_change_pct: number | null;
  /** 최근 3개월 건수 - 직전 3개월 건수 */
  trade_count_change: number;
  high_12m: TradeSummary | null;
  low_12m: TradeSummary | null;
  area_buckets_12m: AreaBucket[];
  latest_trade: TradeSummary | null;
  sentences: string[];
  disclaimer: string;
  /** sentences + disclaimer 를 줄바꿈으로 이은 표시용 텍스트 */
  text: string;
}

// ── 날짜 유틸 (KST 기준, 'YYYY-MM-DD' 문자열 비교) ──

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function kstYmd(now: Date): { y: number; m: number; d: number } {
  const k = new Date(now.getTime() + KST_OFFSET_MS);
  return { y: k.getUTCFullYear(), m: k.getUTCMonth() + 1, d: k.getUTCDate() };
}

function toYmdString(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** (y, m, d) 에서 n개월 전 날짜. 말일 넘침은 그 달 말일로 맞춘다 (8/31 - 6개월 → 2/28) */
function monthsBefore(y: number, m: number, d: number, n: number): string {
  const idx = y * 12 + (m - 1) - n;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12) + 1;
  const lastDay = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return toYmdString(ny, nm, Math.min(d, lastDay));
}

function formatDateDots(ymd: string): string {
  return ymd.replace(/-/g, '.');
}

// ── 수치 유틸 ──

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** 변동률(%) 소수 첫째 자리. 계산할 수 없으면 null */
function pctChange(curr: number | null, prev: number | null): number | null {
  if (curr == null || prev == null || prev <= 0) return null;
  const pct = Math.round(((curr - prev) / prev) * 1000) / 10;
  return pct === 0 ? 0 : pct; // -0 방지
}

/** 면적이 있는 거래의 전용 3.3㎡당 가격(만원) 목록 */
function perPyeongPrices(list: NormalizedRow[]): number[] {
  return list.filter((t) => t.area != null).map((t) => (t.price * PYEONG_SQM) / (t.area as number));
}

function roundOrNull(v: number | null): number | null {
  return v == null ? null : Math.round(v);
}

/** 만원 → "12억 3,456만원" / "9억원" / "8,500만원" */
export function formatManwon(manwon: number): string {
  return `${formatPrice(Math.round(manwon))}원`;
}

function formatAreaShort(area: number | null): string {
  if (area == null || !Number.isFinite(area)) return '면적 미상';
  // 84.97 → "84.97", 84.9 → "84.9", 84 → "84"
  return `전용 ${Number(area.toFixed(2))}㎡`;
}

function describeTrade(t: TradeSummary): string {
  const parts = [formatAreaShort(t.exclusive_area)];
  if (t.floor != null) parts.push(`${t.floor}층`);
  parts.push(formatDateDots(t.date));
  return parts.join(', ');
}

function toSummary(r: NormalizedRow): TradeSummary {
  return { date: r.date, price_manwon: r.price, exclusive_area: r.area, floor: r.floor };
}

interface NormalizedRow {
  date: string;
  price: number;
  area: number | null;
  floor: number | null;
}

/**
 * 거래 행 → 단지 실거래 요약.
 * 매매(deal_type 'trade')이면서 해제되지 않은(cancel_yn !== true) 거래만 쓴다.
 */
export function buildComplexInsight(rows: InsightTxRow[], now: Date = new Date()): ComplexInsight {
  const { y, m, d } = kstYmd(now);
  const today = toYmdString(y, m, d);
  const cut3 = monthsBefore(y, m, d, 3);
  const cut6 = monthsBefore(y, m, d, 6);
  const cut12 = monthsBefore(y, m, d, 12);

  const trades: NormalizedRow[] = [];
  for (const r of rows) {
    if (r.deal_type !== 'trade') continue;
    if (r.cancel_yn === true) continue;
    const price = typeof r.price_manwon === 'number' ? r.price_manwon : Number(r.price_manwon);
    if (!Number.isFinite(price) || price <= 0) continue;
    const date = typeof r.deal_date === 'string' ? r.deal_date.slice(0, 10) : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today) continue;
    const area =
      r.exclusive_area != null && Number.isFinite(Number(r.exclusive_area)) && Number(r.exclusive_area) > 0
        ? Number(r.exclusive_area)
        : null;
    const floor = r.floor != null && Number.isFinite(Number(r.floor)) ? Number(r.floor) : null;
    trades.push({ date, price, area, floor });
  }

  // 최신순 정렬 (같은 날이면 입력 순서 유지)
  trades.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const recent = trades.filter((t) => t.date > cut3);
  const prev = trades.filter((t) => t.date > cut6 && t.date <= cut3);
  const year = trades.filter((t) => t.date > cut12);
  const count6m = recent.length + prev.length;
  const sparse = count6m < SPARSE_THRESHOLD_6M;
  const latest = trades[0] ? toSummary(trades[0]) : null;

  const sentences: string[] = [];

  if (sparse) {
    sentences.push(
      count6m === 0
        ? '최근 6개월 동안 신고된 매매 거래가 없어 추세를 말하기 어려워요.'
        : `최근 6개월 동안 신고된 매매 거래가 ${count6m}건뿐이라 추세를 말하기 어려워요.`
    );
    if (latest) {
      sentences.push(`가장 최근 매매는 ${describeTrade(latest)}에 ${formatManwon(latest.price_manwon)}으로 신고됐어요.`);
    }
    return finalize({
      as_of: today,
      sparse: true,
      trade_count_6m: count6m,
      trade_count_12m: year.length,
      recent_3m: {
        count: recent.length,
        avg_price_manwon: null,
        median_price_manwon: null,
        avg_price_per_3_3m2_manwon: null,
      },
      prev_3m: { count: prev.length, avg_price_manwon: null, avg_price_per_3_3m2_manwon: null },
      avg_price_change_pct: null,
      avg_price_per_pyeong_change_pct: null,
      trade_count_change: recent.length - prev.length,
      high_12m: null,
      low_12m: null,
      area_buckets_12m: [],
      latest_trade: latest,
      sentences,
    });
  }

  // ── 최근 3개월 ──
  const recentPrices = recent.map((t) => t.price);
  const recentAvg = mean(recentPrices);
  const recentMedian = median(recentPrices);
  const recentPerPyeongList = perPyeongPrices(recent);
  const recentPerPyeong = mean(recentPerPyeongList);

  // ── 직전 3개월 ──
  const prevAvg = mean(prev.map((t) => t.price));
  const prevPerPyeongList = perPyeongPrices(prev);
  const prevPerPyeong = mean(prevPerPyeongList);
  const changePct =
    recent.length >= 2 && prev.length >= 2 ? pctChange(recentAvg, prevAvg) : null;
  // 면적 구성 변화에 덜 흔들리는 3.3㎡당 가격 기준 변동률 — 문장·UI 는 이 값을 쓴다
  const perPyeongChangePct =
    recentPerPyeongList.length >= 2 && prevPerPyeongList.length >= 2
      ? pctChange(recentPerPyeong, prevPerPyeong)
      : null;
  const countChange = recent.length - prev.length;

  // ── 최근 12개월 최고/최저 (같은 금액이면 최근 거래) ──
  let high: NormalizedRow | null = null;
  let low: NormalizedRow | null = null;
  for (const t of year) {
    if (!high || t.price > high.price) high = t;
    if (!low || t.price < low.price) low = t;
  }

  // ── 전용면적 구분 (최근 12개월) ──
  const bucketMap = new Map<number, number[]>();
  for (const t of year) {
    if (t.area == null) continue;
    const type = Math.floor(t.area);
    const arr = bucketMap.get(type) ?? [];
    arr.push(t.price);
    bucketMap.set(type, arr);
  }
  const buckets: AreaBucket[] = [...bucketMap.entries()]
    .map(([type, prices]) => ({
      area_type: type,
      label: `${type}㎡대`,
      count: prices.length,
      avg_price_manwon: Math.round(mean(prices) as number),
    }))
    .sort((a, b) => a.area_type - b.area_type);

  // ── 문장 ──
  if (recent.length > 0 && recentAvg != null && recentMedian != null) {
    const perPyeongText = recentPerPyeong != null ? `, 전용 3.3㎡당 평균 ${formatManwon(recentPerPyeong)}` : '';
    sentences.push(
      `최근 3개월 동안 매매 ${recent.length}건이 신고됐고, 평균 ${formatManwon(recentAvg)}, 중위 ${formatManwon(recentMedian)}${perPyeongText}이에요.`
    );
  } else {
    sentences.push(`최근 3개월 동안 신고된 매매 거래는 없고, 그 전 3개월에는 ${prev.length}건이 있었어요.`);
  }

  if (recent.length > 0) {
    const volume =
      countChange > 0
        ? `거래 건수는 직전 3개월(${prev.length}건)보다 ${countChange}건 많아요`
        : countChange < 0
          ? `거래 건수는 직전 3개월(${prev.length}건)보다 ${-countChange}건 적어요`
          : `거래 건수는 직전 3개월(${prev.length}건)과 같아요`;
    if (perPyeongChangePct != null && prevPerPyeong != null) {
      const abs = Math.abs(perPyeongChangePct).toFixed(1);
      const prevText = `전용 3.3㎡당 평균가는 직전 3개월(${formatManwon(prevPerPyeong)})`;
      const priceText =
        Math.abs(perPyeongChangePct) < 0.1
          ? `${prevText}과 거의 같고`
          : `${prevText}보다 ${abs}% ${perPyeongChangePct > 0 ? '높고' : '낮고'}`;
      sentences.push(`${priceText}, ${volume}.`);
    } else {
      sentences.push(`${volume}. 비교할 거래가 적어 3.3㎡당 가격 변동률은 계산하지 않았어요.`);
    }
  }

  if (high && low) {
    if (high === low) {
      sentences.push(`최근 12개월 매매는 ${formatManwon(high.price)}(${describeTrade(toSummary(high))} 거래) 한 건이에요.`);
    } else {
      // 괄호 끝을 "거래)"로 고정해 조사(이에요/예요)가 날짜 숫자에 따라 틀리지 않게 한다
      sentences.push(
        `최근 12개월 최고가는 ${formatManwon(high.price)}(${describeTrade(toSummary(high))} 거래), 최저가는 ${formatManwon(low.price)}(${describeTrade(toSummary(low))} 거래)이에요.`
      );
    }
  }

  if (buckets.length > 0) {
    const top = [...buckets]
      .sort((a, b) => b.count - a.count || a.area_type - b.area_type)
      .slice(0, 3)
      .sort((a, b) => a.area_type - b.area_type);
    const list = top.map((b) => `${b.label} 평균 ${formatManwon(b.avg_price_manwon)}(${b.count}건)`).join(', ');
    sentences.push(`최근 12개월 면적별로는 ${list}이에요.`);
  }

  if (latest) {
    sentences.push(`가장 최근 매매는 ${describeTrade(latest)}에 ${formatManwon(latest.price_manwon)}으로 신고됐어요.`);
  }

  return finalize({
    as_of: today,
    sparse: false,
    trade_count_6m: count6m,
    trade_count_12m: year.length,
    recent_3m: {
      count: recent.length,
      avg_price_manwon: roundOrNull(recentAvg),
      median_price_manwon: roundOrNull(recentMedian),
      avg_price_per_3_3m2_manwon: roundOrNull(recentPerPyeong),
    },
    prev_3m: {
      count: prev.length,
      avg_price_manwon: roundOrNull(prevAvg),
      avg_price_per_3_3m2_manwon: roundOrNull(prevPerPyeong),
    },
    avg_price_change_pct: changePct,
    avg_price_per_pyeong_change_pct: perPyeongChangePct,
    trade_count_change: countChange,
    high_12m: high ? toSummary(high) : null,
    low_12m: low ? toSummary(low) : null,
    area_buckets_12m: buckets,
    latest_trade: latest,
    sentences: sentences.slice(0, 5),
  });
}

function finalize(
  base: Omit<ComplexInsight, 'disclaimer' | 'text'>
): ComplexInsight {
  return {
    ...base,
    disclaimer: INSIGHT_DISCLAIMER,
    text: [...base.sentences, INSIGHT_DISCLAIMER].join('\n'),
  };
}
