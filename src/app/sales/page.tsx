'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchJobs } from '@/lib/supabase';
import { allJobs } from '@/data/salesJobsSample';
import type { SalesJobListing } from '@/types';

/* =========================================================================
   BOOIN 분양상담사 구인구직 — 핸드오프(design_handoff_booin_sales) 충실 이식
   디자인 = hifi 핸드오프 그대로 / 데이터 = 우리 실 jobs(fetchJobs)+sampleJobs
   ========================================================================= */

const ACCENT = '#2563EB';

type Comp = { p: '본부장' | '팀장' | '팀원' | '팀'; a: string | null };
type Wel = { l: string; v?: string };
type Job = {
  id: string;
  seed: number; // 썸네일 그라데이션 회전용 (id 해시)
  tier: 'unique' | 'superior' | 'premium' | 'normal';
  title: string;
  sub: string;
  type: string;
  region: string;
  comp: Comp[];
  wel: Wel[];
  company: string;
  badge?: 'NEW' | 'HOT';
};

// 썸네일 그라데이션 (seed % 8 순환) — 실제 서비스에선 현장 이미지로 교체
const GRADS = [
  'linear-gradient(135deg,#1E3A8A,#0F2154)',
  'linear-gradient(135deg,#2563EB,#1E40AF)',
  'linear-gradient(135deg,#0E7490,#134E52)',
  'linear-gradient(135deg,#B45309,#7C3A09)',
  'linear-gradient(135deg,#7E22CE,#4A1772)',
  'linear-gradient(135deg,#475569,#1E293B)',
  'linear-gradient(135deg,#BE185D,#7A1140)',
  'linear-gradient(135deg,#15803D,#0C4A22)',
];

const TYPES = ['전체', '아파트', '오피스텔', '상가', '지산'] as const;

/* ── 우리 SalesJobListing → 핸드오프 Job 어댑터 ── */
const TYPE_MAP: Record<string, string> = { apartment: '아파트', officetel: '오피스텔', store: '상가', industrial: '지산' };
const POS_MAP: Record<string, Comp['p']> = { headTeam: '본부장', teamLead: '팀장', member: '팀원' };

function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
function pickBadge(badges?: string[]): 'NEW' | 'HOT' | undefined {
  if (badges?.some((b) => b === 'hot' || b === 'jackpot')) return 'HOT';
  if (badges?.some((b) => b === 'new' || b === 'popular')) return 'NEW';
  return undefined;
}
function toJob(l: SalesJobListing): Job {
  return {
    id: l.id,
    seed: hashSeed(l.id),
    tier: l.tier,
    title: l.title,
    sub: l.description || '',
    type: TYPE_MAP[l.type] || l.type,
    region: l.region,
    comp: [{ p: POS_MAP[l.position] || '팀', a: l.salary?.amount || null }],
    wel: (l.benefits || []).map((b) => ({ l: b })),
    company: l.company,
    badge: pickBadge(l.badges),
  };
}

// 직책 색
function posColor(p: string) {
  if (p === '본부장') return { bg: '#FCE7F3', color: '#DB2777' };
  if (p === '팀장') return { bg: '#E0E7FF', color: '#4F46E5' };
  if (p === '팀원') return { bg: '#CFFAFE', color: '#0891B2' };
  return { bg: '#DCFCE7', color: '#16A34A' };
}
function posBadge(p: string, size: 'sm' | 'md' = 'md'): CSSProperties {
  const c = posColor(p);
  return {
    background: c.bg, color: c.color, fontWeight: 800,
    fontSize: size === 'sm' ? 11 : 12, padding: size === 'sm' ? '2px 7px' : '3px 9px',
    borderRadius: 6, whiteSpace: 'nowrap',
  };
}
function stateBadge(b?: string): CSSProperties {
  const map: Record<string, { bg: string; c: string }> = { HOT: { bg: '#FEE2E2', c: '#EF4444' }, NEW: { bg: '#DCFCE7', c: '#16A34A' } };
  const m = (b && map[b]) || { bg: '#F3F4F6', c: '#6B7280' };
  return { background: m.bg, color: m.c, fontSize: 10, fontWeight: 800, padding: '3px 7px', borderRadius: 5, whiteSpace: 'nowrap', flex: '0 0 auto' };
}
// 금액: 순수 숫자면 '만원' 부착, 우리 데이터 단위 문자열('최대 400만' 등)은 그대로, 없으면 상담 문의
const payText = (c: Comp) => {
  if (!c.a) return '상담 문의';
  const t = c.a.trim();
  return /^[\d,]+$/.test(t) ? t + '만원' : t;
};
const grad = (seed: number) => GRADS[seed % GRADS.length];
const amountNum = (s?: string | null) => Number((s || '').replace(/[^\d]/g, '')) || 0;

