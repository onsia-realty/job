import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Vercel Cron: 매시간 실행 → 만료된 공고 is_active = false 처리
// vercel.json의 crons 설정 필요

export async function GET(request: NextRequest) {
  // Vercel Cron 인증 (CRON_SECRET 환경변수)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();
  let expiredFreeCount = 0;
  let expiredPaidCount = 0;

  // 1. 무료(normal) 공고: 등록 후 24시간 경과 → 비활성화
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: expiredFree, error: freeError } = await supabaseAdmin
    .from('jobs')
    .update({ is_active: false })
    .eq('is_active', true)
    .or('tier.eq.normal,tier.is.null')
    .lt('created_at', twentyFourHoursAgo)
    .select('id');

  if (freeError) {
    console.error('Failed to expire free jobs:', freeError);
  } else {
    expiredFreeCount = expiredFree?.length || 0;
  }

  // 2. 유료 공고: deadline 지난 것 → 비활성화
  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: expiredPaid, error: paidError } = await supabaseAdmin
    .from('jobs')
    .update({ is_active: false })
    .eq('is_active', true)
    .not('tier', 'eq', 'normal')
    .not('tier', 'is', null)
    .not('deadline', 'is', null)
    .lt('deadline', todayKST)
    .select('id');

  if (paidError) {
    console.error('Failed to expire paid jobs:', paidError);
  } else {
    expiredPaidCount = expiredPaid?.length || 0;
  }

  const total = expiredFreeCount + expiredPaidCount;
  console.log(`[Cron] Expired jobs: ${expiredFreeCount} free + ${expiredPaidCount} paid = ${total} total`);

  return NextResponse.json({
    success: true,
    expired: {
      free: expiredFreeCount,
      paid: expiredPaidCount,
      total,
    },
    timestamp: now,
  });
}
