import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import {
  getConfirmedVerificationByToken,
  isDiTaken,
  markVerificationConsumed,
} from '@/lib/danal';

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
    const { name, nickname, phone, role, brokerOfficeName, businessNo, brokerRegNo, brokerAddress, brokerRegDate, danalToken } = body;

    // 필수 필드 존재 확인
    if (!name || !nickname || !phone) {
      return NextResponse.json({ error: '이름, 닉네임, 연락처는 필수입니다' }, { status: 400 });
    }

    // 문자열 타입 확인 (API 직접 호출 방어)
    if (typeof name !== 'string' || typeof nickname !== 'string' || typeof phone !== 'string') {
      return NextResponse.json({ error: '잘못된 입력 형식입니다' }, { status: 400 });
    }

    // 닉네임 길이/형식 검증
    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2 || trimmedNickname.length > 12) {
      return NextResponse.json({ error: '닉네임은 2~12자로 입력해주세요' }, { status: 400 });
    }
    if (!/^[가-힣a-zA-Z0-9_]+$/.test(trimmedNickname)) {
      return NextResponse.json({ error: '닉네임에 허용되지 않는 문자가 포함되어 있습니다' }, { status: 400 });
    }

    // 연락처 형식 검증
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!/^01[016789][0-9]{7,8}$/.test(cleanPhone)) {
      return NextResponse.json({ error: '올바른 연락처 형식이 아닙니다' }, { status: 400 });
    }

    // 이름 길이 제한 (XSS 방지)
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 50) {
      return NextResponse.json({ error: '이름은 1~50자로 입력해주세요' }, { status: 400 });
    }

    const userType = ['employer', 'seeker'].includes(role) ? role : 'seeker';

    // 다날 본인인증 토큰 소비 (전달된 경우) — CI/DI 는 서버에서만 기록
    let danalPhone: string | null = null;
    let danalFields: Record<string, unknown> = {};
    if (danalToken) {
      if (typeof danalToken !== 'string') {
        return NextResponse.json({ error: '본인인증 정보가 유효하지 않습니다' }, { status: 400 });
      }
      const verification = await getConfirmedVerificationByToken(danalToken);
      if (!verification || !verification.di) {
        return NextResponse.json({ error: '본인인증 정보가 유효하지 않습니다. 다시 인증해주세요.' }, { status: 400 });
      }
      if (await isDiTaken(verification.di, user.id)) {
        return NextResponse.json({ error: '이미 본인인증으로 가입된 계정입니다' }, { status: 409 });
      }
      danalFields = {
        ci: verification.ci,
        di: verification.di,
        realname_verified: true,
        verified_at: new Date().toISOString(),
      };
      danalPhone = verification.phone; // 응답에 번호가 있으면 사용
    }

    // users 테이블 업데이트 (소셜 로그인 이메일 포함)
    const updateData: Record<string, unknown> = {
      email: user.email,
      name: trimmedName,
      nickname: trimmedNickname,
      phone: danalPhone ? danalPhone.replace(/[^0-9]/g, '') : cleanPhone,
      user_type: userType,
      company_name: brokerOfficeName ? String(brokerOfficeName).trim() : null,
      business_no: businessNo ? String(businessNo).replace(/[^0-9-]/g, '') : null,
      ...danalFields,
    };

    // 기업회원 중개사무소 정보
    if (userType === 'employer') {
      updateData.broker_reg_no = brokerRegNo || null;
      updateData.broker_address = brokerAddress || null;
      updateData.broker_reg_date = brokerRegDate || null;
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      // DI 유니크 위반 → 동일인 재가입
      if (updateError.code === '23505' && String(updateError.message || '').includes('users_di_unique')) {
        return NextResponse.json({ error: '이미 본인인증으로 가입된 계정입니다' }, { status: 409 });
      }
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: '프로필 업데이트 실패' }, { status: 500 });
    }

    // 본인인증 토큰 소비 완료 처리 (재사용 방지)
    if (danalToken) {
      await markVerificationConsumed(danalToken as string);
    }

    // Auth 메타데이터도 업데이트
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        name: trimmedName,
        nickname: trimmedNickname,
        phone: cleanPhone,
        role: userType,
        profile_completed: true,
        ...(userType === 'employer' && brokerRegNo && {
          brokerRegNo: String(brokerRegNo).trim(),
          brokerOfficeName: brokerOfficeName ? String(brokerOfficeName).trim() : undefined,
          brokerAddress: brokerAddress ? String(brokerAddress).trim() : undefined,
          brokerRegDate: brokerRegDate ? String(brokerRegDate).trim() : undefined,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Complete profile error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
