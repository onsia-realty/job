import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import {
  fetchApartmentTrades, fetchApartmentRents,
  fetchOfficetelTrades, fetchOfficetelRents,
} from '@/lib/market/realEstate';
import { getLastNMonths } from '@/lib/market/publicApi';

/**
 * POST /api/cron/sync-transactions
 * Vercel Cron(daily 04:00 KST) + 수동 트리거용.
 * MVP 지역(is_mvp=true) × 최근 3개월 × (아파트+오피스텔) × (매매+전월세) 동기화.
 * 체감 시간: ~45초 (서울+경기 46개 지역 × 3개월 × 4종 = 552 호출)
 */
export async function POST(req: NextRequest) {
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
    apt_trade: 0,
    apt_rent: 0,
    offi_trade: 0,
    offi_rent: 0,
    errors: [] as string[],
  };

  // 직렬 처리 (rate limit 보호)
  for (const region of regions) {
    for (const ym of months) {
      try {
        const [aptT, aptR, offiT, offiR] = await Promise.allSettled([
          fetchApartmentTrades(region.lawd_cd, ym, service_key),
          fetchApartmentRents(region.lawd_cd, ym, service_key),
          fetchOfficetelTrades(region.lawd_cd, ym, service_key),
          fetchOfficetelRents(region.lawd_cd, ym, service_key),
        ]);

        const allRows = [
          ...(aptT.status === 'fulfilled' ? aptT.value : []),
          ...(aptR.status === 'fulfilled' ? aptR.value : []),
          ...(offiT.status === 'fulfilled' ? offiT.value : []),
          ...(offiR.status === 'fulfilled' ? offiR.value : []),
        ];

        if (aptT.status === 'fulfilled') summary.apt_trade += aptT.value.length;
        if (aptR.status === 'fulfilled') summary.apt_rent += aptR.value.length;
        if (offiT.status === 'fulfilled') summary.offi_trade += offiT.value.length;
        if (offiR.status === 'fulfilled') summary.offi_rent += offiR.value.length;

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
          if (upErr) summary.errors.push(`upsert ${region.sigungu} ${ym}: ${upErr.message}`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        summary.errors.push(`${region.sigungu} ${ym}: ${msg}`);
      }
    }
  }

  return NextResponse.json({ ok: true, summary });
}

// GET은 상태 확인용 (auth 없이도 summary만 반환)
export async function GET() {
  const { count } = await supabaseAdmin
    .from('price_transactions')
    .select('*', { count: 'exact', head: true });
  return NextResponse.json({ total_transactions: count || 0 });
}
