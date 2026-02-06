import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── 봇/스크래퍼 User-Agent 패턴 ───
const BOT_PATTERNS = [
  /curl/i, /wget/i, /python-requests/i, /scrapy/i, /httpie/i,
  /postman/i, /insomnia/i, /node-fetch/i, /axios/i, /go-http-client/i,
  /java\//i, /libwww-perl/i, /php\//i, /ruby/i,
  /headlesschrome/i, /phantomjs/i, /selenium/i, /puppeteer/i, /playwright/i,
  /crawl/i, /spider/i, /bot(?!.*google)/i,
];

// ─── Honeypot 블랙리스트 (메모리) ───
const honeypotBlacklist = new Set<string>();

// ─── Rate Limiting ───
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW = 60_000; // 1분
const RATE_MAX = 120; // 1분에 120회

// ─── 빠른 요청 감지 (봇 행동 패턴) ───
const requestTimestamps = new Map<string, number[]>();
const BURST_WINDOW = 5_000; // 5초
const BURST_MAX = 20; // 5초에 20회 이상 = 봇

function getIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX;
}

function checkBurstRequest(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestTimestamps.get(ip) || [];
  // 오래된 타임스탬프 제거
  const recent = timestamps.filter((t) => now - t < BURST_WINDOW);
  recent.push(now);
  requestTimestamps.set(ip, recent.slice(-30)); // 최대 30개만 유지
  return recent.length > BURST_MAX;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ua = request.headers.get('user-agent') || '';
  const ip = getIP(request);

  // ─── 1. Honeypot 트랩 접근 → IP 영구 블랙리스트 ───
  if (pathname === '/api/trap') {
    honeypotBlacklist.add(ip);
    // 정상 응답처럼 보이게 (봇이 차단당한 줄 모르게)
    return NextResponse.next();
  }

  // ─── 2. 블랙리스트 IP 차단 ───
  if (honeypotBlacklist.has(ip)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // ─── 3. 소스맵 직접 접근 차단 ───
  if (pathname.endsWith('.map')) {
    return new NextResponse(null, { status: 404 });
  }

  // ─── 4. 민감 경로 직접 접근 차단 ───
  if (pathname.startsWith('/view-source:') || pathname === '/.env' || pathname === '/.env.local') {
    return new NextResponse(null, { status: 403 });
  }

  // ─── 5. User-Agent 기반 봇 차단 ───
  const isBot = BOT_PATTERNS.some((pattern) => pattern.test(ua));
  if (isBot && !pathname.startsWith('/api/')) {
    return new NextResponse('Access Denied', { status: 403 });
  }

  // ─── 6. User-Agent 없는 요청 차단 ───
  if (!ua && pathname !== '/api/health') {
    return new NextResponse('Access Denied', { status: 403 });
  }

  // ─── 7. Rate Limiting (분당 120회) ───
  if (checkRateLimit(ip)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }

  // ─── 8. Burst 감지 (5초에 20회 이상 = 봇) ───
  if (checkBurstRequest(ip)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': '30' },
    });
  }

  // ─── 9. Referer 검증 (외부에서 직접 API 호출 방지) ───
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/trap')) {
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';
    // referer 또는 origin이 있으면서 자사 도메인이 아닌 경우 차단
    if (referer && !referer.includes(host) && origin && !origin.includes(host)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  const response = NextResponse.next();

  // 캐시 제어
  if (!pathname.startsWith('/_next/static')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/image|favicon.ico|icon.svg|apple-touch-icon.png|og-image.png|robots.txt|sitemap.xml).*)',
  ],
};
