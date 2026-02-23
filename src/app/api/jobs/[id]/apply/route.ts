import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// POST /api/jobs/[id]/apply - 이력서로 지원하기
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { id: jobId } = await params;
  const body = await req.json();
  const { resumeId, message } = body;

  // 공고 존재 확인
  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('id, is_active')
    .eq('id', jobId)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ error: '공고를 찾을 수 없습니다' }, { status: 404 });
  }

  // 지원 insert (resume_id 포함)
  const insertData: Record<string, unknown> = {
    job_id: jobId,
    user_id: user.id,
    message: message || null,
    status: 'pending',
  };

  // resume_id가 있으면 추가
  if (resumeId) {
    insertData.resume_id = resumeId;
  }

  const { error } = await supabaseAdmin
    .from('applications')
    .insert(insertData);

  if (error) {
    // 중복 지원
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 지원한 공고입니다', duplicate: true }, { status: 409 });
    }

    // resume_id 컬럼이 없는 경우 → resume_id 빼고 재시도
    if (error.message?.includes('resume_id') || error.code === '42703') {
      console.warn('resume_id column not found, retrying without it');
      const { error: retryError } = await supabaseAdmin
        .from('applications')
        .insert({
          job_id: jobId,
          user_id: user.id,
          message: message || null,
          status: 'pending',
        });

      if (retryError) {
        if (retryError.code === '23505') {
          return NextResponse.json({ error: '이미 지원한 공고입니다', duplicate: true }, { status: 409 });
        }
        console.error('Apply retry error:', retryError);
        return NextResponse.json({ error: `지원 실패: ${retryError.message}` }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    console.error('Apply error:', error);
    return NextResponse.json({ error: `지원 실패: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
