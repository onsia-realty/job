'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, X, MapPin, SlidersHorizontal } from 'lucide-react';
import Header from '@/components/shared/Header';
import MobileNav from '@/components/shared/MobileNav';
import JobCard from '@/components/sales/JobCard';
import type { SalesJobListing, SalesJobType, SalesJobTier, SalaryType } from '@/types';
import { REGIONS } from '@/types';

// 확장된 임시 데이터
const allJobs: SalesJobListing[] = [
  {
    id: '1',
    title: '힐스테이트 지금이 타이밍입니다',
    description: '조건변경 수수료인상! 대박현장 급구합니다',
    type: 'apartment',
    tier: 'unique',
    badges: ['hot', 'jackpot'],
    position: 'member',
    salary: { type: 'commission', amount: '최대 400만' },
    benefits: ['숙소제공', '일비', '숙소비'],
    experience: 'none',
    company: '(주)분양프라자',
    region: '경기',
    views: 3241,
    createdAt: '2026.01.17',
  },
  {
    id: '2',
    title: '래미안 원베일리 본부장/팀장 모집',
    description: '압구정 최고 입지 프리미엄 현장',
    type: 'apartment',
    tier: 'superior',
    badges: ['new', 'popular'],
    position: 'headTeam',
    salary: { type: 'base_incentive', amount: '협의' },
    benefits: ['차량지원', '식대'],
    experience: '12month',
    company: '삼성물산',
    region: '서울',
    views: 2156,
    createdAt: '2026.01.16',
  },
  {
    id: '3',
    title: '송도 오피스텔 분양팀 모집',
    description: '인천 송도 핵심 상권 오피스텔 분양',
    type: 'officetel',
    tier: 'premium',
    badges: ['new'],
    position: 'member',
    salary: { type: 'commission', amount: '최대 300만' },
    benefits: ['숙소제공'],
    experience: 'none',
    company: '송도개발(주)',
    region: '인천',
    views: 1823,
    createdAt: '2026.01.16',
  },
  {
    id: '4',
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
    region: '경기',
    views: 892,
    createdAt: '2026.01.15',
  },
  {
    id: '5',
    title: '부산 해운대 상가 분양',
    description: '해운대 마린시티 프리미엄 상가',
    type: 'store',
    tier: 'premium',
    badges: ['hot'],
    position: 'teamLead',
    salary: { type: 'commission', amount: '최대 500만' },
    benefits: ['숙소제공', '차량지원', '식대'],
    experience: '6month',
    company: '해운대상가(주)',
    region: '부산',
    views: 1567,
    createdAt: '2026.01.15',
  },
  {
    id: '6',
    title: '대전 둔산동 오피스텔 분양',
    description: '대전 핵심상권 역세권 오피스텔',
    type: 'officetel',
    tier: 'superior',
    badges: ['new'],
    position: 'member',
    salary: { type: 'commission', amount: '최대 350만' },
    benefits: ['숙소제공', '일비'],
    experience: 'none',
    company: '대전부동산(주)',
    region: '대전',
    views: 1234,
    createdAt: '2026.01.14',
  },
  {
    id: '7',
    title: '광주 상무지구 아파트 분양팀',
    description: '광주 최고 입지 브랜드 아파트',
    type: 'apartment',
    tier: 'premium',
    badges: ['popular'],
    position: 'member',
    salary: { type: 'base_incentive', amount: '협의' },
    benefits: ['숙소제공'],
    experience: '3month',
    company: '광주분양(주)',
    region: '광주',
    views: 987,
    createdAt: '2026.01.14',
  },
  {
    id: '8',
    title: '세종시 지식산업센터 분양',
    description: '세종시 행복도시 내 첫 지산',
    type: 'industrial',
    tier: 'unique',
    badges: ['new', 'hot'],
    position: 'teamLead',
    salary: { type: 'commission', amount: '최대 600만' },
    benefits: ['숙소제공', '차량지원', '식대', '일비'],
    experience: '6month',
    company: '세종지산(주)',
    region: '세종',
    views: 2876,
    createdAt: '2026.01.13',
  },
  {
    id: '9',
    title: '수원 광교 상가 분양상담사',
    description: '광교신도시 핵심상권 상가',
    type: 'store',
    tier: 'normal',
    badges: [],
    position: 'member',
    salary: { type: 'daily', amount: '12만' },
    benefits: ['교통비'],
    experience: 'none',
    company: '광교상가(주)',
    region: '경기',
    views: 654,
    createdAt: '2026.01.13',
  },
  {
    id: '10',
    title: '제주 노형동 오피스텔',
    description: '제주 중심상업지역 오피스텔 분양',
    type: 'officetel',
    tier: 'normal',
    badges: [],
    position: 'member',
    salary: { type: 'commission', amount: '최대 250만' },
    benefits: ['항공권지원', '숙소제공'],
    experience: 'none',
    company: '제주분양(주)',
    region: '제주',
    views: 543,
    createdAt: '2026.01.12',
  },
];

