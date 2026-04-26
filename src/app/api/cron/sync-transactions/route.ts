import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import {
  fetchApartmentTrades, fetchApartmentRents,
  fetchOfficetelTrades, fetchOfficetelRents,
} from '@/lib/market/realEstate';
import { getLastNMonths } from '@/lib/market/publicApi';

// Vercel 서버리스 함수 최대 실행 시간 (Pro 플랜 기준 최대 300초)
export const maxDuration = 300;

/**
 * GET/POST /api/cron/sync-transactions
 * Vercel Cron은 GET으로 호출(daily 04:00 KST), 수동 트리거는 POST 가능.
 * 둘 다 Authorization: Bearer ${CRON_SECRET} 필요.
 * MVP 지역(is_mvp=true) × 최근 3개월 × (아파트+오피스텔) × (매매+전월세) 동기화.
 * 병렬: region×ym 조합을 CONCURRENCY개씩 묶어 처리.
 * ?months=202603 로 특정 월만, ?concurrency=10 로 동시성 조절 가능.
 */
const DEFAULT_CONCURRENCY = 8;
async function runSync(req: NextRequest) {
  // Cron secret 검증 (Vercel Cron은 Authorization: Bearer <CRON_SECRET>)
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
  const months_param = searchParams.get('months');
  const months = months_param ? months_param.split(',') : getLastNMonths(3);
  const concurrency = Math.max(1, Math.min(20, parseInt(searchParams.get('concurrency') || String(DEFAULT_CONCURRENCY), 10)));

  // MVP 지역 조회
  const { data: regions, error: rErr } = await supabaseAdmin
    .from('region_codes')
    .select('lawd_cd, sigungu')
    .eq('is_mvp', true);

  if (rErr || !regions) {
    return NextResponse.json({ error: 'failed to load regions', detail: rErr }, { status: 500 });
  }

  const summary = {
    months,
    regions: regions.length,
    concurrency,
    apt_trade: 0,
    apt_rent: 0,
    offi_trade: 0,
    offi_rent: 0,
    errors: [] as string[],
    elapsed_ms: 0,
  };
  const started_at = Date.now();

  // region × ym 조합을 flat list로
  const tasks: Array<{ lawd_cd: string; sigungu: string; ym: string }> = [];
  for (const r of regions) for (const ym of months) tasks.push({ lawd_cd: r.lawd_cd, sigungu: r.sigungu, ym });

  async function processOne(t: { lawd_cd: string; sigungu: string; ym: string }) {
    try {
      const [aptT, aptR, offiT, offiR] = await Promise.allSettled([
        fetchApartmentTrades(t.lawd_cd, t.ym, service_key!),
        fetchApartmentRents(t.lawd_cd, t.ym, service_key!),
        fetchOfficetelTrades(t.lawd_cd, t.ym, service_key!),
        fetchOfficetelRents(t.lawd_cd, t.ym, service_key!),
      ]);

      const allRows = [
        ...(aptT.status === 'fulfilled' ? aptT.value : []),
        ...(aptR.status === 'fulfilled' ? aptR.value : []),
        ...(offiT.status === 'fulfilled' ? offiT.value : []),
        ...(offiR.status === 'fulfilled' ? offiR.value : []),
      ];

      if (aptT.status === 'fulfilled') summary.apt_trade += aptT.value.length;
      else summary.errors.push(`apt_trade ${t.sigungu} ${t.ym}: ${aptT.reason instanceof Error ? aptT.reason.message : String(aptT.reason)}`);
      if (aptR.status === 'fulfilled') summary.apt_rent += aptR.value.length;
      else summary.errors.push(`apt_rent ${t.sigungu} ${t.ym}: ${aptR.reason instanceof Error ? aptR.reason.message : String(aptR.reason)}`);
      if (offiT.status === 'fulfilled') summary.offi_trade += offiT.value.length;
      else summary.errors.push(`offi_trade ${t.sigungu} ${t.ym}: ${offiT.reason instanceof Error ? offiT.reason.message : String(offiT.reason)}`);
      if (offiR.status === 'fulfilled') summary.offi_rent += offiR.value.length;
      else summary.errors.push(`offi_rent ${t.sigungu} ${t.ym}: ${offiR.reason instanceof Error ? offiR.reason.message : String(offiR.reason)}`);

      if (allRows.length > 0) {
        const { error: upErr } = await supabaseAdmin
          .from('price_transactions')
          .upsert(
            allRows.map((r) => ({
              property_type: r.property_type,
              deal_type: r.deal_type,
              lawd_cd: r.lawd_cd,
              deal_ymd: r.deal_ymd,
              deal_date: r.deal_date,
              complex_name: r.complex_name,
              complex_key: r.complex_key,
              dong: r.dong,
              jibun: r.jibun,
              exclusive_area: r.exclusive_area,
              floor: r.floor,
              build_year: r.build_year,
              price_manwon: r.price_manwon,
              deposit_manwon: r.deposit_manwon,
              monthly_manwon: r.monthly_manwon,
              cancel_yn: r.cancel_yn,
              deal_channel: r.deal_channel,
              raw: r.raw,
              fetched_at: new Date().toISOString(),
            })),
            { onConflict: 'property_type,deal_type,lawd_cd,deal_ymd,complex_name,jibun,exclusive_area,floor,deal_date,price_manwon,deposit_manwon', ignoreDuplicates: true }
          );
        if (upErr) summary.errors.push(`upsert ${t.sigungu} ${t.ym}: ${upErr.message}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      summary.errors.push(`${t.sigungu} ${t.ym}: ${msg}`);
    }
  }

  // concurrency 제한 병렬 처리 (간단한 worker pool)
  let cursor = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < tasks.length) {
      const idx = cursor++;
      if (idx >= tasks.length) break;
      await processOne(tasks[idx]);
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
