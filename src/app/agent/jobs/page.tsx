'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  SlidersHorizontal,
  Filter,
  LayoutGrid,
  List,
  ArrowUpDown,
  Briefcase,
  Building2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import MobileNav from '@/components/shared/MobileNav';
import AgentJobCard from '@/components/agent/JobCard';
import type { AgentJobListing, AgentJobType, AgentJobTier, AgentSalaryType, AgentExperience, AgentBenefit } from '@/types';
import { REGIONS, AGENT_EXPERIENCE_LABELS, AGENT_SALARY_TYPE_LABELS, AGENT_BENEFIT_LABELS } from '@/types';

// 확장된 샘플 데이터
const allJobs: AgentJobListing[] = [
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
  },
  {
    id: '9',
    title: '수원 영통 원룸 전문 중개사',
    description: '영통 대학가 원룸 전문 사무소',
    type: 'oneroom',
    tier: 'normal',
    badges: [],
    salary: { type: 'mixed', amount: '180만+α', min: 180 },
    experience: '경력무관',
    experienceLevel: 'none',
    company: '영통원룸공인',
    region: '경기',
    views: 489,
    applicants: 8,
    createdAt: '2026.01.16',
    isAlwaysRecruiting: true,
    benefits: ['insurance'],
  },
  {
    id: '10',
    title: '광주 상무지구 상가 전문',
    description: '상무지구 핵심상권 상가 전문',
    type: 'store',
    tier: 'normal',
    badges: [],
    salary: { type: 'commission', amount: '협의' },
    experience: '1년 이상',
    experienceLevel: '1year',
    company: '광주상무공인',
    region: '광주',
    views: 312,
    applicants: 5,
    createdAt: '2026.01.15',
    deadline: '2026-02-28',
    benefits: ['parking', 'flexible'],
  },
  {
    id: '11',
    title: '대전 둔산동 아파트 전문 중개사',
    description: '둔산동 대단지 아파트 전문',
    type: 'apartment',
    tier: 'normal',
    badges: ['new'],
    salary: { type: 'monthly', amount: '250만' },
    experience: '6개월 이상',
    experienceLevel: '6month',
    company: '대전둔산공인',
    region: '대전',
    views: 567,
    applicants: 11,
    createdAt: '2026.01.15',
    deadline: '2026-02-20',
    benefits: ['insurance', 'meal'],
  },
  {
    id: '12',
    title: '서초동 빌라/다세대 전문',
    description: '서초구 빌라 전문, 안정적인 물량',
    type: 'villa',
    tier: 'normal',
    badges: [],
    salary: { type: 'mixed', amount: '240만+α', min: 240 },
    experience: '1년 이상',
    experienceLevel: '1year',
    company: '서초빌라공인',
    region: '서울',
    views: 678,
    applicants: 14,
    createdAt: '2026.01.14',
    deadline: '2026-02-15',
    benefits: ['insurance', 'parking', 'transport'],
  },
];

const TYPE_OPTIONS: { value: AgentJobType | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'apartment', label: '아파트' },
  { value: 'villa', label: '빌라' },
  { value: 'store', label: '상가' },
  { value: 'oneroom', label: '원룸' },
  { value: 'office', label: '오피스' },
];

const TIER_OPTIONS: { value: AgentJobTier | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'premium', label: 'PREMIUM' },
  { value: 'normal', label: '일반' },
];

const EXPERIENCE_OPTIONS: { value: AgentExperience | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'none', label: '경력무관' },
  { value: '6month', label: '6개월 이상' },
  { value: '1year', label: '1년 이상' },
  { value: '2year', label: '2년 이상' },
  { value: '3year', label: '3년 이상' },
  { value: '5year', label: '5년 이상' },
];

const SALARY_OPTIONS: { value: AgentSalaryType | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'monthly', label: '월급' },
  { value: 'commission', label: '수수료' },
  { value: 'mixed', label: '기본급+수수료' },
];

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'views', label: '조회순' },
  { value: 'applicants', label: '지원자순' },
  { value: 'deadline', label: '마감임박순' },
  { value: 'salary', label: '급여순' },
];

const ITEMS_PER_PAGE = 12;

