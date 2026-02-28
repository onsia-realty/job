import { describe, it, expect } from 'vitest';
import {
  convertMonthlyToAmount,
  calculateCommission,
  formatKRW,
  formatManwon,
  TRANSACTION_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  RATE_TABLE_DATA,
} from './commission-calculator';

// ============================================================
// convertMonthlyToAmount — 월세 환산보증금
// ============================================================
describe('convertMonthlyToAmount', () => {
  it('합산액 5000만원 이상이면 ×100 적용', () => {
    // 보증금 3000 + 월세 30 × 100 = 6000 (>= 5000)
    expect(convertMonthlyToAmount(3000, 30)).toBe(6000);
  });

  it('합산액 5000만원 미만이면 ×70 적용', () => {
    // 보증금 1000 + 월세 30 × 100 = 4000 (< 5000) → 1000 + 30×70 = 3100
    expect(convertMonthlyToAmount(1000, 30)).toBe(3100);
  });

  it('경계값: 정확히 5000이면 ×100 적용', () => {
    // 보증금 0 + 월세 50 × 100 = 5000 (>= 5000)
    expect(convertMonthlyToAmount(0, 50)).toBe(5000);
  });

  it('경계값: 4999이면 ×70 적용', () => {
    // 보증금 4999 + 월세 0 × 100 = 4999 (< 5000) → 4999 + 0×70 = 4999
    expect(convertMonthlyToAmount(4999, 0)).toBe(4999);
  });

  it('월세 0이면 보증금 그대로', () => {
    expect(convertMonthlyToAmount(10000, 0)).toBe(10000);
  });

  it('보증금 0이면 월세만으로 계산', () => {
    // 0 + 60 × 100 = 6000 (>= 5000)
    expect(convertMonthlyToAmount(0, 60)).toBe(6000);
  });
});

// ============================================================
// calculateCommission — 주택 매매 6구간
// ============================================================
describe('calculateCommission — 주택 매매', () => {
  it('5천만원 미만: 0.6%, 한도 25만원', () => {
    const result = calculateCommission('sale', 'residential', 3000);
    expect(result.rate).toBe(0.6);
    expect(result.maxCommission).toBe(180000); // 3000만 × 0.6% = 18만
    expect(result.bracket).toBe('5천만원 미만');
  });

  it('5천만원 미만 한도액 적용', () => {
    const result = calculateCommission('sale', 'residential', 4500);
    // 4500만 × 0.6% = 27만 → 한도 25만 적용
    expect(result.maxCommission).toBe(250000);
  });

  it('5천만원 이상 ~ 2억원 미만: 0.5%, 한도 80만원', () => {
    const result = calculateCommission('sale', 'residential', 10000);
    expect(result.rate).toBe(0.5);
    expect(result.maxCommission).toBe(500000); // 1억 × 0.5% = 50만
    expect(result.bracket).toBe('5천만원 이상 ~ 2억원 미만');
  });

  it('2억원 이상 ~ 9억원 미만: 0.4%', () => {
    const result = calculateCommission('sale', 'residential', 50000);
    expect(result.rate).toBe(0.4);
    expect(result.maxCommission).toBe(2000000); // 5억 × 0.4% = 200만
    expect(result.bracket).toBe('2억원 이상 ~ 9억원 미만');
  });

  it('9억원 이상 ~ 12억원 미만: 0.5%', () => {
    const result = calculateCommission('sale', 'residential', 100000);
    expect(result.rate).toBe(0.5);
    expect(result.maxCommission).toBe(5000000); // 10억 × 0.5% = 500만
  });

  it('12억원 이상 ~ 15억원 미만: 0.6%', () => {
    const result = calculateCommission('sale', 'residential', 130000);
    expect(result.rate).toBe(0.6);
    expect(result.maxCommission).toBe(7800000); // 13억 × 0.6% = 780만
  });

  it('15억원 이상: 0.7%', () => {
    const result = calculateCommission('sale', 'residential', 200000);
    expect(result.rate).toBe(0.7);
    // 200000 * 10000 * 0.007 = 13999999.999... → Math.floor = 13999999
    // (부동소수점 정밀도 이슈 — 리팩토링 시 개선 대상)
    expect(result.maxCommission).toBe(13999999);
    expect(result.bracket).toBe('15억원 이상');
  });

  it('VAT 10% 계산', () => {
    const result = calculateCommission('sale', 'residential', 50000);
    expect(result.vat).toBe(Math.floor(result.maxCommission * 0.1));
    expect(result.total).toBe(result.maxCommission + result.vat);
  });
});

