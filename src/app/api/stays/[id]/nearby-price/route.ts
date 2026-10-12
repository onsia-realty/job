import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { STAY_TYPE_LABELS, type StayType } from '@/lib/stay/constants';
import {
  NEARBY_PRICE_AREA_BAND,
  NEARBY_PRICE_MAX_ROWS,
  NEARBY_PRICE_MIN_SAMPLE,
  NEARBY_PRICE_MONTHS,
  STAY_TYPE_TO_TX_TYPE,
  areaBand,
  average,
  diffPct,
} from '@/lib/stay/nearby-price';
import type { StayNearbyPriceResponse } from '@/types/stay';

// GET /api/stays/[id]/nearby-price
// 이 매물의 월차임을 같은 시군구·같은 유형의 국토부 전월세 실거래 평균과 비교한다.
//
// ⚠️ 보증금은 비교하지 않는다 — 반전세가 섞이면 보증금 평균이 크게 왜곡되어
//    "평균 대비 몇 %" 라는 숫자가 의미를 잃는다. 월차임만 비교한다.
//
// ⚠️ 단위: price_transactions 는 만원 단위(monthly_manwon),
//    stays 는 원 단위(monthly_fee_won). 만원→원(×10000) 변환은
//    이 파일(8번 단계)에서 딱 한 번만 한다. 응답은 전부 원 단위(`Won` 접미사).

const MANWON_TO_WON = 10_000;

interface TxRow {
  monthly_manwon: number | null;
  deal_date: string;
}

