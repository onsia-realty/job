import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/market/search?q=래미안
// 단지명 검색 — 자동완성용. complexes 마스터 우선, 부족하면 price_transactions에서 distinct 단지명.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    // 1차: complexes 마스터 — 좌표 있는 단지 우선
    const { data: master } = await supabaseAdmin
      .from('complexes')
      .select('complex_key, complex_name, lat, lng, road_address, hhld_cnt, build_year, sigungu_cd')
      .ilike('complex_name', `%${q}%`)
      .not('lat', 'is', null)
      .limit(20);

    type ResultRow = {
      complex_key: string;
      complex_name: string;
      lat: number | null;
      lng: number | null;
      address: string | null;
      hhld_cnt: number | null;
      build_year: number | null;
      sigungu_cd: string | null;
      source: 'master' | 'tx';
    };
    const results: ResultRow[] = (master ?? []).map((c) => ({
      complex_key: c.complex_key,
      complex_name: c.complex_name,
      lat: c.lat,
      lng: c.lng,
      address: c.road_address,
      hhld_cnt: c.hhld_cnt,
      build_year: c.build_year,
      sigungu_cd: c.sigungu_cd,
      source: 'master',
    }));

    // 2차: master 부족하면 price_transactions에서 fallback (distinct 단지명)
    if (results.length < 10) {
      const { data: txs } = await supabaseAdmin
        .from('price_transactions')
        .select('complex_key, complex_name, lawd_cd, dong')
        .ilike('complex_name', `%${q}%`)
        .limit(50);
      const existingKeys = new Set(results.map((r) => r.complex_key));
      const txMap = new Map<string, {
        complex_key: string;
        complex_name: string;
        lawd_cd: string;
        dong: string | null;
      }>();
      (txs ?? []).forEach((t) => {
        if (!existingKeys.has(t.complex_key) && !txMap.has(t.complex_key)) {
          txMap.set(t.complex_key, t);
        }
      });
      for (const t of txMap.values()) {
        if (results.length >= 10) break;
        results.push({
          complex_key: t.complex_key,
          complex_name: t.complex_name,
          lat: null,
          lng: null,
          address: t.dong,
          hhld_cnt: null,
          build_year: null,
          sigungu_cd: t.lawd_cd,
          source: 'tx',
        });
      }
    }

    return NextResponse.json(
      { results: results.slice(0, 10) },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg, results: [] }, { status: 500 });
  }
}