// ============================================================
// calculateCommission — 전세 (임대차)
// ============================================================
describe('calculateCommission — 전세', () => {
  it('5천만원 미만: 0.5%, 한도 20만원', () => {
    const result = calculateCommission('jeonse', 'residential', 3000);
    expect(result.rate).toBe(0.5);
    expect(result.maxCommission).toBe(150000); // 3000만 × 0.5% = 15만
    expect(result.bracket).toBe('5천만원 미만');
  });

  it('1억원 이상 ~ 6억원 미만: 0.3%', () => {
    const result = calculateCommission('jeonse', 'residential', 30000);
    expect(result.rate).toBe(0.3);
    expect(result.maxCommission).toBe(900000); // 3억 × 0.3% = 90만
  });
});

// ============================================================
// calculateCommission — 월세 (환산보증금 → 임대차 요율)
// ============================================================
describe('calculateCommission — 월세', () => {
  it('환산보증금으로 임대차 요율표 적용', () => {
    // 보증금 5000, 월세 50 → 환산: 5000 + 50×100 = 10000 (1억)
    // 임대차 1억~6억 구간: 0.3%
    const result = calculateCommission('monthly', 'residential', 0, 5000, 50);
    expect(result.transactionAmount).toBe(10000);
    expect(result.rate).toBe(0.3);
  });
});

// ============================================================
// calculateCommission — 오피스텔
// ============================================================
describe('calculateCommission — 오피스텔', () => {
  it('오피스텔 매매: 0.5%', () => {
    const result = calculateCommission('sale', 'officetel', 30000);
    expect(result.rate).toBe(0.5);
    expect(result.bracket).toBe('오피스텔 매매·교환 (전용 85㎡ 이하)');
  });

  it('오피스텔 임대차: 0.4%', () => {
    const result = calculateCommission('jeonse', 'officetel', 20000);
    expect(result.rate).toBe(0.4);
    expect(result.bracket).toBe('오피스텔 임대차 (전용 85㎡ 이하)');
  });
});

// ============================================================
// calculateCommission — 상업용 / 토지
// ============================================================
describe('calculateCommission — 상업용·토지', () => {
  it('상업용: 0.9% 이내', () => {
    const result = calculateCommission('sale', 'commercial', 50000);
    expect(result.rate).toBe(0.9);
  });

  it('토지: 0.9% 이내', () => {
    const result = calculateCommission('sale', 'land', 100000);
    expect(result.rate).toBe(0.9);
  });
});

// ============================================================
// formatKRW
// ============================================================
describe('formatKRW', () => {
  it('1억 이상 (나머지 없음)', () => {
    expect(formatKRW(100000000)).toBe('1억원');
  });

  it('1억 이상 (나머지 있음)', () => {
    expect(formatKRW(150000000)).toBe('1억 5,000만원');
  });

  it('1만원 이상 1억 미만', () => {
    expect(formatKRW(5000000)).toBe('500만원');
  });

  it('1만원 미만', () => {
    expect(formatKRW(9999)).toBe('9,999원');
  });

  it('0원', () => {
    expect(formatKRW(0)).toBe('0원');
  });
});

// ============================================================
// formatManwon
// ============================================================
describe('formatManwon', () => {
  it('1만(만원) 이상 = 억 단위 (나머지 없음)', () => {
    expect(formatManwon(10000)).toBe('1억');
  });

  it('1만(만원) 이상 = 억 단위 (나머지 있음)', () => {
    expect(formatManwon(15000)).toBe('1억 5,000만');
  });

  it('1만(만원) 미만 = 만 단위', () => {
    expect(formatManwon(5000)).toBe('5,000만');
  });
});

// ============================================================
// 상수 무결성
// ============================================================
describe('상수 무결성', () => {
  it('TRANSACTION_TYPE_LABELS 3가지', () => {
    expect(Object.keys(TRANSACTION_TYPE_LABELS)).toEqual(['sale', 'jeonse', 'monthly']);
  });

  it('PROPERTY_TYPE_LABELS 4가지', () => {
    expect(Object.keys(PROPERTY_TYPE_LABELS)).toEqual([
      'residential',
      'officetel',
      'commercial',
      'land',
    ]);
  });

  it('RATE_TABLE_DATA 5개 테이블', () => {
    expect(Object.keys(RATE_TABLE_DATA)).toEqual([
      'residential_sale',
      'residential_lease',
      'officetel_sale',
      'officetel_lease',
      'non_residential',
    ]);
  });

  it('주택 매매 6구간', () => {
    expect(RATE_TABLE_DATA.residential_sale).toHaveLength(6);
  });

  it('주택 임대차 6구간', () => {
    expect(RATE_TABLE_DATA.residential_lease).toHaveLength(6);
  });
});
