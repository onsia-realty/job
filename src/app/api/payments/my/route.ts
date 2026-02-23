import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/payments/my - 내 결제 내역 (job별 최신 유료 결제 만료일)
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  // 유저의 결제 내역 중 job_id가 있고, 만료되지 않은 것 조회
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('job_id, tier, expires_at, paid_at, payment_status')
    .eq('user_id', user.id)
    .eq('payment_status', 'completed')
    .not('job_id', 'is', null)
    .order('paid_at', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: '결제 내역을 불러올 수 없습니다' }, { status: 500 });
  }

  // job별 최신 결제만 반환 (가장 나중에 만료되는 것)
  const jobPayments: Record<string, { tier: string; expires_at: string; paid_at: string }> = {};
  for (const p of data || []) {
    if (!p.job_id) continue;
    if (!jobPayments[p.job_id] || new Date(p.expires_at) > new Date(jobPayments[p.job_id].expires_at)) {
      jobPayments[p.job_id] = {
        tier: p.tier,
        expires_at: p.expires_at,
        paid_at: p.paid_at,
      };
    }
  }

  return NextResponse.json(jobPayments);
}
