import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// POST /api/stays/[id]/view - 조회수 증가 (인증 불필요)
// 037_stays_rpc_storage.sql 의 increment_stay_views(stay_id uuid) RPC 사용.
// RPC 미적용 환경을 위해 jobs 라우트와 동일한 SELECT + UPDATE fallback 을 남긴다.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseAdmin.rpc('increment_stay_views', { stay_id: id });

  if (error) {
    // rpc가 없으면 직접 update fallback
    const { data: stay } = await supabaseAdmin
      .from('stays')
      .select('views')
      .eq('id', id)
      .eq('is_active', true)
      .eq('is_approved', true)
      .maybeSingle();

    if (stay) {
      await supabaseAdmin
        .from('stays')
        .update({ views: (stay.views || 0) + 1 })
        .eq('id', id)
        .eq('is_active', true)
        .eq('is_approved', true);
    }
  }

  return NextResponse.json({ success: true });
}
