import { describe, it, expect } from 'vitest';
import { formatKoreanPrice, formatEokUnit } from './format';

describe('formatKoreanPrice — full 스타일', () => {
  it('억 + 천만 단위를 함께 표기한다', () => {
    expect(formatKoreanPrice(525000)).toBe('52억 5,000');
    expect(formatKoreanPrice(466600)).toBe('46억 6,600');
    expect(formatKoreanPrice(10001)).toBe('1억 1');
  });

  it('정확히 N억이면 나머지를 생략한다', () => {
    expect(formatKoreanPrice(90000)).toBe('9억');
    expect(formatKoreanPrice(10000)).toBe('1억');
    expect(formatKoreanPrice(1000000)).toBe('100억');
  });

  it('1억 미만은 만원 단위로 표기한다', () => {
    expect(formatKoreanPrice(8500)).toBe('8,500만');
    expect(formatKoreanPrice(9999)).toBe('9,999만');
    expect(formatKoreanPrice(100)).toBe('100만');
  });

  it('0, null, 비정상 값을 안전하게 처리한다', () => {
    expect(formatKoreanPrice(0)).toBe('0');
    expect(formatKoreanPrice(null)).toBe('-');
    expect(formatKoreanPrice(undefined)).toBe('-');
    expect(formatKoreanPrice(NaN)).toBe('-');
  });
});

describe('formatKoreanPrice — compact 스타일 (마커용)', () => {
  it('소수점 1자리 억 단위로 표기한다', () => {
    expect(formatKoreanPrice(255000, 'compact')).toBe('25.5억');
    expect(formatKoreanPrice(466600, 'compact')).toBe('46.7억');
  });

  it('나머지가 없으면 정수 억으로 표기한다', () => {
    expect(formatKoreanPrice(90000, 'compact')).toBe('9억');
    expect(formatKoreanPrice(210000, 'compact')).toBe('21억');
  });

  it('반올림 결과 소수점이 .0이면 생략한다', () => {
    // 90,400만 = 9.04억 → "9억"
    expect(formatKoreanPrice(90400, 'compact')).toBe('9억');
  });

  it('100억 이상은 소수점을 절사한다', () => {
    expect(formatKoreanPrice(1565000, 'compact')).toBe('156억');
    expect(formatKoreanPrice(1000000, 'compact')).toBe('100억');
  });

  it('1억 미만은 만원 단위 그대로 표기한다', () => {
    expect(formatKoreanPrice(8500, 'compact')).toBe('8,500만');
  });
});

describe('formatEokUnit — 차트 축용', () => {
  it('억/천/만 단위로 짧게 표기한다', () => {
    expect(formatEokUnit(520000)).toBe('52억');
    expect(formatEokUnit(15000)).toBe('2억'); // 1.5억 반올림
    expect(formatEokUnit(5000)).toBe('5천');
    expect(formatEokUnit(500)).toBe('500만');
  });

  it('0과 비정상 값을 안전하게 처리한다', () => {
    expect(formatEokUnit(0)).toBe('0');
    expect(formatEokUnit(null)).toBe('-');
  });
});
