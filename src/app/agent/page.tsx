'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { agentJobsSample } from '@/data/agentJobsSample';
import PriceTable from '@/components/market/PriceTable';
import type { AgentJobListing, AgentJobType, AgentJobTier, AgentSalaryType, AgentExperience } from '@/types';

/* =========================================================================
   BOOIN 공인중개사 메인 v2 — 핸드오프(dc-template.html) 충실 이식
   디자인 = 인라인 스타일 1:1 (색 hex/간격 px 그대로)
   데이터 = 우리 실 jobs(supabase category=agent) + agentJobsSample 병합
   실로직 보존: DB 머지(jobs-v1 패턴) · fillTo 채움(sales 패턴) · 티어 분류 · 검색/필터/지역
   추가: 좌측 네비 아파트/오피스텔 시세 → 슬라이드 인 패널(폭 440px, Phase 2 마운트 지점)
   ========================================================================= */

// 썸네일 그라데이션 (네이비/시안 계열, README 명세) — seed % len 순환
const GRADS = [
  'linear-gradient(135deg,#0F172A,#0E7490)',
  'linear-gradient(135deg,#164E63,#0891B2)',
  'linear-gradient(135deg,#1E293B,#155E75)',
  'linear-gradient(135deg,#0C4A6E,#0891B2)',
  'linear-gradient(135deg,#134E4A,#10B981)',
  'linear-gradient(135deg,#0C4A6E,#10B981)',
  'linear-gradient(135deg,#1E293B,#0891B2)',
];

// 매물유형 필터 칩 (라벨 → AgentJobType | null(전체))
const TYPE_CHIPS: { label: string; value: AgentJobType | null }[] = [
  { label: '전체', value: null },
  { label: '아파트', value: 'apartment' },
  { label: '오피스텔', value: 'officetel' },
  { label: '빌라·다세대', value: 'villa' },
  { label: '상가', value: 'store' },
  { label: '사무실', value: 'office' },
  { label: '빌딩매매', value: 'building' },
  { label: '경매', value: 'auction' },
];

