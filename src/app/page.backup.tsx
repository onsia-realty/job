'use client';

import Link from 'next/link';
import { Building2, HardHat, TrendingUp, Users, Briefcase, Newspaper, ArrowRight, Sparkles } from 'lucide-react';
import Header from '@/components/shared/Header';

// 임시 통계 데이터
const statistics = {
  agentJobs: 1234,
  salesJobs: 2567,
  activeUsers: 8923,
  matchesThisMonth: 456,
};

// 임시 뉴스 데이터
const newsItems = [
  {
    id: '1',
    title: '강남 재건축 평당 1억 돌파',
    summary: '서울 강남구 압구정 현대아파트 재건축 조합원 분양가가 평당 1억원을 돌파했습니다.',
    date: '2026.01.17',
    category: 'market',
  },
  {
    id: '2',
    title: '2026년 1분기 대단지 분양 러시',
    summary: '올해 1분기 수도권에서 1만세대 이상 대단지 분양이 집중될 예정입니다.',
    date: '2026.01.16',
    category: 'development',
  },
  {
    id: '3',
    title: '정부, 재건축 규제 완화 신호',
    summary: '정부가 재건축 안전진단 기준 완화를 검토 중인 것으로 알려졌습니다.',
    date: '2026.01.15',
    category: 'policy',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header variant="landing" />

      {/* 히어로 섹션 */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        {/* 슬로건 */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-white/90 text-sm">AI 기반 스마트 매칭</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            부동산 전문가를 위한
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              구인구직 플랫폼
            </span>
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto">
            공인중개사와 분양상담사를 위한 맞춤형 채용 정보와
            <br className="hidden md:block" />
            AI 매칭 서비스를 경험하세요
          </p>
        </div>

        {/* 선택 카드 */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto mb-12">
          {/* 공인중개사 카드 */}
          <Link
            href="/agent"
            className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <Building2 className="w-7 h-7 md:w-8 md:h-8 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">공인중개사</h2>
                <p className="text-gray-500 text-sm md:text-base mb-4">
                  아파트, 빌라, 상가, 원룸 등
                  <br />
                  중개업 구인구직
                </p>
                <div className="flex items-center gap-2 text-blue-600 font-medium">
                  <span>입장하기</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
            <div className="absolute top-4 right-4 bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
              {statistics.agentJobs.toLocaleString()}건
            </div>
          </Link>

          {/* 분양상담사 카드 */}
          <Link
            href="/sales"
            className="group relative bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <HardHat className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">분양상담사</h2>
                <p className="text-white/80 text-sm md:text-base mb-4">
                  아파트, 오피스텔, 상가, 지산 등
                  <br />
                  분양현장 구인구직
                </p>
                <div className="flex items-center gap-2 text-white font-medium">
                  <span>입장하기</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
            <div className="absolute top-4 right-4 bg-white/20 text-white text-xs px-2 py-1 rounded-full font-medium">
              {statistics.salesJobs.toLocaleString()}건
            </div>
          </Link>
        </div>

        {/* 실시간 통계 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-cyan-400" />
                <span className="text-white/60 text-xs md:text-sm">공인중개사 공고</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">
                {statistics.agentJobs.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-purple-400" />
                <span className="text-white/60 text-xs md:text-sm">분양 현장</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">
                {statistics.salesJobs.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-white/60 text-xs md:text-sm">활성 회원</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">
                {statistics.activeUsers.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <span className="text-white/60 text-xs md:text-sm">이번달 매칭</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">
                {statistics.matchesThisMonth.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* AI 뉴스 섹션 */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg md:text-xl font-bold text-white">AI 부동산 뉴스 요약</h2>
            <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">
              실시간
            </span>
          </div>
          <div className="space-y-3">
            {newsItems.map((news) => (
              <div
                key={news.id}
                className="bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1 text-sm md:text-base">
                      {news.title}
                    </h3>
                    <p className="text-white/60 text-xs md:text-sm line-clamp-1">
                      {news.summary}
                    </p>
                  </div>
                  <span className="text-white/40 text-xs whitespace-nowrap">{news.date}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <button className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors">
              뉴스 더보기 →
            </button>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-white/10 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white/40 text-sm">
            &copy; 2026 온시아 JOB. All rights reserved.
          </p>
          <p className="text-white/30 text-xs mt-2">
            부동산 전문가를 위한 AI 기반 구인구직 플랫폼
          </p>
        </div>
      </footer>
    </div>
  );
}
