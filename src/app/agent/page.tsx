'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  ChevronRight,
  MapPin,
  ArrowRight,
  TrendingUp,
  Users,
  Building2,
  Briefcase,
  Star,
  BarChart3,
  Clock,
  Flame,
  Zap,
  Filter,
  Bell,
  Target,
  Award,
  CalendarClock,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import MobileNav from '@/components/shared/MobileNav';
import AgentJobCard from '@/components/agent/JobCard';
import type { AgentJobListing, AgentBenefit } from '@/types';
import { REGIONS } from '@/types';

// 확장된 샘플 데이터 (사람인/잡코리아 스타일)
const sampleJobs: AgentJobListing[] = [
  {
    id: '1',
    title: '강남역 프리미엄 중개사무소 정규직 채용',
    description: '강남 대형 아파트 전문 중개사무소에서 경력 중개사를 모집합니다',
    type: 'apartment',
    tier: 'premium',
    badges: ['hot', 'urgent'],
    salary: { type: 'mixed', amount: '250~350만', min: 250, max: 350 },
    experience: '1년 이상',
    experienceLevel: '1year',
    company: '강남센트럴공인중개사사무소',
    region: '서울',
    address: '강남역 5번출구 도보 3분',
    views: 2523,
    applicants: 45,
    createdAt: '2026.01.20',
    deadline: '2026-01-25',
    benefits: ['insurance', 'incentive', 'parking', 'meal', 'bonus'],
    workHours: '09:00~18:00',
    workDays: '주5일',
  },
  {
    id: '2',
    title: '분당 정자동 상가/오피스 전문 중개사 모집',
    description: '분당 테크노밸리 상권 전문, 안정적인 고정 수입 보장',
    type: 'store',
    tier: 'premium',
    badges: ['new'],
    salary: { type: 'commission', amount: '협의 (수수료 70%)' },
    experience: '2년 이상',
    experienceLevel: '2year',
    company: '분당스마트공인중개사',
    region: '경기',
    address: '정자역 인근',
    views: 1892,
    applicants: 28,
    createdAt: '2026.01.19',
    deadline: '2026-02-15',
    benefits: ['insurance', 'parking', 'education', 'flexible'],
    workHours: '자율출퇴근',
    workDays: '주5일',
  },
  {
    id: '3',
    title: '신림동 원룸/빌라 전문 신입/경력 채용',
    description: '친절한 교육 시스템, 초보자도 환영합니다',
    type: 'oneroom',
    tier: 'normal',
    badges: ['new'],
    salary: { type: 'mixed', amount: '200만+α', min: 200 },
    experience: '경력무관',
    experienceLevel: 'none',
    company: '신림프라임부동산',
    region: '서울',
    views: 954,
    applicants: 12,
    createdAt: '2026.01.19',
    isAlwaysRecruiting: true,
    benefits: ['insurance', 'education', 'transport'],
    workHours: '09:30~18:30',
    workDays: '주5일 (격주 토요일)',
  },
  {
    id: '4',
    title: '인천 송도 오피스빌딩 전문 경력직',
    description: '송도국제도시 대형 오피스빌딩 임대관리 전문',
    type: 'office',
    tier: 'premium',
    badges: ['hot'],
    salary: { type: 'monthly', amount: '280~350만', min: 280, max: 350 },
    experience: '1년 이상',
    experienceLevel: '1year',
    company: '송도글로벌공인중개사',
    region: '인천',
    views: 1432,
    applicants: 31,
    createdAt: '2026.01.18',
    deadline: '2026-01-28',
    benefits: ['insurance', 'incentive', 'meal', 'parking', 'laptop'],
    workHours: '09:00~18:00',
    workDays: '주5일',
  },
  {
    id: '5',
    title: '잠실 재건축 아파트 전문 고경력 채용',
    description: '잠실 RITZ 재건축 단지 전문, 고수익 보장',
    type: 'apartment',
    tier: 'premium',
    badges: ['hot'],
    salary: { type: 'mixed', amount: '300~500만', min: 300, max: 500 },
    experience: '3년 이상',
    experienceLevel: '3year',
    company: '잠실프레스티지부동산',
    region: '서울',
    address: '잠실역 인근',
    views: 3541,
    applicants: 67,
    createdAt: '2026.01.18',
    deadline: '2026-01-23',
    benefits: ['insurance', 'incentive', 'parking', 'meal', 'bonus', 'vacation'],
    workHours: '09:00~18:00',
    workDays: '주5일',
  },
  {
    id: '6',
    title: '홍대입구 빌라/다가구 전문 중개사',
    description: '마포구 인기 상권, 높은 회전율',
    type: 'villa',
    tier: 'normal',
    badges: [],
    salary: { type: 'mixed', amount: '220만+α', min: 220 },
    experience: '6개월 이상',
    experienceLevel: '6month',
    company: '홍대부동산',
    region: '서울',
    views: 876,
    applicants: 15,
    createdAt: '2026.01.17',
    deadline: '2026-02-10',
    benefits: ['insurance', 'transport'],
    workHours: '09:00~18:00',
    workDays: '주5일',
  },
  {
    id: '7',
    title: '해운대 브랜드아파트 전문 중개사',
    description: '해운대 마린시티 고급 아파트 전문',
    type: 'apartment',
    tier: 'normal',
    badges: ['new'],
    salary: { type: 'mixed', amount: '230~300만', min: 230, max: 300 },
    experience: '1년 이상',
    experienceLevel: '1year',
    company: '해운대마린공인',
    region: '부산',
    views: 723,
    applicants: 19,
    createdAt: '2026.01.17',
    deadline: '2026-02-05',
    benefits: ['insurance', 'incentive', 'parking'],
    workHours: '09:00~18:00',
    workDays: '주5일',
  },
  {
    id: '8',
    title: '판교 테크노밸리 오피스 전문 급구',
    description: 'IT기업 밀집지역, 높은 수수료율',
    type: 'office',
    tier: 'premium',
    badges: ['urgent', 'hot'],
    salary: { type: 'commission', amount: '수수료 80%' },
    experience: '2년 이상',
    experienceLevel: '2year',
    company: '판교밸리공인중개사',
    region: '경기',
    address: '판교역 도보 5분',
    views: 2156,
    applicants: 42,
    createdAt: '2026.01.16',
    deadline: '2026-01-22',
    benefits: ['parking', 'flexible', 'laptop', 'education'],
    workHours: '자율출퇴근',
    workDays: '주5일',
  },
];

