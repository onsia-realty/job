import { describe, expect, it } from 'vitest';
import { formatMinStay, formatStayPrice } from './format';

describe('formatStayPrice', () => {
  const host = { owner_type: 'owner' as const, deal_type: 'short_term' as const, weekly_fee_won: 355_500, monthly_fee_won: null, deposit_won: 205_500 };
  it('호스트 주 요금과 보증금을 원 단위로 정확하게 구분한다', () => {
    expect(formatStayPrice(host)).toBe('주 355,500원 / 보증금 205,500원');
    expect(formatStayPrice({ ...host, deposit_won: null })).toBe('주 355,500원');
  });
  it('중개사 매물은 주 요금이 있어도 기존 월 조건을 유지한다', () => {
    expect(formatStayPrice({ ...host, owner_type: 'agent', monthly_fee_won: 1_200_000, deposit_won: 3_000_000 })).toBe('보증금 300만 / 월 120만');
  });
  it('주 요금이 없거나 유효하지 않으면 기존 조건으로 표시한다', () => {
    for (const weekly_fee_won of [null, 0, -1, NaN]) {
      expect(formatStayPrice({ ...host, weekly_fee_won, deposit_won: null })).toBe('가격 문의');
    }
  });
});

describe('formatMinStay', () => {
  it.each([7, 14, 30, 45, 365])('계약 일수 %i를 반올림하지 않는다', (days) => {
    expect(formatMinStay(days)).toBe(`${days}일 이상`);
  });
  it('미입력은 기간 협의로 표시한다', () => {
    expect(formatMinStay(null)).toBe('기간 협의');
    expect(formatMinStay(undefined)).toBe('기간 협의');
  });
});