// 광고대행사 전문 노출 (분양 광고 파트너 카드)
const AGENCY = [
  { name: '분양마케팅 그룹', desc: 'LMS·문자·콜DB 통합 분양 광고 집행', ch: ['LMS', '문자', '콜DB'], seed: 2 },
  { name: '미디어 애드', desc: '유튜브·인스타·블로그 바이럴 마케팅', ch: ['유튜브', 'SNS', '블로그'], seed: 4 },
  { name: '온애드 컴퍼니', desc: '현수막·전단 등 오프라인 광고 대행', ch: ['현수막', '전단', '옥외'], seed: 6 },
  { name: '디지털 분양랩', desc: '검색·배너 퍼포먼스 광고 운영', ch: ['검색', '배너', '리타겟'], seed: 1 },
];

// 섹션을 목표 슬롯 수까지 채움 — 실데이터 부족분은 회전 노출(광고는 같은 금액에 더 많은 노출)
function fillTo<T extends { id: string }>(list: T[], n: number): T[] {
  if (list.length === 0 || list.length >= n) return list;
  const out = [...list];
  while (out.length < n) {
    const base = list[out.length % list.length];
    out.push({ ...base, id: `${base.id}__f${out.length}` });
  }
  return out;
}

function WelChip({ w, size = 'md' }: { w: Wel; size?: 'sm' | 'md' | 'lg' }) {
  const fs = size === 'lg' ? 11 : size === 'sm' ? 10 : 11;
  const pad = size === 'lg' ? '3px 8px' : size === 'sm' ? '2px 6px' : '3px 8px';
  return (
    <span style={{ background: '#F3F4F6', color: '#4B5563', fontSize: fs, fontWeight: 700, padding: pad, borderRadius: 6 }}>
      {w.l}{w.v ? <span style={{ color: '#EF4444' }}>{' ' + w.v}</span> : null}
    </span>
  );
}

