'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, HardHat, Newspaper,
  ArrowRight, ChevronLeft, ChevronRight,
  Sparkles, TrendingUp
} from 'lucide-react';

// 뉴스 타입 정의
interface NewsItem {
  id: number;
  title: string;
  date: string;
  category: string;
  link: string;
  source: string;
  thumbnail: string;
}

// 광고 배너 데이터
const adBanners = [
  {
    id: 1,
    label: 'SPONSORED',
    title: '프리미엄 광고 50% 할인',
    description: '오픈 기념 특별 프로모션',
    gradient: 'from-purple-600 to-blue-600',
  },
  {
    id: 2,
    label: 'PROMOTION',
    title: 'AI 매칭 서비스 오픈',
    description: '나에게 딱 맞는 현장을 추천받으세요',
    gradient: 'from-orange-500 to-pink-500',
  },
];


// 공지사항 슬라이더 데이터
const announcements = [
  {
    id: 1,
    badge: '공지',
    title: '온시아 JOB 정식 오픈!',
    description: '부동산 전문가를 위한 AI 기반 구인구직 플랫폼이 오픈했습니다.',
    color: 'from-purple-500 to-blue-500',
  },
  {
    id: 2,
    badge: '이벤트',
    title: '프리미엄 광고 50% 할인',
    description: '오픈 기념 프리미엄 현장 광고 할인 이벤트를 진행합니다.',
    color: 'from-orange-500 to-pink-500',
  },
  {
    id: 3,
    badge: '업데이트',
    title: 'AI 매칭 시스템 업그레이드',
    description: '더욱 정확한 구인구직 매칭을 위한 AI 시스템이 개선되었습니다.',
    color: 'from-cyan-500 to-green-500',
  },
];




export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  // 자동 슬라이드
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // RSS 뉴스 가져오기
  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/news');
        const data = await res.json();
        setNewsItems(data.news);
      } catch (error) {
        console.error('뉴스 로딩 실패:', error);
      }
    }
    fetchNews();
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % announcements.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + announcements.length) % announcements.length);

  return (
    <div className="min-h-screen bg-[#141517] text-white">
      {/* 헤더 */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold">
                <span className="text-white">onsia</span>
                <span className="text-gray-400 font-normal ml-1">job</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/agent" className="text-gray-300 hover:text-white transition-colors">
                  공인중개사
                </Link>
                <Link href="/sales" className="text-gray-300 hover:text-white transition-colors">
                  분양상담사
                </Link>
                <Link href="/news" className="text-gray-300 hover:text-white transition-colors">
                  뉴스
                </Link>
                <Link href="/community" className="text-gray-300 hover:text-white transition-colors">
                  커뮤니티
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <span className="text-sm">검색</span>
              </button>
              <Link
                href="/agent/auth/login"
                className="bg-[#FEE500] text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-[#FDD800] transition-colors"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 히어로 섹션 - 슬라이더 */}
        <section className="mb-12">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            {/* 좌측: 공지 슬라이더 */}
            <div className="relative">
              <div className={`bg-gradient-to-br ${announcements[currentSlide].color} rounded-2xl p-8 min-h-[280px] flex flex-col justify-between`}>
                <div>
                  <span className="inline-block bg-white/20 text-white text-xs px-3 py-1 rounded-full mb-4">
                    {announcements[currentSlide].badge}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3">
                    {announcements[currentSlide].title}
                  </h2>
                  <p className="text-white/80">
                    {announcements[currentSlide].description}
                  </p>
                </div>
                {/* 슬라이더 컨트롤 */}
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex gap-2">
                    {announcements.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentSlide ? 'bg-white w-6' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1 ml-auto">
                    <button
                      onClick={prevSlide}
                      className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측: 광고 배너 */}
            <div className="bg-gradient-to-br from-[#1a1f35] to-[#0d1117] rounded-2xl p-6 min-h-[280px] relative overflow-hidden">
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-white/10 rounded text-[10px] text-gray-400">AD</div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <p className="text-cyan-400 text-sm font-medium mb-2">PREMIUM</p>
                  <h3 className="text-xl font-bold mb-2">프리미엄 채용공고</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    상위 노출로 최고의 인재를<br />
                    빠르게 만나보세요
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span>7일간 상위 노출</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span>조회수 3배 증가</span>
                  </div>
                  <Link
                    href="/premium"
                    className="block w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-center font-medium hover:from-cyan-400 hover:to-blue-400 transition-all"
                  >
                    광고 문의하기
                  </Link>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
            </div>
          </div>
        </section>

        {/* 미디어 섹션 (직방 스타일 - 영상 2/3 + 카테고리 1/3) */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 영상 (2/3) */}
            <div className="md:col-span-2 relative rounded-lg overflow-hidden h-[400px]">
              <video
                src="/intro.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            {/* 카테고리 카드 (1/3) */}
            <div className="flex flex-col gap-4 h-[400px]">
              {/* 공인중개사 */}
              <Link
                href="/agent"
                className="flex-1 relative rounded-lg overflow-hidden group cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop"
                  alt="공인중개사"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <Building2 className="w-10 h-10 mb-2" />
                  <h3 className="text-xl font-bold">공인중개사</h3>
                  <p className="text-sm text-white/80 mt-1">중개사무소 구인구직</p>
                </div>
              </Link>

              {/* 분양상담사 */}
              <Link
                href="/sales"
                className="flex-1 relative rounded-lg overflow-hidden group cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop"
                  alt="분양상담사"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-900/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <HardHat className="w-10 h-10 mb-2" />
                  <h3 className="text-xl font-bold">분양상담사</h3>
                  <p className="text-sm text-white/80 mt-1">분양현장 구인구직</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* 부동산 뉴스 + 광고 배너 */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 부동산 뉴스 (2/3) */}
            <div className="md:col-span-2 bg-[#1C1D1F] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-medium">부동산 뉴스</h3>
              </div>
              <div className="space-y-3">
                {newsItems.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">뉴스를 불러오는 중...</div>
                ) : (
                  newsItems.map((news) => (
                    <a
                      key={news.id}
                      href={news.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-4 p-3 bg-[#252628] rounded-xl hover:bg-[#2a2b2d] transition-colors group"
                    >
                      {/* 썸네일 */}
                      <div className="w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-700">
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
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className="inline-block text-xs text-blue-400 mb-1 w-fit">{news.category}</span>
                        <h4 className="font-medium text-white line-clamp-2 text-sm leading-tight">{news.title}</h4>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>

            {/* 광고 배너 (1/3) */}
            <div className="flex flex-col gap-4">
              {adBanners.map((banner) => (
                <Link
                  key={banner.id}
                  href="/ads"
                  className={`flex-1 bg-gradient-to-br ${banner.gradient} rounded-2xl p-6 flex flex-col justify-between min-h-[140px] hover:opacity-90 transition-opacity`}
                >
                  <span className="text-xs text-white/70 font-medium">{banner.label}</span>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">{banner.title}</h4>
                    <p className="text-sm text-white/80">{banner.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 하단 배너 */}
        <section className="mb-16">
          <Link
            href="/community"
            className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a1f35] to-[#0f172a] p-8"
          >
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">
                함께 성장하는 부동산 전문가 커뮤니티
              </h3>
              <p className="text-gray-400">
                온시아 커뮤니티에서 정보를 공유하고 네트워킹하세요
              </p>
            </div>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl" />
          </Link>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">© Onsia Corp.</p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
              <Link href="/privacy" className="hover:text-white transition-colors font-medium text-gray-300">개인정보 처리방침</Link>
              <Link href="/contact" className="hover:text-white transition-colors">문의하기</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
