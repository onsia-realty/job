import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 봇/스크래퍼 User-Agent 패턴
const BOT_PATTERNS = [
  /curl/i,
  /wget/i,
  /python-requests/i,
  /scrapy/i,
  /httpie/i,
  /postman/i,
  /insomnia/i,
  /node-fetch/i,
  /axios/i,
  /go-http-client/i,
  /java\//i,
  /libwww-perl/i,
  /php\//i,
  /ruby/i,
  /headlesschrome/i,
  /phantomjs/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
];

// Rate limiting 저장소 (Edge Runtime 호환)
const rateMap = new Map<string, { count: number; resetAt: number }>();

function getRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 60_000; // 1분
  const maxRequests = 120; // 1분에 120회

  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + window });
    return false;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return true; // rate limited
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ua = request.headers.get('user-agent') || '';
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  // ─── 1. 소스맵 직접 접근 차단 ───
  if (pathname.endsWith('.map')) {
    return new NextResponse(null, { status: 404 });
  }

  // ─── 2. view-source 차단 ───
  if (pathname.startsWith('/view-source:')) {
    return new NextResponse(null, { status: 403 });
  }

  // ─── 3. 봇/스크래퍼 감지 ───
  const isBot = BOT_PATTERNS.some((pattern) => pattern.test(ua));
  if (isBot && !pathname.startsWith('/api/')) {
    return new NextResponse('Access Denied', { status: 403 });
  }

  // ─── 4. User-Agent 없는 요청 차단 (대부분 스크래퍼) ───
  if (!ua && pathname !== '/api/health') {
    return new NextResponse('Access Denied', { status: 403 });
  }

  // ─── 5. Rate Limiting ───
  if (getRateLimit(ip)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }

  // ─── 6. 보안 헤더 추가 ───
  const response = NextResponse.next();

  // 캐시 제어 (동적 페이지)
  if (!pathname.startsWith('/_next/static')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }

  return response;
}

export const config = {
  matcher: [
    // 정적 파일 제외한 모든 경로
    '/((?!_next/image|favicon.ico|icon.svg|apple-touch-icon.png|og-image.png|robots.txt|sitemap.xml).*)',
  ],
};
