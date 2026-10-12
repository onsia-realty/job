import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { buildComplexInsight, type InsightTxRow } from '@/lib/market/insights';

// GET /api/market/insights/[key]
// 단지 실거래 요약 — 공개 (정보 도구 방향, 가입 불필요)
// LLM 호출 없음: 실거래 행으로 통계를 계산하고 템플릿 문장을 만든다 (src/lib/market/insights.ts).

// complex_key 는 normalizeComplexKey() 결과(영문/숫자/_/한글)라 이 범위로 충분하다.
const KEY_PATTERN = /^[\p{L}\p{N}_.-]{1,150}$/u;

// 최근 거래 순으로 가져올 최대 행 수. 대단지도 12개월 매매는 보통 이 안에 들어온다.
const MAX_ROWS = 1000;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  let complex_key: string;
  try {
    complex_key = decodeURIComponent(key);
  } catch {
    return NextResponse.json({ error: '잘못된 단지 키예요' }, { status: 400 });
  }
  if (!KEY_PATTERN.test(complex_key)) {
    return NextResponse.json({ error: '잘못된 단지 키예요' }, { status: 400 });
  }

  try {
    const { data: rows, error } = await supabaseAdmin
      .from('price_transactions')
      .select('deal_date, deal_type, cancel_yn, price_manwon, exclusive_area, floor, lawd_cd')
      .eq('complex_key', complex_key)
      .eq('deal_type', 'trade')
      .eq('cancel_yn', false)
      .order('deal_date', { ascending: false })
      .limit(MAX_ROWS);

    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: '단지 데이터가 부족해요' }, { status: 404 });
    }

    const summary = buildComplexInsight(rows as InsightTxRow[]);

    // 지역 중개사 수 + 공고 수 (기존 응답 호환용 — DB count 만, 비용 없음)
    const lawd_cd = (rows[0] as { lawd_cd?: string | null }).lawd_cd || null;
    let brokerCount = 0;
    let jobCount = 0;
    if (lawd_cd) {
      const [{ count: bc }, { count: jc }] = await Promise.all([
        supabaseAdmin
          .from('broker_offices')
          .select('*', { count: 'exact', head: true })
          .eq('lawd_cd', lawd_cd)
          .eq('sttus_se_nm', '영업중'),
        supabaseAdmin
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('lawd_cd', lawd_cd)
          .eq('is_active', true)
          .eq('is_approved', true),
      ]);
      brokerCount = bc || 0;
      jobCount = jc || 0;
    }

    // 기존 stats 필드 유지. 의미는 "최근 3개월" 기준으로 바뀜 (UI 라벨도 함께 수정)
    const stats = {
      current_avg_price: summary.recent_3m.avg_price_manwon,
      current_trade_count: summary.recent_3m.count,
      avg_pyeong_price: summary.recent_3m.avg_price_per_3_3m2_manwon,
      // 면적 구성 변화에 덜 흔들리는 전용 3.3㎡당 가격 기준 변동률
      growth_pct: summary.avg_price_per_pyeong_change_pct,
      broker_count: brokerCount,
      job_count: jobCount,
    };

    return NextResponse.json(
      { insight: summary.text, source: 'computed', stats, summary },
      {
        // 공개 응답: 1시간 CDN 캐시
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
      }
    );
  } catch (e) {
    console.error('[insights] error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: '데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
  }
}
