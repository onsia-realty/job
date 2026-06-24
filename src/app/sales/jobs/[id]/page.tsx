'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Share2, MapPin, Building2, Clock, Users,
  Phone, MessageCircle, Bookmark, ChevronRight, Eye, Calendar,
  CheckCircle2, Star, Briefcase, User, Copy,
} from 'lucide-react';
import MobileNav from '@/components/shared/MobileNav';
import JobCard from '@/components/sales/JobCard';
import SectionCard from '@/components/sales/ui/SectionCard';
import Badge from '@/components/sales/ui/Badge';
import CommissionChips from '@/components/sales/ui/CommissionChips';
import dynamic from 'next/dynamic';
import type { SalesJobListing } from '@/types';
import {
  POSITION_LABELS,
  SALARY_TYPE_LABELS,
  EXPERIENCE_LABELS,
  COMPANY_TYPE_LABELS,
} from '@/types';
import { allJobs } from '@/data/salesJobsSample';

const VWorldMap = dynamic(() => import('@/components/shared/VWorldMap'), { ssr: false });

function generateHtmlContent(job: SalesJobListing): string {
  const TYPE_LABELS_KR: Record<string, string> = {
    apartment: '아파트', officetel: '오피스텔', store: '상가', industrial: '지식산업센터',
  };
  const rows = [
    ['현장명', job.title],
    ['분류', TYPE_LABELS_KR[job.type] || job.type],
    ['인사 담당', job.contactName || '-'],
    ['소재지', job.address || '-'],
    ['전화', job.phone || '-'],
    ['나이', job.ageRange || '-'],
    ['성별', job.gender || '-'],
    ['응시요건', job.requirements || '-'],
    ['모집인원', job.headcount || '-'],
    ['등록일자', job.createdAt || '-'],
    ['모집기간', job.recruitPeriod || '채용시까지'],
  ];

  const tableRows = rows.map(([label, value]) =>
    `<tr style="border-bottom:1px solid #E5E7EB;">
      <td style="padding:12px;background:#F9FAFB;width:120px;font-weight:600;color:#374151;">${label}</td>
      <td style="padding:12px;color:#374151;">${value}</td>
    </tr>`
  ).join('');

  const detailBlock = job.detailContent
    ? `<div style="margin-bottom:24px;">
        <h3 style="font-size:18px;font-weight:bold;color:#333;margin-bottom:12px;">📋 상세요건</h3>
        <div style="background:#F9FAFB;padding:20px;border-radius:12px;color:#374151;line-height:1.8;">
          ${job.detailContent}
        </div>
      </div>`
    : '';

  return `
    <div class="job-content">
      <h2 style="font-size:24px;font-weight:bold;color:#333;margin-bottom:20px;border-bottom:2px solid #8B5CF6;padding-bottom:10px;">
        🏠 ${job.title}
      </h2>
      <div style="margin-bottom:24px;">
        <h3 style="font-size:18px;font-weight:bold;color:#333;margin-bottom:12px;">📋 모집 내용</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          ${tableRows}
        </table>
      </div>
      ${detailBlock}
      <div style="margin-bottom:24px;">
        <h3 style="font-size:18px;font-weight:bold;color:#333;margin-bottom:12px;">📞 지원 방법</h3>
        <div style="background:linear-gradient(135deg,#8B5CF6 0%,#6366F1 100%);padding:20px;border-radius:12px;color:white;">
          <p style="margin-bottom:8px;font-size:14px;">인사 담당: <strong>${job.contactName || '-'}</strong></p>
          <p style="margin-bottom:12px;font-size:16px;">지원 문의: <strong style="font-size:20px;">${job.phone || '-'}</strong></p>
          <p style="font-size:14px;opacity:0.9;">* 전화 또는 문자로 연락 주시면 상담 도와드립니다.</p>
        </div>
      </div>
    </div>
  `;
}

