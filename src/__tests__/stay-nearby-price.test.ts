import { describe, it, expect } from 'vitest';
import {
  average,
  diffPct,
  areaBand,
  STAY_TYPE_TO_TX_TYPE,
  NEARBY_PRICE_AREA_BAND,
} from '@/lib/stay/nearby-price';

describe('average', () => {
  it('홀수개 평균', () => {
    expect(average([10, 20, 30])).toBe(20);
  });

  it('짝수개 평균', () => {
    expect(average([10, 20, 30, 40])).toBe(25);
  });

  it('단일 원소는 그 값 자체', () => {
    expect(average([42])).toBe(42);
  });

  it('정렬 안 된 입력도 같은 결과', () => {
    expect(average([30, 10, 40, 20])).toBe(average([10, 20, 30, 40]));
  });

  it('입력 배열을 변형하지 않는다', () => {
    const input = [30, 10, 20];
    average(input);
    expect(input).toEqual([30, 10, 20]);
  });

  it('빈 배열은 0 이 아니라 NaN', () => {
    expect(average([])).toBeNaN();
  });
});

describe('diffPct', () => {
  it('이 매물이 더 싸면 음수', () => {
    expect(diffPct(80, 100)).toBe(-20);
  });

  it('이 매물이 더 비싸면 양수', () => {
    expect(diffPct(130, 100)).toBe(30);
  });

  it('같으면 0', () => {
    expect(diffPct(100, 100)).toBe(0);
  });

  it('기준값 0 이면 0 (0으로 나누기 방지)', () => {
    expect(diffPct(100, 0)).toBe(0);
  });

  it('소수 1자리로 반올림', () => {
    // (110 - 105) / 105 * 100 = 4.7619...
    expect(diffPct(110, 105)).toBe(4.8);
  });
});

describe('STAY_TYPE_TO_TX_TYPE', () => {
  it('오피스텔/아파트만 매핑된다', () => {
    expect(STAY_TYPE_TO_TX_TYPE.officetel).toBe('officetel');
    expect(STAY_TYPE_TO_TX_TYPE.apartment).toBe('apt');
  });

  it('cron 이 수집하지 않는 유형은 매핑 없음', () => {
    expect(STAY_TYPE_TO_TX_TYPE.villa).toBeUndefined();
    expect(STAY_TYPE_TO_TX_TYPE.store).toBeUndefined();
    expect(STAY_TYPE_TO_TX_TYPE.office).toBeUndefined();
    expect(STAY_TYPE_TO_TX_TYPE.living_facility).toBeUndefined();
  });
});

describe('areaBand', () => {
  it('기본 ±30% 밴드', () => {
    const band = areaBand(26.4);
    expect(band.min).toBeCloseTo(18.48, 5);
    expect(band.max).toBeCloseTo(34.32, 5);
  });

  it('기본값은 NEARBY_PRICE_AREA_BAND 와 같다', () => {
    expect(areaBand(84.97)).toEqual(areaBand(84.97, NEARBY_PRICE_AREA_BAND));
  });

  it('밴드 폭을 직접 줄 수 있다', () => {
    const band = areaBand(100, 0.1);
    expect(band.min).toBeCloseTo(90, 5);
    expect(band.max).toBeCloseTo(110, 5);
  });
});
