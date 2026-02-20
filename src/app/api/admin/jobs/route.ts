import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!dbUser || dbUser.user_type !== 'admin') return null;
  return user;
}

// GET /api/admin/jobs - 전체 공고 목록 (승인 여부 무관)
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
  }

  try {
    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 각 공고의 지원자 수 조회
    const jobIds = (jobs || []).map(j => j.id);
    let applicationCounts: Record<string, number> = {};

    if (jobIds.length > 0) {
      const { data: apps } = await supabaseAdmin
        .from('applications')
        .select('job_id')
        .in('job_id', jobIds);

      if (apps) {
        apps.forEach(app => {
          applicationCounts[app.job_id] = (applicationCounts[app.job_id] || 0) + 1;
        });
      }
    }

    const jobsWithCounts = (jobs || []).map(job => ({
      ...job,
      application_count: applicationCounts[job.id] || 0,
    }));

    return NextResponse.json(jobsWithCounts);
  } catch (error) {
    console.error('Admin jobs error:', error);
    return NextResponse.json({ error: '공고 목록 조회 실패' }, { status: 500 });
  }
}
