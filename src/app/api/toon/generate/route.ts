import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { generateToonFromNews, generateSlug } from '@/lib/ai-toon';
import { fetchNewsContent } from '@/lib/news-fetcher';

// 관리자 인증
async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!dbUser || dbUser.user_type !== 'admin') return null;
  return user;
}

// POST /api/toon/generate — AI 뉴스툰 생성
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { newsUrl, newsTitle, newsContent } = body as {
      newsUrl?: string;
      newsTitle?: string;
      newsContent?: string;
    };

    if (!newsTitle && !newsUrl) {
      return NextResponse.json(
        { error: 'newsTitle 또는 newsUrl이 필요합니다' },
        { status: 400 }
      );
    }

    // 뉴스 본문 가져오기 (URL이 있고 content가 없으면)
    let content = newsContent;
    if (!content && newsUrl) {
      content = (await fetchNewsContent(newsUrl)) ?? undefined;
    }

    const title = newsTitle || '부동산 뉴스';

    // AI로 해설 기사 + 웹툰 생성
    const result = await generateToonFromNews(title, content, newsUrl);

    // 다음 에피소드 번호 조회
    const { data: lastEp } = await supabaseAdmin
      .from('news_toon_episodes')
      .select('episode_number')
      .order('episode_number', { ascending: false })
      .limit(1)
      .single();

    const nextEpNumber = (lastEp?.episode_number ?? 0) + 1;
    const slug = generateSlug(nextEpNumber, result.article.title);

    // DB 저장 (draft 상태)
    const { data: episode, error: insertError } = await supabaseAdmin
      .from('news_toon_episodes')
      .insert({
        episode_number: nextEpNumber,
        title: result.article.title,
        subtitle: result.article.subtitle,
        slug,
        source_news_url: newsUrl || null,
        source_news_title: newsTitle || null,
        category: result.article.category,
        article_html: result.article.article_html,
        article_summary: result.article.article_summary,
        panels: result.panels,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`DB 저장 실패: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      episode,
      message: `EP.${String(nextEpNumber).padStart(3, '0')} 생성 완료 (draft)`,
    });
  } catch (error) {
    console.error('Toon generate error:', error);
    return NextResponse.json(
      { error: `뉴스툰 생성 실패: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
