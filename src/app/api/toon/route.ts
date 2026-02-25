import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/toon — 발행된 에피소드 목록 (공개)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const status = searchParams.get('status') || 'published';
    const offset = (page - 1) * limit;

    const { data: episodes, error, count } = await supabaseAdmin
      .from('news_toon_episodes')
      .select('id, episode_number, title, subtitle, slug, category, article_summary, thumbnail_url, toon_image_url, view_count, published_at, created_at', { count: 'exact' })
      .eq('status', status)
      .order('episode_number', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      episodes: episodes || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('Toon list error:', error);
    return NextResponse.json({ episodes: [], total: 0 }, { status: 500 });
  }
}