// 폴백 상세 데이터 (allJobs에 없는 id용)
const FALLBACK_DETAIL = {
  id: '1',
  title: '엘리프 검단 포레듀 - 첫 조직투입',
  description: '인천권 신규분상제 최대 수수료/ 주단위 지급',
  type: 'apartment' as const,
  tier: 'unique' as const,
  badges: ['new', 'popular'] as ('new' | 'hot' | 'jackpot' | 'popular')[],
  position: 'teamLead' as const,
  salary: { type: 'commission' as const, amount: '최대 3,000만원' },
  benefits: ['숙소제공', '일비지급', '교통비지원'],
  experience: 'none' as const,
  company: '엠비엔',
  companyType: undefined as undefined,
  companyInfo: {
    representative: '홍길동',
    employees: '50명',
    founded: '2015년',
    address: '인천광역시 서구 검단로 123',
  },
  region: '인천 검단',
  address: '인천광역시 서구 검단로 123, 견본주택',
  views: 3241,
  createdAt: '2026.01.17',
  deadline: '2026.02.28',
  phone: '010-1234-5678',
  contactName: '홍길동',
  ageRange: undefined as undefined,
  gender: undefined as undefined,
  requirements: undefined as undefined,
  headcount: undefined as undefined,
  recruitPeriod: undefined as undefined,
  htmlContent: `
    <div class="job-content">
      <h2 style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; border-bottom: 2px solid #8B5CF6; padding-bottom: 10px;">
        🏠 엘리프 검단 포레듀 - 분양상담사 모집
      </h2>
      <div style="background: linear-gradient(135deg, #F3E8FF 0%, #E0E7FF 100%); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
        <h3 style="font-size: 18px; color: #7C3AED; margin-bottom: 12px;">✨ 현장 소개</h3>
        <p style="color: #374151; line-height: 1.8;">
          인천 검단신도시 최초 분양 현장!<br/>
          대단지 아파트 + 역세권 + 브랜드 아파트<br/>
          <strong style="color: #7C3AED;">▶ 신규 조직 투입으로 최고의 조건 제시!</strong>
        </p>
      </div>
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 12px;">📋 모집 내용</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 12px; background: #F9FAFB; width: 120px; font-weight: 600; color: #374151;">모집직종</td>
            <td style="padding: 12px; color: #374151;">본부장 / 팀장 / 팀원</td>
          </tr>
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 12px; background: #F9FAFB; font-weight: 600; color: #374151;">급여조건</td>
            <td style="padding: 12px; color: #374151;">
              <strong style="color: #DC2626;">계약 수수료 최대 3,000만원</strong><br/>
              <span style="color: #6B7280; font-size: 14px;">* 주단위 정산 / 익일 지급</span>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 12px; background: #F9FAFB; font-weight: 600; color: #374151;">자격요건</td>
            <td style="padding: 12px; color: #374151;">경력무관 (신입/경력 모두 환영)</td>
          </tr>
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 12px; background: #F9FAFB; font-weight: 600; color: #374151;">근무지역</td>
            <td style="padding: 12px; color: #374151;">인천광역시 서구 검단로 123</td>
          </tr>
          <tr>
            <td style="padding: 12px; background: #F9FAFB; font-weight: 600; color: #374151;">근무시간</td>
            <td style="padding: 12px; color: #374151;">09:00 ~ 18:00 (주 6일 근무)</td>
          </tr>
        </table>
      </div>
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 12px;">🎁 복리후생</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          <span style="background: #DCFCE7; color: #166534; padding: 8px 16px; border-radius: 20px; font-size: 14px;">✓ 숙소제공</span>
          <span style="background: #DCFCE7; color: #166534; padding: 8px 16px; border-radius: 20px; font-size: 14px;">✓ 일비지급</span>
          <span style="background: #DCFCE7; color: #166534; padding: 8px 16px; border-radius: 20px; font-size: 14px;">✓ 교통비지원</span>
          <span style="background: #DCFCE7; color: #166534; padding: 8px 16px; border-radius: 20px; font-size: 14px;">✓ 식대제공</span>
          <span style="background: #DCFCE7; color: #166534; padding: 8px 16px; border-radius: 20px; font-size: 14px;">✓ 광고비지원</span>
        </div>
      </div>
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 12px;">📞 지원 방법</h3>
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 20px; border-radius: 12px; color: white;">
          <p style="margin-bottom: 12px; font-size: 16px;">지원 문의: <strong style="font-size: 20px;">010-1234-5678</strong></p>
          <p style="font-size: 14px; opacity: 0.9;">* 전화 또는 문자로 연락 주시면 상담 도와드립니다.</p>
          <p style="font-size: 14px; opacity: 0.9;">* 이력서 제출 필요 없이 바로 면접 가능!</p>
        </div>
      </div>
      <div style="text-align: center; padding: 20px; background: #F3F4F6; border-radius: 12px;">
        <p style="color: #6B7280; font-size: 14px;">
          본 채용공고의 저작권은 (주)엠비엔에 있으며, 무단 전재 및 재배포를 금지합니다.
        </p>
      </div>
    </div>
  `,
};

