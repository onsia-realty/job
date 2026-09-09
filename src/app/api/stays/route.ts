import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { verifyUser, isVerifiedBusinessUser } from '@/lib/auth-server';
import { stayCreateSchema, STAY_FIELD_MESSAGES } from '@/lib/validations/stay';
import { buildAgentSnapshot } from '@/lib/stay/agent-snapshot';
import {
  STAY_TYPES,
  STAY_DEAL_TYPES,
  STAY_AMENITIES,
  STAY_SORT_OPTIONS,
  STAY_LIST_DEFAULT_LIMIT,
  STAY_LIST_MAX_LIMIT,
  STAY_IN_FILTER_MAX_VALUES,
  type StayAmenity,
  type StaySortOption,
} from '@/lib/stay/constants';

// POST /api/stays - 단기임대 매물 등록
export async function POST(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다' }, { status: 400 });
  }

  // 입력 검증 (화이트리스트 strip — passthrough 없음)
  const parsed = stayCreateSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = String(issue?.path?.[0] ?? '');
    const message = STAY_FIELD_MESSAGES[field] || issue?.message || '입력 내용을 확인해주세요';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // 서버 강제 필드: 스키마가 이미 strip 하지만, 방어적으로 한 번 더 제거한다.
  // (job.ts 라우트 39줄 관행 동일)
  const {
    user_id: _u,
    views: _v,
    is_active: _ac,
    is_approved: _a,
    source: _s,
    lead_id: _l,
    // 038 법정표기 스냅샷 — 스키마 화이트리스트에 없어 이미 strip 되지만 방어 2중
    agent_office_name: _an,
    agent_office_address: _aa,
    agent_phone: _ap,
    agent_reg_no: _ar,
    agent_representative: _av,
    broker_office_id: _bo,
    agent_snapshot_at: _as,
    ...safeBody
  } = parsed.data as Record<string, unknown>;

  // 승인 정책: 클라이언트 값을 신뢰하지 않고 서버에서 인증 여부를 재확인한다.
  // (sales/jobs/new/page.tsx:121-125 의 brokerVerified || businessVerified 게이트를 서버 재현)
  const verified = await isVerifiedBusinessUser(user);

  // 038 중개사 법정표기 스냅샷 — 서버가 users/broker_offices 에서 채운다 (038:46-49).
  // owner(임대인 직접등록)면 클라이언트가 뭘 보냈든 7개 전부 명시적으로 null.
  const agentSnapshot =
    parsed.data.owner_type === 'agent'
      ? await buildAgentSnapshot(user.id)
      : null;

  const stayData = {
    ...safeBody,
    status: parsed.data.status ?? 'available',
    is_exclusive: parsed.data.is_exclusive ?? false,
    // ---- 서버 강제 값은 반드시 마지막에 스프레드 (클라이언트 값 덮어쓰기) ----
    user_id: user.id,
    views: 0,
    is_active: true,
    is_approved: verified,  // 미인증이면 false → 관리자 승인 대기
    source: 'self',
    lead_id: null,
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
    .insert(stayData)
    .select()
    .maybeSingle();

  if (error) {
    // 원본 DB 에러는 서버 로그에만 (정보 노출 방지)
    console.error('Stay insert error:', error);
    return NextResponse.json(
      { error: '매물 등록에 실패했습니다. 입력 내용을 확인 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

// ---- GET 헬퍼 ----

function parseIntParam(raw: string | null): number | null {
  if (raw == null || raw.trim() === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
  return n;
}

function parseEnumParam<T extends readonly string[]>(
  raw: string | null,
  allowed: T
): T[number] | null {
  if (!raw) return null;
  return (allowed as readonly string[]).includes(raw) ? (raw as T[number]) : null;
}

// GET /api/stays - 공개 목록 (인증 불필요)
// 기본 조건: is_active = true AND is_approved = true
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const limitRaw = parseIntParam(sp.get('limit'));
  // PostgREST 기본 1000행 캡을 넘지 않도록 항상 명시적 limit 을 건다.
  const limit = Math.min(limitRaw && limitRaw > 0 ? limitRaw : STAY_LIST_DEFAULT_LIMIT, STAY_LIST_MAX_LIMIT);
  const offset = parseIntParam(sp.get('offset')) ?? 0;

  let query = supabaseAdmin
    .from('stays')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .eq('is_approved', true);

  // 분류 필터
  const dealType = parseEnumParam(sp.get('deal_type'), STAY_DEAL_TYPES);
  if (dealType) query = query.eq('deal_type', dealType);

  const stayType = parseEnumParam(sp.get('stay_type'), STAY_TYPES);
  if (stayType) query = query.eq('stay_type', stayType);

  // 지역 필터
  const region = sp.get('region')?.trim();
  if (region) query = query.eq('region', region.slice(0, 50));

  const sigungu = sp.get('sigungu')?.trim();
  if (sigungu) query = query.eq('sigungu', sigungu.slice(0, 50));

  const lawdCd = sp.get('lawd_cd')?.trim();
  if (lawdCd && /^\d{5}$/.test(lawdCd)) query = query.eq('lawd_cd', lawdCd);

  // 요금 범위 (원 단위)
  const minDaily = parseIntParam(sp.get('min_daily_fee_won'));
  if (minDaily != null) query = query.gte('daily_fee_won', minDaily);
  const maxDaily = parseIntParam(sp.get('max_daily_fee_won'));
  if (maxDaily != null) query = query.lte('daily_fee_won', maxDaily);

  const minMonthly = parseIntParam(sp.get('min_monthly_fee_won'));
  if (minMonthly != null) query = query.gte('monthly_fee_won', minMonthly);
  const maxMonthly = parseIntParam(sp.get('max_monthly_fee_won'));
  if (maxMonthly != null) query = query.lte('monthly_fee_won', maxMonthly);

  // 최소 숙박일: "N일 머물 수 있는 매물" → min_stay_days <= N
  const minStayDays = parseIntParam(sp.get('min_stay_days'));
  if (minStayDays != null) query = query.lte('min_stay_days', minStayDays);

  // 어메니티: 전부 포함(AND). GIN 인덱스(035:129) 대상 @> 연산.
  // ⚠️ .in() 은 값이 많으면 URL 한도를 넘기므로 여기서는 contains 를 쓰고,
  //    화이트리스트 + 개수 상한(STAY_IN_FILTER_MAX_VALUES)으로 길이를 제한한다.
  const amenitiesRaw = sp.getAll('amenities').flatMap((v) => v.split(','));
  const amenities = Array.from(
    new Set(
      amenitiesRaw
        .map((v) => v.trim())
        .filter((v): v is StayAmenity => (STAY_AMENITIES as readonly string[]).includes(v))
    )
  ).slice(0, STAY_IN_FILTER_MAX_VALUES);
  if (amenities.length > 0) query = query.contains('amenities', amenities);

  // 정렬
  const sort = (parseEnumParam(sp.get('sort'), STAY_SORT_OPTIONS) ?? 'latest') as StaySortOption;
  switch (sort) {
    case 'views':
      query = query.order('views', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'daily_fee_asc':
      query = query.order('daily_fee_won', { ascending: true, nullsFirst: false });
      break;
    case 'daily_fee_desc':
      query = query.order('daily_fee_won', { ascending: false, nullsFirst: false });
      break;
    case 'monthly_fee_asc':
      query = query.order('monthly_fee_won', { ascending: true, nullsFirst: false });
      break;
    case 'monthly_fee_desc':
      query = query.order('monthly_fee_won', { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('Stay list error:', error);
    return NextResponse.json({ error: '매물 목록을 불러올 수 없습니다' }, { status: 500 });
  }

  return NextResponse.json({
    items: data ?? [],
    total: count ?? null,
    limit,
    offset,
  });
}
