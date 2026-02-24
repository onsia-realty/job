'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Eye, Share2, Copy, Loader2, Zap, ExternalLink,
} from 'lucide-react';
import Footer from '@/components/shared/Footer';

// ── Interfaces ──
interface ToonPanel {
  panel: number;
  characters: string[];
  dialogue: Record<string, string>;
  scene: string;
  mood: string;
  props: string[] | null;
  text_overlay: string | null;
  sfx: string | null;
  // 이전 형식 호환
  character?: string;
  thought?: string | null;
}

interface Episode {
  id: string;
  episode_number: number;
  title: string;
  subtitle: string;
  slug: string;
  category: string;
  article_html: string;
  article_summary: string;
  panels: ToonPanel[];
  toon_image_url: string | null;
  source_news_url: string | null;
  source_news_title: string | null;
  view_count: number;
  published_at: string;
  created_at: string;
}

// ── 카테고리 색상 ──
const CATEGORY_COLORS: Record<string, string> = {
  '시장동향': 'bg-blue-500',
  '분양정보': 'bg-emerald-500',
  '정책': 'bg-red-500',
  '전망': 'bg-purple-500',
  '부동산': 'bg-amber-500',
};

// ── 캐릭터 이미지 (이미지 없을 때 폴백용) ──
const CHARACTER_IMAGES: Record<string, string> = {
  '고양이 기자': '/images/toon/characters/cat.png',
  '영끌남': '/images/toon/characters/dog.png',
  '여우 관료': '/images/toon/characters/fox.png',
  '말 소장': '/images/toon/characters/horse.png',
  '다람쥐 아내': '/images/toon/characters/squirrel.png',
  '올빼미 교수': '/images/toon/characters/owl.png',
};

function resolveCharacterImage(name: string): string {
  if (CHARACTER_IMAGES[name]) return CHARACTER_IMAGES[name];
  const n = name.trim();
  if (/고양이|기자/.test(n)) return CHARACTER_IMAGES['고양이 기자'];
  if (/강아지|영끌|실수요자/.test(n)) return CHARACTER_IMAGES['영끌남'];
  if (/여우|관료|정부/.test(n)) return CHARACTER_IMAGES['여우 관료'];
  if (/말|소장|중개|부동산 아저씨/.test(n)) return CHARACTER_IMAGES['말 소장'];
  if (/다람쥐|아내|마누라/.test(n)) return CHARACTER_IMAGES['다람쥐 아내'];
  if (/올빼미|교수|전문가/.test(n)) return CHARACTER_IMAGES['올빼미 교수'];
  return CHARACTER_IMAGES['고양이 기자'];
}

// ── 패널 배경색 ──
const PANEL_COLORS = ['#fff8e1', '#e3f2fd', '#fce4ec', '#e8f5e9', '#f3e5f5', '#fff3e0', '#e0f7fa', '#fbe9e7'];

