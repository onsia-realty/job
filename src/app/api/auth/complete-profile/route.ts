import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// POST /api/auth/complete-profile - 소셜 로그인 후 프로필 완성
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 });
    }

    const body = await req.json();
    const { name, nickname, phone, role, brokerOfficeName, businessNo } = body;

    if (!name || !nickname || !phone) {
      return NextResponse.json({ error: '이름, 닉네임, 연락처는 필수입니다' }, { status: 400 });
    }

    const userType = ['employer', 'seeker'].includes(role) ? role : 'seeker';

    // users 테이블 업데이트 (소셜 로그인 이메일 포함)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email: user.email,
        name,
        nickname,
        phone,
        user_type: userType,
        company_name: brokerOfficeName || null,
        business_no: businessNo || null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: '프로필 업데이트 실패' }, { status: 500 });
    }

    // Auth 메타데이터도 업데이트
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        name,
        nickname,
        phone,
        role: userType,
        profile_completed: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Complete profile error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
