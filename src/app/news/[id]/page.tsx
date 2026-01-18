import { Metadata } from 'next';
import Link from 'next/link';
import { Home, ArrowLeft, ExternalLink, Calendar, Tag, Building2 } from 'lucide-react';
import NewsImage from './NewsImage';

// 뉴스 데이터 가져오기
async function getNewsItem(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/news?limit=50`, {
      next: { revalidate: 600 },
    });
    const data = await res.json();
    return data.news.find((news: any) => news.id === parseInt(id)) || null;
  } catch (error) {
    return null;
  }
}

// 동적 메타데이터 생성 (SEO)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const news = await getNewsItem(id);

  if (!news) {
    return {
      title: '뉴스를 찾을 수 없습니다 - 온시아 JOB',
    };
  }

  return {
    title: `${news.title} - 온시아 JOB 부동산 뉴스`,
    description: `${news.category} | ${news.date} | ${news.source || '부동산 뉴스'} - 온시아 JOB에서 제공하는 부동산 뉴스`,
    keywords: ['부동산', '뉴스', news.category, '온시아', 'JOB', '구인구직'],
    openGraph: {
      title: news.title,
      description: `${news.category} | ${news.date}`,
      images: [news.thumbnail],
      type: 'article',
      publishedTime: news.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: news.title,
      description: `${news.category} | ${news.date}`,
      images: [news.thumbnail],
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
      name: news.source || '온시아 JOB',
    },
    publisher: {
      '@type': 'Organization',
      name: '온시아 JOB',
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

          {/* 관련 태그 */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-500 mb-3">관련 키워드</p>
            <div className="flex flex-wrap gap-2">
              {['부동산', news.category, '뉴스', '온시아', 'JOB'].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-[#252628] rounded-full text-sm text-gray-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* 사이트 홍보 */}
          <div className="mt-8 bg-gradient-to-br from-[#1a1f35] to-[#0d1117] rounded-xl p-6">
            <h3 className="text-lg font-bold mb-2">온시아 JOB</h3>
            <p className="text-gray-400 text-sm mb-4">
              부동산 전문가를 위한 AI 기반 구인구직 플랫폼
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm"
            >
              지금 시작하기 →
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
