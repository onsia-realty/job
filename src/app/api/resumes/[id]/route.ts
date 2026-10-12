import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

async function verifyUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET /api/resumes/[id] - 이력서 조회 (인증된 사용자만)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('resumes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Resume fetch error:', error);
    return NextResponse.json({ error: '이력서를 불러올 수 없습니다' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: '이력서를 찾을 수 없습니다' }, { status: 404 });
  }

  if (data.user_id !== user.id && data.is_public !== true) {
    // 비공개 이력서는 실제 지원한 공고의 소유자에게만 공유한다.
    // 잘못 연결된 과거 지원서도 권한을 부여하지 않도록 지원자 ID를 함께 확인한다.
    const { data: applications, error: accessError } = await supabaseAdmin
      .from('applications')
      .select('id, jobs!inner(user_id)')
      .eq('resume_id', id)
      .eq('user_id', data.user_id)
      .eq('jobs.user_id', user.id)
      .limit(1);
    if (accessError || !applications?.length) {
      return NextResponse.json({ error: '이력서를 찾을 수 없습니다' }, { status: 404 });
    }
  }

  return NextResponse.json(data);
}
