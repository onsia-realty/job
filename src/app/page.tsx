'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2, HardHat, Newspaper,
  ArrowRight, ChevronRight,
  Sparkles, TrendingUp, User, Eye, Home
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/shared/Footer';
import AnnouncementSlider from '@/components/home/AnnouncementSlider';
import ServiceCard from '@/components/home/ServiceCard';

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

// 웹툰 에피소드 타입 정의
interface ToonEpisode {
  id: string;
  episode_number: number;
  title: string;
  subtitle: string;
  slug: string;
  category: string;
  article_summary: string;
  thumbnail_url: string | null;
  toon_image_url: string | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
}

const STAY_ENABLED = process.env.NEXT_PUBLIC_STAY_ENABLED === 'true';

// 광고 배너 데이터
const adBanners = [
  {
    id: 1,
    label: 'AI 실무비서',
    title: 'AI 부동산인 실무비서',
    description: '중개실무, AI에게 물어보세요',
    gradient: 'from-cyan-600 to-emerald-600',
    image: '/ai-assistant-banner.png',
    link: '/event/ai-assistant',
  },
  {
    id: 2,
    label: '시세 지도',
    title: '시세·거래량 지도',
    description: '주변 단지 실거래가, 한눈에 확인하세요',
    gradient: 'from-blue-600 to-cyan-600',
    link: '/market',
  },
];


// 공지사항 슬라이더 데이터
const announcements = [
  {
    id: 1,
    badge: '공지',
    title: '부동산인 정식 오픈!',
    description: '부동산 전문가를 위한 AI 기반 구인구직 플랫폼이 오픈했습니다.',
    link: null,
  },
  {
    id: 2,
    badge: 'AI',
    title: 'AI 부동산인 실무비서 오픈',
    description: '중개보수 계산, 특약 작성, 판례 검색까지 AI가 즉시 답변합니다.',
    link: '/event/ai-assistant',
  },
  {
    id: 3,
    badge: '업데이트',
    title: 'AI 매칭 시스템 업그레이드',
    description: '더욱 정확한 구인구직 매칭을 위한 AI 시스템이 개선되었습니다.',
    link: null,
  },
];




