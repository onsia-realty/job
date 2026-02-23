import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// POST /api/auth/ensure-user - 인증 후 users 테이블 레코드 자동 생성
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // Auth 사용자 정보 확인
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 });
    }

    // users 테이블에 이미 존재하는지 확인
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingUser) {
      return NextResponse.json({ exists: true, user_id: user.id });
    }

    // 메타데이터에서 사용자 정보 추출
    const meta = user.user_metadata || {};
    const name = meta.name || meta.full_name || meta.nickname || user.email?.split('@')[0] || '사용자';
    const userType = meta.role || meta.userType || 'seeker';

    // users 테이블에 새 레코드 생성
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        name: name,
        phone: meta.phone || null,
        user_type: ['employer', 'seeker', 'admin'].includes(userType) ? userType : 'seeker',
        avatar_url: meta.avatar_url || meta.picture || null,
        company_name: meta.brokerOfficeName || null,
      });

    if (insertError) {
      // 동시 요청으로 이미 생성된 경우 무시
      if (insertError.code === '23505') {
        return NextResponse.json({ exists: true, user_id: user.id });
      }
      console.error('User insert error:', insertError);
      return NextResponse.json({ error: '사용자 등록 실패' }, { status: 500 });
    }

    return NextResponse.json({ created: true, user_id: user.id });
  } catch (error) {
    console.error('Ensure user error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
