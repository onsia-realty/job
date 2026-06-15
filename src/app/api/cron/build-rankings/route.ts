import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { buildSlowRankings, RANK_SIDOS, RANK_TYPES, SLOW_METRICS, cacheKey } from '@/lib/market/rankings';

export const maxDuration = 300; // 사전계산은 다소 무거움

// GET /api/cron/build-rankings — 느린 지표(신고가/최근하락/최근상승) 사전계산 → market_rankings 저장
// Vercel Cron(일 1회) 또는 수동 호출. CRON_SECRET 있으면 Bearer 검증.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const started = Date.now();
  const rows: Array<{ cache_key: string; metric: string; sido: string; property_type: string; data: unknown; updated_at: string }> = [];
  const nowIso = new Date().toISOString();
  const errors: string[] = [];

  for (const type of RANK_TYPES) {
    for (const sido of RANK_SIDOS) {
      try {
        const built = await buildSlowRankings(type, sido);
        for (const metric of SLOW_METRICS) {
          rows.push({
            cache_key: cacheKey(metric, sido, type),
            metric, sido, property_type: type,
            data: built[metric], updated_at: nowIso,
          });
        }
      } catch (e) {
        errors.push(`${type}/${sido}: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }
  }

  if (rows.length) {
    const { error } = await supabaseAdmin.from('market_rankings').upsert(rows, { onConflict: 'cache_key' });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    built: rows.length,
    combos: RANK_TYPES.length * RANK_SIDOS.length,
    errors,
    elapsed_ms: Date.now() - started,
  });
}
