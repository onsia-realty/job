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

// GET /api/admin/payments - 결제 내역 + 통계
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
  }

  try {
    // 결제 내역 (최근 100건, 유저/공고 정보 조인)
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select(`
        id,
        user_id,
        job_id,
        tier,
        amount,
        payment_method,
        payment_status,
        start_date,
        end_date,
        created_at,
        users:user_id (name, email),
        jobs:job_id (title, company)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (paymentsError) {
      console.error('Payments query error:', paymentsError);
      return NextResponse.json({ error: '결제 내역 조회 실패' }, { status: 500 });
    }

    // 통계 계산
    const allPayments = payments || [];

    // 전체 완료 매출
    const { data: totalData } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('payment_status', 'completed');

    const totalRevenue = (totalData || []).reduce((sum, p) => sum + (p.amount || 0), 0);

    // 이번달 매출
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const { data: monthData } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('payment_status', 'completed')
      .gte('created_at', firstOfMonth.toISOString());

    const monthRevenue = (monthData || []).reduce((sum, p) => sum + (p.amount || 0), 0);

    // 완료 건수
    const { count: completedCount } = await supabaseAdmin
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'completed');

    // 대기 건수
    const { count: pendingCount } = await supabaseAdmin
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'pending');

    return NextResponse.json({
      payments: allPayments,
      stats: {
        totalRevenue,
        monthRevenue,
        completedCount: completedCount || 0,
        pendingCount: pendingCount || 0,
      },
    });
  } catch (error) {
    console.error('Admin payments error:', error);
    return NextResponse.json({ error: '결제 조회 실패' }, { status: 500 });
  }
}
