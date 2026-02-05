'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Heart, Share2, MapPin, Building2, Clock, Users,
  Phone, MessageCircle, Bookmark, ChevronRight, Eye, Calendar,
  Banknote, CheckCircle2, AlertCircle, Star, Navigation,
  Briefcase, User,
} from 'lucide-react';
import MobileNav from '@/components/shared/MobileNav';
import JobCard from '@/components/sales/JobCard';
import dynamic from 'next/dynamic';
import type { SalesJobListing } from '@/types';

const VWorldMap = dynamic(() => import('@/components/shared/VWorldMap'), { ssr: false });

// 임시 상세 데이터
const jobDetail = {
  id: '1',
  title: '엘리프 검단 포레듀 - 첫 조직투입',
  description: '인천권 신규분상제 최대 수수료/ 주단위 지급',
  type: 'apartment' as const,
  tier: 'unique' as const,
  badges: ['new', 'popular'] as ('new' | 'hot' | 'jackpot' | 'popular')[],
  position: 'teamLead' as const,
  salary: { type: 'commission' as const, amount: '최대 3,000만원' },
  benefits: ['숙소제공', '일비지급', '교통비지원'],
  experience: 'none',
  company: '엠비엔',
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
  htmlContent: `
    <div style="padding:10px;">
      <img src="https://i.imgur.com/my5E6G7.jpeg" style="width:100%; max-width:800px; height:auto; display:block; margin:0 auto; border-radius:8px;">
    </div>
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
      <div style="background: #FEF3C7; padding: 20px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #F59E0B;">
        <h3 style="font-size: 16px; font-weight: bold; color: #92400E; margin-bottom: 8px;">⚡ 특별 혜택</h3>
        <ul style="color: #78350F; line-height: 1.8; padding-left: 20px;">
          <li>선착순 5팀 한정! 광고비 100% 지원</li>
          <li>첫 달 정착 지원금 100만원 별도 지급</li>
          <li>경력자 우대 (수수료 협의 가능)</li>
        </ul>
      </div>
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 12px;">🏢 현장 정보</h3>
        <div style="background: #F9FAFB; padding: 20px; border-radius: 12px;">
          <p style="color: #374151; line-height: 1.8; margin-bottom: 12px;">
            <strong>프로젝트명:</strong> 엘리프 검단 포레듀<br/>
            <strong>위치:</strong> 인천광역시 서구 검단신도시<br/>
            <strong>규모:</strong> 지하 2층 ~ 지상 29층, 총 1,500세대<br/>
            <strong>분양가:</strong> 3.3㎡당 1,500만원대 (분양가 상한제 적용)
          </p>
          <div style="background: #EFF6FF; padding: 12px; border-radius: 8px; color: #1E40AF; font-size: 14px;">
            💡 GTX-D 검단역 예정, 인천 1호선 연장 수혜 지역!
          </div>
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

// 관련 공고 임시 데이터
const relatedJobs: SalesJobListing[] = [
  {
    id: '2', title: '여주성원 민간임대 아파트', description: '계약조건 바꿨습니다 페이백도 있음',
    type: 'apartment', tier: 'unique', badges: [], position: 'teamLead',
    salary: { type: 'commission' }, benefits: ['일비'], experience: 'none',
    company: '주) 피앤피', region: '경기 여주', views: 2156, createdAt: '2026.01.16',
  },
  {
    id: '3', title: '조건변경!! 과천 효성해링턴 초역세권!!', description: '지하철 4호선 초역세권!! 현장 직통연결!!',
    type: 'officetel', tier: 'unique', badges: ['new', 'hot'], position: 'headTeam',
    salary: { type: 'commission' }, benefits: [], experience: 'none',
    company: '국진하우징', region: '경기 과천', views: 1823, createdAt: '2026.01.16',
  },
];

// 전화번호 마스킹 (가운데 4자리)
function maskPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 11) return `${digits.slice(0,3)}-****-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0,3)}-****-${digits.slice(6)}`;
  if (digits.length === 9) return `${digits.slice(0,2)}-****-${digits.slice(5)}`;
  return phone.replace(/(\d{2,4})([\d-]{3,5})(\d{4})$/, '$1-****-$3');
}

const TIER_COLORS = {
  unique: { bg: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-50' },
  superior: { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50' },
  premium: { bg: 'bg-cyan-500', text: 'text-cyan-500', light: 'bg-cyan-50' },
  normal: { bg: 'bg-gray-500', text: 'text-gray-500', light: 'bg-gray-50' },
};

const TYPE_LABELS = { apartment: '아파트', officetel: '오피스텔', store: '상가/쇼핑몰', industrial: '지식산업센터' };
const POSITION_LABELS = { headTeam: '본부/팀장', teamLead: '팀장/팀원', member: '팀원' };
const SALARY_LABELS = { commission: '계약 수수료', base_incentive: '기본급+인센', daily: '일급' };

const TABS = [
  { id: 'details', label: '상세요강' },
  { id: 'application', label: '접수기간·방법' },
  { id: 'company', label: '기업정보' },
  { id: 'related', label: '추천공고' },
];

export default function JobDetailPage() {
  const params = useParams();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [mapCoord, setMapCoord] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!jobDetail.address) return;
    fetch(`/api/geocode?address=${encodeURIComponent(jobDetail.address)}`)
      .then(r => r.json())
      .then(data => { if (data.lat && data.lng) setMapCoord({ lat: data.lat, lng: data.lng }); })
      .catch(() => {});
  }, []);

  const colors = TIER_COLORS[jobDetail.tier];

  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white pb-32 md:pb-0">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/sales" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">목록으로</span>
            </Link>
            <div className="flex items-center gap-1">
              <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-2 rounded-lg ${
                  isBookmarked ? 'text-purple-600 bg-purple-50' : 'text-gray-500 hover:text-purple-600 hover:bg-gray-100'
                }`}
              >
                <Heart className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
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
              <p className="text-gray-600 text-base mb-1 font-medium">{jobDetail.company}</p>
              {/* 배지 */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`${colors.bg} text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase`}>
                  {jobDetail.tier}
                </span>
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                  {TYPE_LABELS[jobDetail.type]}
                </span>
                {jobDetail.badges.map((badge) => (
                  <span key={badge} className={`text-xs px-2 py-0.5 rounded-full ${
                    badge === 'new' ? 'bg-green-500 text-white' :
                    badge === 'hot' ? 'bg-red-500 text-white' :
                    badge === 'jackpot' ? 'bg-yellow-500 text-white' :
                    'bg-orange-500 text-white'
                  }`}>
                    {badge === 'new' ? '신규' : badge === 'hot' ? 'HOT' : badge === 'jackpot' ? '대박' : '인기'}
                  </span>
                ))}
              </div>
              {/* 제목 */}
              <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 leading-tight">{jobDetail.title}</h1>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2 flex-shrink-0">
              <span className="text-sm font-bold px-4 py-1.5 rounded-full text-purple-600 bg-purple-50">~{jobDetail.deadline}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 앵커 탭 (잡코리아 스타일) */}
      <nav className="sticky top-14 z-40 bg-white border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-gray-900 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* 좌측 콘텐츠 */}
          <div className="flex-1 min-w-0">

            {/* ===== 모집요강 (잡코리아 스타일 테이블) ===== */}
            <section id="details" className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-3">모집요강</h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-5">
                  <div className="flex gap-5 items-start">
                    <span className="text-gray-500 min-w-[80px] shrink-0">모집분야</span>
                    <span className="text-gray-900 font-medium">{jobDetail.title}</span>
                  </div>
                </div>
                <div className="px-6 py-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex gap-5 items-center">
                      <span className="text-gray-500 min-w-[80px] shrink-0">모집직종</span>
                      <span className="text-gray-900 font-medium">{POSITION_LABELS[jobDetail.position]}</span>
                    </div>
                    <div className="flex gap-5 items-center">
                      <span className="text-gray-500 min-w-[80px] shrink-0">경력</span>
                      <span className="text-purple-600 font-bold">{jobDetail.experience === 'none' ? '경력무관' : jobDetail.experience}</span>
                    </div>
                  </div>
                  <div className="flex gap-5 items-center">
                    <span className="text-gray-500 min-w-[80px] shrink-0">급여</span>
                    <div>
                      <span className="text-purple-600 font-bold">{jobDetail.salary.amount || '협의'}</span>
                      <span className="text-gray-500 text-sm ml-2">({SALARY_LABELS[jobDetail.salary.type]})</span>
                    </div>
                  </div>
                  <div className="flex gap-5 items-start">
                    <span className="text-gray-500 min-w-[80px] shrink-0">근무지주소</span>
                    <div>
                      <span className="text-gray-900">{jobDetail.address}</span>
                      <button
                        onClick={() => {
                          const mapEl = document.getElementById('company-map');
                          if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="inline-flex items-center gap-0.5 ml-2 text-xs text-purple-500 hover:text-purple-700 font-medium"
                      >
                        지도보기<ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ===== 상세 내용 (HTML) ===== */}
            <section className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-purple-600" />
                상세 모집내용
              </h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div
                  className="job-html-content"
                  dangerouslySetInnerHTML={{ __html: jobDetail.htmlContent }}
                />
              </div>
            </section>

            {/* ===== 접수기간 · 방법 (잡코리아 스타일 2x2) ===== */}
            <section id="application" className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-3">접수기간 · 방법</h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                  <div className="bg-gray-50 px-6 py-5 space-y-4">
                    <div className="flex gap-4 items-center">
                      <span className="text-gray-500 text-sm min-w-[50px]">시작일</span>
                      <span className="text-gray-900 font-medium">{jobDetail.createdAt}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <span className="text-gray-500 text-sm min-w-[50px]">마감일</span>
                      <span className="text-gray-900 font-bold">{jobDetail.deadline}</span>
                    </div>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div className="flex gap-4 items-center">
                      <span className="text-gray-500 text-sm min-w-[60px]">접수방법</span>
                      <span className="text-purple-600 font-medium">전화 / 문자 지원</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <span className="text-gray-500 text-sm min-w-[60px]">지원양식</span>
                      <span className="text-gray-900">이력서 없이 면접 가능</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2.5">
                <AlertCircle className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-xs text-gray-400">마감일은 기업의 사정으로 인해 조기 마감 또는 변경될 수 있습니다</span>
              </div>
            </section>

            {/* ===== 지원자 현황 통계 ===== */}
            <section className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-3">지원자 현황 통계</h2>
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-50 rounded-full mb-2">
                      <Eye className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{jobDetail.views.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">조회수</p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-emerald-50 rounded-full mb-2">
                      <Phone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">47</p>
                    <p className="text-xs text-gray-500 mt-0.5">전화문의</p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-rose-50 rounded-full mb-2">
                      <Heart className="w-5 h-5 text-rose-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-500 mt-0.5">스크랩</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ===== 기업 정보 (잡코리아 스타일 컬러 카드) ===== */}
            <section id="company" className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-3">기업 정보</h2>

              {/* 4카드 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-gray-200 rounded-xl p-4 h-[140px] flex flex-col hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-auto">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">회사명</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{jobDetail.company}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 h-[140px] flex flex-col hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-auto">
                    <User className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">대표자</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{jobDetail.companyInfo.representative}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 h-[140px] flex flex-col hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-auto">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">직원수</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{jobDetail.companyInfo.employees}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 h-[140px] flex flex-col hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-auto">
                    <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center">
                      <Navigation className="w-5 h-5 text-cyan-600" />
                    </div>
                    <button
                      onClick={() => {
                        const mapEl = document.getElementById('company-map');
                        if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="text-xs text-purple-500 hover:text-purple-700 font-medium flex items-center gap-0.5"
                    >
                      지도보기<ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">위치</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{jobDetail.region}</p>
                  </div>
                </div>
              </div>

              {/* VWorld 지도 */}
              {mapCoord && (
                <div id="company-map" className="mt-4">
                  <VWorldMap lat={mapCoord.lat} lng={mapCoord.lng} label={jobDetail.company} height="280px" />
                </div>
              )}
            </section>

            {/* ===== 추천공고 ===== */}
            <section id="related" className="mb-10 border-t border-gray-200 pt-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">추천공고</h2>
                <Link href="/sales/jobs" className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm font-medium">
                  전체보기<ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedJobs.map((job) => (
                  <JobCard key={job.id} job={job} variant="compact" />
                ))}
              </div>
            </section>
          </div>

          {/* 우측 사이드바 (잡코리아 스타일) */}
          <aside className="w-[300px] hidden lg:block flex-shrink-0">
            <div className="sticky top-[120px] space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* 구조화된 key-value 리스트 */}
                <div className="p-5 space-y-0 divide-y divide-gray-100">
                  <div className="flex items-center justify-between py-2.5 first:pt-0">
                    <span className="text-sm text-gray-500">매물유형</span>
                    <span className="text-sm font-semibold text-gray-900">{TYPE_LABELS[jobDetail.type]}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-gray-500">모집직종</span>
                    <span className="text-sm font-semibold text-gray-900">{POSITION_LABELS[jobDetail.position]}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-gray-500">경력</span>
                    <span className="text-sm font-semibold text-gray-900">{jobDetail.experience === 'none' ? '경력무관' : jobDetail.experience}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-gray-500">급여</span>
                    <span className="text-sm font-bold text-purple-600">{jobDetail.salary.amount || SALARY_LABELS[jobDetail.salary.type]}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-gray-500">근무지역</span>
                    <span className="text-sm font-semibold text-gray-900">{jobDetail.region}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 last:pb-0">
                    <span className="text-sm text-gray-500">마감일</span>
                    <span className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-0.5 rounded-full">{jobDetail.deadline}</span>
                  </div>
                </div>

                {/* 버튼 영역 */}
                <div className="px-5 pb-5 pt-3 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className={`p-3 rounded-xl border transition-colors flex-shrink-0 ${
                        isBookmarked ? 'bg-purple-50 border-purple-200 text-purple-600' : 'border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-200'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold text-base hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Phone className="w-5 h-5" />
                      {maskPhone(jobDetail.phone)}
                    </button>
                  </div>
                  <button className="w-full py-3 border border-purple-600 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    문자 문의
                  </button>
                </div>

                {/* 통계 */}
                <div className="flex items-center justify-around px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">조회</p>
                    <p className="text-sm font-bold text-gray-900">{jobDetail.views.toLocaleString()}</p>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                  <div className="text-center">
                    <p className="text-xs text-gray-400">등록일</p>
                    <p className="text-sm font-bold text-gray-900">{jobDetail.createdAt}</p>
                  </div>
                </div>
              </div>

              {/* 혜택 */}
              {jobDetail.benefits.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">복리후생</h3>
                  <div className="flex flex-wrap gap-2">
                    {jobDetail.benefits.map((benefit, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* 모바일 하단 CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-30">
        <div className="flex gap-3">
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors ${
              isBookmarked ? 'bg-purple-50 border-purple-200 text-purple-600' : 'border-gray-200 text-gray-400'
            }`}
          >
            <Star className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-bold text-lg"
          >
            <Phone className="w-5 h-5" />
            {maskPhone(jobDetail.phone)}
          </button>
        </div>
      </div>

      <MobileNav variant="sales" />
    </div>
  );
}
