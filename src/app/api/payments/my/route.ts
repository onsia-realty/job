import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { effectiveJobTier } from '@/lib/ad-entitlement';

interface MyJobAdInfo {
  tier: string;               // 현재 유효 등급 (광고 창이 끝났으면 normal)
  expires_at: string | null;  // = ad_expires_at (기존 소비자 호환 키)
  ad_expires_at: string | null;
  paid_at: string | null;     // 이 공고의 가장 최근 완료 결제 시각
}

// GET /api/payments/my - 내 공고별 현재 광고 상태 { [jobId]: MyJobAdInfo }
// 등급/만료일의 출처는 jobs.tier / jobs.ad_expires_at (서버가 결제로 계산, migration 046)
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from('jobs')
    .select('id, tier, ad_expires_at')
    .eq('user_id', user.id);

  if (jobsError) {
    console.error('내 공고 광고 상태 조회 실패 — migration 046(jobs.ad_expires_at) 적용 여부를 확인하세요:', jobsError);
    return NextResponse.json({ error: '결제 내역을 불러올 수 없습니다' }, { status: 500 });
  }

  const { data: payments, error } = await supabaseAdmin
    .from('payments')
    .select('job_id, paid_at')
    .eq('user_id', user.id)
    .eq('payment_status', 'completed')
    .not('job_id', 'is', null);

  if (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: '결제 내역을 불러올 수 없습니다' }, { status: 500 });
  }

  const lastPaid: Record<string, string> = {};
  for (const p of payments || []) {
    if (!p.job_id || !p.paid_at) continue;
    if (!lastPaid[p.job_id] || new Date(p.paid_at) > new Date(lastPaid[p.job_id])) lastPaid[p.job_id] = p.paid_at;
  }

  const now = new Date();
  const result: Record<string, MyJobAdInfo> = {};
  for (const job of jobs || []) {
    const adExpiresAt = (job.ad_expires_at as string | null) ?? null;
    result[job.id] = {
      tier: effectiveJobTier(job, now),
      expires_at: adExpiresAt,
      ad_expires_at: adExpiresAt,
      paid_at: lastPaid[job.id] ?? null,
    };
  }

  return NextResponse.json(result);
}