// 인기 지역 데이터
const popularRegions = [
  { name: '서울 강남구', count: 234, trend: '+12%' },
  { name: '서울 송파구', count: 189, trend: '+8%' },
  { name: '경기 분당구', count: 156, trend: '+15%' },
  { name: '서울 서초구', count: 143, trend: '+5%' },
  { name: '경기 수원시', count: 128, trend: '+10%' },
  { name: '인천 송도', count: 98, trend: '+20%' },
];

// 인기 검색어
const popularKeywords = ['강남', '분당', '잠실', '판교', '아파트', '상가', '오피스', '신입'];

// 통계 데이터
const stats = {
  totalJobs: 1234,
  newToday: 45,
  avgSalary: '280만',
  activeAgents: 5678,
  closingSoon: 23,
};

export default function AgentMainPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>('전체');
  const [selectedType, setSelectedType] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegionOpen, setIsRegionOpen] = useState(false);

  // 프리미엄 공고
  const premiumJobs = sampleJobs.filter((job) => job.tier === 'premium');
  // 급마감 공고 (D-3 이내)
  const urgentJobs = sampleJobs.filter((job) => {
    if (!job.deadline) return false;
    const today = new Date();
    const deadline = new Date(job.deadline);
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  });
  // 신규 공고
  const newJobs = sampleJobs.filter((job) => job.badges.includes('new'));
  // 최신 공고 (일반)
  const latestJobs = sampleJobs.slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header variant="agent" />

      {/* 히어로 섹션 */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-6 h-6 text-yellow-400" />
            <span className="text-blue-200 text-sm">부동산 전문가를 위한 #1 구인구직 플랫폼</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            공인중개사 구인구직
          </h1>
          <p className="text-blue-100 mb-8 text-lg">
            검증된 {stats.totalJobs.toLocaleString()}개의 채용 정보를 확인하세요
          </p>

          {/* 검색 영역 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-3">
              {/* 지역 선택 */}
              <div className="relative">
                <button
                  onClick={() => setIsRegionOpen(!isRegionOpen)}
                  className="w-full md:w-44 bg-white text-gray-700 px-4 py-3.5 rounded-xl flex items-center justify-between hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    {selectedRegion}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isRegionOpen ? 'rotate-180' : ''}`} />
                </button>
                {isRegionOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl z-20 max-h-60 overflow-y-auto border border-gray-100">
                    <button
                      onClick={() => { setSelectedRegion('전체'); setIsRegionOpen(false); }}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 text-gray-700 font-medium"
                    >
                      전체 지역
                    </button>
                    {REGIONS.map((region) => (
                      <button
                        key={region}
                        onClick={() => { setSelectedRegion(region); setIsRegionOpen(false); }}
                        className="w-full px-4 py-2.5 text-left hover:bg-blue-50 text-gray-700"
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 업무유형 선택 */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-white text-gray-700 px-4 py-3.5 rounded-xl md:w-44 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
              >
                <option value="전체">전체 유형</option>
                <option value="apartment">아파트</option>
                <option value="villa">빌라</option>
                <option value="store">상가</option>
                <option value="oneroom">원룸</option>
                <option value="office">오피스</option>
              </select>

              {/* 검색 입력 */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="회사명, 지역, 키워드로 검색"
                  className="w-full bg-white text-gray-700 placeholder-gray-400 pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
                />
              </div>

              <Link
                href={`/agent/jobs?region=${selectedRegion}&type=${selectedType}&q=${searchQuery}`}
                className="bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/30 text-center"
              >
                검색
              </Link>
            </div>

            {/* 인기 검색어 */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-blue-200 text-sm flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                인기검색어
              </span>
              {popularKeywords.map((keyword) => (
                <Link
                  key={keyword}
                  href={`/agent/jobs?q=${keyword}`}
                  className="text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors"
                >
                  #{keyword}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Briefcase className="w-4 h-4" />
              총 공고
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalJobs.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              오늘 등록
            </div>
            <p className="text-2xl font-bold text-blue-600">+{stats.newToday}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <CalendarClock className="w-4 h-4 text-red-500" />
              마감임박
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.closingSoon}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              평균 급여
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.avgSalary}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Users className="w-4 h-4" />
              활성 회원
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeAgents.toLocaleString()}</p>
          </div>
        </div>

        {/* 마감임박 공고 (급마감) */}
        {urgentJobs.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Flame className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">마감임박 공고</h2>
                  <p className="text-sm text-gray-500">3일 이내 마감되는 공고</p>
                </div>
              </div>
              <Link href="/agent/jobs?sort=deadline" className="text-blue-600 text-sm flex items-center gap-1 hover:underline font-medium">
                전체보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {urgentJobs.slice(0, 3).map((job) => (
                <AgentJobCard key={job.id} job={job} />
              ))}
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-10">
            {/* PREMIUM 공고 */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">PREMIUM 공고</h2>
                    <p className="text-sm text-gray-500">엄선된 프리미엄 채용정보</p>
                  </div>
                </div>
                <Link href="/agent/jobs?tier=premium" className="text-blue-600 text-sm flex items-center gap-1 hover:underline font-medium">
                  더보기 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {premiumJobs.slice(0, 4).map((job) => (
                  <AgentJobCard key={job.id} job={job} />
                ))}
              </div>
            </section>

            {/* 신규 공고 */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">신규 공고</h2>
                    <p className="text-sm text-gray-500">방금 등록된 새로운 채용정보</p>
                  </div>
                </div>
                <Link href="/agent/jobs?sort=latest" className="text-blue-600 text-sm flex items-center gap-1 hover:underline font-medium">
                  전체보기 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {newJobs.slice(0, 4).map((job) => (
                  <AgentJobCard key={job.id} job={job} />
                ))}
              </div>
            </section>

            {/* 최신 공고 */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">최신 공고</h2>
                    <p className="text-sm text-gray-500">모든 채용 공고</p>
                  </div>
                </div>
                <Link href="/agent/jobs" className="text-blue-600 text-sm flex items-center gap-1 hover:underline font-medium">
                  전체보기 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {latestJobs.map((job) => (
                  <AgentJobCard key={job.id} job={job} variant="list" />
                ))}
              </div>
            </section>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 빠른 지원 배너 */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5" />
                <h3 className="font-bold">맞춤 공고 알림</h3>
              </div>
              <p className="text-sm text-blue-100 mb-4">
                원하는 조건의 공고가 등록되면 바로 알려드려요
              </p>
              <Link
                href="/auth/signin"
                className="block text-center bg-white text-blue-600 font-semibold py-3 rounded-xl hover:bg-blue-50 transition-colors"
              >
                알림 설정하기
              </Link>
            </div>

            {/* 인기 지역 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">인기 지역</h3>
              </div>
              <div className="space-y-2">
                {popularRegions.map((region, index) => (
                  <Link
                    key={region.name}
                    href={`/agent/jobs?region=${region.name}`}
                    className="flex items-center justify-between py-2.5 hover:bg-gray-50 rounded-lg px-3 -mx-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < 3 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-gray-700 group-hover:text-blue-600 transition-colors">{region.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{region.count}건</span>
                      <span className="text-xs text-emerald-600 font-medium">{region.trend}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 프로필 등록 배너 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-dashed border-gray-200">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">이력서 등록하기</h3>
                <p className="text-sm text-gray-500 mb-4">
                  이력서를 등록하면 기업에서 먼저 연락해요
                </p>
                <Link
                  href="/auth/signin"
                  className="block text-center bg-blue-600 text-white font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  무료 등록하기
                </Link>
              </div>
            </div>

            {/* 채용 팁 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">채용 TIP</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700 font-medium mb-1">면접 준비 체크리스트</p>
                  <p className="text-xs text-gray-500">중개사무소 면접 시 필수 준비사항</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700 font-medium mb-1">연봉 협상 가이드</p>
                  <p className="text-xs text-gray-500">공인중개사 적정 연봉 계산법</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700 font-medium mb-1">좋은 사무소 고르는 법</p>
                  <p className="text-xs text-gray-500">근무환경 체크 포인트 5가지</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileNav variant="agent" />
    </div>
  );
}
