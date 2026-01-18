'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, ChevronDown, ChevronLeft, ChevronRight, ArrowRight,
  Users, Eye, MapPin, Home, Map, Heart, Megaphone, PenSquare,
  ArrowUp, ExternalLink, Phone, Calendar
} from 'lucide-react';
import JobCard from '@/components/sales/JobCard';
import JobFilter from '@/components/sales/JobFilter';
import VipSlider from '@/components/sales/VipSlider';
import MobileStatsBar from '@/components/sales/MobileStatsBar';
import PremiumGrid from '@/components/sales/PremiumGrid';
import MobileNav from '@/components/shared/MobileNav';
import type { SalesJobListing, SalesJobFilter } from '@/types';
import { REGIONS } from '@/types';

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

// 뉴스 데이터
const newsItems = [
  { id: '1', title: '갈월동 52-6 일원, 40층·885세대 주거단지 들어선다', date: '2026.01.14', url: '#' },
  { id: '2', title: '강남 재건축 \'평당 1억\' 첫 돌파…서울 집값 상승 이끌었다', date: '2026.01.14', url: '#' },
  { id: '3', title: '"대단지 아파트 원한다면 1분기 노려라"…2만 가구 쏟아진다', date: '2026.01.13', url: '#' },
  { id: '4', title: '서울, 허가받은 \'토지거래\' 증가 추세... "위축 심리 일부 회복"', date: '2026.01.12', url: '#' },
];

// 공지사항 데이터
const notices = [
  { id: '1', title: '외부 호스팅 서비스 장애로 인한 일시적 이용 제한 안내', date: '01.14' },
  { id: '2', title: '온시아 JOB 3.1 업데이트', date: '12.23' },
  { id: '3', title: '연말연시 고객센터 휴무 안내', date: '12.20' },
];

// 이벤트 데이터
const events = [
  { id: '1', title: '[온시아 JOB 업데이트] 행운 복권 이벤트', date: '01.07' },
  { id: '2', title: '온시아 JOB 출시 기념 룰렛 이벤트!!', date: '05.14' },
];

// 초기 필터 상태
const initialFilters: SalesJobFilter = {
  regions: [],
  types: [],
  salaryTypes: [],
  positions: [],
  experiences: [],
  companyTypes: [],
  tiers: [],
};

