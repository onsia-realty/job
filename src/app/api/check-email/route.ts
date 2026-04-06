import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: '이메일을 입력해주세요' }, { status: 400 });
  }

  // 이메일 형식 검증
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '올바른 이메일 형식이 아닙니다' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    // 1. users 테이블에서 확인 (가입 완료된 유저)
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userError) {
      console.error('Check email (users) error:', userError);
      return NextResponse.json({ error: '확인 중 오류가 발생했습니다' }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ exists: true });
    }

    // 2. Supabase Auth 확인 (이메일 가입 후 인증 미완료 유저 포함)
    //    signUp에 같은 이메일 + 임의 비밀번호로 dry-run 불가하므로,
    //    auth.admin.listUsers 사용 (소규모 서비스에서 충분)
    try {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (users?.some(u => u.email?.toLowerCase() === normalizedEmail)) {
        return NextResponse.json({ exists: true });
      }
    } catch {
      // auth admin 조회 실패 시 users 테이블 결과만 사용
    }

    return NextResponse.json({ exists: false });
  } catch (err) {
    console.error('Check email error:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
