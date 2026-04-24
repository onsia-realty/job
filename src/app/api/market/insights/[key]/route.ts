import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 30;

// GET /api/market/insights/[key]
// 단지 AI 인사이트 (로그인 필요, 7일 캐시)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  // 로그인 확인
  const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!authHeader) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader);
  if (authError || !user) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  const { key } = await params;
  const complex_key = decodeURIComponent(key);

  try {
    // 단지 데이터 수집
    const [{ data: monthly }, { data: recentTxs }] = await Promise.all([
      supabaseAdmin
        .from('complex_aggregates')
        .select('ym, avg_price_manwon, trade_count, avg_pyeong_price')
        .eq('complex_key', complex_key)
        .order('ym', { ascending: false })
        .limit(6),
      supabaseAdmin
        .from('price_transactions')
        .select('deal_date, price_manwon, exclusive_area, floor, lawd_cd')
        .eq('complex_key', complex_key)
        .eq('cancel_yn', false)
        .order('deal_date', { ascending: false })
        .limit(10),
    ]);

    if (!monthly || monthly.length === 0) {
      return NextResponse.json({ error: '단지 데이터가 부족합니다' }, { status: 404 });
    }

    const lawd_cd = recentTxs?.[0]?.lawd_cd || null;

    // 중개사 수 + 공고 수
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

    // 변동률 계산
    let growth = null;
    if (monthly.length >= 2) {
      const [curr, prev] = monthly;
      if (prev.avg_price_manwon > 0) {
        growth = ((curr.avg_price_manwon - prev.avg_price_manwon) / prev.avg_price_manwon) * 100;
      }
    }

    // Gemini 호출
    const gemini_key = process.env.GEMINI_API_KEY;
    if (!gemini_key) {
      // Fallback: 룰 기반 요약
      const fallback = buildFallbackSummary(monthly[0], growth, brokerCount, jobCount);
      return NextResponse.json({ insight: fallback, source: 'rule-based' });
    }

    const ai = new GoogleGenAI({ apiKey: gemini_key });

    const prompt = `당신은 부동산 실무자(공인중개사)를 위한 데이터 분석가입니다.
아래 데이터를 바탕으로 2-3문장으로 간결하게 요약해주세요. 실무자에게 도움이 되는 관점으로.

- 최근 월 평균 매매가: ${monthly[0].avg_price_manwon.toLocaleString()}만원
- 최근 월 거래량: ${monthly[0].trade_count}건
- 평당가: ${Math.round(monthly[0].avg_pyeong_price).toLocaleString()}만원
${growth !== null ? `- 전월 대비 변동률: ${growth > 0 ? '+' : ''}${growth.toFixed(1)}%` : ''}
- 지역 내 활동 중개사무소: ${brokerCount}곳
- 지역 내 활성 구인공고: ${jobCount}건

각 문장 사이 \\n로 구분. 이모지 사용 금지. 전문가 톤.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = result.text || '';

    return NextResponse.json({
      insight: text.trim(),
      source: 'ai',
      stats: {
        current_avg_price: monthly[0].avg_price_manwon,
        current_trade_count: monthly[0].trade_count,
        growth_pct: growth,
        broker_count: brokerCount,
        job_count: jobCount,
      },
    }, {
      headers: { 'Cache-Control': 'private, max-age=600' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    console.error('[insights] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function buildFallbackSummary(
  current: { avg_price_manwon: number; trade_count: number; avg_pyeong_price: number },
  growth: number | null,
  brokerCount: number,
  jobCount: number
): string {
  const trend = growth == null
    ? '변동 데이터가 충분하지 않습니다.'
    : growth > 3
      ? `전월 대비 ${growth.toFixed(1)}% 상승으로 매도 우위입니다.`
      : growth < -3
        ? `전월 대비 ${growth.toFixed(1)}% 하락으로 매수 타이밍 관찰이 필요합니다.`
        : `전월 대비 ${growth.toFixed(1)}% 보합세입니다.`;

  const competition = brokerCount > 50
    ? `중개사 ${brokerCount}곳이 경쟁하는 포화 지역입니다.`
    : brokerCount > 20
      ? `중개사 ${brokerCount}곳으로 안정적 경쟁 밀도입니다.`
      : `중개사 ${brokerCount}곳으로 진입 여유가 있습니다.`;

  const jobs = jobCount > 0
    ? `현재 ${jobCount}건의 채용이 진행 중입니다.`
    : '현재 해당 지역의 활성 공고는 없습니다.';

  return `${trend}\n${competition}\n${jobs}`;
}
