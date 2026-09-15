import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-server';
import {
  OWNER_LEAD_DETAIL_VERSION,
  OWNER_LEAD_DRAFT_SELECT,
  PUBLICATION_CONSENT_VERSION,
  isWorkflowMigrationMissing,
  ownerLeadConfirmSchema,
  ownerLeadCreateSchema,
  ownerLeadDetail,
  workflowUnavailable,
} from '@/lib/stay/owner-lead';

const LEAD_COLUMNS = [
  'id', 'name', 'phone', 'address', 'building_name', 'unit_count', 'memo',
  'privacy_agreed', 'marketing_agreed', 'publication_agreed', 'source_code', 'status',
  'converted_stay_id', 'detail', 'detail_version', 'draft_confirmed_at',
  'draft_confirmed_stay_updated_at', 'created_at', 'updated_at',
].join(', ');

function rpcFailure(error: unknown) {
  if (isWorkflowMigrationMissing(error)) return NextResponse.json(workflowUnavailable(), { status: 503 });
  const message = (error as { message?: string } | null)?.message ?? '';
  if (message.includes('RATE_LIMITED')) return NextResponse.json({ error: '하루 접수 한도를 초과했습니다', code: 'RATE_LIMITED' }, { status: 429 });
  if (message.includes('DRAFT_CHANGED')) return NextResponse.json({ error: '운영자가 매물 내용을 변경했습니다. 다시 확인해주세요', code: 'DRAFT_CHANGED' }, { status: 409 });
  if (message.includes('DRAFT_NOT_FOUND')) return NextResponse.json({ error: '확인할 매물을 찾을 수 없습니다' }, { status: 404 });
  return NextResponse.json({ error: '요청을 처리하지 못했습니다' }, { status: 500 });
}

function presentLead(lead: Record<string, unknown>, draft: Record<string, unknown> | null,
  latestReview: Record<string, unknown> | null = null) {
  const detail = ownerLeadDetail(lead.detail);
  const confirmedAt = typeof lead.draft_confirmed_at === 'string' ? lead.draft_confirmed_at : null;
  const confirmedVersion = typeof lead.draft_confirmed_stay_updated_at === 'string' ? lead.draft_confirmed_stay_updated_at : null;
  const currentVersion = typeof draft?.updated_at === 'string' ? draft.updated_at : null;
  return {
    id: lead.id, status: lead.status, name: lead.name, phone: lead.phone,
    address: lead.address, building_name: lead.building_name, unit_count: lead.unit_count,
    memo: lead.memo, privacy_agreed: lead.privacy_agreed,
    publication_agreed: lead.publication_agreed, marketing_agreed: lead.marketing_agreed,
    source_code: lead.source_code, converted_stay_id: lead.converted_stay_id,
    created_at: lead.created_at, updated_at: lead.updated_at,
    stay_type: detail?.stay_type ?? null,
    desired_deposit_won: detail?.desired_deposit_won ?? null,
    desired_weekly_fee_won: detail?.desired_weekly_fee_won ?? null,
    detail_address: detail?.detail_address ?? null,
    draft,
    latest_review: latestReview,
    confirmation: confirmedAt && confirmedVersion ? {
      confirmed_at: confirmedAt, stay_updated_at: confirmedVersion,
      is_current: draft?.is_approved === true || confirmedVersion === currentVersion,
    } : null,
  };
}

async function draftsById(leads: Record<string, unknown>[]) {
  const ids = leads.map((lead) => lead.converted_stay_id).filter((id): id is string => typeof id === 'string');
  if (ids.length === 0) return new Map<string, Record<string, unknown>>();
  const { data, error } = await supabaseAdmin.from('stays').select(OWNER_LEAD_DRAFT_SELECT).in('id', ids);
  if (error) throw error;
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  return new Map(rows.map((stay) => [stay.id as string, stay]));
}

async function reviewsByStayId(leads: Record<string, unknown>[]) {
  const ids = leads.map((lead) => lead.converted_stay_id).filter((id): id is string => typeof id === 'string');
  if (ids.length === 0) return new Map<string, Record<string, unknown>>();
  const { data, error } = await supabaseAdmin.from('stay_workflow_audit')
    .select('stay_id,note,created_at').in('stay_id', ids).eq('action', 'admin_review')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const reviews = new Map<string, Record<string, unknown>>();
  for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
    if (typeof row.stay_id === 'string' && !reviews.has(row.stay_id)) {
      reviews.set(row.stay_id, { note: row.note ?? null, created_at: row.created_at });
    }
  }
  return reviews;
}

export async function GET(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  try {
    const { data, error } = await supabaseAdmin.from('stay_owner_leads').select(LEAD_COLUMNS)
      .eq('applicant_user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    const leads = (data ?? []) as unknown as Record<string, unknown>[];
    const drafts = await draftsById(leads);
    const reviews = await reviewsByStayId(leads);
    return NextResponse.json({ leads: leads.map((lead) => presentLead(lead,
      typeof lead.converted_stay_id === 'string' ? drafts.get(lead.converted_stay_id) ?? null : null,
      typeof lead.converted_stay_id === 'string' ? reviews.get(lead.converted_stay_id) ?? null : null
    )) }, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } });
  } catch (error) {
    if (isWorkflowMigrationMissing(error)) return NextResponse.json(workflowUnavailable(), { status: 503 });
    return NextResponse.json({ error: '접수 내역을 불러오지 못했습니다' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '잘못된 요청 형식입니다' }, { status: 400 }); }
  const parsed = ownerLeadCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? '입력 내용을 확인해주세요' }, { status: 400 });
  const input = parsed.data;
  const { data, error } = await supabaseAdmin.rpc('create_stay_owner_lead', {
    p_applicant_user_id: user.id,
    p_input: {
      name: input.name, phone: input.phone, address: input.address,
      building_name: input.building_name ?? null, unit_count: input.unit_count ?? null,
      memo: input.memo ?? null, source_code: input.source_code ?? null,
      privacy_agreed: true, publication_agreed: true, marketing_agreed: input.marketing_agreed,
      detail: { stay_type: input.stay_type ?? null, desired_deposit_won: input.desired_deposit_won ?? null,
        desired_weekly_fee_won: input.desired_weekly_fee_won ?? null,
        detail_address: input.detail_address ?? null },
      detail_version: OWNER_LEAD_DETAIL_VERSION,
      publication_consent_version: PUBLICATION_CONSENT_VERSION,
    },
  });
  if (error) return rpcFailure(error);
  return NextResponse.json({ lead: presentLead(data as Record<string, unknown>, null) }, {
    status: 201, headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' },
  });
}

export async function PATCH(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '잘못된 요청 형식입니다' }, { status: 400 }); }
  const parsed = ownerLeadConfirmSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: '확인할 매물 버전을 확인해주세요' }, { status: 400 });
  const { data, error } = await supabaseAdmin.rpc('confirm_stay_owner_draft', {
    p_lead_id: parsed.data.id, p_applicant_user_id: user.id,
    p_expected_stay_updated_at: parsed.data.stay_updated_at,
  });
  if (error) return rpcFailure(error);
  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } });
}
