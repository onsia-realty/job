'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  Users,
  Building2,
  Briefcase,
  DollarSign,
  Shield,
  Star,
  ChevronDown,
  Zap,
  Award,
  BadgeCheck,
  Quote,
} from 'lucide-react';

export default function PremiumLandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a1628] text-white overflow-x-hidden">
      {/* ========== 1. Hero Section ========== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a2d4a] to-[#0a1628]" />

        {/* 골드 라인 장식 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

        {/* 플로팅 요소들 */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className={`relative z-10 max-w-7xl mx-auto px-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 왼쪽: 텍스트 콘텐츠 */}
            <div className="text-center lg:text-left">
              {/* 뱃지 */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full mb-8">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 text-sm font-medium">대한민국 최초 부동산 전문 AI 매칭 플랫폼</span>
              </div>

              {/* 메인 헤드라인 */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                <span className="text-white">알바가 아닙니다.</span>
                <br />
                <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                  전문가입니다.
                </span>
              </h1>

              {/* 서브 헤드라인 */}
              <p className="text-lg md:text-xl text-gray-300 mb-4 leading-relaxed">
                35년간 <span className="text-amber-400 font-semibold">50만 명</span>의 공인중개사가 배출되었지만,
                <br className="hidden md:block" />
                그들을 위한 <span className="text-white font-semibold">'진짜'</span> 구인구직 플랫폼은 없었습니다.
              </p>

              <p className="text-base text-gray-400 mb-8">
                대한민국에서 가장 비싼 자산을 다루는 전문가,<br />
                이제 그에 걸맞은 대우를 받으세요.
              </p>

              {/* CTA 버튼 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/agent/auth/register"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-lg rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105"
                >
                  지금 시작하기
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#problem"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-medium text-lg rounded-xl hover:bg-white/20 transition-all"
                >
                  더 알아보기
                  <ChevronDown className="w-5 h-5" />
                </Link>
              </div>

              {/* 신뢰 지표 */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 mt-10 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-green-400" />
                  <span>보험/다단계 0%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-400" />
                  <span>AI 매칭 기술</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <span>부동산 전문가 Only</span>
                </div>
              </div>
            </div>

            {/* 오른쪽: Hero 이미지 */}
            <div className="relative hidden lg:block">
              {/* 이미지 배경 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-blue-500/20 rounded-3xl blur-3xl" />

              {/* 메인 이미지 */}
              <div className="relative">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-amber-500/10">
                  <Image
                    src="/images/onsia_realty_Professional_Korean_woman_real_estate_consultant_dd65c326-faa8-4e9f-a4bf-78d8ea09fc56_0.png"
                    alt="부동산 전문가"
                    width={600}
                    height={700}
                    className="object-cover w-full h-auto"
                    priority
                  />
                  {/* 이미지 오버레이 그라데이션 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/80 via-transparent to-transparent" />
                </div>

                {/* 플로팅 뱃지들 */}
                <div className="absolute -left-4 top-1/4 px-4 py-2 bg-green-500/90 text-white text-sm font-bold rounded-lg shadow-lg animate-pulse">
                  ✓ 검증된 전문가
                </div>
                <div className="absolute -right-4 top-1/2 px-4 py-2 bg-amber-500/90 text-black text-sm font-bold rounded-lg shadow-lg">
                  🎯 AI 매칭 98%
                </div>
                <div className="absolute -left-2 bottom-1/4 px-4 py-2 bg-blue-500/90 text-white text-sm font-bold rounded-lg shadow-lg">
                  💼 연봉 협상 지원
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 스크롤 인디케이터 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-gray-500" />
        </div>
      </section>

      {/* ========== 2. Problem Section (문제 제기) ========== */}
      <section id="problem" className="py-24 bg-gradient-to-b from-[#0a1628] to-[#0f1f35]">
        <div className="max-w-6xl mx-auto px-4">
          {/* 섹션 헤더 */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full mb-4">
              PROBLEM
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              지금까지 우리는<br />
              <span className="text-red-400">잘못된 곳</span>에 있었습니다
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              대한민국 최고의 자산 전문가가 왜 보험설계사, 다단계, 알바와 같은 카테고리에 있어야 할까요?
            </p>
          </div>

          {/* 비교 카드 */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* 기존 플랫폼 */}
            <div className="p-8 bg-red-950/30 border border-red-500/20 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <XCircle className="w-8 h-8 text-red-500" />
                <h3 className="text-xl font-bold text-red-400">기존 플랫폼</h3>
              </div>
              <ul className="space-y-4">
                {[
                  '보험, 자동차, 다단계와 같은 카테고리',
                  '전문성 무시한 "아무나 지원" 시스템',
                  '월 500~1,000만원 광고비 소모',
                  '허위/스팸 공고 난무',
                  '"알바" 취급받는 전문가들',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 부동산인 */}
            <div className="p-8 bg-gradient-to-br from-amber-500/10 to-blue-500/10 border border-amber-500/30 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-8 h-8 text-amber-400" />
                <h3 className="text-xl font-bold text-amber-400">부동산인</h3>
              </div>
              <ul className="space-y-4">
                {[
                  '오직 부동산 전문가만 (Only Real Estate)',
                  'AI가 분석하는 적합도 매칭',
                  '기존 대비 1/10 광고비',
                  '검증된 공고만 노출',
                  '전문가로서 정당한 대우',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 충격적인 통계 */}
          <div className="mt-16 p-8 bg-white/5 border border-white/10 rounded-2xl max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: '35회', label: '공인중개사 시험 회차' },
                { value: '50만+', label: '누적 합격자 수' },
                { value: '0개', label: '전문 구인구직 플랫폼' },
                { value: '30년', label: '방치된 시간' },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-3xl md:text-4xl font-bold text-amber-400 mb-2">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== 3. Solution Section (AI Tech) ========== */}
      <section className="py-24 bg-[#0f1f35]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full mb-4">
              AI TECHNOLOGY
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              AI가 당신에게<br />
              <span className="text-blue-400">최적의 매칭</span>을 찾아드립니다
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              단순 게시판이 아닙니다. DNA 분석 기반 AI 매칭 시스템이 당신의 성향과 경력을 분석해 최적의 기회를 연결합니다.
            </p>
          </div>

          {/* AI 매칭 플로우 */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '01',
                icon: Brain,
                title: 'DNA 분석',
                desc: '10가지 상황 질문으로 당신의 부동산 DNA(성향)를 분석합니다',
                color: 'from-purple-500 to-pink-500',
              },
              {
                step: '02',
                icon: Target,
                title: 'AI 매칭',
                desc: 'DNA + 경력 + 희망조건을 종합해 최적의 공고/인재를 매칭합니다',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                step: '03',
                icon: Zap,
                title: '역채용',
                desc: '구직자가 기다리는 게 아닌, 기업이 먼저 제안하는 시스템',
                color: 'from-amber-500 to-orange-500',
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all h-full">
                  <span className={`inline-block px-3 py-1 bg-gradient-to-r ${item.color} text-white text-xs font-bold rounded-full mb-4`}>
                    STEP {item.step}
                  </span>
                  <div className={`w-14 h-14 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* DNA 유형 미리보기 */}
          <div className="mt-16 text-center">
            <p className="text-gray-400 mb-6">5가지 부동산 DNA 유형</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { emoji: '🦁', name: '야수형', color: 'bg-orange-500/20 border-orange-500/30' },
                { emoji: '🎯', name: '승부사형', color: 'bg-blue-500/20 border-blue-500/30' },
                { emoji: '🤝', name: '카운셀러형', color: 'bg-emerald-500/20 border-emerald-500/30' },
                { emoji: '📊', name: '관리형', color: 'bg-purple-500/20 border-purple-500/30' },
                { emoji: '🚀', name: '자유영혼형', color: 'bg-pink-500/20 border-pink-500/30' },
              ].map((type, i) => (
                <span key={i} className={`inline-flex items-center gap-2 px-4 py-2 ${type.color} border rounded-full`}>
                  <span>{type.emoji}</span>
                  <span className="text-sm font-medium">{type.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== 4. Benefit - 구인자 편 ========== */}
      <section className="py-24 bg-gradient-to-b from-[#0f1f35] to-[#0a1628]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1 bg-amber-500/20 text-amber-400 text-sm font-medium rounded-full mb-4">
                FOR EMPLOYERS
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                광고비 낭비하지 마세요.<br />
                <span className="text-amber-400">그 돈으로 면접비를</span> 주세요.
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                기존 플랫폼에 월 500~1,000만 원 광고비, 정말 효과 있으셨나요?<br />
                우리는 1/10 가격입니다. 아낀 돈으로 좋은 인재에게 면접비를 지급하세요.
              </p>

              {/* 비용 비교 */}
              <div className="p-6 bg-white/5 rounded-xl mb-8">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                  <span className="text-gray-400">기존 플랫폼 월 광고비</span>
                  <span className="text-red-400 font-bold text-xl line-through">500~1,000만원</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">부동산인</span>
                  <span className="text-green-400 font-bold text-xl">50~100만원</span>
                </div>
                <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
                  <p className="text-green-400 text-sm text-center">
                    💰 매월 최대 <strong>900만원</strong> 절약 → 인재 면접비로 활용!
                  </p>
                </div>
              </div>

              <Link
                href="/agent/jobs/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all"
              >
                <Building2 className="w-5 h-5" />
                채용공고 등록하기
              </Link>
            </div>

            <div className="relative">
              <div className="p-8 bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30 rounded-2xl">
                <h4 className="text-xl font-bold text-amber-400 mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6" />
                  프리미엄 공고 혜택
                </h4>
                <ul className="space-y-4">
                  {[
                    '상단 VIP 영역 노출',
                    'AI 추천 인재 우선 매칭',
                    '지원자 DNA 분석 결과 열람',
                    '전담 매니저 배정',
                    '1:1 인재 추천 서비스',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400" />
                      <span className="text-gray-200">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* 할인 뱃지 */}
                <div className="absolute -top-4 -right-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full text-white font-bold shadow-lg">
                  오픈 기념 50% 할인
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 5. Benefit - 구직자 편 ========== */}
      <section className="py-24 bg-[#0a1628]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="p-8 bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/30 rounded-2xl">
                <h4 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  청정 구역 보장
                </h4>
                <div className="space-y-4">
                  {[
                    { icon: XCircle, text: '보험 설계사 공고', color: 'text-red-500' },
                    { icon: XCircle, text: '다단계/네트워크', color: 'text-red-500' },
                    { icon: XCircle, text: '자동차 딜러', color: 'text-red-500' },
                    { icon: XCircle, text: '단순 알바', color: 'text-red-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <span className="text-gray-400 line-through">{item.text}</span>
                      <span className="ml-auto text-xs text-red-400 font-medium">절대 사절</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-green-500/10 rounded-lg">
                  <p className="text-green-400 text-center font-medium">
                    ✓ 오직 부동산 전문가 공고만 100%
                  </p>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <span className="inline-block px-4 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full mb-4">
                FOR JOB SEEKERS
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                당신은 알바가 아닙니다.<br />
                <span className="text-blue-400">전문가입니다.</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                대한민국에서 가장 비싼 물건을 파는 사람이<br />
                왜 알바 취급을 받아야 하나요?<br />
                부동산인에서는 전문가로서 정당한 대우를 받으세요.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  '이력서 등록 한 번으로 기업이 먼저 제안',
                  'AI가 분석한 나의 부동산 DNA 확인',
                  '검증된 정직한 채용 공고만',
                  '연봉/커미션 투명하게 공개',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/agent/mypage/resume/dna"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-all"
              >
                <Brain className="w-5 h-5" />
                내 DNA 분석하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 6. Social Proof & CTA ========== */}
      <section className="py-24 bg-gradient-to-b from-[#0a1628] to-[#050d1a]">
        <div className="max-w-6xl mx-auto px-4">
          {/* 후기 */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-white/10 text-gray-300 text-sm font-medium rounded-full mb-4">
              TESTIMONIALS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              이미 <span className="text-amber-400">전문가</span>들이 선택했습니다
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                name: '김○○ 대표',
                role: '분양대행사 운영',
                text: '기존 사이트 광고비로 월 800만원 썼는데, 여기선 100만원도 안 들어요. 그 돈으로 면접비 주니까 좋은 분들이 많이 오세요.',
              },
              {
                name: '이○○',
                role: '경력 5년 공인중개사',
                text: '알바몬에서 공인중개사 공고 찾다가 보험설계사 공고만 잔뜩... 여기는 진짜 부동산만 있어서 좋습니다.',
              },
              {
                name: '박○○ 실장',
                role: '분양상담 팀장',
                text: 'DNA 분석 재밌어요. 저 야수형이래요 ㅋㅋ 실제로 공격적인 영업 스타일인데 신기하게 맞더라고요.',
              },
            ].map((review, i) => (
              <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <Quote className="w-8 h-8 text-amber-500/50 mb-4" />
                <p className="text-gray-300 mb-6 leading-relaxed">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center font-bold">
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
          <div className="relative p-12 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/30 rounded-3xl text-center overflow-hidden">
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                부동산 전문가를 위한<br />
                <span className="text-amber-400">새로운 기준</span>이 시작됩니다
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                더 이상 잡탕 사이트에서 소외받지 마세요.<br />
                부동산인에서 전문가로서 대우받으세요.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/agent/auth/register"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-lg rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/25"
                >
                  무료로 시작하기
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/agent/jobs"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-medium text-lg rounded-xl hover:bg-white/20 transition-all"
                >
                  채용공고 둘러보기
                </Link>
              </div>

              <p className="mt-8 text-gray-500 text-sm">
                지금 가입하시면 <span className="text-amber-400 font-medium">프리미엄 50% 할인</span> 혜택!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-8 border-t border-white/10 bg-[#050d1a]">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2025 부동산인. 부동산 전문가를 위한 AI 매칭 플랫폼.</p>
        </div>
      </footer>
    </div>
  );
}
