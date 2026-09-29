import { describe, it, expect } from 'vitest';
import {
  buildComplexInsight,
  INSIGHT_DISCLAIMER,
  type InsightTxRow,
} from '@/lib/market/insights';

// 기준 시각: 2026-09-29 12:00 KST
const NOW = new Date('2026-09-29T03:00:00Z');

function tx(
  deal_date: string,
  price_manwon: number,
  exclusive_area = 84.97,
  floor = 10,
  extra: Partial<InsightTxRow> = {}
): InsightTxRow {
  return { deal_date, price_manwon, exclusive_area, floor, deal_type: 'trade', cancel_yn: false, ...extra };
}

// 최근 3개월(2026-06-29 초과): 5건 / 직전 3개월(2026-03-29 초과 ~ 06-29): 4건 / 그 이전 12개월 안: 2건
const NORMAL_ROWS: InsightTxRow[] = [
  // 최근 3개월
  tx('2026-09-20', 150000, 84.97, 15),
  tx('2026-09-02', 148000, 84.5, 7),
  tx('2026-08-15', 110000, 59.99, 12),
  tx('2026-07-30', 152000, 84.12, 20),
  tx('2026-07-01', 105000, 59.4, 3),
  // 직전 3개월
  tx('2026-06-20', 140000, 84.97, 11),
  tx('2026-05-10', 100000, 59.99, 5),
  tx('2026-04-12', 142000, 84.97, 9),
  tx('2026-04-01', 98000, 59.99, 2),
  // 6~12개월 전
  tx('2026-01-15', 160000, 114.8, 18),
  tx('2025-11-03', 95000, 59.99, 1),
  // 12개월 밖
  tx('2025-08-01', 200000, 114.8, 25),
];

const BANNED = ['오를', '오르', '내릴', '전망', '추천', '매수', '매도', '유망', '예상', '기대', '호재', '투자하', '사세요', '팔'];

describe('buildComplexInsight — 정상 케이스', () => {
  const r = buildComplexInsight(NORMAL_ROWS, NOW);

  it('기간별 건수·평균·중위', () => {
    expect(r.as_of).toBe('2026-09-29');
    expect(r.sparse).toBe(false);
    expect(r.recent_3m.count).toBe(5);
    expect(r.prev_3m.count).toBe(4);
    expect(r.trade_count_6m).toBe(9);
    expect(r.trade_count_12m).toBe(11);
    // (150000+148000+110000+152000+105000)/5 = 133000
    expect(r.recent_3m.avg_price_manwon).toBe(133000);
    expect(r.recent_3m.median_price_manwon).toBe(148000);
    // (140000+100000+142000+98000)/4 = 120000
    expect(r.prev_3m.avg_price_manwon).toBe(120000);
    expect(r.trade_count_change).toBe(1);
  });

  it('단순 평균가 변동률은 호환용으로만 남고, 문장은 3.3㎡당 변동률을 쓴다', () => {
    // 단순 평균: 133000 vs 120000 → +10.8% (문장에는 안 씀)
    expect(r.avg_price_change_pct).toBe(10.8);
    expect(r.text).not.toContain('10.8%');
    // 3.3㎡당: 최근 ≈ 5,901만 vs 직전 ≈ 5,470만 → 약 +7.9%
    expect(r.avg_price_per_pyeong_change_pct).toBe(7.9);
    expect(r.prev_3m.avg_price_per_3_3m2_manwon).toBeGreaterThan(0);
    expect(r.text).toContain('전용 3.3㎡당 평균가는 직전 3개월(');
    expect(r.text).toContain('7.9% 높고');
  });

  it('최근 12개월 최고/최저가 (12개월 밖 거래 제외)', () => {
    expect(r.high_12m).toEqual({ date: '2026-01-15', price_manwon: 160000, exclusive_area: 114.8, floor: 18 });
    expect(r.low_12m).toEqual({ date: '2025-11-03', price_manwon: 95000, exclusive_area: 59.99, floor: 1 });
  });

  it('전용면적은 정수부로 묶는다', () => {
    const labels = r.area_buckets_12m.map((b) => b.label);
    expect(labels).toEqual(['59㎡대', '84㎡대', '114㎡대']);
    const b59 = r.area_buckets_12m.find((b) => b.area_type === 59)!;
    // 59.99, 59.4 모두 59㎡대: 110000, 105000, 100000, 98000, 95000
    expect(b59.count).toBe(5);
    expect(b59.avg_price_manwon).toBe(101600);
    const b84 = r.area_buckets_12m.find((b) => b.area_type === 84)!;
    expect(b84.count).toBe(5); // 84.97, 84.5, 84.12 모두 84㎡대
  });

  it('3.3㎡당 가격과 가장 최근 거래', () => {
    expect(r.recent_3m.avg_price_per_3_3m2_manwon).toBeGreaterThan(5000);
    expect(r.latest_trade?.date).toBe('2026-09-20');
  });

  it('문장 3~5개 + 고지 문구', () => {
    expect(r.sentences.length).toBeGreaterThanOrEqual(3);
    expect(r.sentences.length).toBeLessThanOrEqual(5);
    expect(r.disclaimer).toBe(INSIGHT_DISCLAIMER);
    expect(r.text.split('\n').at(-1)).toBe(INSIGHT_DISCLAIMER);
    expect(r.text).toContain('13억 3,000만원');
    expect(r.text).toContain('가장 최근 매매는 전용 84.97㎡, 15층, 2026.09.20에 15억원으로 신고됐어요.');
    expect(r.text).not.toMatch(/NaN|undefined|null/);
  });
});

