import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/market/brokers-nearby?lawd_cd=11680
// 해당 지역 공인중개사사무소 목록 (차별화 기능 — 경쟁 밀도 시각화)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lawd_cd = searchParams.get('lawd_cd');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const status = searchParams.get('status') || '영업중';

  if (!lawd_cd) {
    return NextResponse.json({ error: 'lawd_cd required' }, { status: 400 });
  }

  try {
    // broker_offices.lawd_cd (앞5자리) = region_codes.lawd_cd 와 조인
    const { data, error } = await supabaseAdmin
      .from('broker_offices')
      .select('estbl_reg_no, med_office_nm, rprsv_nm, lctn_road_nm_addr, tel_no, latitude, longitude, sttus_se_nm, opbiz_lrea_clsc_se')
      .eq('lawd_cd', lawd_cd)
      .eq('sttus_se_nm', status)
      .order('med_office_nm', { ascending: true })
      .limit(limit);

    if (error) throw error;

    // 전체 개수 (페이지네이션 UI용)
    const { count } = await supabaseAdmin
      .from('broker_offices')
      .select('*', { count: 'exact', head: true })
      .eq('lawd_cd', lawd_cd)
      .eq('sttus_se_nm', status);

    return NextResponse.json({
      count: data?.length || 0,
      total: count || 0,
      brokers: data || [],
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
