'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, MapPin, ArrowRight, TrendingUp, Users, Building2, Briefcase, Star, BarChart3 } from 'lucide-react';
import Header from '@/components/shared/Header';
import MobileNav from '@/components/shared/MobileNav';
import AgentJobCard from '@/components/agent/JobCard';
import type { AgentJobListing } from '@/types';
import { REGIONS } from '@/types';

// 임시 구인 데이터
const sampleJobs: AgentJobListing[] = [
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
    region: '서울 강남',
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
    region: '경기 분당',
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
    region: '서울 관악',
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
    region: '인천 송도',
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
    region: '서울 송파',
    address: '잠실역 인근',
    views: 2341,
    createdAt: '2026.01.15',
  },
];

// 인기 지역 데이터
const popularRegions = [
  { name: '서울 강남', count: 234 },
  { name: '서울 송파', count: 189 },
  { name: '경기 분당', count: 156 },
  { name: '서울 서초', count: 143 },
  { name: '경기 수원', count: 128 },
];

// 통계 데이터
const stats = {
  totalJobs: 1234,
  newToday: 45,
  avgSalary: '280만',
  activeAgents: 5678,
};

export default function AgentMainPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>('전체');
  const [selectedType, setSelectedType] = useState<string>('전체');
  const [isRegionOpen, setIsRegionOpen] = useState(false);

  const premiumJobs = sampleJobs.filter((job) => job.tier === 'premium');
  const normalJobs = sampleJobs.filter((job) => job.tier === 'normal');

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header variant="agent" />

      {/* 히어로 섹션 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            공인중개사 구인구직
          </h1>
          <p className="text-blue-100 mb-6">
            검증된 중개사무소의 채용 정보를 확인하세요
          </p>

          {/* 검색 영역 */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* 지역 선택 */}
            <div className="relative">
              <button
                onClick={() => setIsRegionOpen(!isRegionOpen)}
                className="w-full md:w-40 bg-white text-gray-700 px-4 py-3 rounded-xl flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  {selectedRegion}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isRegionOpen ? 'rotate-180' : ''}`} />
              </button>
              {isRegionOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedRegion('전체'); setIsRegionOpen(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700"
                  >
                    전체
                  </button>
                  {REGIONS.map((region) => (
                    <button
                      key={region}
                      onClick={() => { setSelectedRegion(region); setIsRegionOpen(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700"
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
              className="bg-white text-gray-700 px-4 py-3 rounded-xl md:w-40 focus:outline-none"
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
                placeholder="회사명, 지역으로 검색"
                className="w-full bg-white text-gray-700 placeholder-gray-400 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <button className="bg-white text-blue-600 font-medium px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
              검색
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Briefcase className="w-4 h-4" />
              총 공고
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalJobs.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              오늘 등록
            </div>
            <p className="text-2xl font-bold text-blue-600">+{stats.newToday}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              평균 급여
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.avgSalary}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Users className="w-4 h-4" />
              활성 중개사
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeAgents.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* 메인 콘텐츠 */}
          <div className="md:col-span-2">
            {/* 프리미엄 공고 */}
            {premiumJobs.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-900">PREMIUM 공고</h2>
                  </div>
                  <Link href="/agent/jobs?tier=premium" className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
                    더보기 <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {premiumJobs.map((job) => (
                    <AgentJobCard key={job.id} job={job} />
                  ))}
                </div>
              </section>
            )}

            {/* 일반 공고 */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">최신 공고</h2>
                <Link href="/agent/jobs" className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
                  전체보기 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-4">
                {normalJobs.map((job) => (
                  <AgentJobCard key={job.id} job={job} />
                ))}
              </div>
            </section>
          </div>

          {/* 사이드바 */}
          <div className="hidden md:block space-y-6">
            {/* 인기 지역 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">인기 지역</h3>
              </div>
              <div className="space-y-2">
                {popularRegions.map((region, index) => (
                  <Link
                    key={region.name}
                    href={`/agent/jobs?region=${region.name}`}
                    className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                        index < 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{region.name}</span>
                    </div>
                    <span className="text-sm text-gray-400">{region.count}건</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 맞춤 추천 배너 */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <h3 className="font-bold mb-2">맞춤 공고 추천</h3>
              <p className="text-sm text-blue-100 mb-4">
                프로필을 등록하면 딱 맞는 사무소를 추천해드려요
              </p>
              <Link
                href="/auth/signin"
                className="block text-center bg-white text-blue-600 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                프로필 등록하기
              </Link>
            </div>

            {/* 중개사 커뮤니티 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">중개사 커뮤니티</h3>
              </div>
              <div className="space-y-3">
                <div className="border-b border-gray-100 pb-2">
                  <p className="text-sm text-gray-700 line-clamp-1">강남 재건축 시장 전망은 어떤가요?</p>
                  <span className="text-xs text-gray-400">댓글 23</span>
                </div>
                <div className="border-b border-gray-100 pb-2">
                  <p className="text-sm text-gray-700 line-clamp-1">신입 중개사 연봉 어느정도인가요?</p>
                  <span className="text-xs text-gray-400">댓글 18</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700 line-clamp-1">월세 중개 수수료 협상 팁</p>
                  <span className="text-xs text-gray-400">댓글 31</span>
                </div>
              </div>
              <button className="w-full mt-4 text-sm text-blue-600 hover:underline">
                커뮤니티 가기 →
              </button>
            </div>
          </div>
        </div>
      </main>

      <MobileNav variant="agent" />
    </div>
  );
}
