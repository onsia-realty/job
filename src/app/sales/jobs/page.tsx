'use client';

import { useState, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, SlidersHorizontal, X, MapPin, Building2,
  Star, Crown, Sparkles, Clock, ArrowRight, Briefcase,
  Megaphone, AlertCircle, ChevronDown, ChevronRight,
  FileText, Settings, BarChart2,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import MobileNav from '@/components/shared/MobileNav';
import JobCard from '@/components/sales/JobCard';
import BannerCarousel from '@/components/sales/ui/BannerCarousel';
import Badge from '@/components/sales/ui/Badge';
import CommissionChips from '@/components/sales/ui/CommissionChips';
import type { CommissionItem } from '@/components/sales/ui/CommissionChips';
import type { BannerSlide } from '@/components/sales/ui/BannerCarousel';
import type { SalesJobListing, SalesJobType, SalesJobTier, SalaryType, SalesJobBadge } from '@/types';
import { REGIONS } from '@/types';
import { allJobs } from '@/data/salesJobsSample';

// allJobs 샘플은 @/data/salesJobsSample 로 분리. 하위호환 재export:
export { allJobs };

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

const TYPE_LABELS: Record<SalesJobType, string> = {
  apartment: '아파트',
  officetel: '오피스텔',
  store: '상가',
  industrial: '지산',
};

const SALARY_LABELS: Record<SalaryType, string> = {
  commission: '계약수수료',
  base_incentive: '기본급+인센',
  daily: '일급',
};

// 지역 2자 약어 (원형 버튼용)
const REGION_SHORT: Record<string, string> = {
  서울: '서울', 경기: '경기', 인천: '인천', 부산: '부산', 대구: '대구',
  광주: '광주', 대전: '대전', 울산: '울산', 세종: '세종', 강원: '강원',
  충북: '충북', 충남: '충남', 전북: '전북', 전남: '전남', 경북: '경북',
  경남: '경남', 제주: '제주',
};

// 그라디언트 플레이스홀더용 색상 (지역별)
const GRADIENT_THUMB = [
  'from-violet-500 to-blue-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-orange-400 to-rose-500',
];

function thumbnailUrl(job: SalesJobListing): string | null {
  return job.thumbnail ?? null;
}

export default function SalesJobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('전체');
  const [selectedType, setSelectedType] = useState<SalesJobType | 'all'>('all');
  const [selectedTier, setSelectedTier] = useState<SalesJobTier | 'all'>('all');
  const [selectedSalary, setSelectedSalary] = useState<SalaryType | 'all'>('all');
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

  // BannerCarousel 슬라이드 데이터 — UNIQUE 공고에서 추출
  const bannerSlides: BannerSlide[] = uniqueJobs.map((job) => ({
    id: job.id,
    title: job.title,
    subtitle: `${job.company} · ${job.region}`,
    image: job.thumbnail ?? undefined,
    href: `/sales/jobs/${job.id}`,
  }));

  // 사이드바 오늘의 특별현장: unique + superior 상위 3개
  const spotlightJobs = [...uniqueJobs, ...superiorJobs].slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header variant="sales" />

      {/* ── 상단 히어로 검색바 ── */}
      <div className="bg-gradient-to-r from-violet-700 via-violet-600 to-blue-600 pt-4 pb-5">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-white/70 text-xs font-semibold mb-1 tracking-wide uppercase">분양상담사 채용</p>
          <h1 className="text-white text-xl font-extrabold mb-3 leading-tight">
            전국 분양 현장을 한 눈에
          </h1>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-300 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="현장명, 지역, 회사명으로 검색"
                className="w-full bg-white/15 backdrop-blur-sm text-white placeholder-white/50 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`min-w-[48px] px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors ${
                hasActiveFilters
                  ? 'bg-white text-violet-700 shadow-md'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">필터</span>
              {hasActiveFilters && (
                <span className="w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">!</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── 필터 드롭다운 패널 ── */}
      {isFilterOpen && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-gray-400 font-semibold mb-1 block">지역</label>
                <div className="relative">
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 pr-7 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="전체">전체</option>
                    {REGIONS.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 font-semibold mb-1 block">현장유형</label>
                <div className="relative">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as SalesJobType | 'all')}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 pr-7 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 font-semibold mb-1 block">노출등급</label>
                <div className="relative">
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value as SalesJobTier | 'all')}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 pr-7 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {TIER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 font-semibold mb-1 block">급여형태</label>
                <div className="relative">
                  <select
                    value={selectedSalary}
                    onChange={(e) => setSelectedSalary(e.target.value as SalaryType | 'all')}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 pr-7 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {SALARY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 font-medium"
              >
                <X className="w-3.5 h-3.5" />
                필터 초기화
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 결과 카운트 바 (활성 필터 태그) ── */}
      {hasActiveFilters && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-gray-500 font-semibold mr-1">{filteredJobs.length}건</span>
            {selectedRegion !== '전체' && (
              <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-violet-200">
                <MapPin className="w-3 h-3" />{selectedRegion}
                <button onClick={() => setSelectedRegion('전체')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedType !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-violet-200">
                {TYPE_OPTIONS.find((o) => o.value === selectedType)?.label}
                <button onClick={() => setSelectedType('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedTier !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-violet-200">
                {TIER_OPTIONS.find((o) => o.value === selectedTier)?.label}
                <button onClick={() => setSelectedTier('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedSalary !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-violet-200">
                {SALARY_OPTIONS.find((o) => o.value === selectedSalary)?.label}
                <button onClick={() => setSelectedSalary('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="ml-auto text-xs text-gray-400 hover:text-gray-600 font-medium">초기화</button>
          </div>
        </div>
      )}

      {/* ── 2-column layout ── */}
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="lg:flex lg:gap-6 lg:items-start">

          {/* ════════════════════════════════════════
              MAIN COLUMN
          ════════════════════════════════════════ */}
          <div className="flex-1 min-w-0">

            {/* ① 최상단 광고 배너 — BannerCarousel (unique jobs) */}
            {bannerSlides.length > 0 && (
              <div className="mb-5">
                <BannerCarousel slides={bannerSlides} autoPlayMs={4000} glow={false} />
              </div>
            )}

            {/* ② 지역 필터 — 원형 아이콘 가로 스크롤 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-5">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                {/* 전국(ALL) */}
                <RegionCircle
                  label="전국"
                  short="ALL"
                  active={selectedRegion === '전체'}
                  onClick={() => setSelectedRegion('전체')}
                />
                {REGIONS.map((region) => (
                  <RegionCircle
                    key={region}
                    label={region}
                    short={REGION_SHORT[region] ?? region.slice(0, 2)}
                    active={selectedRegion === region}
                    onClick={() => setSelectedRegion(region)}
                  />
                ))}
                {/* 상세 필터 버튼 */}
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex flex-col items-center gap-1 flex-shrink-0 min-w-[52px]"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isFilterOpen ? 'bg-violet-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}>
                    <SlidersHorizontal className={`w-4 h-4 ${isFilterOpen ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">상세</span>
                </button>
              </div>
            </div>

            {/* ③ 프리미엄 대표 현장 — UNIQUE 수평 썸네일 카드 */}
            {uniqueJobs.length > 0 && (
              <section className="mb-7">
                <SectionHeader
                  icon={<Star className="w-3.5 h-3.5 fill-white" />}
                  iconBg="bg-tier-unique"
                  title="프리미엄 대표 현장"
                  tierLabel="UNIQUE"
                  tierBg="bg-tier-unique"
                  actionHref="/sales/premium"
                  actionLabel="상품안내"
                />
                <div className="space-y-3">
                  {uniqueJobs.map((job) => (
                    <UniqueHorizontalCard key={job.id} job={job} />
                  ))}
                </div>
              </section>
            )}

            {/* ④ 추천 현장 — SUPERIOR 4-column grid */}
            {superiorJobs.length > 0 && (
              <section className="mb-7">
                <SectionHeader
                  icon={<Crown className="w-3.5 h-3.5" />}
                  iconBg="bg-tier-superior"
                  title="추천 현장"
                  tierLabel="SUPERIOR"
                  tierBg="bg-tier-superior"
                />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {superiorJobs.map((job) => (
                    <JobCard key={job.id} job={job} variant="compact" />
                  ))}
                </div>
              </section>
            )}

            {/* ⑤ 광고대행사 오렌지 배너 (PRESERVED VERBATIM) */}
            <div className="mb-7 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-extrabold text-sm mb-0.5">광고대행사</p>
                      <p className="text-white/90 text-sm font-semibold">분양상담사에게 직접 광고하세요!</p>
                      <p className="text-white/80 text-xs mt-0.5">LMS · 유튜브 · SNS 등 다양한 채널</p>
                    </div>
                  </div>
                  <Link
                    href="/sales/premium"
                    className="inline-flex items-center gap-1.5 bg-white text-orange-600 text-xs font-bold px-4 py-2.5 rounded-xl transition-all hover:shadow-md whitespace-nowrap"
                  >
                    상품안내 <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* ⑥ 적극 채용 중인 공고 — PREMIUM 2-column grid */}
            {premiumJobs.length > 0 && (
              <section className="mb-7">
                <SectionHeader
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  iconBg="bg-tier-premium"
                  title="적극 채용 중인 공고"
                  tierLabel="PREMIUM"
                  tierBg="bg-tier-premium"
                  extra={<span className="text-xs text-gray-400 ml-auto">잔여 {Math.max(0, 30 - premiumJobs.length)}슬롯</span>}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {premiumJobs.map((job) => (
                    <JobCard key={job.id} job={job} variant="card" />
                  ))}
                </div>
                <div className="mt-3 text-center">
                  <Link href="/sales/premium" className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold">
                    프리미엄 광고 신청하기 (₩4,900/5일) →
                  </Link>
                </div>
              </section>
            )}

            {/* ⑦ 핵심 공고 (무료) — NORMAL 리스트 + 24h 카운트다운 */}
            <section className="mb-7">
              <SectionHeader
                icon={<Clock className="w-3.5 h-3.5" />}
                iconBg="bg-gray-300"
                iconColor="text-gray-500"
                title="핵심 공고 (무료)"
                extra={
                  <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-2">무료 · 24시간</span>
                }
              />

              {/* 업그레이드 안내 */}
              <div className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200 rounded-xl p-3 mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-violet-500 flex-shrink-0" />
                  <p className="text-xs text-violet-700">
                    무료 공고는 24시간 후 자동 만료됩니다.{' '}
                    <strong>프리미엄 ₩4,900</strong>으로 5일간 노출하세요 →
                  </p>
                </div>
                <Link href="/sales/premium" className="text-xs text-violet-700 font-bold hover:text-violet-900 whitespace-nowrap">
                  업그레이드
                </Link>
              </div>

              {normalJobs.length > 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
                  {normalJobs.map((job) => {
                    // 24시간 만료 계산
                    const now = new Date();
                    const createdDate = new Date(job.createdAt.replace(/\./g, '-'));
                    const expiryDate = new Date(createdDate.getTime() + 24 * 60 * 60 * 1000);
                    const hoursLeft = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)));

                    return (
                      <Link key={job.id} href={`/sales/jobs/${job.id}`}>
                        <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group">
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center flex-wrap gap-1.5 mb-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-600">{TYPE_LABELS[job.type]}</span>
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />{job.region}
                              </span>
                              <span className="text-[10px] text-gray-300">·</span>
                              <span className="text-[10px] text-gray-400">{SALARY_LABELS[job.salary.type]}</span>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-violet-700 transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">{job.company}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs font-semibold text-gray-700">{job.salary.amount || '협의'}</span>
                            <div className="text-[10px]">
                              {hoursLeft > 0 ? (
                                <span className={`px-1.5 py-0.5 rounded-md font-semibold ${hoursLeft <= 6 ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                  <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                                  {hoursLeft}시간
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-400 font-semibold">만료</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 text-sm rounded-2xl border border-dashed border-gray-200">
                  현재 등록된 무료 공고가 없습니다.
                </div>
              )}
            </section>

            {/* ── 검색 결과 없음 ── */}
            {filteredJobs.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-violet-300" />
                </div>
                <h3 className="text-base font-bold text-gray-700 mb-2">검색 결과가 없습니다</h3>
                <p className="text-sm text-gray-400 mb-4">다른 검색어나 필터를 시도해보세요</p>
                <button
                  onClick={clearFilters}
                  className="text-violet-600 text-sm font-semibold hover:underline"
                >
                  필터 초기화
                </button>
              </div>
            )}

            {/* ── 공고 등록 CTA ── */}
            <div className="mt-2 mb-8 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-blue-50 p-6 text-center">
              <h3 className="text-base font-extrabold text-gray-800 mb-1.5">분양상담사를 찾고 계신가요?</h3>
              <p className="text-sm text-gray-400 mb-5">무료로 공고를 등록하거나, 프리미엄 상품으로 더 많은 지원자를 받으세요.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/sales/jobs/new"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-colors"
                >
                  <Briefcase className="w-4 h-4" />공고 등록하기
                </Link>
                <Link
                  href="/sales/premium"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-violet-200 text-violet-700 rounded-xl font-semibold hover:bg-violet-50 transition-colors"
                >
                  광고 상품 안내 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════
              RIGHT SIDEBAR (desktop only)
          ════════════════════════════════════════ */}
          <aside className="hidden lg:block w-[300px] shrink-0 lg:sticky lg:top-20 space-y-4 self-start">

            {/* 제휴/광고 카드 */}
            <div className="rounded-2xl overflow-hidden border border-orange-100 shadow-sm">
              <div className="bg-gradient-to-br from-orange-500 to-amber-400 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-extrabold text-sm">광고대행사</span>
                </div>
                <p className="text-white/90 text-xs leading-relaxed mb-3">
                  분양상담사에게 직접 광고하세요!<br />
                  LMS · 유튜브 · SNS 등 다양한 채널로 최대 노출
                </p>
                <Link
                  href="/sales/premium"
                  className="flex items-center justify-center gap-1 bg-white text-orange-600 text-xs font-bold px-4 py-2 rounded-lg hover:shadow-md transition-all"
                >
                  제휴 문의하기 <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* 오늘의 특별현장 */}
            {spotlightJobs.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 pt-4 pb-2 border-b border-gray-100">
                  <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    오늘의 특별현장
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {spotlightJobs.map((job) => (
                    <SidebarSpotCard key={job.id} job={job} />
                  ))}
                </div>
              </div>
            )}

            {/* 구인 메뉴 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-2 border-b border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-800">구인 메뉴</h3>
              </div>
              <nav className="divide-y divide-gray-50">
                {[
                  { href: '/sales/jobs/new', label: '구인공고 등록', icon: <Briefcase className="w-4 h-4 text-violet-500" /> },
                  { href: '/sales/mypage', label: '내 공고 연장하기', icon: <Clock className="w-4 h-4 text-blue-500" /> },
                  { href: '/sales/premium', label: '광고 상품 안내', icon: <BarChart2 className="w-4 h-4 text-orange-500" /> },
                  { href: '/sales/mypage', label: '내 구인공고 관리', icon: <Settings className="w-4 h-4 text-gray-500" /> },
                ].map(({ href, label, icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <span className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-white flex items-center justify-center flex-shrink-0 transition-colors">
                      {icon}
                    </span>
                    <span className="text-sm text-gray-700 font-medium flex-1">{label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </Link>
                ))}
              </nav>
            </div>

            {/* 공고 등록 작은 CTA */}
            <div className="bg-gradient-to-br from-violet-600 to-blue-600 rounded-2xl p-4 text-center">
              <FileText className="w-7 h-7 text-white/80 mx-auto mb-2" />
              <p className="text-white font-extrabold text-sm mb-0.5">내 현장 공고 등록</p>
              <p className="text-white/70 text-xs mb-3">무료로 시작하고 프리미엄으로 업그레이드</p>
              <Link
                href="/sales/jobs/new"
                className="block bg-white text-violet-700 text-xs font-bold px-4 py-2 rounded-lg hover:shadow-md transition-all"
              >
                무료 공고 등록
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* ── 푸터 사업자 정보 ── */}
      <footer className="bg-white border-t border-gray-200 mt-4">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
            <Link href="/terms" className="hover:text-violet-600">이용약관</Link>
            <Link href="/privacy" className="hover:text-violet-600 font-semibold text-gray-600">개인정보처리방침</Link>
            <Link href="/refund" className="hover:text-violet-600">환불정책</Link>
            <a href="mailto:onsia777@gmail.com" className="hover:text-violet-600">문의하기</a>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p>온시아 공인중개사ㅣ대표이사: 연대겸ㅣ사업자등록번호: 846-23-01501</p>
            <p>주소: 서울특별시 송파구 중대로 197, 3동 305층 A169(가락동)ㅣ대표전화: <a href="tel:1555-1245" className="hover:text-violet-600">1555-1245</a></p>
            <p>업태: 정보통신업ㅣ종목: 소프트웨어 개발 및 공급업, 포털 및 인터넷 정보 매개 서비스업</p>
            <p className="mt-2">© {new Date().getFullYear()} BOOIN Corp. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <MobileNav variant="sales" />
    </div>
  );
}

// ─────────────────────────────────────────
// 헬퍼 컴포넌트들
// ─────────────────────────────────────────

/** 섹션 헤더 (아이콘 + 제목 + 티어 뱃지 + 액션 링크) */
function SectionHeader({
  icon,
  iconBg,
  iconColor = 'text-white',
  title,
  tierLabel,
  tierBg,
  actionHref,
  actionLabel,
  extra,
}: {
  icon: ReactNode;
  iconBg: string;
  iconColor?: string;
  title: string;
  tierLabel?: string;
  tierBg?: string;
  actionHref?: string;
  actionLabel?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`flex items-center justify-center w-6 h-6 rounded-full ${iconBg} ${iconColor}`}>
        {icon}
      </span>
      <h2 className="text-base font-extrabold text-gray-800">{title}</h2>
      {tierLabel && tierBg && (
        <span className={`text-xs font-bold ${tierBg} text-white px-2 py-0.5 rounded-full`}>{tierLabel}</span>
      )}
      {extra}
      {actionHref && actionLabel && (
        <Link href={actionHref} className="ml-auto text-xs text-gray-400 hover:text-violet-600 font-medium flex items-center gap-0.5">
          {actionLabel} <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

/** 원형 지역 필터 버튼 */
function RegionCircle({
  label,
  short,
  active,
  onClick,
}: {
  label: string;
  short: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 flex-shrink-0 min-w-[52px] group"
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          active
            ? 'bg-gradient-to-br from-violet-600 to-blue-600 ring-2 ring-offset-1 ring-violet-400 shadow-md'
            : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        {active ? (
          <span className="text-[11px] font-extrabold text-white">{short}</span>
        ) : (
          <span className="text-[11px] font-semibold text-gray-500">{short}</span>
        )}
      </div>
      <span className={`text-[10px] whitespace-nowrap font-medium transition-colors ${
        active ? 'text-violet-700' : 'text-gray-500'
      }`}>
        {label}
      </span>
    </button>
  );
}

/** UNIQUE 티어 — 썸네일 좌측 수평 카드 */
function UniqueHorizontalCard({ job }: { job: SalesJobListing }) {
  const thumb = thumbnailUrl(job);
  const gradientIdx = parseInt(job.id) % GRADIENT_THUMB.length;
  const commissionItems: CommissionItem[] = [{ position: job.position, amount: job.salary.amount }];

  return (
    <Link href={`/sales/jobs/${job.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group flex">
        {/* 썸네일 — 128px 고정 */}
        <div className="relative w-32 flex-shrink-0 overflow-hidden">
          {thumb ? (
            <Image
              src={thumb}
              alt={job.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="128px"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENT_THUMB[gradientIdx]} flex items-center justify-center`}>
              <Building2 className="w-10 h-10 text-white/60" />
            </div>
          )}
          {/* 티어 오버레이 */}
          <div className="absolute top-2 left-2">
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-tier-unique text-white leading-none">UNIQUE</span>
          </div>
        </div>

        {/* 정보 영역 */}
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Badge variant="type" value={job.type} size="sm" />
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />{job.region}
              </span>
              {job.badges.map((b) => (
                <Badge key={b} variant="badge" value={b as SalesJobBadge} size="sm" />
              ))}
            </div>
            <h3 className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-violet-700 transition-colors mb-0.5">
              {job.title}
            </h3>
            <p className="text-xs text-gray-400 line-clamp-1">{job.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <CommissionChips items={commissionItems} dense />
            {job.benefits.slice(0, 1).map((b) => (
              <span key={b} className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-md font-semibold">{b}</span>
            ))}
            <span className="ml-auto text-[10px] text-gray-400 hidden sm:inline">{job.company}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** 사이드바 오늘의 특별현장 카드 */
function SidebarSpotCard({ job }: { job: SalesJobListing }) {
  const thumb = thumbnailUrl(job);
  const gradientIdx = parseInt(job.id) % GRADIENT_THUMB.length;

  return (
    <Link href={`/sales/jobs/${job.id}`}>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
        {/* 미니 썸네일 */}
        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
          {thumb ? (
            <Image
              src={thumb}
              alt={job.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="48px"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENT_THUMB[gradientIdx]} flex items-center justify-center`}>
              <Building2 className="w-5 h-5 text-white/70" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-violet-700 transition-colors">
            {job.title}
          </h4>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />{job.region}
            </span>
            <span className="text-[10px] text-gray-300">·</span>
            <span className="text-[10px] font-semibold text-violet-600">{job.salary.amount ?? '협의'}</span>
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
      </div>
    </Link>
  );
}
