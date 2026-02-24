import { XMLParser } from 'fast-xml-parser';

const RSS_URL = 'https://news.google.com/rss/search?q=%EB%B6%80%EB%8F%99%EC%82%B0&hl=ko&gl=KR&ceid=KR:ko';

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  category: string;
}

function categorizeNews(title: string): string {
  if (title.includes('분양') || title.includes('청약')) return '분양정보';
  if (title.includes('정책') || title.includes('규제') || title.includes('정부')) return '정책';
  if (title.includes('전망') || title.includes('예측') || title.includes('전문가')) return '전망';
  if (title.includes('가격') || title.includes('시세') || title.includes('상승') || title.includes('하락')) return '시장동향';
  return '부동산';
}

export async function fetchLatestNews(limit: number = 5): Promise<NewsItem[]> {
  const response = await fetch(RSS_URL, { next: { revalidate: 10800 } });
  if (!response.ok) throw new Error('RSS fetch failed');

  const xml = await response.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const result = parser.parse(xml);
  const items = result?.rss?.channel?.item || [];

  return items.slice(0, limit).map((item: Record<string, unknown>) => {
    let title = (item.title as string) || '';
    const dashIndex = title.lastIndexOf(' - ');
    if (dashIndex > 0) title = title.substring(0, dashIndex);

    return {
      title,
      link: (item.link as string) || '',
      source: (item.source as Record<string, string>)?.['#text'] || (item.source as string) || '',
      pubDate: (item.pubDate as string) || '',
      category: categorizeNews(title),
    };
  });
}

// 뉴스 본문 스크래핑 (best-effort, Google News redirect 통과)
export async function fetchNewsContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' },
      redirect: 'follow',
    });
    if (!response.ok) return null;

    const html = await response.text();
    // 기본적인 텍스트 추출: <p> 태그 내용만
    const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    const text = paragraphs
      .map(p => p.replace(/<[^>]+>/g, '').trim())
      .filter(p => p.length > 30)
      .join('\n\n');

    return text.substring(0, 3000) || null;
  } catch {
    return null;
  }
}
