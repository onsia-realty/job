import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey);
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: '이메일을 입력해주세요' }, { status: 400 });
  }

  // 이메일 형식 검증
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '올바른 이메일 형식이 아닙니다' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    // Service role key가 없으면 중복 체크 건너뜀 (항상 사용 가능으로 반환)
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Skipping email duplicate check.');
    return NextResponse.json({ exists: false });
  }

  try {
    // Supabase Admin API로 이메일 존재 여부 확인
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Check email error:', error);
      return NextResponse.json({ error: '확인 중 오류가 발생했습니다' }, { status: 500 });
    }

    const exists = data.users.some(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );

    return NextResponse.json({ exists });
  } catch (err) {
    console.error('Check email error:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
