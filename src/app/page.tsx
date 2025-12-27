"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2, Newspaper, Video, Users, Briefcase,
  ArrowRight, Home, Play, TrendingUp, MapPin,
  Sparkles, Zap, Brain, Bell, Search, Star, Plus,
  Calendar, Heart, User
} from "lucide-react";

type Tab = "home" | "jobs" | "news" | "videos" | "community";

// 임시 공고 데이터 (분양라인 스타일)
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

export default function MainPage() {
  const [activeTab, setActiveTab] = useState<Tab>("jobs");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        {/* 상단 네비게이션 - 모바일에서 숨김 */}
        <div className="hidden md:block bg-gradient-to-r from-blue-600 to-cyan-600">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-end gap-3">
              <Link href="/auth/login" className="text-white text-sm font-semibold hover:bg-white/20 transition-all flex items-center gap-1 px-3 py-2 rounded-lg border border-white/30 hover:border-white/50">
                로그인
              </Link>
              <Link href="/contact" className="text-white text-sm font-semibold hover:bg-white/20 transition-all flex items-center gap-2 group px-3 py-2 rounded-lg border border-white/30 hover:border-white/50">
                <span className="hidden lg:inline">중개사무소 가입 및 상품문의</span>
                <span className="lg:hidden">문의</span>
                <div className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                  <svg width="28" height="28" fill="none" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path vectorEffect="non-scaling-stroke" stroke="#ffffff" strokeWidth="1.8" d="m11.375 19.95 5.682-5.682a.131.131 0 0 0 0-.186L11.375 8.4"></path>
                    <circle vectorEffect="non-scaling-stroke" cx="14" cy="14" r="12" stroke="#ffffff" strokeWidth="1.8"></circle>
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* 메인 헤더 with 배경 이미지 */}
        <div className="relative overflow-hidden">
          {/* 배경 이미지 */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/onsia__Panoramic_night_view_of_Industry_4.0_real_estate_hub_w_01a129d4-b385-471a-b707-bfa67a021a9d_1.png')",
            }}
          ></div>
          {/* 살짝만 어둡게 */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 z-10"></div>

          {/* 컨텐츠 */}
          <div className="relative z-20 max-w-7xl mx-auto px-4 py-8 md:py-20 lg:py-28">
            <div className="flex items-center justify-between">
              {/* 로고 & 타이틀 */}
              <Link href="/" className="flex items-center gap-2 md:gap-4 group">
                <div className="w-10 h-10 md:w-16 md:h-16 bg-black/30 backdrop-blur-sm border-2 border-white/50 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl group-hover:bg-black/40 transition-all">
                  <Building2 className="w-5 h-5 md:w-10 md:h-10 text-white" />
                </div>
                <div>
                  <h1 className="font-black text-lg md:text-3xl lg:text-4xl xl:text-5xl text-white leading-tight" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                    부동산 일자리는 온시아로
                  </h1>
                  <p className="hidden md:block text-sm md:text-base lg:text-lg text-white mt-1 md:mt-2" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                    공인중개사부터 분양상담사까지
                  </p>
                </div>
              </Link>

              {/* 우측 버튼 */}
              <div className="flex items-center gap-2 md:gap-3">
                <button className="p-2 md:p-3 bg-black/30 backdrop-blur-sm hover:bg-black/40 border border-white/50 rounded-lg md:rounded-xl transition-all relative">
                  <Bell className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  <span className="absolute top-1 right-1 md:top-2 md:right-2 w-2 h-2 md:w-2.5 md:h-2.5 bg-cyan-400 rounded-full animate-pulse"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 - 데스크톱에서만 표시 */}
      <nav className="hidden md:block sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-3">
            <TabButton
              active={activeTab === "jobs"}
              onClick={() => setActiveTab("jobs")}
              icon={<Briefcase className="w-4 h-4" />}
            >
              구인구직
            </TabButton>
            <TabButton
              active={activeTab === "home"}
              onClick={() => setActiveTab("home")}
              icon={<Home className="w-4 h-4" />}
            >
              홈
            </TabButton>
            <TabButton
              active={activeTab === "news"}
              onClick={() => setActiveTab("news")}
              icon={<Newspaper className="w-4 h-4" />}
            >
              뉴스
            </TabButton>
            <TabButton
              active={activeTab === "videos"}
              onClick={() => setActiveTab("videos")}
              icon={<Video className="w-4 h-4" />}
            >
              AI 영상
            </TabButton>
            <TabButton
              active={activeTab === "community"}
              onClick={() => setActiveTab("community")}
              icon={<Users className="w-4 h-4" />}
            >
              커뮤니티
            </TabButton>
          </div>
        </div>
      </nav>

      {/* 탭 콘텐츠 */}
      <main className="pb-24 md:pb-8">
        {activeTab === "home" && <HomeTab />}
        {activeTab === "jobs" && <JobsTab />}
        {activeTab === "news" && <NewsTab />}
        {activeTab === "videos" && <VideosTab />}
        {activeTab === "community" && <CommunityTab />}
      </main>

      {/* 하단 네비게이션 (모바일) */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-white/90 backdrop-blur-lg border-t border-gray-200">
        <div className="grid grid-cols-5 px-2">
          <MobileNavButton
            active={activeTab === "home"}
            onClick={() => setActiveTab("home")}
            icon={<Home className="w-5 h-5" />}
            label="홈"
          />
          <MobileNavButton
            active={activeTab === "jobs"}
            onClick={() => setActiveTab("jobs")}
            icon={<Briefcase className="w-5 h-5" />}
            label="구인구직"
          />
          <MobileNavButton
            active={activeTab === "news"}
            onClick={() => setActiveTab("news")}
            icon={<Newspaper className="w-5 h-5" />}
            label="뉴스"
          />
          <MobileNavButton
            active={activeTab === "videos"}
            onClick={() => setActiveTab("videos")}
            icon={<Video className="w-5 h-5" />}
            label="영상"
          />
          <MobileNavButton
            active={activeTab === "community"}
            onClick={() => setActiveTab("community")}
            icon={<Users className="w-5 h-5" />}
            label="커뮤니티"
          />
        </div>
      </nav>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

// 탭 버튼 컴포넌트
function TabButton({
  active,
  onClick,
  icon,
  children
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-sm whitespace-nowrap rounded-xl transition-all ${
        active
          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/30"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

// 모바일 네비게이션 버튼
function MobileNavButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center py-3 transition-all ${
        active ? "text-cyan-600" : "text-gray-400"
      }`}
    >
      <div className={active ? "transform scale-110" : ""}>
        {icon}
      </div>
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );
}

// 홈 탭
function HomeTab() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-8 md:space-y-12">
      {/* 히어로 섹션 */}
      <section className="text-center py-8 md:py-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-50 rounded-full border border-blue-100 mb-4 md:mb-6">
          <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-cyan-600" />
          <span className="text-xs md:text-sm text-gray-700 font-medium">AI 기반 부동산 구인구직 플랫폼</span>
        </div>
        <h1 className="text-3xl md:text-5xl lg:text-7xl font-black mb-4 md:mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent leading-tight">
          당신의 커리어를<br />AI가 설계합니다
        </h1>
        <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
          부동산 전문가를 위한 스마트한 구인구직 · 실시간 뉴스 · AI 콘텐츠
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 px-4">
          <button className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:scale-105">
            지금 시작하기
          </button>
          <button className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-white text-gray-700 font-bold rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
            더 알아보기
          </button>
        </div>
      </section>

      {/* 실시간 뉴스 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">실시간 부동산 뉴스</h2>
              <p className="text-sm text-gray-600">AI가 요약한 최신 소식</p>
            </div>
          </div>
          <Link href="#" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1">
            더보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="group cursor-pointer bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex-shrink-0 flex items-center justify-center">
                  <Newspaper className="w-10 h-10 text-cyan-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-semibold">정책</span>
                    <span className="text-xs text-gray-500">5분 전</span>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-cyan-700 transition-colors line-clamp-2">
                    2025년 전월세 대책 발표 - AI 요약본
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Brain className="w-3 h-3 text-cyan-600" />
                    <span className="text-xs text-cyan-700">AI 분석 완료</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI 영상 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI 숏폼 영상</h2>
              <p className="text-sm text-gray-600">60초로 보는 핵심 정보</p>
            </div>
          </div>
          <Link href="#" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1">
            더보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="cursor-pointer group">
              <div className="aspect-[9/16] bg-gradient-to-br from-blue-200 to-cyan-200 rounded-2xl overflow-hidden relative border border-gray-200 hover:border-cyan-400 hover:shadow-lg transition-all">
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/5 transition-all">
                  <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Play className="w-6 h-6 text-cyan-600 ml-1" />
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <div className="bg-cyan-500 rounded-lg px-2 py-1 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-white" />
                    <span className="text-xs text-white font-bold">AI</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-800 mt-2 line-clamp-2 font-medium">
                부동산 세금 꿀팁
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 급구 공고 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">급구 공고</h2>
              <p className="text-sm text-gray-600">지금 바로 지원하세요</p>
            </div>
          </div>
          <Link href="#" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1">
            더보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: "강남 분양상담사 급구", location: "서울 강남", type: "분양상담사", badge: "급구", color: "red" },
            { title: "중개사무소 공인중개사 구함", location: "서울 송파", type: "공인중개사", badge: "마감임박", color: "orange" },
            { title: "신축 분양현장 상담사", location: "경기 성남", type: "분양상담사", badge: "급구", color: "red" },
            { title: "부동산 공인중개사", location: "서울 서초", type: "공인중개사", badge: "신규", color: "blue" },
          ].map((job, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-cyan-300 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                  job.color === "red" ? "bg-red-100 text-red-700" :
                  job.color === "orange" ? "bg-orange-100 text-orange-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {job.badge}
                </span>
                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{job.type}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-3 group-hover:text-cyan-700 transition-colors">{job.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                {job.location}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// 구인구직 탭 (카테고리 선택)
function JobsTab() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-12">
      {/* 실시간 통계 배너 */}
      <div className="mb-6 md:mb-8 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-xs opacity-90">오늘 신규</span>
            </div>
            <div className="text-xl md:text-2xl font-black">23건</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-xs opacity-90">온라인</span>
            </div>
            <div className="text-xl md:text-2xl font-black">156명</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-xs opacity-90">급구 공고</span>
            </div>
            <div className="text-xl md:text-2xl font-black">8건</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-xs opacity-90">이번주 채용</span>
            </div>
            <div className="text-xl md:text-2xl font-black">34명</div>
          </div>
        </div>
      </div>

      <div className="text-center mb-8 md:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-50 rounded-full border border-blue-100 mb-3 md:mb-4">
          <Briefcase className="w-3 h-3 md:w-4 md:h-4 text-cyan-600" />
          <span className="text-xs md:text-sm text-gray-700 font-medium">구인구직</span>
        </div>
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent px-4">
          어떤 일을 찾으시나요?
        </h1>
        <p className="text-sm md:text-base text-gray-600 px-4">AI가 맞춤형 일자리를 추천해드립니다</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-12">
        {/* 공인중개사 */}
        <Link href="/sales?type=agent">
          <div className="group cursor-pointer relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-[1.01]">
            {/* 배경 패턴 */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>

            <div className="relative p-5">
              {/* 아이콘 */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-3 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all shadow-lg group-hover:rotate-3 duration-300">
                <Building2 className="w-8 h-8 text-white" />
              </div>

              {/* 제목 */}
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-1">공인중개사</h3>
              <p className="text-gray-600 mb-4 text-sm">중개사무소 · 부동산 전문가</p>

              {/* 통계 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                  <div className="text-xs text-gray-600 mb-1">채용 공고</div>
                  <div className="text-xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    123건
                  </div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                  <div className="text-xs text-gray-600 mb-1">평균 연봉</div>
                  <div className="text-xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    4,200만
                  </div>
                </div>
              </div>

              {/* 인기 지역 태그 */}
              <div className="mb-4">
                <div className="text-xs text-gray-600 mb-1.5 font-semibold">인기 지역</div>
                <div className="flex flex-wrap gap-1.5">
                  {['강남', '서초', '송파'].map((region) => (
                    <span key={region} className="bg-white/80 text-gray-700 text-xs px-2.5 py-1 rounded-lg border border-gray-200 font-medium">
                      {region}
                    </span>
                  ))}
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="flex items-center justify-between pt-3 border-t border-blue-200/50">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">34명 온라인</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600 font-bold text-sm">
                  <span>바로가기</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* 분양상담사 */}
        <Link href="/sales?type=sales">
          <div className="group cursor-pointer relative overflow-hidden bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 transform hover:scale-[1.01]">
            {/* 배경 패턴 */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-600/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>

            <div className="relative p-5">
              {/* 아이콘 */}
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-2xl flex items-center justify-center mb-3 group-hover:shadow-xl group-hover:shadow-cyan-500/30 transition-all shadow-lg group-hover:rotate-3 duration-300">
                <Briefcase className="w-8 h-8 text-white" />
              </div>

              {/* 제목 */}
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-1">분양상담사</h3>
              <p className="text-gray-600 mb-4 text-sm">분양현장 · 프로젝트 전문</p>

              {/* 통계 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                  <div className="text-xs text-gray-600 mb-1">채용 공고</div>
                  <div className="text-xl font-black bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                    45건
                  </div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                  <div className="text-xs text-gray-600 mb-1">평균 수수료</div>
                  <div className="text-xl font-black bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                    7.2%
                  </div>
                </div>
              </div>

              {/* 인기 프로젝트 태그 */}
              <div className="mb-4">
                <div className="text-xs text-gray-600 mb-1.5 font-semibold">인기 프로젝트</div>
                <div className="flex flex-wrap gap-1.5">
                  {['용인 반도체', '광명 뉴타운'].map((project) => (
                    <span key={project} className="bg-white/80 text-gray-700 text-xs px-2.5 py-1 rounded-lg border border-gray-200 font-medium">
                      {project}
                    </span>
                  ))}
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="flex items-center justify-between pt-3 border-t border-cyan-200/50">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">18명 온라인</span>
                </div>
                <div className="flex items-center gap-1 text-cyan-600 font-bold text-sm">
                  <span>바로가기</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* 비디오/이미지 섹션 (직방 스타일 - 전체 너비) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-12 w-full max-w-full">
        {/* 왼쪽: 영상 (2/3) */}
        <video
          src="https://vizeo.zigbang.com/custom/gateway_left_video_ad.mp4"
          poster="https://s.zigbang.com/zigbang-www/_next/static/2025_zigbang_cf_30sec_thumbnail-fede43804b9bfaeedaf7c08140575a10.jpg"
          autoPlay
          muted
          loop
          playsInline
          className="w-full rounded-lg cursor-pointer md:col-span-2"
          style={{ height: '250px', objectFit: 'cover' }}
        />

        {/* 오른쪽: 이미지 (1/3) */}
        <img
          src="https://s.zigbang.com/zigbang-www/_next/static/img_webpromo_join_255-ef58d02199e9ca86134f6a74b06a802a.jpg"
          alt="광고"
          className="w-full rounded-lg cursor-pointer object-cover md:col-span-1"
          style={{ height: '250px' }}
        />
      </div>

      {/* 부동산 뉴스 */}
      <div className="mb-8 md:mb-12">
        {/* 헤더 */}
        <div className="text-center mb-6 md:mb-8 px-4">
          <h3 className="text-xl md:text-2xl lg:text-3xl font-normal text-gray-900 mb-2">
            발빠르게 전달하는 <span className="font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">부동산 뉴스</span>
          </h3>
          <p className="text-sm md:text-base text-gray-600">
            부동산 동향을 요점만 정리해서 알려드려요
          </p>
        </div>

        {/* 뉴스 리스트 */}
        <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
          {[
            { title: "2026년 전국 아파트 입주물량 17만 여 세대, 전년 대비 28% '감소'", date: "2025.12.22" },
            { title: "10·15대책 이후 서울 오피스텔 거래량 32% 증가", date: "2025.12.16" },
            { title: "2026년 분양예정인 LH 수도권 공공분양 단지는?", date: "2025.12.08" },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl md:rounded-2xl px-4 md:px-6 py-4 md:py-5 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
                <h4 className="flex-1 text-sm md:text-base lg:text-lg font-semibold text-gray-900 group-hover:text-cyan-600 transition-colors leading-relaxed">
                  {item.title}
                </h4>
                <span className="text-xs md:text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
                  {item.date}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 광고 배너 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8 w-full">
          {/* 광고 배너 1 */}
          <div className="cursor-pointer group relative overflow-hidden rounded-xl md:rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all">
            <video
              src="https://vizeo.zigbang.com/custom/gateway_left_video_ad.mp4"
              poster="https://s.zigbang.com/zigbang-www/_next/static/2025_zigbang_cf_30sec_thumbnail-fede43804b9bfaeedaf7c08140575a10.jpg"
              autoPlay
              muted
              loop
              playsInline
              className="w-full rounded-xl"
              style={{ height: '200px', objectFit: 'cover' }}
            />
            <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-blue-600 text-white text-xs font-bold px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg">
              SPONSORED
            </div>
          </div>

          {/* 광고 배너 2 */}
          <div className="cursor-pointer group relative overflow-hidden rounded-xl md:rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all">
            <img
              src="https://s.zigbang.com/zigbang-www/_next/static/img_webpromo_join_255-ef58d02199e9ca86134f6a74b06a802a.jpg"
              alt="광고 배너"
              className="w-full rounded-xl object-cover"
              style={{ height: '200px' }}
            />
            <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-cyan-600 text-white text-xs font-bold px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg">
              PROMOTION
            </div>
          </div>
        </div>

        {/* 더보기 버튼 */}
        <div className="flex justify-center px-4">
          <button className="w-full md:w-auto group bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl md:rounded-2xl px-6 md:px-8 py-4 md:py-6 transition-all hover:shadow-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="text-sm md:text-base text-gray-700 text-center">
                더 많은{' '}
                <span className="font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  부동산 뉴스
                </span>
                <br />
                보러가기
              </div>
              <div className="flex items-center gap-1 text-cyan-600 group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 -ml-2 md:-ml-3" />
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 -ml-2 md:-ml-3" />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="text-center">
        <div className="inline-flex flex-col items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 px-8 py-6 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-600" />
            <span className="font-bold text-gray-900">AI 맞춤 추천 서비스</span>
          </div>
          <p className="text-sm text-gray-600">로그인하시면 당신에게 딱 맞는 일자리를 AI가 찾아드립니다</p>
          <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all">
            지금 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

// 뉴스 탭
function NewsTab() {
  const newsItems = [
    { title: "2026년 전국 아파트 입주물량 17만 여 세대, 전년 대비 28% '감소'", date: "2025.12.22" },
    { title: "10·15대책 이후 서울 오피스텔 거래량 32% 증가", date: "2025.12.16" },
    { title: "2026년 분양예정인 LH 수도권 공공분양 단지는?", date: "2025.12.08" },
    { title: "강남 재건축 시장, 2025년 본격 시동", date: "2025.12.05" },
    { title: "정부, 청년 주거지원 정책 확대 발표", date: "2025.12.01" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
      {/* 헤더 */}
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-normal text-gray-900 mb-2 md:mb-3 px-4">
          발빠르게 전달하는 <span className="font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">부동산 뉴스</span>
        </h1>
        <p className="text-sm md:text-lg lg:text-xl text-gray-600 px-4">
          부동산 동향을 요점만 정리해서 알려드려요
        </p>
      </div>

      {/* 뉴스 리스트 */}
      <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
        {newsItems.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-xl md:rounded-2xl px-4 md:px-6 py-4 md:py-5 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
              <h3 className="flex-1 text-sm md:text-base lg:text-lg font-semibold text-gray-900 group-hover:text-cyan-600 transition-colors leading-relaxed">
                {item.title}
              </h3>
              <span className="text-xs md:text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
                {item.date}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 더보기 버튼 */}
      <div className="flex justify-center px-4">
        <button className="w-full md:w-auto group bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl md:rounded-2xl px-6 md:px-8 py-4 md:py-6 transition-all hover:shadow-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm md:text-base text-gray-700 text-center">
              더 많은{' '}
              <span className="font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                부동산 뉴스
              </span>
              <br />
              보러가기
            </div>
            <div className="flex items-center gap-1 text-cyan-600 group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 -ml-2 md:-ml-3" />
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 -ml-2 md:-ml-3" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// AI 영상 탭
function VideosTab() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-50 rounded-full border border-blue-100 mb-3 md:mb-4">
          <Video className="w-3 h-3 md:w-4 md:h-4 text-cyan-600" />
          <span className="text-xs md:text-sm text-gray-700 font-medium">AI 영상</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-1 md:mb-2">숏폼 영상</h1>
        <p className="text-sm md:text-base text-gray-600">60초로 보는 부동산 핵심 정보</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="cursor-pointer group">
            <div className="aspect-[9/16] bg-gradient-to-br from-blue-200 to-cyan-200 rounded-xl md:rounded-2xl overflow-hidden relative border border-gray-200 hover:border-cyan-400 hover:shadow-xl transition-all">
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/5 transition-all">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Play className="w-6 h-6 md:w-8 md:h-8 text-cyan-600 ml-1" />
                </div>
              </div>
              <div className="absolute top-2 right-2">
                <div className="bg-cyan-500 rounded-lg px-1.5 md:px-2 py-0.5 md:py-1 flex items-center gap-1 shadow-md">
                  <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                  <span className="text-xs text-white font-bold">AI</span>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/70 backdrop-blur-sm rounded-lg px-1.5 md:px-2 py-0.5 md:py-1">
                  <p className="text-xs text-white font-semibold">1:24</p>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs md:text-sm font-semibold text-gray-900 line-clamp-2">
                2025년 부동산 세금 절약 꿀팁
              </p>
              <p className="text-xs text-gray-500 mt-1">조회 12K · 1일 전</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 커뮤니티 탭
function CommunityTab() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-50 rounded-full border border-blue-100 mb-3 md:mb-4">
          <Users className="w-3 h-3 md:w-4 md:h-4 text-teal-600" />
          <span className="text-xs md:text-sm text-gray-700 font-medium">커뮤니티</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-1 md:mb-2">동료와 소통</h1>
        <p className="text-sm md:text-base text-gray-600">부동산 전문가들의 네트워킹 공간</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {[
          { title: "중개사 놀이터", desc: "자유로운 소통 공간", members: "1,234명", badge: "인기", color: "cyan" },
          { title: "실무 질문방", desc: "계약서, 민원 등 실무 질의응답", members: "856명", badge: "활발", color: "blue" },
          { title: "분양 정보 공유", desc: "분양 소식 실시간 공유", members: "645명", badge: "신규", color: "teal" },
          { title: "지역별 모임", desc: "지역 중개사 네트워킹", members: "423명", badge: "", color: "green" },
        ].map((room, i) => (
          <div key={i} className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-teal-700 transition-colors">{room.title}</h3>
              {room.badge && (
                <span className={`text-xs font-bold px-2 md:px-3 py-1 rounded-lg ${
                  room.color === "cyan" ? "bg-cyan-100 text-cyan-700" :
                  room.color === "blue" ? "bg-blue-100 text-blue-700" :
                  room.color === "teal" ? "bg-teal-100 text-teal-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {room.badge}
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">{room.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-500 flex items-center gap-2">
                <Users className="w-3 h-3 md:w-4 md:h-4" />
                {room.members}
              </span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-teal-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
