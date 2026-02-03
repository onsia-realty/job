'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  MapPin,
  ChevronRight,
  Building2,
  Home,
  Store,
  Landmark,
  Warehouse,
  TrendingUp,
  Users,
  Briefcase,
  Star,
  Clock,
  Flame,
  Eye,
  Bell,
  Sparkles,
  Crown,
  Zap,
  Target,
  CheckCircle2,
  BadgeCheck,
  Gavel,
  Building,
  ChevronDown,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import MobileNav from '@/components/shared/MobileNav';
import type { AgentJobListing, PropertyCategory, AgentJobType } from '@/types';
import { REGIONS, PROPERTY_CATEGORY_LABELS, PROPERTY_CATEGORY_TYPES } from '@/types';

// 카테고리 정의 (대분류 > 소분류)
const CATEGORY_CONFIG = {
  residential: {
    label: '주거용',
    icon: Home,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    types: [
      { id: 'apartment' as AgentJobType, name: '아파트', icon: Building2, count: 342 },
      { id: 'officetel' as AgentJobType, name: '오피스텔', icon: Building, count: 156 },
      { id: 'villa' as AgentJobType, name: '빌라/다세대', icon: Home, count: 198 },
    ],
  },
  commercial: {
    label: '상업용',
    icon: Store,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    types: [
      { id: 'store' as AgentJobType, name: '상가', icon: Store, count: 234 },
      { id: 'office' as AgentJobType, name: '사무실', icon: Landmark, count: 189 },
      { id: 'building' as AgentJobType, name: '빌딩매매', icon: Warehouse, count: 87 },
      { id: 'auction' as AgentJobType, name: '경매', icon: Gavel, count: 56 },
    ],
  },
};

// 파워/VIP 광고 데이터
const premiumAds = [
  {
    id: 'ad1',
    title: '강남 대형 빌딩 전문 채용',
    company: '㈜에이피부동산중개법인',
    badge: '부동산 지원 TOP100',
    deadline: '내일마감',
    bgImage: '/images/ad-bg-1.svg',
    logo: '/images/company-logo-1.svg',
    link: '/agent/jobs/1',
    tier: 'power',
    category: 'residential',
  },
  {
    id: 'ad2',
    title: '핵심 포지션 공개채용',
    company: '(주)프로그레시브인베스트먼트',
    badge: '오늘 뜬',
    deadline: '~03.01(일)',
    bgImage: '/images/ad-bg-2.svg',
    logo: '/images/company-logo-2.svg',
    link: '/agent/jobs/2',
    tier: 'vip',
    category: 'commercial',
  },
  {
    id: 'ad3',
    title: '부문별 신입/경력사원 채용',
    company: '아이에스동서㈜',
    badge: '건설·건축 지원 TOP100',
    deadline: 'D-3',
    bgImage: '/images/ad-bg-3.svg',
    logo: '/images/company-logo-3.svg',
    link: '/agent/jobs/3',
    tier: 'power',
    category: 'commercial',
  },
  {
    id: 'ad4',
    title: '2026 신입&경력 대규모 채용',
    company: '(주)바이앤셀파트너스',
    badge: '마케팅·홍보 급상승',
    deadline: '~02.28(토)',
    bgImage: '/images/ad-bg-4.svg',
    logo: '/images/company-logo-4.svg',
    link: '/agent/jobs/4',
    tier: 'vip',
    category: 'commercial',
  },
];