/** 오늘 기준 N개월 전 날짜 (YYYY-MM-DD) */
function monthsAgoStr(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

/**
 * 지역 × 유형 전월세 실거래 조회.
 * band 가 주어지면 전용면적 ±30% 밴드를 추가로 건다.
 * 에러는 호출측이 500 으로 올릴 수 있게 그대로 던져 올린다.
 */
async function fetchRentTransactions(
  lawdCd: string,
  txType: 'apt' | 'officetel',
  sinceStr: string,
  band: { min: number; max: number } | null
): Promise<TxRow[]> {
  let q = supabaseAdmin
    .from('price_transactions')
    .select('monthly_manwon, deal_date')
    .eq('lawd_cd', lawdCd)
    .eq('property_type', txType)
    .eq('deal_type', 'rent')
    .eq('cancel_yn', false)
    // monthly_manwon = 0 은 전세다. 월차임 비교 대상이 아니므로 반드시 제외한다.
    .gt('monthly_manwon', 0)
    .gte('deal_date', sinceStr);

  if (band) {
    q = q.gte('exclusive_area', band.min).lte('exclusive_area', band.max);
  }

  // PostgREST 는 명시적 limit 이 없으면 1000행에서 조용히 잘린다. 최근순으로 자른다.
  const { data, error } = await q
    .order('deal_date', { ascending: false })
    .limit(NEARBY_PRICE_MAX_ROWS);

  if (error) throw error;
  return (data ?? []) as TxRow[];
}

/** 표본이 걸친 개월수 (최소 1). cron 이 최근 3개월만 롤링 수집하므로 12로 하드코딩하면 거짓말이 된다. */
function spanMonths(rows: TxRow[]): number {
  let min = rows[0].deal_date;
  let max = rows[0].deal_date;
  for (const r of rows) {
    if (r.deal_date < min) min = r.deal_date;
    if (r.deal_date > max) max = r.deal_date;
  }
  const a = new Date(min);
  const b = new Date(max);
  const months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1;
  return Math.max(1, months);
}

function json(body: StayNearbyPriceResponse) {
  return NextResponse.json(body, {
    headers: {
      // 실거래는 하루 단위로만 바뀐다.
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: stay, error: stayError } = await supabaseAdmin
    .from('stays')
    // 보증금은 비교하지 않으므로 deposit_won 은 가져오지 않는다.
    .select(
      'id, stay_type, lawd_cd, sigungu, exclusive_area, monthly_fee_won, is_active, is_approved'
    )
    .eq('id', id)
    .maybeSingle();

  if (stayError) {
    console.error('[nearby-price] stay fetch error:', stayError);
    return NextResponse.json({ error: '시세를 불러올 수 없습니다' }, { status: 500 });
  }

  // ⚠️ 상세 API(/api/stays/[id])와 달리 소유자/관리자 예외를 두지 않는다.
  //    시세 비교는 "공개 매물"에만 붙는 부가 정보이고, 미승인 매물에 지역 시세를
  //    붙여주면 심사 전 매물이 시세 근거를 갖춘 것처럼 보인다. 존재 여부도
  //    흘리지 않도록 없는 id 와 동일하게 404 로 통일한다.
  if (!stay || stay.is_active !== true || stay.is_approved !== true) {
    return NextResponse.json({ error: '매물을 찾을 수 없습니다' }, { status: 404 });
  }

  if (!stay.lawd_cd) {
    return json({ available: false, reason: 'no_region' });
  }

  const stayType = stay.stay_type as StayType;
  const txType = STAY_TYPE_TO_TX_TYPE[stayType];
  if (!txType) {
    return json({ available: false, reason: 'unsupported_type' });
  }

  // 전세(월차임 없음)·가격문의 매물은 비교 기준 자체가 없다.
  if (stay.monthly_fee_won == null) {
    return json({ available: false, reason: 'insufficient_sample' });
  }

  const sinceStr = monthsAgoStr(NEARBY_PRICE_MONTHS);
  const area = Number(stay.exclusive_area);
  const useBand = Number.isFinite(area) && area > 0;
  const band = useBand ? areaBand(area, NEARBY_PRICE_AREA_BAND) : null;

  let rows: TxRow[];
  let areaFiltered = useBand;
  try {
    rows = (await fetchRentTransactions(stay.lawd_cd, txType, sinceStr, band)).filter(
      (r) => r.monthly_manwon != null
    );

    // 면적 밴드로 표본이 너무 얇아졌으면 밴드를 풀고 한 번 더.
    // (평균은 이상치에 취약해서 밴드가 왜곡 방지 장치다 — 푼 경우 areaFiltered:false 로 알린다)
    if (rows.length < NEARBY_PRICE_MIN_SAMPLE && useBand) {
      rows = (await fetchRentTransactions(stay.lawd_cd, txType, sinceStr, null)).filter(
        (r) => r.monthly_manwon != null
      );
      areaFiltered = false;
    }
  } catch (e) {
    console.error('[nearby-price] transaction fetch error:', e);
    return NextResponse.json({ error: '시세를 불러올 수 없습니다' }, { status: 500 });
  }

  if (rows.length < NEARBY_PRICE_MIN_SAMPLE) {
    return json({ available: false, reason: 'insufficient_sample' });
  }

  // ---- 만원 → 원 변환은 여기 딱 한 번 ----
  const avgMonthlyWon = Math.round(average(rows.map((r) => r.monthly_manwon!)) * MANWON_TO_WON);

  // 지역명: region_codes 우선, 실패하면 stays.sigungu 폴백
  let regionLabel = stay.sigungu ?? '';
  const { data: region } = await supabaseAdmin
    .from('region_codes')
    .select('sigungu')
    .eq('lawd_cd', stay.lawd_cd)
    .maybeSingle();
  if (region?.sigungu) regionLabel = region.sigungu;

  return json({
    available: true,
    sampleCount: rows.length,
    months: spanMonths(rows),
    areaFiltered,
    regionLabel,
    propertyTypeLabel: STAY_TYPE_LABELS[stayType],
    average: { monthlyWon: avgMonthlyWon },
    subject: { monthlyWon: stay.monthly_fee_won },
    monthlyDiffPct: diffPct(stay.monthly_fee_won, avgMonthlyWon),
  });
}
