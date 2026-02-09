'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, Filter, ChevronDown, X, MapPin, SlidersHorizontal,
  Star, Crown, Eye, Building2, Sparkles, Clock, ArrowRight,
  ChevronLeft, ChevronRight, Briefcase, Megaphone, AlertCircle,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import MobileNav from '@/components/shared/MobileNav';
import JobCard from '@/components/sales/JobCard';
import type { SalesJobListing, SalesJobType, SalesJobTier, SalaryType } from '@/types';
import { REGIONS } from '@/types';

// 확장된 임시 데이터 - 4단계 티어 분배
const allJobs: SalesJobListing[] = [
  // ── 유니크 (최상위) ──
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
  // ── 슈페리어 ──
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
  // ── 프리미엄 (반짝이 효과) ──
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
  // ── 무료 (24시간 만료) ──
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
    createdAt: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
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
    createdAt: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
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
    createdAt: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
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

const PLACEHOLDER_THUMBNAILS = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=250&fit=crop',
];

const TYPE_LABELS: Record<SalesJobType, string> = {
  apartment: '아파트',
  officetel: '오피스텔',
  store: '상가',
  industrial: '지산',
};

const TYPE_COLORS: Record<SalesJobType, string> = {
  apartment: 'bg-blue-500',
  officetel: 'bg-purple-500',
  store: 'bg-orange-500',
  industrial: 'bg-green-500',
};

const BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-green-500', text: 'text-white', label: '신규' },
  hot: { bg: 'bg-red-500', text: 'text-white', label: 'HOT' },
  jackpot: { bg: 'bg-yellow-500', text: 'text-white', label: '대박' },
  popular: { bg: 'bg-orange-500', text: 'text-white', label: '인기현장' },
};

const SALARY_LABELS: Record<SalaryType, string> = {
  commission: '계약수수료',
  base_incentive: '기본급+인센',
  daily: '일급',
};

