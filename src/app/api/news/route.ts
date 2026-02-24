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

// 기본 썸네일 (최종 폴백) - 카테고리별 여러 장
const DEFAULT_THUMBNAILS: Record<string, string[]> = {
  '시장동향': [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1468254095679-bbcba94a7066?w=400&h=300&fit=crop',
  ],
  '분양정보': [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=400&h=300&fit=crop',
  ],
  '정책': [
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=400&h=300&fit=crop',
  ],
  '전망': [
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop',
  ],
  '부동산': [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
  ],
};

// Pexels API 캐시 (메모리 캐시 - 1시간) - 카테고리별 여러 장
const pexelsCache: Record<string, { urls: string[]; timestamp: number }> = {};
const PEXELS_CACHE_TTL = 3600000; // 1시간

// Pexels API에서 카테고리별 이미지 여러 장 가져오기 (캐시 적용)
async function getPexelsImages(category: string): Promise<string[]> {
  if (!PEXELS_API_KEY) return [];

  // 캐시 확인
  const cached = pexelsCache[category];
  if (cached && Date.now() - cached.timestamp < PEXELS_CACHE_TTL) {
    return cached.urls;
  }

  try {
    const keyword = CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS['부동산'];
    const randomPage = Math.floor(Math.random() * 3) + 1;
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=10&page=${randomPage}`,
      {
        headers: { 'Authorization': PEXELS_API_KEY },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      const urls = data.photos
        .map((p: any) => p?.src?.medium)
        .filter(Boolean) as string[];
      if (urls.length > 0) {
        pexelsCache[category] = { urls, timestamp: Date.now() };
      }
      return urls;
    }

    return [];
  } catch {
    return [];
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
      };
    });

    // 썸네일 설정 - 카테고리별 여러 장 Pexels 호출
    const uniqueCategories = [...new Set(newsData.map((n: any) => n.category))];
    const categoryImages: Record<string, string[]> = {};
    await Promise.all(
      uniqueCategories.map(async (cat) => {
        const imgs = await getPexelsImages(cat as string);
        if (imgs.length > 0) categoryImages[cat as string] = imgs;
      })
    );

    // 각 뉴스에 카테고리 내 순서별로 다른 이미지 배정
    const categoryCounters: Record<string, number> = {};
    const newsWithThumbnails = newsData.map((news: any) => {
      const cat = news.category;
      const counter = categoryCounters[cat] || 0;
      categoryCounters[cat] = counter + 1;

      // Pexels 이미지 → 폴백 이미지 (순서대로 돌려쓰기)
      const pexelsImgs = categoryImages[cat];
      const fallbackImgs = DEFAULT_THUMBNAILS[cat] || DEFAULT_THUMBNAILS['부동산'];

      let thumbnail: string;
      if (pexelsImgs && pexelsImgs.length > 0) {
        thumbnail = pexelsImgs[counter % pexelsImgs.length];
      } else {
        thumbnail = fallbackImgs[counter % fallbackImgs.length];
      }

      return { ...news, thumbnail };
    });

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
