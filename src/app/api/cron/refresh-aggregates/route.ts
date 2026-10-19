import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const maxDuration = 300;

/**
 * GET/POST /api/cron/refresh-aggregates
 * 033의 매매·전세 통합 갱신 RPC. 스케줄은 수집/좌표 작업 이후 06:00 KST.
 * 운영에서 033/048 적용 및 service_role의 MV 갱신 권한을 확인해야 한다.
 */
async function refreshAggregates(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { error } = await supabaseAdmin.rpc('refresh_market_aggregates');
    if (error) {
      console.error('[refresh-aggregates] RPC failed:', error);
      return NextResponse.json({ error: '집계 갱신에 실패했습니다.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[refresh-aggregates] Unexpected error:', error);
    return NextResponse.json({ error: '집계 갱신에 실패했습니다.' }, { status: 500 });
  }
}

export const GET = refreshAggregates;
export const POST = refreshAggregates;