// 샘플 데이터
const sampleJobs: AgentJobListing[] = [
  {
    id: '1',
    title: '강남 대형 아파트 전문 중개사 모집',
    description: '래미안, 자이, 힐스테이트 등 브랜드 아파트 전문',
    type: 'apartment',
    tier: 'premium',
    badges: ['hot', 'urgent'],
    salary: { type: 'mixed', amount: '300~450만', min: 300, max: 450 },
    experience: '2년 이상',
    experienceLevel: '2year',
    company: '강남프라임공인중개사',
    region: '서울',
    address: '강남구 테헤란로',
    views: 3842,
    applicants: 67,
    createdAt: '2026.01.28',
    deadline: '2026-02-05',
    benefits: ['insurance', 'incentive', 'parking', 'meal', 'bonus'],
  },
  {
    id: '2',
    title: '판교 IT밸리 오피스텔 전문 경력직',
    description: '판교 테크노밸리 오피스텔 임대/매매 전문',
    type: 'officetel',
    tier: 'premium',
    badges: ['new'],
    salary: { type: 'commission', amount: '수수료 75%' },
    experience: '1년 이상',
    experienceLevel: '1year',
    company: '판교밸리부동산',
    region: '경기',
    views: 2156,
    applicants: 34,
    createdAt: '2026.01.30',
    deadline: '2026-02-20',
    benefits: ['parking', 'flexible', 'laptop'],
  },
  {
    id: '3',
    title: '홍대 상권 상가 전문가 급구',
    description: '홍대/합정 상가, 프랜차이즈 입점 전문',
    type: 'store',
    tier: 'premium',
    badges: ['urgent', 'hot'],
    salary: { type: 'mixed', amount: '250만+α', min: 250 },
    experience: '3년 이상',
    experienceLevel: '3year',
    company: '홍대스타부동산',
    region: '서울',
    views: 1987,
    applicants: 23,
    createdAt: '2026.01.29',
    deadline: '2026-02-03',
    benefits: ['insurance', 'incentive', 'meal'],
  },
  {
    id: '4',
    title: '여의도 프라임 오피스 임대 전문',
    description: 'IFC, 파크원 등 프라임 오피스 빌딩 전문',
    type: 'office',
    tier: 'premium',
    badges: ['hot'],
    salary: { type: 'monthly', amount: '350~500만', min: 350, max: 500 },
    experience: '5년 이상',
    experienceLevel: '5year',
    company: '여의도타워공인',
    region: '서울',
    views: 4521,
    applicants: 89,
    createdAt: '2026.01.27',
    deadline: '2026-02-10',
    benefits: ['insurance', 'incentive', 'parking', 'meal', 'bonus', 'vacation'],
  },
  {
    id: '5',
    title: '강남 꼬마빌딩 매매 전문 에이전트',
    description: '50억 이하 꼬마빌딩 매매 전문, 고수익',
    type: 'building',
    tier: 'premium',
    badges: ['new'],
    salary: { type: 'commission', amount: '건당 협의' },
    experience: '3년 이상',
    experienceLevel: '3year',
    company: '강남빌딩전문중개',
    region: '서울',
    views: 2876,
    applicants: 41,
    createdAt: '2026.01.31',
    deadline: '2026-02-28',
    benefits: ['flexible', 'incentive'],
  },
  {
    id: '6',
    title: '신림동 빌라/다세대 전문 신입환영',
    description: '관악구 빌라 전문, 초보자 교육 시스템 완비',
    type: 'villa',
    tier: 'normal',
    badges: ['new'],
    salary: { type: 'mixed', amount: '200만+α', min: 200 },
    experience: '경력무관',
    experienceLevel: 'none',
    company: '신림프라임부동산',
    region: '서울',
    isAlwaysRecruiting: true,
    views: 1234,
    applicants: 18,
    createdAt: '2026.01.30',
    benefits: ['insurance', 'education', 'transport'],
  },
  {
    id: '7',
    title: '서울 법원경매 전문 컨설턴트 모집',
    description: '경매/공매 전문, NPL 투자 컨설팅',
    type: 'auction',
    tier: 'premium',
    badges: ['hot'],
    salary: { type: 'commission', amount: '수수료 80%' },
    experience: '2년 이상',
    experienceLevel: '2year',
    company: '서울경매전문',
    region: '서울',
    views: 1567,
    applicants: 29,
    createdAt: '2026.01.29',
    deadline: '2026-02-15',
    benefits: ['flexible', 'incentive', 'education'],
  },
  {
    id: '8',
    title: '분당 아파트 전문 경력 중개사',
    description: '분당 신도시 대단지 아파트 전문',
    type: 'apartment',
    tier: 'normal',
    badges: [],
    salary: { type: 'mixed', amount: '250~320만', min: 250, max: 320 },
    experience: '1년 이상',
    experienceLevel: '1year',
    company: '분당센트럴공인',
    region: '경기',
    views: 987,
    applicants: 21,
    createdAt: '2026.01.28',
    deadline: '2026-02-15',
    benefits: ['insurance', 'parking'],
  },
];

