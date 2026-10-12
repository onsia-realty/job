import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

async function verifyUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET /api/jobs/[id]/applicants - 지원자 목록 가져오기
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { id } = await params;

  // 공고 소유권 확인
  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ error: '권한이 없거나 공고를 찾을 수 없습니다' }, { status: 403 });
  }

  // 지원 목록 조회 (join 없이)
  const { data: apps, error: appsError } = await supabaseAdmin
    .from('applications')
    .select('*')
    .eq('job_id', id)
    .order('created_at', { ascending: false });

  if (appsError) {
    console.error('Error fetching applications:', appsError);
    return NextResponse.json({ error: '지원자 목록을 불러올 수 없습니다' }, { status: 500 });
  }

  if (!apps || apps.length === 0) {
    return NextResponse.json([]);
  }

  // 제출된 이력서만 조회. 지원자가 나중에 만든 다른 비공개 이력서는 공유하지 않는다.
  const resumeIds = [...new Set(apps.map(a => a.resume_id).filter(Boolean))];

  const { data: resumes } = resumeIds.length ? await supabaseAdmin
    .from('resumes')
    .select('id, user_id, name, phone, email, photo, total_experience, preferred_regions, preferred_types, license_number, birth_year, gender, created_at')
    .in('id', resumeIds) : { data: [] };

  // user_id → resume 매핑
  const resumeById = new Map((resumes || []).map(r => [r.id, r]));

  // 지원자 + 이력서 합치기
  const result = apps.map(app => ({
    ...app,
    resume: resumeById.get(app.resume_id)?.user_id === app.user_id
      ? resumeById.get(app.resume_id) : null,
  }));

  return NextResponse.json(result);
}

// PATCH /api/jobs/[id]/applicants - 지원 상태 업데이트
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { id } = await params;
  const { applicationId, status } = await req.json();

  const allowedStatuses = ['pending', 'viewed', 'contacted', 'rejected', 'hired'] as const;
  if (typeof applicationId !== 'string' || !allowedStatuses.includes(status)) {
    return NextResponse.json({ error: 'applicationId와 status가 필요합니다' }, { status: 400 });
  }

  // 공고 소유권 확인
  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ error: '권한이 없거나 공고를 찾을 수 없습니다' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .eq('job_id', id);

  if (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json({ error: '상태 업데이트에 실패했습니다' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
