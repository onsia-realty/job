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

// GET /api/jobs/[id] - 내 공고 가져오기 (수정 페이지용)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Job fetch error:', error);
    return NextResponse.json({ error: '공고를 불러올 수 없습니다' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: '공고를 찾을 수 없거나 권한이 없습니다' }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH /api/jobs/[id] - 공고 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // 소유권 확인
  const { data: existing } = await supabaseAdmin
    .from('jobs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: '수정 권한이 없거나 공고를 찾을 수 없습니다' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .update(body)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Job update error:', error);
    return NextResponse.json({ error: '공고 수정에 실패했습니다: ' + error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/jobs/[id] - 공고 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { id } = await params;

  // 소유권 확인
  const { data: existing } = await supabaseAdmin
    .from('jobs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: '삭제 권한이 없거나 공고를 찾을 수 없습니다' }, { status: 403 });
  }

  // 관련 지원 내역 삭제
  await supabaseAdmin
    .from('applications')
    .delete()
    .eq('job_id', id);

  // 공고 삭제
  const { error } = await supabaseAdmin
    .from('jobs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Job delete error:', error);
    return NextResponse.json({ error: '공고 삭제에 실패했습니다: ' + error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