export default function SalesMainPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>('지역');
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [filters, setFilters] = useState<SalesJobFilter>(initialFilters);

  // 통계
  const stats = {
    todayUsers: 100,
    totalUsers: 277637,
    todayVisitors: 4879,
    todayNewJobs: 212,
    totalJobs: 310068,
  };

  // 필터 적용 함수
  const applyFilters = (jobs: SalesJobListing[]) => {
    return jobs.filter((job) => {
      // 지역 필터
      if (filters.regions.length > 0 && !filters.regions.includes(job.region)) {
        return false;
      }
      // 현장유형 필터
      if (filters.types.length > 0 && !filters.types.includes(job.type)) {
        return false;
      }
      // 급여형태 필터
      if (filters.salaryTypes.length > 0 && !filters.salaryTypes.includes(job.salary.type)) {
        return false;
      }
      // 직급 필터
      if (filters.positions.length > 0 && !filters.positions.includes(job.position)) {
        return false;
      }
      // 경력 필터
      if (filters.experiences.length > 0 && !filters.experiences.includes(job.experience)) {
        return false;
      }
      // 업체유형 필터
      if (filters.companyTypes.length > 0 && job.companyType && !filters.companyTypes.includes(job.companyType)) {
        return false;
      }
      // 티어 필터
      if (filters.tiers.length > 0 && !filters.tiers.includes(job.tier)) {
        return false;
      }
      // 검색어 필터
      if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !job.company.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !job.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  };

  // 필터링된 전체 데이터
  const filteredJobs = applyFilters(sampleJobs);

  // 필터링된 데이터 (티어별)
  const uniqueJobs = filteredJobs.filter((job) => job.tier === 'unique');
  const superiorJobs = filteredJobs.filter((job) => job.tier === 'superior');
  const premiumJobs = filteredJobs.filter((job) => job.tier === 'premium');
  const normalJobs = filteredJobs.filter((job) => job.tier === 'normal');
  const bestJobs = filteredJobs.filter((job) => job.views > 2000).slice(0, 3);

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
              <Link href="/auth/signin" className="hover:text-purple-600">로그인</Link>
              <Link href="/auth/signup" className="hover:text-purple-600">회원가입</Link>
              <Link href="#" className="hover:text-purple-600">이벤트</Link>
              <Link href="#" className="hover:text-purple-600">공지사항</Link>
              <Link href="#" className="hover:text-purple-600">고객센터</Link>
              <Link href="#" className="hover:text-purple-600">상품안내</Link>
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
                <span className="text-white font-bold text-sm md:text-lg">JOB</span>
              </div>
              <div className="hidden md:block">
                <span className="text-lg font-bold text-gray-900">온시아</span>
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

      {/* AD 롤링 배너 (PC) */}
      <div className="hidden md:block bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar">
            {adItems.map((ad) => (
              <div
                key={ad.id}
                className="flex-shrink-0 flex items-center gap-2 bg-white rounded-lg px-4 py-2 border border-gray-200 hover:border-purple-500 cursor-pointer transition-colors"
              >
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-medium">AD</span>
                <span className="text-sm text-gray-700 whitespace-nowrap">{ad.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* 필터 컴포넌트 */}
        <JobFilter
          filters={filters}
          onFilterChange={setFilters}
          totalCount={sampleJobs.length}
          filteredCount={filteredJobs.length}
        />

        <div className="flex gap-6">
          {/* 메인 콘텐츠 */}
          <div className="flex-1 min-w-0">
            {/* 유니크 섹션 */}
            {uniqueJobs.length > 0 && (
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
                {/* 모바일: 2열 그리드 / PC: 리스트 */}
                <div className="md:hidden">
                  <PremiumGrid jobs={uniqueJobs} tier="unique" />
                </div>
                <div className="hidden md:block space-y-3">
                  {uniqueJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                {/* 유니크 광고 배너 */}
                <div className="mt-4 bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg p-3 md:p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] md:text-xs bg-white/20 px-2 py-0.5 rounded">유니크</span>
                      <p className="mt-1 md:mt-2 text-xs md:text-sm">효율적인 분양현장 구인 광고</p>
                      <p className="font-bold text-sm md:text-base">지금이 최적의 타이밍입니다!</p>
                    </div>
                    <Link href="#" className="bg-white text-purple-600 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-purple-50 transition-colors whitespace-nowrap">
                      상품안내
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* 베스트 현장 */}
            {bestJobs.length > 0 && (
              <section className="mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div>
                    <h2 className="font-bold text-gray-900 text-sm md:text-base">베스트 현장</h2>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 hidden md:block">
                      ※ 해당 영역은 최근 10일간의 조회수, 현장 공유, 문자·전화 문의 등 다양한 지표를 종합하여 자동으로 노출됩니다.
                    </p>
                  </div>
                  <Link href="#" className="text-gray-500 text-xs md:text-sm flex items-center gap-1 hover:text-purple-600">
                    + 전체보기
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                  {bestJobs.map((job) => (
                    <JobCard key={job.id} job={job} variant="compact" />
                  ))}
                </div>
              </section>
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
                {/* 모바일: 2열 그리드 / PC: 리스트 */}
                <div className="md:hidden">
                  <PremiumGrid jobs={superiorJobs} tier="superior" />
                </div>
                <div className="hidden md:block space-y-3">
                  {superiorJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                {/* 슈페리어 광고 배너 */}
                <div className="mt-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg p-3 md:p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] md:text-xs bg-white/20 px-2 py-0.5 rounded">슈페리어</span>
                      <p className="mt-1 md:mt-2 text-xs md:text-sm">효율적인 분양현장 구인 광고</p>
                      <p className="font-bold text-sm md:text-base">지금이 최적의 타이밍입니다!</p>
                    </div>
                    <Link href="#" className="bg-white text-blue-600 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-blue-50 transition-colors whitespace-nowrap">
                      상품안내
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* 프리미엄 섹션 */}
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
                {/* 모바일: 2열 그리드 / PC: 리스트 */}
                <div className="md:hidden">
                  <PremiumGrid jobs={premiumJobs} tier="premium" />
                </div>
                <div className="hidden md:block space-y-3">
                  {premiumJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </section>
            )}

            {/* 일반 섹션 */}
            {normalJobs.length > 0 && (
              <section className="mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-500 text-white text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded">일반</span>
                    <span className="text-xs text-gray-500">({normalJobs.length})</span>
                  </div>
                  <Link href="/sales/jobs?tier=normal" className="text-gray-500 text-xs md:text-sm flex items-center gap-1 hover:text-gray-600">
                    + 전체보기
                  </Link>
                </div>
                <div className="space-y-2 md:space-y-3">
                  {normalJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </section>
            )}

            {/* 검색 결과 없음 */}
            {filteredJobs.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">검색 결과가 없습니다</h3>
                <p className="text-gray-500 text-sm">
                  필터 조건을 변경하거나 검색어를 수정해 보세요.
                </p>
                <button
                  onClick={() => setFilters(initialFilters)}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                >
                  필터 초기화
                </button>
              </div>
            )}
          </div>

          {/* 사이드바 */}
          <div className="hidden lg:block w-80 flex-shrink-0 space-y-6">
            {/* 통계 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                온시아 JOB 통계
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">신규현장</span>
                  <span className="font-bold text-purple-600">{stats.todayNewJobs}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">전체 현장</span>
                  <span className="font-medium text-gray-900">{stats.totalJobs.toLocaleString()} 개</span>
                </div>
                <hr className="border-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">실시간 방문자</span>
                  <span className="font-bold text-purple-600">{stats.todayVisitors.toLocaleString()}명</span>
                </div>
                <p className="text-xs text-gray-400">오늘 온시아 JOB 방문자의 실시간 집계입니다</p>
              </div>
            </div>

            {/* 맞춤현장 설정 */}
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">맞춤현장</h3>
              <p className="text-sm text-gray-600 mb-3">
                로그인후 이용하실 수 있습니다. 맞춤현장 정보를 설정하시어 회원님께서 찾으시는 현장 구인 정보를 빠르게 전달 받아보세요!
              </p>
              <Link
                href="/auth/signin"
                className="block text-center bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                맞춤현장 설정하기
              </Link>
            </div>

            {/* 뉴스 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">분양라인 뉴스</h3>
                <Link href="#" className="text-xs text-gray-500 hover:text-purple-600">뉴스 전체보기</Link>
              </div>
              <p className="text-xs text-gray-500 mb-3">최신 보도자료와 부동산 관련 뉴스를 확인해보세요!</p>
              <div className="space-y-3">
                {newsItems.map((news) => (
                  <Link key={news.id} href={news.url} className="block group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-700 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {news.title}
                      </p>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{news.date}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 공지사항/이벤트 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* 공지사항 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-900 text-sm">공지사항</h4>
                    <Link href="#" className="text-xs text-gray-500 hover:text-purple-600">전체보기</Link>
                  </div>
                  <div className="space-y-2">
                    {notices.map((notice) => (
                      <Link key={notice.id} href="#" className="block text-xs text-gray-600 hover:text-purple-600 truncate">
                        {notice.title}
                      </Link>
                    ))}
                  </div>
                </div>
                {/* 이벤트 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-900 text-sm">이벤트</h4>
                    <Link href="#" className="text-xs text-gray-500 hover:text-purple-600">전체보기</Link>
                  </div>
                  <div className="space-y-2">
                    {events.map((event) => (
                      <Link key={event.id} href="#" className="block text-xs text-gray-600 hover:text-purple-600 truncate">
                        {event.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 고객센터 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-bold text-gray-900 mb-2">고객센터</h4>
              <p className="text-2xl font-bold text-purple-600 mb-2">1660-0464</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p><span className="font-medium">운영시간</span> 월~금 09:00~18:00 주말,공휴일 휴무</p>
                <p><span className="font-medium">FAX</span> 031-791-1868</p>
                <p><span className="font-medium">E-mail</span> help@onsia.city</p>
              </div>
            </div>
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
            <p>회사명 : (주)온시아ㅣ대표 : 홍길동ㅣ주소 : 서울시 강남구 테헤란로 123ㅣ대표번호 : 1660-0464</p>
            <p>사업자등록번호 : 123-45-67890ㅣ통신판매업 신고번호 : 제2024-서울강남-1234호</p>
            <p className="mt-2">© (주)온시아 All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* 플로팅 버튼 */}
      <div className="fixed right-4 bottom-24 md:bottom-8 flex flex-col gap-2 z-50">
        <Link
          href="/sales/jobs/new"
          className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 transition-colors"
        >
          <PenSquare className="w-5 h-5" />
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
