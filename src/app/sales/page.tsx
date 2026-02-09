'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, ChevronDown, ChevronLeft, ChevronRight, Star,
  MapPin, Home, Map, Heart, Megaphone, PenSquare,
  ArrowUp, Loader2, Eye, Building2
} from 'lucide-react';
import JobCard from '@/components/sales/JobCard';
import VipSlider from '@/components/sales/VipSlider';
import MobileStatsBar from '@/components/sales/MobileStatsBar';
import PremiumGrid from '@/components/sales/PremiumGrid';
import MobileNav from '@/components/shared/MobileNav';
import type { SalesJobListing } from '@/types';
import { REGIONS } from '@/types';
import { fetchJobs } from '@/lib/supabase';

const TYPE_LABELS: Record<string, string> = {
  apartment: '아파트', officetel: '오피스텔', store: '상가', industrial: '지산',
};
const POSITION_LABELS: Record<string, string> = {
  headTeam: '본부/팀장', teamLead: '팀장/팀원', member: '팀원',
};
const SALARY_LABELS: Record<string, string> = {
  commission: '계약 수수료', base_incentive: '기본급+인센', daily: '일급',
};
const BADGE_LABELS: Record<string, string> = {
  new: '신규', hot: 'HOT', jackpot: '대박', popular: '인기',
};

