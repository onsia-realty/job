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

  // 1) PNU 있는데 building_ledgers에 없는 complexes 수집.
  //    keyset 페이지네이션(complex_key 순) — ORDER BY 없는 샘플링은 같은 행만 반복해
  //    미백필분에 영영 도달 못 함 (geocode cron과 동일한 버그였음).
  //    존재 확인 .in()은 50개 청크 (URL 길이 한도).
  type Candidate = { complex_key: string; complex_name: string; pnu: string };
  const toFetch: Candidate[] = [];
  let scanCursor = '';
  let scanned = 0;
  for (let page = 0; page < 40 && toFetch.length < limit; page++) {
    const { data: rows, error: cErr } = await supabaseAdmin
      .from('complexes')
      .select('complex_key, complex_name, pnu')
      .not('pnu', 'is', null)
      .gt('complex_key', scanCursor)
      .order('complex_key', { ascending: true })
      .limit(200);
    if (cErr) {
      return NextResponse.json({ error: 'failed to load complexes', detail: cErr }, { status: 500 });
    }
    if (!rows || rows.length === 0) break;
    scanCursor = rows[rows.length - 1].complex_key;
    scanned += rows.length;

    let candidates = rows as Candidate[];
    if (!force) {
      const known = new Set<string>();
      for (let i = 0; i < candidates.length; i += 50) {
        const batch = candidates.slice(i, i + 50).map((c) => c.pnu);
        const { data: existing } = await supabaseAdmin
          .from('building_ledgers')
          .select('pnu')
          .in('pnu', batch);
        for (const e of existing ?? []) known.add(e.pnu);
      }
      candidates = candidates.filter((c) => !known.has(c.pnu));
    }
    toFetch.push(...candidates);
    if (rows.length < 200) break;
  }
  toFetch.length = Math.min(toFetch.length, limit);

  const summary = {
    scanned,
    to_fetch: toFetch.length,
    succeeded: 0,
    not_found: 0,
    errors: [] as string[],
    elapsed_ms: 0,
  };
  const started_at = Date.now();

  async function processOne(c: Candidate) {
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
        return;
      }
      summary.succeeded++;

      // complexes 메타 역반영 — 세대수 필터/패널 헤더/연식 fallback이 이 컬럼들을 사용
      const buildYear = row.use_apr_day && row.use_apr_day.length >= 4
        ? parseInt(row.use_apr_day.slice(0, 4), 10)
        : null;
      const metaUpdate: Record<string, unknown> = {};
      if (row.hhld_cnt != null) metaUpdate.hhld_cnt = row.hhld_cnt;
      if (buildYear && buildYear > 1900) metaUpdate.build_year = buildYear;
      if (row.grnd_flr_cnt != null) metaUpdate.grnd_flr_cnt = row.grnd_flr_cnt;
      if (row.bjdong_cd) metaUpdate.bjdong_cd = row.bjdong_cd;
      if (row.bld_nm) metaUpdate.bld_nm = row.bld_nm;
      if (Object.keys(metaUpdate).length > 0) {
        await supabaseAdmin.from('complexes').update(metaUpdate).eq('complex_key', c.complex_key);
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
