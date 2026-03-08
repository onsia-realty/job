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

  try {
    // users 테이블에서 직접 이메일 조회 (listUsers 페이지네이션 문제 해결)
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('Check email error:', error);
      return NextResponse.json({ error: '확인 중 오류가 발생했습니다' }, { status: 500 });
    }

    return NextResponse.json({ exists: !!data });
  } catch (err) {
    console.error('Check email error:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
