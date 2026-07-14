import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import {
  getConfirmedVerificationByToken,
  isDiTaken,
  markVerificationConsumed,
} from '@/lib/danal';

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
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ exists: true, user_id: user.id });
    }

    // 메타데이터에서 사용자 정보 추출
    const meta = user.user_metadata || {};
    const name = meta.name || meta.full_name || meta.nickname || user.email?.split('@')[0] || '사용자';
    const nickname = meta.nickname || null;
    const userType = meta.role || meta.userType || 'seeker';

    // 이메일 가입 시 metadata 로 전달된 다날 본인인증 토큰 소비 (CI/DI 는 서버에서만 기록)
    let danalFields: Record<string, unknown> = {};
    let danalPhone: string | null = null;
    const danalToken: string | undefined = typeof meta.danalToken === 'string' ? meta.danalToken : undefined;
    if (danalToken) {
      const verification = await getConfirmedVerificationByToken(danalToken);
      if (verification && verification.di) {
        // 동일 DI 로 이미 가입된 계정이 있으면 차단
        if (await isDiTaken(verification.di)) {
          return NextResponse.json({ error: '이미 본인인증으로 가입된 계정입니다' }, { status: 409 });
        }
        danalFields = {
          ci: verification.ci,
          di: verification.di,
          realname_verified: true,
          verified_at: new Date().toISOString(),
        };
        danalPhone = verification.phone;
      }
      // 토큰이 유효하지 않으면(만료/오류) 본인인증 없이 계정만 생성 — 로그인 자체를 막지 않음
    }

    // users 테이블에 새 레코드 생성
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        name: name,
        nickname: nickname,
        phone: danalPhone ? danalPhone.replace(/[^0-9]/g, '') : (meta.phone || null),
        user_type: ['employer', 'seeker', 'admin'].includes(userType) ? userType : 'seeker',
        avatar_url: meta.avatar_url || meta.picture || null,
        company_name: meta.brokerOfficeName || null,
        business_no: meta.businessNo || null,
        broker_reg_no: meta.brokerRegNo || null,
        broker_address: meta.brokerAddress || null,
        broker_reg_date: meta.brokerRegDate || null,
        ...danalFields,
      });

    if (insertError) {
      // DI 유니크 위반 → 동일인 재가입
      if (insertError.code === '23505' && String(insertError.message || '').includes('users_di_unique')) {
        return NextResponse.json({ error: '이미 본인인증으로 가입된 계정입니다' }, { status: 409 });
      }
      // 동시 요청으로 이미 생성된 경우 무시
      if (insertError.code === '23505') {
        return NextResponse.json({ exists: true, user_id: user.id });
      }
      console.error('User insert error:', insertError);
      return NextResponse.json({ error: '사용자 등록 실패' }, { status: 500 });
    }

    // 본인인증 토큰 소비 완료 처리
    if (danalToken && Object.keys(danalFields).length > 0) {
      await markVerificationConsumed(danalToken);
    }

    return NextResponse.json({ created: true, user_id: user.id });
  } catch (error) {
    console.error('Ensure user error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
