'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Heart, Share2, MapPin, Building2, Clock, Users,
  Phone, MessageCircle, Bookmark, ChevronRight, Eye, Calendar,
  Banknote, Home, CheckCircle2, AlertCircle
} from 'lucide-react';
import MobileNav from '@/components/shared/MobileNav';
import JobCard from '@/components/sales/JobCard';
import type { SalesJobListing } from '@/types';

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
  // HTML 콘텐츠 (잡코리아 스타일)
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
    id: '2',
    title: '여주성원 민간임대 아파트',
    description: '계약조건 바꿨습니다 페이백도 있음',
    type: 'apartment',
    tier: 'unique',
    badges: [],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['일비'],
    experience: 'none',
    company: '주) 피앤피',
    region: '경기 여주',
    views: 2156,
    createdAt: '2026.01.16',
  },
  {
    id: '3',
    title: '조건변경!! 과천 효성해링턴 초역세권!!',
    description: '지하철 4호선 초역세권!! 현장 직통연결!!',
    type: 'officetel',
    tier: 'unique',
    badges: ['new', 'hot'],
    position: 'headTeam',
    salary: { type: 'commission' },
    benefits: [],
    experience: 'none',
    company: '국진하우징',
    region: '경기 과천',
    views: 1823,
    createdAt: '2026.01.16',
  },
];

const TIER_COLORS = {
  unique: { bg: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-50' },
  superior: { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50' },
  premium: { bg: 'bg-cyan-500', text: 'text-cyan-500', light: 'bg-cyan-50' },
  normal: { bg: 'bg-gray-500', text: 'text-gray-500', light: 'bg-gray-50' },
};

const TYPE_LABELS = {
  apartment: '아파트',
  officetel: '오피스텔',
  store: '상가/쇼핑몰',
  industrial: '지식산업센터',
};

const POSITION_LABELS = {
  headTeam: '본부/팀장',
  teamLead: '팀장/팀원',
  member: '팀원',
};

const SALARY_LABELS = {
  commission: '계약 수수료',
  base_incentive: '기본급+인센',
  daily: '일급',
};

export default function JobDetailPage() {
  const params = useParams();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const colors = TIER_COLORS[jobDetail.tier];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/sales" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden md:inline">목록으로</span>
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-2 rounded-lg border transition-colors ${
                  isBookmarked ? 'bg-purple-50 border-purple-200 text-purple-600' : 'border-gray-200 text-gray-400 hover:text-gray-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 메인 콘텐츠 */}
          <div className="flex-1">
            {/* 상단 요약 정보 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              {/* 티어 + 유형 */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`${colors.bg} text-white text-xs font-bold px-2 py-1 rounded uppercase`}>
                  {jobDetail.tier}
                </span>
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                  {TYPE_LABELS[jobDetail.type]}
                </span>
                {jobDetail.badges.map((badge) => (
                  <span
                    key={badge}
                    className={`text-xs px-2 py-0.5 rounded ${
                      badge === 'new' ? 'bg-green-500 text-white' :
                      badge === 'hot' ? 'bg-red-500 text-white' :
                      badge === 'jackpot' ? 'bg-yellow-500 text-white' :
                      'bg-orange-500 text-white'
                    }`}
                  >
                    {badge === 'new' ? '신규' : badge === 'hot' ? 'HOT' : badge === 'jackpot' ? '대박' : '인기'}
                  </span>
                ))}
              </div>

              {/* 제목 */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{jobDetail.title}</h1>
              <p className="text-gray-600 mb-4">{jobDetail.description}</p>

              {/* 회사 정보 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{jobDetail.company}</p>
                  <p className="text-sm text-gray-500">{jobDetail.region}</p>
                </div>
              </div>

              {/* 주요 정보 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                    <Banknote className="w-4 h-4" />
                    급여
                  </div>
                  <p className="font-medium text-gray-900">{SALARY_LABELS[jobDetail.salary.type]}</p>
                  {jobDetail.salary.amount && (
                    <p className="text-purple-600 font-bold">{jobDetail.salary.amount}</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                    <Users className="w-4 h-4" />
                    모집직종
                  </div>
                  <p className="font-medium text-gray-900">{POSITION_LABELS[jobDetail.position]}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    경력
                  </div>
                  <p className="font-medium text-gray-900">{jobDetail.experience}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    마감일
                  </div>
                  <p className="font-medium text-gray-900">{jobDetail.deadline}</p>
                </div>
              </div>

              {/* 혜택 */}
              {jobDetail.benefits.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {jobDetail.benefits.map((benefit, i) => (
                    <span key={i} className="flex items-center gap-1 text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                      {benefit}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 상세 내용 (HTML) */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-purple-600" />
                상세 모집내용
              </h2>
              <div
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: jobDetail.htmlContent }}
              />
            </div>

            {/* 근무지 정보 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                근무지 위치
              </h2>
              <p className="text-gray-700 mb-4">{jobDetail.address}</p>
              <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                지도 영역 (카카오맵 연동 예정)
              </div>
            </div>

            {/* 회사 정보 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                회사 정보
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">회사명</p>
                  <p className="font-medium text-gray-900">{jobDetail.company}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">대표자</p>
                  <p className="font-medium text-gray-900">{jobDetail.companyInfo.representative}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">설립년도</p>
                  <p className="font-medium text-gray-900">{jobDetail.companyInfo.founded}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">직원수</p>
                  <p className="font-medium text-gray-900">{jobDetail.companyInfo.employees}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="lg:w-80 flex-shrink-0 space-y-4">
            {/* 지원하기 카드 (고정) */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 lg:sticky lg:top-20">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">급여</p>
                <p className="text-2xl font-bold text-purple-600">{jobDetail.salary.amount || SALARY_LABELS[jobDetail.salary.type]}</p>
              </div>

              <div className="space-y-3">
                <a
                  href={`tel:${jobDetail.phone}`}
                  className="flex items-center justify-center gap-2 w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  전화 지원하기
                </a>
                <button className="flex items-center justify-center gap-2 w-full border border-purple-600 text-purple-600 py-3 rounded-xl font-medium hover:bg-purple-50 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  문자 문의하기
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  조회 {jobDetail.views.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {jobDetail.createdAt}
                </span>
              </div>
            </div>

            {/* 관련 공고 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">관련 공고</h3>
                <Link href="/sales/jobs" className="text-sm text-purple-600 flex items-center gap-1 hover:underline">
                  더보기 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {relatedJobs.map((job) => (
                  <JobCard key={job.id} job={job} variant="compact" />
                ))}
              </div>
            </div>
          </div>
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
            <Heart className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          <a
            href={`tel:${jobDetail.phone}`}
            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-medium"
          >
            <Phone className="w-5 h-5" />
            전화 지원하기
          </a>
        </div>
      </div>

      <MobileNav variant="sales" />
    </div>
  );
}
