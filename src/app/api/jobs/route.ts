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

  const body = await req.json();

  // 무료(normal) 공고: deadline을 24시간 후로 자동 설정
  const jobData = { ...body, user_id: user.id };
  if (!jobData.tier || jobData.tier === 'normal') {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    // KST 기준 날짜
    const kstExpires = new Date(expires.getTime() + 9 * 60 * 60 * 1000);
    jobData.deadline = kstExpires.toISOString().slice(0, 10);
  }

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
