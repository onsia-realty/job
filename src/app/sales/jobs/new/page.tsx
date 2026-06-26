'use client';

import { useState, useEffect, useMemo, useRef, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { uploadImage } from '@/lib/upload';
import { PRICING_TIERS, findOption, getExposureDays, getDiscountRate, type DurationOption } from '@/lib/toss';
import type { SalesJobType, SalesPosition, SalaryType } from '@/types';
import { REGIONS } from '@/types';

// ── 디자인 토큰 (핸드오프 BOOIN 공고등록) ──────────────────────────────────────
const C = {
  bg: '#F4F5F7', ink: '#11141C', primary: '#2563EB', white: '#fff',
  borderField: '#E3E6EB', borderCard: '#ECEEF1', borderHead: '#E7E9EE',
  title: '#111827', body: '#4B5563', sub: '#6B7280', muted: '#9098A4', faint: '#B6BCC6',
  red: '#EF4444',
};

// 직책 배지 색
function posColor(p: string) {
  if (p === '본부장') return { bg: '#FCE7F3', color: '#DB2777' };
  if (p === '팀장') return { bg: '#E0E7FF', color: '#4F46E5' };
  if (p === '팀원') return { bg: '#CFFAFE', color: '#0891B2' };
  return { bg: '#DCFCE7', color: '#16A34A' }; // 팀/기타
}
function posBadge(p: string): CSSProperties {
  const c = posColor(p);
  return { background: c.bg, color: c.color, fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 5, whiteSpace: 'nowrap', flex: '0 0 auto' };
}
function pill(active: boolean): CSSProperties {
  return active
    ? { height: 36, padding: '0 16px', borderRadius: 99, border: '1px solid #11141C', background: '#11141C', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }
    : { height: 36, padding: '0 16px', borderRadius: 99, border: `1px solid ${C.borderField}`, background: '#fff', color: C.body, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
}

// ── 데이터 매핑 (핸드오프 → 우리 API enum) ─────────────────────────────────────
const TYPE_OPTIONS: { v: SalesJobType; l: string }[] = [
  { v: 'apartment', l: '아파트' }, { v: 'officetel', l: '오피스텔' },
  { v: 'store', l: '상가' }, { v: 'industrial', l: '지산' },
];
const ROLE_LIST = ['본부장', '팀장', '팀원', '기타'];
const ROLE_TO_POSITION: Record<string, SalesPosition> = { 본부장: 'headTeam', 팀장: 'teamLead', 팀원: 'member', 기타: 'member' };
const PAY_TYPES = ['계약수수료', '기본급', '기본급 + 인센'];
const PAYTYPE_TO_SALARY: Record<string, SalaryType> = { 계약수수료: 'commission', 기본급: 'base_incentive', '기본급 + 인센': 'base_incentive' };
const MEAL_LIST = ['미제공', '조식', '중식', '석식', '기타'];
const BENEFIT_LIST = ['일비', '숙소비', '영업비', 'MGM', '광고비'];
const QUICK_AMTS = [500, 1000, 1500, 2500];

const DEV_FIELDS = [
  { key: 'developer', label: '시행사', req: true, ph: '시행사명을 입력해주세요' },
  { key: 'agency', label: '대행사', req: true, ph: '대행사명을 입력해주세요' },
  { key: 'builder', label: '시공사', req: false, ph: '시공사명을 입력해주세요' },
  { key: 'trust', label: '신탁사', req: false, ph: '신탁사명을 입력해주세요' },
] as const;

// 광고 등급 표현 메타. 가격·기간은 toss.ts(PRICING_TIERS) 단일 출처에서 파생.
// previewSection = /sales 미리보기에서 하이라이트할 data-section (다이아는 전용 섹션 전까지 superior 영역에 표기).
const AD_META = [
  { name: '유니크', tier: 'unique', productKey: 'sales-unique', previewSection: 'unique', accent: '#E5B968', tagline: '지역 단독 1자리 · 메인 최상단 고정 노출' },
  { name: '다이아', tier: 'dia', productKey: 'sales-dia', previewSection: 'superior', accent: '#C9B6FF', tagline: '추천 영역 상단 고정 · 다이아 강조 노출' },
  { name: '슈페리어', tier: 'superior', productKey: 'sales-superior', previewSection: 'superior', accent: '#8AE5E5', tagline: '추천 영역 상단 · 썸네일 강조 노출' },
  { name: '베이직', tier: 'premium', productKey: 'sales-premium', previewSection: 'premium', accent: '#9DBCFF', tagline: '적극 채용 영역 · 7일+7일 기본' },
  { name: '일반', tier: 'normal', productKey: null, previewSection: 'normal', accent: '#7FE3D6', tagline: '기본 목록 노출' },
] as const;
type AdMeta = (typeof AD_META)[number];

// 등급의 표시 옵션: 단일옵션(프리미엄/agent)은 그것, 다중옵션은 선택 일수(adDays) 기준.
function adOption(productKey: string | null, adDays: number): DurationOption | null {
  if (!productKey) return null;
  const tier = PRICING_TIERS[productKey];
  if (!tier) return null;
  return tier.options.length === 1 ? tier.options[0] : (findOption(productKey, adDays) ?? tier.options[0]);
}

const DRAFT_KEY = 'sales-job-draft-v2';

type Pay = Record<string, string>;
const INITIAL = {
  mode: 'direct' as 'direct' | 'load',
  title: '', type: '' as '' | SalesJobType, region: '서울', addr: '',
  developer: '', agency: '', builder: '', trust: '',
  sub: '', detail: '',
  roles: [] as string[], deployDate: '', immediate: false,
  payType: '계약수수료', pay: { 본부장: '', 팀장: '', 팀원: '', 기타: '', 팀: '' } as Pay, consultOnly: false,
  meals: ['미제공'] as string[],
  benefits: { 일비: '미제공', 숙소비: '미제공', 영업비: '미제공', MGM: '미제공', 광고비: '미제공' } as Record<string, string>,
  contact: '', phone: '', adTier: '일반',
};
type Form = typeof INITIAL;

// HTML 이스케이프
function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function NewJobPage() {
  const router = useRouter();
  const { user: authUser, session, isLoading: authLoading } = useAuth();

  const [f, setF] = useState<Form>(INITIAL);
  const [adDaysByTier, setAdDaysByTier] = useState<Record<string, number>>({}); // 광고 기간 선택 (등급별 독립)
  const daysFor = (key: string | null) => {
    if (!key) return 20;
    if (adDaysByTier[key] != null) return adDaysByTier[key];
    return PRICING_TIERS[key]?.options[0]?.days === 7 ? 7 : 20; // 7+7 베이직은 7일 기본, 그 외 20일
  };
  const setDaysFor = (key: string, d: number) => setAdDaysByTier((s) => ({ ...s, [key]: d }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState(false);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [postcodeReady, setPostcodeReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pvRef = useRef<HTMLIFrameElement>(null);

  const set = (patch: Partial<Form>) => setF((p) => ({ ...p, ...patch }));

  // 인증 게이트
  const meta = authUser?.user_metadata as Record<string, unknown> | undefined;
  const isVerified = meta?.brokerVerified === true || meta?.businessVerified === true;
  useEffect(() => {
    if (!authLoading && authUser && !isVerified) setShowVerification(true);
  }, [authUser, authLoading, isVerified]);

  // 회원정보 prefill
  useEffect(() => {
    if (!authUser) return;
    setF((p) => ({
      ...p,
      contact: p.contact || (typeof meta?.name === 'string' ? meta.name : ''),
      phone: p.phone || (typeof meta?.phone === 'string' ? meta.phone : ''),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  // 임시저장 감지
  useEffect(() => {
    try { if (localStorage.getItem(DRAFT_KEY)) setDraftPrompt(true); } catch { /* ignore */ }
  }, []);

  // Daum 우편번호 스크립트
  useEffect(() => {
    if (window.daum?.Postcode) { setPostcodeReady(true); return; }
    const existing = document.getElementById('daum-postcode-script');
    if (existing) { existing.addEventListener('load', () => setPostcodeReady(true)); return; }
    const s = document.createElement('script');
    s.id = 'daum-postcode-script';
    s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    s.async = true;
    s.onload = () => setPostcodeReady(true);
    document.head.appendChild(s);
  }, []);

  const openPostcode = () => {
    if (!postcodeReady || !window.daum?.Postcode) return;
    new window.daum.Postcode({
      oncomplete: (d) => set({ addr: d.roadAddress || d.jibunAddress || d.address }),
    }).open();
  };

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setF((p) => ({ ...p, ...(JSON.parse(raw) as Partial<Form>) }));
    } catch { /* ignore */ }
    setDraftPrompt(false);
  };
  const saveDraft = () => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(f)); alert('임시저장 완료!'); } catch { /* ignore */ }
  };

  // 토글 핸들러
  const toggleRole = (r: string) => {
    setF((p) => {
      if (p.roles.includes(r)) return { ...p, roles: p.roles.filter((x) => x !== r) };
      if (p.roles.length < 2) return { ...p, roles: [...p.roles, r] };
      return p;
    });
  };
  const toggleMeal = (m: string) => {
    setF((p) => {
      if (m === '미제공') return { ...p, meals: ['미제공'] };
      let meals = p.meals.filter((x) => x !== '미제공');
      meals = meals.includes(m) ? meals.filter((x) => x !== m) : [...meals, m];
      if (meals.length === 0) meals = ['미제공'];
      return { ...p, meals };
    });
  };
  const addPay = (role: string, amt: number) => {
    setF((p) => {
      const cur = parseInt((p.pay[role] || '0').replace(/[^0-9]/g, '')) || 0;
      return { ...p, pay: { ...p.pay, [role]: (cur + amt).toLocaleString() } };
    });
  };
  const setPay = (role: string, v: string) => setF((p) => ({ ...p, pay: { ...p.pay, [role]: v } }));

  const onPhone = (v: string) => {
    let x = v.replace(/[^0-9]/g, '').slice(0, 11);
    if (x.length > 7) x = `${x.slice(0, 3)}-${x.slice(3, 7)}-${x.slice(7)}`;
    else if (x.length > 3) x = `${x.slice(0, 3)}-${x.slice(3)}`;
    set({ phone: x });
  };

  const onThumb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setThumbPreview(reader.result as string);
    reader.readAsDataURL(file);
  };
  const removeThumb = () => { setThumbFile(null); setThumbPreview(null); if (fileRef.current) fileRef.current.value = ''; };

  // 완성도
  const completion = useMemo(() => {
    const checks = [
      !!f.title, f.type !== '', !!f.addr, !!f.sub,
      f.roles.length > 0, f.consultOnly || Object.values(f.pay).some((v) => v),
      !!f.contact, !!f.phone,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [f]);

  const c1 = !!f.title && f.type !== '' && !!f.addr && !!f.region;
  const c2 = f.sub.length > 0;
  const c3 = f.roles.length > 0 && (f.consultOnly || Object.values(f.pay).some((v) => v));
  const c4 = !!f.contact && !!f.phone;

  // 선택 광고 등급 + 주문 요약 (가격은 toss.ts 단일 출처에서)
  const selMeta: AdMeta = AD_META.find((m) => m.name === f.adTier) ?? AD_META[AD_META.length - 1];
  const selTier = selMeta.productKey ? PRICING_TIERS[selMeta.productKey] : null;
  const selHasDuration = (selTier?.options.length ?? 0) > 1; // 10/20/30 토글 노출 여부
  const selDays = daysFor(selMeta.productKey);
  const selOpt = adOption(selMeta.productKey, selDays);
  const selPrice = selOpt?.price ?? 0;
  const selList = selOpt?.listPrice ?? 0;
  const adDiscount = selList - selPrice;
  const selExposure = selOpt ? getExposureDays(selOpt) : 0;

  // 미리보기 iframe(/sales 축소판)에서 선택 등급 섹션을 하이라이트
  useEffect(() => {
    const ifr = pvRef.current;
    if (!ifr) return;
    const apply = () => {
      try {
        const doc = ifr.contentDocument;
        if (!doc) return;
        // 미리보기에서는 좌측 네비/우측 사이드바/하단탭 숨기고 피드만 표시(실제 /sales는 그대로)
        if (!doc.getElementById('__pv_style') && doc.head) {
          const st = doc.createElement('style');
          st.id = '__pv_style';
          st.textContent = '.bn-leftnav{display:none!important}.bn-body{margin-left:0!important}.bn-side{display:none!important}.bn-main{grid-template-columns:minmax(0,1fr)!important}.bn-bottomnav{display:none!important}';
          doc.head.appendChild(st);
        }
        doc.querySelectorAll('[data-adhl="1"]').forEach((e) => {
          const x = e as HTMLElement;
          x.style.outline = ''; x.style.outlineOffset = ''; x.style.boxShadow = ''; x.style.position = ''; x.style.zIndex = ''; x.style.borderRadius = ''; x.removeAttribute('data-adhl');
        });
        const t = doc.querySelector(`[data-section="${selMeta.previewSection}"]`) as HTMLElement | null;
        if (t) {
          // 클릭 섹션 = 빨간 테두리 + 거대 box-shadow로 나머지를 어둡게(스포트라이트)
          t.style.position = 'relative';
          t.style.zIndex = '9999';
          t.style.borderRadius = '14px';
          t.style.boxShadow = '0 0 0 14px #EF4444, 0 0 0 9999px rgba(0,0,0,0.64)';
          t.setAttribute('data-adhl', '1');
          // 선택 섹션을 미리보기 창 상단으로 스크롤
          const rect = t.getBoundingClientRect();
          const top = rect.top + (ifr.contentWindow?.scrollY || 0);
          try { ifr.contentWindow?.scrollTo({ top: Math.max(0, top - 140) }); } catch { /* noop */ }
        }
      } catch { /* iframe 준비 전 */ }
    };
    apply();
    ifr.addEventListener('load', apply);
    const timer = setTimeout(apply, 700);
    return () => { ifr.removeEventListener('load', apply); clearTimeout(timer); };
  }, [selMeta.previewSection]);

  // 제출
  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!f.title.trim()) { alert('현장명을 입력해주세요'); return; }
    if (f.type === '') { alert('종류를 선택해주세요'); return; }
    if (!f.addr.trim()) { alert('사업지 주소를 입력해주세요'); return; }
    if (!f.sub.trim()) { alert('한줄 소개를 입력해주세요'); return; }
    if (f.roles.length === 0) { alert('모집 직책을 선택해주세요'); return; }
    if (!f.contact.trim() || !f.phone.trim()) { alert('담당자 정보를 입력해주세요'); return; }
    if (!session?.access_token) { alert('세션이 만료되었습니다. 다시 로그인해주세요.'); return; }

    setIsSubmitting(true);
    try {
      let thumbnailUrl: string | null = null;
      if (thumbFile) {
        thumbnailUrl = await uploadImage(thumbFile, 'thumbnails');
        if (!thumbnailUrl) { alert('이미지 업로드에 실패했습니다.'); setIsSubmitting(false); return; }
      }

      // 핸드오프 신규 필드 → html_content 구조화 (데이터 손실 방지)
      const blocks: string[] = [];
      if (f.detail.trim()) blocks.push(esc(f.detail).replace(/\n/g, '<br/>'));
      const dev = DEV_FIELDS.map((d) => (f[d.key] ? `${d.label}: ${esc(String(f[d.key]))}` : null)).filter(Boolean);
      if (dev.length) blocks.push(`<b>분양 시행 정보</b><br/>${dev.join('<br/>')}`);
      if (f.immediate || f.deployDate) blocks.push(`<b>투입일</b><br/>${f.immediate ? '즉시 투입' : esc(f.deployDate)}`);
      const payLines = f.roles.map((r) => (f.pay[r] ? `${r}: ${esc(f.pay[r])}만원` : null)).filter(Boolean);
      if (f.consultOnly) payLines.push('상담 시 문의');
      if (payLines.length) blocks.push(`<b>계약수수료 (${f.payType})</b><br/>${payLines.join('<br/>')}`);
      const html = blocks.join('<br/><br/>');

      // 혜택 → benefits[]
      const benefits: string[] = [];
      f.meals.filter((m) => m !== '미제공').forEach((m) => benefits.push(`식사(${m})`));
      BENEFIT_LIST.forEach((b) => { if (f.benefits[b] === '지원') benefits.push(`${b} 지원`); });

      // 대표 직책/수수료
      const primaryRole = f.roles[0] || '팀원';
      const primaryAmt = (f.pay[primaryRole] || '').replace(/[^0-9]/g, '');

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: f.title.trim(),
          company: f.agency || f.developer || f.title.trim(),
          description: f.sub.trim(),
          html_content: html || null,
          category: 'sales',
          type: f.type,
          position: ROLE_TO_POSITION[primaryRole] || 'member',
          salary_type: PAYTYPE_TO_SALARY[f.payType] || 'commission',
          salary_amount: primaryAmt ? `${primaryAmt}만원` : null,
          benefits,
          experience: 'none',
          company_type: 'agency',
          region: f.region,
          address: f.addr || null,
          thumbnail: thumbnailUrl,
          phone: f.phone || null,
          contact_name: f.contact || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('공고 등록에 실패했습니다: ' + (err.error || '알 수 없는 오류'));
        setIsSubmitting(false);
        return;
      }
      const data = await res.json().catch(() => null);
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }

      // 유료 등급 선택 시 토스 결제(checkout)로 이동 — 결제 성공 후 confirm API가 tier 승급
      if (selMeta.productKey && data?.id) {
        const daysQs = selHasDuration ? `&days=${selDays}` : '';
        router.push(`/checkout?productKey=${selMeta.productKey}${daysQs}&jobId=${data.id}`);
        return;
      }
      alert('공고가 등록되었습니다!');
      router.push('/sales');
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 스타일 단편 ───────────────────────────────────────────────────────────
  const fieldWrap: CSSProperties = { border: `1px solid ${C.borderField}`, borderRadius: 9, background: '#fff', padding: '0 14px' };
  const inputBase: CSSProperties = { width: '100%', border: 'none', background: 'none', padding: '13px 0', fontSize: 15, color: C.title, outline: 'none' };
  const labelStyle: CSSProperties = { fontSize: 14, fontWeight: 700, marginBottom: 9 };
  const reqMark = <span style={{ color: C.red }}>*</span>;
  const optMark = <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>(선택)</span>;
  const connector: CSSProperties = { paddingLeft: 12, borderLeft: `1.5px dashed ${C.borderField}`, marginLeft: 11 };
  const inner: CSSProperties = { paddingLeft: 18 };
  const sectionBadge = (n: number): CSSProperties => ({ width: 24, height: 24, borderRadius: 8, background: '#EFF4FF', color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 });

  // 미리보기(미니 피드) 헬퍼
  const ac = selMeta.accent;
  const pvLabel: CSSProperties = { fontSize: 10.5, fontWeight: 700, color: '#7C859B', marginBottom: 6 };
  const bar = (w: string, on: boolean): CSSProperties => ({ height: 6, width: w, borderRadius: 4, background: on ? ac : '#2A3142' });
  const meTag: CSSProperties = { fontSize: 9.5, fontWeight: 800, color: C.ink, background: ac, padding: '2px 6px', borderRadius: 99, flex: '0 0 auto' };

  const SectionHead = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
      <span style={sectionBadge(n)}>{n}</span>
      <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>{children}</h2>
    </div>
  );

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontFamily: 'Pretendard, sans-serif' }}>
        불러오는 중...
      </div>
    );
  }

  const payRowRoles = f.roles.length ? f.roles : ['팀'];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.title, fontFamily: "'Pretendard', -apple-system, sans-serif", WebkitFontSmoothing: 'antialiased', paddingBottom: 80 }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fastly.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" rel="stylesheet" />
      <style>{`
        .bn-field:focus-within { border-color:#11141C !important; }
        .bn-bottomnav{display:none}
        @media(max-width:1180px){.bn-side{display:none!important}.bn-main{grid-template-columns:1fr!important}}
        @media(max-width:920px){.bn-leftnav{display:none!important}.bn-body{margin-left:0!important}.bn-bottomnav{display:flex!important}}
        @media(max-width:720px){.bn-2col{grid-template-columns:1fr!important}}
        @media(max-width:1120px){.bn-adgrid{grid-template-columns:1fr!important}.bn-adpreview{display:none!important}}
      `}</style>

      {/* ── 인증 게이트 모달 ── */}
      {showVerification && !isVerified && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 18, padding: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, textAlign: 'center', margin: '0 0 8px' }}>기업 인증이 필요합니다</h2>
            <p style={{ fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 1.6, margin: '0 0 22px' }}>
              공고를 등록하려면 중개사무소 등록번호 또는<br />사업자등록번호 인증이 필요합니다.
            </p>
            <Link href="/agent/mypage/verification" style={{ display: 'block', width: '100%', padding: '14px 0', background: C.primary, color: '#fff', borderRadius: 10, fontWeight: 800, textAlign: 'center', textDecoration: 'none', marginBottom: 10 }}>인증하러 가기</Link>
            <button type="button" onClick={() => router.back()} style={{ display: 'block', width: '100%', padding: '14px 0', background: '#F1F3F6', color: C.body, border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>돌아가기</button>
          </div>
        </div>
      )}

      {/* ── 임시저장 복원 배너 ── */}
      {draftPrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 90, background: C.primary, color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 13 }}>
          <span>임시저장된 작성 내용이 있습니다.</span>
          <button type="button" onClick={restoreDraft} style={{ padding: '4px 12px', background: '#fff', color: C.primary, border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>불러오기</button>
          <button type="button" onClick={() => setDraftPrompt(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* ── 좌측 글로벌 네비 ── */}
      <aside className="bn-leftnav" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 240, background: C.ink, color: '#fff', zIndex: 60, display: 'flex', flexDirection: 'column', padding: '22px 0' }}>
        <Link href="/sales" style={{ display: 'flex', alignItems: 'baseline', gap: 7, padding: '0 24px 22px', textDecoration: 'none', color: '#fff' }}>
          <span style={{ fontSize: 25, fontWeight: 800, letterSpacing: -.5 }}>BOOIN</span>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: '#7C859B' }}>부동산인</span>
        </Link>
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { ic: '⌂', label: '홈', href: '/sales' }, { ic: '◆', label: '구인구직', href: '/sales', active: true },
            { ic: '◇', label: '커뮤니티', href: '/sales' }, { ic: '◈', label: 'BOOIN톡', href: '/sales' },
            { ic: '✦', label: '서비스', href: '/sales' }, { ic: '○', label: 'MY', href: '/sales/mypage' },
          ].map((n) => (
            <Link key={n.label} href={n.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none', background: n.active ? 'rgba(255,255,255,.08)' : 'transparent', color: n.active ? '#fff' : C.muted }}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{n.ic}</span><span>{n.label}</span>
            </Link>
          ))}
        </div>
        <div style={{ marginTop: 'auto', padding: 16 }}>
          <div style={{ background: 'linear-gradient(135deg,#1E293B,#0F1623)', border: '1px solid #232B3A', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>작성 TIP</div>
            <div style={{ fontSize: 11, color: '#8B93A7', lineHeight: 1.55 }}>수수료·복리후생을 자세히 적을수록<br />지원율이 올라갑니다.</div>
          </div>
        </div>
      </aside>

      <div className="bn-body" style={{ marginLeft: 240 }}>
        {/* ── 헤더 ── */}
        <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,.86)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.borderHead}` }}>
          <div style={{ maxWidth: 1320, margin: '0 auto', padding: '13px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.primary }}>구인공고</span>
              <span style={{ width: 1, height: 11, background: '#D7DBE2' }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: C.title }}>분양인재</span>
              <span style={{ width: 1, height: 11, background: '#D7DBE2' }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: C.title }}>분양대행</span>
            </nav>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>{f.contact ? `${f.contact}님` : '내 계정'}</span>
              <Link href="/sales" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: '#F1F3F6', border: `1px solid ${C.borderHead}`, borderRadius: 10, textDecoration: 'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></svg>
              </Link>
            </div>
          </div>
        </header>

        <main className="bn-main" style={{ maxWidth: 1320, margin: '0 auto', padding: 24, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 26, alignItems: 'start' }}>
          {/* ── 좌측: 폼 ── */}
          <div style={{ minWidth: 0 }}>
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 5px' }}>공고 등록</h1>
              <p style={{ fontSize: 15, color: C.sub, margin: 0 }}>현장 정보를 입력하면 BOOIN이 맞춤 인재에게 연결해 드려요.</p>
            </div>

            <div style={{ background: '#fff', border: `1px solid ${C.borderCard}`, borderRadius: 18, padding: '28px 30px', display: 'flex', flexDirection: 'column', gap: 40 }}>

              {/* SECTION 1 */}
              <section>
                <SectionHead n={1}>현장 기본 정보</SectionHead>
                <div style={connector}>
                  <div style={{ ...inner, display: 'flex', flexDirection: 'column', gap: 22 }}>
                    <div className="bn-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        { key: 'direct', ic: '✍', title: '직접 입력', desc: '새 현장 정보를 직접 작성합니다' },
                        { key: 'load', ic: '📂', title: '이전 공고 불러오기', desc: '등록했던 현장 정보를 불러옵니다' },
                      ].map((m) => {
                        const sel = f.mode === m.key;
                        return (
                          <button key={m.key} type="button" onClick={() => set({ mode: m.key as 'direct' | 'load' })}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 22px', borderRadius: 12, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', border: sel ? '2px solid #2563EB' : `1px solid ${C.borderField}`, boxShadow: sel ? '0 0 8px rgba(37,99,235,.22)' : 'none' }}>
                            <span style={{ width: 44, height: 44, borderRadius: 99, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flex: '0 0 auto' }}>{m.ic}</span>
                            <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span style={{ fontSize: 15, fontWeight: 800, color: C.title }}>{m.title}</span>
                              <span style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.4 }}>{m.desc}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="bn-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={labelStyle}>현장명 {reqMark}</div>
                        <div className="bn-field" style={fieldWrap}>
                          <input value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="예: 힐스테이트 광교" style={inputBase} />
                        </div>
                      </div>
                      <div>
                        <div style={labelStyle}>종류 {reqMark}</div>
                        <select value={f.type} onChange={(e) => set({ type: e.target.value as SalesJobType })} style={{ width: '100%', border: `1px solid ${C.borderField}`, borderRadius: 9, padding: '13px 14px', fontSize: 15, background: '#fff', color: f.type ? C.title : C.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
                          <option value="">선택해주세요</option>
                          {TYPE_OPTIONS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="bn-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={labelStyle}>지역 {reqMark}</div>
                        <select value={f.region} onChange={(e) => set({ region: e.target.value })} style={{ width: '100%', border: `1px solid ${C.borderField}`, borderRadius: 9, padding: '13px 14px', fontSize: 15, background: '#fff', color: C.title, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={labelStyle}>사업지 주소 {reqMark}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div className="bn-field" style={{ ...fieldWrap, flex: 1 }}>
                            <input value={f.addr} readOnly onClick={openPostcode} placeholder="주소 검색으로 입력해주세요" style={{ ...inputBase, cursor: 'pointer' }} />
                          </div>
                          <button type="button" onClick={openPostcode} style={{ flex: '0 0 auto', background: C.ink, color: '#fff', border: 'none', borderRadius: 9, padding: '0 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>주소검색</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 2 */}
              <section>
                <SectionHead n={2}>분양 시행정보</SectionHead>
                <div style={connector}>
                  <div className="bn-2col" style={{ ...inner, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {DEV_FIELDS.map((d) => (
                      <div key={d.key}>
                        <div style={labelStyle}>{d.label} {d.req ? reqMark : optMark}</div>
                        <div className="bn-field" style={fieldWrap}>
                          <input value={f[d.key]} onChange={(e) => set({ [d.key]: e.target.value } as Partial<Form>)} placeholder={d.ph} style={inputBase} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* SECTION 3 */}
              <section>
                <SectionHead n={3}>현장 설명</SectionHead>
                <div style={connector}>
                  <div style={{ ...inner, display: 'flex', flexDirection: 'column', gap: 22 }}>
                    <div>
                      <div style={labelStyle}>한줄 소개 {reqMark}</div>
                      <div className="bn-field" style={fieldWrap}>
                        <input value={f.sub} onChange={(e) => set({ sub: e.target.value.slice(0, 50) })} maxLength={50} placeholder="예: 최고 수수료 조건! 숙소+일비 지원, 즉시 출근 가능" style={inputBase} />
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 12, color: C.faint, marginTop: 6 }}>{f.sub.length}/50</div>
                    </div>
                    <div>
                      <div style={labelStyle}>상세 정보 {optMark}</div>
                      <textarea value={f.detail} onChange={(e) => set({ detail: e.target.value })} placeholder={'• 현장 강점과 분양 실적\n• 근무 시간·출퇴근 조건\n• 지원자에게 어필할 포인트'} style={{ width: '100%', height: 160, resize: 'none', border: `1px solid ${C.borderField}`, borderRadius: 9, padding: '13px 14px', fontSize: 14, lineHeight: 1.6, color: C.title, fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                    <div>
                      <div style={labelStyle}>현장 이미지 {optMark}</div>
                      <input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={onThumb} style={{ display: 'none' }} />
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <button type="button" onClick={() => fileRef.current?.click()} style={{ flex: '0 0 auto', width: 100, height: 78, borderRadius: 9, background: thumbPreview ? `center/cover no-repeat url(${thumbPreview})` : '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, position: 'relative', overflow: 'hidden' }}>
                          {!thumbPreview && (<>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9098A4" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3" /></svg>
                            <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{thumbPreview ? '1/1' : '0/1'}</span>
                          </>)}
                        </button>
                        {thumbPreview ? (
                          <button type="button" onClick={removeThumb} style={{ fontSize: 12.5, color: C.red, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}>이미지 삭제</button>
                        ) : (
                          <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <li style={{ fontSize: 12.5, color: C.muted }}>파일당 5MB 이하 · PNG, JPG</li>
                            <li style={{ fontSize: 12.5, color: C.muted }}>목록에서 4:3 비율로 표시됩니다</li>
                            <li style={{ fontSize: 12.5, color: C.muted }}>조감도 등 현장 이미지를 등록해주세요</li>
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 4 */}
              <section>
                <SectionHead n={4}>모집 정보 <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>(직책 최대 2개)</span></SectionHead>
                <div style={connector}>
                  <div style={{ ...inner, display: 'flex', flexDirection: 'column', gap: 26 }}>
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                      {ROLE_LIST.map((r) => <button key={r} type="button" onClick={() => toggleRole(r)} style={pill(f.roles.includes(r))}>{r}</button>)}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>투입일 {reqMark}</span>
                        <label style={{ fontSize: 13, color: C.sub, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <input type="checkbox" checked={f.immediate} onChange={(e) => set({ immediate: e.target.checked })} /> 즉시 투입
                        </label>
                      </div>
                      <div className="bn-field" style={fieldWrap}>
                        <input type="date" value={f.deployDate} disabled={f.immediate} onChange={(e) => set({ deployDate: e.target.value })} style={{ ...inputBase, color: f.immediate ? C.muted : C.title }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 13 }}>급여 형태</div>
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 }}>
                        {PAY_TYPES.map((t) => <button key={t} type="button" onClick={() => set({ payType: t })} style={pill(f.payType === t)}>{t}</button>)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>계약수수료 정보 {reqMark}</span>
                        <label style={{ fontSize: 13, color: C.sub, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <input type="checkbox" checked={f.consultOnly} onChange={(e) => set({ consultOnly: e.target.checked })} /> 상담 시 문의
                        </label>
                      </div>
                      <div className="bn-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {payRowRoles.map((r) => (
                          <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                            <div className="bn-field" style={{ ...fieldWrap, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={posBadge(r)}>{r}</span>
                              <input value={f.pay[r] || ''} onChange={(e) => setPay(r, e.target.value)} placeholder="1,000" style={{ ...inputBase, flex: 1, minWidth: 0 }} />
                              <span style={{ fontSize: 14, color: C.sub }}>만원</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {QUICK_AMTS.map((a) => <button key={a} type="button" onClick={() => addPay(r, a)} style={{ background: '#F3F4F6', border: 'none', borderRadius: 6, padding: '6px 9px', fontSize: 12, fontWeight: 700, color: C.body, cursor: 'pointer', fontFamily: 'inherit' }}>+{a.toLocaleString()}만</button>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 5 */}
              <section>
                <SectionHead n={5}>복리후생</SectionHead>
                <div style={connector}>
                  <div style={{ ...inner, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 9 }}>식사제공 <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>(중복 선택 가능)</span></div>
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                        {MEAL_LIST.map((m) => <button key={m} type="button" onClick={() => toggleMeal(m)} style={pill(f.meals.includes(m))}>{m}</button>)}
                      </div>
                    </div>
                    <div className="bn-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 20px' }}>
                      {BENEFIT_LIST.map((b) => {
                        const on = f.benefits[b] === '지원';
                        const base: CSSProperties = { flex: 1, height: 40, borderRadius: 99, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
                        const tStyle = (active: boolean): CSSProperties => ({ ...base, fontWeight: active ? 800 : 600, border: active ? '1px solid #11141C' : `1px solid ${C.borderField}`, background: active ? '#11141C' : '#fff', color: active ? '#fff' : C.body });
                        return (
                          <div key={b}>
                            <div style={{ ...labelStyle, marginBottom: 9 }}>{b}</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="button" onClick={() => set({ benefits: { ...f.benefits, [b]: '미제공' } })} style={tStyle(!on)}>미제공</button>
                              <button type="button" onClick={() => set({ benefits: { ...f.benefits, [b]: '지원' } })} style={tStyle(on)}>지원</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 6 */}
              <section>
                <SectionHead n={6}>담당자 연락처</SectionHead>
                <div style={connector}>
                  <div style={{ ...inner, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <div style={labelStyle}>담당자명 {reqMark}</div>
                      <div className="bn-field" style={fieldWrap}>
                        <input value={f.contact} onChange={(e) => set({ contact: e.target.value })} placeholder="담당자명을 입력해주세요" style={inputBase} />
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>연락처 {reqMark}</div>
                      <div className="bn-field" style={fieldWrap}>
                        <input value={f.phone} onChange={(e) => onPhone(e.target.value)} placeholder="010-1234-5678" inputMode="numeric" style={inputBase} />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 7 */}
              <section>
                <SectionHead n={7}>유료 노출 <span style={{ color: C.primary }}>상품</span></SectionHead>
                <div style={connector}>
                  <div style={inner}>
                    <div className="bn-adgrid" style={{ display: 'grid', gridTemplateColumns: '320px minmax(0,1fr)', gap: 18, borderRadius: 14, background: C.ink, padding: 18 }}>
                      <div className="bn-adpreview" style={{ borderRadius: 12, background: '#0E121A', border: '1px solid #232B3A', padding: 14, alignSelf: 'start' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#9AA3B5', marginBottom: 3 }}>실제 노출 미리보기</div>
                        <div style={{ fontSize: 11, color: '#5C6677', marginBottom: 12 }}>결제하면 내 공고가 실제 화면의 이 위치에 노출돼요.</div>
                        <div style={{ position: 'relative', width: '100%', height: 548, borderRadius: 10, overflow: 'hidden', border: '1px solid #232B3A', background: '#F4F5F7' }}>
                          <iframe ref={pvRef} src="/sales" title="노출 미리보기" scrolling="no" tabIndex={-1} style={{ width: 1280, height: 2400, border: 'none', transform: 'scale(0.228)', transformOrigin: 'top left', pointerEvents: 'none' }} />
                        </div>
                        <div style={{ display: 'none' }}>{/* legacy mini-feed (replaced by live preview) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 13, background: '#12161F', borderRadius: 10, padding: 12 }}>

                          {/* 프리미엄 대표 현장 (unique) */}
                          <div>
                            <div style={pvLabel}>프리미엄 대표 현장</div>
                            {(() => { const on = selMeta.tier === 'unique'; return (
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, borderRadius: 8, border: on ? `1.5px solid ${ac}` : '1px solid #232B3A', background: on ? '#161C27' : 'transparent' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 6, background: on ? ac : '#2A3142', flex: '0 0 auto' }} />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <div style={bar(on ? '72%' : '60%', on)} />
                                  <div style={bar('40%', false)} />
                                </div>
                                {on && <span style={meTag}>내 광고</span>}
                              </div>
                            ); })()}
                          </div>

                          {/* 추천 현장 (superior) — 2x2 */}
                          <div>
                            <div style={pvLabel}>추천 현장</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                              {[0, 1, 2, 3].map((i) => { const on = (selMeta.tier === 'superior' || selMeta.tier === 'dia') && i === 0; return (
                                <div key={i} style={{ borderRadius: 7, padding: 7, border: on ? `1.5px solid ${ac}` : '1px solid #232B3A', background: on ? '#161C27' : 'transparent', position: 'relative' }}>
                                  <div style={{ height: 24, borderRadius: 5, background: on ? ac : '#2A3142', marginBottom: 6 }} />
                                  <div style={bar('80%', on)} />
                                  {on && <span style={{ ...meTag, position: 'absolute', top: 5, right: 5 }}>내 광고</span>}
                                </div>
                              ); })}
                            </div>
                          </div>

                          {/* 광고대행사 전문 노출 */}
                          <div style={{ borderRadius: 8, background: 'linear-gradient(90deg,#EA580C,#F59E0B)', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12 }}>📣</span>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#fff' }}>광고대행사 전문 노출</span>
                          </div>

                          {/* 적극 채용 중인 공고 (premium) */}
                          <div>
                            <div style={pvLabel}>적극 채용 중인 공고</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {[0, 1].map((i) => { const on = selMeta.tier === 'premium' && i === 0; return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 7, borderRadius: 7, border: on ? `1.5px solid ${ac}` : '1px solid #232B3A', background: on ? '#161C27' : 'transparent' }}>
                                  <div style={{ width: 26, height: 26, borderRadius: 5, background: on ? ac : '#2A3142', flex: '0 0 auto' }} />
                                  <div style={{ flex: 1 }}><div style={bar(on ? '70%' : '55%', on)} /></div>
                                  {on && <span style={meTag}>내 광고</span>}
                                </div>
                              ); })}
                            </div>
                          </div>

                          {/* 기본 목록 (normal) */}
                          <div>
                            <div style={pvLabel}>기본 목록</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {[0, 1, 2].map((i) => { const on = selMeta.tier === 'normal' && i === 0; return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 6, border: on ? `1.5px solid ${ac}` : '1px solid transparent', background: on ? '#161C27' : 'transparent' }}>
                                  <div style={{ flex: 1 }}><div style={bar(on ? '62%' : '45%', on)} /></div>
                                  {on && <span style={meTag}>내 광고</span>}
                                </div>
                              ); })}
                            </div>
                          </div>
                        </div>
                      </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 17 }}>🎁</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>노출 등급 상품 · 오픈 기념 특별가</span>
                      </div>
                      {AD_META.map((m) => {
                        const sel = f.adTier === m.name;
                        const tier = m.productKey ? PRICING_TIERS[m.productKey] : null;
                        const mHasDuration = (tier?.options.length ?? 0) > 1;
                        const opt = adOption(m.productKey, daysFor(m.productKey));
                        const price = opt?.price ?? 0;
                        const list = opt?.listPrice ?? 0;
                        const disc = opt ? getDiscountRate(opt) : null;
                        const exposure = opt ? getExposureDays(opt) : 0;
                        const bonus = opt?.bonusDays ?? 0;
                        return (
                          <div key={m.name}>
                          <button type="button" onClick={() => set({ adTier: m.name })}
                            style={{ display: 'block', width: '100%', textAlign: 'left', borderRadius: 12, padding: 18, cursor: 'pointer', fontFamily: 'inherit', background: '#1A1F2B', border: sel ? `2px solid ${m.accent}` : '2px solid #2A3142' }}>
                            <span style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                              <span style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <span style={{ width: 18, height: 18, borderRadius: 99, flex: '0 0 auto', border: `1.5px solid ${sel ? m.accent : '#3A4256'}`, background: sel ? m.accent : 'transparent', display: 'inline-block', marginTop: 2 }} />
                                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 18, fontWeight: 800, color: sel ? m.accent : '#fff' }}>{m.name}</span>
                                    {bonus > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: '#0B1220', background: '#FBBF24', borderRadius: 5, padding: '1px 6px' }}>+{bonus}일 무료</span>}
                                  </span>
                                  <span style={{ fontSize: 12.5, color: '#9AA3B5' }}>{m.tagline}</span>
                                  <span style={{ fontSize: 11.5, color: '#6B7280' }}>게재기간 {m.productKey ? `${exposure}일` : '상시'}</span>
                                </span>
                              </span>
                              <span style={{ textAlign: 'right', flex: '0 0 auto' }}>
                                <span style={{ display: 'block', fontSize: 11, color: C.sub, textDecoration: list > 0 ? 'line-through' : 'none' }}>{(list > 0 ? `${list.toLocaleString()}원` : '') || ' '}</span>
                                <span style={{ display: 'flex', alignItems: 'baseline', gap: 5, justifyContent: 'flex-end' }}>
                                  {disc != null && <span style={{ fontSize: 13, fontWeight: 800, color: '#FB7185' }}>{disc}%</span>}
                                  <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -.5 }}>{price > 0 ? `${price.toLocaleString()}원` : '무료'}</span>
                                </span>
                              </span>
                            </span>
                          </button>
                          {mHasDuration && tier && m.productKey && (
                            <div style={{ display: 'flex', gap: 7, marginTop: 8, marginBottom: 2 }}>
                              {tier.options.map((o) => {
                                const active = daysFor(m.productKey) === o.days;
                                return (
                                  <button key={o.days} type="button" onClick={() => { set({ adTier: m.name }); setDaysFor(m.productKey!, o.days); }}
                                    style={{ flex: 1, position: 'relative', height: 42, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, color: active ? '#0B1220' : '#C7CEDA', background: active ? m.accent : '#222838', border: active ? `2px solid ${m.accent}` : '2px solid #2A3142' }}>
                                    {o.days}일
                                    {o.bonusDays > 0 && <span style={{ position: 'absolute', top: -8, right: -4, fontSize: 10, fontWeight: 800, color: '#0B1220', background: '#FBBF24', borderRadius: 6, padding: '1px 5px' }}>+{o.bonusDays}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 안내 박스 */}
              <div style={{ borderRadius: 12, background: '#F8F9FB', border: '1px solid #EEF0F3', padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.sub, marginBottom: 9 }}>ⓘ 공고 등록 시 유의사항</div>
                <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <li style={{ fontSize: 12.5, color: C.muted }}>등록하는 이미지 및 영상물의 저작권·초상권 확인 책임은 등록자에게 있으며, 부동산인은 이에 대한 책임을 지지 않습니다.</li>
                  <li style={{ fontSize: 12.5, color: C.muted }}>최저임금 미만의 급여 또는 연령·성별 제한 내용이 포함된 공고는 사전 경고 없이 삭제될 수 있습니다.</li>
                  <li style={{ fontSize: 12.5, color: C.muted }}>파일 링크 첨부 시 반드시 HTTPS 보안 링크를 사용해 주세요.</li>
                  <li style={{ fontSize: 12.5, color: C.muted }}>등록된 공고의 로고·이미지·상세요강은 제휴를 통해 외부 채널에 게시될 수 있습니다.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── 우측: 완성도 사이드바 ── */}
          <aside className="bn-side" style={{ position: 'sticky', top: 86, background: '#fff', border: `1px solid ${C.borderCard}`, borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 800 }}>작성 완성도</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: C.primary }}>{completion}%</span>
            </div>
            <div style={{ height: 8, width: '100%', borderRadius: 99, background: C.borderCard, overflow: 'hidden', marginBottom: 11 }}>
              <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#7FB1FF,#2563EB)', width: `${Math.max(completion, 3)}%`, transition: 'width .4s' }} />
            </div>
            <p style={{ fontSize: 13, color: C.body, margin: '0 0 18px', lineHeight: 1.5 }}><span style={{ color: C.primary, fontWeight: 700 }}>필수 항목</span>을 모두 채우면 등록할 수 있어요.</p>

            <div style={{ borderTop: '1px solid #F0F1F3', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[
                { label: '현장 정보', ok: c1 }, { label: '현장 소개', ok: c2 },
                { label: '모집 정보', ok: c3 }, { label: '담당자 정보', ok: c4 },
              ].map((c) => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: c.ok ? C.title : C.muted }}>{c.label}</span>
                  <span style={{ width: 18, height: 18, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, background: c.ok ? C.primary : C.borderCard, color: c.ok ? '#fff' : '#C2C8D2' }}>✓</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #F0F1F3', marginTop: 16, paddingTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>주문 요약</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: C.sub }}>선택 등급 · 게재기간</span>
                  <span style={{ color: C.title, fontWeight: 600 }}>{selMeta.name}{selMeta.productKey ? ` · ${selExposure}일` : ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: C.sub }}>총 선택상품금액</span>
                  <span style={{ color: C.title, fontWeight: 600 }}>{selList.toLocaleString()}원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: C.sub }}>총 할인금액</span>
                  <span style={{ color: '#FB7185', fontWeight: 600 }}>{adDiscount > 0 ? `-${adDiscount.toLocaleString()}` : '0'}원</span>
                </div>
                <div style={{ height: 1, background: '#F0F1F3', margin: '3px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>총 주문금액</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>{selPrice.toLocaleString()}원</span>
                </div>
                {selPrice > 0 && <div style={{ fontSize: 11, color: C.muted, textAlign: 'right' }}>부가세(VAT) 별도 · 결제 단계에서 합산</div>}
              </div>
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} style={{ width: '100%', height: 52, borderRadius: 10, border: 'none', background: C.primary, color: '#fff', fontSize: 16, fontWeight: 800, cursor: isSubmitting ? 'wait' : 'pointer', fontFamily: 'inherit', marginBottom: 9, opacity: isSubmitting ? .6 : 1 }}>
                {isSubmitting ? '처리 중...' : selPrice > 0 ? '토스로 결제하고 등록' : '무료로 등록하기'}
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={saveDraft} style={{ flex: 1, height: 48, borderRadius: 10, border: `1px solid ${C.borderField}`, background: '#fff', color: C.body, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>임시저장</button>
                <Link href="/sales" style={{ flex: 1, height: 48, borderRadius: 10, border: `1px solid ${C.borderField}`, background: '#fff', color: C.body, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>취소</Link>
              </div>
            </div>
          </aside>
        </main>
      </div>

      {/* ── 모바일 하단 탭 ── */}
      <nav className="bn-bottomnav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70, background: '#fff', borderTop: `1px solid ${C.borderHead}`, padding: '8px 0 calc(8px + env(safe-area-inset-bottom))', justifyContent: 'space-around' }}>
        {[
          { ic: '⌂', label: '홈', href: '/sales' }, { ic: '◆', label: '현장', href: '/sales' },
          { ic: '✎', label: '등록', href: '/sales/jobs/new', active: true }, { ic: '◇', label: '인재', href: '/sales/talents' },
          { ic: '○', label: 'MY', href: '/sales/mypage' },
        ].map((n) => (
          <Link key={n.label} href={n.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1, color: n.active ? C.primary : C.muted, textDecoration: 'none' }}>
            <span style={{ fontSize: 19 }}>{n.ic}</span><span style={{ fontSize: 10, fontWeight: 700 }}>{n.label}</span>
          </Link>
        ))}
      </nav>

      {/* 모바일 하단 등록바 */}
      <div style={{ position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 65, padding: '0 16px' }} className="bn-mobile-submit">
        <style>{`.bn-mobile-submit{display:none} @media(max-width:1180px){.bn-mobile-submit{display:block!important}}`}</style>
        <button type="button" onClick={handleSubmit} disabled={isSubmitting} style={{ width: '100%', height: 52, borderRadius: 12, border: 'none', background: C.primary, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(37,99,235,.35)', opacity: isSubmitting ? .6 : 1 }}>
          {isSubmitting ? '처리 중...' : selPrice > 0 ? `토스로 결제하고 등록 · ${selPrice.toLocaleString()}원` : `무료로 등록 · 완성도 ${completion}%`}
        </button>
      </div>
    </div>
  );
}