export default function SalesJobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('전체');
  const [selectedType, setSelectedType] = useState<SalesJobType | 'all'>('all');
  const [selectedTier, setSelectedTier] = useState<SalesJobTier | 'all'>('all');
  const [selectedSalary, setSelectedSalary] = useState<SalaryType | 'all'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 유니크 슬라이더 상태
  const [uniqueSlideIndex, setUniqueSlideIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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
      if (selectedRegion !== '전체' && job.region !== selectedRegion) return false;
      if (selectedType !== 'all' && job.type !== selectedType) return false;
      if (selectedTier !== 'all' && job.tier !== selectedTier) return false;
      if (selectedSalary !== 'all' && job.salary.type !== selectedSalary) return false;
      return true;
    });
  }, [searchQuery, selectedRegion, selectedType, selectedTier, selectedSalary]);

  // 티어별 분류
  const uniqueJobs = filteredJobs.filter(j => j.tier === 'unique');
  const superiorJobs = filteredJobs.filter(j => j.tier === 'superior');
  const premiumJobs = filteredJobs.filter(j => j.tier === 'premium');
  const normalJobs = filteredJobs.filter(j => j.tier === 'normal');

  // 유니크 슬라이더 자동 재생
  useEffect(() => {
    if (!isAutoPlaying || uniqueJobs.length === 0) return;
    const interval = setInterval(() => {
      setUniqueSlideIndex(prev => (prev + 1) % uniqueJobs.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, uniqueJobs.length]);

  const goToPrevSlide = () => { setUniqueSlideIndex(prev => (prev - 1 + uniqueJobs.length) % uniqueJobs.length); setIsAutoPlaying(false); };
  const goToNextSlide = () => { setUniqueSlideIndex(prev => (prev + 1) % uniqueJobs.length); setIsAutoPlaying(false); };
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) { if (diff > 0) goToNextSlide(); else goToPrevSlide(); }
  };

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

      {/* CSS 애니메이션 */}
      <style jsx global>{`
        @keyframes premiumGlow {
          0%, 100% { box-shadow: 0 0 4px rgba(6, 182, 212, 0.15), inset 0 0 4px rgba(6, 182, 212, 0.05); }
          50% { box-shadow: 0 0 12px rgba(6, 182, 212, 0.25), inset 0 0 8px rgba(6, 182, 212, 0.08); }
        }
        @keyframes premiumBadgeShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes rainbowBorder {
          0% { border-color: #a855f7; }
          25% { border-color: #ec4899; }
          50% { border-color: #8b5cf6; }
          75% { border-color: #d946ef; }
          100% { border-color: #a855f7; }
        }
      `}</style>

      {/* 검색 영역 */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2">
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
                <span className="bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">!</span>
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
                  className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="전체">전체</option>
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
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
                <MapPin className="w-3 h-3" />{selectedRegion}
                <button onClick={() => setSelectedRegion('전체')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedType !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">
                {TYPE_OPTIONS.find((o) => o.value === selectedType)?.label}
                <button onClick={() => setSelectedType('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedTier !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">
                {TIER_OPTIONS.find((o) => o.value === selectedTier)?.label}
                <button onClick={() => setSelectedTier('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedSalary !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">
                {SALARY_OPTIONS.find((o) => o.value === selectedSalary)?.label}
                <button onClick={() => setSelectedSalary('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* 1. 유니크 섹션 - 레인보우 네온 슬라이더 + 그리드 */}
        {/* ============================================ */}
        {uniqueJobs.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-purple-500 fill-purple-500" />
              <h2 className="text-lg font-bold text-gray-900">UNIQUE 광고대행사</h2>
              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-bold">최상위</span>
            </div>

            {/* 유니크 슬라이더 */}
            <div
              className="relative rounded-xl overflow-hidden mb-4"
              style={{ animation: 'rainbowBorder 3s linear infinite', borderWidth: '3px', borderStyle: 'solid' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {uniqueJobs[uniqueSlideIndex % uniqueJobs.length] && (() => {
                const job = uniqueJobs[uniqueSlideIndex % uniqueJobs.length];
                const thumbUrl = job.thumbnail || PLACEHOLDER_THUMBNAILS[parseInt(job.id) % PLACEHOLDER_THUMBNAILS.length];
                return (
                  <Link href={`/sales/jobs/${job.id}`}>
                    <div className="flex flex-col md:flex-row bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900">
                      <div className="relative w-full md:w-1/2 h-48 md:h-64 overflow-hidden">
                        <Image src={thumbUrl} alt={job.title} fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-purple-900/60" />
                        <div className="absolute top-3 left-3">
                          <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">UNIQUE</span>
                        </div>
                        {job.badges.length > 0 && (
                          <div className="absolute bottom-3 left-3 flex gap-1">
                            {job.badges.map(badge => {
                              const bs = BADGE_STYLES[badge];
                              return bs ? (
                                <span key={badge} className={`text-xs px-2 py-0.5 rounded font-bold ${bs.bg} ${bs.text}`}>{bs.label}</span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-4 md:p-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`${TYPE_COLORS[job.type]} text-white text-xs px-2 py-0.5 rounded`}>{TYPE_LABELS[job.type]}</span>
                          <span className="text-white/70 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{job.region}</span>
                        </div>
                        <h3 className="text-lg md:text-xl font-bold mb-2 line-clamp-2">{job.title}</h3>
                        <p className="text-white/80 text-sm mb-3 line-clamp-2">{job.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-purple-500/30 text-purple-300 px-2 py-1 rounded">{SALARY_LABELS[job.salary.type]} {job.salary.amount}</span>
                          {job.benefits.slice(0, 3).map(b => (
                            <span key={b} className="bg-white/10 text-white/80 px-2 py-1 rounded">{b}</span>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-white/60 text-xs">{job.company}</span>
                          <span className="text-purple-400 text-sm font-medium flex items-center gap-1">자세히 보기 <ArrowRight className="w-3 h-3" /></span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })()}
              {uniqueJobs.length > 1 && (
                <>
                  <button onClick={goToPrevSlide} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center text-white">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={goToNextSlide} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center text-white">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {uniqueJobs.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setUniqueSlideIndex(idx); setIsAutoPlaying(false); }}
                        className={`w-2 h-2 rounded-full transition-all ${idx === (uniqueSlideIndex % uniqueJobs.length) ? 'bg-white w-4' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}
              <div className="absolute top-3 right-3">
                <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {(uniqueSlideIndex % uniqueJobs.length) + 1} / {uniqueJobs.length}
                </span>
              </div>
            </div>

            {/* 유니크 그리드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {uniqueJobs.map(job => (
                <JobCard key={job.id} job={job} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* ============================================ */}
        {/* 2. 슈페리어 섹션 - 전용 그리드 */}
        {/* ============================================ */}
        {superiorJobs.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">SUPERIOR</h2>
              <span className="text-xs bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-2 py-0.5 rounded-full font-bold">슈페리어</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {superiorJobs.map(job => (
                <JobCard key={job.id} job={job} variant="card" />
              ))}
            </div>
          </section>
        )}

        {/* ============================================ */}
        {/* 배너 광고 슬롯 */}
        {/* ============================================ */}
        <div className="mb-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-6 text-center border border-gray-300 border-dashed">
          <Megaphone className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">광고 배너 영역</p>
          <p className="text-xs text-gray-400 mt-1">이 자리에 광고를 게재하세요 · 월 200,000원~</p>
          <Link href="/sales/premium" className="inline-flex items-center gap-1 mt-2 text-xs text-purple-600 hover:text-purple-700">
            광고 문의 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* ============================================ */}
        {/* 3. 프리미엄 섹션 - 반짝이 효과 */}
        {/* ============================================ */}
        {premiumJobs.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-500" />
                <h2 className="text-lg font-bold text-gray-900">PREMIUM</h2>
                <span className="text-xs bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-2 py-0.5 rounded-full font-bold">프리미엄</span>
              </div>
              <span className="text-xs text-gray-400">잔여 {Math.max(0, 30 - premiumJobs.length)}슬롯</span>
            </div>

            <div className="space-y-3">
              {premiumJobs.slice(0, 30).map(job => {
                const thumbUrl = job.thumbnail || PLACEHOLDER_THUMBNAILS[parseInt(job.id) % PLACEHOLDER_THUMBNAILS.length];
                return (
                  <Link key={job.id} href={`/sales/jobs/${job.id}`}>
                    <div
                      className="bg-white rounded-xl border border-cyan-200 overflow-hidden hover:shadow-md transition-all group"
                      style={{
                        animation: 'premiumGlow 2s ease-in-out infinite',
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.03) 0%, white 50%, rgba(20, 184, 166, 0.03) 100%)',
                      }}
                    >
                      <div className="flex gap-3 p-3">
                        {/* 썸네일 */}
                        <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          <Image src={thumbUrl} alt={job.title} fill className="object-cover" unoptimized />
                          <div className="absolute top-1 left-1">
                            <span
                              className="text-[10px] font-black px-1.5 py-0.5 rounded text-white"
                              style={{
                                background: 'linear-gradient(90deg, #06b6d4, #14b8a6, #06b6d4)',
                                backgroundSize: '200% auto',
                                animation: 'premiumBadgeShimmer 3s linear infinite',
                              }}
                            >
                              PREMIUM
                            </span>
                          </div>
                        </div>
                        {/* 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${TYPE_COLORS[job.type]} text-white`}>{TYPE_LABELS[job.type]}</span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{job.region}</span>
                            {job.badges.map(badge => {
                              const bs = BADGE_STYLES[badge];
                              return bs ? (
                                <span key={badge} className={`text-[10px] px-1 py-0.5 rounded ${bs.bg} ${bs.text} font-bold`}>{bs.label}</span>
                              ) : null;
                            })}
                          </div>
                          <p className="text-xs text-gray-500 mb-0.5 font-bold">{job.company}</p>
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-purple-600 transition-colors">{job.title}</h3>
                          <div className="flex items-center gap-2 mt-1.5 text-xs">
                            <span className="text-cyan-600 font-bold">{job.salary.amount || '협의'}</span>
                            <span className="text-gray-400">·</span>
                            <span className="text-gray-500">{SALARY_LABELS[job.salary.type]}</span>
                            {job.benefits.slice(0, 2).map(b => (
                              <span key={b} className="text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded text-[10px]">{b}</span>
                            ))}
                          </div>
                        </div>
                        {/* 조회수 */}
                        <div className="flex flex-col items-end justify-between flex-shrink-0">
                          <Eye className="w-3.5 h-3.5 text-gray-300" />
                          <span className="text-[10px] text-gray-400">{job.views.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {premiumJobs.length > 0 && (
              <div className="mt-3 text-center">
                <Link href="/sales/premium" className="text-xs text-cyan-600 hover:text-cyan-700 font-medium">
                  프리미엄 광고 신청하기 (₩4,900/5일) →
                </Link>
              </div>
            )}
          </section>
        )}

        {/* ============================================ */}
        {/* 4. 무료 섹션 - 24시간 만료 */}
        {/* ============================================ */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">일반 공고</h2>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">무료 · 24시간 한정</span>
            </div>
          </div>

          {/* 업그레이드 안내 */}
          <div className="bg-gradient-to-r from-purple-50 to-cyan-50 border border-purple-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <p className="text-xs text-purple-700">
                무료 공고는 24시간 후 자동 만료됩니다. <strong>프리미엄 ₩4,900</strong>으로 5일간 노출하세요 →
              </p>
            </div>
            <Link href="/sales/premium" className="text-xs text-purple-600 font-bold hover:text-purple-800 whitespace-nowrap ml-2">
              업그레이드
            </Link>
          </div>

          {normalJobs.length > 0 ? (
            <div className="space-y-2">
              {normalJobs.map(job => {
                // 24시간 만료 계산
                const now = new Date();
                const createdDate = new Date(job.createdAt.replace(/\./g, '-'));
                const expiryDate = new Date(createdDate.getTime() + 24 * 60 * 60 * 1000);
                const hoursLeft = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)));

                return (
                  <Link key={job.id} href={`/sales/jobs/${job.id}`}>
                    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${TYPE_COLORS[job.type]} text-white`}>{TYPE_LABELS[job.type]}</span>
                            <span className="text-[10px] text-gray-400">{job.region}</span>
                            <span className="text-[10px] text-gray-400">·</span>
                            <span className="text-[10px] text-gray-500">{SALARY_LABELS[job.salary.type]}</span>
                          </div>
                          <h3 className="text-sm text-gray-700 line-clamp-1 group-hover:text-purple-600 transition-colors">{job.title}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{job.company}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          <span className="text-xs text-gray-500">{job.salary.amount || '협의'}</span>
                          <div className="flex items-center gap-1 text-[10px]">
                            {hoursLeft > 0 ? (
                              <span className={`px-1.5 py-0.5 rounded ${hoursLeft <= 6 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                                {hoursLeft}시간 남음
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">만료</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              현재 등록된 무료 공고가 없습니다.
            </div>
          )}
        </section>

        {/* 공고 없을 때 */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-500 text-sm mb-4">다른 검색어나 필터를 시도해보세요</p>
            <button onClick={clearFilters} className="text-purple-600 text-sm font-medium hover:underline">필터 초기화</button>
          </div>
        )}

        {/* 공고 등록 CTA */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 text-center border border-purple-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">분양상담사를 찾고 계신가요?</h3>
          <p className="text-sm text-gray-500 mb-4">무료로 공고를 등록하거나, 프리미엄 상품으로 더 많은 지원자를 받으세요.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sales/jobs/new"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
            >
              <Briefcase className="w-4 h-4" />공고 등록하기
            </Link>
            <Link
              href="/sales/premium"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-purple-300 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition-colors"
            >
              광고 상품 안내 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <MobileNav variant="sales" />
    </div>
  );
}
