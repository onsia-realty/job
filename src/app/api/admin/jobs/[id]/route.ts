import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!dbUser || dbUser.user_type !== 'admin') return null;
  return user;
}

// PATCH /api/admin/jobs/[id] - 공고 승인/반려/상태변경
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  try {
    if (action === 'approve') {
      const { error } = await supabaseAdmin
        .from('jobs')
        .update({ is_approved: true, is_active: true })
        .eq('id', id);
      if (error) throw error;
    } else if (action === 'reject') {
      const { error } = await supabaseAdmin
        .from('jobs')
        .update({ is_approved: false, is_active: false })
        .eq('id', id);
      if (error) throw error;
    } else if (action === 'toggle_active') {
      const { data: job } = await supabaseAdmin
        .from('jobs')
        .select('is_active')
        .eq('id', id)
        .single();
      if (job) {
        const { error } = await supabaseAdmin
          .from('jobs')
          .update({ is_active: !job.is_active })
          .eq('id', id);
        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin job action error:', error);
    return NextResponse.json({ error: '작업 실패' }, { status: 500 });
  }
}

// DELETE /api/admin/jobs/[id] - 공고 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
  }

  const { id } = await params;

  try {
    // 관련 지원 내역 먼저 삭제
    await supabaseAdmin
      .from('applications')
      .delete()
      .eq('job_id', id);

    const { error } = await supabaseAdmin
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin job delete error:', error);
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
  }
}
