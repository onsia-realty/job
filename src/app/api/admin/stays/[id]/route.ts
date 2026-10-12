import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { STAY_STATUSES, type StayStatus } from '@/lib/stay/constants';
import { verifyAdmin } from '@/lib/auth-server';
import { isWorkflowMigrationMissing, workflowUnavailable } from '@/lib/stay/owner-lead';

// 관리자가 바꿀 수 있는 필드는 이 3개뿐이다.
// 요금·주소·연락처 등 매물 내용은 등록자만 수정할 수 있어야 하므로
// body 를 그대로 update 에 넘기지 않고 화이트리스트로 재조립한다.
interface StayAdminPatch {
  is_approved?: boolean;
  is_active?: boolean;
  status?: StayStatus;
}

// PATCH /api/admin/stays/[id] - 승인/노출/진행상태 변경
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 본문입니다' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: '잘못된 요청 본문입니다' }, { status: 400 });
  }

  const patch: StayAdminPatch = {};

  if ('is_approved' in body) {
    if (typeof body.is_approved !== 'boolean') {
      return NextResponse.json({ error: 'is_approved 는 boolean 이어야 합니다' }, { status: 400 });
    }
    patch.is_approved = body.is_approved;
  }

  if ('is_active' in body) {
    if (typeof body.is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active 는 boolean 이어야 합니다' }, { status: 400 });
    }
    patch.is_active = body.is_active;
  }

  if ('status' in body) {
    if (!STAY_STATUSES.includes(body.status as StayStatus)) {
      return NextResponse.json(
        { error: `status 는 ${STAY_STATUSES.join(', ')} 중 하나여야 합니다` },
        { status: 400 }
      );
    }
    patch.status = body.status as StayStatus;
  }

  // 화이트리스트 밖 필드만 온 경우 = 바꿀 게 없다.
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: '변경할 필드가 없습니다' }, { status: 400 });
  }

  const note = body.note;
  if (note !== undefined && (typeof note !== 'string' || note.length > 1000)) {
    return NextResponse.json({ error: '검토 메모는 1000자 이내여야 합니다' }, { status: 400 });
  }

  try {
    // The database locks the stay, checks delegated-owner confirmation before
    // approval, applies the patch and writes its audit record in one transaction.
    const { data, error } = await supabaseAdmin.rpc('review_stay', {
      p_stay_id: id, p_admin_user_id: admin.id, p_patch: patch,
      p_note: typeof note === 'string' ? note.trim() || null : null,
    });

    if (error) {
      if (isWorkflowMigrationMissing(error)) return NextResponse.json(workflowUnavailable(), { status: 503 });
      if (error.message?.includes('OWNER_CONFIRMATION_REQUIRED')) return NextResponse.json(
        { error: '집주인의 매물 내용 확인이 필요합니다', code: 'OWNER_CONFIRMATION_REQUIRED' }, { status: 409 });
      if (error.message?.includes('DRAFT_CHANGED')) return NextResponse.json(
        { error: '집주인 확인 후 매물 내용이 변경되었습니다', code: 'DRAFT_CHANGED' }, { status: 409 });
      throw error;
    }
    if (!data) {
      return NextResponse.json({ error: '매물을 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json({ success: true, stay: data }, {
      headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' },
    });
  } catch {
    return NextResponse.json({ error: '작업 실패' }, { status: 500 });
  }
}

// DELETE /api/admin/stays/[id] - 매물 삭제
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
    // stay_owner_leads.converted_stay_id 는 ON DELETE SET NULL 이라(036) 별도 정리 불필요.
    const { error } = await supabaseAdmin
      .from('stays')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin stay delete error:', error);
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
  }
}
