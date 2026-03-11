'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Brain,
  Bot,
  Calculator,
  FileText,
  Scale,
  MessageSquare,
  Shield,
  ChevronDown,
  Zap,
  Clock,
  BookOpen,
  Lightbulb,
  Quote,
  LogIn,
  User,
  Star,
} from 'lucide-react';

export default function AiAssistantLandingPage() {
  const { user, isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a1628] text-white overflow-x-hidden">
      {/* ========== 상단 네비게이션 ========== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a1628]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/agent"
            className="inline-flex items-center gap-2.5 text-white/70 hover:text-white transition-colors text-base"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">홈으로</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-4">
            <span className="text-sm sm:text-base font-semibold text-cyan-400">AI 부동산인 실무비서</span>
            <span className="hidden sm:inline text-white/20">|</span>
            <Link href="/event/premium" className="hidden sm:inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              플랫폼 소개
            </Link>
          </div>
          {isLoading ? (
            <div className="w-20 h-9" />
          ) : user ? (
            <Link
              href="/agent/mypage"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-cyan-400 hover:bg-cyan-500/30 hover:text-cyan-300 transition-all text-base font-semibold"
            >
              <User className="w-4 h-4" />
              <span>{user.user_metadata?.name || '마이페이지'}</span>
            </Link>
          ) : (
            <Link
              href="/agent/auth/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-cyan-400 hover:bg-cyan-500/30 hover:text-cyan-300 transition-all text-base font-semibold"
            >
              <LogIn className="w-4 h-4" />
              <span>로그인</span>
            </Link>
          )}
        </div>
      </nav>

      {/* ========== 1. Hero Section ========== */}
      <section className="relative pt-24 md:pt-44 pb-20 md:pb-48 flex items-center justify-center overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0f2a3d] to-[#0a1628]" />

        {/* 시안 라인 장식 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

        {/* 플로팅 요소들 */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className={`relative z-10 max-w-6xl mx-auto px-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-16 lg:gap-20 items-center">
            {/* 왼쪽: 텍스트 콘텐츠 */}
            <div className="text-center lg:text-left">
              {/* 뱃지 */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-300 text-sm font-medium">부동산 전문 AI · 최고급 모델 탑재</span>
              </div>

              {/* 메인 헤드라인 */}
              <h1 className="text-4xl md:text-5xl lg:text-[3.6rem] font-black mb-6 leading-tight break-keep">
                <span className="text-white">중개실무,</span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
                  AI에게 물어보세요.
                </span>
              </h1>

              {/* 서브 헤드라인 */}
              <p className="text-lg md:text-xl lg:text-[1.35rem] text-gray-300 mb-5 leading-relaxed">
                중개보수, 특약 작성, 판례 검색, 세금 계산까지<br />
                <span className="text-cyan-400 font-semibold">24시간 대기하는 실무 전문 AI</span>가<br className="hidden lg:block" />
                답합니다.
              </p>

              <p className="text-base md:text-lg text-gray-400 mb-8">
                변호사 상담 전 1차 검토, 계약 전 리스크 체크,<br />
                복잡한 요율 계산까지 — 한 번의 질문으로 해결.
              </p>

              {/* 무료 강조 */}
              <div className="inline-flex items-center gap-3 px-5 py-3 bg-amber-500/15 border border-amber-500/30 rounded-xl mb-6">
                <span className="text-2xl">🎁</span>
                <div>
                  <p className="text-amber-300 font-bold text-base">매일 5회 · 한 달 150건 완전 무료</p>
                  <p className="text-amber-400/60 text-xs">회원가입만 하면 바로 사용 · 별도 결제 없음</p>
                </div>
              </div>

              {/* CTA */}
              <div>
                <Link
                  href="/agent/ai-assistant"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold text-lg rounded-xl hover:from-cyan-400 hover:to-emerald-400 transition-all shadow-lg shadow-cyan-500/25"
                >
                  <Bot className="w-5 h-5" />
                  AI 비서에게 물어보기
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* 신뢰 지표 */}
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 sm:gap-6 mt-8 text-sm md:text-base text-gray-400">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  <span>최고급 AI 모델</span>
                </div>
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-emerald-400" />
                  <span>민법, 판례 데이터 탑재</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>24시간 즉시 응답</span>
                </div>
              </div>
            </div>

            {/* 오른쪽: Hero 이미지 */}
            <div className="relative flex flex-col justify-center">
              {/* 이미지 배경 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-3xl blur-3xl" />

              <div className="relative">
                <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl border border-white/10 shadow-2xl shadow-cyan-500/10 max-h-[500px]">
                  <Image
                    src="/images/ai-assistant-hero.png"
                    alt="AI 부동산인 실무비서"
                    width={960}
                    height={1200}
                    className="w-full h-auto object-cover object-top max-h-[500px]"
                    priority
                  />
                  {/* 이미지 오버레이 그라데이션 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/80 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                </div>

                {/* 플로팅 뱃지들 */}
                <div className="absolute -left-2 lg:-left-6 top-1/4 px-3 lg:px-5 py-1.5 lg:py-3 bg-cyan-500/90 text-white text-xs lg:text-base font-bold rounded-lg lg:rounded-xl shadow-xl animate-pulse backdrop-blur-sm">
                  💬 즉시 답변
                </div>
                <div className="absolute -right-2 lg:-right-6 top-1/2 px-3 lg:px-5 py-1.5 lg:py-3 bg-emerald-500/90 text-white text-xs lg:text-base font-bold rounded-lg lg:rounded-xl shadow-xl animate-bounce-slow backdrop-blur-sm">
                  ⚖️ 민법, 판례 데이터 탑재
                </div>
                <div className="absolute -left-1 lg:-left-4 bottom-1/4 px-3 lg:px-5 py-1.5 lg:py-3 bg-amber-500/90 text-black text-xs lg:text-base font-bold rounded-lg lg:rounded-xl shadow-xl animate-pulse backdrop-blur-sm">
                  🔒 대화 내역 저장
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 스크롤 인디케이터 */}
        <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <ChevronDown className="w-8 h-8 text-gray-500" />
        </div>
      </section>

      {/* ========== 2. 이런 고민, 해본 적 있으시죠? ========== */}
      <section className="py-14 md:py-24 bg-gradient-to-b from-[#0a1628] to-[#0f1f35]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-red-500/15 text-red-400 text-xs font-semibold tracking-widest uppercase rounded-full mb-6">
              PAIN POINT
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              이런 <span className="text-red-400">고민</span>, 해본 적 있으시죠?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              중개 실무 중 모르는 게 생기면 어디에 물어보시나요?
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                emoji: '🤔',
                question: '"8억 아파트 매매 중개보수가 정확히 얼마지?"',
                pain: '매번 요율표 뒤지고 계산기 두드리고...',
              },
              {
                emoji: '😰',
                question: '"선순위 근저당 있는 전세, 특약을 어떻게 써야 하지?"',
                pain: '인터넷 검색하면 말이 다 달라서...',
              },
              {
                emoji: '😓',
                question: '"임차인이 계약갱신요구권 행사했는데, 거절할 수 있나?"',
                pain: '법 조문 읽어도 내 상황에 딱 맞는지 모르겠고...',
              },
              {
                emoji: '💸',
                question: '"상가 권리금 중개보수를 따로 받을 수 있어?"',
                pain: '동료한테 물어보기도 민망하고...',
              },
              {
                emoji: '📞',
                question: '"경매 낙찰 후 명도 절차가 어떻게 되지?"',
                pain: '변호사 상담은 비용이 부담되고...',
              },
              {
                emoji: '⏰',
                question: '"손피 거래 특약, 지금 당장 써야 하는데..."',
                pain: '계약 현장에서 급하게 확인할 데가 없고...',
              },
            ].map((item, i) => (
              <div key={i} className="p-6 bg-red-950/20 border border-red-500/15 rounded-2xl hover:border-red-500/30 transition-all">
                <span className="text-3xl mb-4 block">{item.emoji}</span>
                <p className="text-white font-medium mb-2 leading-relaxed">{item.question}</p>
                <p className="text-red-400/70 text-sm">{item.pain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 3. AI 비서가 해결합니다 (기능 소개) ========== */}
      <section className="py-14 md:py-24 bg-[#0f1f35]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-cyan-500/20 text-cyan-400 text-sm font-medium rounded-full mb-4">
              AI FEATURES
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <span className="text-cyan-400">AI 실무비서</span>가<br />
              즉시 해결합니다
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              중개보수 요율표, 주요 법령, 특약 가이드까지 — <br />
              부동산 전문 데이터로 학습된 AI가 정확하게 답변합니다.
            </p>
          </div>

          {/* 기능 카드 4개 */}
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Calculator,
                title: '중개보수 즉시 계산',
                desc: '매매/전세/월세, 부동산 유형별 법정 상한요율을 자동 계산. 부가세 포함 여부까지 정확하게.',
                example: '"8억 아파트 매매 중개보수?" → 즉시 산출 과정과 함께 답변',
                color: 'from-emerald-500 to-teal-500',
                bgColor: 'bg-emerald-500/10 border-emerald-500/20',
              },
              {
                icon: FileText,
                title: '특약사항 AI 작성',
                desc: '상황별 필수 특약을 즉시 생성. 근저당 말소, 하자 책임, 명도 조건 등 실무에서 바로 사용 가능.',
                example: '"전세 근저당 말소 특약 써줘" → 법적 근거 포함 특약 생성',
                color: 'from-blue-500 to-indigo-500',
                bgColor: 'bg-blue-500/10 border-blue-500/20',
              },
              {
                icon: Scale,
                title: '법령·판례 검색',
                desc: '공인중개사법, 주임법, 상임법 관련 질문에 법 조항과 판례를 인용하며 답변.',
                example: '"계약갱신요구권 거절 사유?" → 법 조항 + 실무 사례 제공',
                color: 'from-amber-500 to-orange-500',
                bgColor: 'bg-amber-500/10 border-amber-500/20',
              },
              {
                icon: Lightbulb,
                title: '실무 리스크 분석',
                desc: '계약 전 체크해야 할 위험 요소를 분석. 전세 사기 예방, 등기 확인, 임차권 대항력 판단.',
                example: '"전세보증금 5억, 선순위 근저당 3억이면?" → 리스크 분석',
                color: 'from-violet-500 to-purple-500',
                bgColor: 'bg-violet-500/10 border-violet-500/20',
              },
            ].map((feature, i) => (
              <div key={i} className={`p-8 ${feature.bgColor} border rounded-2xl hover:scale-[1.02] transition-all`}>
                <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-5`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed mb-4">{feature.desc}</p>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-sm text-cyan-300">{feature.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 4. 대화 예시 섹션 ========== */}
      <section className="py-14 md:py-24 bg-gradient-to-b from-[#0f1f35] to-[#0a1628]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
            {/* 왼쪽: 텍스트 */}
            <div>
              <span className="inline-block px-4 py-1 bg-cyan-500/20 text-cyan-400 text-sm font-medium rounded-full mb-4">
                LIVE DEMO
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                이렇게<br />
                <span className="text-cyan-400">대화하세요</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                복잡한 메뉴나 검색 없이,<br />
                그냥 궁금한 걸 물어보면 됩니다.<br />
                AI가 법적 근거와 함께 답변합니다.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Zap, text: '질문하면 5초 내 답변 시작', color: 'text-cyan-400' },
                  { icon: BookOpen, text: '법 조항·판례 근거 포함', color: 'text-emerald-400' },
                  { icon: MessageSquare, text: '대화 내역 자동 저장', color: 'text-amber-400' },
                  { icon: Shield, text: '법적 면책 고지 포함', color: 'text-violet-400' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 오른쪽: 대화 미리보기 UI */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 rounded-[2rem] blur-2xl" />
              <div className="relative bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
                {/* 채팅 헤더 */}
                <div className="px-6 py-4 bg-slate-800 border-b border-slate-700/50 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">AI 부동산인 실무비서</p>
                    <p className="text-slate-500 text-xs">최고급 AI 모델 · 중개실무 전문</p>
                  </div>
                </div>

                {/* 대화 내용 */}
                <div className="p-6 space-y-5 max-h-[400px]">
                  {/* 유저 질문 */}
                  <div className="flex justify-end">
                    <div className="bg-cyan-600/30 border border-cyan-500/20 rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%]">
                      <p className="text-white text-sm">8억 아파트 매매 중개보수 얼마야?</p>
                    </div>
                  </div>

                  {/* AI 답변 */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[85%]">
                      <p className="text-slate-200 text-sm leading-relaxed">
                        <strong>매매가 8억원 아파트 중개보수</strong>를 계산해 드리겠습니다.
                        <br /><br />
                        📌 <strong>적용 요율</strong>: 2억원 이상 ~ 9억원 미만 → <span className="text-cyan-400">상한요율 0.4%</span>
                        <br /><br />
                        💰 <strong>계산</strong>
                        <br />• 8억원 × 0.4% = <span className="text-amber-400 font-bold">320만원</span>
                        <br />• 부가세(10%) 별도 시: 352만원
                        <br /><br />
                        ⚠️ 상한요율은 최대 금액이며, 이 범위 내에서 협의 가능합니다.
                      </p>
                    </div>
                  </div>

                  {/* 유저 후속 질문 */}
                  <div className="flex justify-end">
                    <div className="bg-cyan-600/30 border border-cyan-500/20 rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%]">
                      <p className="text-white text-sm">간이과세자면 부가세는?</p>
                    </div>
                  </div>

                  {/* AI 후속 답변 */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[85%]">
                      <p className="text-slate-200 text-sm leading-relaxed">
                        간이과세자인 경우 <span className="text-emerald-400 font-bold">부가세가 중개보수에 포함</span>되는 것이 일반적입니다.
                        <br /><br />
                        따라서 별도 청구 없이 <span className="text-amber-400 font-bold">320만원</span>이 최종 금액입니다. ✓
                      </p>
                    </div>
                  </div>
                </div>

                {/* 입력 바 */}
                <div className="px-6 py-4 bg-slate-900 border-t border-slate-700/50">
                  <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                    <p className="text-slate-500 text-sm flex-1">중개 실무에 관해 물어보세요...</p>
                    <div className="w-9 h-9 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 5. 왜 AI 비서인가? (비교) ========== */}
      <section className="py-14 md:py-24 bg-[#0a1628]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full mb-4">
              COMPARISON
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              기존 방법 vs <span className="text-cyan-400">AI 비서</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 기존 방법 */}
            <div className="p-8 bg-red-950/30 border border-red-500/20 rounded-2xl">
              <h3 className="text-xl font-bold text-red-400 mb-6">기존에 이렇게 하셨죠?</h3>
              <ul className="space-y-4">
                {[
                  '네이버 검색 → 블로그마다 말이 다름',
                  '동료에게 전화 → 바빠서 못 받음',
                  '변호사 상담 → 건당 10~30만원',
                  '법령 직접 찾기 → 해석이 어려움',
                  '카페/커뮤니티 질문 → 답변에 며칠 소요',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <span className="text-red-500 mt-0.5">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI 비서 */}
            <div className="p-8 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 rounded-2xl">
              <h3 className="text-xl font-bold text-cyan-400 mb-6">AI 비서는 이렇습니다</h3>
              <ul className="space-y-4">
                {[
                  '질문 즉시 → 5초 내 답변 시작',
                  '법 조항 근거 포함 → 정확한 답변',
                  '매일 5회, 한 달 150건 무료 → 비용 부담 0',
                  '쉬운 언어로 해석 → 바로 이해',
                  '24시간 대기 → 계약 현장에서도 OK',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 6. 사용자 후기 & CTA ========== */}
      <section className="py-14 md:py-24 bg-gradient-to-b from-[#0a1628] to-[#050d1a]">
        <div className="max-w-6xl mx-auto px-4">
          {/* 후기 */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-white/10 text-gray-300 text-sm font-medium rounded-full mb-4">
              REVIEWS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              현직 중개사들의 <span className="text-cyan-400">생생 후기</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                name: '김○○ 소장',
                role: '경력 12년 공인중개사',
                text: '중개보수 계산할 때마다 요율표 찾았는데, 이제 AI한테 물어보면 3초면 끝나요. 부가세까지 알려주니까 손님한테 바로 안내할 수 있어요.',
                stars: 5,
              },
              {
                name: '이○○ 실장',
                role: '경력 5년 공인중개사',
                text: '전세 계약 특약 쓸 때 항상 고민이었는데, AI가 상황에 맞는 특약을 바로 만들어줘요. 법적 근거까지 달아주니까 신뢰가 갑니다.',
                stars: 5,
              },
              {
                name: '박○○ 대표',
                role: '중개법인 대표',
                text: '직원들한테 추천했어요. 신입 직원들이 매번 저한테 물어보던 거 이제 AI한테 먼저 물어보고 오니까 업무 효율이 확 올랐습니다.',
                stars: 5,
              },
            ].map((review, i) => (
              <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <Quote className="w-8 h-8 text-cyan-500/50 mb-4" />
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: review.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center font-bold">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{review.name}</p>
                    <p className="text-sm text-gray-500">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 최종 CTA */}
          <div className="relative p-12 bg-gradient-to-r from-cyan-500/20 via-emerald-500/20 to-cyan-500/20 border border-cyan-500/30 rounded-3xl text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                지금 바로<br />
                <span className="text-cyan-400">AI 비서에게 물어보세요</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                회원가입만 하면 <span className="text-cyan-400 font-bold">매일 5회</span>, 한 달 <span className="text-amber-400 font-bold">150건 완전 무료</span>.<br />
                중개 실무의 모든 궁금증을 해결하세요.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/agent/ai-assistant"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold text-lg rounded-xl hover:from-cyan-400 hover:to-emerald-400 transition-all shadow-lg shadow-cyan-500/25"
                >
                  <Bot className="w-5 h-5" />
                  AI 비서 시작하기
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                {!user ? (
                  <Link
                    href="/agent/auth/login"
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition-all"
                  >
                    <LogIn className="w-5 h-5" />
                    회원가입하기
                  </Link>
                ) : (
                  <div className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-medium text-lg rounded-xl">
                    <User className="w-5 h-5 text-cyan-400" />
                    {user.user_metadata?.name || user.email}
                  </div>
                )}
              </div>

              <p className="mt-8 text-gray-500 text-sm">
                매일 5회 × 30일 = <span className="text-cyan-400 font-bold">월 150건 완전 무료</span> · 별도 결제 없음
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-8 border-t border-white/10 bg-[#050d1a]">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2026 부동산인. AI 부동산인 실무비서 — 중개사 전용 AI.</p>
        </div>
      </footer>
    </div>
  );
}
