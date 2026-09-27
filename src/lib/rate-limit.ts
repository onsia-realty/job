import type { NextRequest } from 'next/server';

// 간단 in-memory rate limit (서버 인스턴스별, 재시작 시 초기화)
// 서버리스 환경에서는 인스턴스마다 카운터가 분리되므로 "최소한의 방어"용.
// stays/lookup-building, chat 라우트의 인라인 패턴을 공용화한 것.
export function createRateLimiter(maxPerWindow: number, windowMs = 60_000) {
  const map = new Map<string, { count: number; resetAt: number }>();

  return function check(key: string): boolean {
    const now = Date.now();

    // 메모리 누수 방지 — 요청 시점에 만료 엔트리 정리 (setInterval 은 서버리스에서 무의미)
    if (map.size >= 500) {
      for (const [k, v] of map) {
        if (now > v.resetAt) map.delete(k);
      }
    }

    const entry = map.get(key);
    if (!entry || now > entry.resetAt) {
      map.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= maxPerWindow) return false;
    entry.count++;
    return true;
  };
}

// 클라이언트 IP 추출 — 프록시(Vercel)가 설정하는 헤더 우선.
// x-real-ip / x-vercel-forwarded-for 는 Vercel 엣지가 덮어써서 클라이언트가 위조 불가.
// 둘 다 없을 때만 x-forwarded-for 의 첫 항목 사용.
export function getClientIp(request: NextRequest | Request): string {
  const h = request.headers;
  return (
    h.get('x-real-ip')?.trim()
    || h.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    || h.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'
  );
}
