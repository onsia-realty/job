import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/check-phone?phone=010-0000-0000 - 연락처 중복 확인
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone');
  if (!phone) {
    return NextResponse.json({ error: '연락처를 입력해주세요' }, { status: 400 });
  }

  const normalized = phone.replace(/[^0-9]/g, '');
  if (normalized.length < 10) {
    return NextResponse.json({ error: '올바른 연락처 형식이 아닙니다' }, { status: 400 });
  }

  try {
    // users 테이블에서 동일 연락처 확인
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', normalized)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ duplicate: !!data });
  } catch (error) {
    console.error('Check phone error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
