'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Clock, Calendar, Building2, Briefcase,
  Users, Eye, Share2, Bookmark, BookmarkCheck, Phone,
  ExternalLink, CheckCircle2, AlertCircle, ChevronRight,
  Sparkles, Flame, Send, Heart, FileText, Award, Banknote,
  Timer, X, User, Mail, MessageSquare, Check, Star,
  GraduationCap, TrendingUp, Navigation, Globe, CalendarDays,
} from 'lucide-react';
import type { AgentJobListing, AgentJobType, AgentSalaryType, AgentExperience, AgentResume, CompanyProfile, CompanyBusinessType } from '@/types';
import { AGENT_JOB_TYPE_LABELS, AGENT_EXPERIENCE_LABELS, COMPANY_BUSINESS_TYPE_LABELS } from '@/types';
import { supabase, fetchMyResume, fetchMyCompanyProfile } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AgentJobCard from '@/components/agent/JobCard';
import dynamic from 'next/dynamic';

const VWorldMap = dynamic(() => import('@/components/shared/VWorldMap'), { ssr: false });

// 전화번호 마스킹 (가운데 4자리)
function maskPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 11) return `${digits.slice(0,3)}-****-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0,3)}-****-${digits.slice(6)}`;
  if (digits.length === 9) return `${digits.slice(0,2)}-****-${digits.slice(5)}`;
  return phone.replace(/(\d{2,4})([\d-]{3,5})(\d{4})$/, '$1-****-$3');
}

// D-Day 계산
function getDDay(deadline?: string, isAlwaysRecruiting?: boolean): { text: string; color: string; urgent: boolean } {
  if (isAlwaysRecruiting) return { text: '상시채용', color: 'text-blue-600 bg-blue-50', urgent: false };
  if (!deadline) return { text: '채용중', color: 'text-gray-600 bg-gray-100', urgent: false };
  const today = new Date(); today.setHours(0,0,0,0);
  const dl = new Date(deadline); dl.setHours(0,0,0,0);
  const diff = Math.ceil((dl.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { text: '마감', color: 'text-gray-400 bg-gray-100', urgent: false };
  if (diff === 0) return { text: 'D-DAY', color: 'text-red-600 bg-red-50', urgent: true };
  if (diff <= 3) return { text: `D-${diff}`, color: 'text-red-600 bg-red-50', urgent: true };
  if (diff <= 7) return { text: `D-${diff}`, color: 'text-orange-600 bg-orange-50', urgent: false };
  return { text: `D-${diff}`, color: 'text-gray-600 bg-gray-100', urgent: false };
}

// 날짜 포맷
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const days = ['일','월','화','수','목','금','토'];
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}(${days[d.getDay()]})`;
}

// 더미 데이터
const MOCK_JOB: AgentJobListing = {
  id: '1',
  title: '강남 아파트 전문 공인중개사 모집 (경력우대)',
  description: `## 회사 소개\n강남부동산은 20년 전통의 강남권 아파트 전문 중개사무소입니다.\n\n## 담당 업무\n- 아파트 매매/전세/월세 중개\n- 고객 상담 및 매물 안내\n- 계약서 작성 및 잔금 업무\n- 매물 발굴 및 관리\n\n## 자격 요건\n- 공인중개사 자격증 소지자\n- 부동산 중개 경력 1년 이상 (우대)\n- 강남권 지역 거주자 우대\n\n## 우대 사항\n- 아파트 전문 중개 경험자\n- 자차 소유자\n- 장기 근무 가능자`,
  htmlContent: `<div style="padding:10px;">
  <img src="https://i.imgur.com/my5E6G7.jpeg" style="width:100%; max-width:800px; height:auto; display:block; margin:0 auto; border-radius:8px;">
</div>
<div style="padding:20px; max-width:800px; margin:0 auto;">
  <h2 style="font-size:22px; font-weight:bold; color:#1a1a1a; margin-bottom:16px; border-bottom:2px solid #2563eb; padding-bottom:8px;">🏢 회사 소개</h2>
  <p style="font-size:15px; line-height:1.8; color:#333;">강남부동산은 <b>20년 전통</b>의 강남권 아파트 전문 중개사무소입니다. 강남, 서초, 송파 지역의 아파트 매매/전세를 전문으로 하며, 연간 거래건수 200건 이상의 실적을 보유하고 있습니다.</p>
  <br/>
  <h2 style="font-size:22px; font-weight:bold; color:#1a1a1a; margin-bottom:16px; border-bottom:2px solid #2563eb; padding-bottom:8px;">📋 담당 업무</h2>
  <ul style="font-size:15px; line-height:2; color:#333; padding-left:20px;">
    <li>아파트 매매/전세/월세 중개</li>
    <li>고객 상담 및 매물 안내</li>
    <li>계약서 작성 및 잔금 업무</li>
    <li>매물 발굴 및 관리</li>
  </ul>
  <br/>
  <h2 style="font-size:22px; font-weight:bold; color:#1a1a1a; margin-bottom:16px; border-bottom:2px solid #2563eb; padding-bottom:8px;">✅ 자격 요건</h2>
  <ul style="font-size:15px; line-height:2; color:#333; padding-left:20px;">
    <li>공인중개사 자격증 소지자</li>
    <li>부동산 중개 경력 1년 이상 (우대)</li>
    <li>강남권 지역 거주자 우대</li>
  </ul>
  <br/>
  <h2 style="font-size:22px; font-weight:bold; color:#1a1a1a; margin-bottom:16px; border-bottom:2px solid #059669; padding-bottom:8px;">🎁 우대 사항</h2>
  <ul style="font-size:15px; line-height:2; color:#333; padding-left:20px;">
    <li>아파트 전문 중개 경험자</li>
    <li>자차 소유자</li>
    <li>장기 근무 가능자</li>
  </ul>
</div>`,
  type: 'apartment', tier: 'premium', badges: ['hot', 'urgent'],
  salary: { type: 'mixed', amount: '월 300만원 + 인센티브', min: 300, max: 800 },
  experience: '1년 이상', experienceLevel: '1year',
  company: '강남부동산공인중개사사무소', region: '서울 강남구',
  address: '서울특별시 강남구 테헤란로 123', detailAddress: '5층 501호',
  views: 1523, applicants: 24, createdAt: '2025-01-20',
  deadline: '2025-01-31', isAlwaysRecruiting: false,
  benefits: [], workHours: '09:00 ~ 18:00 (협의가능)', workDays: '주 5일 (토요일 협의)',
  contactName: '김대표', contactPhone: '02-1234-5678', isBookmarked: false,
};

