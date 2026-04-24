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
    .maybeSingle();

  if (!dbUser || dbUser.user_type !== 'admin') return null;
  return user;
}

// GET /api/admin - 대시보드 통계
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
  }

  try {
    // 전체 회원 수
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    // 이번 달 신규 가입자
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);
    const { count: newUsersThisMonth } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstOfMonth.toISOString());

    // 활성 공고 수
    const { count: activeJobs } = await supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_approved', true);

    // 전체 공고 수
    const { count: totalJobs } = await supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact', head: true });

    // 승인 대기 공고 수
    const { count: pendingJobs } = await supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', false)
      .eq('is_active', true);

    // 전체 지원 수
    const { count: totalApplications } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true });

    // 최근 활동 (최근 가입, 최근 공고, 최근 지원)
    const { data: recentUsers } = await supabaseAdmin
      .from('users')
      .select('id, name, email, user_type, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: recentJobs } = await supabaseAdmin
      .from('jobs')
      .select('id, title, company, is_approved, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // 일별 추이 (최근 30일) — JS 집계
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const since = thirtyDaysAgo.toISOString();

    const [recentUserRows, recentJobRows, recentPaymentRows] = await Promise.all([
      supabaseAdmin.from('users').select('created_at').gte('created_at', since),
      supabaseAdmin.from('jobs').select('created_at').gte('created_at', since),
      supabaseAdmin
        .from('payments')
        .select('paid_at, amount')
        .eq('payment_status', 'completed')
        .gte('paid_at', since),
    ]);

    // 30일치 빈 슬롯 만들기 (오늘 포함)
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const dailyMap = new Map<string, { date: string; signups: number; jobs: number; revenue: number; paymentCount: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = dayKey(d);
      dailyMap.set(key, { date: key, signups: 0, jobs: 0, revenue: 0, paymentCount: 0 });
    }

    (recentUserRows.data || []).forEach((row: { created_at: string | null }) => {
      if (!row.created_at) return;
      const key = dayKey(new Date(row.created_at));
      const slot = dailyMap.get(key);
      if (slot) slot.signups += 1;
    });
    (recentJobRows.data || []).forEach((row: { created_at: string | null }) => {
      if (!row.created_at) return;
      const key = dayKey(new Date(row.created_at));
      const slot = dailyMap.get(key);
      if (slot) slot.jobs += 1;
    });
    (recentPaymentRows.data || []).forEach((row: { paid_at: string | null; amount: number | null }) => {
      if (!row.paid_at) return;
      const key = dayKey(new Date(row.paid_at));
      const slot = dailyMap.get(key);
      if (slot) {
        slot.revenue += row.amount || 0;
        slot.paymentCount += 1;
      }
    });

    const daily = Array.from(dailyMap.values());

    // 이번 달 매출 / 결제 건수
    const monthlyRevenue = (recentPaymentRows.data || [])
      .filter((p: { paid_at: string | null }) => p.paid_at && new Date(p.paid_at) >= firstOfMonth)
      .reduce((sum: number, p: { amount: number | null }) => sum + (p.amount || 0), 0);
    const monthlyPaymentCount = (recentPaymentRows.data || [])
      .filter((p: { paid_at: string | null }) => p.paid_at && new Date(p.paid_at) >= firstOfMonth).length;

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
      activeJobs: activeJobs || 0,
      totalJobs: totalJobs || 0,
      pendingJobs: pendingJobs || 0,
      totalApplications: totalApplications || 0,
      monthlyRevenue,
      monthlyPaymentCount,
      recentUsers: recentUsers || [],
      recentJobs: recentJobs || [],
      daily,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: '통계 조회 실패' }, { status: 500 });
  }
}
