import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

/**
 * POST /api/cron/refresh-aggregates
 * Materialized View `complex_aggregates` 새로고침
 * sync-transactions cron 직후 호출
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    // Supabase RPC로 REFRESH 호출 (Supabase는 기본적으로 SQL exec 제한)
    // → admin이 PostgreSQL raw query 위해 rpc 함수 별도 작성 필요
    // 우선은 "호출됨" 로그만 남기고 Dashboard에서 수동 REFRESH 하도록 안내
    // Day 1 완료 후 rpc 함수 추가 (023_refresh_aggregates.sql 등)

    return NextResponse.json({
      ok: true,
      message: 'REFRESH MATERIALIZED VIEW CONCURRENTLY complex_aggregates를 Supabase SQL Editor에서 수동 실행하세요.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
