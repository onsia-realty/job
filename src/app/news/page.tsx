'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Newspaper, ChevronLeft, ChevronRight, Home } from 'lucide-react';

interface NewsItem {
  id: number;
  title: string;
  date: string;
  category: string;
  link: string;
  source: string;
  thumbnail: string;
}

const ITEMS_PER_PAGE = 8;

export default function NewsPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        const res = await fetch('/api/news?limit=50');
        const data = await res.json();
        setNewsItems(data.news);
      } catch (error) {
        console.error('뉴스 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  // 페이지네이션 계산
  const totalPages = Math.ceil(newsItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentNews = newsItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 카테고리별 색상
  const getCategoryColor = (category: string) => {
    switch (category) {
      case '시장동향': return 'bg-blue-500/20 text-blue-400';
      case '분양정보': return 'bg-purple-500/20 text-purple-400';
      case '정책': return 'bg-green-500/20 text-green-400';
      case '전망': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#141517] text-white">
      {/* 헤더 */}
      <header className="bg-[#1C1D1F] border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">홈</span>
              </Link>
              <div className="flex items-center gap-2">
                <Newspaper className="w-6 h-6 text-blue-400" />
                <h1 className="text-xl font-bold">부동산 뉴스</h1>
              </div>
            </div>
            <span className="text-sm text-gray-500">
              총 {newsItems.length}개의 뉴스
            </span>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">뉴스를 불러오는 중...</div>
          </div>
        ) : (
          <>
            {/* 뉴스 리스트 */}
            <div className="space-y-4 mb-8">
              {currentNews.map((news) => (
                <Link
                  key={news.id}
                  href={`/news/${news.id}`}
                  className="flex gap-4 p-4 bg-[#1C1D1F] rounded-xl hover:bg-[#252628] transition-colors group"
                >
                  {/* 썸네일 */}
                  <div className="w-32 h-20 sm:w-40 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-700">
                    <img
                      src={news.thumbnail}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop';
                      }}
                    />
                  </div>
                  {/* 콘텐츠 */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-block text-xs px-2 py-1 rounded-full ${getCategoryColor(news.category)}`}>
                          {news.category}
                        </span>
                        <span className="text-xs text-gray-500">{news.date}</span>
                      </div>
                      <h2 className="text-base sm:text-lg font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                        {news.title}
                      </h2>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-[#1C1D1F] hover:bg-[#252628] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-[#1C1D1F] hover:bg-[#252628] text-gray-400'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-[#1C1D1F] hover:bg-[#252628] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* 페이지 정보 */}
            <div className="text-center mt-4 text-sm text-gray-500">
              {currentPage} / {totalPages} 페이지
            </div>
          </>
        )}
      </main>
    </div>
  );
}
