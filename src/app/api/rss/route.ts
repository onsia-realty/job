import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

const RSS_URL = 'https://news.google.com/rss/search?q=%EB%B6%80%EB%8F%99%EC%82%B0&hl=ko&gl=KR&ceid=KR:ko';
const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://onsia.city';
const SITE_NAME = '온시아 JOB - 부동산 뉴스';

export async function GET() {
  try {
    // Google News RSS 가져오기
    const response = await fetch(RSS_URL, {
      next: { revalidate: 600 }, // 10분 캐시
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

    // 카테고리 분류 함수
    const categorizeNews = (title: string): string => {
      if (title.includes('분양') || title.includes('청약')) return '분양정보';
      if (title.includes('정책') || title.includes('규제') || title.includes('정부')) return '정책';
      if (title.includes('전망') || title.includes('예측') || title.includes('전문가')) return '전망';
      if (title.includes('가격') || title.includes('시세') || title.includes('상승') || title.includes('하락')) return '시장동향';
      return '부동산';
    };

    // RSS 2.0 피드 생성
    const rssItems = items.slice(0, 30).map((item: any, index: number) => {
      let title = item.title || '';
      const dashIndex = title.lastIndexOf(' - ');
      if (dashIndex > 0) {
        title = title.substring(0, dashIndex);
      }

      const pubDate = new Date(item.pubDate);
      const category = categorizeNews(title);
      const newsId = index + 1;

      // CDATA로 감싸서 특수문자 처리
      return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${SITE_URL}/news/${newsId}</link>
      <guid isPermaLink="true">${SITE_URL}/news/${newsId}</guid>
      <description><![CDATA[${category} - 온시아 JOB에서 제공하는 부동산 뉴스. ${title}]]></description>
      <pubDate>${pubDate.toUTCString()}</pubDate>
      <category>${category}</category>
      <source url="${SITE_URL}">${SITE_NAME}</source>
      <dc:creator>온시아 JOB</dc:creator>
    </item>`;
    }).join('');

    // RSS 피드 XML 구조
    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}/news</link>
    <description>부동산 전문가를 위한 AI 기반 구인구직 플랫폼 - 최신 부동산 뉴스</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/api/rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>${SITE_NAME}</title>
      <link>${SITE_URL}</link>
    </image>
    <webMaster>contact@onsia.city (온시아 JOB)</webMaster>
    <managingEditor>editor@onsia.city (온시아 JOB)</managingEditor>
    <copyright>Copyright ${new Date().getFullYear()} 온시아 JOB. All rights reserved.</copyright>
    <category>부동산</category>
    <category>뉴스</category>
    <category>구인구직</category>
    <ttl>60</ttl>
    ${rssItems}
  </channel>
</rss>`;

    return new NextResponse(rssFeed, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('RSS generation error:', error);

    // 에러 시 빈 피드 반환
    const emptyFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}/news</link>
    <description>부동산 뉴스 피드를 불러올 수 없습니다.</description>
    <language>ko-KR</language>
  </channel>
</rss>`;

    return new NextResponse(emptyFeed, {
      status: 500,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
      },
    });
  }
}
