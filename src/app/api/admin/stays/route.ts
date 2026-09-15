import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { verifyAdmin } from '@/lib/auth-server';
import { isWorkflowMigrationMissing, workflowUnavailable } from '@/lib/stay/owner-lead';

// 관리자 검증 — api/admin/jobs/route.ts 와 동일 패턴.
// 목록 카드/테이블이 실제로 쓰는 컬럼만. select('*') 는 description/images/agent_* 까지
// 끌고 와 응답이 불필요하게 커진다.
const LIST_COLUMNS = [
  'id',
  'title',
  'stay_type',
  'deal_type',
  'address',
  'region',
  'sigungu',
  'deposit_won',
  'monthly_fee_won',
  'daily_fee_won',
  'weekly_fee_won',
  'owner_type',
  'status',
  'is_active',
  'is_approved',
  'views',
  'source',
  'lead_id',
  'contact_name',
  'phone',
  'created_at',
  'updated_at',
].join(', ');

// GET /api/admin/stays - 전체 단기임대 매물 목록 (승인 여부 무관)
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
  }

  try {
    const { data: stays, error } = await supabaseAdmin
      .from('stays')
      .select(LIST_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rows = (stays || []) as unknown as Record<string, unknown>[];
    const leadIds = rows.map((stay) => stay.lead_id)
      .filter((id): id is number => typeof id === 'number');
    let confirmations = new Map<number, Record<string, unknown>>();
    if (leadIds.length > 0) {
      const { data: leads, error: leadError } = await supabaseAdmin.from('stay_owner_leads')
        .select('id,draft_confirmed_at,draft_confirmed_stay_updated_at').in('id', leadIds);
      if (leadError) throw leadError;
      confirmations = new Map((leads ?? []).map((lead) => [lead.id as number, lead as Record<string, unknown>]));
    }
    return NextResponse.json(rows.map((stay) => {
      const lead = typeof stay.lead_id === 'number' ? confirmations.get(stay.lead_id) : undefined;
      return { ...stay, host_confirmed_at: lead?.draft_confirmed_at ?? null,
        host_confirmation_current: stay.source !== 'owner_lead' || stay.is_approved === true
          || (!!lead?.draft_confirmed_stay_updated_at
            && lead.draft_confirmed_stay_updated_at === stay.updated_at) };
    }), { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } });
  } catch (error) {
    if (isWorkflowMigrationMissing(error)) {
      return NextResponse.json(workflowUnavailable(), { status: 503 });
    }
    return NextResponse.json({ error: '매물 목록 조회 실패' }, { status: 500 });
  }
}
