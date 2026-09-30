import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { effectiveJobTier } from '@/lib/ad-entitlement';

// GET /api/jobs/mine?category=sales|agent — 내 공고 + 광고 상태
// windows = 아직 끝나지 않은 완료 결제의 광고 창 (연장/업그레이드 미리보기 계산용)
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });

  const category = req.nextUrl.searchParams.get('category');
  if (category && category !== 'sales' && category !== 'agent') {
    return NextResponse.json({ error: '잘못된 구분입니다' }, { status: 400 });
  }

  let query = supabaseAdmin
    .from('jobs')
    .select('id, title, company, region, category, tier, ad_expires_at, deadline, is_active, is_approved, views, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);

  const { data: jobs, error } = await query;
  if (error) {
    console.error('내 공고 조회 실패 — migration 046(jobs.ad_expires_at) 적용 여부를 확인하세요:', error);
    return NextResponse.json({ error: '공고를 불러올 수 없습니다' }, { status: 500 });
  }

  const now = new Date();
  const ids = (jobs ?? []).map((j) => j.id as string);
  const windowsByJob: Record<string, { tier: string; starts_at: string | null; expires_at: string }[]> = {};

  if (ids.length > 0) {
    const { data: payments, error: payError } = await supabaseAdmin
      .from('payments')
      .select('job_id, tier, starts_at, paid_at, expires_at')
      .in('job_id', ids)
      .eq('user_id', user.id)
      .eq('payment_status', 'completed')
      .gt('expires_at', now.toISOString());
    if (payError) {
      console.error('내 공고 광고 창 조회 실패 — migration 046(payments.starts_at) 적용 여부를 확인하세요:', payError);
      return NextResponse.json({ error: '공고를 불러올 수 없습니다' }, { status: 500 });
    }
    for (const p of payments ?? []) {
      if (!p.job_id || !p.expires_at) continue;
      (windowsByJob[p.job_id] ??= []).push({
        tier: p.tier,
        starts_at: p.starts_at ?? p.paid_at ?? null,
        expires_at: p.expires_at,
      });
    }
  }

  return NextResponse.json({
    jobs: (jobs ?? []).map((j) => ({
      ...j,
      tier: effectiveJobTier(j, now),
      windows: windowsByJob[j.id] ?? [],
    })),
  });
}
