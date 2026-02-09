import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

const RSS_URL = 'https://news.google.com/rss/search?q=%EB%B6%80%EB%8F%99%EC%82%B0&hl=ko&gl=KR&ceid=KR:ko';
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

// 카테고리별 Pexels 검색 키워드
const CATEGORY_KEYWORDS: Record<string, string> = {
  '시장동향': 'stock market finance',
  '분양정보': 'apartment building',
  '정책': 'government building',
  '전망': 'city skyline',
  '부동산': 'real estate house',
};

// 기본 썸네일 (최종 폴백)
const DEFAULT_THUMBNAILS: Record<string, string> = {
  '시장동향': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
  '분양정보': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
  '정책': 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=400&h=300&fit=crop',
  '전망': 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop',
  '부동산': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
};

// Pexels API 캐시 (메모리 캐시 - 1시간)
const pexelsCache: Record<string, { url: string; timestamp: number }> = {};
const PEXELS_CACHE_TTL = 3600000; // 1시간

// Pexels API에서 카테고리별 이미지 가져오기 (캐시 적용)
async function getPexelsImage(category: string): Promise<string | null> {
  if (!PEXELS_API_KEY) return null;

  // 캐시 확인
  const cached = pexelsCache[category];
  if (cached && Date.now() - cached.timestamp < PEXELS_CACHE_TTL) {
    return cached.url;
  }

  try {
    const keyword = CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS['부동산'];
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=5&page=1`,
      {
        headers: { 'Authorization': PEXELS_API_KEY },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.photos.length);
      const url = data.photos[randomIndex]?.src?.medium || null;
      if (url) {
        pexelsCache[category] = { url, timestamp: Date.now() };
      }
      return url;
    }

    return null;
  } catch {
    return null;
  }
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 50);

    const response = await fetch(RSS_URL, {
      next: { revalidate: 10800 }, // 3시간 캐시
    });

    if (!response.ok) {
      throw new Error('RSS fetch failed');
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    const result = parser.parse(xml);
    const items = result?.rss?.channel?.item || [];

    // 뉴스 데이터 변환
    const newsData = items.slice(0, limit).map((item: any, index: number) => {
      const pubDate = new Date(item.pubDate);
      const formattedDate = `${pubDate.getFullYear()}.${String(pubDate.getMonth() + 1).padStart(2, '0')}.${String(pubDate.getDate()).padStart(2, '0')}`;

      let title = item.title || '';
      const dashIndex = title.lastIndexOf(' - ');
      if (dashIndex > 0) {
        title = title.substring(0, dashIndex);
      }

      let category = '부동산';
      if (title.includes('분양') || title.includes('청약')) category = '분양정보';
      else if (title.includes('정책') || title.includes('규제') || title.includes('정부')) category = '정책';
      else if (title.includes('전망') || title.includes('예측') || title.includes('전문가')) category = '전망';
      else if (title.includes('가격') || title.includes('시세') || title.includes('상승') || title.includes('하락')) category = '시장동향';

      return {
        id: index + 1,
        title,
        date: formattedDate,
        category,
        link: item.link || '',
        source: item.source?.['#text'] || item.source || '',
        thumbnail: DEFAULT_THUMBNAILS[category] || DEFAULT_THUMBNAILS['부동산'],
      };
    });

    // 썸네일 설정 - 고유 카테고리만 Pexels 호출 (5회→최대 4회)
    const uniqueCategories = [...new Set(newsData.map((n: any) => n.category))];
    const categoryImages: Record<string, string> = {};
    await Promise.all(
      uniqueCategories.map(async (cat) => {
        const img = await getPexelsImage(cat as string);
        if (img) categoryImages[cat as string] = img;
      })
    );
    const newsWithThumbnails = newsData.map((news: any) => ({
      ...news,
      thumbnail: categoryImages[news.category] || news.thumbnail,
    }));

    return NextResponse.json(
      { news: newsWithThumbnails, total: items.length },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
    );
  } catch (error) {
    console.error('RSS parsing error:', error);
    return NextResponse.json({
      news: [],
      total: 0,
    });
  }
}
