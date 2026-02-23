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

// PATCH /api/admin/members/[id] - 회원 상태 변경
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
    if (action === 'toggle_status') {
      const { data: member } = await supabaseAdmin
        .from('users')
        .select('is_active')
        .eq('id', id)
        .single();

      if (member) {
        const currentStatus = member.is_active !== false;
        await supabaseAdmin
          .from('users')
          .update({ is_active: !currentStatus })
          .eq('id', id);
      }
    } else if (action === 'set_role') {
      const { role } = body;
      if (!['admin', 'employer', 'seeker'].includes(role)) {
        return NextResponse.json({ error: '유효하지 않은 역할입니다' }, { status: 400 });
      }
      // 자기 자신의 관리자 권한은 해제할 수 없음
      if (id === admin.id && role !== 'admin') {
        return NextResponse.json({ error: '자기 자신의 관리자 권한은 해제할 수 없습니다' }, { status: 400 });
      }
      await supabaseAdmin
        .from('users')
        .update({ user_type: role })
        .eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin member action error:', error);
    return NextResponse.json({ error: '작업 실패' }, { status: 500 });
  }
}

// DELETE /api/admin/members/[id] - 회원 삭제
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
    // 관련 데이터 삭제
    await supabaseAdmin.from('applications').delete().eq('user_id', id);
    await supabaseAdmin.from('resumes').delete().eq('user_id', id);
    await supabaseAdmin.from('jobs').delete().eq('user_id', id);
    await supabaseAdmin.from('users').delete().eq('id', id);

    // Supabase Auth에서도 삭제
    await supabaseAdmin.auth.admin.deleteUser(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin member delete error:', error);
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
  }
}
