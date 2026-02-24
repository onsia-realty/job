'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Eye, Newspaper, Loader2, Zap,
} from 'lucide-react';
import Footer from '@/components/shared/Footer';

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
  published_at: string;
  created_at: string;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  '시장동향': { bg: 'bg-blue-500', text: 'text-blue-400' },
  '분양정보': { bg: 'bg-emerald-500', text: 'text-emerald-400' },
  '정책': { bg: 'bg-red-500', text: 'text-red-400' },
  '전망': { bg: 'bg-purple-500', text: 'text-purple-400' },
  '부동산': { bg: 'bg-amber-500', text: 'text-amber-400' },
};

const EP_GRADIENTS = [
  'from-[#1a1a2e] via-[#16213e] to-[#0f3460]',
  'from-[#2d1b4e] via-[#1a1a2e] to-[#16213e]',
  'from-[#0f3460] via-[#1a1a2e] to-[#2d1b4e]',
  'from-[#1a1a2e] via-[#0f3460] to-[#1a1a2e]',
];

const ITEMS_PER_PAGE = 9;

export default function ToonListPage() {
  const [episodes, setEpisodes] = useState<ToonEpisode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEpisodes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/toon?page=${page}&limit=${ITEMS_PER_PAGE}`);
        const data = await res.json();
        setEpisodes(data.episodes || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error('에피소드 목록 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEpisodes();
  }, [page]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#141517] text-white">
      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-50 bg-[#1a1a2e] shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <ChevronLeft className="w-5 h-5" />
              <span
                className="text-2xl tracking-[-1px]"
                style={{ fontFamily: "var(--font-black-han-sans), 'Black Han Sans', sans-serif" }}
              >
                부동산<span className="text-cyan-400">인</span>
              </span>
            </Link>
            <span className="bg-[#e94560] text-white text-[11px] font-bold px-2 py-[3px] rounded tracking-[1px] animate-pulse">
              BOOIN NEWS TOON
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/news" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
              <Newspaper className="w-4 h-4" />
              뉴스
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* ── 히어로 ── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e94560]/10 border border-[#e94560]/30 rounded-full mb-6">
            <Zap className="w-4 h-4 text-[#e94560]" />
            <span className="text-sm text-[#e94560] font-bold tracking-wide">AI가 만드는 부동산 뉴스툰</span>
          </div>
          <h1
            className="text-4xl md:text-5xl mb-4"
            style={{ fontFamily: "var(--font-black-han-sans), 'Black Han Sans', sans-serif" }}
          >
            NEWS <span className="text-[#e94560]">TOON</span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto text-sm leading-relaxed">
            매일 부동산 뉴스를 4컷 만화와 해설 기사로 쉽고 재미있게 전달합니다.
          </p>
          {/* 미니 통계 */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e94560] animate-pulse" />
              총 {total}개 에피소드
            </span>
            <span>매일 업데이트</span>
          </div>
        </div>

        {/* ── 에피소드 그리드 ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-[#e94560] mb-4" />
            <p className="text-gray-500 text-sm">에피소드 불러오는 중...</p>
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-[#1C1D1F] flex items-center justify-center text-3xl mx-auto mb-4">🎨</div>
            <p className="text-gray-400 text-lg font-medium mb-2">아직 발행된 에피소드가 없습니다</p>
            <p className="text-gray-600 text-sm">곧 첫 번째 BOOIN NEWS TOON이 공개됩니다!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {episodes.map((ep, i) => {
                const catStyle = CATEGORY_STYLES[ep.category] || { bg: 'bg-gray-600', text: 'text-gray-400' };
                return (
                  <Link
                    key={ep.id}
                    href={`/toon/${ep.slug}`}
                    className="group bg-[#1C1D1F] rounded-2xl overflow-hidden border border-white/5 hover:border-[#e94560]/40 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(233,69,96,0.15)] hover:-translate-y-1"
                  >
                    {/* 썸네일 영역 */}
                    <div className={`relative h-48 bg-gradient-to-br ${EP_GRADIENTS[i % EP_GRADIENTS.length]} flex items-center justify-center overflow-hidden`}>
                      {ep.toon_image_url ? (
                        <img
                          src={ep.toon_image_url}
                          alt={ep.title}
                          className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <>
                          {/* 배경 패턴 */}
                          <div className="absolute inset-0 opacity-[0.03]"
                            style={{
                              backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                              backgroundSize: '20px 20px',
                            }}
                          />
                          {/* EP 넘버 (대형) */}
                          <div className="relative text-center">
                            <span
                              className="text-6xl text-white/[0.08] group-hover:text-white/[0.15] transition-all duration-500"
                              style={{ fontFamily: "var(--font-black-han-sans), 'Black Han Sans', sans-serif" }}
                            >
                              EP.{String(ep.episode_number).padStart(2, '0')}
                            </span>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                                🦀
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                      {/* 카테고리 뱃지 */}
                      <span className={`absolute top-3.5 left-3.5 ${catStyle.bg} text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg`}>
                        {ep.category}
                      </span>
                      {/* EP 뱃지 */}
                      <span className="absolute top-3.5 right-3.5 bg-[#e94560] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                        EP.{String(ep.episode_number).padStart(2, '0')}
                      </span>
                      {/* 하단 그라데이션 */}
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1C1D1F] to-transparent" />
                    </div>

                    {/* 콘텐츠 */}
                    <div className="p-5 pt-3">
                      <h3 className="font-bold text-[15px] leading-snug line-clamp-2 group-hover:text-[#e94560] transition-colors mb-2">
                        {ep.title}
                      </h3>
                      {ep.subtitle && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{ep.subtitle}</p>
                      )}
                      {ep.article_summary && !ep.subtitle && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{ep.article_summary}</p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-gray-600 pt-3 border-t border-white/5">
                        <span>{new Date(ep.published_at || ep.created_at).toLocaleDateString('ko-KR')}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {(ep.view_count || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* ── 페이지네이션 ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="p-2.5 rounded-xl bg-[#1C1D1F] border border-white/10 disabled:opacity-30 hover:border-[#e94560]/50 hover:bg-[#e94560]/10 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                      p === page
                        ? 'bg-[#e94560] text-white shadow-[0_2px_12px_rgba(233,69,96,0.4)]'
                        : 'bg-[#1C1D1F] border border-white/10 text-gray-400 hover:text-white hover:border-[#e94560]/50 hover:bg-[#e94560]/10'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2.5 rounded-xl bg-[#1C1D1F] border border-white/10 disabled:opacity-30 hover:border-[#e94560]/50 hover:bg-[#e94560]/10 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer variant="simple" />
    </div>
  );
}
