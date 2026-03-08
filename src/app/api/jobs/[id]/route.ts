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

// GET /api/jobs/[id] - 공고 조회
// 인증 있으면: 내 공고만 (수정 페이지용, ?mine=true)
// 인증 없으면: 공개 공고 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isMine = req.nextUrl.searchParams.get('mine') === 'true';

  if (isMine) {
    // 수정 페이지용: 인증 + 소유권 확인
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

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

  // 공개 조회: 인증 불필요 (공고 상세 페이지용)
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Job fetch error:', error);
    return NextResponse.json({ error: '공고를 불러올 수 없습니다' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: '공고를 찾을 수 없습니다' }, { status: 404 });
  }

  // 만료 체크: 비활성화된 공고 또는 만료된 공고
  if (!data.is_active) {
    return NextResponse.json({ error: '마감된 공고입니다', expired: true }, { status: 410 });
  }

  // 무료 공고 24시간 만료 체크
  if ((data.tier === 'normal' || !data.tier)) {
    const createdAt = new Date(data.created_at);
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
    if (new Date() > expiresAt) {
      return NextResponse.json({ error: '마감된 공고입니다 (무료 공고는 24시간 노출)', expired: true }, { status: 410 });
    }
  }

  // 유료 공고 deadline 만료 체크
  if (data.deadline && data.tier && data.tier !== 'normal') {
    const deadline = new Date(data.deadline + 'T23:59:59+09:00');
    if (new Date() > deadline) {
      return NextResponse.json({ error: '마감된 공고입니다', expired: true }, { status: 410 });
    }
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

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다' }, { status: 400 });
  }

  // 허용된 필드만 업데이트 (tier, is_approved, user_id, views 등 보호)
  const ALLOWED_FIELDS = [
    'title', 'description', 'html_content', 'type', 'category',
    'company', 'region', 'region_detail', 'address',
    'salary_type', 'salary_amount', 'work_days', 'work_start', 'work_end',
    'deadline', 'contact_name', 'contact_phone', 'contact_email',
    'requirements', 'benefits', 'is_active', 'is_always_recruiting',
    'preferred', 'position',
  ];
  const sanitized: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) sanitized[key] = body[key];
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: '수정할 내용이 없습니다' }, { status: 400 });
  }

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
    .update(sanitized)
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