export default function SalesListPage() {
  const router = useRouter();
  const [tab, setTab] = useState('구인공고');
  const [region, setRegion] = useState('전체');
  const [type, setType] = useState<string>('전체');
  const [query, setQuery] = useState('');
  // 초기: 샘플 즉시 표시 → DB 로드되면 앞에 병합
  const [jobs, setJobs] = useState<Job[]>(() => allJobs.map(toJob));

  useEffect(() => {
    let alive = true;
    fetchJobs('sales')
      .then((db) => {
        if (!alive || !db?.length) return;
        const adapted = db.map(toJob);
        setJobs((prev) => {
          const seen = new Set(adapted.map((j) => j.id));
          return [...adapted, ...prev.filter((j) => !seen.has(j.id))];
        });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const matches = (j: Job) => {
    if (type !== '전체' && j.type !== type) return false;
    if (region !== '전체' && j.region !== region) return false;
    const q = query.trim();
    if (q && !(j.title + j.sub + j.region + j.company).includes(q)) return false;
    return true;
  };
  const listOf = (tier: Job['tier']) => jobs.filter((j) => j.tier === tier && matches(j));
  const open = (id: string) => router.push(`/sales/jobs/${id}`);

  const unique = listOf('unique');
  const superior = listOf('superior');
  const premium = listOf('premium');
  const normal = listOf('normal');

  // 지역 칩 = 실데이터의 실제 지역 (전체 + 분포순)
  const regions = ['전체', ...Array.from(new Set(jobs.map((j) => j.region).filter(Boolean)))];

  const trending = [...jobs]
    .filter((j) => amountNum(j.comp[0]?.a) > 0)
    .sort((a, b) => amountNum(b.comp[0].a) - amountNum(a.comp[0].a))
    .slice(0, 5);

  const leftNav = [
    { ic: '⌂', label: '홈', href: '/' },
    { ic: '◆', label: '구인구직', href: '/sales', active: true },
    { ic: '◇', label: '커뮤니티', href: '#' },
    { ic: '◈', label: 'BOOIN톡', href: '#', dot: true },
    { ic: '✦', label: '서비스', href: '#' },
    { ic: '○', label: 'MY', href: '/sales/mypage' },
  ];
  const navBase: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, fontSize: 14, fontWeight: 600, textAlign: 'left', width: '100%', textDecoration: 'none' };
  const quickMenu = [
    { ic: '📝', label: '공고 등록', href: '/sales/jobs/new' },
    { ic: '🗺', label: '지역별 현장', href: '/sales/jobs' },
    { ic: '💰', label: '고수수료 현장', href: '/sales/jobs' },
    { ic: '🎓', label: '교육·세미나', href: '#' },
  ];
  const bottomNav = [
    { ic: '⌂', label: '홈', href: '/sales' },
    { ic: '◆', label: '구인', href: '/sales', active: true },
    { ic: '＋', label: '등록', href: '/sales/jobs/new' },
    { ic: '◈', label: 'BOOIN톡', href: '#' },
    { ic: '○', label: 'MY', href: '/sales/mypage' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F4F5F7', color: '#111827', fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      {/* Pretendard */}
      <link rel="stylesheet" href="https://fastly.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />
      <style>{`
        .bn-x{scrollbar-width:thin}
        .bn-x::-webkit-scrollbar{height:7px}
        .bn-x::-webkit-scrollbar-thumb{background:rgba(0,0,0,.16);border-radius:99px}
        @keyframes bnUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .bn-card{animation:bnUp .4s ease both}
        .bn-bottomnav{display:none}
        @media (max-width:1180px){.bn-side{display:none!important}.bn-main{grid-template-columns:1fr!important}}
        @media (max-width:920px){.bn-leftnav{display:none!important}.bn-body{margin-left:0!important}.bn-bottomnav{display:flex!important}.bn-headtabs{display:none!important}}
        @media (max-width:640px){.bn-headstats{display:none!important}.bn-bighcard{grid-template-columns:1fr!important}.bn-bighcard .bn-bigthumb{height:150px!important;min-height:0!important}}
        .bn-grid4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
        .bn-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        @media (max-width:920px){.bn-grid4{grid-template-columns:repeat(2,minmax(0,1fr))!important}.bn-grid2{grid-template-columns:1fr!important}}
        @media (max-width:560px){.bn-grid4{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      `}</style>

      {/* ===== 좌측 글로벌 네비 ===== */}
      <aside className="bn-leftnav" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 240, background: '#11141C', color: '#fff', zIndex: 60, display: 'flex', flexDirection: 'column', padding: '22px 0' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'baseline', gap: 7, padding: '0 24px 22px', textDecoration: 'none', color: '#fff' }}>
          <span style={{ fontSize: 25, fontWeight: 800, letterSpacing: -0.5 }}>BOOIN</span>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: '#7C859B' }}>부동산인</span>
        </Link>
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {leftNav.map((n) => (
            <Link key={n.label} href={n.href} style={{ ...navBase, background: n.active ? 'rgba(255,255,255,.08)' : 'transparent', color: n.active ? '#fff' : '#9098A4' }}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{n.ic}</span>
              <span>{n.label}</span>
              {n.dot ? <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: 99, background: '#EF4444' }} /> : null}
            </Link>
          ))}
        </div>
        <div style={{ marginTop: 'auto', padding: 16 }}>
          <div style={{ background: 'linear-gradient(135deg,#1E293B,#0F1623)', border: '1px solid #232B3A', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 3 }}>올인원 분양 솔루션</div>
            <div style={{ fontSize: 11, color: '#8B93A7', lineHeight: 1.5, marginBottom: 12 }}>구인부터 광고·교육까지<br />한 곳에서</div>
            <Link href="/sales/jobs/new" style={{ display: 'block', textAlign: 'center', background: ACCENT, color: '#fff', borderRadius: 9, padding: 9, fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>공고 등록하기</Link>
          </div>
        </div>
      </aside>

      {/* ===== 본문 영역 ===== */}
      <div className="bn-body" style={{ marginLeft: 240 }}>
        {/* 헤더 */}
        <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,.86)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid #E7E9EE' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto', padding: '13px 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
            <div className="bn-headtabs" style={{ display: 'flex', gap: 4 }}>
              {['구인공고', '분양인재', '분양대행'].map((t) => (
                <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? '#11141C' : 'transparent', color: tab === t ? '#fff' : '#6B7280', border: 'none', borderRadius: 9, padding: '9px 15px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', gap: 9, background: '#F1F3F6', border: '1px solid #E7E9EE', borderRadius: 11, padding: '10px 14px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9098A4" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="현장명·지역·키워드 검색" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#111827' }} />
            </div>
            <div className="bn-headstats" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'right', lineHeight: 1.15 }}>
                <div style={{ fontSize: 10, color: '#9098A4', fontWeight: 600 }}>오늘 신규</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: ACCENT }}>212<span style={{ fontSize: 10, color: '#9098A4' }}>건</span></div>
              </div>
              <div style={{ textAlign: 'right', lineHeight: 1.15 }}>
                <div style={{ fontSize: 10, color: '#9098A4', fontWeight: 600 }}>실시간</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>4,879<span style={{ fontSize: 10, color: '#9098A4' }}>명</span></div>
              </div>
              <Link href="/sales/auth/login" style={{ background: '#11141C', color: '#fff', borderRadius: 10, padding: '0 16px', height: 40, fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>로그인</Link>
            </div>
          </div>
        </header>

        {/* 메인 그리드 */}
        <main className="bn-main" style={{ maxWidth: 1320, margin: '0 auto', padding: '20px 24px 40px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 26, alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>
            {/* 배너 */}
            <Link href="/sales/jobs/new" style={{ display: 'block', textDecoration: 'none', color: '#fff', borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(115deg,#1D4ED8 0%,#11141C 90%)', padding: '26px 28px', marginBottom: 22, position: 'relative' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#9DBCFF', marginBottom: 8 }}>BOOIN PLATFORM</div>
              <div style={{ fontSize: 23, fontWeight: 800, lineHeight: 1.3, marginBottom: 8 }}>분양상담사 구인구직,<br />현장을 가장 빠르게 찾는 법</div>
              <div style={{ fontSize: 13, color: '#C7D2E8', fontWeight: 500 }}>AI 매칭 · 부동산 전문가 Only · 광고비 90% 절감</div>
              <div style={{ position: 'absolute', right: -30, bottom: -30, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(93,140,255,.35),transparent 70%)' }} />
            </Link>

            {/* 지역 원형 필터 */}
            <div className="bn-x" style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '4px 2px 14px', marginBottom: 6 }}>
              {regions.map((name) => {
                const active = region === name;
                return (
                  <button key={name} onClick={() => setRegion(name)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flex: '0 0 auto', padding: 0 }}>
                    <span style={{ width: 54, height: 54, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, background: active ? ACCENT : '#fff', color: active ? '#fff' : '#4B5563', border: active ? `2px solid ${ACCENT}` : '1.5px solid #E3E6EB', boxShadow: active ? '0 4px 12px rgba(37,99,235,.25)' : 'none', transition: 'all .15s' }}>{name === '전체' ? 'ALL' : name.slice(0, 2)}</span>
                    <span style={{ fontSize: 11.5, fontWeight: active ? 800 : 600, color: active ? '#111827' : '#6B7280', whiteSpace: 'nowrap' }}>{name}</span>
                  </button>
                );
              })}
            </div>

            {/* 유형 칩 */}
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 26 }}>
              {TYPES.map((name) => {
                const active = type === name;
                return (
                  <button key={name} onClick={() => setType(name)} style={{ border: 'none', borderRadius: 9, padding: '8px 15px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', background: active ? '#11141C' : '#fff', color: active ? '#fff' : '#4B5563', boxShadow: active ? 'none' : 'inset 0 0 0 1px #E3E6EB' }}>{name}</button>
                );
              })}
            </div>

            {/* ① 프리미엄 대표 현장 (unique) — 가로 큰 카드 */}
            {unique.length > 0 && (
              <section data-section="unique" style={{ marginBottom: 34 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                  <span style={{ fontSize: 19 }}>🏆</span>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>프리미엄 대표 현장</h2>
                  <span style={{ fontSize: 12, color: '#9098A4' }}>에디터 큐레이션</span>
                  <Link href="/sales/premium" style={{ marginLeft: 'auto', color: '#6B7280', fontSize: 12.5, fontWeight: 600, textDecoration: 'none' }}>상품안내</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {unique.map((j) => (
                    <div key={j.id} className="bn-card bn-bighcard" onClick={() => open(j.id)} style={{ cursor: 'pointer', display: 'grid', gridTemplateColumns: '220px minmax(0,1fr)', background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(17,23,41,.05)' }}>
                      <div className="bn-bigthumb" style={{ height: '100%', minHeight: 168, background: grad(j.seed), position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 13 }}>
                        <span style={{ position: 'absolute', top: 13, left: 13, background: 'linear-gradient(135deg,#E0A93B,#C8832A)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 6 }}>VIP</span>
                        <span style={{ background: 'rgba(0,0,0,.42)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, backdropFilter: 'blur(4px)' }}>{j.type} · {j.region}</span>
                      </div>
                      <div style={{ padding: '17px 19px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.35, flex: 1 }}>{j.title}</div>
                          {j.badge ? <span style={stateBadge(j.badge)}>{j.badge}</span> : null}
                        </div>
                        <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, margin: '6px 0 14px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{j.sub}</div>
                        <div style={{ display: 'flex', gap: 18, marginBottom: 14, flexWrap: 'wrap' }}>
                          {j.comp.map((c, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={posBadge(c.p)}>{c.p}</span>
                              <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 700 }}>RT</span>
                              <span style={{ fontSize: 19, fontWeight: 800, color: '#111827', letterSpacing: -0.5 }}>{payText(c)}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{j.company}</span>
                          {j.wel.length > 0 && <span style={{ width: 3, height: 3, borderRadius: 99, background: '#D1D5DB' }} />}
                          {j.wel.slice(0, 3).map((w, i) => <WelChip key={i} w={w} />)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ② 추천 현장 (superior) — 세로 카드 그리드 */}
            {superior.length > 0 && (
              <section data-section="superior" style={{ marginBottom: 34 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                  <span style={{ fontSize: 19 }}>👍</span>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>추천 현장</h2>
                  <Link href="/sales/jobs?tier=superior" style={{ marginLeft: 'auto', color: '#6B7280', fontSize: 12.5, fontWeight: 600, textDecoration: 'none' }}>전체보기 →</Link>
                </div>
                <div className="bn-grid4">
                  {superior.map((j) => (
                    <div key={j.id} className="bn-card" onClick={() => open(j.id)} style={{ cursor: 'pointer', background: '#fff', border: '1px solid #ECEEF1', borderRadius: 14, overflow: 'hidden', boxShadow: '0 3px 12px rgba(17,23,41,.04)' }}>
                      <div style={{ height: 124, background: grad(j.seed), position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 11 }}>
                        <span style={{ background: 'rgba(0,0,0,.42)', color: '#fff', fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 99, backdropFilter: 'blur(4px)' }}>{j.type} · {j.region}</span>
                        {j.badge ? <span style={stateBadge(j.badge)}>{j.badge}</span> : null}
                      </div>
                      <div style={{ padding: '13px 14px 15px' }}>
                        <div style={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.4, marginBottom: 5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 41 }}>{j.title}</div>
                        <div style={{ fontSize: 12, color: '#9098A4', lineHeight: 1.4, marginBottom: 11, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{j.sub}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
                          <span style={posBadge(j.comp[0].p, 'sm')}>{j.comp[0].p}</span>
                          <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700 }}>RT</span>
                          <span style={{ fontSize: 17, fontWeight: 800, color: '#111827', letterSpacing: -0.5 }}>{payText(j.comp[0])}</span>
                        </div>
                        {j.wel.length > 0 && (
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', paddingTop: 11, borderTop: '1px solid #F1F2F4' }}>
                            {j.wel.slice(0, 3).map((w, i) => <WelChip key={i} w={w} size="sm" />)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 광고대행사 전문 노출 (그리드) */}
            <section data-section="agency" style={{ marginBottom: 34 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                <span style={{ fontSize: 19 }}>📣</span>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>광고대행사 전문 노출</h2>
                <span style={{ fontSize: 12, color: '#9098A4' }}>분양 광고 파트너</span>
                <Link href="/sales/premium" style={{ marginLeft: 'auto', color: '#6B7280', fontSize: 12.5, fontWeight: 600, textDecoration: 'none' }}>상품안내 →</Link>
              </div>
              <div className="bn-grid4">
                {[...AGENCY, ...AGENCY].map((a, i) => (
                  <Link key={i} href="/sales/premium" className="bn-card" style={{ textDecoration: 'none', background: '#fff', border: '1px solid #ECEEF1', borderRadius: 14, overflow: 'hidden', boxShadow: '0 3px 12px rgba(17,23,41,.04)' }}>
                    <div style={{ height: 96, background: grad(a.seed), position: 'relative', display: 'flex', alignItems: 'flex-start', padding: 11 }}>
                      <span style={{ background: 'linear-gradient(90deg,#EA580C,#F59E0B)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>전문 노출</span>
                    </div>
                    <div style={{ padding: '12px 14px 14px' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: '#9098A4', lineHeight: 1.4, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.desc}</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {a.ch.map((c) => <span key={c} style={{ fontSize: 10.5, fontWeight: 700, color: '#EA580C', background: '#FFF1E7', borderRadius: 5, padding: '3px 7px' }}>{c}</span>)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* ③ 부인 알고리즘 추천 공고 (premium) — 2단 그리드 */}
            {premium.length > 0 && (
              <section data-section="premium" style={{ marginBottom: 34 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                  <span style={{ fontSize: 19 }}>🔍</span>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>부인 알고리즘 추천 공고</h2>
                  <Link href="/sales/jobs?tier=premium" style={{ marginLeft: 'auto', color: '#6B7280', fontSize: 12.5, fontWeight: 600, textDecoration: 'none' }}>전체보기 →</Link>
                </div>
                <div className="bn-grid2">
                  {fillTo(premium, 8).map((j) => (
                    <div key={j.id} className="bn-card" onClick={() => open(j.id)} style={{ cursor: 'pointer', display: 'flex', gap: 13, background: '#fff', border: '1px solid #ECEEF1', borderRadius: 14, padding: 12, boxShadow: '0 3px 12px rgba(17,23,41,.04)' }}>
                      <div style={{ flex: '0 0 96px', height: 96, borderRadius: 10, background: grad(j.seed), position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 7 }}>
                        <span style={{ background: 'rgba(0,0,0,.42)', color: '#fff', fontSize: 9.5, fontWeight: 600, padding: '2px 6px', borderRadius: 99 }}>{j.type}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: 11, color: '#9098A4', fontWeight: 700, marginBottom: 3 }}>{j.region}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.35, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{j.title}</div>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={posBadge(j.comp[0].p, 'sm')}>{j.comp[0].p}</span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: -0.5 }}>{payText(j.comp[0])}</span>
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                            {j.wel.slice(0, 1).map((w, i) => <WelChip key={i} w={w} size="sm" />)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ④ 오늘의 핵심 공고 (normal) — 컴팩트 리스트 */}
            {normal.length > 0 && (
              <section data-section="normal">
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                  <span style={{ fontSize: 19 }}>⚡</span>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>오늘의 핵심 공고</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: 10 }}>
                  {fillTo(normal, 6).map((j) => (
                    <div key={j.id} onClick={() => open(j.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 13, background: '#fff', border: '1px solid #ECEEF1', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10.5, color: '#9098A4', fontWeight: 700, marginBottom: 4 }}>{j.type} · {j.region}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{j.title}</div>
                      </div>
                      <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                        <div style={{ fontSize: 10, color: '#9098A4', fontWeight: 700 }}>{j.comp[0].p}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: ACCENT, letterSpacing: -0.5 }}>{payText(j.comp[0])}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {unique.length + superior.length + premium.length + normal.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#9098A4' }}>검색 결과가 없습니다.</div>
            )}
          </div>

          {/* ===== 우측 사이드바 ===== */}
          <aside className="bn-side" style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Link href="/sales/jobs/new" style={{ display: 'block', textDecoration: 'none', borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(160deg,#C8832A,#8A5A14)', color: '#fff', padding: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, opacity: 0.8, marginBottom: 6 }}>SPECIAL</div>
              <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.4, marginBottom: 10 }}>오늘의 특별현장<br />광고비 50% 지원</div>
              <span style={{ display: 'inline-block', background: 'rgba(255,255,255,.95)', color: '#8A5A14', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 800 }}>자세히 보기 →</span>
            </Link>

            <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16, padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>실시간 인기 현장</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {trending.map((t, i) => (
                  <button key={t.id} onClick={() => open(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: ACCENT, width: 16 }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: '#374151', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.title}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#111827', whiteSpace: 'nowrap' }}>{payText(t.comp[0])}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16, padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>빠른 메뉴</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {quickMenu.map((q) => (
                  <Link key={q.label} href={q.href} style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start', background: '#F8F9FB', border: '1px solid #EEF0F3', borderRadius: 11, padding: 12, textDecoration: 'none' }}>
                    <span style={{ fontSize: 17 }}>{q.ic}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{q.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </main>

        {/* 푸터 */}
        <footer style={{ borderTop: '1px solid #E7E9EE', padding: '28px 24px', maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>BOOIN <span style={{ fontSize: 12, color: '#9098A4', fontWeight: 600 }}>부동산인</span></div>
          <div style={{ fontSize: 11.5, color: '#9098A4', lineHeight: 1.7 }}>온시아 공인중개사 · 대표 연대겸 · 사업자등록번호 846-23-01501<br />서울특별시 송파구 중대로 197 · 대표전화 1555-1245</div>
          <div style={{ fontSize: 11, color: '#B6BCC6', marginTop: 12 }}>© 2026 BOOIN Corp. All rights reserved.</div>
        </footer>
      </div>

      {/* 모바일 하단 탭 */}
      <nav className="bn-bottomnav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70, background: '#fff', borderTop: '1px solid #E7E9EE', padding: '8px 0 calc(8px + env(safe-area-inset-bottom))', justifyContent: 'space-around' }}>
        {bottomNav.map((n) => (
          <Link key={n.label} href={n.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', color: n.active ? ACCENT : '#9098A4', flex: 1 }}>
            <span style={{ fontSize: 19 }}>{n.ic}</span>
            <span style={{ fontSize: 10, fontWeight: 700 }}>{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
