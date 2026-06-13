import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import {
  fetchCommonMgmtCost,
  fetchIndividualMgmtCost,
  fetchKaptBasisInfo,
} from '@/lib/market/aptMgmtCost';

export const maxDuration = 300;

/**
 * GET/POST /api/cron/sync-mgmt-costs
 * kapt_code가 있는데 해당 월 apt_mgmt_costs가 없는 단지를 N개씩 백필.
 * 공용관리비(17) + 개별사용료(10) + 세대수(기본정보) 수집.
 * Authorization: Bearer ${CRON_SECRET}
 * ?month=YYYYMM (기본: 현재-2개월, K-apt 공개지연 반영) · ?limit=120 · ?force=true
 *
 * K-apt는 매월 신규 관리비를 공개하므로 월 1회(+커버리지 보충용 수회) 실행.
 * 단지당 27콜(공용17+개별10). limit=120이면 약 3~4분.
 */
const DEFAULT_LIMIT = 120;
const CONCURRENCY = 4;

/** 기본 대상월 = 현재-2개월 (K-apt 공개지연) → YYYYMM */
function defaultMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

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
  const limit = Math.max(1, Math.min(400, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));
  const force = searchParams.get('force') === 'true';
  const month = searchParams.get('month') || defaultMonth();
  if (!/^\d{6}$/.test(month)) {
    return NextResponse.json({ error: 'month must be YYYYMM' }, { status: 400 });
  }

  // 1) kapt_code 있는 complexes 스캔 (keyset, complex_key 순) — kapt_code 단위 dedup.
  //    이미 (kapt_code, month) 행이 있으면 스킵 (force 제외).
  type Candidate = { complex_key: string; kapt_code: string; hhld_cnt: number | null };
  const toFetch: Candidate[] = [];
  const seenKapt = new Set<string>();
  let scanCursor = '';
  let scanned = 0;
  for (let page = 0; page < 200 && toFetch.length < limit; page++) {
    const { data: rows, error: cErr } = await supabaseAdmin
      .from('complexes')
      .select('complex_key, kapt_code, hhld_cnt')
      .not('kapt_code', 'is', null)
      .gt('complex_key', scanCursor)
      .order('complex_key', { ascending: true })
      .limit(200);
    if (cErr) {
      return NextResponse.json({ error: 'failed to load complexes', detail: cErr }, { status: 500 });
    }
    if (!rows || rows.length === 0) break;
    scanCursor = rows[rows.length - 1].complex_key;
    scanned += rows.length;

    // kapt_code 단위 dedup (배치 내)
    let candidates = (rows as Candidate[]).filter((c) => {
      if (seenKapt.has(c.kapt_code)) return false;
      seenKapt.add(c.kapt_code);
      return true;
    });

    if (!force && candidates.length > 0) {
      const known = new Set<string>();
      for (let i = 0; i < candidates.length; i += 50) {
        const batch = candidates.slice(i, i + 50).map((c) => c.kapt_code);
        const { data: existing } = await supabaseAdmin
          .from('apt_mgmt_costs')
          .select('kapt_code')
          .eq('search_date', month)
          .in('kapt_code', batch);
        for (const e of existing ?? []) known.add(e.kapt_code);
      }
      candidates = candidates.filter((c) => !known.has(c.kapt_code));
    }
    toFetch.push(...candidates);
    if (rows.length < 200) break;
  }
  toFetch.length = Math.min(toFetch.length, limit);

  const summary = {
    month,
    scanned,
    to_fetch: toFetch.length,
    with_data: 0,
    no_data: 0,
    hhld_patched: 0,
    errors: [] as string[],
    elapsed_ms: 0,
  };
  const started_at = Date.now();

  async function processOne(c: Candidate) {
    try {
      const [cmn, ind, basis] = await Promise.all([
        fetchCommonMgmtCost(c.kapt_code, month, service_key!),
        fetchIndividualMgmtCost(c.kapt_code, month, service_key!),
        c.hhld_cnt == null ? fetchKaptBasisInfo(c.kapt_code, service_key!) : Promise.resolve(null),
      ]);

      // 세대수 결측 보강
      if (basis?.hhld_cnt != null) {
        await supabaseAdmin.from('complexes').update({ hhld_cnt: basis.hhld_cnt }).eq('complex_key', c.complex_key);
        summary.hhld_patched++;
      }

      if (!cmn && !ind) {
        summary.no_data++;
        return;
      }

      const cmnTotal = cmn?.cmn_total ?? null;
      const indTotal = ind?.ind_total ?? null;
      const row: Record<string, unknown> = {
        kapt_code: c.kapt_code,
        search_date: month,
        cmn_total: cmnTotal,
        ind_total: indTotal,
        total_cost: (cmnTotal ?? 0) + (indTotal ?? 0),
        raw: { cmn: cmn?.raw ?? null, ind: ind?.raw ?? null },
        fetched_at: new Date().toISOString(),
      };
      if (basis?.billed_area != null) row.area_total = basis.billed_area;
      if (cmn) {
        const cmnRec = cmn as unknown as Record<string, unknown>;
        for (const k of Object.keys(cmnRec)) {
          if (k.startsWith('cmn_') && k !== 'cmn_total') row[k] = cmnRec[k];
        }
      }
      if (ind) {
        const indRec = ind as unknown as Record<string, unknown>;
        for (const k of Object.keys(indRec)) {
          if (k.startsWith('ind_') && k !== 'ind_total' && !k.endsWith('_bucket')) {
            row[k] = indRec[k];
          }
        }
      }

      const { error: upErr } = await supabaseAdmin
        .from('apt_mgmt_costs')
        .upsert(row, { onConflict: 'kapt_code,search_date' });
      if (upErr) {
        summary.errors.push(`upsert ${c.kapt_code}: ${upErr.message}`);
        return;
      }
      summary.with_data++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      summary.errors.push(`${c.kapt_code}: ${msg}`);
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
