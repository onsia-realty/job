import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { verifyAdmin } from '@/lib/auth-server';
import { stayCreateSchema, STAY_FIELD_MESSAGES } from '@/lib/validations/stay';
import { OWNER_LEAD_DRAFT_SELECT, adminOwnerLeadDraftSchema,
  isWorkflowMigrationMissing, ownerLeadDetail, workflowUnavailable } from '@/lib/stay/owner-lead';

// GET /api/admin/stay-leads - 소유주 랜딩(/stay/owner) 접수 리드 목록 (조회 전용)
//
// stay_owner_leads 는 RLS 정책이 0건인 서버 전용 잠금 테이블이다(036:59-65).
// 개인정보(이름·연락처·주소)가 담기므로 service_role 로만 읽고, 쓰기는 여기서 제공하지 않는다.
// ip_hash 는 어뷰징 추적용 내부 값이라 응답에 싣지 않는다.
const LEAD_COLUMNS = [
  'id',
  'name',
  'phone',
  'address',
  'building_name',
  'unit_count',
  'memo',
  'privacy_agreed',
  'marketing_agreed',
  'publication_agreed',
  'source_code',
  'status',
  'converted_stay_id',
  'detail',
  'detail_version',
  'applicant_user_id',
  'draft_confirmed_at',
  'draft_confirmed_stay_updated_at',
  'created_at',
  'updated_at',
].join(', ');

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
  }

  try {
    const { data: leads, error } = await supabaseAdmin
      .from('stay_owner_leads')
      .select(LEAD_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const rows = (leads || []) as unknown as Record<string, unknown>[];
    const stayIds = rows.map((lead) => lead.converted_stay_id)
      .filter((id): id is string => typeof id === 'string');
    let drafts = new Map<string, Record<string, unknown>>();
    if (stayIds.length > 0) {
      const { data: stays, error: stayError } = await supabaseAdmin.from('stays')
        .select(OWNER_LEAD_DRAFT_SELECT).in('id', stayIds);
      if (stayError) throw stayError;
      const stayRows = (stays ?? []) as unknown as Record<string, unknown>[];
      drafts = new Map(stayRows.map((stay) => [stay.id as string, stay]));
    }
    return NextResponse.json(rows.map((lead) => {
      const draft = typeof lead.converted_stay_id === 'string'
        ? drafts.get(lead.converted_stay_id) ?? null : null;
      const detail = ownerLeadDetail(lead.detail);
      return { ...lead, stay_type: detail?.stay_type ?? null,
        desired_deposit_won: detail?.desired_deposit_won ?? null,
        desired_weekly_fee_won: detail?.desired_weekly_fee_won ?? null,
        detail_address: detail?.detail_address ?? null,
        draft, confirmation_current: !!draft && (draft.is_approved === true
        || (typeof lead.draft_confirmed_stay_updated_at === 'string'
          && lead.draft_confirmed_stay_updated_at === draft.updated_at)) };
    }), { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } });
  } catch (error) {
    if (isWorkflowMigrationMissing(error)) {
      return NextResponse.json(workflowUnavailable(), { status: 503 });
    }
    return NextResponse.json({ error: '리드 목록 조회 실패' }, { status: 500 });
  }
}

// POST /api/admin/stay-leads - atomically convert one applicant lead into a private draft.
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: '잘못된 요청 본문입니다' }, { status: 400 });
  }
  const action = adminOwnerLeadDraftSchema.safeParse(body);
  if (!action.success) return NextResponse.json({ error: '리드와 매물 정보를 확인해주세요' }, { status: 400 });
  const parsedStay = stayCreateSchema.safeParse(action.data.stay);
  if (!parsedStay.success) {
    const issue = parsedStay.error.issues[0];
    return NextResponse.json({ error: STAY_FIELD_MESSAGES[String(issue?.path?.[0] ?? '')]
      || issue?.message || '매물 정보를 확인해주세요' }, { status: 400 });
  }
  const operatorFields = { ...parsedStay.data };
  delete operatorFields.owner_type;
  const stay = { ...operatorFields, status: parsedStay.data.status ?? 'available',
    is_exclusive: parsedStay.data.is_exclusive ?? false,
    amenities: parsedStay.data.amenities ?? [], appliances: parsedStay.data.appliances ?? [] };
  const { data, error } = await supabaseAdmin.rpc('create_stay_owner_draft', {
    p_lead_id: action.data.lead_id, p_admin_user_id: admin.id, p_stay: stay,
  });
  if (error) {
    if (isWorkflowMigrationMissing(error)) return NextResponse.json(workflowUnavailable(), { status: 503 });
    if (error.message?.includes('ALREADY_CONVERTED')) return NextResponse.json(
      { error: '이미 매물 초안이 생성된 접수입니다', code: 'ALREADY_CONVERTED' }, { status: 409 });
    if (error.message?.includes('LEAD_NOT_FOUND')) return NextResponse.json({ error: '접수를 찾을 수 없습니다' }, { status: 404 });
    return NextResponse.json({ error: '매물 초안 생성 실패' }, { status: 500 });
  }
  return NextResponse.json({ success: true, stay: data }, { status: 201,
    headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } });
}
