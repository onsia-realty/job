import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { recomputeJobAd, FREE_EXPOSURE_MS } from '@/lib/ad-entitlement';

// Vercel Cron: 매시간 실행 (vercel.json 의 crons 설정 필요)
// 1) 유료 광고 창이 끝난 공고 → 결제 기록으로 등급 재계산 (하위 등급으로 이어지거나 일반으로 내려감. 비활성화하지 않음)
//    + 환불로 생긴 공백 뒤에 대기 중인 창이 있는 일반 공고도 재계산
// 2) 무료(일반) 공고: coalesce(ad_expires_at, created_at) + 24h 경과 → 비활성화
// 3) 모집 마감일(deadline) 지난 공고 → 비활성화 (등급 무관)
// 전제: migration 046 (jobs.ad_expires_at)

const RECOMPUTE_BATCH = 500;

export async function GET(request: NextRequest) {
  // Vercel Cron 인증 (CRON_SECRET 환경변수)
  const authHeader = request.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const nowDate = new Date();
  const now = nowDate.toISOString();
  let recomputedCount = 0;
  let recomputeFailed = 0;
  let expiredFreeCount = 0;
  let expiredDeadlineCount = 0;

  // 1. 광고 창 종료 / 대기 창 시작 → 등급 재계산
  const { data: lapsed, error: lapsedError } = await supabaseAdmin
    .from('jobs')
    .select('id, category')
    // 타임스탬프의 ':' '.' 는 PostgREST 논리 필터 예약 문자라 큰따옴표로 감싼다
    .or(`and(tier.neq.normal,ad_expires_at.lte."${now}"),and(tier.eq.normal,ad_expires_at.gt."${now}")`)
    .limit(RECOMPUTE_BATCH);

  if (lapsedError) {
    console.error('[Cron] 광고 만료 공고 조회 실패 — migration 046(jobs.ad_expires_at) 적용 여부를 확인하세요:', lapsedError);
  } else {
    for (const job of lapsed ?? []) {
      try {
        await recomputeJobAd(supabaseAdmin, job.id, nowDate, { category: job.category });
        recomputedCount++;
      } catch (e) {
        recomputeFailed++;
        console.error(`[Cron] 공고 ${job.id} 등급 재계산 실패:`, e);
      }
    }
  }

  // 2. 무료(일반) 공고: 등록(또는 유료 광고 종료) 후 24시간 경과 → 비활성화
  const freeCutoff = new Date(nowDate.getTime() - FREE_EXPOSURE_MS).toISOString();

  const { data: expiredFree, error: freeError } = await supabaseAdmin
    .from('jobs')
    .update({ is_active: false })
    .eq('is_active', true)
    .eq('tier', 'normal')
    .or(`and(ad_expires_at.is.null,created_at.lt."${freeCutoff}"),ad_expires_at.lt."${freeCutoff}"`)
    .select('id');

  if (freeError) {
    console.error('[Cron] 무료 공고 만료 처리 실패 — migration 046(jobs.ad_expires_at) 적용 여부를 확인하세요:', freeError);
  } else {
    expiredFreeCount = expiredFree?.length || 0;
  }

  // 3. 모집 마감일 지난 공고 → 비활성화 (등급 무관)
  const todayKST = new Date(nowDate.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: expiredDeadline, error: deadlineError } = await supabaseAdmin
    .from('jobs')
    .update({ is_active: false })
    .eq('is_active', true)
    .not('deadline', 'is', null)
    .lt('deadline', todayKST)
    .select('id');

  if (deadlineError) {
    console.error('[Cron] 마감일 지난 공고 처리 실패:', deadlineError);
  } else {
    expiredDeadlineCount = expiredDeadline?.length || 0;
  }

  const total = expiredFreeCount + expiredDeadlineCount;
  console.log(
    `[Cron] 등급 재계산 ${recomputedCount}건(실패 ${recomputeFailed}) / 비활성화: 무료 ${expiredFreeCount} + 마감 ${expiredDeadlineCount} = ${total}`,
  );

  return NextResponse.json({
    success: true,
    recomputed: recomputedCount,
    recomputeFailed,
    expired: {
      free: expiredFreeCount,
      deadline: expiredDeadlineCount,
      total,
    },
    timestamp: now,
  });
}