const TYPE_OPTIONS: { value: SalesJobType | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'apartment', label: '아파트' },
  { value: 'officetel', label: '오피스텔' },
  { value: 'store', label: '상가' },
  { value: 'industrial', label: '지산' },
];

const TIER_OPTIONS: { value: SalesJobTier | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'unique', label: 'UNIQUE' },
  { value: 'superior', label: 'SUPERIOR' },
  { value: 'premium', label: 'PREMIUM' },
  { value: 'normal', label: '일반' },
];

const SALARY_OPTIONS: { value: SalaryType | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'commission', label: '계약 수수료' },
  { value: 'base_incentive', label: '기본급+인센' },
  { value: 'daily', label: '일급' },
];

export default function SalesJobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('전체');
  const [selectedType, setSelectedType] = useState<SalesJobType | 'all'>('all');
  const [selectedTier, setSelectedTier] = useState<SalesJobTier | 'all'>('all');
  const [selectedSalary, setSelectedSalary] = useState<SalaryType | 'all'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
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

      // 지역 필터
      if (selectedRegion !== '전체' && job.region !== selectedRegion) {
        return false;
      }

      // 유형 필터
      if (selectedType !== 'all' && job.type !== selectedType) {
        return false;
      }

      // 티어 필터
      if (selectedTier !== 'all' && job.tier !== selectedTier) {
        return false;
      }

      // 급여 타입 필터
      if (selectedSalary !== 'all' && job.salary.type !== selectedSalary) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedRegion, selectedType, selectedTier, selectedSalary]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRegion('전체');
    setSelectedType('all');
    setSelectedTier('all');
    setSelectedSalary('all');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedRegion !== '전체' ||
    selectedType !== 'all' ||
    selectedTier !== 'all' ||
    selectedSalary !== 'all';

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header variant="sales" />

      {/* 검색 영역 */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2">
            {/* 검색 입력 */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="현장명, 지역, 회사명으로 검색"
                className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/60 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            {/* 필터 버튼 */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-colors ${
                hasActiveFilters
                  ? 'bg-white text-purple-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden md:inline">필터</span>
              {hasActiveFilters && (
                <span className="bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 필터 패널 */}
      {isFilterOpen && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-wrap gap-4">
              {/* 지역 필터 */}
              <div className="relative">
                <label className="text-xs text-gray-500 mb-1 block">지역</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="전체">전체</option>
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* 현장유형 필터 */}
              <div className="relative">
                <label className="text-xs text-gray-500 mb-1 block">현장유형</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as SalesJobType | 'all')}
                  className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* 티어 필터 */}
              <div className="relative">
                <label className="text-xs text-gray-500 mb-1 block">노출등급</label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value as SalesJobTier | 'all')}
                  className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {TIER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* 급여형태 필터 */}
              <div className="relative">
                <label className="text-xs text-gray-500 mb-1 block">급여형태</label>
                <select
                  value={selectedSalary}
                  onChange={(e) => setSelectedSalary(e.target.value as SalaryType | 'all')}
                  className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {SALARY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* 필터 초기화 */}
              {hasActiveFilters && (
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
                  >
                    <X className="w-4 h-4" />
                    초기화
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 결과 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">현장 구인</h1>
            <span className="text-sm text-gray-500">
              총 {filteredJobs.length}건
            </span>
          </div>
          <select className="text-sm text-gray-600 bg-transparent focus:outline-none">
            <option>최신순</option>
            <option>조회순</option>
            <option>급여순</option>
          </select>
        </div>

        {/* 활성 필터 태그 */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedRegion !== '전체' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">
                <MapPin className="w-3 h-3" />
                {selectedRegion}
                <button onClick={() => setSelectedRegion('전체')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedType !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">
                {TYPE_OPTIONS.find((o) => o.value === selectedType)?.label}
                <button onClick={() => setSelectedType('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTier !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">
                {TIER_OPTIONS.find((o) => o.value === selectedTier)?.label}
                <button onClick={() => setSelectedTier('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedSalary !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">
                {SALARY_OPTIONS.find((o) => o.value === selectedSalary)?.label}
                <button onClick={() => setSelectedSalary('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* 구인 목록 */}
        {filteredJobs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              다른 검색어나 필터를 시도해보세요
            </p>
            <button
              onClick={clearFilters}
              className="text-purple-600 text-sm font-medium hover:underline"
            >
              필터 초기화
            </button>
          </div>
        )}
      </main>

      <MobileNav variant="sales" />
    </div>
  );
}
