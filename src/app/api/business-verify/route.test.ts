import { describe, it, expect } from 'vitest';

// ============================================================
// business-verify 내부 함수들 (현재 export 안 됨)
// 리팩토링 후: import { detectBizType, validateBusinessNumberChecksum } from '@/lib/business-verify'
// ============================================================

/** 사업자등록번호 4-5번째 자리로 개인/법인 판별 */
function detectBizType(bNo: string): { biz_type: 'individual' | 'corporate'; biz_type_label: string } {
  const typeCode = parseInt(bNo.substring(3, 5), 10);
  if (typeCode >= 81 && typeCode <= 89) {
    return { biz_type: 'corporate', biz_type_label: '법인사업자' };
  }
  return { biz_type: 'individual', biz_type_label: '개인사업자' };
}

/** 사업자등록번호 체크섬 검증 (10자리 검증 알고리즘) */
function validateBusinessNumberChecksum(bNo: string): boolean {
  if (bNo.length !== 10) return false;

  const digits = bNo.split('').map(Number);
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * weights[i];
  }
  sum += Math.floor((digits[8] * 5) / 10);

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[9];
}

// ============================================================
// detectBizType
// ============================================================
describe('detectBizType', () => {
  it('81~89 → 법인사업자', () => {
    // 4-5번째 자리가 81
    expect(detectBizType('1238100001')).toEqual({
      biz_type: 'corporate',
      biz_type_label: '법인사업자',
    });
  });

  it('89 → 법인사업자', () => {
    expect(detectBizType('1238900001')).toEqual({
      biz_type: 'corporate',
      biz_type_label: '법인사업자',
    });
  });

  it('경계값: 80 → 개인사업자', () => {
    expect(detectBizType('1238000001')).toEqual({
      biz_type: 'individual',
      biz_type_label: '개인사업자',
    });
  });

  it('경계값: 90 → 개인사업자', () => {
    expect(detectBizType('1239000001')).toEqual({
      biz_type: 'individual',
      biz_type_label: '개인사업자',
    });
  });

  it('01 → 개인사업자', () => {
    expect(detectBizType('1230100001')).toEqual({
      biz_type: 'individual',
      biz_type_label: '개인사업자',
    });
  });
});

// ============================================================
// validateBusinessNumberChecksum
// ============================================================
describe('validateBusinessNumberChecksum', () => {
  it('10자리가 아닌 번호 거부', () => {
    expect(validateBusinessNumberChecksum('123456789')).toBe(false); // 9자리
    expect(validateBusinessNumberChecksum('12345678901')).toBe(false); // 11자리
    expect(validateBusinessNumberChecksum('')).toBe(false);
  });

  it('올바른 사업자등록번호 통과 (1248100998)', () => {
    // 검증 알고리즘:
    // digits: [1,2,4,8,1,0,0,9,9,8]
    // weights: [1,3,7,1,3,7,1,3,5]
    // products: 1×1=1, 2×3=6, 4×7=28, 8×1=8, 1×3=3, 0×7=0, 0×1=0, 9×3=27, 9×5=45
    // sum = 1+6+28+8+3+0+0+27+45 = 118
    // extra = floor((9*5)/10) = floor(4.5) = 4
    // total = 118 + 4 = 122
    // checkDigit = (10 - 122%10) % 10 = (10 - 2) % 10 = 8
    // digits[9] = 8 ✓
    expect(validateBusinessNumberChecksum('1248100998')).toBe(true);
  });

  it('체크섬 불일치 번호 거부', () => {
    // 마지막 자리를 틀리게
    expect(validateBusinessNumberChecksum('1248100999')).toBe(false);
  });

  it('모두 0인 번호', () => {
    // digits: [0,0,0,0,0,0,0,0,0,0]
    // sum = 0, extra = 0, checkDigit = (10-0)%10 = 0
    // digits[9] = 0 → 통과
    expect(validateBusinessNumberChecksum('0000000000')).toBe(true);
  });
});
