import { Metadata } from 'next';
import Link from 'next/link';
import { Home, ArrowLeft, ExternalLink, Calendar, Tag, Building2 } from 'lucide-react';
import NewsImage from './NewsImage';

// 뉴스 데이터 가져오기
async function getNewsItem(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/news?limit=50`, {
      next: { revalidate: 10800 }, // 3시간 캐시
    });
    const data = await res.json();
    return data.news.find((news: any) => news.id === parseInt(id)) || null;
  } catch (error) {
    return null;
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://onsia.city';

// 동적 메타데이터 생성 (SEO)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const news = await getNewsItem(id);

  if (!news) {
    return {
      title: '뉴스를 찾을 수 없습니다 - 부동산인',
    };
  }

  const canonicalUrl = `${SITE_URL}/news/${id}`;
  const description = `${news.category} | ${news.date} | ${news.source || '부동산 뉴스'} - 부동산인에서 제공하는 최신 부동산 뉴스. 분양정보, 시장동향, 정책 변화를 확인하세요.`;

  return {
    title: `${news.title} | 부동산인 부동산 뉴스`,
    description,
    keywords: ['부동산', '뉴스', news.category, '부동산인', 'BOOIN', '구인구직', '분양정보', '시장동향', '부동산 전문가'],
    authors: [{ name: '부동산인', url: SITE_URL }],
    creator: '부동산인',
    publisher: '부동산인',
    openGraph: {
      title: news.title,
      description,
      url: canonicalUrl,
      siteName: '부동산인',
      images: [
        {
          url: news.thumbnail,
          width: 1200,
          height: 630,
          alt: news.title,
        },
      ],
      type: 'article',
      publishedTime: news.date,
      locale: 'ko_KR',
      authors: ['부동산인'],
    },
    twitter: {
      card: 'summary_large_image',
      title: news.title,
      description,
      images: [news.thumbnail],
      creator: '@booin_kr',
    },
    alternates: {
      canonical: canonicalUrl,
      types: {
        'application/rss+xml': `${SITE_URL}/api/rss`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'article:section': news.category,
      'article:published_time': news.date,
      'google-news-keywords': `부동산,${news.category},부동산인,BOOIN`,
    },
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const news = await getNewsItem(id);

  if (!news) {
    return (
      <div className="min-h-screen bg-[#141517] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">뉴스를 찾을 수 없습니다</h1>
          <Link href="/news" className="text-blue-400 hover:underline">
            뉴스 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // 카테고리별 색상
  const getCategoryColor = (category: string) => {
    switch (category) {
      case '시장동향': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case '분양정보': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case '정책': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case '전망': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // 구조화된 데이터 (JSON-LD) - SEO용
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: news.title,
    image: news.thumbnail,
    datePublished: news.date,
    author: {
      '@type': 'Organization',
      name: news.source || '부동산인',
    },
    publisher: {
      '@type': 'Organization',
      name: '부동산인',
      logo: {
        '@type': 'ImageObject',
        url: 'https://onsia.city/logo.png',
      },
    },
    description: `${news.category} - 부동산 뉴스`,
  };

  return (
    <>
      {/* 구조화된 데이터 삽입 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#141517] text-white">
        {/* 헤더 */}
        <header className="bg-[#1C1D1F] border-b border-gray-800">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <Home className="w-5 h-5" />
              </Link>
              <Link href="/news" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>뉴스 목록</span>
              </Link>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="max-w-3xl mx-auto px-4 py-8">
          {/* 썸네일 이미지 */}
          <div className="w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden mb-6 bg-gray-800">
            <NewsImage
              src={news.thumbnail}
              alt={news.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 메타 정보 */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border ${getCategoryColor(news.category)}`}>
              <Tag className="w-3.5 h-3.5" />
              {news.category}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              {news.date}
            </span>
            {news.source && (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                <Building2 className="w-3.5 h-3.5" />
                {news.source}
              </span>
            )}
          </div>

          {/* 제목 */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 leading-tight">
            {news.title}
          </h1>

          {/* 설명 */}
          <div className="bg-[#1C1D1F] rounded-xl p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              이 뉴스는 <strong className="text-white">{news.source || '외부 매체'}</strong>에서 제공한 부동산 관련 기사입니다.
              원문을 확인하시려면 아래 버튼을 클릭해주세요.
            </p>
          </div>

          {/* 원문 보기 버튼 */}
          <a
            href={news.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-medium text-lg hover:from-blue-400 hover:to-cyan-400 transition-all"
          >
            <ExternalLink className="w-5 h-5" />
            원문 기사 보기
          </a>

          {/* 관련 태그 (SEO 키워드) */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-500 mb-3">관련 키워드</p>
            <div className="flex flex-wrap gap-2">
              {['부동산', news.category, '뉴스', '분양정보', '시장동향', '공인중개사', '분양상담사'].map((tag) => (
                <Link
                  key={tag}
                  href="/news"
                  className="px-3 py-1 bg-[#252628] rounded-full text-sm text-gray-400 hover:bg-[#353638] hover:text-white transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          {/* 내부 백링크 섹션 */}
          <nav className="mt-8 bg-[#1C1D1F] rounded-xl p-6" aria-label="관련 서비스">
            <h3 className="text-lg font-bold mb-4 text-white">부동산인 서비스</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/sales"
                className="flex items-center gap-3 p-3 bg-[#252628] rounded-lg hover:bg-[#353638] transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white group-hover:text-blue-400 transition-colors">분양대행사</p>
                  <p className="text-xs text-gray-500">채용 정보 확인</p>
                </div>
              </Link>
              <Link
                href="/agent"
                className="flex items-center gap-3 p-3 bg-[#252628] rounded-lg hover:bg-[#353638] transition-colors group"
              >
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-white group-hover:text-green-400 transition-colors">중개사무소</p>
                  <p className="text-xs text-gray-500">구인 정보 확인</p>
                </div>
              </Link>
              <Link
                href="/agent/jobs"
                className="flex items-center gap-3 p-3 bg-[#252628] rounded-lg hover:bg-[#353638] transition-colors group"
              >
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-white group-hover:text-purple-400 transition-colors">분양상담사 채용</p>
                  <p className="text-xs text-gray-500">최신 채용 공고</p>
                </div>
              </Link>
              <Link
                href="/agent/jobs"
                className="flex items-center gap-3 p-3 bg-[#252628] rounded-lg hover:bg-[#353638] transition-colors group"
              >
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-white group-hover:text-orange-400 transition-colors">공인중개사 채용</p>
                  <p className="text-xs text-gray-500">중개사무소 구인</p>
                </div>
              </Link>
            </div>
          </nav>

          {/* 사이트 홍보 + RSS 구독 */}
          <div className="mt-8 bg-gradient-to-br from-[#1a1f35] to-[#0d1117] rounded-xl p-6">
            <h3 className="text-lg font-bold mb-2">부동산인</h3>
            <p className="text-gray-400 text-sm mb-4">
              부동산 전문가를 위한 AI 기반 구인구직 플랫폼. 최신 부동산 뉴스와 채용 정보를 한곳에서 확인하세요.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
              >
                지금 시작하기 →
              </Link>
              <a
                href="/api/rss"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                RSS 구독
              </a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
