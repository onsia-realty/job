"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, Plus, Search, MapPin, Calendar, Users, Share2, Home, Briefcase, Heart, User, Filter, TrendingUp, Star } from "lucide-react";

// 임시 공고 데이터 (bunyangline 스타일)
const jobListings = [
  {
    id: 1,
    title: "용인 반도체클러스터 팀원 모집",
    company: "○○분양대행",
    location: "경기 용인시",
    region: "경기",
    type: "아파트",
    commission: "8%",
    deadline: "상시모집",
    salary: "400-600만원",
    tags: ["숙소제공", "즉시투입", "4대보험"],
    badges: ["HOT", "신규"],
    isPremium: true,
    image: "https://placehold.co/400x300/3b82f6/white?text=용인+반도체클러스터",
    views: 1247,
  },
  {
    id: 2,
    title: "광명 뉴타운 팀장급 구인",
    company: "△△컨설팅",
    location: "경기 광명시",
    region: "경기",
    type: "아파트",
    commission: "협의",
    deadline: "12/31까지",
    salary: "협의",
    tags: ["팀장급", "경력우대", "인센티브"],
    badges: ["HOT"],
    isPremium: false,
    image: "https://placehold.co/400x300/0ea5e9/white?text=광명+뉴타운",
    views: 892,
  },
  {
    id: 3,
    title: "송도 지식산업센터 상담사",
    company: "□□부동산",
    location: "인천 연수구",
    region: "인천",
    type: "지산",
    commission: "6%",
    deadline: "1/15까지",
    salary: "300-400만원",
    tags: ["초보가능", "교육제공"],
    badges: ["신규"],
    isPremium: false,
    image: "https://placehold.co/400x300/06b6d4/white?text=송도+지산",
    views: 534,
  },
  {
    id: 4,
    title: "화성 동탄 오피스텔 분양",
    company: "◇◇분양",
    location: "경기 화성시",
    region: "경기",
    type: "오피스텔",
    commission: "7%",
    deadline: "상시모집",
    salary: "350-500만원",
    tags: ["교통비지원", "주말휴무"],
    badges: [],
    isPremium: false,
    image: "https://placehold.co/400x300/0891b2/white?text=동탄+오피스텔",
    views: 421,
  },
  {
    id: 5,
    title: "판교 테크노밸리 상가분양 팀원",
    company: "▽▽마케팅",
    location: "경기 성남시",
    region: "경기",
    type: "상가",
    commission: "5%",
    deadline: "1/20까지",
    salary: "협의",
    tags: ["경력3년이상", "차량소지자"],
    badges: ["HOT", "대박"],
    isPremium: true,
    image: "https://placehold.co/400x300/3b82f6/white?text=판교+상가",
    views: 1583,
  },
  {
    id: 6,
    title: "인천 청라 아파트 분양상담사",
    company: "☆☆건설",
    location: "인천 서구",
    region: "인천",
    type: "아파트",
    commission: "7%",
    deadline: "상시모집",
    salary: "400-550만원",
    tags: ["숙소제공", "식사제공", "신입가능"],
    badges: ["신규"],
    isPremium: false,
    image: "https://placehold.co/400x300/0ea5e9/white?text=청라+아파트",
    views: 678,
  },
];