describe('buildComplexInsight — 변동률 부호', () => {
  it('최근 평균이 낮으면 음수', () => {
    const rows = [
      tx('2026-09-01', 90000),
      tx('2026-08-01', 90000),
      tx('2026-05-01', 100000),
      tx('2026-04-15', 100000),
    ];
    const r = buildComplexInsight(rows, NOW);
    expect(r.avg_price_change_pct).toBe(-10);
    expect(r.avg_price_per_pyeong_change_pct).toBe(-10);
    expect(r.text).toContain('10.0% 낮고');
  });

  it('한쪽 구간이 2건 미만이면 변동률을 내지 않는다', () => {
    const rows = [tx('2026-09-01', 90000), tx('2026-08-01', 91000), tx('2026-05-01', 100000)];
    const r = buildComplexInsight(rows, NOW);
    expect(r.sparse).toBe(false);
    expect(r.avg_price_change_pct).toBeNull();
    expect(r.avg_price_per_pyeong_change_pct).toBeNull();
    expect(r.text).toContain('변동률은 계산하지 않았어요');
  });

  it('큰 평형 거래로 단순 평균만 오르고 3.3㎡당은 같으면, 문장은 3.3㎡당 기준(거의 같음)', () => {
    // ㎡당 2,000만원으로 모두 같은 단가. 최근 구간에만 110㎡ 거래 1건 추가
    const rows = [
      tx('2026-09-10', 168000, 84, 10),
      tx('2026-08-10', 168000, 84, 11),
      tx('2026-07-10', 220000, 110, 12),
      tx('2026-06-10', 168000, 84, 9),
      tx('2026-05-10', 168000, 84, 8),
    ];
    const r = buildComplexInsight(rows, NOW);
    // 단순 평균: 185,333 vs 168,000 → +10.3%
    expect(r.avg_price_change_pct).toBe(10.3);
    expect(r.avg_price_per_pyeong_change_pct).toBe(0);
    expect(r.text).toContain('전용 3.3㎡당 평균가는 직전 3개월(6,612만원)과 거의 같고');
    expect(r.text).not.toContain('10.3%');
  });
});

describe('buildComplexInsight — 거래가 적을 때', () => {
  it('최근 6개월 3건 미만이면 통계 없이 안내 문장', () => {
    const rows = [tx('2026-08-01', 120000), tx('2025-12-01', 118000), tx('2025-10-01', 117000)];
    const r = buildComplexInsight(rows, NOW);
    expect(r.sparse).toBe(true);
    expect(r.trade_count_6m).toBe(1);
    expect(r.recent_3m.avg_price_manwon).toBeNull();
    expect(r.avg_price_change_pct).toBeNull();
    expect(r.high_12m).toBeNull();
    expect(r.area_buckets_12m).toEqual([]);
    expect(r.sentences[0]).toContain('추세를 말하기 어려워요');
    expect(r.latest_trade?.date).toBe('2026-08-01');
    expect(r.text).toContain('12억원으로 신고됐어요');
    expect(r.text).not.toMatch(/NaN|undefined/);
    expect(r.text).toContain(INSIGHT_DISCLAIMER);
  });

  it('최근 6개월 거래 0건이어도 가장 최근 거래는 알려준다', () => {
    const r = buildComplexInsight([tx('2024-03-02', 80000, 59.9, 4)], NOW);
    expect(r.sparse).toBe(true);
    expect(r.sentences[0]).toContain('거래가 없어');
    expect(r.text).toContain('2024.03.02');
  });
});

describe('buildComplexInsight — 필터', () => {
  it('해제 거래·매매 외 거래·잘못된 값은 제외', () => {
    const rows = [
      ...NORMAL_ROWS,
      tx('2026-09-25', 999999, 84.97, 30, { cancel_yn: true }),
      tx('2026-09-24', 50000, 84.97, 30, { deal_type: 'rent' }),
      tx('2026-09-23', 0),
      tx('2026-10-15', 300000), // 미래 날짜
    ];
    const r = buildComplexInsight(rows, NOW);
    expect(r.recent_3m.count).toBe(5);
    expect(r.recent_3m.avg_price_manwon).toBe(133000);
    expect(r.high_12m?.price_manwon).toBe(160000);
    expect(r.latest_trade?.date).toBe('2026-09-20');
  });
});

describe('buildComplexInsight — 금지 표현', () => {
  const cases: InsightTxRow[][] = [
    NORMAL_ROWS,
    [tx('2026-09-01', 90000), tx('2026-08-01', 90000), tx('2026-05-01', 100000), tx('2026-04-15', 100000)],
    [tx('2026-08-01', 120000)],
    [tx('2026-05-01', 100000), tx('2026-04-15', 100000), tx('2026-04-10', 101000)],
  ];
  it.each(cases.map((c, i) => [i, c] as const))('케이스 %i: 예측·권유 단어 없음', (_i, rows) => {
    const r = buildComplexInsight(rows, NOW);
    const body = r.sentences.join(' ');
    for (const w of BANNED) expect(body).not.toContain(w);
  });
});