// 인기 지역
const popularRegions = [
  { name: '서울 강남', jobs: 156, growth: '+23%' },
  { name: '서울 송파', jobs: 98, growth: '+15%' },
  { name: '경기 분당', jobs: 87, growth: '+31%' },
  { name: '서울 마포', jobs: 76, growth: '+12%' },
  { name: '경기 판교', jobs: 65, growth: '+45%' },
];

// D-Day 계산
function getDDay(deadline?: string): { text: string; color: string; urgent: boolean } {
  if (!deadline) return { text: '상시채용', color: 'bg-gray-100 text-gray-600', urgent: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: '마감', color: 'bg-gray-200 text-gray-500', urgent: false };
  if (diffDays === 0) return { text: 'D-DAY', color: 'bg-red-500 text-white', urgent: true };
  if (diffDays <= 3) return { text: `D-${diffDays}`, color: 'bg-red-500 text-white', urgent: true };
  if (diffDays <= 7) return { text: `D-${diffDays}`, color: 'bg-orange-500 text-white', urgent: true };
  return { text: `D-${diffDays}`, color: 'bg-gray-100 text-gray-600', urgent: false };
}

// 카테고리 정보 가져오기
function getCategoryInfo(type: AgentJobType) {
  for (const [key, config] of Object.entries(CATEGORY_CONFIG)) {
    const found = config.types.find(t => t.id === type);
    if (found) {
      return { ...found, parentKey: key as PropertyCategory, parentConfig: config };
    }
  }
  return null;
}

