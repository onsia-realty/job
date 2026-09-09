/**
 * PNU(고유지번번호) 조립 유틸 — 단기임대(stays) 프리필 전용.
 *
 * PNU 19자리 = 법정동코드(10) + 필지구분(1) + 본번(4) + 부번(4)
 *
 * ⚠️ 필지구분 코드 체계 주의
 *   - 표준 PNU 필지구분: 1 = 일반(대지), 2 = 산
 *   - 건축물대장 API platGbCd: 0 = 대지, 1 = 산
 *   이 파일은 "표준 PNU"만 만든다(1/2). API용 0/1 변환은
 *   `src/lib/market/buildingLedger.ts` 의 splitPnu() 가 담당하므로
 *   여기서 미리 변환하면 전 건이 "산"으로 조회돼 미스난다.
 *   → buildPnu() 결과는 splitPnu() 의 역함수가 되도록 맞춰져 있다.
 *
 * 실패 시 예외를 던지지 않고 null 을 반환한다.
 * 프리필은 편의 기능이며, 파싱 실패가 매물 등록을 막아서는 안 된다.
 */

export interface ParsedJibun {
  /** 산 지번 여부 */
  isMountain: boolean;
  /** 본번 (1~9999) */
  bun: number;
  /** 부번 (0~9999, 없으면 0) */
  ji: number;
}

/** 표준 PNU 필지구분 코드 */
export const PNU_GB_NORMAL = '1';
export const PNU_GB_MOUNTAIN = '2';

/**
 * 지번주소 문자열에서 "산 여부 / 본번 / 부번" 추출.
 *
 * 지원 형태 (Daum 우편번호 API jibunAddress 기준):
 *   "서울특별시 강남구 역삼동 123-45"
 *   "경기도 광주시 초월읍 산 12-3"  /  "... 산12-3"
 *   "서울특별시 중구 명동1가 1"       → 부번 0
 *   "... 123-45번지"                  → 접미사 허용
 *   "... 123-45 (역삼동, 개나리빌딩)" → 괄호 부가정보 제거
 */
export function parseJibun(jibunAddress: string | null | undefined): ParsedJibun | null {
  if (!jibunAddress || typeof jibunAddress !== 'string') return null;

  // 괄호 부가정보 제거 + 공백 정규화
  let s = jibunAddress.replace(/\([^)]*\)/g, ' ');
  // 전각 하이픈/대시류를 ASCII 하이픈으로
  s = s.replace(/[‐-―－−]/g, '-');
  s = s.replace(/\s+/g, ' ').trim();
  if (!s) return null;

  // 끝의 "번지" 등 접미사 제거
  s = s.replace(/\s*번지\s*$/, '').trim();

  // 마지막 토큰이 지번이어야 한다.
  //  (산)? (본번) (-부번)?
  const m = s.match(/(?:^|\s)(산)?\s*(\d{1,4})(?:\s*-\s*(\d{1,4}))?$/);
  if (!m) return null;

  const isMountain = m[1] === '산';
  const bun = parseInt(m[2], 10);
  const ji = m[3] != null ? parseInt(m[3], 10) : 0;

  if (!Number.isFinite(bun) || bun <= 0 || bun > 9999) return null;
  if (!Number.isFinite(ji) || ji < 0 || ji > 9999) return null;

  return { isMountain, bun, ji };
}

/** 법정동코드 10자리 검증 */
export function isValidBcode(bcode: string | null | undefined): boolean {
  return typeof bcode === 'string' && /^\d{10}$/.test(bcode);
}

/**
 * bcode(법정동코드 10자리) + 지번주소 → 표준 PNU 19자리.
 * 어느 한쪽이라도 파싱/검증 실패면 null.
 */
export function buildPnu(
  bcode: string | null | undefined,
  jibunAddress: string | null | undefined,
): string | null {
  if (!isValidBcode(bcode)) return null;

  const parsed = parseJibun(jibunAddress);
  if (!parsed) return null;

  const gb = parsed.isMountain ? PNU_GB_MOUNTAIN : PNU_GB_NORMAL;
  const bun = String(parsed.bun).padStart(4, '0');
  const ji = String(parsed.ji).padStart(4, '0');

  const pnu = `${bcode}${gb}${bun}${ji}`;
  // 방어: 어떤 경우에도 19자리가 아니면 실패로 취급
  return pnu.length === 19 ? pnu : null;
}

/** PNU 앞 5자리 = 시군구코드(lawd_cd) */
export function lawdCdFromBcode(bcode: string | null | undefined): string | null {
  return isValidBcode(bcode) ? (bcode as string).slice(0, 5) : null;
}