export default function SalesPage() {
  const [selectedRegion, setSelectedRegion] = useState("전체");
  const [selectedType, setSelectedType] = useState("전체");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  const regions = ["전체", "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종"];
  const propertyTypes = ["전체", "아파트", "오피스텔", "지산", "상가", "숙소제공"];

  const filteredJobs = jobListings.filter(job => {
    if (selectedRegion !== "전체" && job.region !== selectedRegion) return false;
    if (selectedType !== "전체" && job.type !== selectedType) return false;
    return true;
  });

  // 프리미엄 공고 (상단 노출)
  const premiumJobs = filteredJobs.filter(job => job.isPremium);
  const regularJobs = filteredJobs.filter(job => !job.isPremium);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 pb-20">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">부동산 파트너</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span className="text-blue-600 font-medium">구인구직</span>
          </div>
          <Link
            href="/auth/login"
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all"
          >
            로그인
          </Link>
        </div>
      </header>

      {/* 검색 & 필터 섹션 */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              구인공고
            </h1>
            <div className="text-sm text-gray-600">
              총 <span className="font-bold text-blue-600">{filteredJobs.length}</span>개
            </div>
          </div>

          {/* 검색바 */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="현장명, 지역, 회사명 검색"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* 지역 탭 (bunyangline 스타일) */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedRegion === region
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {region}
              </button>
            ))}
          </div>

          {/* 물건 종류 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {propertyTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedType === type
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 공고 등록 버튼 */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Link href="/sales/create">
          <button className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg">
            <Plus className="w-5 h-5" />
            구인공고 등록하기
          </button>
        </Link>
      </div>

      {/* 프리미엄 공고 섹션 (bunyangline 스타일 대형 카드) */}
      {premiumJobs.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <h2 className="text-lg font-bold text-gray-900">프리미엄 공고</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {premiumJobs.map((job) => (
              <Link key={job.id} href={`/sales/${job.id}`}>
                <div className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-2xl transition-all cursor-pointer">
                  {/* 이미지 */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={job.image}
                      alt={job.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* 배지 오버레이 */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {job.badges.map((badge) => (
                        <span
                          key={badge}
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            badge === "HOT" ? "bg-red-500 text-white" :
                            badge === "신규" ? "bg-blue-500 text-white" :
                            badge === "대박" ? "bg-yellow-500 text-white" :
                            "bg-gray-900/70 text-white"
                          }`}
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                    {/* 조회수 */}
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-white text-xs flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {job.views.toLocaleString()}
                    </div>
                  </div>

                  {/* 컨텐츠 */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {job.type}
                      </span>
                      <span className="text-xs text-gray-500">{job.company}</span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-lg mb-3 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{job.deadline}</span>
                        </div>
                        <div className="text-blue-600 font-bold">
                          급여 {job.salary}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 일반 공고 리스트 */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">전체 공고</h2>
          <select className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <option>최신순</option>
            <option>마감임박순</option>
            <option>급여높은순</option>
            <option>조회수순</option>
          </select>
        </div>

        <div className="space-y-3">
          {regularJobs.map((job) => (
            <Link key={job.id} href={`/sales/${job.id}`}>
              <div className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer">
                <div className="flex gap-4 p-4">
                  {/* 썸네일 이미지 (bunyangline 스타일) */}
                  <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                    <img
                      src={job.image}
                      alt={job.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* 배지 */}
                    {job.badges.length > 0 && (
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {job.badges.map((badge) => (
                          <span
                            key={badge}
                            className={`px-2 py-0.5 text-xs font-bold rounded ${
                              badge === "HOT" ? "bg-red-500 text-white" :
                              badge === "신규" ? "bg-blue-500 text-white" :
                              "bg-gray-900/70 text-white"
                            }`}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        {job.type}
                      </span>
                      <span className="text-xs text-gray-500">{job.company}</span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>

                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{job.deadline}</span>
                        </div>
                        <div className="text-blue-600 font-bold">
                          {job.salary}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 flex-wrap">
                        {job.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <button
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                      >
                        <Heart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 더보기 버튼 */}
        {filteredJobs.length > 0 && (
          <div className="mt-8 text-center">
            <button className="px-8 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:border-blue-400 hover:text-blue-600 transition-all">
              더보기
            </button>
          </div>
        )}
      </section>

      {/* 하단 네비게이션 (모바일) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 md:hidden z-50">
        <div className="grid grid-cols-4 py-2">
          <Link href="/" className="flex flex-col items-center py-2 text-gray-400">
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">홈</span>
          </Link>
          <Link href="/sales" className="flex flex-col items-center py-2 text-blue-600">
            <Briefcase className="w-6 h-6" />
            <span className="text-xs mt-1">구인공고</span>
          </Link>
          <Link href="/sales/favorites" className="flex flex-col items-center py-2 text-gray-400">
            <Heart className="w-6 h-6" />
            <span className="text-xs mt-1">관심</span>
          </Link>
          <Link href="/auth/login" className="flex flex-col items-center py-2 text-gray-400">
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">마이</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