// 더 많은 임시 구인 데이터
const sampleJobs: SalesJobListing[] = [
  {
    id: '1',
    title: '엘리프 검단 포레듀 - 첫 조직투입',
    description: '인천권 신규분상제 최대 수수료/ 주단위 지급',
    type: 'apartment',
    tier: 'unique',
    badges: ['new', 'popular'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: [],
    experience: 'none',
    company: '엠비엔',
    companyType: 'agency',
    region: '인천',
    views: 3241,
    createdAt: '2026.01.17',
  },
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
    companyType: 'agency',
    region: '경기',
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
    companyType: 'builder',
    region: '경기',
    views: 1823,
    createdAt: '2026.01.16',
  },
  {
    id: '4',
    title: '힐스테이트 지금이 타이밍입니다',
    description: '조건변경 수수료인상',
    type: 'apartment',
    tier: 'unique',
    badges: [],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['일비'],
    experience: 'none',
    company: '미드미',
    companyType: 'agency',
    region: '경기',
    views: 4521,
    createdAt: '2026.01.15',
  },
  {
    id: '5',
    title: '아산 탕정 동일하이빌 파크레인',
    description: '계약 터지는 현장',
    type: 'apartment',
    tier: 'unique',
    badges: ['hot', 'jackpot'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['숙소비', '일비'],
    experience: 'none',
    company: '해솔I&D플러스',
    companyType: 'developer',
    region: '충남',
    views: 3892,
    createdAt: '2026.01.15',
  },
  {
    id: '6',
    title: '본부장 모집! 계약당일 수수료 지급!',
    description: '1차계약금0원! 경남 부동산까지 들썩들썩!',
    type: 'apartment',
    tier: 'superior',
    badges: [],
    position: 'headTeam',
    salary: { type: 'commission' },
    benefits: ['숙소비', '일비'],
    experience: '12month',
    company: '(주)한율디앤씨',
    companyType: 'agency',
    region: '경남',
    views: 2341,
    createdAt: '2026.01.17',
  },
  {
    id: '7',
    title: '수원 당수지구 최초 신규투입',
    description: '수원유일 비규제지역/거주의무없음/분상제',
    type: 'apartment',
    tier: 'superior',
    badges: [],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: [],
    experience: 'none',
    company: 'SCM Global',
    companyType: 'agency',
    region: '경기',
    views: 1987,
    createdAt: '2026.01.16',
  },
  {
    id: '8',
    title: '모집공고 확정 계약금 0원 현장',
    description: '대박수수료,진짜0원계약,신규세미조직억대광고',
    type: 'apartment',
    tier: 'superior',
    badges: ['jackpot'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['숙소비', '일비'],
    experience: 'none',
    company: '지인',
    companyType: 'agency',
    region: '경기',
    views: 2876,
    createdAt: '2026.01.15',
  },
  {
    id: '9',
    title: '2호선구의역 서울3룸오픈현장!',
    description: '서울OPEN현장 소수팀으로 운영 / 계약계속나오고있음!!',
    type: 'officetel',
    tier: 'superior',
    badges: [],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['일비'],
    experience: '1month',
    company: '(주)에이엠',
    companyType: 'builder',
    region: '서울',
    views: 1654,
    createdAt: '2026.01.14',
  },
  {
    id: '10',
    title: '팀원수수료 1000만원 구미 봉곡동 힐스테이트',
    description: '수수료 대폭인상 구미 단일현장 구미 입주물량제로',
    type: 'apartment',
    tier: 'premium',
    badges: [],
    position: 'member',
    salary: { type: 'commission' },
    benefits: [],
    experience: 'none',
    company: '(주)유니풀마켓',
    companyType: 'agency',
    region: '경북',
    views: 1234,
    createdAt: '2026.01.17',
  },
  {
    id: '11',
    title: '씨티오씨엘8단지',
    description: '광고비 50%지원!! 주말 내방 80팀 컨디션 최상!!',
    type: 'apartment',
    tier: 'premium',
    badges: [],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: [],
    experience: '1month',
    company: '주식회사 마켓리더',
    companyType: 'trust',
    region: '세종',
    views: 987,
    createdAt: '2026.01.16',
  },
  {
    id: '12',
    title: '호매실 스카이시티 l 0원계약 조건변경',
    description: '수수료 3천만원 l 잔금유예 20% 2년 l 신분당선 호매실역',
    type: 'officetel',
    tier: 'premium',
    badges: [],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: [],
    experience: 'none',
    company: '린온리',
    companyType: 'agency',
    region: '경기',
    views: 876,
    createdAt: '2026.01.15',
  },
  {
    id: '13',
    title: '김포 지식산업센터 분양상담사',
    description: '김포 골드라인 역세권 지산 분양',
    type: 'industrial',
    tier: 'normal',
    badges: [],
    position: 'member',
    salary: { type: 'daily', amount: '15만' },
    benefits: ['교통비'],
    experience: 'none',
    company: '김포지산(주)',
    companyType: 'developer',
    region: '경기',
    views: 892,
    createdAt: '2026.01.15',
  },
  {
    id: '14',
    title: '부산 해운대 오션뷰 오피스텔',
    description: '해운대 프리미엄 오피스텔 분양',
    type: 'officetel',
    tier: 'normal',
    badges: ['new'],
    position: 'member',
    salary: { type: 'base_incentive', amount: '200+인센' },
    benefits: ['숙소제공'],
    experience: '3month',
    company: '부산분양(주)',
    companyType: 'agency',
    region: '부산',
    views: 567,
    createdAt: '2026.01.14',
  },
  {
    id: '15',
    title: '대전 둔산동 상가 분양',
    description: '대전 핫플 둔산동 상업시설 분양',
    type: 'store',
    tier: 'premium',
    badges: [],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: [],
    experience: '6month',
    company: '대전상가(주)',
    companyType: 'trust',
    region: '대전',
    views: 432,
    createdAt: '2026.01.13',
  },
];

// VIP 슬라이더 데이터 (상위 유료 광고)
const vipJobs: SalesJobListing[] = [
  {
    id: 'vip1',
    title: '서수원 에피트 센트럴 마크 ~ 당수지구 첫 조직투입!',
    description: '오픈현장 본부장이 직접 광고 쏘고 지원하고 스타트합니다 - 수원 유일 비규제지역/거주의무없음',
    type: 'apartment',
    tier: 'unique',
    badges: ['new', 'hot'],
    position: 'headTeam',
    salary: { type: 'commission' },
    benefits: ['숙소비', '일비'],
    experience: 'none',
    company: 'SCM Global',
    companyType: 'agency',
    region: '경기',
    views: 5823,
    createdAt: '2026.01.17',
    thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
  },
  {
    id: 'vip2',
    title: '아산 탕정 동일하이빌 파크레인 - 계약 폭발!',
    description: '대박 수수료 + 숙소비 + 일비 올인원 지원! 경험 상관없이 누구나 환영',
    type: 'apartment',
    tier: 'unique',
    badges: ['jackpot', 'popular'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['숙소비', '일비', '교통비'],
    experience: 'none',
    company: '해솔I&D플러스',
    companyType: 'developer',
    region: '충남',
    views: 4521,
    createdAt: '2026.01.17',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
  },
  {
    id: 'vip3',
    title: '김포 일반분양 신규 APT - 중소형 평형대 구성 한방!',
    description: '김포 골드라인 역세권 프리미엄 아파트 분양! 첫 조직투입 기회',
    type: 'apartment',
    tier: 'unique',
    badges: ['new'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['숙소제공'],
    experience: 'none',
    company: '(주)한율디앤씨',
    companyType: 'agency',
    region: '경기',
    views: 3892,
    createdAt: '2026.01.16',
    thumbnail: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&h=600&fit=crop',
  },
];

// AD 롤링 데이터
const adItems = [
  { id: '1', title: '서수원 에피트 센트럴 마크 ~ 당수지구 첫 조직투입 스타트', desc: '오픈현장 본부장이 직접 광고 쏘고 지원하고 스타트 합니다~~~' },
  { id: '2', title: '김포 일반분양 신규 APT', desc: '중소형 평형대 구성 한방 현장' },
  { id: '3', title: '새만금을 품은 아파트! 건별 시상 150만원!', desc: '대행사의 파격적인 영업직원복지!! 모든게 다있는 현장입니다~!' },
  { id: '4', title: '천안 벽산블루밍 파크포레(본부,팀,팀원 모집)', desc: '계약이 쭉쭉 터지는 현장입니다.' },
  { id: '5', title: '힐스테이트 지금이 타이밍입니다', desc: '조건변경 수수료인상' },
];


export default function SalesMainPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>('지역');
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [dbJobs, setDbJobs] = useState<SalesJobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // DB에서 공고 불러오기
  useEffect(() => {
    async function loadJobs() {
      setIsLoading(true);
      try {
        const jobs = await fetchJobs('sales');
        setDbJobs(jobs);
      } catch (error) {
        console.error('Failed to load jobs:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadJobs();
  }, []);

  // DB 데이터 + 샘플 데이터 합치기 (DB 데이터 우선)
  const allJobs = [...dbJobs, ...sampleJobs];

  // 통계
  const stats = {
    todayUsers: 100,
    totalUsers: 277637,
    todayVisitors: 4879,
    todayNewJobs: 212,
    totalJobs: 310068,
  };

  // 검색어 필터링
  const filteredJobs = allJobs.filter((job) => {
    if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !job.company.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !job.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // 티어별 데이터
  const uniqueJobs = filteredJobs.filter((job) => job.tier === 'unique');
  const superiorJobs = filteredJobs.filter((job) => job.tier === 'superior');
  const premiumJobs = filteredJobs.filter((job) => job.tier === 'premium');
  const normalJobs = filteredJobs.filter((job) => job.tier === 'normal');

  // AD 롤링 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % adItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // 통계 슬라이더 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStatIndex((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* 상단 통계 슬라이더 (PC만) */}
      <div className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStatIndex((prev) => (prev - 1 + 3) % 3)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => setCurrentStatIndex((prev) => (prev + 1) % 3)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <div
                className="flex transition-transform duration-500"
                style={{ transform: `translateX(-${currentStatIndex * 100}%)` }}
              >
                {/* 사용자수 */}
                <div className="min-w-full flex items-center justify-center gap-6 text-sm">
                  <span className="text-purple-600 font-medium">사용자수</span>
                  <span className="text-gray-500">오늘 <span className="text-gray-900 font-medium">{stats.todayUsers}명</span></span>
                  <span className="text-gray-500">전체 <span className="text-gray-900 font-medium">{stats.totalUsers.toLocaleString()}명</span></span>
                </div>
                {/* 방문회원 */}
                <div className="min-w-full flex items-center justify-center gap-6 text-sm">
                  <span className="text-purple-600 font-medium">방문회원</span>
                  <span className="text-gray-500">오늘방문 <span className="text-gray-900 font-medium">{stats.todayVisitors.toLocaleString()}명</span></span>
                </div>
                {/* 신규현장 */}
                <div className="min-w-full flex items-center justify-center gap-6 text-sm">
                  <span className="text-purple-600 font-medium">신규현장</span>
                  <span className="text-gray-500">오늘신규 <span className="text-gray-900 font-medium">{stats.todayNewJobs}건</span></span>
                </div>
              </div>
            </div>

            {/* 상단 메뉴 */}
            <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
              <Link href="/" className="hover:text-purple-600">홈</Link>
              <Link href="/sales/auth/login" className="hover:text-purple-600">로그인</Link>
              <Link href="/sales/auth/login" className="hover:text-purple-600">회원가입</Link>
              <Link href="#" className="hover:text-purple-600">공지사항</Link>
              <Link href="/sales/premium" className="hover:text-purple-600">상품안내</Link>
            </div>
          </div>
        </div>
      </div>

      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-2 md:py-3">
          <div className="flex items-center gap-2 md:gap-4">
            {/* 로고 */}
            <Link href="/sales" className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm md:text-lg">B</span>
              </div>
              <div className="hidden md:block">
                <span className="text-lg font-bold text-gray-900">부동산<span className="text-purple-600">인</span></span>
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full ml-2">분양상담사</span>
              </div>
            </Link>

            {/* 검색 영역 */}
            <div className="flex-1 flex items-center gap-1 md:gap-2 max-w-2xl">
              {/* 지역 선택 */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsRegionOpen(!isRegionOpen)}
                  className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:border-purple-500 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{selectedRegion}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isRegionOpen ? 'rotate-180' : ''}`} />
                </button>
                {isRegionOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-48 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedRegion('지역'); setIsRegionOpen(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700"
                    >
                      전체
                    </button>
                    {REGIONS.map((region) => (
                      <button
                        key={region}
                        onClick={() => { setSelectedRegion(region); setIsRegionOpen(false); }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700"
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 검색 입력 */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="검색어를 입력하세요"
                  className="w-full border border-gray-300 rounded-lg pl-3 md:pl-4 pr-10 py-1.5 md:py-2 text-sm focus:outline-none focus:border-purple-500"
                />
                <button className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 p-1 md:p-1.5 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">
                  <Search className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* AD 롤링 */}
            <div className="hidden lg:block flex-1 overflow-hidden">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-medium">AD</span>
                <span className="text-gray-700 truncate">{adItems[currentAdIndex].title}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 네비게이션 (PC만) */}
        <div className="hidden md:block bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center gap-6 py-2 text-sm font-medium">
              <Link href="/sales" className="text-purple-600 flex items-center gap-1">
                <Home className="w-4 h-4" />
                HOME
              </Link>
              <Link href="/sales/jobs" className="text-gray-600 hover:text-purple-600 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                지역현장
              </Link>
              <Link href="#" className="text-gray-600 hover:text-purple-600 flex items-center gap-1">
                <Heart className="w-4 h-4" />
                맞춤현장
              </Link>
              <Link href="#" className="text-gray-600 hover:text-purple-600 flex items-center gap-1">
                <Map className="w-4 h-4" />
                지도현장
              </Link>
              <Link href="#" className="text-gray-600 hover:text-purple-600 flex items-center gap-1">
                <Heart className="w-4 h-4" />
                관심현장
              </Link>
              <Link href="#" className="text-gray-600 hover:text-purple-600 flex items-center gap-1">
                <Megaphone className="w-4 h-4" />
                서포터즈
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* 모바일 통계 바 */}
      <MobileStatsBar
        todayNewJobs={stats.todayNewJobs}
        todayVisitors={stats.todayVisitors}
        totalJobs={stats.totalJobs}
      />

      {/* VIP 슬라이더 (모바일/PC 공통) */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <VipSlider jobs={vipJobs} />
      </div>


      <main className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        <div>
          {/* 메인 콘텐츠 */}
          <div>
            {/* 로딩 표시 */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                <span className="ml-2 text-gray-600">공고를 불러오는 중...</span>
              </div>
            )}

            {/* 유니크 광고 배너 (섹션 상단) */}
            {!isLoading && uniqueJobs.length > 0 && (
              <div className="mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-3 md:p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] md:text-xs bg-white/20 px-2 py-0.5 rounded">유니크</span>
                    <p className="mt-1 md:mt-2 text-xs md:text-sm">슬라이드 광고 최고의 위치</p>
                    <p className="font-bold text-sm md:text-base">노출효과</p>
                  </div>
                  <Link href="/sales/premium" className="bg-white text-purple-600 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-purple-50 transition-colors whitespace-nowrap">
                    상품안내
                  </Link>
                </div>
              </div>
            )}

            {/* 유니크 섹션 */}
            {!isLoading && uniqueJobs.length > 0 && (
              <section className="mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-600 text-white text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded">유니크</span>
                    <span className="text-xs text-gray-500">({uniqueJobs.length})</span>
                  </div>
                  <Link href="/sales/jobs?tier=unique" className="text-gray-500 text-xs md:text-sm flex items-center gap-1 hover:text-purple-600">
                    + 전체보기
                  </Link>
                </div>
                {/* 모바일: 2열 그리드 / PC: 2열 카드 그리드 (분양라인 스타일) */}
                <div className="md:hidden">
                  <PremiumGrid jobs={uniqueJobs} tier="unique" />
                </div>
                <div className="hidden md:grid md:grid-cols-4 gap-3">
                  {uniqueJobs.map((job) => (
                    <JobCard key={job.id} job={job} variant="compact" />
                  ))}
                  {uniqueJobs.length % 4 !== 0 && Array.from({ length: 4 - (uniqueJobs.length % 4) }).map((_, i) => (
                    <Link key={`unique-empty-${i}`} href="/sales/premium" className="group">
                      <div className="bg-gradient-to-br from-purple-50/50 to-blue-50/50 rounded-lg border-2 border-dashed border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all overflow-hidden flex flex-col items-center justify-center min-h-[200px] cursor-pointer h-full">
                        <div className="w-14 h-14 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors flex items-center justify-center mb-3">
                          <Star className="w-7 h-7 text-purple-300 group-hover:text-purple-500 transition-colors" />
                        </div>
                        <p className="text-sm font-bold text-purple-500 group-hover:text-purple-600 mb-1">유니크 광고</p>
                        <p className="text-xs text-purple-400">이 자리에 공고를 노출하세요</p>
                        <p className="text-[10px] text-purple-300 mt-1">클릭하여 자세히 보기 →</p>
                      </div>
                    </Link>
                  ))}
                </div>
                {/* 광고대행사 전문 노출 상품안내 배너 */}
                <div className="mt-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg p-3 md:p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] md:text-xs bg-white/20 px-2 py-0.5 rounded">광고대행사</span>
                      <p className="mt-1 md:mt-2 text-xs md:text-sm">분양상담사에게 직접 광고하세요!</p>
                      <p className="font-bold text-sm md:text-base">LMS · 유튜브 · SNS 마케팅 전문 노출</p>
                    </div>
                    <Link href="/sales/premium" className="bg-white text-orange-600 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-orange-50 transition-colors whitespace-nowrap">
                      상품안내
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* 광고대행사 전문 노출 */}
            <section className="mb-6 md:mb-8">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div>
                  <h2 className="font-bold text-gray-900 text-sm md:text-base flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-orange-500" />
                    광고대행사 전문 노출
                  </h2>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 hidden md:block">
                    분양상담사에게 직접 광고하세요! LMS · 유튜브 · SNS 마케팅 전문 업체
                  </p>
                </div>
                <Link href="#" className="text-gray-500 text-xs md:text-sm flex items-center gap-1 hover:text-orange-600">
                  + 전체보기
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* 예시 광고대행사 4개 */}
                {[
                  { id: 'ad1', name: '분양마케팅PRO', desc: 'LMS 대량발송 · 분양DB 타겟팅', tag: 'LMS', color: 'bg-blue-500', icon: '📱' },
                  { id: 'ad2', name: '부동산유튜브랩', desc: '유튜브 숏폼 · 현장 홍보영상 제작', tag: 'YouTube', color: 'bg-red-500', icon: '🎬' },
                  { id: 'ad3', name: '분양SNS파트너', desc: '인스타 · 블로그 · 카페 바이럴', tag: 'SNS', color: 'bg-pink-500', icon: '📢' },
                  { id: 'ad4', name: '현장광고다이렉트', desc: '현수막 · 전단지 · 현장 브랜딩', tag: '오프라인', color: 'bg-green-500', icon: '🏢' },
                ].map((ad) => (
                  <Link key={ad.id} href="#" className="group">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-orange-300 transition-all h-full">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded text-white font-medium ${ad.color}`}>{ad.tag}</span>
                        <span className="text-lg">{ad.icon}</span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">{ad.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2">{ad.desc}</p>
                      <div className="mt-3 text-xs text-orange-500 font-medium">광고 문의 →</div>
                    </div>
                  </Link>
                ))}
                {/* 빈칸 4개 */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <Link key={`ad-empty-${i}`} href="/sales/premium" className="group">
                    <div className="bg-gradient-to-br from-orange-50/50 to-yellow-50/50 rounded-lg border-2 border-dashed border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all overflow-hidden flex flex-col items-center justify-center min-h-[140px] cursor-pointer h-full">
                      <div className="w-12 h-12 rounded-full bg-orange-100 group-hover:bg-orange-200 transition-colors flex items-center justify-center mb-2">
                        <Megaphone className="w-6 h-6 text-orange-300 group-hover:text-orange-500 transition-colors" />
                      </div>
                      <p className="text-sm font-bold text-orange-500 group-hover:text-orange-600 mb-1">광고대행사 노출</p>
                      <p className="text-xs text-orange-400">이 자리에 광고를 노출하세요</p>
                      <p className="text-[10px] text-orange-300 mt-1">클릭하여 자세히 보기 →</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* 슈페리어 광고 배너 (섹션 상단) */}
            {superiorJobs.length > 0 && (
              <div className="mb-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg p-3 md:p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] md:text-xs bg-white/20 px-2 py-0.5 rounded">슈페리어</span>
                    <p className="mt-1 md:mt-2 text-xs md:text-sm">효율적인 분양현장 구인 광고</p>
                    <p className="font-bold text-sm md:text-base">썸네일과 함께 눈에 띄는 노출!</p>
                  </div>
                  <Link href="/sales/premium" className="bg-white text-blue-600 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-blue-50 transition-colors whitespace-nowrap">
                    상품안내
                  </Link>
                </div>
              </div>
            )}

            {/* 슈페리어 섹션 */}
            {superiorJobs.length > 0 && (
              <section className="mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded">슈페리어</span>
                    <span className="text-xs text-gray-500">({superiorJobs.length})</span>
                  </div>
                  <Link href="/sales/jobs?tier=superior" className="text-gray-500 text-xs md:text-sm flex items-center gap-1 hover:text-blue-600">
                    + 전체보기
                  </Link>
                </div>
                {/* 모바일: 2열 그리드 / PC: 2열 카드 그리드 (분양라인 스타일) */}
                <div className="md:hidden">
                  <PremiumGrid jobs={superiorJobs} tier="superior" />
                </div>
                <div className="hidden md:grid md:grid-cols-5 gap-3">
                  {superiorJobs.map((job) => (
                    <JobCard key={job.id} job={job} variant="compact" />
                  ))}
                  {/* 5x3=15칸 채우기 */}
                  {Array.from({ length: Math.max(0, 15 - superiorJobs.length) }).map((_, i) => (
                    <Link key={`superior-empty-${i}`} href="/sales/premium" className="group">
                      <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 rounded-lg border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all overflow-hidden flex flex-col items-center justify-center min-h-[180px] cursor-pointer h-full">
                        <div className="w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors flex items-center justify-center mb-2">
                          <Star className="w-6 h-6 text-blue-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <p className="text-xs font-bold text-blue-500 group-hover:text-blue-600 mb-1">슈페리어 광고</p>
                        <p className="text-[10px] text-blue-400">이 자리에 공고를 노출하세요</p>
                        <p className="text-[10px] text-blue-300 mt-1">클릭하여 자세히 보기 →</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 프리미엄 광고 배너 (섹션 상단) */}
            {premiumJobs.length > 0 && (
              <div className="mb-4 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg p-3 md:p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] md:text-xs bg-white/20 px-2 py-0.5 rounded">프리미엄</span>
                    <p className="mt-1 md:mt-2 text-xs md:text-sm">합리적인 가격으로 시작하는</p>
                    <p className="font-bold text-sm md:text-base">스마트한 구인 광고!</p>
                  </div>
                  <Link href="/sales/premium" className="bg-white text-cyan-600 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-cyan-50 transition-colors whitespace-nowrap">
                    상품안내
                  </Link>
                </div>
              </div>
            )}

            {/* 프리미엄 섹션 - 텍스트 기반 (썸네일 없음) */}
            {premiumJobs.length > 0 && (
              <section className="mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-cyan-500 text-white text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded">프리미엄</span>
                    <span className="text-xs text-gray-500">({premiumJobs.length})</span>
                  </div>
                  <Link href="/sales/jobs?tier=premium" className="text-gray-500 text-xs md:text-sm flex items-center gap-1 hover:text-cyan-600">
                    + 전체보기
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {premiumJobs.map((job) => (
                    <Link key={job.id} href={`/sales/jobs/${job.id}`}>
                      <div className="bg-white rounded-lg border border-gray-200 border-l-4 border-l-cyan-500 hover:shadow-md hover:border-cyan-300 transition-all p-4 group h-full flex flex-col">
                        {/* 상단: 회사 로고 + 기본정보 */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center flex-shrink-0 border border-cyan-200">
                            <span className="text-cyan-700 font-bold text-sm">{job.company.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-600 font-medium">{TYPE_LABELS[job.type] || job.type}</span>
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                {job.region}
                              </span>
                              {job.badges.length > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white font-bold">
                                  {BADGE_LABELS[job.badges[0]] || job.badges[0]}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400 truncate block">{job.company}</span>
                          </div>
                        </div>
                        {/* 제목 + 설명 */}
                        <h4 className="font-bold text-[13px] text-gray-900 line-clamp-2 group-hover:text-cyan-600 transition-colors leading-snug mb-1">
                          {job.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-1 mb-auto">{job.description}</p>
                        {/* 하단: 조건 + 조회수 */}
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-50 text-cyan-700 font-medium">{POSITION_LABELS[job.position] || job.position}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600">{SALARY_LABELS[job.salary.type] || job.salary.type}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-[10px] text-gray-400">
                            <Eye className="w-3 h-3" />
                            {job.views.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {/* 빈 슬롯 채우기 */}
                  {premiumJobs.length % 3 !== 0 && Array.from({ length: 3 - (premiumJobs.length % 3) }).map((_, i) => (
                    <Link key={`premium-empty-${i}`} href="/sales/premium" className="group">
                      <div className="bg-gradient-to-br from-cyan-50/30 to-teal-50/30 rounded-lg border-2 border-dashed border-cyan-200 hover:border-cyan-400 hover:bg-cyan-50/50 transition-all p-4 flex flex-col items-center justify-center min-h-[140px] cursor-pointer h-full">
                        <Star className="w-6 h-6 text-cyan-300 group-hover:text-cyan-500 transition-colors mb-2" />
                        <p className="text-xs font-bold text-cyan-500 group-hover:text-cyan-600">프리미엄 광고</p>
                        <p className="text-[10px] text-cyan-400 mt-0.5">이 자리에 공고를 노출하세요</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 일반 섹션 - 상가114 스타일 테이블 */}
            {normalJobs.length > 0 && (
              <section className="mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-400 text-white text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded">일반</span>
                    <span className="text-xs text-gray-500">({normalJobs.length})</span>
                  </div>
                  <Link href="/sales/jobs?tier=normal" className="text-gray-500 text-xs md:text-sm flex items-center gap-1 hover:text-gray-600">
                    + 전체보기
                  </Link>
                </div>

                {/* PC: 테이블 형태 (상가114 스타일) */}
                <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 w-[35%]">현장명</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 w-[20%]">소재지</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 w-[25%]">업무내용</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 w-[12%]">응시요건</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 w-[8%]">등록일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {normalJobs.map((job, index) => (
                        <tr key={job.id} className={`hover:bg-gray-50 transition-colors group ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                          <td className="px-4 py-3">
                            <Link href={`/sales/jobs/${job.id}`} className="text-sm text-gray-800 hover:text-purple-600 font-medium transition-colors line-clamp-1">
                              {job.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {job.region} · {job.company}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 line-clamp-1">
                            {POSITION_LABELS[job.position] || job.position} · {SALARY_LABELS[job.salary.type] || job.salary.type}{job.salary.amount ? ` ${job.salary.amount}` : ''}{job.benefits.length > 0 ? ` · ${job.benefits.join(' ')}` : ''}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {TYPE_LABELS[job.type] || job.type} · {job.experience === 'none' ? '경력무관' : job.experience === '1month' ? '1개월이상' : job.experience === '3month' ? '3개월이상' : job.experience === '6month' ? '6개월이상' : job.experience === '12month' ? '1년이상' : job.experience}
                          </td>
                          <td className="px-4 py-3 text-[11px] text-gray-400 text-center whitespace-nowrap">
                            {job.createdAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 모바일: 카드형 리스트 */}
                <div className="md:hidden space-y-2">
                  {normalJobs.map((job) => (
                    <Link key={job.id} href={`/sales/jobs/${job.id}`}>
                      <div className="bg-white rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{TYPE_LABELS[job.type] || job.type}</span>
                          <span className="text-[10px] text-gray-400">{job.region}</span>
                          <span className="text-[10px] text-gray-300 ml-auto">{job.createdAt}</span>
                        </div>
                        <h4 className="text-sm text-gray-800 font-medium truncate">{job.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{POSITION_LABELS[job.position] || job.position} · {SALARY_LABELS[job.salary.type] || job.salary.type}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* 업그레이드 유도 */}
                <div className="mt-3 text-center">
                  <Link href="/sales/premium" className="text-xs text-gray-400 hover:text-cyan-600 transition-colors">
                    더 많은 노출이 필요하신가요? <span className="text-cyan-500 font-medium">프리미엄으로 업그레이드 →</span>
                  </Link>
                </div>
              </section>
            )}

            {/* 검색 결과 없음 */}
            {!isLoading && filteredJobs.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">검색 결과가 없습니다</h3>
                <p className="text-gray-500 text-sm">
                  검색어를 수정해 보세요.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
            <Link href="#" className="hover:text-purple-600">회사소개</Link>
            <Link href="#" className="hover:text-purple-600">공지사항</Link>
            <Link href="#" className="hover:text-purple-600">개인정보 처리방침</Link>
            <Link href="#" className="hover:text-purple-600">이용약관</Link>
            <Link href="#" className="hover:text-purple-600">게시물 운영규칙</Link>
            <Link href="#" className="hover:text-purple-600">광고&제휴문의</Link>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>회사명 : (주)부동산인ㅣ대표 : 홍길동ㅣ주소 : 서울시 강남구 테헤란로 123ㅣ대표번호 : 1660-0464</p>
            <p>사업자등록번호 : 123-45-67890ㅣ통신판매업 신고번호 : 제2024-서울강남-1234호</p>
            <p className="mt-2">© (주)부동산인 All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* 플로팅 버튼 */}
      <div className="fixed right-4 bottom-24 md:bottom-8 flex flex-col gap-2 z-50">
        <Link
          href="/sales/jobs/new"
          className="flex items-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors hover:shadow-xl"
        >
          <PenSquare className="w-5 h-5" />
          <span className="font-medium text-sm whitespace-nowrap">공고글 쓰기</span>
        </Link>
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="w-12 h-12 bg-white text-gray-700 rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>

      <MobileNav variant="sales" />

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
