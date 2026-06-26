import { describe, it, expect } from 'vitest';
import {
  generateOrderId,
  TOSS_CONFIG,
  getVat,
  getTotalPrice,
  getExposureDays,
  getDiscountRate,
  findOption,
  resolveProduct,
  PRICING_TIERS,
} from './toss';

// ============================================================
// TOSS_CONFIG
// ============================================================
describe('TOSS_CONFIG', () => {
  it('clientKey가 존재한다 (setup.ts에서 stubEnv)', () => {
    expect(TOSS_CONFIG.clientKey).toBe('test-toss-client-key');
  });
});

// ============================================================
// generateOrderId
// ============================================================
describe('generateOrderId', () => {
  it('order- 접두사로 시작', () => {
    expect(generateOrderId()).toMatch(/^order-/);
  });
  it('포맷: order-{timestamp}-{random}', () => {
    const parts = generateOrderId().split('-');
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe('order');
    expect(Number(parts[1])).toBeGreaterThan(0);
    expect(parts[2]).toMatch(/^[a-z0-9]{1,6}$/);
  });
  it('100회 생성 시 모두 고유', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateOrderId()));
    expect(ids.size).toBe(100);
  });
});

// ============================================================
// 부가세 헬퍼
// ============================================================
describe('getVat / getTotalPrice', () => {
  it('부가세 10% 반올림', () => {
    expect(getVat(49000)).toBe(4900);
    expect(getVat(99000)).toBe(9900);
    expect(getVat(150000)).toBe(15000);
  });
  it('총액 = 공급가 + 부가세', () => {
    expect(getTotalPrice(49000)).toBe(53900);
    expect(getTotalPrice(150000)).toBe(165000);
  });
});

// ============================================================
// getExposureDays / getDiscountRate
// ============================================================
describe('getExposureDays', () => {
  it('노출일 = days + bonusDays', () => {
    expect(getExposureDays({ days: 7, bonusDays: 7, price: 49000 })).toBe(14);
    expect(getExposureDays({ days: 20, bonusDays: 10, price: 198000 })).toBe(30);
    expect(getExposureDays({ days: 20, bonusDays: 0, price: 498000 })).toBe(20);
  });
});

describe('getDiscountRate', () => {
  it('listPrice 대비 할인율(%)', () => {
    expect(getDiscountRate({ days: 7, bonusDays: 7, price: 49000, listPrice: 70000 })).toBe(30);
  });
  it('listPrice 없으면 null', () => {
    expect(getDiscountRate({ days: 10, bonusDays: 0, price: 99000 })).toBeNull();
  });
  it('listPrice <= price면 null', () => {
    expect(getDiscountRate({ days: 10, bonusDays: 0, price: 99000, listPrice: 99000 })).toBeNull();
  });
});

// ============================================================
// PRICING_TIERS 구조
// ============================================================
describe('PRICING_TIERS', () => {
  it('총 7개 등급 (sales 4 + agent 3)', () => {
    expect(Object.keys(PRICING_TIERS)).toHaveLength(7);
  });
  it('분양상담사 4개', () => {
    const salesKeys = Object.keys(PRICING_TIERS).filter((k) => k.startsWith('sales-'));
    expect(salesKeys).toEqual(['sales-premium', 'sales-superior', 'sales-dia', 'sales-unique']);
  });
  it('공인중개사 3개 (현행 유지)', () => {
    const agentKeys = Object.keys(PRICING_TIERS).filter((k) => k.startsWith('agent-'));
    expect(agentKeys).toEqual(['agent-basic', 'agent-premium', 'agent-vip']);
  });
  it('키 형식: {category}-{id}', () => {
    for (const [key, tier] of Object.entries(PRICING_TIERS)) {
      expect(key).toBe(`${tier.category}-${tier.id}`);
    }
  });
  it('유니크/VIP만 독점', () => {
    expect(PRICING_TIERS['sales-unique'].exclusive).toBe(true);
    expect(PRICING_TIERS['agent-vip'].exclusive).toBe(true);
    expect(PRICING_TIERS['sales-superior'].exclusive).toBe(false);
  });
  it('베이직은 7/20/30 (7+7 기본), 나머지는 10/20/30', () => {
    expect(PRICING_TIERS['sales-premium'].options.map((o) => o.days)).toEqual([7, 20, 30]);
    for (const k of ['sales-superior', 'sales-dia', 'sales-unique']) {
      expect(PRICING_TIERS[k].options.map((o) => o.days)).toEqual([10, 20, 30]);
    }
  });
  it('베이직 기본(7일)은 7+7=14일 노출', () => {
    expect(getExposureDays(findOption('sales-premium', 7)!)).toBe(14);
  });
});

