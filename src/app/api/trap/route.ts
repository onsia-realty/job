import { NextRequest, NextResponse } from 'next/server';

/**
 * Honeypot 트랩 API
 * - 숨겨진 링크를 따라온 봇/크롤러의 IP를 기록
 * - 사람은 절대 이 링크를 볼 수 없음 (CSS로 완전 숨김)
 * - 이 엔드포인트에 접근하는 것 자체가 봇 증거
 */

// 메모리 기반 블랙리스트 (프로덕션에서는 Redis/DB 사용 권장)
const blacklistedIPs = new Set<string>();

// 외부에서 블랙리스트 조회 가능하게 export
export function isBlacklisted(ip: string): boolean {
  return blacklistedIPs.has(ip);
}

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const src = request.nextUrl.searchParams.get('src') || 'unknown';
  const ua = request.headers.get('user-agent') || 'none';
  const timestamp = new Date().toISOString();

  // IP 블랙리스트 등록
  blacklistedIPs.add(ip);

  // 로그 기록 (프로덕션에서는 DB에 저장)
  console.warn(`[HONEYPOT] Bot detected | IP: ${ip} | Source: ${src} | UA: ${ua} | Time: ${timestamp}`);

  // 봇에게는 정상 페이지처럼 보이는 가짜 응답
  return new NextResponse(
    '<html><head><title>부동산인</title></head><body><p>페이지를 찾을 수 없습니다.</p></body></html>',
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}
