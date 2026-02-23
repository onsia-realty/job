import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// POST /api/jobs/[id]/view - 조회수 증가 (인증 불필요)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseAdmin.rpc('increment_job_views', { job_id: id });

  if (error) {
    // rpc가 없으면 직접 update fallback
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('views')
      .eq('id', id)
      .maybeSingle();

    if (job) {
      await supabaseAdmin
        .from('jobs')
        .update({ views: (job.views || 0) + 1 })
        .eq('id', id);
    }
  }

  return NextResponse.json({ success: true });
}
