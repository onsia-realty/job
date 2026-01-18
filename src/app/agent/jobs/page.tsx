'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronDown, X, MapPin, SlidersHorizontal, Filter } from 'lucide-react';
import Header from '@/components/shared/Header';
import MobileNav from '@/components/shared/MobileNav';
import AgentJobCard from '@/components/agent/JobCard';
import type { AgentJobListing, AgentJobType, AgentJobTier } from '@/types';
import { REGIONS } from '@/types';

// 확장된 임시 데이터
const allJobs: AgentJobListing[] = [
  {
    id: '1',
    title: '강남역 중개사무소 팀원 모집',
    description: '아파트 전문 중개사무소 경력자 우대',
    type: 'apartment',
    tier: 'premium',
    badges: ['hot', 'urgent'],
    salary: { type: 'mixed', amount: '250만+α' },
    experience: '1년이상',
    company: '강남공인중개사사무소',
    region: '서울',
    address: '강남역 5번출구',
    views: 1523,
    createdAt: '2026.01.17',
  },
  {
    id: '2',
    title: '분당 정자동 상가 전문 중개사',
    description: '상가/사무실 전문 경력 중개사 모집',
    type: 'store',
    tier: 'premium',
    badges: ['new'],
    salary: { type: 'commission', amount: '협의' },
    experience: '2년이상',
    company: '분당상가공인',
    region: '경기',
    address: '정자역 인근',
    views: 892,
    createdAt: '2026.01.16',
  },
  {
    id: '3',
    title: '신림동 원룸/빌라 전문',
    description: '신림동 원룸 빌라 전문 사무소',
    type: 'oneroom',
    tier: 'normal',
    badges: ['new'],
    salary: { type: 'mixed', amount: '200만+α' },
    experience: '경력무관',
    company: '신림부동산',
    region: '서울',
    views: 654,
    createdAt: '2026.01.16',
  },
  {
    id: '4',
    title: '인천 송도 오피스 전문 중개',
    description: '송도국제도시 오피스 전문',
    type: 'office',
    tier: 'normal',
    badges: [],
    salary: { type: 'monthly', amount: '280만' },
    experience: '1년이상',
    company: '송도오피스공인',
    region: '인천',
    views: 432,
    createdAt: '2026.01.15',
  },
  {
    id: '5',
    title: '잠실 아파트 전문 중개사 모집',
    description: '잠실 재건축 아파트 전문',
    type: 'apartment',
    tier: 'premium',
    badges: ['hot'],
    salary: { type: 'mixed', amount: '300만+α' },
    experience: '3년이상',
    company: '잠실부동산',
    region: '서울',
    address: '잠실역 인근',
    views: 2341,
    createdAt: '2026.01.15',
  },
  {
    id: '6',
    title: '부산 해운대 아파트 중개',
    description: '해운대 브랜드 아파트 전문',
    type: 'apartment',
    tier: 'normal',
    badges: [],
    salary: { type: 'mixed', amount: '220만+α' },
    experience: '6개월이상',
    company: '해운대공인',
    region: '부산',
    views: 567,
    createdAt: '2026.01.14',
  },
  {
    id: '7',
    title: '대전 둔산동 빌라 전문',
    description: '둔산동 빌라/주택 전문 사무소',
    type: 'villa',
    tier: 'normal',
    badges: ['new'],
    salary: { type: 'monthly', amount: '230만' },
    experience: '경력무관',
    company: '대전빌라공인',
    region: '대전',
    views: 345,
    createdAt: '2026.01.14',
  },
  {
    id: '8',
    title: '역삼역 상가 전문 중개사',
    description: '역삼 테헤란로 상가/오피스 전문',
    type: 'store',
    tier: 'premium',
    badges: ['hot', 'urgent'],
    salary: { type: 'commission', amount: '협의' },
    experience: '2년이상',
    company: '역삼상가공인',
    region: '서울',
    address: '역삼역 3번출구',
    views: 1876,
    createdAt: '2026.01.13',
  },
  {
    id: '9',
    title: '수원 영통 원룸 전문',
    description: '영통 대학가 원룸 전문 사무소',
    type: 'oneroom',
    tier: 'normal',
    badges: [],
    salary: { type: 'mixed', amount: '180만+α' },
    experience: '경력무관',
    company: '영통원룸공인',
    region: '경기',
    views: 289,
    createdAt: '2026.01.13',
  },
  {
    id: '10',
    title: '광주 상무지구 오피스 중개',
    description: '상무지구 오피스빌딩 전문',
    type: 'office',
    tier: 'normal',
    badges: [],
    salary: { type: 'monthly', amount: '250만' },
    experience: '1년이상',
    company: '광주오피스공인',
    region: '광주',
    views: 198,
    createdAt: '2026.01.12',
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

const SALARY_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'monthly', label: '월급' },
  { value: 'commission', label: '수수료' },
  { value: 'mixed', label: '기본급+수수료' },
];

export default function AgentJobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('전체');
  const [selectedType, setSelectedType] = useState<AgentJobType | 'all'>('all');
  const [selectedTier, setSelectedTier] = useState<AgentJobTier | 'all'>('all');
  const [selectedSalary, setSelectedSalary] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
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

      if (selectedRegion !== '전체' && job.region !== selectedRegion) {
        return false;
      }

      if (selectedType !== 'all' && job.type !== selectedType) {
        return false;
      }

      if (selectedTier !== 'all' && job.tier !== selectedTier) {
        return false;
      }

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
      <Header variant="agent" />

      {/* 검색 영역 */}
      <div className="bg-blue-600 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="회사명, 지역으로 검색"
                className="w-full bg-white text-gray-700 placeholder-gray-400 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-colors ${
                hasActiveFilters
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden md:inline">필터</span>
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
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
              <div className="relative">
                <label className="text-xs text-gray-500 mb-1 block">지역</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="전체">전체</option>
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <label className="text-xs text-gray-500 mb-1 block">업무유형</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as AgentJobType | 'all')}
                  className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <label className="text-xs text-gray-500 mb-1 block">공고등급</label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value as AgentJobTier | 'all')}
                  className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <label className="text-xs text-gray-500 mb-1 block">급여형태</label>
                <select
                  value={selectedSalary}
                  onChange={(e) => setSelectedSalary(e.target.value)}
                  className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SALARY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">구인 공고</h1>
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

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedRegion !== '전체' && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                <MapPin className="w-3 h-3" />
                {selectedRegion}
                <button onClick={() => setSelectedRegion('전체')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedType !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                {TYPE_OPTIONS.find((o) => o.value === selectedType)?.label}
                <button onClick={() => setSelectedType('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTier !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                {TIER_OPTIONS.find((o) => o.value === selectedTier)?.label}
                <button onClick={() => setSelectedTier('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedSalary !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                {SALARY_OPTIONS.find((o) => o.value === selectedSalary)?.label}
                <button onClick={() => setSelectedSalary('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {filteredJobs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <AgentJobCard key={job.id} job={job} />
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
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              필터 초기화
            </button>
          </div>
        )}
      </main>

      <MobileNav variant="agent" />
    </div>
  );
}
