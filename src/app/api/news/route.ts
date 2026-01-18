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

// Pexels API에서 이미지 가져오기
async function getPexelsImage(category: string): Promise<string | null> {
  if (!PEXELS_API_KEY) return null;

  try {
    const keyword = CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS['부동산'];
    const page = Math.floor(Math.random() * 5) + 1; // 랜덤 페이지로 다양성 확보

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=15&page=${page}`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      // 랜덤으로 하나 선택
      const randomIndex = Math.floor(Math.random() * data.photos.length);
      return data.photos[randomIndex]?.src?.medium || null;
    }

    return null;
  } catch (error) {
    console.error('Pexels API error:', error);
    return null;
  }
}

// URL 정규화
function normalizeUrl(url: string, baseUrl?: string): string {
  if (!url) return '';

  if (url.startsWith('//')) {
    return 'https:' + url;
  }

  if (url.startsWith('/') && baseUrl) {
    const base = new URL(baseUrl);
    return `${base.protocol}//${base.host}${url}`;
  }

  return url;
}

// Google News 리다이렉트에서 실제 URL 추출
async function getActualUrl(googleNewsUrl: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(googleNewsUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (response.url && !response.url.includes('news.google.com')) {
      return response.url;
    }

    const html = await response.text();

    const dataAuMatch = html.match(/data-n-au="([^"]+)"/);
    if (dataAuMatch && dataAuMatch[1]) {
      return dataAuMatch[1];
    }

    const hrefMatch = html.match(/href="(https?:\/\/(?!news\.google)[^"]+)"/);
    if (hrefMatch && hrefMatch[1]) {
      return hrefMatch[1];
    }

    return googleNewsUrl;
  } catch (error) {
    return googleNewsUrl;
  }
}

// og:image 추출 함수
async function extractOgImage(url: string): Promise<string | null> {
  try {
    let actualUrl = url;
    if (url.includes('news.google.com')) {
      actualUrl = await getActualUrl(url);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(actualUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const html = await response.text();
    const finalUrl = response.url;

    // og:image 추출
    const ogPatterns = [
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    ];

    for (const pattern of ogPatterns) {
      const match = html.match(pattern);
      if (match && match[1] && !match[1].includes('googleusercontent.com')) {
        return normalizeUrl(match[1], finalUrl);
      }
    }

    // twitter:image 폴백
    const twitterMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    if (twitterMatch && twitterMatch[1] && !twitterMatch[1].includes('googleusercontent.com')) {
      return normalizeUrl(twitterMatch[1], finalUrl);
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 50);

    const response = await fetch(RSS_URL, {
      next: { revalidate: 600 },
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

    // 썸네일 추출 (병렬 처리)
    const thumbnailPromises = newsData.map(async (news: any) => {
      // 1순위: og:image 스크래핑
      const ogImage = await extractOgImage(news.link);
      if (ogImage) {
        news.thumbnail = ogImage;
        return news;
      }

      // 2순위: Pexels API
      const pexelsImage = await getPexelsImage(news.category);
      if (pexelsImage) {
        news.thumbnail = pexelsImage;
        return news;
      }

      // 3순위: 기본 이미지 (이미 설정됨)
      return news;
    });

    const newsWithThumbnails = await Promise.all(thumbnailPromises);
    return NextResponse.json({ news: newsWithThumbnails, total: items.length });
  } catch (error) {
    console.error('RSS parsing error:', error);
    return NextResponse.json({
      news: [],
      total: 0,
    });
  }
}
