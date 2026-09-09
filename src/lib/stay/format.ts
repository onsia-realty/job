// 단기임대(/stay) 순수 포맷 유틸.
//
// ⚠️ 이 파일에 'use client' 를 넣지 마라.
// 'use client' 모듈에서 export 된 함수는 서버 컴포넌트 입장에서 실제 함수가 아니라
// client reference 라서 호출 자체가 불가능하다(런타임 "Attempted to call X() from the
// server but X is on the client"). 타입은 맞으니 tsc 는 통과하고 런타임에만 터진다.
// 그래서 순수 포맷 유틸은 반드시 클라이언트 경계 밖(이 파일)에 둔다.
// 원래 StayPrimitives.tsx('use client') 안에 있던 것을 옮겨온 것이다.

// ---------- 금액 포맷 ----------
// stays 도메인은 전부 "원 단위" 정수다. (시세 도메인의 만원 단위와 혼동 금지)

/** 1_200_000 → "120만" · 25_000_000 → "2,500만" · 100_000_000 → "1억" */
export function formatWon(won: number | null | undefined): string {
  if (won == null) return '-';
  if (won < 10000) return `${won.toLocaleString('ko-KR')}원`;

  const eok = Math.floor(won / 100_000_000);
  const man = Math.floor((won % 100_000_000) / 10_000);

  if (eok > 0) return man > 0 ? `${eok}억 ${man.toLocaleString('ko-KR')}만` : `${eok}억`;
  return `${man.toLocaleString('ko-KR')}만`;
}

/** 보증금/월세 한 줄 표기 — "보증금 300만 / 월 120만" */
export function formatDepositMonthly(
  depositWon: number | null,
  monthlyWon: number | null
): string {
  const parts: string[] = [];
  if (depositWon != null) parts.push(`보증금 ${formatWon(depositWon)}`);
  if (monthlyWon != null) parts.push(`월 ${formatWon(monthlyWon)}`);
  return parts.join(' / ') || '가격 문의';
}

/** ㎡ → 평 (소수 1자리). 면적 표기는 항상 "㎡(평)" 병기한다. */
export function formatArea(m2: number | null | undefined): string {
  if (m2 == null) return '-';
  return `${m2}㎡ (${(m2 / 3.3058).toFixed(1)}평)`;
}

/** 최소 계약기간 일수 → "3개월 이상" */
export function formatMinStay(days: number | null | undefined): string {
  if (days == null) return '기간 협의';
  const months = Math.round(days / 30);
  return months >= 12 ? `${Math.round(months / 12)}년 이상` : `${months}개월 이상`;
}
