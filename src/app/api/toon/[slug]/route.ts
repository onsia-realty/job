import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/toon/[slug] — 개별 에피소드 상세 (공개)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const { data: episode, error } = await supabaseAdmin
      .from('news_toon_episodes')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !episode) {
      return NextResponse.json({ error: '에피소드를 찾을 수 없습니다' }, { status: 404 });
    }

    // 조회수 증가 (비동기, 응답 차단 안함)
    supabaseAdmin
      .from('news_toon_episodes')
      .update({ view_count: (episode.view_count || 0) + 1 })
      .eq('id', episode.id)
      .then();

    return NextResponse.json({
      episode,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Toon detail error:', error);
    return NextResponse.json({ error: '에피소드 조회 실패' }, { status: 500 });
  }
}