// 전화번호 마스킹 (가운데 4자리)
function maskPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-****-${digits.slice(6)}`;
  if (digits.length === 9) return `${digits.slice(0, 2)}-****-${digits.slice(5)}`;
  return phone.replace(/(\d{2,4})([\d-]{3,5})(\d{4})$/, '$1-****-$3');
}

const SECTION_TABS = [
  { id: 'site-info', label: '현장정보' },
  { id: 'recruit-info', label: '모집정보' },
];

export default function JobDetailPage() {
  const params = useParams();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState('site-info');
  const [mapCoord, setMapCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const id = params.id as string;
  const foundJob = allJobs.find(j => j.id === id);

  const jobDetail = useMemo(() => {
    if (!foundJob) return FALLBACK_DETAIL;
    return {
      id: foundJob.id,
      title: foundJob.title,
      description: foundJob.description,
      type: foundJob.type,
      tier: foundJob.tier,
      badges: foundJob.badges,
      position: foundJob.position,
      salary: { type: foundJob.salary.type, amount: foundJob.salary.amount || '' },
      benefits: foundJob.benefits,
      experience: foundJob.experience,
      company: foundJob.company,
      companyType: foundJob.companyType,
      companyInfo: {
        representative: foundJob.contactName || '-',
        employees: '-',
        founded: '-',
        address: foundJob.address || '-',
      },
      region: foundJob.region,
      address: foundJob.address || '',
      views: foundJob.views,
      createdAt: foundJob.createdAt,
      deadline: foundJob.recruitPeriod || '채용시까지',
      phone: foundJob.phone || '',
      contactName: foundJob.contactName,
      ageRange: foundJob.ageRange,
      gender: foundJob.gender,
      requirements: foundJob.requirements,
      headcount: foundJob.headcount,
      recruitPeriod: foundJob.recruitPeriod,
      htmlContent: generateHtmlContent(foundJob),
    };
  }, [id, foundJob]);

  const relatedJobs = useMemo(() =>
    allJobs.filter(j => j.id !== id).slice(0, 2),
  [id]);

  // id 변경 시 이전 지도 좌표 초기화 (Leaflet DOM 충돌 방지)
  useEffect(() => {
    setMapCoord(null);
  }, [id]);

  useEffect(() => {
    if (!jobDetail.address) return;
    let cancelled = false;
    fetch(`/api/geocode?address=${encodeURIComponent(jobDetail.address)}`)
      .then(r => r.json())
      .then(data => { if (!cancelled && data.lat && data.lng) setMapCoord({ lat: data.lat, lng: data.lng }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [jobDetail.address]);

  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: jobDetail.title,
      text: `${jobDetail.company} | ${jobDetail.region} | ${jobDetail.salary.amount || SALARY_TYPE_LABELS[jobDetail.salary.type]}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('링크가 복사되었습니다.');
      }
    } catch {
      // user cancelled or error — silently ignore
    }
  };

  const handleCopyAddress = async () => {
    if (!jobDetail.address) return;
    try {
      await navigator.clipboard.writeText(jobDetail.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      // ignore
    }
  };

  // Derive commission chips from position + salary
  const commissionItems = [{ position: jobDetail.position as 'headTeam' | 'teamLead' | 'member', amount: jobDetail.salary.amount || undefined }];

  return (
    <div className="min-h-screen bg-sales-bg pb-32 md:pb-0">
      {/* ── 커스텀 백바 헤더 ── */}
      <header className="bg-white border-b border-sales-border sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/sales" className="flex items-center gap-2 text-sales-text-mute hover:text-sales-text min-w-[44px] min-h-[44px] -ml-2 px-2">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">목록으로</span>
            </Link>
            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-sales-text-mute hover:text-sales-text hover:bg-sales-bg transition-colors"
                aria-label="공유"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors ${
                  isBookmarked ? 'text-sales-primary bg-sales-primary-soft' : 'text-sales-text-mute hover:text-sales-primary hover:bg-sales-primary-soft'
                }`}
                aria-label="북마크"
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero 타이틀 블록 ── */}
      <div className="bg-white border-b border-sales-border">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* 뱃지 열 */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <Badge variant="tier" value={jobDetail.tier} />
            <Badge variant="type" value={jobDetail.type} />
            {jobDetail.badges.map(b => (
              <Badge key={b} variant="badge" value={b} />
            ))}
          </div>

          {/* 제목 + 마감 */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-sales-text leading-tight mb-1">
                {jobDetail.title}
              </h1>
              <p className="text-sm text-sales-text-mute">{jobDetail.description}</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-sales-primary bg-sales-primary-soft px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0">
              <Clock className="w-3.5 h-3.5" />
              ~{jobDetail.deadline}
            </span>
          </div>

          {/* 회사·지역·조회 메타 */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-sales-text-mute">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {jobDetail.company}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {jobDetail.region}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {jobDetail.views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {jobDetail.createdAt}
            </span>
          </div>
        </div>
      </div>

      {/* ── 앵커 탭 네비게이션 ── */}
      <nav className="sticky top-14 z-40 bg-white border-b border-sales-border">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex">
            {SECTION_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className={`relative px-5 py-3.5 text-sm font-bold transition-colors whitespace-nowrap min-h-[44px] ${
                  activeTab === tab.id
                    ? 'text-sales-primary'
                    : 'text-sales-text-mute hover:text-sales-text'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-sales-primary" />
                )}
              </button>
            ))}
            <button
              onClick={() => scrollToSection('related')}
              className={`relative px-5 py-3.5 text-sm font-bold transition-colors whitespace-nowrap min-h-[44px] ${
                activeTab === 'related'
                  ? 'text-sales-primary'
                  : 'text-sales-text-mute hover:text-sales-text'
              }`}
            >
              추천공고
              {activeTab === 'related' && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-sales-primary" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ── 메인 콘텐츠 ── */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* ── 좌측 본문 ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* ────────────────────────────────────────
                현장 핵심요약 (3 미니 카드)
            ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* ① 기본 스펙 */}
              <SectionCard icon={Briefcase} title="기본 스펙" accent>
                <dl className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <dt className="text-sales-text-mute">유형</dt>
                    <dd className="font-semibold text-sales-text">
                      <Badge variant="type" value={jobDetail.type} size="sm" />
                    </dd>
                  </div>
                  <div className="flex justify-between text-xs">
                    <dt className="text-sales-text-mute">지역</dt>
                    <dd className="font-semibold text-sales-text">{jobDetail.region}</dd>
                  </div>
                  <div className="flex justify-between text-xs">
                    <dt className="text-sales-text-mute">직책</dt>
                    <dd className="font-semibold text-sales-text">{POSITION_LABELS[jobDetail.position]}</dd>
                  </div>
                  <div className="flex justify-between text-xs">
                    <dt className="text-sales-text-mute">경력</dt>
                    <dd className="font-semibold text-sales-text">{EXPERIENCE_LABELS[jobDetail.experience as keyof typeof EXPERIENCE_LABELS] ?? jobDetail.experience}</dd>
                  </div>
                </dl>
              </SectionCard>

              {/* ② 수수료·지원조건 */}
              <SectionCard icon={Star} title="수수료·지원조건" accent>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-[10px] text-sales-text-mute mb-1">직책별 RT</p>
                    <CommissionChips items={commissionItems} dense />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {jobDetail.benefits.map((b, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {b}
                      </span>
                    ))}
                    {jobDetail.benefits.length === 0 && (
                      <span className="text-xs text-sales-text-mute">-</span>
                    )}
                  </div>
                </div>
              </SectionCard>

              {/* ③ 포인트 */}
              <SectionCard icon={Eye} title="현장 포인트" accent>
                <p className="text-xs text-sales-text leading-relaxed line-clamp-5">
                  {(foundJob?.detailContent || jobDetail.description || '').slice(0, 180) || '-'}
                </p>
              </SectionCard>
            </div>

            {/* ────────────────────────────────────────
                담당자 정보
            ──────────────────────────────────────── */}
            <SectionCard icon={User} title="담당자 정보">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sales-primary-soft flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-sales-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-sales-text">
                      {jobDetail.contactName || '-'}
                    </p>
                    <p className="text-xs text-sales-text-mute">
                      {POSITION_LABELS[jobDetail.position]} · 응답률 <span className="font-semibold">-</span>
                    </p>
                  </div>
                </div>
                {jobDetail.phone && (
                  <a
                    href={`tel:${jobDetail.phone}`}
                    className="flex items-center gap-1.5 text-sm font-bold text-sales-primary bg-sales-primary-soft px-4 py-2 rounded-xl min-h-[44px] hover:bg-purple-100 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {maskPhone(jobDetail.phone)}
                  </a>
                )}
              </div>
            </SectionCard>

            {/* ────────────────────────────────────────
                현장정보 섹션 (탭 앵커)
            ──────────────────────────────────────── */}
            <div id="site-info">
              <SectionCard icon={Building2} title="현장정보">
                {/* 상세 HTML 본문 */}
                <div
                  className="job-html-content"
                  dangerouslySetInnerHTML={{ __html: jobDetail.htmlContent }}
                />
              </SectionCard>
            </div>

            {/* ────────────────────────────────────────
                위치 (지도)
            ──────────────────────────────────────── */}
            <SectionCard icon={MapPin} title="근무지 · 위치">
              {jobDetail.address ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <p className="text-sales-text font-medium flex-1 min-w-0 truncate">
                      {jobDetail.address}
                    </p>
                    <button
                      onClick={handleCopyAddress}
                      className="flex items-center gap-1 text-xs text-sales-primary hover:text-purple-700 font-medium px-2 py-1 rounded-lg hover:bg-sales-primary-soft transition-colors min-h-[36px] flex-shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedAddress ? '복사됨' : '복사'}
                    </button>
                  </div>
                  {mapCoord ? (
                    <div id="company-map">
                      <VWorldMap key={id} lat={mapCoord.lat} lng={mapCoord.lng} label={jobDetail.company} height="260px" />
                    </div>
                  ) : (
                    <div className="h-[200px] rounded-xl bg-sales-bg flex items-center justify-center text-xs text-sales-text-mute border border-sales-border">
                      지도 불러오는 중…
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-sales-text-mute">주소 정보가 없습니다.</p>
              )}
            </SectionCard>

            {/* ────────────────────────────────────────
                분양시행정보
            ──────────────────────────────────────── */}
            <SectionCard icon={Building2} title="분양시행정보">
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                <div>
                  <dt className="text-[10px] text-sales-text-mute mb-0.5">대행사</dt>
                  <dd className="text-sm font-semibold text-sales-text">{jobDetail.company}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-sales-text-mute mb-0.5">업체유형</dt>
                  <dd className="text-sm font-semibold text-sales-text">
                    {jobDetail.companyType ? COMPANY_TYPE_LABELS[jobDetail.companyType] : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] text-sales-text-mute mb-0.5">시행사</dt>
                  <dd className="text-sm font-semibold text-sales-text">-</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-sales-text-mute mb-0.5">시공사</dt>
                  <dd className="text-sm font-semibold text-sales-text">-</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-sales-text-mute mb-0.5">신탁사</dt>
                  <dd className="text-sm font-semibold text-sales-text">-</dd>
                </div>
              </dl>
            </SectionCard>

            {/* ────────────────────────────────────────
                모집정보 섹션 (탭 앵커)
            ──────────────────────────────────────── */}
            <div id="recruit-info">
              <SectionCard icon={Users} title="모집정보">
                <div className="space-y-4">
                  {/* 수수료 */}
                  <div>
                    <p className="text-[11px] font-bold text-sales-text-mute uppercase tracking-wide mb-1.5">수수료 조건</p>
                    <CommissionChips items={commissionItems} />
                  </div>

                  {/* 상세 모집 조건 그리드 */}
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 border-t border-sales-border">
                    <div>
                      <dt className="text-[10px] text-sales-text-mute mb-0.5">급여유형</dt>
                      <dd className="text-sm font-semibold text-sales-text">{SALARY_TYPE_LABELS[jobDetail.salary.type]}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-sales-text-mute mb-0.5">경력</dt>
                      <dd className="text-sm font-semibold text-sales-text">{EXPERIENCE_LABELS[jobDetail.experience as keyof typeof EXPERIENCE_LABELS] ?? jobDetail.experience}</dd>
                    </div>
                    {jobDetail.headcount && (
                      <div>
                        <dt className="text-[10px] text-sales-text-mute mb-0.5">모집인원</dt>
                        <dd className="text-sm font-semibold text-sales-text">{jobDetail.headcount}</dd>
                      </div>
                    )}
                    {jobDetail.recruitPeriod && (
                      <div>
                        <dt className="text-[10px] text-sales-text-mute mb-0.5">모집기간</dt>
                        <dd className="text-sm font-semibold text-sales-text">{jobDetail.recruitPeriod}</dd>
                      </div>
                    )}
                    {jobDetail.ageRange && (
                      <div>
                        <dt className="text-[10px] text-sales-text-mute mb-0.5">연령</dt>
                        <dd className="text-sm font-semibold text-sales-text">{jobDetail.ageRange}</dd>
                      </div>
                    )}
                    {jobDetail.gender && (
                      <div>
                        <dt className="text-[10px] text-sales-text-mute mb-0.5">성별</dt>
                        <dd className="text-sm font-semibold text-sales-text">{jobDetail.gender}</dd>
                      </div>
                    )}
                    {jobDetail.requirements && (
                      <div className="col-span-2">
                        <dt className="text-[10px] text-sales-text-mute mb-0.5">응시요건</dt>
                        <dd className="text-sm font-semibold text-sales-text">{jobDetail.requirements}</dd>
                      </div>
                    )}
                  </dl>

                  {/* 복리후생 */}
                  {jobDetail.benefits.length > 0 && (
                    <div className="pt-2 border-t border-sales-border">
                      <p className="text-[11px] font-bold text-sales-text-mute uppercase tracking-wide mb-1.5">복리후생</p>
                      <div className="flex flex-wrap gap-1.5">
                        {jobDetail.benefits.map((benefit, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 접수 안내 */}
                  <div className="pt-2 border-t border-sales-border flex items-center gap-1.5">
                    <span className="text-[10px] text-sales-text-mute">등록일 {jobDetail.createdAt}</span>
                    <span className="text-sales-text-mute">·</span>
                    <span className="text-[10px] text-sales-text-mute">마감 {jobDetail.deadline}</span>
                    <span className="text-sales-text-mute">·</span>
                    <span className="text-[10px] text-sales-text-mute">조기 마감 가능</span>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* ────────────────────────────────────────
                추천공고 섹션 (탭 앵커)
            ──────────────────────────────────────── */}
            <div id="related" className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-extrabold text-sales-text">추천공고</h2>
                <Link
                  href="/sales"
                  className="flex items-center gap-0.5 text-xs text-sales-primary font-medium hover:text-purple-700"
                >
                  전체보기<ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedJobs.map(job => (
                  <JobCard key={job.id} job={job} variant="compact" />
                ))}
              </div>
            </div>
          </div>

          {/* ── 우측 사이드바 (lg+) ── */}
          <aside className="w-[288px] hidden lg:block flex-shrink-0">
            <div className="sticky top-[120px] space-y-3">
              {/* 핵심 요약 카드 */}
              <SectionCard>
                <div className="space-y-0 divide-y divide-sales-border">
                  <div className="flex items-center justify-between py-2.5 first:pt-0">
                    <span className="text-xs text-sales-text-mute">매물유형</span>
                    <Badge variant="type" value={jobDetail.type} size="sm" />
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-xs text-sales-text-mute">모집직책</span>
                    <span className="text-xs font-semibold text-sales-text">{POSITION_LABELS[jobDetail.position]}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-xs text-sales-text-mute">경력</span>
                    <span className="text-xs font-semibold text-sales-text">{EXPERIENCE_LABELS[jobDetail.experience as keyof typeof EXPERIENCE_LABELS] ?? jobDetail.experience}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-xs text-sales-text-mute">수수료</span>
                    <span className="text-xs font-bold text-sales-primary">{jobDetail.salary.amount || SALARY_TYPE_LABELS[jobDetail.salary.type]}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-xs text-sales-text-mute">근무지역</span>
                    <span className="text-xs font-semibold text-sales-text">{jobDetail.region}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 last:pb-0">
                    <span className="text-xs text-sales-text-mute">마감일</span>
                    <span className="text-xs font-bold text-sales-primary bg-sales-primary-soft px-2.5 py-0.5 rounded-full">{jobDetail.deadline}</span>
                  </div>
                </div>

                {/* CTA 버튼 */}
                <div className="pt-3 mt-3 border-t border-sales-border space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className={`min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isBookmarked
                          ? 'bg-sales-primary-soft border-sales-primary/30 text-sales-primary'
                          : 'border-sales-border text-sales-text-mute hover:text-sales-primary hover:border-sales-primary/30'
                      }`}
                      aria-label="북마크"
                    >
                      <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                    {jobDetail.phone ? (
                      <a
                        href={`tel:${jobDetail.phone}`}
                        className="flex-1 min-h-[44px] bg-sales-primary text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        {maskPhone(jobDetail.phone)}
                      </a>
                    ) : (
                      <button
                        disabled
                        className="flex-1 min-h-[44px] bg-gray-100 text-gray-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <Phone className="w-4 h-4" />
                        번호 없음
                      </button>
                    )}
                  </div>
                  <button className="w-full min-h-[44px] border border-sales-primary text-sales-primary rounded-xl font-medium text-sm hover:bg-sales-primary-soft transition-colors flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    문자 문의
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full min-h-[44px] border border-sales-border text-sales-text-mute rounded-xl font-medium text-sm hover:bg-sales-bg transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    공유하기
                  </button>
                </div>

                {/* 통계 */}
                <div className="flex items-center justify-around pt-3 mt-3 border-t border-sales-border">
                  <div className="text-center">
                    <p className="text-[10px] text-sales-text-mute">조회</p>
                    <p className="text-sm font-bold text-sales-text">{jobDetail.views.toLocaleString()}</p>
                  </div>
                  <div className="w-px h-5 bg-sales-border" />
                  <div className="text-center">
                    <p className="text-[10px] text-sales-text-mute">등록일</p>
                    <p className="text-sm font-bold text-sales-text">{jobDetail.createdAt}</p>
                  </div>
                </div>
              </SectionCard>

              {/* 복리후생 */}
              {jobDetail.benefits.length > 0 && (
                <SectionCard title="복리후생" icon={CheckCircle2}>
                  <div className="flex flex-wrap gap-1.5">
                    {jobDetail.benefits.map((b, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        {b}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* ── 모바일 하단 스티키 CTA ── */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-sales-border px-4 py-3 md:hidden z-30 shadow-lg">
        <div className="flex gap-2 max-w-lg mx-auto">
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`min-w-[48px] min-h-[48px] rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors ${
              isBookmarked
                ? 'bg-sales-primary-soft border-sales-primary/30 text-sales-primary'
                : 'border-sales-border text-sales-text-mute'
            }`}
            aria-label="북마크"
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="min-w-[48px] min-h-[48px] rounded-xl border border-sales-border text-sales-text-mute flex items-center justify-center flex-shrink-0 hover:bg-sales-bg transition-colors"
            aria-label="공유"
          >
            <Share2 className="w-5 h-5" />
          </button>
          {jobDetail.phone ? (
            <a
              href={`tel:${jobDetail.phone}`}
              className="flex-1 min-h-[48px] bg-sales-primary text-white rounded-xl font-extrabold text-base flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors"
            >
              <Phone className="w-5 h-5" />
              {maskPhone(jobDetail.phone)}
            </a>
          ) : (
            <button
              disabled
              className="flex-1 min-h-[48px] bg-gray-100 text-gray-400 rounded-xl font-extrabold text-base flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Phone className="w-5 h-5" />
              연락처 없음
            </button>
          )}
        </div>
      </div>

      <MobileNav variant="sales" />
    </div>
  );
}