export default function AgentJobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('전체');
  const [selectedType, setSelectedType] = useState<AgentJobType | 'all'>('all');
  const [selectedTier, setSelectedTier] = useState<AgentJobTier | 'all'>('all');
  const [selectedExperience, setSelectedExperience] = useState<AgentExperience | 'all'>('all');
  const [selectedSalary, setSelectedSalary] = useState<AgentSalaryType | 'all'>('all');
  const [sortBy, setSortBy] = useState('latest');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 필터링 및 정렬
  const filteredAndSortedJobs = useMemo(() => {
    let result = allJobs.filter((job) => {
      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !job.title.toLowerCase().includes(query) &&
          !job.description.toLowerCase().includes(query) &&
          !job.company.toLowerCase().includes(query) &&
          !job.region.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      if (selectedRegion !== '전체' && job.region !== selectedRegion) return false;
      if (selectedType !== 'all' && job.type !== selectedType) return false;
      if (selectedTier !== 'all' && job.tier !== selectedTier) return false;
      if (selectedExperience !== 'all' && job.experienceLevel !== selectedExperience) return false;
      if (selectedSalary !== 'all' && job.salary.type !== selectedSalary) return false;

      return true;
    });

    // 정렬
    result.sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return b.views - a.views;
        case 'applicants':
          return (b.applicants || 0) - (a.applicants || 0);
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'salary':
          return (b.salary.min || 0) - (a.salary.min || 0);
        case 'latest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [searchQuery, selectedRegion, selectedType, selectedTier, selectedExperience, selectedSalary, sortBy]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredAndSortedJobs.length / ITEMS_PER_PAGE);
  const paginatedJobs = filteredAndSortedJobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRegion('전체');
    setSelectedType('all');
    setSelectedTier('all');
    setSelectedExperience('all');
    setSelectedSalary('all');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedRegion !== '전체' ||
    selectedType !== 'all' ||
    selectedTier !== 'all' ||
    selectedExperience !== 'all' ||
    selectedSalary !== 'all';

  const activeFilterCount = [
    selectedRegion !== '전체',
    selectedType !== 'all',
    selectedTier !== 'all',
    selectedExperience !== 'all',
    selectedSalary !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header variant="agent" />

      {/* 검색 영역 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 pb-6 pt-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="회사명, 지역, 키워드로 검색"
                className="w-full bg-white text-gray-700 placeholder-gray-400 pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-colors font-medium ${
                hasActiveFilters
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden md:inline">필터</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 필터 패널 */}
      {isFilterOpen && (
        <div className="bg-white border-b border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">지역</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => { setSelectedRegion(e.target.value); setCurrentPage(1); }}
                  className="w-full appearance-none bg-gray-100 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="전체">전체</option>
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">업무유형</label>
                <select
                  value={selectedType}
                  onChange={(e) => { setSelectedType(e.target.value as AgentJobType | 'all'); setCurrentPage(1); }}
                  className="w-full appearance-none bg-gray-100 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">경력</label>
                <select
                  value={selectedExperience}
                  onChange={(e) => { setSelectedExperience(e.target.value as AgentExperience | 'all'); setCurrentPage(1); }}
                  className="w-full appearance-none bg-gray-100 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">급여형태</label>
                <select
                  value={selectedSalary}
                  onChange={(e) => { setSelectedSalary(e.target.value as AgentSalaryType | 'all'); setCurrentPage(1); }}
                  className="w-full appearance-none bg-gray-100 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SALARY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">공고등급</label>
                <select
                  value={selectedTier}
                  onChange={(e) => { setSelectedTier(e.target.value as AgentJobTier | 'all'); setCurrentPage(1); }}
                  className="w-full appearance-none bg-gray-100 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-3 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                  초기화
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 상단 정보바 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">공인중개사 채용공고</h1>
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              총 {filteredAndSortedJobs.length}건
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* 정렬 */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-sm text-gray-700 pl-4 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* 뷰 모드 토글 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 활성 필터 태그 */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-3 py-1.5 rounded-full">
                <Search className="w-3 h-3" />
                &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery('')} className="hover:bg-blue-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedRegion !== '전체' && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-3 py-1.5 rounded-full">
                <MapPin className="w-3 h-3" />
                {selectedRegion}
                <button onClick={() => setSelectedRegion('전체')} className="hover:bg-blue-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedType !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-3 py-1.5 rounded-full">
                {TYPE_OPTIONS.find((o) => o.value === selectedType)?.label}
                <button onClick={() => setSelectedType('all')} className="hover:bg-blue-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedExperience !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-3 py-1.5 rounded-full">
                {EXPERIENCE_OPTIONS.find((o) => o.value === selectedExperience)?.label}
                <button onClick={() => setSelectedExperience('all')} className="hover:bg-blue-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedSalary !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-3 py-1.5 rounded-full">
                {SALARY_OPTIONS.find((o) => o.value === selectedSalary)?.label}
                <button onClick={() => setSelectedSalary('all')} className="hover:bg-blue-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTier !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-3 py-1.5 rounded-full">
                {TIER_OPTIONS.find((o) => o.value === selectedTier)?.label}
                <button onClick={() => setSelectedTier('all')} className="hover:bg-blue-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* 채용 공고 목록 */}
        {paginatedJobs.length > 0 ? (
          <>
            {viewMode === 'card' ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedJobs.map((job) => (
                  <AgentJobCard key={job.id} job={job} variant="card" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedJobs.map((job) => (
                  <AgentJobCard key={job.id} job={job} variant="list" />
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
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
                          {showEllipsis && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        </span>
                      );
                    })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* 페이지 정보 */}
            <div className="text-center mt-4 text-sm text-gray-500">
              {currentPage} / {totalPages} 페이지 · 총 {filteredAndSortedJobs.length}개 공고
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-500 mb-6">
              다른 검색어나 필터 조건을 시도해보세요
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <X className="w-4 h-4" />
              필터 초기화
            </button>
          </div>
        )}
      </main>

      <MobileNav variant="agent" />
    </div>
  );
}
