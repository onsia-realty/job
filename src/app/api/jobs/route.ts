import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Bearer 토큰에서 사용자 확인
async function verifyUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// POST /api/jobs - 공고 등록
export async function POST(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다' }, { status: 400 });
  }

  // 서버에서 강제 설정하는 필드 (클라이언트 값 무시)
  const { tier: _t, is_approved: _a, is_active: _ac, user_id: _u, views: _v, ...safeBody } = body;

  const jobData = {
    ...safeBody,
    user_id: user.id,
    tier: 'normal',       // 무료 등급 강제 (결제 후에만 변경 가능)
    is_active: true,
    is_approved: true,
  };

  // 무료(normal) 공고: deadline을 KST 기준 24시간 후로 자동 설정
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const kstExpires = new Date(kstNow.getTime() + 24 * 60 * 60 * 1000);
  jobData.deadline = kstExpires.toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .insert(jobData)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Job insert error:', error);
    return NextResponse.json({ error: '공고 등록에 실패했습니다: ' + error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