// ============================================================
// 가격 매트릭스 (스펙 확정값)
// ============================================================
describe('가격 매트릭스 (분양상담사)', () => {
  it('베이직 7(+7)/20(+10)/30', () => {
    expect(findOption('sales-premium', 7)!.price).toBe(49000);
    expect(findOption('sales-premium', 20)!.price).toBe(98000);
    expect(findOption('sales-premium', 30)!.price).toBe(147000);
    expect(getExposureDays(findOption('sales-premium', 20)!)).toBe(30);
  });
  it('슈페리어 10/20/30', () => {
    expect(findOption('sales-superior', 10)!.price).toBe(99000);
    expect(findOption('sales-superior', 20)!.price).toBe(198000);
    expect(findOption('sales-superior', 30)!.price).toBe(297000);
  });
  it('다이아 10/20/30', () => {
    expect(findOption('sales-dia', 10)!.price).toBe(150000);
    expect(findOption('sales-dia', 20)!.price).toBe(300000);
    expect(findOption('sales-dia', 30)!.price).toBe(450000);
  });
  it('유니크 10/20/30 (보너스 없음)', () => {
    expect(findOption('sales-unique', 20)!.price).toBe(498000);
    expect(getExposureDays(findOption('sales-unique', 20)!)).toBe(20);
  });
  it('20일 구매 시 +10일 → 30일 노출 (슈페리어/다이아)', () => {
    expect(getExposureDays(findOption('sales-superior', 20)!)).toBe(30);
    expect(getExposureDays(findOption('sales-dia', 20)!)).toBe(30);
  });
});

// ============================================================
// findOption
// ============================================================
describe('findOption', () => {
  it('days 지정 시 해당 옵션', () => {
    expect(findOption('sales-superior', 30)!.days).toBe(30);
  });
  it('days 미지정 + 다중옵션 → 20일(주력) 기본', () => {
    expect(findOption('sales-dia')!.days).toBe(20);
  });
  it('days 미지정 + 단일옵션 → 그 옵션 (agent)', () => {
    expect(findOption('agent-basic')!.days).toBe(5);
  });
  it('잘못된 키 → undefined', () => {
    expect(findOption('sales-nope', 10)).toBeUndefined();
  });
  it('없는 일수 → undefined', () => {
    expect(findOption('sales-superior', 15)).toBeUndefined();
  });
});

// ============================================================
// resolveProduct (서버/결제용)
// ============================================================
describe('resolveProduct', () => {
  it('분양상담사 기간 지정', () => {
    const p = resolveProduct('sales-superior', 20)!;
    expect(p.price).toBe(198000);
    expect(p.exposureDays).toBe(30);
    expect(p.name).toBe('슈페리어');
    expect(p.tier).toBe('superior');
    expect(p.category).toBe('sales');
  });
  it('베이직 기본(7일) 지정 → 14일 노출', () => {
    const p = resolveProduct('sales-premium', 7)!;
    expect(p.price).toBe(49000);
    expect(p.exposureDays).toBe(14);
    expect(p.name).toBe('베이직');
  });
  it('공인중개사는 현행가 유지 (days 무시)', () => {
    expect(resolveProduct('agent-basic')!.price).toBe(4900);
    expect(resolveProduct('agent-basic')!.exposureDays).toBe(5);
    expect(resolveProduct('agent-premium')!.price).toBe(9900);
    expect(resolveProduct('agent-vip')!.price).toBe(24900);
    expect(resolveProduct('agent-vip')!.exposureDays).toBe(7);
  });
  it('잘못된 키/일수 → null', () => {
    expect(resolveProduct('sales-nope', 10)).toBeNull();
    expect(resolveProduct('sales-superior', 99)).toBeNull();
  });
});
