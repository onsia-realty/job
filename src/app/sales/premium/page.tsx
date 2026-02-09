'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Crown, Star, Check, Zap, TrendingUp, Eye, Users, Clock,
  Building2, ArrowRight, Sparkles, Shield, MessageCircle, ChevronLeft,
  ChevronRight, MapPin, Briefcase, Tag, HardHat,
} from 'lucide-react';

// 유니크 슬라이드 더미 데이터
const UNIQUE_JOBS = [
  {
    id: 'u1',
    title: '힐스테이트 광교 분양상담사 대규모 모집',
    description: '조건변경 수수료인상! 대박현장 급구합니다. 숙소+일비+식대 지원.',
    company: '(주)분양프라자',
    region: '경기 수원',
    jobType: '아파트',
    salary: '수수료 최대 400만',
    badges: ['HOT', '대박'],
  },
  {
    id: 'u2',
    title: '세종시 행복도시 지식산업센터 팀장급 모집',
    description: '세종시 최초 대규모 지산 분양. 경험자 우대, 차량지원.',
    company: '세종지산(주)',
    region: '세종',
    jobType: '지식산업센터',
    salary: '수수료 최대 600만',
    badges: ['신규', 'HOT'],
  },
  {
    id: 'u3',
    title: '해운대 마린시티 프리미엄 상가 분양',
    description: '해운대 핵심상권 상가. 고액 수수료 보장, 숙소+차량 완비.',
    company: '해운대상가(주)',
    region: '부산 해운대',
    jobType: '상가',
    salary: '수수료 최대 500만',
    badges: ['인기현장'],
  },
];

const PLANS = [
  {
    tier: 'normal',
    name: '무료',
    badge: '24시간 한정',
    icon: Zap,
    gradientFrom: 'from-slate-500',
    gradientTo: 'to-slate-400',
    borderColor: 'border-slate-500/30',
    bgColor: 'bg-slate-800/50',
    checkColor: 'text-slate-400',
    originalPrice: 0,
    discountedPrice: 0,
    duration: '24시간',
    perDay: '0원',
    features: [
      '일반 목록 하단 노출',
      '텍스트 형식 공고',
      '24시간 후 자동 만료',
    ],
    recommended: false,
  },
  {
    tier: 'premium',
    name: '프리미엄',
    badge: '반짝이 효과',
    icon: Sparkles,
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-teal-500',
    borderColor: 'border-cyan-400/50',
    bgColor: 'bg-slate-800/50',
    checkColor: 'text-cyan-400',
    originalPrice: 49000,
    discountedPrice: 4900,
    duration: '5일',
    perDay: '980원',
    features: [
      '일반 목록에서 반짝이 효과',
      '프리미엄 시안 배지',
      '현장명 볼드 + 급여 컬러 강조',
      '시안 글로우 테두리',
      '5일간 노출 보장',
    ],
    recommended: false,
  },
  {
    tier: 'superior',
    name: '슈페리어',
    badge: '전용 그리드',
    icon: Crown,
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-indigo-500',
    borderColor: 'border-blue-400',
    bgColor: 'bg-slate-800/50',
    checkColor: 'text-blue-400',
    originalPrice: 99000,
    discountedPrice: 9900,
    duration: '1주일',
    perDay: '1,414원',
    features: [
      '유니크 아래 전용 그리드 섹션',
      '슈페리어 블루 배지',
      '조회수 4배 증가 효과',
      '현장 로고 강조',
      '지원자 우선 알림',
    ],
    recommended: false,
  },
  {
    tier: 'unique',
    name: '유니크',
    badge: '최상단 슬라이더',
    icon: Star,
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-pink-500',
    borderColor: 'border-purple-400',
    bgColor: 'bg-slate-800/50',
    checkColor: 'text-purple-400',
    originalPrice: 249000,
    discountedPrice: 24900,
    duration: '1주일',
    perDay: '3,557원',
    features: [
      '레인보우 네온 슬라이더 최상단',
      '4열 × 2행 유니크 전용 그리드',
      '유니크 퍼플 배지',
      '조회수 7배 증가 효과',
      '지원자 실시간 알림',
      '현장 상세정보 하이라이트',
      '분양팀 직접 연결',
    ],
    recommended: true,
  },
];

