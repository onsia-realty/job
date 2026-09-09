import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { verifyUser, isAdminUserId } from '@/lib/auth-server';
import { stayUpdateSchema, STAY_FIELD_MESSAGES } from '@/lib/validations/stay';
import { buildAgentSnapshot } from '@/lib/stay/agent-snapshot';

// GET /api/stays/[id] - 매물 단건 조회
// 공개(is_active && is_approved)면 누구나. 비공개 행은 소유자 또는 관리자만.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('stays')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Stay fetch error:', error);
    return NextResponse.json({ error: '매물을 불러올 수 없습니다' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: '매물을 찾을 수 없습니다' }, { status: 404 });
  }

  const isPublic = data.is_active === true && data.is_approved === true;
  if (isPublic) {
    return NextResponse.json(data);
  }

  // 비공개 행: 소유자 또는 관리자만
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: '매물을 찾을 수 없습니다' }, { status: 404 });
  }

  const isOwner = data.user_id === user.id;
  if (!isOwner && !(await isAdminUserId(user.id))) {
    // 존재 여부를 흘리지 않도록 404 로 통일
    return NextResponse.json({ error: '매물을 찾을 수 없습니다' }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH /api/stays/[id] - 매물 수정 (소유자만)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { id } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다' }, { status: 400 });
  }

  const parsed = stayUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = String(issue?.path?.[0] ?? '');
    const message = STAY_FIELD_MESSAGES[field] || issue?.message || '입력 내용을 확인해주세요';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // 서버 강제 필드 재스트립 (스키마가 이미 제거하지만 방어적으로 한 번 더)
  const {
    user_id: _u,
    views: _v,
    is_approved: _a,
    source: _s,
    lead_id: _l,
    id: _i,
    created_at: _c,
    updated_at: _up,
    // 038 법정표기 스냅샷 — 스키마 화이트리스트에 없어 이미 strip 되지만 방어 2중
    agent_office_name: _an,
    agent_office_address: _aa,
    agent_phone: _ap,
    agent_reg_no: _ar,
    agent_representative: _av,
    broker_office_id: _bo,
    agent_snapshot_at: _as,
    ...sanitized
  } = parsed.data as Record<string, unknown>;

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: '수정할 내용이 없습니다' }, { status: 400 });
  }

  // 소유권 확인 (+ 스냅샷 재동기화 판단용 owner_type)
  const { data: existing } = await supabaseAdmin
    .from('stays')
    .select('id, owner_type')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: '수정 권한이 없거나 매물을 찾을 수 없습니다' }, { status: 403 });
  }

  // 038 중개사 법정표기 스냅샷 재동기화 — 매 수정마다 최신 users/broker_offices 값으로 덮어쓴다.
  // 결과 owner_type: 본문에 있으면 그것, 없으면 기존 행 값. 'agent' 가 아니면 7개 전부 null.
  const resultOwnerType =
    parsed.data.owner_type !== undefined ? parsed.data.owner_type : existing.owner_type;
  const agentSnapshot =
    resultOwnerType === 'agent' ? await buildAgentSnapshot(user.id) : null;

  const updateData = {
    ...sanitized,
    // ---- 서버 강제 값은 반드시 마지막에 스프레드 ----
    agent_office_name: agentSnapshot?.agent_office_name ?? null,
    agent_office_address: agentSnapshot?.agent_office_address ?? null,
    agent_phone: agentSnapshot?.agent_phone ?? null,
    agent_reg_no: agentSnapshot?.agent_reg_no ?? null,
    agent_representative: agentSnapshot?.agent_representative ?? null,
    broker_office_id: agentSnapshot?.broker_office_id ?? null,
    agent_snapshot_at: agentSnapshot?.agent_snapshot_at ?? null,
  };

  const { data, error } = await supabaseAdmin
    .from('stays')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Stay update error:', error);
    return NextResponse.json(
      { error: '매물 수정에 실패했습니다. 입력 내용을 확인 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

// DELETE /api/stays/[id] - 매물 삭제 (소유자만)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { id } = await params;

  const { data: existing } = await supabaseAdmin
    .from('stays')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: '삭제 권한이 없거나 매물을 찾을 수 없습니다' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('stays')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Stay delete error:', error);
    return NextResponse.json({ error: '매물 삭제에 실패했습니다' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
