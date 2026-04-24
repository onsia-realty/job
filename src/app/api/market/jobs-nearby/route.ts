import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/market/jobs-nearby?lawd_cd=11680
// 해당 지역에서 활성 중인 공고 목록 (차별화 기능)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lawd_cd = searchParams.get('lawd_cd');
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  if (!lawd_cd) {
    return NextResponse.json({ error: 'lawd_cd required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select('id, title, company, category, tier, region, address, thumbnail, created_at')
      .eq('is_active', true)
      .eq('is_approved', true)
      .eq('lawd_cd', lawd_cd)
      .order('tier', { ascending: true }) // vip > unique > superior > premium > normal
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      count: data?.length || 0,
      jobs: data || [],
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