export default function LandingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [toonEpisodes, setToonEpisodes] = useState<ToonEpisode[]>([]);

  // 웹툰 에피소드 가져오기
  useEffect(() => {
    async function fetchToon() {
      try {
        const res = await fetch('/api/toon?limit=2');
        const data = await res.json();
        if (data.episodes) setToonEpisodes(data.episodes);
      } catch (error) {
        console.error('웹툰 로딩 실패:', error);
      }
    }
    fetchToon();
  }, []);

  // RSS 뉴스 가져오기 (sessionStorage 캐싱으로 뒤로가기 깜빡임 방지)
  useEffect(() => {
    const cached = sessionStorage.getItem('booin_news_cache');
    if (cached) {
      try {
        // Restore the browser-only cache after hydration before refreshing the feed.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNewsItems(JSON.parse(cached));
      } catch {}
    }
    async function fetchNews() {
      try {
        const res = await fetch('/api/news');
        const data = await res.json();
        setNewsItems(data.news);
        sessionStorage.setItem('booin_news_cache', JSON.stringify(data.news));
      } catch (error) {
        console.error('뉴스 로딩 실패:', error);
      }
    }
    fetchNews();
  }, []);

  return (
    <div className="min-h-screen bg-[#141517] text-white">
      {/* 헤더 */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-5">
          <div className="flex flex-wrap items-center justify-between gap-y-4">
            <div className="contents xl:flex xl:items-center xl:gap-8">
              <h1>
                <Link href="/" className="text-xl lg:text-2xl font-bold">
                  <span className="text-white">부동산</span>
                  <span className="text-cyan-400 font-bold">인</span>
                  <span className="sr-only"> - 부동산 전문가 구인구직 플랫폼</span>
                </Link>
              </h1>
              <nav className="order-1 hidden basis-full flex-wrap items-center gap-x-5 gap-y-3 md:flex xl:order-none xl:basis-auto">
                <Link href="/agent" className="text-gray-300 hover:text-white transition-colors">
                  공인중개사
                </Link>
                <Link href="/sales" className="text-gray-300 hover:text-white transition-colors">
                  분양상담사
                </Link>
                {STAY_ENABLED && (
                  <Link href="/stay" className="text-gray-300 hover:text-white transition-colors">
                    단기임대
                  </Link>
                )}
                <Link href="/event/premium" className="text-gray-300 hover:text-white transition-colors">
                  플랫폼 소개
                </Link>
                <Link href="/event/ai-assistant" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                  AI 실무비서
                </Link>
                <Link href="/toon" className="text-gray-300 hover:text-white transition-colors">
                  BOOIN AI 웹툰
                </Link>
                <span aria-disabled="true" className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-gray-500">커뮤니티 <span className="rounded bg-white/5 px-1.5 text-[10px]">준비 중</span></span>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span aria-disabled="true" className="hidden 2xl:inline-flex items-center gap-1.5 text-sm text-gray-500">검색 <span className="rounded bg-white/5 px-1.5 text-[10px]">준비 중</span></span>
              {authLoading ? (
                <div className="w-16 h-9" />
              ) : user ? (
                <Link
                  href="/agent/mypage"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 text-sm text-gray-300 hover:text-white transition-colors font-medium"
                >
                  <User className="w-4 h-4" />
                  {user.user_metadata?.name || '마이페이지'}
                </Link>
              ) : (
                <Link
                  href="/agent/auth/login"
                  className="inline-flex min-h-[44px] items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 bg-[#FEE500] text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-[#FDD800] transition-colors"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        {/* 히어로 섹션 - 슬라이더 */}
        <section className="mb-10 lg:mb-16">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            <AnnouncementSlider items={announcements} />

            {/* 우측: 플랫폼 소개 + 광고 배너 */}
            <div className="hidden md:flex flex-col gap-4">
              {/* 광고 배너 - 데스크톱 전용 */}
              <div className="hidden md:block bg-gradient-to-br from-[#1a1f35] to-[#0d1117] rounded-2xl border border-white/10 p-5 flex-1 relative overflow-hidden">
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
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      <span>최대 1주일 상위 노출</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span>조회수 최대 5배 증가</span>
                    </div>
                    <Link
                      href="/premium"
                      className="block w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-center font-medium hover:from-cyan-400 hover:to-blue-400 transition-all"
                    >
                      광고 문의하기
                    </Link>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* 서비스 선택 → 모바일 소개 → 영상 순서. 데스크톱에서는 영상이 왼쪽에 배치됩니다. */}
        <section className="mb-10 lg:mb-16" aria-label="서비스와 소개 영상">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
            <div className="flex flex-col gap-4 md:col-start-3 md:row-start-1 md:h-[400px] lg:h-[480px]" aria-label="서비스 선택">
              <ServiceCard href="/agent/jobs" img="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop" title="공인중개사" desc="중개사무소 구인구직" Icon={Building2} accent="bg-cyan-400" className="flex md:hidden" />
              <ServiceCard href="/agent" img="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop" title="공인중개사" desc="중개사무소 구인구직" Icon={Building2} accent="bg-cyan-400" className="hidden md:flex" />
              <ServiceCard href="/sales" img="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop" title="분양상담사" desc="분양현장 구인구직" Icon={HardHat} accent="bg-blue-400" className="flex" />
              {STAY_ENABLED && <ServiceCard href="/stay" img="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop" title="단기임대" desc="검증된 안심 단기임대" Icon={Home} accent="bg-emerald-400" className="flex" />}
            </div>
              {/* 플랫폼 소개 배너 - 모바일 전용 */}
              <Link
                href="/event/premium"
                className="block md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] hover:border-amber-400/40 transition-all duration-500 group"
              >
                {/* 상단 네온 라인 */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                {/* 배경 글로우 */}
                <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/[0.07] rounded-full blur-2xl" />
                <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-cyan-500/[0.05] rounded-full blur-2xl" />
                {/* 도트 패턴 */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                <div className="relative z-10 px-5 py-6">
                  <div className="flex items-center gap-4">
                    {/* 네온 글로우 아이콘 */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-amber-400/30 rounded-2xl blur-xl group-hover:bg-amber-400/50 transition-all duration-500" />
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                        <Sparkles className="w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                      </div>
                    </div>
                    {/* 텍스트 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-amber-300 text-[15px] font-bold tracking-tight">부동산인</p>
                      <p className="text-gray-400 text-xs mt-0.5 tracking-wide">AI 구인구직 플랫폼</p>
                    </div>
                    {/* CTA 버튼 */}
                    <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.1] text-amber-300 text-xs font-semibold group-hover:bg-amber-400/10 group-hover:border-amber-400/30 transition-all duration-300">
                      <span>소개 보기</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
                {/* 하단 네온 라인 */}
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              </Link>


            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 md:col-span-2 md:col-start-1 md:row-start-1 md:aspect-auto md:h-[400px] lg:h-[480px]">
              <video
                aria-label="부동산인 플랫폼 소개 영상"
                src="https://pkbnudkbkhzqjhwffkbj.supabase.co/storage/v1/object/public/job-images/videos/intro-main.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* 프리미엄 채용공고 - 모바일 전용 */}
        <section className="mb-10 md:hidden">
          <div className="bg-gradient-to-br from-[#1a1f35] to-[#0d1117] rounded-2xl border border-white/10 p-5 min-h-[200px] relative overflow-hidden">
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
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span>최대 1주일 상위 노출</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span>조회수 최대 5배 증가</span>
                </div>
                <Link
                  href="/premium"
                  className="block w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-center font-medium hover:from-cyan-400 hover:to-blue-400 transition-all"
                >
                  광고 문의하기
                </Link>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl" />
          </div>
        </section>

        {/* 부동산 뉴스 + 광고 배너 */}
        <section className="mb-10 lg:mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* BOOIN AI 웹툰 + 부동산 뉴스 (2/3) */}
            <div className="md:col-span-2 space-y-6">
              {/* 상단: BOOIN AI 웹툰 */}
              {toonEpisodes.length > 0 && (
                <div className="bg-[#1C1D1F] rounded-2xl border border-white/10 p-5 lg:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🦀</span>
                      <h3 className="text-lg font-bold">BOOIN NEWS TOON</h3>
                    </div>
                    <Link href="/toon" className="inline-flex min-h-[44px] items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 text-sm text-gray-400 hover:text-white transition-colors">
                      전체보기 <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {toonEpisodes.map((ep) => (
                      <Link
                        key={ep.id}
                        href={`/toon/${ep.slug}`}
                        className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 overflow-hidden bg-[#252628] hover:bg-[#2a2b2d] transition-colors group"
                      >
                        {ep.toon_image_url && (
                          <div className="relative w-full h-[140px] lg:h-[180px] overflow-hidden">
                            <Image
                              src={ep.toon_image_url}
                              alt={ep.title}
                              fill
                              sizes="(max-width: 768px) 50vw, 33vw"
                              className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="p-3">
                          <h4 className="font-medium text-white text-sm line-clamp-1 mb-1.5">{ep.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="text-cyan-400 font-medium">EP.{String(ep.episode_number).padStart(2, '0')}</span>
                            <span>{ep.category}</span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {ep.view_count.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 하단: 부동산 뉴스 (기존 UI) */}
              <div className="bg-[#1C1D1F] rounded-2xl border border-white/10 p-5 lg:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Newspaper className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-medium">부동산 뉴스</h3>
                </div>
                <div className="space-y-3">
                  {newsItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">뉴스를 불러오는 중...</div>
                  ) : (
                    newsItems.slice(0, 3).map((news) => (
                      <a
                        key={news.id}
                        href={news.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-4 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 bg-[#252628] rounded-xl hover:bg-[#2a2b2d] transition-colors group"
                      >
                        <div className="w-24 h-16 lg:w-32 lg:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-700 relative">
                          <Image
                            src={news.thumbnail || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'}
                            alt=""
                            fill
                            sizes="96px"
                            className="object-cover"
                            loading="lazy"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <span className="inline-block text-xs text-blue-400 mb-1 w-fit">{news.category}</span>
                          <h4 className="font-medium text-white line-clamp-2 text-sm lg:text-base leading-tight">{news.title}</h4>
                        </div>
                      </a>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 광고 배너 (1/3) - 모바일 숨김 */}
            <div className="hidden md:flex flex-col gap-4">
              {/* SPONSORED / PROMOTION 배너 */}
              {adBanners.map((banner) => {
                const inner = (
                  <div className="h-full flex flex-col">
                    {banner.image ? (
                      <>
                        <div className="relative flex-1 min-h-[80px] -mx-6 -mt-6 mb-3">
                          <Image
                            src={banner.image}
                            alt=""
                            fill
                            sizes="33vw"
                            className="object-cover object-top rounded-t-2xl"
                            loading="lazy"
                          />
                        </div>
                        <div className="mt-auto">
                          <span className="text-xs text-white/70 font-medium">{banner.label}</span>
                          <h4 className="text-base font-bold text-white mt-1">{banner.title}</h4>
                          <p className="text-xs text-white/80 mt-0.5">{banner.description}</p>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col justify-between">
                        <span className="text-xs text-white/70 font-medium">{banner.label}</span>
                        <div>
                          <h4 className="text-lg font-bold text-white mb-1">{banner.title}</h4>
                          <p className="text-sm text-white/80">{banner.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
                return banner.link ? (
                  <Link
                    key={banner.id}
                    href={banner.link}
                    className={`flex-1 bg-gradient-to-br ${banner.gradient} rounded-2xl border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 p-6 lg:p-8 min-h-[140px] lg:min-h-[160px] hover:opacity-90 transition-opacity overflow-hidden`}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={banner.id}
                    className={`flex-1 bg-gradient-to-br ${banner.gradient} rounded-2xl p-6 lg:p-8 min-h-[140px] lg:min-h-[160px] opacity-80 overflow-hidden`}
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 하단 배너 */}
        <section className="mb-10 lg:mb-16">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#1a1f35] to-[#0f172a] p-8 lg:p-10">
            <div className="relative z-10">
              <h3 className="text-xl lg:text-2xl font-bold mb-2">
                함께 성장하는<br className="md:hidden" /> 부동산 전문가 커뮤니티
              </h3>
              <p className="text-gray-400 mb-4">
                부동산인 커뮤니티에서 정보를 공유하고 네트워킹하세요
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FEE500]/10 border border-[#FEE500]/20 rounded-full">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#FEE500">
                  <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.83 1.9 5.31 4.75 6.72l-.92 3.38c-.08.28.28.5.52.33l4.08-2.73c.52.07 1.05.1 1.57.1 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                </svg>
                <span className="text-sm text-[#FEE500]/90 font-medium">카카오톡 오픈채팅방 준비 중입니다</span>
              </div>
            </div>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl" />
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
