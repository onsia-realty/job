import { describe, it, expect } from 'vitest';
import { buildPnu, parseJibun, isValidBcode, lawdCdFromBcode } from '@/lib/stay/pnu';
import { splitPnu } from '@/lib/market/buildingLedger';

const GANGNAM_YEOKSAM = '1168010100'; // 서울특별시 강남구 역삼동

describe('parseJibun', () => {
  it('일반 지번 "역삼동 123-45" → 산 아님, 본번 123, 부번 45', () => {
    expect(parseJibun('서울특별시 강남구 역삼동 123-45')).toEqual({
      isMountain: false,
      bun: 123,
      ji: 45,
    });
  });

  it('산 지번 "산 12-3" → isMountain true', () => {
    expect(parseJibun('경기도 광주시 초월읍 산 12-3')).toEqual({
      isMountain: true,
      bun: 12,
      ji: 3,
    });
  });

  it('산이 숫자에 붙은 "산12-3" 도 인식', () => {
    expect(parseJibun('경기도 광주시 초월읍 산12-3')?.isMountain).toBe(true);
  });

  it('부번 없음 "123" → ji 0', () => {
    expect(parseJibun('서울특별시 중구 명동1가 123')).toEqual({
      isMountain: false,
      bun: 123,
      ji: 0,
    });
  });

  it('괄호 부가정보 / 번지 접미사 제거', () => {
    expect(parseJibun('서울특별시 강남구 역삼동 123-45번지')?.ji).toBe(45);
    expect(parseJibun('서울특별시 강남구 역삼동 123-45 (역삼동, 개나리빌딩)')?.bun).toBe(123);
  });

  it('파싱 불가 입력 → null', () => {
    expect(parseJibun('')).toBeNull();
    expect(parseJibun(null)).toBeNull();
    expect(parseJibun(undefined)).toBeNull();
    expect(parseJibun('서울특별시 강남구 역삼동')).toBeNull();
    expect(parseJibun('강남구 테헤란로 152')).not.toBeNull(); // 숫자로 끝나면 지번으로 간주됨(호출측 책임)
    expect(parseJibun('본번없음-45')).toBeNull();
  });

  it('본번 0 또는 5자리 이상은 실패', () => {
    expect(parseJibun('서울특별시 강남구 역삼동 0')).toBeNull();
    expect(parseJibun('서울특별시 강남구 역삼동 12345')).toBeNull();
  });
});

describe('isValidBcode / lawdCdFromBcode', () => {
  it('10자리 숫자만 유효', () => {
    expect(isValidBcode(GANGNAM_YEOKSAM)).toBe(true);
    expect(isValidBcode('116801010')).toBe(false); // 9자리
    expect(isValidBcode('11680101001')).toBe(false); // 11자리
    expect(isValidBcode('11680a0100')).toBe(false);
    expect(isValidBcode(null)).toBe(false);
  });

  it('lawd_cd 는 앞 5자리', () => {
    expect(lawdCdFromBcode(GANGNAM_YEOKSAM)).toBe('11680');
    expect(lawdCdFromBcode('123')).toBeNull();
  });
});

describe('buildPnu', () => {
  it('일반 지번 → 필지구분 1, 본번 0123, 부번 0045', () => {
    const pnu = buildPnu(GANGNAM_YEOKSAM, '서울특별시 강남구 역삼동 123-45');
    expect(pnu).toBe(`${GANGNAM_YEOKSAM}1` + '0123' + '0045');
  });

  it('산 지번 → 필지구분 2', () => {
    const pnu = buildPnu('4161034022', '경기도 광주시 초월읍 산 12-3');
    expect(pnu?.slice(10, 11)).toBe('2');
  });

  it('부번 없으면 0000', () => {
    const pnu = buildPnu(GANGNAM_YEOKSAM, '서울특별시 강남구 역삼동 123');
    expect(pnu?.slice(15, 19)).toBe('0000');
  });

  it('결과는 항상 정확히 19자리', () => {
    const cases = [
      '서울특별시 강남구 역삼동 1',
      '서울특별시 강남구 역삼동 9999-9999',
      '서울특별시 강남구 역삼동 산 7',
    ];
    for (const c of cases) {
      const pnu = buildPnu(GANGNAM_YEOKSAM, c);
      expect(pnu).not.toBeNull();
      expect(pnu!.length).toBe(19);
      expect(/^\d{19}$/.test(pnu!)).toBe(true);
    }
  });

  it('bcode 자릿수 이상 → null', () => {
    expect(buildPnu('116801010', '서울특별시 강남구 역삼동 123-45')).toBeNull();
    expect(buildPnu('11680101000', '서울특별시 강남구 역삼동 123-45')).toBeNull();
    expect(buildPnu(null, '서울특별시 강남구 역삼동 123-45')).toBeNull();
  });

  it('지번 파싱 실패 → null (예외 아님)', () => {
    expect(buildPnu(GANGNAM_YEOKSAM, '서울특별시 강남구 역삼동')).toBeNull();
    expect(buildPnu(GANGNAM_YEOKSAM, null)).toBeNull();
  });
});

describe('splitPnu 왕복(round-trip)', () => {
  it('일반 지번: splitPnu 가 platGbCd 0(대지) 으로 변환', () => {
    const pnu = buildPnu(GANGNAM_YEOKSAM, '서울특별시 강남구 역삼동 123-45')!;
    const s = splitPnu(pnu);
    expect(s).not.toBeNull();
    expect(s!.sigunguCd).toBe('11680');
    expect(s!.bjdongCd).toBe('10100');
    expect(s!.platGbCd).toBe('0'); // ⚠️ 일반 = 0 (표준 PNU 의 1 이 아님)
    expect(s!.bun).toBe('0123');
    expect(s!.ji).toBe('0045');
  });

  it('산 지번: splitPnu 가 platGbCd 1(산) 으로 변환', () => {
    const pnu = buildPnu('4161034022', '경기도 광주시 초월읍 산 12-3')!;
    const s = splitPnu(pnu);
    expect(s!.platGbCd).toBe('1');
    expect(s!.bun).toBe('0012');
    expect(s!.ji).toBe('0003');
  });

  it('bcode + 지번 정보가 왕복 후에도 보존', () => {
    const bcode = '2611010100';
    const pnu = buildPnu(bcode, '부산광역시 중구 중앙동1가 7-2')!;
    const s = splitPnu(pnu)!;
    expect(s.sigunguCd + s.bjdongCd).toBe(bcode);
    expect(parseInt(s.bun, 10)).toBe(7);
    expect(parseInt(s.ji, 10)).toBe(2);
  });
});