export default function AgentMainPage() {
  const [mainCategory, setMainCategory] = useState<PropertyCategory>('residential');
  const [selectedSubType, setSelectedSubType] = useState<AgentJobType | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');

  const currentConfig = CATEGORY_CONFIG[mainCategory];

  // 필터링된 공고
  const filteredJobs = sampleJobs.filter(job => {
    // 대분류 필터
    const categoryTypes = currentConfig.types.map(t => t.id);
    if (!categoryTypes.includes(job.type)) return false;

    // 소분류 필터
    if (selectedSubType && job.type !== selectedSubType) return false;

    // 지역 필터
    if (selectedRegion !== '전체' && job.region !== selectedRegion) return false;

    return true;
  });

  const premiumJobs = filteredJobs.filter(job => job.tier === 'premium');
  const urgentJobs = filteredJobs.filter(job => {
    const dday = getDDay(job.deadline);
    return dday.urgent;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Header variant="agent" />

      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* 배경 효과 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-14">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 text-sm px-3 py-1.5 rounded-full border border-white/10">
              <Sparkles className="w-4 h-4 text-amber-400" />
              부동산 전문가를 위한 프리미엄 플랫폼
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            온시아 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Job</span>
          </h1>
          <p className="text-slate-300 mb-6">주거용부터 상업용까지, 부동산 전 분야 채용 정보</p>

          {/* 검색바 */}
          <div className="bg-white rounded-2xl p-2 shadow-2xl shadow-black/20 max-w-4xl">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative md:w-36">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full bg-slate-50 text-slate-700 pl-10 pr-4 py-3 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                >
                  <option value="전체">전체 지역</option>
                  {REGIONS.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="회사명, 지역, 키워드로 검색"
                  className="w-full bg-slate-50 text-slate-700 placeholder-slate-400 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <Link
                href={`/agent/jobs?region=${selectedRegion}&q=${searchQuery}&category=${mainCategory}`}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25 text-center flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                검색
              </Link>
            </div>
          </div>

          {/* 실시간 통계 */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span>실시간 채용공고 <strong className="text-white">1,247</strong>건</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>오늘 등록 <strong className="text-amber-400">+48</strong>건</span>
            </div>
          </div>
        </div>
      </section>

      {/* 카테고리 선택 (주거용 / 상업용) */}
      <section className="max-w-7xl mx-auto px-4 -mt-5 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-4 md:p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            {(Object.entries(CATEGORY_CONFIG) as [PropertyCategory, typeof CATEGORY_CONFIG.residential][]).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = mainCategory === key;
              const subTypeNames = config.types.map(t => t.name).join(', ');
              const totalCount = config.types.reduce((sum, t) => sum + t.count, 0);
              return (
                <button
                  key={key}
                  onClick={() => { setMainCategory(key); setSelectedSubType(null); }}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-xl font-medium transition-all border-2 ${
                    isActive
                      ? `bg-gradient-to-r ${config.color} text-white border-transparent shadow-lg`
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-white/20' : config.bgColor
                  }`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : config.textColor}`} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-lg font-bold">{config.label}</span>
                      <span className={`text-sm px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {totalCount.toLocaleString()}건
                      </span>
                    </div>
                    <p className={`text-sm truncate ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                      ({subTypeNames})
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 파워/VIP 광고 섹션 */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {premiumAds.map((ad) => (
            <Link
              key={ad.id}
              href={ad.link}
              className="group relative bg-slate-200 rounded-xl overflow-hidden aspect-[4/5] hover:shadow-xl transition-all"
            >
              {/* 배경 이미지 */}
              <div className="absolute inset-0">
                <Image
                  src={ad.bgImage}
                  alt={ad.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              </div>

              {/* 배지 */}
              <div className="absolute top-3 left-3 z-10">
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  ad.tier === 'power'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
                }`}>
                  {ad.badge}
                </span>
              </div>

              {/* 회사 로고 */}
              <div className="absolute top-3 right-3 z-10">
                <div className="w-10 h-10 bg-white rounded-lg shadow-lg overflow-hidden">
                  <Image
                    src={ad.logo}
                    alt={ad.company}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
              </div>

              {/* 하단 정보 */}
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white z-10">
                <h3 className="font-bold text-sm md:text-base line-clamp-2 mb-1 group-hover:text-emerald-300 transition-colors">
                  {ad.title}
                </h3>
                <p className="text-xs text-white/70 mb-2 truncate">{ad.company}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  ad.deadline.includes('D-') || ad.deadline.includes('마감')
                    ? 'bg-red-500/80'
                    : 'bg-white/20'
                }`}>
                  {ad.deadline}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-8">

            {/* 마감임박 공고 */}
            {urgentJobs.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Flame className="w-4 h-4 text-red-500" />
                    </div>
                    마감임박 공고
                  </h2>
                  <Link href="/agent/jobs?sort=deadline" className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-1">
                    더보기 <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {urgentJobs.slice(0, 3).map((job) => {
                    const categoryInfo = getCategoryInfo(job.type);
                    const dday = getDDay(job.deadline);
                    if (!categoryInfo) return null;
                    const Icon = categoryInfo.icon;
                    return (
                      <Link
                        key={job.id}
                        href={`/agent/jobs/${job.id}`}
                        className="group block bg-white rounded-xl border border-slate-200 hover:border-red-200 hover:shadow-md transition-all overflow-hidden"
                      >
                        <div className="flex">
                          <div className={`w-1 bg-gradient-to-b ${categoryInfo.parentConfig.color}`}></div>
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${dday.color}`}>
                                    {dday.text}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${categoryInfo.parentConfig.bgColor} ${categoryInfo.parentConfig.textColor}`}>
                                    {categoryInfo.name}
                                  </span>
                                  {job.tier === 'premium' && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-0.5">
                                      <Crown className="w-3 h-3" /> PREMIUM
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-500 mb-0.5">{job.company}</p>
                                <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-1">
                                  {job.title}
                                </h3>
                                <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {job.region}
                                  </span>
                                  <span>{job.experience}</span>
                                  <span className="text-emerald-600 font-medium">{job.salary.amount}</span>
                                </div>
                              </div>
                              <div className={`w-11 h-11 rounded-xl ${categoryInfo.parentConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-5 h-5 ${categoryInfo.parentConfig.textColor}`} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* PREMIUM 채용 */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  PREMIUM 채용
                </h2>
                <Link href="/agent/jobs?tier=premium" className="text-sm text-slate-500 hover:text-amber-500 flex items-center gap-1">
                  더보기 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {premiumJobs.slice(0, 4).map((job) => {
                  const categoryInfo = getCategoryInfo(job.type);
                  const dday = getDDay(job.deadline);
                  if (!categoryInfo) return null;
                  const Icon = categoryInfo.icon;
                  return (
                    <Link
                      key={job.id}
                      href={`/agent/jobs/${job.id}`}
                      className="group block bg-white rounded-xl border-2 border-amber-100 hover:border-amber-200 hover:shadow-lg transition-all p-4 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-50 to-transparent rounded-bl-full"></div>
                      <div className="relative">
                        <div className="flex items-start justify-between mb-2">
                          <div className={`w-10 h-10 rounded-xl ${categoryInfo.parentConfig.bgColor} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${categoryInfo.parentConfig.textColor}`} />
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${dday.color}`}>
                            {dday.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm text-slate-500">{job.company}</span>
                          <BadgeCheck className="w-4 h-4 text-amber-500" />
                        </div>
                        <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors mb-2 line-clamp-2">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap gap-1.5 text-xs mb-3">
                          <span className={`px-2 py-1 rounded ${categoryInfo.parentConfig.bgColor} ${categoryInfo.parentConfig.textColor}`}>
                            {categoryInfo.name}
                          </span>
                          <span className="px-2 py-1 rounded bg-slate-100 text-slate-600">{job.region}</span>
                          <span className="px-2 py-1 rounded bg-slate-100 text-slate-600">{job.experience}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-emerald-600 font-bold text-sm">{job.salary.amount}</span>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="flex items-center gap-0.5">
                              <Eye className="w-3 h-3" /> {job.views.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Users className="w-3 h-3" /> {job.applicants}명
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* 최신 채용 */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-slate-600" />
                  </div>
                  최신 채용
                </h2>
                <Link href="/agent/jobs" className="text-sm text-slate-500 hover:text-emerald-600 flex items-center gap-1">
                  전체보기 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {filteredJobs.slice(0, 6).map((job) => {
                  const categoryInfo = getCategoryInfo(job.type);
                  const dday = getDDay(job.deadline);
                  if (!categoryInfo) return null;
                  return (
                    <Link
                      key={job.id}
                      href={`/agent/jobs/${job.id}`}
                      className="group flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-lg ${categoryInfo.parentConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <categoryInfo.icon className={`w-4 h-4 ${categoryInfo.parentConfig.textColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm text-slate-500">{job.company}</span>
                          {job.tier === 'premium' && <Crown className="w-3 h-3 text-amber-500" />}
                        </div>
                        <h3 className="font-medium text-slate-800 group-hover:text-emerald-600 transition-colors truncate text-sm">
                          {job.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-emerald-600">{job.salary.amount}</p>
                          <p className="text-xs text-slate-400">{job.region}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${dday.color}`}>
                          {dday.text}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>

          {/* 사이드바 */}
          <div className="space-y-5">
            {/* 맞춤 공고 알림 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold">맞춤 공고 알림</h3>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                원하는 조건의 채용공고가 등록되면 바로 알려드려요
              </p>
              <Link
                href="/agent/auth/login"
                className="block text-center bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold py-2.5 rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all text-sm"
              >
                알림 설정하기
              </Link>
            </div>

            {/* 인기 지역 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800">인기 채용 지역</h3>
              </div>
              <div className="space-y-1.5">
                {popularRegions.map((region, idx) => (
                  <Link
                    key={region.name}
                    href={`/agent/jobs?region=${region.name}`}
                    className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-lg transition-colors group"
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx < 3 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm text-slate-700 group-hover:text-emerald-600 transition-colors">
                      {region.name}
                    </span>
                    <span className="text-xs text-slate-400">{region.jobs}건</span>
                    <span className="text-xs text-emerald-500 font-medium">{region.growth}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 이력서 등록 CTA */}
            <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl p-5 border border-emerald-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200/50">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1">이력서 등록하기</h3>
                <p className="text-sm text-slate-600 mb-3">
                  기업에서 먼저 연락해요
                </p>
                <Link
                  href="/agent/mypage/resume"
                  className="block text-center bg-emerald-600 text-white font-medium py-2 rounded-xl hover:bg-emerald-700 transition-colors text-sm"
                >
                  무료 등록
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileNav variant="agent" />
    </div>
  );
}
