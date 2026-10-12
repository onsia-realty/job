// 단기임대(/stay) 폼 공용 순수 유틸.
//
// ⚠️ 이 파일에 'use client' 를 넣지 마라.
// 'use client' 모듈에서 export 된 함수는 서버 컴포넌트 입장에서 실제 함수가 아니라
// client reference 라서 호출 자체가 불가능하다(런타임 "Attempted to call X() from the
// server but X is on the client"). 타입은 맞으니 tsc 는 통과하고 런타임에만 터진다.
// 그래서 순수 유틸은 반드시 클라이언트 경계 밖(이 파일)에 둔다.
// 원래 OwnerLeadForm.tsx('use client') 안에 있던 것을 옮겨온 것이다.
// OwnerLeadForm(소유주 접수)과 StayCreateForm(매물 등록)이 함께 쓴다.

import { STAY_TYPES, type StayType } from '@/lib/stay/constants';

// ---------- 매물 유형 ----------

/**
 * 폼에서 선택 가능한 매물 유형.
 * living_facility(생활숙박시설)는 v1 미취급이라 제외한다.
 */
export const SELECTABLE_STAY_TYPES = STAY_TYPES.filter(
  (t): t is Exclude<StayType, 'living_facility'> => t !== 'living_facility'
);

// ---------- 연락처 ----------

/** 휴대폰 번호 검증 패턴 — 010-1234-5678 (하이픈 포함) 형태만 허용 */
export const PHONE_PATTERN = /^010-\d{4}-\d{4}$/;

/** 010-1234-5678 형태로 자동 하이픈 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// ---------- 숫자 파싱 ----------

/**
 * 만원 단위 입력 → 원 단위 정수. 빈 값/비정상 입력은 null.
 *
 * 사용자 입력은 만원, DB/스키마는 원 단위 정수다.
 * "12.5" 같은 소수 입력이 들어오면 n * 10_000 이 부동소수 오차로 정수가 아닐 수 있으므로,
 * zod `.int()` 검증을 통과하려면 Math.round 가 필수다.
 */
export function manwonToWon(input: string): number | null {
  const trimmed = input.replace(/,/g, '').trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 10_000);
}

/** 문자열 → number. 빈 값/NaN/Infinity 는 null. (면적·층수 등 단위 변환 없는 입력용) */
export function toNumberOrNull(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