const STATS = [
  { icon: Eye, value: '7배', label: '유니크 평균 조회수 증가', color: 'text-purple-500' },
  { icon: Users, value: '4.5배', label: '슈페리어 지원자 증가', color: 'text-blue-500' },
  { icon: Clock, value: '36시간', label: '평균 채용 완료 시간', color: 'text-green-500' },
  { icon: TrendingUp, value: '92%', label: '광고주 만족도', color: 'text-purple-500' },
];

const FAQS = [
  { q: '광고 효과는 언제부터 시작되나요?', a: '결제 완료 후 즉시 광고가 적용됩니다. 관리자 승인 없이 바로 상위 노출이 시작됩니다.' },
  { q: '무료 공고와 프리미엄의 차이점은?', a: '무료 공고는 24시간 후 자동 만료됩니다. 프리미엄(₩4,900)은 5일간 반짝이 효과로 강조 노출됩니다.' },
  { q: '유니크와 슈페리어의 차이점은 무엇인가요?', a: '유니크는 현장별 단독 최상위에 대형 배너와 함께 노출되며, 슈페리어는 유니크 다음 영역에 로고와 함께 노출됩니다.' },
];

export default function SalesPremiumPage() {
  const [uniqueIndex, setUniqueIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // 유니크 자동 슬라이드
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setUniqueIndex((prev) => (prev + 1) % UNIQUE_JOBS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrev = () => {
    setUniqueIndex((prev) => (prev - 1 + UNIQUE_JOBS.length) % UNIQUE_JOBS.length);
    setIsAutoPlaying(false);
  };
  const goToNext = () => {
    setUniqueIndex((prev) => (prev + 1) % UNIQUE_JOBS.length);
    setIsAutoPlaying(false);
  };
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  };

  const currentUnique = UNIQUE_JOBS[uniqueIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* 헤더 */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/sales" className="flex items-center gap-2">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xl font-bold">
                부동산<span className="text-purple-400">인</span>
              </span>
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">분양상담사</span>
            </Link>
            <Link href="/sales/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              로그인
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* 타이틀 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full border border-red-500/30 mb-6">
            <Tag className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-300 font-bold">오픈 기념 90% OFF! 경쟁사 대비 1/15~1/50 가격</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <HardHat className="w-8 h-8 inline mr-2 text-purple-400" />
            분양상담사 광고 상품 안내
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            커피 한 잔 값으로 5일간 공고를 노출하세요.<br />
            <span className="text-cyan-400 font-bold">프리미엄 ₩4,900</span> · <span className="text-blue-400 font-bold">슈페리어 ₩9,900</span> · <span className="text-purple-400 font-bold">유니크 ₩24,900</span>
          </p>
          <Link href="/agent/premium" className="inline-flex items-center gap-1 mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            공인중개사 상품안내 보기 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 유니크 공고 슬라이드 미리보기 */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-purple-400 fill-purple-400" />
            <h2 className="text-lg font-bold">유니크 공고는 이렇게 노출됩니다</h2>
          </div>
          <div
            className="relative bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 rounded-xl overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="absolute top-3 left-3 z-10">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                UNIQUE
              </span>
            </div>
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {uniqueIndex + 1} / {UNIQUE_JOBS.length}
              </span>
            </div>

            <div className="flex flex-col md:flex-row">
              <div className="relative w-full md:w-1/2 h-48 md:h-64 bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                <Building2 className="w-20 h-20 text-white/20" />
                {currentUnique.badges.length > 0 && (
                  <div className="absolute bottom-3 left-3 flex gap-1">
                    {currentUnique.badges.map((badge) => (
                      <span
                        key={badge}
                        className={`text-xs px-2 py-0.5 rounded font-bold ${
                          badge === 'HOT' ? 'bg-red-500 text-white' :
                          badge === '대박' ? 'bg-yellow-500 text-black' :
                          badge === '신규' ? 'bg-green-500 text-white' :
                          'bg-orange-500 text-white'
                        }`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 p-4 md:p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {currentUnique.jobType}
                  </span>
                  <span className="text-white/70 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {currentUnique.region}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 line-clamp-2">{currentUnique.title}</h3>
                <p className="text-white/80 text-sm mb-3 line-clamp-2">{currentUnique.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-purple-500/30 text-purple-300 px-2 py-1 rounded">{currentUnique.salary}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-white/60 text-xs">{currentUnique.company}</span>
                  <span className="text-purple-400 text-sm font-medium">자세히 보기 →</span>
                </div>
              </div>
            </div>

            {/* Nav */}
            <button onClick={goToPrev} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center text-white transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={goToNext} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center text-white transition-colors">
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {UNIQUE_JOBS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setUniqueIndex(idx); setIsAutoPlaying(false); }}
                  className={`w-2 h-2 rounded-full transition-all ${idx === uniqueIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            * 유니크 공고는 레인보우 네온 슬라이더 + 최상단 그리드에 대형 배너로 노출됩니다
          </p>
        </div>

        {/* 4단계 가격표 카드 - 90% OFF */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">상품 가격</h2>
            <p className="text-gray-400 text-sm">정상가 대비 <span className="text-red-400 font-bold text-lg">90% OFF</span> 오픈 특별가</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.tier}
                  className={`relative rounded-2xl overflow-hidden transition-all hover:scale-[1.02] flex flex-col ${
                    plan.recommended
                      ? `border-2 ${plan.borderColor} shadow-xl shadow-purple-500/20`
                      : plan.tier === 'normal'
                      ? 'border border-slate-700/50'
                      : `border border-slate-700 hover:${plan.borderColor}`
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute top-0 left-0 right-0 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-center text-xs font-bold text-white">
                      <Zap className="w-3 h-3 inline mr-1" />추천
                    </div>
                  )}

                  <div className={`p-5 ${plan.recommended ? 'pt-10' : ''} ${plan.bgColor} flex-1 flex flex-col`}>
                    {/* 티어 뱃지 */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo} text-white`}>
                        <Icon className="w-3 h-3" />
                        {plan.name}
                      </span>
                      <span className="text-[10px] text-gray-500">{plan.badge}</span>
                    </div>

                    {/* 가격 - 정상가 취소선 + 90% OFF + 할인가 */}
                    <div className="mb-5">
                      {plan.originalPrice > 0 ? (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-500 line-through">
                              {plan.originalPrice.toLocaleString()}원
                            </span>
                            <span className="text-xs font-black px-1.5 py-0.5 rounded bg-red-500 text-white">
                              90% OFF
                            </span>
                          </div>
                          <div className="flex items-end gap-1">
                            <span className="text-2xl md:text-3xl font-black text-white">
                              {plan.discountedPrice.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-400 mb-1">원/{plan.duration}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            일 {plan.perDay}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-end gap-1 mb-1">
                            <span className="text-2xl md:text-3xl font-black text-slate-400">무료</span>
                          </div>
                          <p className="text-xs text-orange-400">24시간 후 자동 만료</p>
                        </>
                      )}
                    </div>

                    {/* 기능 리스트 */}
                    <ul className="space-y-2.5 mb-5 flex-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.checkColor}`} />
                          <span className="text-gray-300 text-xs">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA 버튼 */}
                    <button className={`w-full py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-sm ${
                      plan.tier === 'normal'
                        ? 'border border-slate-600 text-slate-400 hover:bg-slate-700'
                        : `bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo} hover:opacity-90 text-white`
                    }`}>
                      {plan.tier === 'normal' ? '무료로 시작' : '신청하기'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 효과 통계 */}
        <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700 mb-16">
          <h2 className="text-xl font-bold text-center mb-8">광고 효과</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-700/50 flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-center mb-8">자주 묻는 질문</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
                <h3 className="font-bold mb-2 flex items-start gap-2">
                  <span className="text-purple-400">Q.</span>{faq.q}
                </h3>
                <p className="text-sm text-gray-400 pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-8 border border-purple-500/20">
          <Shield className="w-12 h-12 mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-bold mb-2">광고 상담이 필요하신가요?</h2>
          <p className="text-gray-400 mb-6">전문 상담사가 최적의 광고 상품을 추천해 드립니다.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:1660-0464" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold hover:opacity-90 transition-all">
              <MessageCircle className="w-5 h-5" />전화 상담 1660-0464
            </a>
            <Link href="/agent/premium" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-700 rounded-xl font-medium hover:bg-slate-600 transition-all">
              공인중개사 상품안내 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© BOOIN Corp. 부동산 전문가를 위한 AI 매칭 플랫폼</p>
        </div>
      </footer>
    </div>
  );
}
