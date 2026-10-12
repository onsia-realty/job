import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { createRateLimiter, getClientIp } from '@/lib/rate-limit';

// 연락처 존재 여부 조회 남용 방지: IP당 분당 10회
const checkRateLimit = createRateLimiter(10);

// GET /api/check-phone?phone=010-0000-0000 - 연락처 중복 확인
export async function GET(req: NextRequest) {
  if (!checkRateLimit(getClientIp(req))) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
  }

  const phone = req.nextUrl.searchParams.get('phone');
  if (!phone) {
    return NextResponse.json({ error: '연락처를 입력해주세요' }, { status: 400 });
  }

  const normalized = phone.replace(/[^0-9]/g, '');
  if (normalized.length < 10) {
    return NextResponse.json({ error: '올바른 연락처 형식이 아닙니다' }, { status: 400 });
  }

  try {
    // users 테이블에서 동일 연락처 확인 (중복 행이 이미 있어도 500 나지 않도록 limit(1))
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', normalized)
      .limit(1);

    if (error) throw error;

    return NextResponse.json({ duplicate: (data?.length ?? 0) > 0 });
  } catch (error) {
    console.error('Check phone error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