const RELATED_JOBS: AgentJobListing[] = [
  { id: '2', title: '분당 오피스텔 전문 중개사 급구', description: '', type: 'office', tier: 'normal', badges: ['new'], salary: { type: 'commission', amount: '수수료 50%' }, experience: '경력무관', company: '분당공인중개사', region: '경기 성남시', views: 856, createdAt: '2025-01-19', deadline: '2025-02-15', benefits: [] },
  { id: '3', title: '송파구 빌라 전문 중개사 모집', description: '', type: 'villa', tier: 'normal', badges: ['hot'], salary: { type: 'monthly', amount: '월 250만원' }, experience: '6개월 이상', company: '송파부동산', region: '서울 송파구', views: 623, applicants: 12, createdAt: '2025-01-18', isAlwaysRecruiting: true, benefits: [] },
  { id: '4', title: '강동구 원룸/투룸 전문 중개사', description: '', type: 'villa', tier: 'premium', badges: ['new', 'hot'], salary: { type: 'mixed', amount: '월 200만원 + α' }, experience: '경력무관', company: '강동부동산', region: '서울 강동구', views: 412, createdAt: '2025-01-21', deadline: '2025-02-28', benefits: [] },
];

const SALARY_LABELS: Record<string, string> = { monthly: '월급', commission: '수수료', mixed: '기본급+인센티브' };
const BADGE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  new: { label: 'NEW', icon: Sparkles, color: 'bg-emerald-500 text-white' },
  hot: { label: 'HOT', icon: Flame, color: 'bg-red-500 text-white' },
  urgent: { label: '급구', icon: AlertCircle, color: 'bg-orange-500 text-white' },
};

const TABS = [
  { id: 'details', label: '상세요강' },
  { id: 'application', label: '접수기간·방법' },
  { id: 'company', label: '기업정보' },
  { id: 'related', label: '추천공고' },
];


