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

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .insert({
      ...body,
      user_id: user.id,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Job insert error:', error);
    return NextResponse.json({ error: '공고 등록에 실패했습니다: ' + error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
