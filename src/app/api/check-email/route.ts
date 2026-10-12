import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { createRateLimiter, getClientIp } from '@/lib/rate-limit';

// 이메일 존재 여부 조회(계정 열거) 남용 방지: IP당 분당 10회
const checkRateLimit = createRateLimiter(10);

export async function GET(request: NextRequest) {
  if (!checkRateLimit(getClientIp(request))) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
  }

  const email = request.nextUrl.searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: '이메일을 입력해주세요' }, { status: 400 });
  }

  // 이메일 형식 검증
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '올바른 이메일 형식이 아닙니다' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase();
  // ilike 와일드카드(%, _) 및 이스케이프 문자 escape → 대소문자 무시 "정확 일치"
  const emailPattern = normalizedEmail.replace(/[\\%_]/g, '\\$&');

  try {
    // users 테이블에서 직접 조회 (가입 완료된 유저, 대소문자 무시)
    // 기존 auth.admin.listUsers({ perPage: 1000 }) 전체 스캔은 1000명 초과 시 누락되어 제거.
    // 인증 미완료 등 users 행이 없는 경우는 signup 단계의 'already registered' 처리가 최종 방어.
    const { data: existingUsers, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('email', emailPattern)
      .limit(1);

    if (userError) {
      console.error('Check email (users) error:', userError);
      return NextResponse.json({ error: '확인 중 오류가 발생했습니다' }, { status: 500 });
    }

    return NextResponse.json({ exists: (existingUsers?.length ?? 0) > 0 });
  } catch (err) {
    console.error('Check email error:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
