import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { fetchBuildingTitle } from '@/lib/market/buildingLedger';

export const maxDuration = 300;

/**
 * GET/POST /api/cron/sync-building-ledgers
 * complexes.pnu가 있는데 building_ledgers에 없는 단지를 N개씩 백필.
 * Authorization: Bearer ${CRON_SECRET}
 * ?limit=80 (기본), ?force=true 시 기존 행도 갱신
 *
 * 단지 1개당 ~1~2초. limit=80이면 약 2~3분.
 */
const DEFAULT_LIMIT = 80;
const CONCURRENCY = 4;

async function runSync(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const service_key = process.env.DATA_GO_KR_API_KEY;
  if (!service_key) {
    return NextResponse.json({ error: 'DATA_GO_KR_API_KEY not set' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(300, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));
  const force = searchParams.get('force') === 'true';

  // 1) PNU 있는 complexes 가져오기 (force=false면 미백필만)
  const { data: complexes, error: cErr } = await supabaseAdmin
    .from('complexes')
    .select('complex_key, complex_name, pnu')
    .not('pnu', 'is', null)
    .limit(limit * 4);

  if (cErr) {
    return NextResponse.json({ error: 'failed to load complexes', detail: cErr }, { status: 500 });
  }

  // 이미 있는 pnu 제외 (force=false인 경우)
  let toFetch = complexes ?? [];
  if (!force && toFetch.length > 0) {
    const { data: existing } = await supabaseAdmin
      .from('building_ledgers')
      .select('pnu')
      .in('pnu', toFetch.map((c) => c.pnu));
    const existingSet = new Set((existing ?? []).map((e) => e.pnu));
    toFetch = toFetch.filter((c) => !existingSet.has(c.pnu));
  }
  toFetch = toFetch.slice(0, limit);

  const summary = {
    candidates: complexes?.length ?? 0,
    to_fetch: toFetch.length,
    succeeded: 0,
    not_found: 0,
    errors: [] as string[],
    elapsed_ms: 0,
  };
  const started_at = Date.now();

  async function processOne(c: { complex_key: string; complex_name: string; pnu: string }) {
    try {
      const row = await fetchBuildingTitle(c.pnu, service_key!);
      if (!row) {
        summary.not_found++;
        return;
      }
      const { error: upErr } = await supabaseAdmin
        .from('building_ledgers')
        .upsert(
          { ...row, fetched_at: new Date().toISOString() },
          { onConflict: 'pnu' },
        );
      if (upErr) {
        summary.errors.push(`upsert ${c.complex_name}: ${upErr.message}`);
      } else {
        summary.succeeded++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      summary.errors.push(`${c.complex_name} (${c.pnu}): ${msg}`);
    }
  }

  // 동시성 제한 worker pool
  let cursor = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < toFetch.length) {
      const idx = cursor++;
      if (idx >= toFetch.length) break;
      await processOne(toFetch[idx]);
    }
  });
  await Promise.all(workers);

  summary.elapsed_ms = Date.now() - started_at;
  return NextResponse.json({ ok: true, summary });
}

export async function GET(req: NextRequest) {
  return runSync(req);
}

export async function POST(req: NextRequest) {
  return runSync(req);
}
