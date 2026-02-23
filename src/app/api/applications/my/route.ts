import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/applications/my - 내 지원 내역
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('applications')
    .select(`
      *,
      jobs:job_id (
        id, title, company, region, tier, type, deadline
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my applications:', error);
    return NextResponse.json({ error: '지원 내역을 불러올 수 없습니다' }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