export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, session } = useAuth();
  const [job, setJob] = useState<AgentJobListing | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [applyStep, setApplyStep] = useState<'form' | 'success'>('form');
  const [mapCoord, setMapCoord] = useState<{ lat: number; lng: number } | null>(null);
  // 이력서 지원 관련 상태
  const [myResume, setMyResume] = useState<AgentResume | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [hasAlreadyApplied, setHasAlreadyApplied] = useState(false);
  // 기업 프로필
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [jobUserId, setJobUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true);
      const { data: rows, error } = await supabase.from('jobs').select('*').eq('id', params.id);
      const data = rows?.[0] ?? null;
      if (data && !error) {
        const dbJob: AgentJobListing = {
          id: data.id, title: data.title, description: data.description || '',
          type: (data.type || 'apartment') as AgentJobType,
          tier: (data.tier || 'normal') as AgentJobListing['tier'],
          badges: data.badges || [],
          salary: { type: (data.salary_type || 'monthly') as AgentSalaryType, amount: data.salary_amount || undefined },
          experience: AGENT_EXPERIENCE_LABELS[data.experience as AgentExperience] || data.experience || '경력무관',
          experienceLevel: (data.experience || 'none') as AgentExperience,
          company: data.company || '', region: data.region || '',
          address: data.address || undefined, thumbnail: data.thumbnail || undefined,
          views: data.views || 0, applicants: 0, createdAt: data.created_at,
          deadline: data.deadline || undefined, isAlwaysRecruiting: !data.deadline,
          benefits: data.benefits || [],
          workHours: data.html_content?.match(/근무시간: (.+)/)?.[1] || undefined,
          workDays: data.html_content?.match(/근무요일: (.+)/)?.[1] || undefined,
          contactName: data.contact_name || undefined,
          contactPhone: data.phone || undefined,
          officePhone: data.office_phone || undefined,
          htmlContent: data.html_content || undefined,
          agentImages: (() => {
            const match = data.html_content?.match(/<!-- AGENT_IMAGES:(.*?) -->/);
            if (match) { try { return JSON.parse(match[1]); } catch { return undefined; } }
            return undefined;
          })(),
        };
        setJob(dbJob);
        if (data.user_id) setJobUserId(data.user_id);
        // 조회수 증가 (fire-and-forget)
        fetch(`/api/jobs/${params.id}/view`, { method: 'POST' }).catch(() => {});
      } else {
        setJob(MOCK_JOB);
      }
      const bookmarks = JSON.parse(localStorage.getItem('agent_bookmarks') || '[]');
      setIsBookmarked(bookmarks.some((b: { jobId: string }) => b.jobId === params.id));
      setIsLoading(false);
    };
    fetchJob();
  }, [params.id]);

  // 주소 → 좌표 변환
  useEffect(() => {
    if (!job?.address) return;
    fetch(`/api/geocode?address=${encodeURIComponent(job.address)}`)
      .then(r => r.json())
      .then(data => { if (data.lat && data.lng) setMapCoord({ lat: data.lat, lng: data.lng }); })
      .catch(() => {});
  }, [job?.address]);

  // 기업 프로필 불러오기
  useEffect(() => {
    if (!jobUserId) return;
    fetchMyCompanyProfile(jobUserId).then(profile => {
      if (profile) setCompanyProfile(profile);
    });
  }, [jobUserId]);

  // 내 이력서 불러오기 & 기존 지원 여부 확인
  useEffect(() => {
    async function loadResumeAndCheckApplication() {
      if (!user?.id || !params.id) return;

      // 이력서 로드
      const resume = await fetchMyResume(user.id);
      setMyResume(resume);

      // 기존 지원 여부 확인
      const { data: appRows } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', user.id)
        .eq('job_id', params.id);

      if (appRows && appRows.length > 0) {
        setHasAlreadyApplied(true);
      }
    }
    loadResumeAndCheckApplication();
  }, [user?.id, params.id]);

  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleBookmark = () => {
    if (!job) return;
    const bookmarks = JSON.parse(localStorage.getItem('agent_bookmarks') || '[]');
    if (isBookmarked) {
      localStorage.setItem('agent_bookmarks', JSON.stringify(bookmarks.filter((b: { jobId: string }) => b.jobId !== job.id)));
    } else {
      bookmarks.push({ id: `bookmark_${Date.now()}`, jobId: job.id, jobTitle: job.title, company: job.company, region: job.region, salary: job.salary.amount || '협의', deadline: job.deadline, bookmarkedAt: new Date().toISOString() });
      localStorage.setItem('agent_bookmarks', JSON.stringify(bookmarks));
    }
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = async () => {
    try { await navigator.share({ title: job?.title, text: `${job?.company} - ${job?.title}`, url: window.location.href }); }
    catch { await navigator.clipboard.writeText(window.location.href); alert('링크가 클립보드에 복사되었습니다.'); }
  };

  // 이력서로 지원하기 (API 라우트 사용)
  const handleResumeApply = async () => {
    if (!job || !user?.id) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!session?.access_token) {
      alert('세션이 만료되었습니다. 다시 로그인해주세요.');
      return;
    }

    setIsApplying(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ resumeId: myResume?.id || null, message: applyMessage }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplyStep('success');
        setHasAlreadyApplied(true);
      } else if (data.duplicate) {
        alert('이미 지원한 공고입니다.');
      } else {
        alert(data.error || '지원 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('Apply error:', err);
      alert('지원 중 오류가 발생했습니다.');
    } finally {
      setIsApplying(false);
    }
  };

  const closeApplyModal = () => { setShowApplyModal(false); setApplyStep('form'); setApplyMessage(''); };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">공고를 불러오는 중...</p>
      </div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">공고를 찾을 수 없습니다</h1>
        <p className="text-gray-500 mb-6">요청하신 공고가 삭제되었거나 존재하지 않습니다.</p>
        <Link href="/agent/jobs" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
          <ArrowLeft className="w-5 h-5" />공고 목록으로
        </Link>
      </div>
    </div>
  );

  const dday = getDDay(job.deadline, job.isAlwaysRecruiting);

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">뒤로가기</span>
            </button>
            <div className="flex items-center gap-1">
              <button onClick={handleShare} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg" title="공유하기">
                <Share2 className="w-5 h-5" />
              </button>
              <button onClick={handleBookmark} className={`p-2 rounded-lg ${isBookmarked ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'}`} title={isBookmarked ? '스크랩 취소' : '스크랩'}>
                {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 타이틀 영역 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* 회사명 */}
              <p className="text-gray-600 text-base mb-1 font-medium">{job.company}</p>
              {/* 배지 */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {job.tier === 'vip' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold rounded-full">
                    <Star className="w-3.5 h-3.5 fill-current" />VIP
                  </span>
                )}
                {job.tier === 'premium' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold rounded-full">
                    <Award className="w-3.5 h-3.5" />PREMIUM
                  </span>
                )}
                {job.tier === 'basic' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-white text-xs font-bold rounded-full">
                    BASIC
                  </span>
                )}
                {job.badges.map((badge) => {
                  const cfg = BADGE_CONFIG[badge]; const Icon = cfg.icon;
                  return <span key={badge} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}><Icon className="w-3 h-3" />{cfg.label}</span>;
                })}
              </div>
              {/* 제목 */}
              <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 leading-tight">{job.title}</h1>
            </div>
            {/* D-Day 배지 (데스크톱) */}
            <div className="hidden sm:flex flex-col items-end gap-2 flex-shrink-0">
              <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${dday.color}`}>{dday.text}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 앵커 탭 */}
      <nav className="sticky top-14 z-40 bg-white border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-gray-900 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* 좌측 콘텐츠 */}
          <div className="flex-1 min-w-0">

            {/* ===== 모집요강 ===== */}
            <section id="details" className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-3">모집요강</h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* 모집분야 헤더 */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-5">
                  <div className="flex gap-5 items-start">
                    <span className="text-gray-500 min-w-[80px] shrink-0">모집분야</span>
                    <span className="text-gray-900 font-medium">{job.title}</span>
                  </div>
                </div>
                {/* 상세 정보 */}
                <div className="px-6 py-5 space-y-5">
                  <div className="flex gap-5 items-center">
                    <span className="text-gray-500 min-w-[80px] shrink-0">매물유형</span>
                    <span className="inline-flex px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                      {AGENT_JOB_TYPE_LABELS[job.type]}
                    </span>
                  </div>
                  <div className="flex gap-5 items-center">
                    <span className="text-gray-500 min-w-[80px] shrink-0">급여</span>
                    <div>
                      <span className="text-blue-600 font-bold">{job.salary.amount || '협의'}</span>
                      <span className="text-gray-500 text-sm ml-2">({SALARY_LABELS[job.salary.type]})</span>
                    </div>
                  </div>
                  {job.workHours && (
                    <div className="flex gap-5 items-start">
                      <span className="text-gray-500 min-w-[80px] shrink-0">근무시간</span>
                      <div className="space-y-1">
                        {job.workDays && <p className="text-gray-900">{job.workDays}</p>}
                        <p className="text-gray-900">{job.workHours}</p>
                      </div>
                    </div>
                  )}
                  {job.address && (
                    <div className="flex gap-5 items-start">
                      <span className="text-gray-500 min-w-[80px] shrink-0">근무지주소</span>
                      <div>
                        <span className="text-gray-900">{job.address}{job.detailAddress ? ` ${job.detailAddress}` : ''}</span>
                        <a
                          href={`https://map.kakao.com/?q=${encodeURIComponent(job.address)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 ml-2 text-xs text-gray-500 underline hover:text-gray-700"
                        >
                          지도보기<ChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ===== 지원자격 ===== */}
            <section className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-3">지원자격</h2>
              <div className="border border-gray-200 rounded-lg px-6 py-5">
                <div className="flex gap-5 items-center">
                  <span className="text-gray-500 min-w-[80px] shrink-0">경력</span>
                  <span className="text-blue-600 font-bold">{job.experience}</span>
                </div>
              </div>
            </section>

            {/* ===== 상세 내용 ===== */}
            <section className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />상세 내용
              </h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {job.htmlContent ? (
                  /* HTML 콘텐츠 렌더링 (알바몬/잡코리아 스타일) */
                  <div
                    className="job-html-content"
                    dangerouslySetInnerHTML={{ __html: job.htmlContent }}
                  />
                ) : (
                  /* 기존 마크다운식 텍스트 렌더링 */
                  <div className="px-6 py-6 prose prose-gray max-w-none">
                    {job.description.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) return <h3 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-3 first:mt-0">{line.replace('## ', '')}</h3>;
                      if (line.startsWith('- ')) return <div key={i} className="flex items-start gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" /><span className="text-gray-600">{line.replace('- ', '')}</span></div>;
                      if (line.trim()) return <p key={i} className="text-gray-600 mb-2">{line}</p>;
                      return null;
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* ===== 부동산 사진 ===== */}
            {job.agentImages && Object.keys(job.agentImages).length > 0 && (
              <section className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />부동산 사진
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {job.agentImages.logo && (
                    <div><p className="text-xs text-gray-500 mb-1.5 font-medium">로고</p><img src={job.agentImages.logo} alt="부동산 로고" className="w-full h-40 object-cover rounded-lg border border-gray-200" /></div>
                  )}
                  {job.agentImages.signboard && (
                    <div><p className="text-xs text-gray-500 mb-1.5 font-medium">옥외 간판</p><img src={job.agentImages.signboard} alt="옥외 간판" className="w-full h-40 object-cover rounded-lg border border-gray-200" /></div>
                  )}
                  {job.agentImages.interior && (
                    <div><p className="text-xs text-gray-500 mb-1.5 font-medium">사무소 내부</p><img src={job.agentImages.interior} alt="내부 이미지" className="w-full h-40 object-cover rounded-lg border border-gray-200" /></div>
                  )}
                </div>
              </section>
            )}

            {/* ===== 접수기간 · 방법 (잡코리아 스타일 2x2 그리드) ===== */}
            <section id="application" className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-3">접수기간 · 방법</h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                  {/* 좌측: 접수기간 */}
                  <div className="bg-gray-50 px-6 py-5 space-y-4">
                    <div className="flex gap-4 items-center">
                      <span className="text-gray-500 text-sm min-w-[50px]">시작일</span>
                      <span className="text-gray-900 font-medium">{formatDate(job.createdAt)}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <span className="text-gray-500 text-sm min-w-[50px]">마감일</span>
                      <span className={`font-bold ${job.isAlwaysRecruiting ? 'text-blue-600' : 'text-gray-900'}`}>
                        {job.isAlwaysRecruiting ? '상시채용' : job.deadline ? formatDate(job.deadline) : '채용시 마감'}
                      </span>
                    </div>
                  </div>
                  {/* 우측: 접수방법 */}
                  <div className="px-6 py-5 space-y-4">
                    <div className="flex gap-4 items-center">
                      <span className="text-gray-500 text-sm min-w-[60px]">접수방법</span>
                      <span className="text-blue-600 font-medium">부동산인 즉시지원</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <span className="text-gray-500 text-sm min-w-[60px]">지원양식</span>
                      <span className="text-gray-900">부동산인 이력서</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2.5">
                <AlertCircle className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-xs text-gray-400">마감일은 기업의 사정으로 인해 조기 마감 또는 변경될 수 있습니다</span>
              </div>
            </section>

            {/* ===== 지원자 현황 통계 (잡코리아 스타일 비주얼) ===== */}
            <section className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-3">지원자 현황 통계</h2>
              <div className="border border-gray-200 rounded-lg p-6">
                {/* 상단 수치 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-50 rounded-full mb-2">
                      <Eye className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{job.views.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">조회수</p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-emerald-50 rounded-full mb-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{job.applicants || 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">지원자</p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-rose-50 rounded-full mb-2">
                      <Heart className="w-5 h-5 text-rose-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-500 mt-0.5">스크랩</p>
                  </div>
                </div>
                {/* 경쟁률 바 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">경쟁률</span>
                    <span className="text-sm font-bold text-blue-600">
                      {job.applicants && job.views ? `${((job.applicants / job.views) * 100).toFixed(1)}%` : '집계중'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((job.applicants || 0) / Math.max(job.views, 1) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">조회 대비 지원 비율</p>
                </div>
              </div>
            </section>

            {/* ===== 기업 정보 (잡코리아 스타일) ===== */}
            <section id="company" className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4">기업 정보</h2>

              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                {/* 상단: 로고 + 회사명 + 업종 */}
                <div className="p-5 flex items-center gap-4 border-b border-gray-100">
                  {/* 회사 로고 */}
                  <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {(companyProfile?.logoUrl || job.agentImages?.logo) ? (
                      <img
                        src={companyProfile?.logoUrl || job.agentImages?.logo}
                        alt={job.company}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-7 h-7 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{companyProfile?.companyName || job.company}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {companyProfile?.businessType
                        ? COMPANY_BUSINESS_TYPE_LABELS[companyProfile.businessType]
                        : AGENT_JOB_TYPE_LABELS[job.type] + ' 전문'}
                    </p>
                  </div>
                </div>

                {/* 기업 정보 테이블 */}
                <div className="divide-y divide-gray-100">
                  {/* 기업형태 */}
                  <div className="flex items-center px-5 py-3.5">
                    <div className="flex items-center gap-2 w-28 flex-shrink-0">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">기업형태</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {companyProfile?.businessType
                        ? COMPANY_BUSINESS_TYPE_LABELS[companyProfile.businessType]
                        : '부동산 중개업'}
                    </span>
                  </div>

                  {/* 매물유형 */}
                  <div className="flex items-center px-5 py-3.5">
                    <div className="flex items-center gap-2 w-28 flex-shrink-0">
                      <Award className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">매물유형</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {AGENT_JOB_TYPE_LABELS[job.type]}
                    </span>
                  </div>

                  {/* 설립연도 */}
                  {companyProfile?.foundedYear && (
                    <div className="flex items-center px-5 py-3.5">
                      <div className="flex items-center gap-2 w-28 flex-shrink-0">
                        <CalendarDays className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">설립연도</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{companyProfile.foundedYear}년</span>
                    </div>
                  )}

                  {/* 직원수 */}
                  {companyProfile?.employeeCount && (
                    <div className="flex items-center px-5 py-3.5">
                      <div className="flex items-center gap-2 w-28 flex-shrink-0">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">직원수</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{companyProfile.employeeCount}명</span>
                    </div>
                  )}

                  {/* 지역 */}
                  <div className="flex items-center px-5 py-3.5">
                    <div className="flex items-center gap-2 w-28 flex-shrink-0">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">지역</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{job.address || job.region}</span>
                    {job.address && (
                      <button
                        onClick={() => {
                          const mapEl = document.getElementById('company-map');
                          if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="ml-2 text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-0.5"
                      >
                        지도보기
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* 홈페이지 */}
                  {companyProfile?.website && (
                    <div className="flex items-center px-5 py-3.5">
                      <div className="flex items-center gap-2 w-28 flex-shrink-0">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">홈페이지</span>
                      </div>
                      <a
                        href={companyProfile.website.startsWith('http') ? companyProfile.website : `https://${companyProfile.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {companyProfile.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* 담당자 정보 */}
                  {(job.contactName || job.contactPhone || job.officePhone) && (
                    <div className="px-5 py-3.5">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">담당자 정보</span>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1.5 ml-6">
                        {job.contactName && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">담당자</span>
                            <span className="text-sm font-medium text-gray-900">{job.contactName}</span>
                          </div>
                        )}
                        {job.officePhone && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">회사전화</span>
                            <a href={`tel:${job.officePhone}`} className="text-sm font-medium text-blue-600 hover:underline">{job.officePhone}</a>
                          </div>
                        )}
                        {job.contactPhone && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">휴대폰</span>
                            <span className="text-sm font-medium text-gray-900">{maskPhone(job.contactPhone)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 회사 소개 */}
                {companyProfile?.description && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{companyProfile.description}</p>
                  </div>
                )}
              </div>

              {/* VWorld 지도 */}
              {job.address && mapCoord && (
                <div id="company-map" className="mt-4">
                  <VWorldMap lat={mapCoord.lat} lng={mapCoord.lng} label={job.company} height="280px" />
                </div>
              )}
            </section>
          </div>

          {/* 우측 사이드바 (잡코리아 스타일) */}
          <aside className="w-[300px] hidden lg:block flex-shrink-0">
            <div className="sticky top-[120px] space-y-4">
              {/* 요약 카드 */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* 구조화된 key-value 리스트 */}
                <div className="p-5 space-y-0 divide-y divide-gray-100">
                  <div className="flex items-center justify-between py-2.5 first:pt-0">
                    <span className="text-sm text-gray-500">매물유형</span>
                    <span className="text-sm font-semibold text-gray-900">{AGENT_JOB_TYPE_LABELS[job.type]}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-gray-500">경력</span>
                    <span className="text-sm font-semibold text-gray-900">{job.experience}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-gray-500">급여</span>
                    <span className="text-sm font-bold text-blue-600">{job.salary.amount || '협의'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-gray-500">근무지역</span>
                    <span className="text-sm font-semibold text-gray-900">{job.region}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 last:pb-0">
                    <span className="text-sm text-gray-500">마감일</span>
                    <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${dday.color}`}>{dday.text}</span>
                  </div>
                </div>

                {/* 버튼 영역 */}
                <div className="px-5 pb-5 pt-3 flex gap-2">
                  <button
                    onClick={handleBookmark}
                    className={`p-3 rounded-xl border transition-colors flex-shrink-0 ${
                      isBookmarked ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200'
                    }`}
                    title={isBookmarked ? '스크랩 취소' : '스크랩'}
                  >
                    <Star className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    즉시 지원
                  </button>
                </div>

                {/* 통계 */}
                <div className="flex items-center justify-around px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">조회</p>
                    <p className="text-sm font-bold text-gray-900">{job.views.toLocaleString()}</p>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                  <div className="text-center">
                    <p className="text-xs text-gray-400">지원</p>
                    <p className="text-sm font-bold text-gray-900">{job.applicants || 0}</p>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                  <div className="text-center">
                    <p className="text-xs text-gray-400">스크랩</p>
                    <p className="text-sm font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* 추천공고 */}
        <section id="related" className="mt-12 border-t border-gray-200 pt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">추천공고</h2>
            <Link href="/agent/jobs" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium">
              전체보기<ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RELATED_JOBS.map((rj) => <AgentJobCard key={rj.id} job={rj} variant="card" />)}
          </div>
        </section>
      </main>

      {/* 모바일 하단 고정 버튼 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 z-50">
        <button onClick={handleBookmark} className={`p-3 rounded-xl transition-colors ${isBookmarked ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-gray-100 text-gray-700'}`}>
          {isBookmarked ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
        </button>
        <button onClick={() => setShowApplyModal(true)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 flex items-center justify-center gap-2">
          <Send className="w-5 h-5" />지원하기
        </button>
      </div>

      {/* 지원 모달 */}
      {showApplyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={closeApplyModal}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-gray-900">
                {applyStep === 'success' ? '지원 완료' : '지원하기'}
              </h3>
              <button onClick={closeApplyModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {/* 이미 지원한 경우 */}
              {hasAlreadyApplied && applyStep !== 'success' ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">이미 지원한 공고입니다</h4>
                  <p className="text-gray-600 mb-6">지원 내역은 마이페이지에서 확인하실 수 있습니다.</p>
                  <Link href="/agent/mypage/applications" className="block w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 text-center">
                    지원 내역 보기
                  </Link>
                </div>
              ) : applyStep === 'success' ? (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-10 h-10 text-green-600" /></div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">지원이 완료되었습니다!</h4>
                  <p className="text-gray-600 mb-6">{job.company}에서 곧 연락드릴 예정입니다.<br />지원 내역은 마이페이지에서 확인하실 수 있습니다.</p>
                  <div className="space-y-3">
                    <Link href="/agent/mypage/applications" className="block w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 text-center">지원 내역 보기</Link>
                    <button onClick={closeApplyModal} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">닫기</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* 공고 정보 */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-gray-500">{job.company}</p>
                    <p className="font-medium text-gray-900 line-clamp-1">{job.title}</p>
                  </div>

                  {/* 로그인 + 이력서 있는 경우: 이력서 지원 */}
                  {user && myResume ? (
                    <div className="space-y-4">
                      {/* 이력서 미리보기 */}
                      <div className="border-2 border-blue-500 rounded-xl p-4 bg-blue-50/50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                            {myResume.photo ? (
                              <img src={myResume.photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{myResume.name}</p>
                            <p className="text-sm text-gray-500">{myResume.phone}</p>
                          </div>
                          <Link href="/agent/mypage/resume" className="ml-auto text-blue-600 text-sm font-medium hover:underline">
                            수정
                          </Link>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {myResume.totalExperience && myResume.totalExperience !== 'none' && (
                            <span className="px-2 py-1 bg-white rounded-full text-gray-600 border border-gray-200">
                              {AGENT_EXPERIENCE_LABELS[myResume.totalExperience]}
                            </span>
                          )}
                          {myResume.preferredRegions.slice(0, 2).map(region => (
                            <span key={region} className="px-2 py-1 bg-white rounded-full text-gray-600 border border-gray-200">
                              {region}
                            </span>
                          ))}
                          {myResume.licenseNumber && (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                              자격증 보유
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 지원 메시지 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          지원 메시지 <span className="text-gray-400">(선택)</span>
                        </label>
                        <textarea
                          value={applyMessage}
                          onChange={(e) => setApplyMessage(e.target.value)}
                          placeholder="간단한 자기소개나 지원동기를 입력하세요"
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>

                      {/* 지원 버튼 */}
                      <button
                        onClick={handleResumeApply}
                        disabled={isApplying}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isApplying ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            지원 중...
                          </>
                        ) : (
                          <>
                            <FileText className="w-5 h-5" />
                            이력서로 지원하기
                          </>
                        )}
                      </button>
                    </div>
                  ) : !user ? (
                    /* 비로그인: 로그인 유도 */
                    <div className="text-center py-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">로그인이 필요합니다</h4>
                      <p className="text-gray-600 mb-6 text-sm">
                        이력서를 등록하고 간편하게 지원하세요.<br />
                        지원 현황도 한눈에 확인할 수 있습니다.
                      </p>
                      <div className="space-y-3">
                        <Link
                          href={`/agent/auth/login?redirect=/agent/jobs/${job.id}`}
                          className="block w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 text-center"
                        >
                          로그인하기
                        </Link>
                        <Link
                          href={`/agent/auth/signup?redirect=/agent/jobs/${job.id}`}
                          className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 text-center"
                        >
                          회원가입
                        </Link>
                      </div>
                    </div>
                  ) : (
                    /* 로그인 O, 이력서 X: 이력서 등록 유도 */
                    <div className="text-center py-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">이력서를 등록해주세요</h4>
                      <p className="text-gray-600 mb-6 text-sm">
                        이력서를 한 번 등록하면<br />
                        클릭 한 번으로 간편하게 지원할 수 있습니다.
                      </p>
                      <Link
                        href="/agent/mypage/resume"
                        className="block w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 text-center"
                      >
                        이력서 등록하기
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="h-24 lg:hidden" />
    </div>
  );
}
