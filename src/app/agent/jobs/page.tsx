'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Building,
  Home,
  Store,
  Landmark,
  Warehouse,
  Gavel,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ArrowUpDown,
  Clock,
  Eye,
  Users,
  Crown,
  Flame,
  Zap,
  CheckCircle2,
  Heart,
  BadgeCheck,
  Bookmark,
  Filter,
  PenSquare,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import MobileNav from '@/components/shared/MobileNav';
import { supabase } from '@/lib/supabase';
import type { AgentJobListing, AgentJobType, AgentJobTier, AgentSalaryType, AgentExperience } from '@/types';
import { REGIONS } from '@/types';

// 부동산 카테고리 (2-tier 시스템: 주거용/상업용)
type PropertyCategoryType = 'residential' | 'commercial';

const CATEGORY_CONFIG: Record<PropertyCategoryType, {
  label: string;
  icon: typeof Home;
  color: string;
  bgColor: string;
  textColor: string;
  types: Array<{ id: string; name: string; icon: typeof Home; color: string; bgColor: string; textColor: string; borderColor: string }>;
}> = {
  residential: {
    label: '주거용',
    icon: Home,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    types: [
      { id: 'apartment', name: '아파트', icon: Building2, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' },
      { id: 'officetel', name: '오피스텔', icon: Building, color: 'from-sky-500 to-sky-600', bgColor: 'bg-sky-50', textColor: 'text-sky-600', borderColor: 'border-sky-200' },
      { id: 'villa', name: '빌라/다세대', icon: Home, color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600', borderColor: 'border-indigo-200' },
    ],
  },
  commercial: {
    label: '상업용',
    icon: Store,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    types: [
      { id: 'store', name: '상가', icon: Store, color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-200' },
      { id: 'office', name: '사무실', icon: Landmark, color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50', textColor: 'text-orange-600', borderColor: 'border-orange-200' },
      { id: 'building', name: '빌딩매매', icon: Warehouse, color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
      { id: 'auction', name: '경매', icon: Gavel, color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-red-600', borderColor: 'border-red-200' },
    ],
  },
};

// 모든 카테고리 평면화 (기존 호환성)
const ALL_PROPERTY_TYPES = [
  ...CATEGORY_CONFIG.residential.types,
  ...CATEGORY_CONFIG.commercial.types,
];

// 샘플 데이터 (DB 데이터와 병합됨)
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
    address: '성남시 분당구 판교역로',
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
    address: '마포구 양화로',
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
    address: '영등포구 여의대로',
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
    address: '강남구 논현로',
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
    views: 1234,
    applicants: 18,
    createdAt: '2026.01.30',
    isAlwaysRecruiting: true,
    benefits: ['insurance', 'education', 'transport'],
  },
  {
    id: '7',
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
  {
    id: '8',
    title: '송도 오피스텔 임대 관리 전문',
    description: '송도국제도시 오피스텔 임대 관리',
    type: 'officetel',
    tier: 'normal',
    badges: [],
    salary: { type: 'monthly', amount: '280만' },
    experience: '6개월 이상',
    experienceLevel: '6month',
    company: '송도글로벌부동산',
    region: '인천',
    views: 654,
    applicants: 12,
    createdAt: '2026.01.27',
    deadline: '2026-02-20',
    benefits: ['insurance', 'meal'],
  },
  {
    id: '9',
    title: '강동구 상가 임대 전문 중개사',
    description: '천호/길동 상권 상가 전문',
    type: 'store',
    tier: 'normal',
    badges: [],
    salary: { type: 'mixed', amount: '220만+α', min: 220 },
    experience: '1년 이상',
    experienceLevel: '1year',
    company: '강동상가전문',
    region: '서울',
    views: 432,
    applicants: 8,
    createdAt: '2026.01.26',
    deadline: '2026-02-25',
    benefits: ['insurance', 'transport'],
  },
  {
    id: '13',
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
    id: '10',
    title: '잠실 재건축 아파트 전문 고경력',
    description: '잠실 주공5단지 재건축 전문, 고수익',
    type: 'apartment',
    tier: 'premium',
    badges: ['hot'],
    salary: { type: 'mixed', amount: '400~600만', min: 400, max: 600 },
    experience: '5년 이상',
    experienceLevel: '5year',
    company: '잠실프레스티지공인',
    region: '서울',
    views: 5234,
    applicants: 112,
    createdAt: '2026.01.25',
    deadline: '2026-02-08',
    benefits: ['insurance', 'incentive', 'parking', 'meal', 'bonus', 'vacation'],
  },
  {
    id: '11',
    title: '해운대 오피스텔 전문 중개사',
    description: '해운대 마린시티 오피스텔 전문',
    type: 'officetel',
    tier: 'normal',
    badges: ['new'],
    salary: { type: 'mixed', amount: '230~280만', min: 230, max: 280 },
    experience: '1년 이상',
    experienceLevel: '1year',
    company: '해운대마린공인',
    region: '부산',
    views: 876,
    applicants: 15,
    createdAt: '2026.01.29',
    deadline: '2026-02-18',
    benefits: ['insurance', 'parking'],
  },
  {
    id: '12',
    title: '대전 둔산동 사무실 임대 전문',
    description: '둔산동 오피스 빌딩 임대 전문',
    type: 'office',
    tier: 'normal',
    badges: [],
    salary: { type: 'monthly', amount: '250만' },
    experience: '6개월 이상',
    experienceLevel: '6month',
    company: '대전오피스공인',
    region: '대전',
    views: 345,
    applicants: 6,
    createdAt: '2026.01.24',
    deadline: '2026-02-28',
    benefits: ['insurance'],
  },
];

const EXPERIENCE_OPTIONS = [
  { value: 'all', label: '경력 전체' },
  { value: 'none', label: '경력무관' },
  { value: '6month', label: '6개월 이상' },
  { value: '1year', label: '1년 이상' },
  { value: '2year', label: '2년 이상' },
  { value: '3year', label: '3년 이상' },
  { value: '5year', label: '5년 이상' },
];

const SALARY_OPTIONS = [
  { value: 'all', label: '급여 전체' },
  { value: 'monthly', label: '월급제' },
  { value: 'commission', label: '수수료제' },
  { value: 'mixed', label: '기본급+수수료' },
];

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'views', label: '조회순' },
  { value: 'applicants', label: '지원자순' },
  { value: 'deadline', label: '마감임박순' },
  { value: 'salary', label: '급여순' },
];

// D-Day 계산
function getDDay(deadline?: string): { text: string; color: string; urgent: boolean } {
  if (!deadline) return { text: '상시', color: 'bg-slate-100 text-slate-500', urgent: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: '마감', color: 'bg-slate-200 text-slate-400', urgent: false };
  if (diffDays === 0) return { text: 'D-DAY', color: 'bg-red-500 text-white', urgent: true };
  if (diffDays <= 3) return { text: `D-${diffDays}`, color: 'bg-red-500 text-white', urgent: true };
  if (diffDays <= 7) return { text: `D-${diffDays}`, color: 'bg-orange-500 text-white', urgent: true };
  return { text: `D-${diffDays}`, color: 'bg-slate-100 text-slate-600', urgent: false };
}

// 카테고리 찾기
function getCategory(type: string) {
  const found = ALL_PROPERTY_TYPES.find(c => c.id === type);
  return found || ALL_PROPERTY_TYPES[0];
}

// 대분류 정보 가져오기
function getMainCategoryConfig(type: string): typeof CATEGORY_CONFIG.residential | null {
  if (CATEGORY_CONFIG.residential.types.find(t => t.id === type)) {
    return CATEGORY_CONFIG.residential;
  }
  if (CATEGORY_CONFIG.commercial.types.find(t => t.id === type)) {
    return CATEGORY_CONFIG.commercial;
  }
  return null;
}

const ITEMS_PER_PAGE = 10;

export default function AgentJobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedMainCategory, setSelectedMainCategory] = useState<PropertyCategoryType>('residential');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [selectedSalary, setSelectedSalary] = useState('all');
  const [selectedTier, setSelectedTier] = useState<'all' | 'premium'>('all');
  const [sortBy, setSortBy] = useState('latest');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [allJobs, setAllJobs] = useState<AgentJobListing[]>(sampleJobs);

  // Supabase에서 agent 공고 가져와서 샘플 데이터와 병합
  useEffect(() => {
    async function fetchAgentJobs() {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('category', 'agent')
        .order('created_at', { ascending: false });

      console.log('[agent/jobs] fetch result:', { data, error, count: data?.length });

      if (error) {
        console.error('Fetch agent jobs error:', error);
        return;
      }

      if (data && data.length > 0) {
        const dbJobs: AgentJobListing[] = data.map((job: any) => ({
          id: job.id,
          title: job.title,
          description: job.description || '',
          type: job.type as AgentJobType,
          tier: (job.tier || 'normal') as AgentJobTier,
          badges: job.badges || [],
          salary: {
            type: (job.salary_type || 'monthly') as AgentSalaryType,
            amount: job.salary_amount || undefined,
          },
          experience: job.experience || '경력무관',
          experienceLevel: (job.experience || 'none') as AgentExperience,
          company: job.company || '',
          region: job.region || '',
          address: job.address || undefined,
          thumbnail: job.thumbnail || undefined,
          views: job.views || 0,
          applicants: 0,
          createdAt: new Date(job.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
          }).replace(/\. /g, '.').replace(/\.$/, ''),
          deadline: job.deadline || undefined,
          benefits: job.benefits || [],
          contactName: job.contact_name || undefined,
          contactPhone: job.phone || undefined,
        }));

        // DB 데이터를 앞에, 샘플 데이터를 뒤에 (ID 중복 방지)
        const dbIds = new Set(dbJobs.map(j => j.id));
        const merged = [...dbJobs, ...sampleJobs.filter(j => !dbIds.has(j.id))];
        setAllJobs(merged);
      }
    }

    fetchAgentJobs();
  }, []);

  const currentConfig = CATEGORY_CONFIG[selectedMainCategory];

  // 필터링 및 정렬
  const filteredAndSortedJobs = useMemo(() => {
    // 현재 대분류에 속하는 타입들
    const validTypes = currentConfig.types.map(t => t.id);

    let result = allJobs.filter((job) => {
      // 대분류 필터 (주거용/상업용)
      if (!validTypes.includes(job.type)) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !job.title.toLowerCase().includes(query) &&
          !job.company.toLowerCase().includes(query) &&
          !job.region.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (selectedRegion !== '전체' && job.region !== selectedRegion) return false;
      if (selectedCategory && job.type !== selectedCategory) return false;
      if (selectedExperience !== 'all' && job.experienceLevel !== selectedExperience) return false;
      if (selectedSalary !== 'all' && job.salary.type !== selectedSalary) return false;
      if (selectedTier === 'premium' && job.tier !== 'premium') return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'views': return b.views - a.views;
        case 'applicants': return (b.applicants || 0) - (a.applicants || 0);
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'salary': return (b.salary.min || 0) - (a.salary.min || 0);
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [allJobs, searchQuery, selectedRegion, selectedCategory, selectedExperience, selectedSalary, selectedTier, sortBy, currentConfig]);

  const totalPages = Math.ceil(filteredAndSortedJobs.length / ITEMS_PER_PAGE);
  const paginatedJobs = filteredAndSortedJobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRegion('전체');
    setSelectedCategory(null);
    setSelectedExperience('all');
    setSelectedSalary('all');
    setSelectedTier('all');
    setCurrentPage(1);
  };

  const activeFilterCount = [
    selectedRegion !== '전체',
    selectedCategory !== null,
    selectedExperience !== 'all',
    selectedSalary !== 'all',
    selectedTier !== 'all',
  ].filter(Boolean).length;

  const toggleBookmark = (jobId: string) => {
    setBookmarkedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Header variant="agent" />

      {/* 검색 헤더 */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 pt-4 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* 검색바 */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="회사명, 지역, 키워드로 검색"
                className="w-full bg-white text-slate-700 placeholder-slate-400 pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* 지역 선택 */}
            <div className="relative md:w-40">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={selectedRegion}
                onChange={(e) => { setSelectedRegion(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white text-slate-700 pl-10 pr-4 py-3.5 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="전체">전체 지역</option>
                {REGIONS.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* 모바일 필터 버튼 */}
            <button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className={`md:hidden flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-medium transition-colors ${
                activeFilterCount > 0
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              필터
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-white text-emerald-600 rounded-full text-xs flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* 카테고리 선택 (주거용 / 상업용) */}
          <div className="flex gap-3 mt-4">
            {(Object.entries(CATEGORY_CONFIG) as [PropertyCategoryType, typeof CATEGORY_CONFIG.residential][]).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = selectedMainCategory === key;
              const subTypeNames = config.types.map(t => t.name).join(', ');
              return (
                <button
                  key={key}
                  onClick={() => { setSelectedMainCategory(key); setSelectedCategory(null); setCurrentPage(1); }}
                  className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-white text-slate-800 shadow-lg'
                      : 'bg-white/10 text-white/90 hover:bg-white/20'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? config.textColor : ''}`} />
                  <div className="text-left">
                    <span className="font-semibold">{config.label}</span>
                    <p className={`text-xs ${isActive ? 'text-slate-500' : 'text-white/70'}`}>
                      ({subTypeNames})
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 데스크톱 필터 & 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* 사이드바 필터 (데스크톱) */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-emerald-600" />
                  상세 필터
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> 초기화
                  </button>
                )}
              </div>

              <div className="space-y-5">
                {/* 공고 등급 */}
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-2 block">공고 등급</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedTier('all')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedTier === 'all'
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      전체
                    </button>
                    <button
                      onClick={() => setSelectedTier('premium')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                        selectedTier === 'premium'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Crown className="w-4 h-4" /> PREMIUM
                    </button>
                  </div>
                </div>

                {/* 경력 */}
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-2 block">경력</label>
                  <select
                    value={selectedExperience}
                    onChange={(e) => { setSelectedExperience(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {EXPERIENCE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 급여형태 */}
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-2 block">급여형태</label>
                  <select
                    value={selectedSalary}
                    onChange={(e) => { setSelectedSalary(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {SALARY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 min-w-0">
            {/* 상단 정보바 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-800">채용공고</h1>
                <span className="text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-medium">
                  {filteredAndSortedJobs.length}건
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* 정렬 */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 text-sm text-slate-700 pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* 뷰 모드 */}
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('card')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'card' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 공고 목록 */}
            {paginatedJobs.length > 0 ? (
              <>
                {viewMode === 'list' ? (
                  <div className="space-y-3">
                    {paginatedJobs.map((job) => {
                      const category = getCategory(job.type);
                      const dday = getDDay(job.deadline);
                      const Icon = category.icon;
                      const isBookmarked = bookmarkedJobs.includes(job.id);

                      return (
                        <div
                          key={job.id}
                          className="group bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all overflow-hidden"
                        >
                          <div className="flex">
                            {/* 왼쪽 컬러바 */}
                            <div className={`w-1 bg-gradient-to-b ${category.color}`}></div>

                            <div className="flex-1 p-5">
                              <div className="flex items-start gap-4">
                                {/* 카테고리 아이콘 */}
                                <div className={`w-14 h-14 rounded-xl ${category.bgColor} flex items-center justify-center flex-shrink-0`}>
                                  <Icon className={`w-7 h-7 ${category.textColor}`} />
                                </div>

                                {/* 정보 */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${dday.color}`}>
                                      {dday.text}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${category.bgColor} ${category.textColor}`}>
                                      {category.name}
                                    </span>
                                    {job.tier === 'premium' && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-0.5">
                                        <Crown className="w-3 h-3" /> PREMIUM
                                      </span>
                                    )}
                                    {job.badges.includes('hot') && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-0.5">
                                        <Flame className="w-3 h-3" /> HOT
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm text-slate-500">{job.company}</span>
                                    {job.tier === 'premium' && (
                                      <BadgeCheck className="w-4 h-4 text-emerald-500" />
                                    )}
                                  </div>

                                  <Link
                                    href={`/agent/jobs/${job.id}`}
                                    className="block"
                                  >
                                    <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-1 text-lg">
                                      {job.title}
                                    </h3>
                                  </Link>

                                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {job.region} {job.address && `· ${job.address}`}
                                    </span>
                                    <span>{job.experience}</span>
                                  </div>
                                </div>

                                {/* 오른쪽 */}
                                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                  <button
                                    onClick={() => toggleBookmark(job.id)}
                                    className={`p-2 rounded-lg transition-colors ${
                                      isBookmarked
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-slate-100 text-slate-400 hover:text-emerald-600'
                                    }`}
                                  >
                                    <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                                  </button>

                                  <div className="text-right">
                                    <p className="text-lg font-bold text-emerald-600">{job.salary.amount}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                      <span className="flex items-center gap-0.5">
                                        <Eye className="w-3.5 h-3.5" /> {job.views.toLocaleString()}
                                      </span>
                                      <span className="flex items-center gap-0.5">
                                        <Users className="w-3.5 h-3.5" /> {job.applicants}명
                                      </span>
                                    </div>
                                  </div>

                                  <Link
                                    href={`/agent/jobs/${job.id}`}
                                    className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                                  >
                                    상세보기
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedJobs.map((job) => {
                      const category = getCategory(job.type);
                      const dday = getDDay(job.deadline);
                      const Icon = category.icon;
                      const isBookmarked = bookmarkedJobs.includes(job.id);

                      return (
                        <div
                          key={job.id}
                          className={`group bg-white rounded-xl border-2 ${
                            job.tier === 'premium' ? 'border-amber-200' : 'border-slate-200'
                          } hover:shadow-xl transition-all p-5 relative overflow-hidden`}
                        >
                          {job.tier === 'premium' && (
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-50 to-transparent rounded-bl-full"></div>
                          )}

                          <div className="relative">
                            <div className="flex items-start justify-between mb-3">
                              <div className={`w-11 h-11 rounded-xl ${category.bgColor} flex items-center justify-center`}>
                                <Icon className={`w-6 h-6 ${category.textColor}`} />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${dday.color}`}>
                                  {dday.text}
                                </span>
                                <button
                                  onClick={() => toggleBookmark(job.id)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isBookmarked
                                      ? 'text-emerald-600'
                                      : 'text-slate-300 hover:text-emerald-600'
                                  }`}
                                >
                                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-slate-500">{job.company}</span>
                              {job.tier === 'premium' && (
                                <BadgeCheck className="w-4 h-4 text-amber-500" />
                              )}
                            </div>

                            <Link href={`/agent/jobs/${job.id}`}>
                              <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors mb-3 line-clamp-2">
                                {job.title}
                              </h3>
                            </Link>

                            <div className="flex flex-wrap gap-1.5 text-xs mb-3">
                              <span className={`px-2 py-1 rounded ${category.bgColor} ${category.textColor}`}>
                                {category.name}
                              </span>
                              <span className="px-2 py-1 rounded bg-slate-100 text-slate-600">{job.region}</span>
                              <span className="px-2 py-1 rounded bg-slate-100 text-slate-600">{job.experience}</span>
                            </div>

                            <div className="pt-3 border-t border-slate-100">
                              <p className="text-emerald-600 font-bold mb-2">{job.salary.amount}</p>
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center gap-0.5">
                                    <Eye className="w-3.5 h-3.5" /> {job.views.toLocaleString()}
                                  </span>
                                  <span className="flex items-center gap-0.5">
                                    <Users className="w-3.5 h-3.5" /> {job.applicants}
                                  </span>
                                </div>
                                <span>{job.createdAt}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (totalPages <= 7) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, index, arr) => {
                          const prevPage = arr[index - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;
                          return (
                            <span key={page} className="flex items-center">
                              {showEllipsis && <span className="px-2 text-slate-400">...</span>}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                {page}
                              </button>
                            </span>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <div className="text-center mt-4 text-sm text-slate-500">
                  {currentPage} / {totalPages} 페이지 · 총 {filteredAndSortedJobs.length}개 공고
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-medium text-slate-800 mb-2">검색 결과가 없습니다</h3>
                <p className="text-slate-500 mb-6">다른 조건으로 검색해보세요</p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  필터 초기화
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 모바일 필터 모달 */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilter(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">상세 필터</h3>
              <button onClick={() => setShowMobileFilter(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">공고 등급</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTier('all')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      selectedTier === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setSelectedTier('premium')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      selectedTier === 'premium'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Crown className="w-4 h-4" /> PREMIUM
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">경력</label>
                <select
                  value={selectedExperience}
                  onChange={(e) => setSelectedExperience(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm"
                >
                  {EXPERIENCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">급여형태</label>
                <select
                  value={selectedSalary}
                  onChange={(e) => setSelectedSalary(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm"
                >
                  {SALARY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={clearFilters}
                className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-medium"
              >
                초기화
              </button>
              <button
                onClick={() => setShowMobileFilter(false)}
                className="flex-1 py-3.5 bg-emerald-600 text-white rounded-xl font-medium"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 구인글 작성 FAB */}
      <Link
        href="/agent/jobs/new"
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-40 flex items-center gap-2 bg-emerald-600 text-white pl-4 pr-5 py-3.5 rounded-full shadow-lg hover:bg-emerald-700 transition-all hover:shadow-xl active:scale-95"
      >
        <PenSquare className="w-5 h-5" />
        <span className="font-semibold text-sm">구인글 작성</span>
      </Link>

      <MobileNav variant="agent" />
    </div>
  );
}