const REGION_OPTIONS = ['전체 지역', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

// 실무 바로가기 8종 (외부 6 + 내부 2)
const SHORTCUTS: { label: string; short: string; href: string; ext: boolean; icon: 'gov' | 'iros' | 'rt' | 'eum' | 'eais' | 'tax' | 'doc' | 'map' }[] = [
  { label: '정부24', short: '정부24 ↗', href: 'https://www.gov.kr', ext: true, icon: 'gov' },
  { label: '등기부등본', short: '등기부 ↗', href: 'http://www.iros.go.kr', ext: true, icon: 'iros' },
  { label: '실거래가', short: '실거래가 ↗', href: 'https://rt.molit.go.kr', ext: true, icon: 'rt' },
  { label: '토지이음', short: '토지이음 ↗', href: 'https://www.eum.go.kr', ext: true, icon: 'eum' },
  { label: '건축물대장', short: '건축물 ↗', href: 'https://cloud.eais.go.kr', ext: true, icon: 'eais' },
  { label: '홈택스', short: '홈택스 ↗', href: 'https://hometax.go.kr', ext: true, icon: 'tax' },
  { label: '계약서 양식', short: '계약서', href: '/agent/tools/contracts', ext: false, icon: 'doc' },
  { label: '시세지도', short: '시세지도', href: '/market', ext: false, icon: 'map' },
];

function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
const grad = (seed: number) => GRADS[seed % GRADS.length];

// 섹션을 목표 슬롯 수까지 채움 — 실데이터 부족분 회전 노출 (sales/page.tsx fillTo 패턴)
function fillTo<T extends { id: string }>(list: T[], n: number): T[] {
  if (list.length === 0 || list.length >= n) return list;
  const out = [...list];
  while (out.length < n) {
    const base = list[out.length % list.length];
    out.push({ ...base, id: `${base.id}__f${out.length}` });
  }
  return out;
}
const realId = (id: string) => id.split('__f')[0];

// 카드 상태 배지 (badges → HOT/NEW)
function cardBadge(badges: AgentJobListing['badges']): { label: string; bg: string } | null {
  if (badges?.some((b) => b === 'hot' || b === 'urgent')) return { label: 'HOT', bg: '#EF4444' };
  if (badges?.some((b) => b === 'new')) return { label: 'NEW', bg: '#10B981' };
  return null;
}
// 급여 표기: amount 문자열 그대로, 없으면 협의
const payText = (j: AgentJobListing) => j.salary?.amount || '협의';
// 지역 라벨: region + 주소 첫 구/동 (예: 서울 강남)
function regionLabel(j: AgentJobListing): string {
  const dist = (j.address || '').trim().split(/\s+/)[0]?.replace(/(구|동|시)$/, '') || '';
  return dist ? `${j.region} ${dist}` : j.region;
}
// 썸네일 워터마크(라틴 느낌) — 주소 구/동 로마자 매핑, 없으면 지역
const ROMAN: Record<string, string> = {
  강남: 'GANGNAM', 서초: 'SEOCHO', 송파: 'SONGPA', 마포: 'MAPO', 강서: 'GANGSEO', 강동: 'GANGDONG',
  분당: 'BUNDANG', 판교: 'PANGYO', 수원: 'SUWON', 성남: 'SEONGNAM', 송도: 'SONGDO', 인천: 'INCHEON',
  용산: 'YONGSAN', 영등포: 'YEONGDEUNGPO', 광교: 'GWANGGYO', 잠실: 'JAMSIL', 반포: 'BANPO',
};
function watermark(j: AgentJobListing): string {
  const dist = (j.address || '').trim().split(/\s+/)[0]?.replace(/(구|동|시)$/, '') || '';
  return ROMAN[dist] || ROMAN[j.region] || 'BOOIN';
}
// 마감 D-day (마운트 후에만 계산 — 하이드레이션 불일치 방지)
function ddayInfo(mounted: boolean, deadline?: string, isAlways?: boolean): { label: string; color: string } {
  if (!mounted) return { label: '—', color: '#94A3B8' };
  if (isAlways || !deadline) return { label: '상시', color: '#64748B' };
  const d = Math.ceil((new Date(deadline + 'T23:59:59').getTime() - Date.now()) / 86400000);
  if (d < 0) return { label: '마감', color: '#94A3B8' };
  if (d === 0) return { label: '오늘마감', color: '#DC2626' };
  return { label: `D-${d}`, color: d <= 3 ? '#DC2626' : '#64748B' };
}

// ── DB row → AgentJobListing (jobs-v1 백업의 매핑 로직 보존) ──
function mapDbAgentJob(job: any): AgentJobListing {
  return {
    id: job.id,
    title: job.title,
    description: job.description || '',
    type: job.type as AgentJobType,
    tier: (job.tier || 'normal') as AgentJobTier,
    badges: job.badges || [],
    salary: { type: (job.salary_type || 'monthly') as AgentSalaryType, amount: job.salary_amount || undefined },
    experience: job.experience || '경력무관',
    experienceLevel: (job.experience || 'none') as AgentExperience,
    company: job.company || '',
    region: job.region || '',
    address: job.address || undefined,
    thumbnail: job.thumbnail || undefined,
    views: job.views || 0,
    applicants: 0,
    createdAt: new Date(job.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, ''),
    deadline: job.deadline || undefined,
    isAlwaysRecruiting: job.is_always_recruiting || undefined,
    benefits: job.benefits || [],
    contactName: job.contact_name || undefined,
    contactPhone: job.phone || undefined,
  };
}

// 좌측 네비 아이콘 (실무 바로가기 8종)
function ShortcutIcon({ name, stroke = '#64748B', size = 13 }: { name: string; stroke?: string; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'gov': return (<svg {...p}><path d="M3 21h18" /><path d="M5 21V10" /><path d="M19 21V10" /><path d="M12 3l9 6H3z" /><path d="M9 21v-6h6v6" /></svg>);
    case 'iros': return (<svg {...p}><path d="M6 3h9l4 4v14H6z" /><path d="M9 11h6" /><path d="M9 15h6" /></svg>);
    case 'rt': return (<svg {...p}><path d="M4 17l4-6 4 3 4-7 4 4" /><path d="M4 21h16" /></svg>);
    case 'eum': return (<svg {...p}><path d="M9 4L4 6v14l5-2 6 2 5-2V4l-5 2-6-2z" /><path d="M9 4v14" /><path d="M15 6v14" /></svg>);
    case 'eais': return (<svg {...p}><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M9 7h.01" /><path d="M15 7h.01" /><path d="M9 11h.01" /><path d="M15 11h.01" /><path d="M10 21v-4h4v4" /></svg>);
    case 'tax': return (<svg {...p}><path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21z" /><path d="M9.5 8.5l1.5 4 1-2.5 1 2.5 1.5-4" /><path d="M9 12.5h6" /></svg>);
    case 'doc': return (<svg {...p}><path d="M5 4h11l3 3v13H5z" /><path d="M9 13l2 2 4-4.5" /></svg>);
    case 'map': return (<svg {...p}><path d="M12 21s-6-5.2-6-9.8a6 6 0 1 1 12 0C18 15.8 12 21 12 21z" /><circle cx="12" cy="11" r="2.2" /></svg>);
    default: return null;
  }
}

export default function AgentMainPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<AgentJobType | null>(null);
  const [region, setRegion] = useState('전체 지역');
  const [jobs, setJobs] = useState<AgentJobListing[]>(agentJobsSample);
  const [pricePanel, setPricePanel] = useState<'apt' | 'ost' | null>(null);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [chat, setChat] = useState('');

  useEffect(() => setMounted(true), []);

  // DB 병합 (jobs-v1 백업 로직 보존: category=agent, dedupe by id, DB 우선)
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('category', 'agent')
        .order('created_at', { ascending: false });
      if (!alive || error || !data?.length) return;
      const dbJobs = data.map(mapDbAgentJob);
      const dbIds = new Set(dbJobs.map((j) => j.id));
      setJobs([...dbJobs, ...agentJobsSample.filter((j) => !dbIds.has(j.id))]);
    })().catch(() => {});
    return () => { alive = false; };
  }, []);

  const matches = (j: AgentJobListing) => {
    if (chip && j.type !== chip) return false;
    if (region !== '전체 지역' && j.region !== region) return false;
    const q = query.trim();
    if (q && !(j.title + j.description + j.region + j.company).includes(q)) return false;
    return true;
  };
  const listOf = (tier: AgentJobTier) => jobs.filter((j) => j.tier === tier && matches(j));
  const open = (id: string) => router.push(`/agent/jobs/${realId(id)}`);

  const vip = fillTo(listOf('vip'), 8);
  const premium = fillTo(listOf('premium'), 15);
  const basic = fillTo(listOf('basic'), 30);

  // VIP 배너 슬라이드 (최대 5장, 4.5초 자동)
  const banner = vip.slice(0, Math.min(5, Math.max(1, vip.length)));
  useEffect(() => {
    if (banner.length <= 1) return;
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % banner.length), 4500);
    return () => clearInterval(t);
  }, [banner.length]);
  const cur = banner[bannerIdx % banner.length];

  const togglePanel = (p: 'apt' | 'ost') => setPricePanel((c) => (c === p ? null : p));
  const submitChat = () => {
    const v = chat.trim();
    router.push(v ? `/agent/ai-assistant?q=${encodeURIComponent(v)}` : '/agent/ai-assistant');
  };

  // 좌측 네비 공통 스타일
  const navMain = (active = false): CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
    fontSize: 13.5, fontWeight: active ? 700 : 600,
    color: active ? '#FFFFFF' : '#475569',
    background: active ? 'linear-gradient(90deg,#0891B2,#10B981)' : 'transparent',
    boxShadow: active ? '0 4px 12px rgba(8,145,178,.25)' : undefined,
    textDecoration: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
  });
  const navSub: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500, color: '#64748B', textDecoration: 'none' };

  return (
    <div style={{ background: '#F1F5F9', minHeight: '100vh', fontFamily: "'Pretendard Variable',Pretendard,-apple-system,'Apple SD Gothic Neo',sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      <link rel="stylesheet" href="https://fastly.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />
      <style>{`
        *{box-sizing:border-box}
        #bo-shell{display:grid;grid-template-columns:220px minmax(0,1fr) 300px}
        #bo-shell.pp-open{grid-template-columns:220px 440px minmax(0,1fr) 300px}
        #bo-tabbar{display:none}
        #bo-shortcuts-m{display:none}
        .bo-strip-dup{display:none}
        @keyframes boGlow{0%,100%{box-shadow:0 0 0 1px rgba(8,145,178,.55),0 0 22px rgba(16,185,129,.22)}50%{box-shadow:0 0 0 1px rgba(16,185,129,.6),0 0 30px rgba(8,145,178,.3)}}
        @keyframes boTicker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes boSkel{0%{opacity:.5}50%{opacity:1}100%{opacity:.5}}
        .bo-card{transition:box-shadow .2s,transform .2s;cursor:pointer}
        .bo-card:hover{box-shadow:0 10px 26px rgba(15,23,42,.1);transform:translateY(-2px)}
        .bo-navitem:hover{background:#F1F5F9}
        .bo-shortcut:hover{background:#F1F5F9}
        .bo-basicrow:hover{background:#F8FAFC}
        .bo-skel{animation:boSkel 1.4s ease-in-out infinite}
        @media(max-width:1220px){
          #bo-side{display:none}
          #bo-shell{grid-template-columns:220px minmax(0,1fr)!important}
          #bo-shell.pp-open{grid-template-columns:220px 440px minmax(0,1fr)!important}
        }
        @media(max-width:820px){
          #bo-nav{display:none}
          #bo-shell,#bo-shell.pp-open{grid-template-columns:minmax(0,1fr)!important}
          #bo-tabbar{display:grid}
          #bo-main{padding:16px 16px 110px 16px!important;gap:22px!important}
          #bo-vipgrid{grid-template-columns:1fr!important}
          #bo-pregrid{grid-template-columns:repeat(2,1fr)!important}
          #bo-banner{flex-direction:column!important}
          #bo-banner-thumb{width:100%!important;min-height:150px!important}
          #bo-banner-info{width:100%!important;padding:20px!important}
          #bo-ai{flex-direction:column!important;align-items:stretch!important;gap:22px!important;padding:22px!important}
          #bo-shortcuts-m{display:flex}
          .bo-strip-inner{animation:boTicker 16s linear infinite;width:max-content}
          .bo-strip-dup{display:flex!important}
          .bo-pricepanel{position:fixed!important;inset:0!important;z-index:90!important;width:100%!important;border-right:none!important}
        }
      `}</style>

      <div id="bo-shell" className={pricePanel ? 'pp-open' : ''} style={{ maxWidth: 1440, margin: '0 auto', minHeight: '100vh', background: '#F8FAFC', boxShadow: '0 0 0 1px #E2E8F0' }}>

        {/* ══════════ 좌측 글로벌 네비 ══════════ */}
        <aside id="bo-nav" style={{ borderRight: '1px solid #E2E8F0', background: '#FFFFFF' }}>
          <div style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, padding: '22px 14px 18px 14px' }}>
            {/* 로고 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px 18px 8px' }}>
              <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.5, background: 'linear-gradient(90deg,#0891B2,#10B981)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>BOOIN</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0E7490', background: '#ECFEFF', border: '1px solid #A5F3FC', borderRadius: 999, padding: '3px 8px' }}>공인중개사</span>
            </div>

            {/* 주 메뉴 */}
            <Link href="/" className="bo-navitem" style={navMain(false)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
              <span>홈</span>
            </Link>
            <Link href="/agent" style={navMain(true)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              <span>구인구직</span>
            </Link>
            {/* 추가 요구: 아파트/오피스텔 시세 (같은 스타일, 패널 토글) */}
            <button className="bo-navitem" onClick={() => togglePanel('apt')} style={{ ...navMain(false), color: pricePanel === 'apt' ? '#0E7490' : '#475569', background: pricePanel === 'apt' ? '#ECFEFF' : 'transparent', fontWeight: pricePanel === 'apt' ? 700 : 600 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 7h.01" /><path d="M15 7h.01" /><path d="M9 11h.01" /><path d="M15 11h.01" /><path d="M10 21v-4h4v4" /></svg>
              <span>아파트 시세</span>
            </button>
            <button className="bo-navitem" onClick={() => togglePanel('ost')} style={{ ...navMain(false), color: pricePanel === 'ost' ? '#0E7490' : '#475569', background: pricePanel === 'ost' ? '#ECFEFF' : 'transparent', fontWeight: pricePanel === 'ost' ? 700 : 600 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="3" width="12" height="18" rx="1.5" /><path d="M10 7h.01" /><path d="M14 7h.01" /><path d="M10 11h.01" /><path d="M14 11h.01" /><path d="M10 15h.01" /><path d="M14 15h.01" /></svg>
              <span>오피스텔 시세</span>
            </button>
            <Link href="/agent/ai-assistant" className="bo-navitem" style={navMain(false)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" /></svg>
              <span>AI 실무비서</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 800, color: '#FFFFFF', background: '#10B981', borderRadius: 999, padding: '2px 6px', letterSpacing: 0.3 }}>NEW</span>
            </Link>
            <Link href="/agent/tools/case-law" className="bo-navitem" style={navMain(false)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h11" /><path d="M4 12h6" /><path d="M4 18h9" /><circle cx="18" cy="6" r="2" /><circle cx="13" cy="12" r="2" /><circle cx="16.5" cy="18" r="2" /></svg>
              <span>실무도구</span>
            </Link>

            <div style={{ height: 1, background: '#F1F5F9', margin: '10px 8px' }} />

            {/* 보조 메뉴 */}
            <Link href="/profile/ai-photo" className="bo-navitem" style={navSub}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="13" r="3.4" /><path d="M8.5 7l1.4-2.6h4.2L15.5 7" /></svg>
              <span>AI 이력서 사진</span>
            </Link>
            <Link href="/toon" className="bo-navitem" style={navSub}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h13v16H4z" /><path d="M17 8h3v10a2 2 0 0 1-2 2" /><path d="M7.5 8.5h6" /><path d="M7.5 12h6" /><path d="M7.5 15.5h3.5" /></svg>
              <span>부인 뉴스툰</span>
            </Link>
            <a href="#" className="bo-navitem" style={navSub}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="3" width="12" height="18" rx="2.5" /><path d="M10.5 9.5l4 2.5-4 2.5z" /></svg>
              <span>쇼츠</span>
            </a>
            <a href="#" className="bo-navitem" style={navSub}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19.5c0-3 2.4-5 5.5-5s5.5 2 5.5 5" /><circle cx="17" cy="9" r="2.4" /><path d="M16.5 14.6c2.5.4 4 2.1 4 4.4" /></svg>
              <span>중개사 라운지</span>
            </a>
            <Link href="/agent/mypage" className="bo-navitem" style={navSub}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.4" /><path d="M5 20c0-3.5 3-5.8 7-5.8s7 2.3 7 5.8" /></svg>
              <span>MY</span>
            </Link>

            <div style={{ height: 1, background: '#F1F5F9', margin: '10px 8px 6px 8px' }} />

            {/* 실무 바로가기 2×4 */}
            <div style={{ padding: '0 4px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', letterSpacing: 0.4, padding: '2px 6px 8px 6px' }}>실무 바로가기</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {SHORTCUTS.map((s) => {
                  const inner = (
                    <>
                      <ShortcutIcon name={s.icon} />
                      <span style={{ fontSize: s.label.length > 4 ? 10.5 : 11, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>{s.label}</span>
                      {s.ext ? <span style={{ fontSize: 9, color: '#94A3B8' }}>↗</span> : null}
                    </>
                  );
                  const st: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 7px', borderRadius: 8, textDecoration: 'none' };
                  return s.ext ? (
                    <a key={s.label} className="bo-shortcut" href={s.href} target="_blank" rel="noopener noreferrer" style={st}>{inner}</a>
                  ) : (
                    <Link key={s.label} className="bo-shortcut" href={s.href} style={st}>{inner}</Link>
                  );
                })}
              </div>
            </div>

            {/* 하단: 퀵메뉴 2×2 + AI 미니챗 */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 10 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', letterSpacing: 0.4, padding: '0 2px 8px 2px' }}>퀵메뉴</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    { label: '공고 등록', href: '/agent/jobs/new', icon: <><path d="M4 20l4-1L20 7l-3-3L5 16l-1 4z" /><path d="M14 6l3 3" /></> },
                    { label: '보수 계산기', href: '/agent/tools/commission', icon: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8.5 7h7" /><path d="M8.5 11.5h.01" /><path d="M12 11.5h.01" /><path d="M15.5 11.5h.01" /><path d="M8.5 15h.01" /><path d="M12 15h.01" /><path d="M15.5 15h.01" /></> },
                    { label: '판례 AI 검색', href: '/agent/tools/case-law', icon: <><path d="M12 3v18" /><path d="M8 21h8" /><path d="M5 7h14" /><path d="M5 7l-2.4 5.5a2.9 2.9 0 0 0 4.8 0z" /><path d="M19 7l-2.4 5.5a2.9 2.9 0 0 0 4.8 0z" /></> },
                    { label: '특약 생성', href: '/agent/tools/special-terms', icon: <><path d="M5 4h11l3 3v13H5z" /><path d="M9 13l2 2 4-4.5" /></> },
                  ].map((q) => (
                    <Link key={q.label} href={q.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 9, padding: '9px 4px', textDecoration: 'none' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{q.icon}</svg>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{q.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* AI 미니챗 */}
              <div style={{ background: '#0F172A', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 9 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: 'linear-gradient(90deg,#0891B2,#10B981)' }} />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#E2E8F0' }}>AI 비서에게 물어보기</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={chat} onChange={(e) => setChat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submitChat(); }} type="text" placeholder="예: 8억 아파트 중개보수는?" style={{ flex: 1, minWidth: 0, background: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9', fontSize: 12, padding: '7px 10px', outline: 'none' }} />
                  <button onClick={submitChat} style={{ border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#0891B2,#10B981)', color: '#FFFFFF', borderRadius: 8, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l16-7-5 16-3.5-6z" /><path d="M20 5L11.5 15" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ══════════ 시세 슬라이드 패널 (Phase 2 마운트 지점) ══════════ */}
        {pricePanel && (
          <aside className="bo-pricepanel" style={{ borderRight: '1px solid #E2E8F0', background: '#FFFFFF', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* 본문 — PriceTable (자체 헤더: 제목/뒤로가기/닫기 포함) */}
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <PriceTable
                  propertyType={pricePanel === 'ost' ? 'offi' : 'apt'}
                  onClose={() => setPricePanel(null)}
                />
              </div>

              {/* 하단 지도 링크 */}
              <div style={{ padding: '14px 20px 20px 20px', borderTop: '1px solid #F1F5F9' }}>
                <Link href="/market" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#ECFEFF', border: '1px solid #A5F3FC', color: '#0E7490', fontSize: 13, fontWeight: 800, borderRadius: 10, padding: 12, textDecoration: 'none' }}>지도로 보기 →</Link>
              </div>
            </div>
          </aside>
        )}

        {/* ══════════ 메인 콘텐츠 ══════════ */}
        <main id="bo-main" style={{ padding: '26px 28px 70px 28px', display: 'flex', flexDirection: 'column', gap: 30, minWidth: 0 }}>

          {/* 오늘의 브리핑 스트립 */}
          <section style={{ order: 1, marginBottom: -14 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, height: 44, display: 'flex', alignItems: 'center', padding: '0 15px', overflow: 'hidden' }}>
              <div className="bo-strip-inner" style={{ display: 'flex', alignItems: 'center', flex: 'none' }}>
                {[0, 1].map((dup) => (
                  <div key={dup} className={dup ? 'bo-strip-dup' : ''} aria-hidden={dup ? true : undefined} style={{ display: dup ? undefined : 'flex', alignItems: 'center', gap: 9, paddingRight: 9, whiteSpace: 'nowrap' }}>
                    <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#334155', textDecoration: 'none' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 16H6l1.5-2.5V9.5a4.5 4.5 0 0 1 9 0V13.5z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>
                      <span>실시간 채용공고 <b style={{ color: '#0F172A' }}>1,247</b>건</span>
                    </a>
                    <span style={{ color: '#CBD5E1', fontSize: 12 }}>·</span>
                    <a href="#" style={{ fontSize: 12, fontWeight: 600, color: '#334155', textDecoration: 'none' }}>오늘 등록 <b style={{ color: '#059669' }}>+48</b>건</a>
                    <span style={{ color: '#CBD5E1', fontSize: 12 }}>·</span>
                    <Link href="/toon" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#334155', textDecoration: 'none' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h13v16H4z" /><path d="M17 8h3v10a2 2 0 0 1-2 2" /><path d="M7.5 8.5h6" /><path d="M7.5 12h6" /></svg>
                      <span>뉴스툰 — 중개보수 분쟁, 판례로 살펴보기</span>
                    </Link>
                    <span style={{ color: '#CBD5E1', fontSize: 12 }}>·</span>
                    <Link href="/agent/tools/case-law" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#334155', textDecoration: 'none' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18" /><path d="M8 21h8" /><path d="M5 7h14" /><path d="M5 7l-2.4 5.5a2.9 2.9 0 0 0 4.8 0z" /><path d="M19 7l-2.4 5.5a2.9 2.9 0 0 0 4.8 0z" /></svg>
                      <span>오늘의 판례 — 특약 미기재 손해배상 인정</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 검색 + 필터 */}
          <section style={{ order: 1, display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: 9, background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '0 15px', height: 46 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20.5 20.5L16.2 16.2" /></svg>
                <input value={query} onChange={(e) => setQuery(e.target.value)} type="text" placeholder="회사명, 지역, 키워드로 검색" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 14, color: '#0F172A', background: 'transparent' }} />
              </div>
              <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ height: 46, background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '0 12px', fontSize: 13.5, fontWeight: 600, color: '#334155', outline: 'none', cursor: 'pointer' }}>
                {REGION_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TYPE_CHIPS.map((c) => {
                const active = chip === c.value;
                return (
                  <button key={c.label} onClick={() => setChip(c.value)} style={{ cursor: 'pointer', borderRadius: 999, padding: '8px 15px', fontSize: 13, fontWeight: 600, background: active ? 'linear-gradient(90deg,#0891B2,#10B981)' : '#FFFFFF', color: active ? '#FFFFFF' : '#475569', border: active ? '1px solid transparent' : '1px solid #E2E8F0' }}>{c.label}</button>
                );
              })}
            </div>
          </section>

          {/* 실무 바로가기 (모바일 전용 가로 스크롤) */}
          <section id="bo-shortcuts-m" style={{ order: 1, gap: 14, overflowX: 'auto', padding: '2px 2px 6px 2px', marginTop: -8 }}>
            {SHORTCUTS.map((s) => {
              const inner = (
                <>
                  <span style={{ width: 40, height: 40, borderRadius: 12, background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShortcutIcon name={s.icon} stroke="#0E7490" size={16} /></span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>{s.short}</span>
                </>
              );
              const st: CSSProperties = { flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textDecoration: 'none', width: 58 };
              return s.ext ? <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={st}>{inner}</a> : <Link key={s.label} href={s.href} style={st}>{inner}</Link>;
            })}
          </section>

          {/* VIP 슬라이드 배너 */}
          {cur && (
            <section style={{ order: 2 }}>
              <div id="bo-banner" onClick={() => open(cur.id)} style={{ display: 'flex', background: '#0F172A', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', animation: 'boGlow 3.5s ease-in-out infinite' }}>
                <div id="bo-banner-thumb" style={{ width: '50%', minHeight: 236, position: 'relative', background: grad(hashSeed(cur.id)) }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 20%,rgba(255,255,255,.14),transparent 55%)' }} />
                  <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: '#78350F', background: 'linear-gradient(90deg,#FDE68A,#F59E0B)', borderRadius: 6, padding: '4px 9px', letterSpacing: 0.5 }}>VIP</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#FFFFFF', background: 'rgba(15,23,42,.55)', borderRadius: 6, padding: '4px 9px' }}>{cardBadge(cur.badges)?.label || '추천'}</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: 14, left: 16, fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,.65)' }}>{String(bannerIdx + 1).padStart(2, '0')} / {String(banner.length).padStart(2, '0')}</div>
                </div>
                <div id="bo-banner-info" style={{ width: '50%', padding: '28px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#67E8F9', letterSpacing: 0.4 }}>{regionLabel(cur)} · VIP 채용</span>
                  <span style={{ fontSize: 23, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.4, lineHeight: 1.25 }}>{cur.title}</span>
                  <span style={{ fontSize: 13.5, color: '#94A3B8', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cur.description}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, paddingTop: 6 }}>
                    <span style={{ fontSize: 19, fontWeight: 800, background: 'linear-gradient(90deg,#22D3EE,#34D399)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{payText(cur)}</span>
                    <span style={{ fontSize: 12.5, color: '#64748B' }}>{cur.company}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, paddingTop: 10 }}>
                    {banner.map((_, i) => (
                      <button key={i} onClick={(e) => { e.stopPropagation(); setBannerIdx(i); }} style={{ cursor: 'pointer', border: 'none', padding: 0, height: 7, borderRadius: 99, transition: 'all .3s', width: i === bannerIdx ? 22 : 7, background: i === bannerIdx ? 'linear-gradient(90deg,#22D3EE,#34D399)' : '#334155' }} />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* VIP 공고 그리드 4×2 */}
          <section style={{ order: 3, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"><path d="M12 3l2.7 5.8 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3.1 1.2-6.2L3 9.6l6.3-.8z" /></svg>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: -0.3 }}>VIP 공고</h2>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0891B2' }}>{vip.length}건</span>
            </div>
            <div id="bo-vipgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              {vip.map((j) => {
                const b = cardBadge(j.badges);
                return (
                  <div key={j.id} className="bo-card" onClick={() => open(j.id)} style={{ display: 'flex', flexDirection: 'column', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ height: 104, position: 'relative', background: grad(hashSeed(j.id)) }}>
                      <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 800, color: '#78350F', background: 'linear-gradient(90deg,#FDE68A,#F59E0B)', borderRadius: 5, padding: '3px 7px' }}>VIP</span>
                        {b && <span style={{ fontSize: 9.5, fontWeight: 800, color: '#FFFFFF', background: b.bg, borderRadius: 5, padding: '3px 7px' }}>{b.label}</span>}
                      </div>
                      <span style={{ position: 'absolute', bottom: 10, left: 12, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.85)', letterSpacing: 0.3 }}>{watermark(j)}</span>
                    </div>
                    <div style={{ padding: '12px 14px 14px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.company}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', lineHeight: 1.4, minHeight: 39, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{j.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>{regionLabel(j)}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0891B2' }}>{payText(j)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ★ AI 실무비서 인터럽트 카드 */}
          <section id="bo-ai" style={{ order: 4, display: 'flex', gap: 38, alignItems: 'center', background: 'linear-gradient(115deg,#0F172A 0%,#111C33 55%,#0D2436 100%)', border: '1px solid #1E293B', borderRadius: 18, padding: '30px 34px' }}>
            <div style={{ flex: 1.05, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#0891B2,#10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(16,185,129,.35)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" /></svg>
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.3 }}>AI 부동산인 실무비서</span>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: '#FFFFFF', background: '#10B981', borderRadius: 999, padding: '3px 8px', letterSpacing: 0.4 }}>NEW</span>
                  </div>
                  <span style={{ fontSize: 13, color: '#94A3B8' }}>법률 · 계약 · 특약 · 수수료 — 중개 실무 전문 AI 비서</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['판례 AI 검색', '중개보수 계산', '계약서 특약 생성'].map((t) => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: '#CBD5E1', background: 'rgba(255,255,255,.05)', border: '1px solid #334155', borderRadius: 999, padding: '7px 14px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: 'linear-gradient(90deg,#22D3EE,#34D399)' }} />{t}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ alignSelf: 'flex-end', maxWidth: '85%', background: '#1E293B', color: '#E2E8F0', fontSize: 13, lineHeight: 1.5, borderRadius: '14px 14px 4px 14px', padding: '10px 15px' }}>8억 아파트 매매 중개보수 얼마야?</span>
              <span style={{ alignSelf: 'flex-start', maxWidth: '92%', background: 'rgba(8,145,178,.12)', border: '1px solid rgba(16,185,129,.35)', color: '#CBE4EC', fontSize: 13, lineHeight: 1.55, borderRadius: '14px 14px 14px 4px', padding: '11px 15px' }}>매매가 8억원 기준, 법정 상한 요율은 <b style={{ color: '#67E8F9' }}>0.4%</b>이며 최대 중개보수는 <b style={{ color: '#34D399' }}>320만원</b>입니다. (부가세 별도)</span>
              <button onClick={() => router.push('/agent/ai-assistant')} style={{ marginTop: 8, cursor: 'pointer', border: 'none', background: 'linear-gradient(90deg,#0891B2,#10B981)', color: '#FFFFFF', fontSize: 14, fontWeight: 700, borderRadius: 12, padding: '13px 18px', boxShadow: '0 6px 20px rgba(16,185,129,.3)' }}>AI 비서에게 물어보기</button>
            </div>
          </section>

          {/* 프리미엄 공고 그리드 5×3 */}
          <section style={{ order: 5, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17l4-9 4 6 4-9 4 12" /></svg>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: -0.3 }}>프리미엄 공고</h2>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0891B2' }}>{premium.length}건</span>
            </div>
            <div id="bo-pregrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
              {premium.map((j) => {
                const b = cardBadge(j.badges);
                return (
                  <div key={j.id} className="bo-card" onClick={() => open(j.id)} style={{ minWidth: 0, display: 'flex', flexDirection: 'column', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ height: 4, background: grad(hashSeed(j.id)) }} />
                    <div style={{ padding: '12px 13px 13px 13px', display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#0E7490', background: '#ECFEFF', border: '1px solid #A5F3FC', borderRadius: 5, padding: '2px 6px' }}>P</span>
                        {b && <span style={{ fontSize: 9, fontWeight: 800, color: '#FFFFFF', borderRadius: 5, padding: '2px 6px', background: b.bg }}>{b.label}</span>}
                      </div>
                      <span style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.company}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', lineHeight: 1.4, minHeight: 35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{j.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4 }}>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>{j.region}</span>
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0891B2' }}>{payText(j)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* BASIC 공고 테이블 30행 */}
          <section style={{ order: 7, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: -0.3 }}>BASIC 공고</h2>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0891B2' }}>{basic.length}건</span>
              <Link href="/agent/jobs/new" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: '#0891B2', textDecoration: 'none' }}>₩4,900~/5일 등록 →</Link>
            </div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflowX: 'auto' }}>
              <div style={{ minWidth: 640 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '150px minmax(0,1fr) 70px 120px 64px', gap: 12, padding: '11px 16px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                  {['회사명', '공고 제목', '지역', '급여', '마감'].map((h) => <span key={h} style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8' }}>{h}</span>)}
                </div>
                {basic.map((j) => {
                  const dd = ddayInfo(mounted, j.deadline, j.isAlwaysRecruiting);
                  return (
                    <div key={j.id} onClick={() => open(j.id)} className="bo-basicrow" style={{ display: 'grid', gridTemplateColumns: '150px minmax(0,1fr) 70px 120px 64px', gap: 12, alignItems: 'center', padding: '11px 16px', borderTop: '1px solid #F8FAFC', cursor: 'pointer' }}>
                      <span style={{ fontSize: 12.5, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.company}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</span>
                      <span style={{ fontSize: 12.5, color: '#94A3B8' }}>{j.region}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0891B2' }}>{payText(j)}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: dd.color }} suppressHydrationWarning>{dd.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {vip.length + premium.length + basic.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#94A3B8' }}>검색 결과가 없습니다.</div>
          )}
        </main>

        {/* ══════════ 우측 사이드바 ══════════ */}
        <aside id="bo-side" style={{ borderLeft: '1px solid #E2E8F0', background: '#FFFFFF' }}>
          <div style={{ position: 'sticky', top: 0, maxHeight: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, padding: '26px 22px' }}>

            {/* 공고 등록 CTA */}
            <div style={{ background: 'linear-gradient(135deg,#0891B2,#10B981)', borderRadius: 16, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 16.5, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.3, lineHeight: 1.35 }}>인재를 찾고<br />계신가요?</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['무료 공고 24시간 노출', '프리미엄 5일 ₩4,900~', '경쟁사 대비 1/10 가격'].map((t) => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'rgba(255,255,255,.92)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>{t}
                  </span>
                ))}
              </div>
              <button onClick={() => router.push('/agent/jobs/new')} style={{ cursor: 'pointer', border: 'none', background: '#FFFFFF', color: '#0E7490', fontSize: 13.5, fontWeight: 800, borderRadius: 10, padding: 12, marginTop: 4 }}>공고 등록하러 가기 →</button>
            </div>

            {/* 인기 지역 TOP 5 */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingBottom: 13 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17l4-9 4 6 4-9 4 12" /></svg>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>인기 채용 지역 TOP 5</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { r: '서울 강남', n: '156건', up: '+23%', top: true },
                  { r: '서울 송파', n: '98건', up: '+15%', top: true },
                  { r: '경기 분당', n: '87건', up: '+31%', top: true },
                  { r: '서울 마포', n: '76건', up: '+12%', top: false },
                  { r: '경기 판교', n: '65건', up: '+45%', top: false },
                ].map((row, i) => (
                  <div key={row.r} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 2px' }}>
                    <span style={{ width: 20, height: 20, borderRadius: 99, background: row.top ? 'linear-gradient(135deg,#0891B2,#10B981)' : '#F1F5F9', color: row.top ? '#FFFFFF' : '#64748B', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                    <span style={{ fontSize: 13, fontWeight: row.top ? 700 : 600, color: row.top ? '#0F172A' : '#334155' }}>{row.r}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#94A3B8' }}>{row.n}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#059669' }}>{row.up}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 시세지도 카드 */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', background: '#FFFFFF' }}>
              <div style={{ height: 118, position: 'relative', background: 'repeating-linear-gradient(90deg,transparent 0 52px,#FFFFFF 52px 60px),repeating-linear-gradient(0deg,transparent 0 40px,#FFFFFF 40px 47px),#DCEFEF' }}>
                <span style={{ position: 'absolute', top: 20, left: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ background: '#0F172A', color: '#FFFFFF', fontSize: 10.5, fontWeight: 800, borderRadius: 7, padding: '4px 8px', boxShadow: '0 3px 8px rgba(15,23,42,.25)' }}>12.4억</span>
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: '#0F172A', border: '2px solid #FFFFFF' }} />
                </span>
                <span style={{ position: 'absolute', top: 52, left: 118, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ background: 'linear-gradient(90deg,#0891B2,#10B981)', color: '#FFFFFF', fontSize: 10.5, fontWeight: 800, borderRadius: 7, padding: '4px 8px', boxShadow: '0 3px 8px rgba(8,145,178,.35)' }}>8.9억</span>
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: '#0891B2', border: '2px solid #FFFFFF' }} />
                </span>
                <span style={{ position: 'absolute', top: 26, right: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ background: '#0F172A', color: '#FFFFFF', fontSize: 10.5, fontWeight: 800, borderRadius: 7, padding: '4px 8px', boxShadow: '0 3px 8px rgba(15,23,42,.25)' }}>5.2억</span>
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: '#0F172A', border: '2px solid #FFFFFF' }} />
                </span>
              </div>
              <div style={{ padding: '14px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>우리 동네 시세 한눈에</span>
                  <span style={{ fontSize: 11.5, color: '#94A3B8' }}>실거래가 기반 시세지도</span>
                </div>
                <button onClick={() => router.push('/market')} style={{ cursor: 'pointer', background: '#ECFEFF', border: '1px solid #A5F3FC', color: '#0E7490', fontSize: 12.5, fontWeight: 800, borderRadius: 9, padding: 10 }}>시세지도 열기 →</button>
              </div>
            </div>

            {/* AI 이력서 사진 */}
            <div style={{ background: '#F0FDF9', border: '1px solid #A7F3D0', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 44, height: 44, borderRadius: 99, background: 'linear-gradient(135deg,#0F172A,#0E7490)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FFFFFF', boxShadow: '0 3px 8px rgba(15,23,42,.15)' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#67E8F9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="13" r="3.4" /><path d="M8.5 7l1.4-2.6h4.2L15.5 7" /></svg>
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>AI 이력서 사진</span>
                  <span style={{ fontSize: 11.5, color: '#059669', lineHeight: 1.4 }}>기업에서 먼저 연락받는 프로필</span>
                </div>
              </div>
              <button onClick={() => router.push('/profile/ai-photo')} style={{ cursor: 'pointer', border: 'none', background: '#0F172A', color: '#FFFFFF', fontSize: 12.5, fontWeight: 700, borderRadius: 9, padding: 10 }}>무료로 만들기</button>
            </div>

            {/* 뉴스툰 */}
            <Link href="/toon" style={{ display: 'flex', flexDirection: 'column', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', textDecoration: 'none', background: '#FFFFFF' }}>
              <div style={{ height: 110, position: 'relative', background: 'linear-gradient(120deg,#0F172A,#1E293B 60%,#164E63)' }}>
                <span style={{ position: 'absolute', top: 12, left: 12, fontSize: 9.5, fontWeight: 800, color: '#0F172A', background: '#FDE68A', borderRadius: 5, padding: '3px 8px' }}>뉴스툰</span>
                <span style={{ position: 'absolute', bottom: 12, left: 14, right: 14, fontSize: 14, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.35 }}>제32화 · 중개보수 분쟁,<br />판례로 살펴보기</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
                <span style={{ fontSize: 11.5, color: '#94A3B8' }}>이번 주 뉴스툰</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0891B2' }}>보러가기 →</span>
              </div>
            </Link>
          </div>
        </aside>
      </div>

      {/* ══════════ 모바일 하단 탭바 ══════════ */}
      <nav id="bo-tabbar" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60, gridTemplateColumns: 'repeat(5,1fr)', alignItems: 'end', background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderTop: '1px solid #E2E8F0', padding: '7px 10px 10px 10px' }}>
        <Link href="/agent" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', padding: '4px 0' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8' }}>홈</span>
        </Link>
        <Link href="/agent" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', padding: '4px 0' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#0891B2' }}>구인</span>
        </Link>
        <Link href="/agent/jobs/new" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', marginTop: -22 }}>
          <span style={{ width: 48, height: 48, borderRadius: 99, background: 'linear-gradient(135deg,#0891B2,#10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(16,185,129,.4)', border: '3px solid #FFFFFF' }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B' }}>등록</span>
        </Link>
        <Link href="/agent/ai-assistant" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', padding: '4px 0' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /></svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8' }}>AI비서</span>
        </Link>
        <Link href="/agent/mypage" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', padding: '4px 0' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.4" /><path d="M5 20c0-3.5 3-5.8 7-5.8s7 2.3 7 5.8" /></svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8' }}>MY</span>
        </Link>
      </nav>
    </div>
  );
}