export default function ToonDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageFullscreen, setImageFullscreen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchEpisode = async () => {
      try {
        const res = await fetch(`/api/toon/${slug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setEpisode(data.episode);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchEpisode();
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share && episode) {
      try {
        await navigator.share({ title: episode.title, text: episode.article_summary, url: window.location.href });
      } catch { /* cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#e94560]" />
          <p className="text-gray-400 text-sm font-medium">에피소드 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl">😥</div>
        <p className="text-gray-500 text-lg font-medium">에피소드를 찾을 수 없습니다</p>
        <Link href="/toon" className="text-[#e94560] hover:underline text-sm font-medium">
          ← 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const panels: ToonPanel[] = Array.isArray(episode.panels) ? episode.panels : [];
  const hasToonImage = !!episode.toon_image_url;

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-50 bg-[#1a1a2e] shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-[1080px] mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/toon" className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[26px] tracking-[-1px]" style={{ fontFamily: "var(--font-black-han-sans), 'Black Han Sans', sans-serif" }}>
              부동산<span className="text-cyan-400">인</span>
            </span>
            <span className="bg-[#e94560] text-white text-[11px] font-bold px-2 py-[3px] rounded tracking-[1px] animate-pulse">
              BOOIN NEWS TOON
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/agent/jobs" className="text-white/70 text-sm font-medium hover:text-white transition-colors">공인중개사</Link>
            <Link href="/agent/jobs" className="text-white/70 text-sm font-medium hover:text-white transition-colors">분양상담사</Link>
            <Link href="/toon" className="text-white text-sm font-medium">BOOIN NEWS TOON</Link>
            <Link href="/news" className="text-white/70 text-sm font-medium hover:text-white transition-colors">뉴스</Link>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={handleShare} className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10" title="공유">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={handleCopyLink} className="text-white/70 hover:text-white transition-colors text-xs flex items-center gap-1 p-1.5 rounded-lg hover:bg-white/10" title="링크 복사">
              <Copy className="w-3.5 h-3.5" />
              {copied && <span className="text-cyan-400 font-bold">복사됨!</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ── 이미지 전체화면 모달 ── */}
      {imageFullscreen && episode.toon_image_url && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-zoom-out"
          onClick={() => setImageFullscreen(false)}
        >
          <button
            onClick={() => setImageFullscreen(false)}
            className="absolute top-5 right-5 text-white/70 hover:text-white text-3xl font-light z-10"
          >
            ✕
          </button>
          <img
            src={episode.toon_image_url}
            alt={episode.title}
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />
        </div>
      )}

      {/* ── 메인 2컬럼 레이아웃 (기사 좌, 웹툰 우=크게) ── */}
      <main className="max-w-[1400px] mx-auto px-5 py-8 md:py-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-8 lg:gap-10">

        {/* ── 좌측: 기사 ── */}
        <article className="min-w-0 order-2 lg:order-1">
          <span className={`inline-flex items-center gap-1.5 ${CATEGORY_COLORS[episode.category] || 'bg-[#e94560]'} text-white text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-[0.5px]`}>
            <Zap className="w-3.5 h-3.5" />
            BOOIN NEWS TOON 해설
          </span>

          <h1
            className="text-2xl md:text-[32px] leading-[1.3] text-[#1a1a2e] mb-2 tracking-[-1px]"
            style={{ fontFamily: "var(--font-black-han-sans), 'Black Han Sans', sans-serif" }}
          >
            {episode.title}
          </h1>
          {episode.subtitle && (
            <p className="text-base md:text-[17px] text-[#0f3460] font-medium leading-[1.5] mb-5">
              {episode.subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 md:gap-4 pb-5 border-b-2 border-gray-200 mb-7 text-[13px] text-gray-500">
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-purple-700 text-white px-2.5 py-0.5 rounded-xl text-[11px] font-bold">
              🤖 AI 해설
            </span>
            <span>{new Date(episode.published_at || episode.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {(episode.view_count || 0).toLocaleString()}
            </span>
          </div>

          <div
            className="prose prose-lg max-w-none
              [&_h3]:text-xl [&_h3]:font-black [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-[#1a1a2e] [&_h3]:pl-3.5 [&_h3]:border-l-4 [&_h3]:border-[#e94560]
              [&_p]:text-base [&_p]:leading-[1.9] [&_p]:mb-[18px] [&_p]:text-[#333] [&_p]:break-keep
              [&_.highlight-box]:bg-gradient-to-r [&_.highlight-box]:from-[#f0f4ff] [&_.highlight-box]:to-[#e8f0fe] [&_.highlight-box]:border-l-4 [&_.highlight-box]:border-[#0f3460] [&_.highlight-box]:px-6 [&_.highlight-box]:py-5 [&_.highlight-box]:rounded-r-xl [&_.highlight-box]:my-6 [&_.highlight-box]:text-[15px] [&_.highlight-box]:leading-[1.8]
              [&_strong]:text-[#e94560]"
            dangerouslySetInnerHTML={{ __html: episode.article_html }}
          />

          {episode.source_news_url && (
            <a
              href={episode.source_news_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs px-3.5 py-1.5 rounded-full hover:bg-gray-200 transition-colors mt-4"
            >
              <ExternalLink className="w-3 h-3" />
              원문 보기
            </a>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              🤖 부동산인 — AI 생성 콘텐츠
            </span>
          </div>
        </article>

        {/* ── 우측: 웹툰 ── */}
        <aside className="lg:sticky lg:top-[80px] self-start order-1 lg:order-2">
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-200">
            {/* 툰 헤더 */}
            <div className="bg-[#1a1a2e] px-5 py-4 flex items-center justify-between">
              <span
                className="text-white text-xl flex items-center gap-2"
                style={{ fontFamily: "var(--font-black-han-sans), 'Black Han Sans', sans-serif" }}
              >
                🦀 BOOIN NEWS TOON
              </span>
              <span className="bg-[#e94560] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-xl font-sans">
                EP.{String(episode.episode_number).padStart(2, '0')}
              </span>
            </div>

            {/* ── AI 생성 이미지가 있으면 그것을 표시 ── */}
            {hasToonImage ? (
              <div
                className="relative cursor-zoom-in group/img"
                onClick={() => setImageFullscreen(true)}
              >
                <img
                  src={episode.toon_image_url!}
                  alt={`${episode.title} - BOOIN NEWS TOON`}
                  className="w-full h-auto"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                  <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                    🔍 크게 보기
                  </span>
                </div>
              </div>
            ) : (
              /* ── 이미지 없으면 캐릭터 PNG + 텍스트 폴백 ── */
              <div>
                {panels.map((panel, idx) => {
                  // 이전 형식 (character 단일) / 새 형식 (characters 배열) 호환
                  const chars = panel.characters || (panel.character ? [panel.character] : []);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const raw = panel as any;
                  const dialogues: Record<string, string> = panel.dialogue || (panel.character && typeof raw.dialogue === 'string'
                    ? { [panel.character]: raw.dialogue as string }
                    : {});

                  return (
                    <div
                      key={idx}
                      className="relative overflow-hidden border-b-[3px] border-[#2d2d2d] last:border-b-0"
                      style={{ background: PANEL_COLORS[idx % PANEL_COLORS.length], minHeight: '160px' }}
                    >
                      {/* 패널 번호 */}
                      <div className="absolute top-2 left-2.5 z-10 w-6 h-6 bg-[#1a1a2e] text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {panel.panel || idx + 1}
                      </div>

                      {/* 시간 경과 오버레이 */}
                      {panel.text_overlay && (
                        <div className="absolute top-2 left-10 z-10 bg-[#1a1a2e] text-white text-xs font-bold px-3 py-1 rounded-lg">
                          {panel.text_overlay}
                        </div>
                      )}

                      {/* SFX */}
                      {panel.sfx && (
                        <span
                          className="absolute top-2 right-3 z-[5] pointer-events-none select-none"
                          style={{
                            fontFamily: "var(--font-black-han-sans), 'Black Han Sans', sans-serif",
                            fontSize: '22px',
                            color: '#e94560',
                            transform: 'rotate(-8deg)',
                            opacity: 0.7,
                          }}
                        >
                          {panel.sfx}
                        </span>
                      )}

                      {/* 패널 컨텐츠 */}
                      <div className="flex items-center gap-3 w-full h-full p-4 pt-5">
                        {/* 캐릭터들 */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-1" style={{ width: chars.length > 1 ? '130px' : '100px' }}>
                          <div className="flex items-end gap-1">
                            {chars.map((charName, ci) => (
                              <div key={ci} className="flex flex-col items-center">
                                <img
                                  src={resolveCharacterImage(charName)}
                                  alt={charName}
                                  className="w-[80px] h-[80px] object-contain drop-shadow-md"
                                  draggable={false}
                                />
                                <span
                                  className="text-[10px] font-bold text-gray-500 mt-0.5"
                                  style={{ fontFamily: "var(--font-gaegu), 'Gaegu', cursive" }}
                                >
                                  {charName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 말풍선 영역 */}
                        <div className="flex-1 flex flex-col gap-2">
                          {chars.map((charName, ci) => {
                            const text = typeof dialogues === 'string' ? dialogues : (dialogues[charName] || '');
                            if (!text) return null;
                            return (
                              <div
                                key={ci}
                                className="relative border-2 border-[#2d2d2d] rounded-2xl px-3.5 py-2.5 shadow-[2px_2px_0_rgba(0,0,0,0.1)] bg-white"
                                style={{ fontFamily: "var(--font-gaegu), 'Gaegu', cursive" }}
                              >
                                <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-[#2d2d2d]" />
                                <div className="absolute left-[-7px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-white" />
                                <p
                                  className="text-[15px] font-bold leading-[1.4] text-[#1a1a2e]"
                                  dangerouslySetInnerHTML={{
                                    __html: text
                                      .replace(/\n/g, '<br/>')
                                      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e94560">$1</strong>'),
                                  }}
                                />
                              </div>
                            );
                          })}

                          {/* 속마음 (이전 형식 호환) */}
                          {panel.thought && (
                            <div
                              className="border-2 border-dashed border-[#2d2d2d] rounded-2xl px-3.5 py-2 bg-white/70"
                              style={{ fontFamily: "var(--font-gaegu), 'Gaegu', cursive" }}
                            >
                              <p className="text-gray-500 text-sm leading-snug italic">{panel.thought}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 툰 푸터 */}
            <div className="px-5 py-3.5 flex items-center justify-between border-t border-gray-200 bg-[#fafafa]">
              <div className="flex gap-2">
                {['💬', '📷', '🔗', '💾'].map((emoji, i) => (
                  <button
                    key={i}
                    onClick={i === 2 ? handleCopyLink : handleShare}
                    className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-[#1a1a2e] hover:text-white hover:border-[#1a1a2e] transition-all text-sm"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(episode.published_at || episode.created_at).toLocaleDateString('ko-KR')} · EP.{String(episode.episode_number).padStart(2, '0')}
              </span>
            </div>
          </div>

          <Link
            href="/toon"
            className="flex items-center justify-center gap-1.5 mt-5 text-sm text-gray-500 hover:text-[#e94560] transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            다른 에피소드 보기
          </Link>
        </aside>
      </main>

      <Footer variant="simple" />
    </div>
  );
}
