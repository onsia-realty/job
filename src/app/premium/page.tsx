'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/shared/Footer';
import { useAuth } from '@/contexts/AuthContext';
import {
  Crown, Star, Check, Zap, TrendingUp, Eye, Users, Clock,
  Building2, HardHat, ArrowRight, Sparkles, Shield, MessageCircle,
  ChevronLeft, ChevronRight, MapPin, Briefcase, Tag, User,
} from 'lucide-react';

// 카테고리 타입
type CategoryType = 'agent' | 'sales';

// VIP 슬라이드 데이터 (공인중개사)
const AGENT_VIP_JOBS = [
  {
    id: 'v1',
    title: '강남역 초역세권 중개사무소 공인중개사 모집',
    description: '월 거래량 50건 이상! 강남 핵심상권 대형 중개사무소에서 함께할 공인중개사를 모집합니다.',
    company: '(주)강남부동산',
    region: '서울 강남',
    jobType: '매매·임대',
    salary: '기본급 300만 + 인센티브',
    badges: ['HOT', '급구'],
    image: '/images/grid-1.png',
  },
  {
    id: 'v2',
    title: '판교 테크노밸리 상업용 전문 중개사 급구',
    description: '판교 IT밸리 오피스·상가 전문. 법인 거래 다수, 높은 수수료 보장.',
    company: '판교프라퍼티',
    region: '경기 성남',
    jobType: '상업용',
    salary: '수수료 70% 지급',
    badges: ['신규', '인기'],
    image: '/images/grid-2.png',
  },
  {
    id: 'v3',
    title: '해운대 마린시티 고급 주거 전문 중개사',
    description: '부산 해운대 최고급 아파트 단지 전담. 고액 매매 전문 중개사 모집.',
    company: '해운대에셋공인중개사',
    region: '부산 해운대',
    jobType: '매매 전문',
    salary: '수수료 60% + 월 고정 200만',
    badges: ['HOT'],
    image: '/images/grid-3.png',
  },
];

// 유니크 슬라이드 데이터 (분양상담사)
const SALES_UNIQUE_JOBS = [
  {
    id: 'u1',
    title: '힐스테이트 광교 분양상담사 대규모 모집',
    description: '조건변경 수수료인상! 대박현장 급구합니다. 숙소+일비+식대 지원.',
    company: '(주)분양프라자',
    region: '경기 수원',
    jobType: '아파트',
    salary: '수수료 최대 400만',
    badges: ['HOT', '대박'],
    image: '/images/grid-2.png',
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
    image: '/images/grid-3.png',
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
    image: '/images/grid-4.png',
  },
];

// 가격 데이터
const PRICING_DATA = {
  agent: {
    title: '공인중개사',
    icon: Building2,
    color: 'blue' as const,
    topBadgeLabel: 'VIP',
    topBadgeClass: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black',
    slideGradient: 'from-blue-900 via-blue-800 to-cyan-900',
    slideTitle: 'VIP 공고는 이렇게 노출됩니다',
    slideNote: '* VIP 공고는 레인보우 네온 슬라이더 + 최상단 그리드에 대형 배너로 노출됩니다',
    accentColor: 'text-amber-400',
    salaryBg: 'bg-amber-500/30 text-amber-300',
    detailColor: 'text-amber-400',
    plans: [
      {
        tier: 'normal', name: '무료', badge: '24시간 한정', icon: Zap,
        gradientFrom: 'from-slate-500', gradientTo: 'to-slate-400',
        borderColor: 'border-slate-500/30', checkColor: 'text-slate-400',
        originalPrice: 0, discountedPrice: 0, duration: '24시간', perDay: '0원',
        features: ['일반 목록 하단 노출', '텍스트 형식 공고', '24시간 후 자동 만료'],
        recommended: false,
      },
      {
        tier: 'basic', name: 'BASIC', badge: '반짝이 효과', icon: Sparkles,
        gradientFrom: 'from-amber-400', gradientTo: 'to-yellow-400',
        borderColor: 'border-amber-400/50', checkColor: 'text-amber-400',
        originalPrice: 49000, discountedPrice: 4900, duration: '5일', perDay: '980원',
        features: ['일반 목록에서 반짝이 효과', 'BASIC 배지 부여', '회사명 볼드 + 급여 컬러 강조', '골드 글로우 테두리', '5일간 노출 보장'],
        recommended: false,
      },
      {
        tier: 'premium', name: '프리미엄', badge: '전용 그리드', icon: Crown,
        gradientFrom: 'from-blue-600', gradientTo: 'to-blue-500',
        borderColor: 'border-blue-400', checkColor: 'text-blue-400',
        originalPrice: 99000, discountedPrice: 9900, duration: '1주일', perDay: '1,414원',
        features: ['VIP 아래 전용 그리드 섹션', '프리미엄 블루 배지', '조회수 3배 증가 효과', '로고 강조 표시', '지원자 알림'],
        recommended: false,
      },
      {
        tier: 'vip', name: 'VIP', badge: '최상단 슬라이더', icon: Star,
        gradientFrom: 'from-amber-500', gradientTo: 'to-yellow-500',
        borderColor: 'border-amber-400', checkColor: 'text-amber-400',
        originalPrice: 249000, discountedPrice: 24900, duration: '1주일', perDay: '3,557원',
        features: ['레인보우 네온 슬라이더 최상단', '4열 × 2행 VIP 전용 그리드', 'VIP 골드 배지', '조회수 5배 증가 효과', '지원자 우선 알림', '상세페이지 하이라이트'],
        recommended: true,
      },
    ],
    stats: [
      { icon: Eye, value: '5배', label: 'VIP 평균 조회수 증가', color: 'text-amber-500' },
      { icon: Users, value: '3.2배', label: '프리미엄 지원자 증가', color: 'text-blue-500' },
      { icon: Clock, value: '48시간', label: '평균 채용 완료 시간', color: 'text-green-500' },
      { icon: TrendingUp, value: '89%', label: '광고주 만족도', color: 'text-blue-500' },
    ],
    faqs: [
      { q: '광고 효과는 언제부터 시작되나요?', a: '결제 완료 후 즉시 광고가 적용됩니다. 관리자 승인 없이 바로 상위 노출이 시작됩니다.' },
      { q: '무료 공고와 BASIC의 차이점은?', a: '무료 공고는 24시간 후 자동 만료됩니다. BASIC(₩4,900)은 5일간 반짝이 효과로 강조 노출됩니다.' },
      { q: 'VIP와 프리미엄의 차이점은?', a: 'VIP는 최상단에 레인보우 네온 슬라이더 배너로 노출되며, 프리미엄은 VIP 다음 전용 그리드에 노출됩니다.' },
    ],
  },
  sales: {
    title: '분양상담사',
    icon: HardHat,
    color: 'purple' as const,
    topBadgeLabel: 'UNIQUE',
    topBadgeClass: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    slideGradient: 'from-purple-900 via-purple-800 to-pink-900',
    slideTitle: '유니크 공고는 이렇게 노출됩니다',
    slideNote: '* 유니크 공고는 레인보우 네온 슬라이더 + 최상단 그리드에 대형 배너로 노출됩니다',
    accentColor: 'text-purple-400',
    salaryBg: 'bg-purple-500/30 text-purple-300',
    detailColor: 'text-purple-400',
    plans: [
      {
        tier: 'normal', name: '무료', badge: '24시간 한정', icon: Zap,
        gradientFrom: 'from-slate-500', gradientTo: 'to-slate-400',
        borderColor: 'border-slate-500/30', checkColor: 'text-slate-400',
        originalPrice: 0, discountedPrice: 0, duration: '24시간', perDay: '0원',
        features: ['일반 목록 하단 노출', '텍스트 형식 공고', '24시간 후 자동 만료'],
        recommended: false,
      },
      {
        tier: 'premium', name: '프리미엄', badge: '반짝이 효과', icon: Sparkles,
        gradientFrom: 'from-cyan-500', gradientTo: 'to-teal-500',
        borderColor: 'border-cyan-400/50', checkColor: 'text-cyan-400',
        originalPrice: 49000, discountedPrice: 4900, duration: '5일', perDay: '980원',
        features: ['일반 목록에서 반짝이 효과', '프리미엄 시안 배지', '현장명 볼드 + 급여 컬러 강조', '시안 글로우 테두리', '5일간 노출 보장'],
        recommended: false,
      },
      {
        tier: 'superior', name: '슈페리어', badge: '전용 그리드', icon: Crown,
        gradientFrom: 'from-blue-600', gradientTo: 'to-indigo-500',
        borderColor: 'border-blue-400', checkColor: 'text-blue-400',
        originalPrice: 99000, discountedPrice: 9900, duration: '1주일', perDay: '1,414원',
        features: ['유니크 아래 전용 그리드 섹션', '슈페리어 블루 배지', '조회수 4배 증가 효과', '현장 로고 강조', '지원자 우선 알림'],
        recommended: false,
      },
      {
        tier: 'unique', name: '유니크', badge: '최상단 슬라이더', icon: Star,
        gradientFrom: 'from-purple-600', gradientTo: 'to-pink-500',
        borderColor: 'border-purple-400', checkColor: 'text-purple-400',
        originalPrice: 249000, discountedPrice: 24900, duration: '1주일', perDay: '3,557원',
        features: ['레인보우 네온 슬라이더 최상단', '4열 × 2행 유니크 전용 그리드', '유니크 퍼플 배지', '조회수 7배 증가 효과', '지원자 실시간 알림', '현장 상세정보 하이라이트', '분양팀 직접 연결'],
        recommended: true,
      },
    ],
    stats: [
      { icon: Eye, value: '7배', label: '유니크 평균 조회수 증가', color: 'text-purple-500' },
      { icon: Users, value: '4.5배', label: '슈페리어 지원자 증가', color: 'text-blue-500' },
      { icon: Clock, value: '36시간', label: '평균 채용 완료 시간', color: 'text-green-500' },
      { icon: TrendingUp, value: '92%', label: '광고주 만족도', color: 'text-purple-500' },
    ],
    faqs: [
      { q: '광고 효과는 언제부터 시작되나요?', a: '결제 완료 후 즉시 광고가 적용됩니다. 관리자 승인 없이 바로 상위 노출이 시작됩니다.' },
      { q: '무료 공고와 프리미엄의 차이점은?', a: '무료 공고는 24시간 후 자동 만료됩니다. 프리미엄(₩4,900)은 5일간 반짝이 효과로 강조 노출됩니다.' },
      { q: '유니크와 슈페리어의 차이점은?', a: '유니크는 최상단에 레인보우 네온 슬라이더 배너로 노출되며, 슈페리어는 유니크 다음 전용 그리드에 노출됩니다.' },
    ],
  },
};

export default function PremiumPricingPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('agent');
  const [slideIndex, setSlideIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const currentData = PRICING_DATA[selectedCategory];
  const slideJobs = selectedCategory === 'agent' ? AGENT_VIP_JOBS : SALES_UNIQUE_JOBS;
  const currentSlide = slideJobs[slideIndex];

  // 탭 변경 시 슬라이드 리셋
  useEffect(() => {
    setSlideIndex(0);
    setIsAutoPlaying(true);
  }, [selectedCategory]);

  // 자동 슬라이드
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slideJobs.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, slideJobs.length]);

  const goToPrev = () => {
    setSlideIndex((prev) => (prev - 1 + slideJobs.length) % slideJobs.length);
    setIsAutoPlaying(false);
  };
  const goToNext = () => {
    setSlideIndex((prev) => (prev + 1) % slideJobs.length);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* 헤더 */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xl font-bold">
                부동산<span className="text-cyan-400">인</span>
              </span>
            </Link>
            {user ? (
              <Link href="/mypage" className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors">
                <User className="w-4 h-4" />
                {user.user_metadata?.name || '마이페이지'}
              </Link>
            ) : (
              <Link href="/agent/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* 타이틀 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-500/30 mb-6">
            <Tag className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-bold">오픈 기념 특별가! 경쟁사 대비 10분의 1 가격</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            광고 상품 안내
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            커피 한 잔 값으로 5일간 공고를 노출하세요.<br />
            부동산인에서 최고의 인재를 빠르게 만나보세요.
          </p>
        </div>

        {/* 카테고리 선택 탭 */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-slate-800/50 rounded-xl p-1.5 border border-slate-700">
            <button
              onClick={() => setSelectedCategory('agent')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                selectedCategory === 'agent'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Building2 className="w-5 h-5" />
              공인중개사
            </button>
            <button
              onClick={() => setSelectedCategory('sales')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                selectedCategory === 'sales'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <HardHat className="w-5 h-5" />
              분양상담사
            </button>
          </div>
        </div>

        {/* VIP/유니크 공고 슬라이드 미리보기 */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Star className={`w-5 h-5 ${currentData.accentColor} fill-current`} />
            <h2 className="text-lg font-bold">{currentData.slideTitle}</h2>
          </div>
          <div
            className={`relative bg-gradient-to-r ${currentData.slideGradient} rounded-xl overflow-hidden`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="absolute top-3 left-3 z-10">
              <span className={`${currentData.topBadgeClass} text-xs font-bold px-3 py-1 rounded-full shadow-lg`}>
                {currentData.topBadgeLabel}
              </span>
            </div>
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {slideIndex + 1} / {slideJobs.length}
              </span>
            </div>

            <div className="flex flex-col md:flex-row">
              <div className="relative w-full md:w-1/2 h-48 md:h-64">
                <Image src={currentSlide.image} alt={currentSlide.title} fill className="object-cover" />
                {currentSlide.badges.length > 0 && (
                  <div className="absolute bottom-3 left-3 flex gap-1">
                    {currentSlide.badges.map((badge) => (
                      <span
                        key={badge}
                        className={`text-xs px-2 py-0.5 rounded font-bold ${
                          badge === 'HOT' ? 'bg-red-500 text-white' :
                          badge === '급구' ? 'bg-yellow-500 text-black' :
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
                    {currentSlide.jobType}
                  </span>
                  <span className="text-white/70 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {currentSlide.region}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 line-clamp-2">{currentSlide.title}</h3>
                <p className="text-white/80 text-sm mb-3 line-clamp-2">{currentSlide.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`${currentData.salaryBg} px-2 py-1 rounded`}>{currentSlide.salary}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-white/60 text-xs">{currentSlide.company}</span>
                  <span className={`${currentData.detailColor} text-sm font-medium`}>자세히 보기 →</span>
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
              {slideJobs.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSlideIndex(idx); setIsAutoPlaying(false); }}
                  className={`w-2 h-2 rounded-full transition-all ${idx === slideIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            {currentData.slideNote}
          </p>
        </div>

        {/* 상품 가격 */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">상품 가격</h2>
            <p className="text-gray-400 text-sm">오픈 기념 특별가! <span className="text-cyan-400 font-bold text-lg">경쟁사 대비 10분의 1 가격</span></p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentData.plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.tier}
                  className={`relative rounded-2xl overflow-hidden transition-all hover:scale-[1.02] flex flex-col ${
                    plan.recommended
                      ? `border-2 ${plan.borderColor} shadow-xl shadow-${currentData.color === 'purple' ? 'purple' : 'amber'}-500/20`
                      : plan.tier === 'normal'
                      ? 'border border-slate-700/50'
                      : `border border-slate-700 hover:${plan.borderColor}`
                  }`}
                >
                  {plan.recommended && (
                    <div className={`absolute top-0 left-0 right-0 py-1.5 bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo} text-center text-xs font-bold ${currentData.color === 'purple' ? 'text-white' : 'text-black'}`}>
                      <Zap className="w-3 h-3 inline mr-1" />추천
                    </div>
                  )}

                  <div className={`p-5 ${plan.recommended ? 'pt-10' : ''} bg-slate-800/50 flex-1 flex flex-col`}>
                    {/* 티어 뱃지 */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo} text-white`}>
                        <Icon className="w-3 h-3" />
                        {plan.name}
                      </span>
                      <span className="text-[10px] text-gray-500">{plan.badge}</span>
                    </div>

                    {/* 가격 */}
                    <div className="mb-5">
                      {plan.originalPrice > 0 ? (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-500 line-through">
                              {plan.originalPrice.toLocaleString()}원
                            </span>
                            <span className="text-xs font-black px-1.5 py-0.5 rounded bg-cyan-500 text-white">
                              특별가
                            </span>
                          </div>
                          <div className="flex items-end gap-1">
                            <span className="text-2xl md:text-3xl font-black text-white">
                              {plan.discountedPrice.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-400 mb-1">원/{plan.duration}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">일 {plan.perDay}</p>
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
            {currentData.stats.map((stat, idx) => {
              const StatIcon = stat.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-700/50 flex items-center justify-center">
                    <StatIcon className={`w-6 h-6 ${stat.color}`} />
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
            {currentData.faqs.map((faq, idx) => (
              <div key={idx} className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
                <h3 className="font-bold mb-2 flex items-start gap-2">
                  <span className={selectedCategory === 'agent' ? 'text-blue-400' : 'text-purple-400'}>Q.</span>
                  {faq.q}
                </h3>
                <p className="text-sm text-gray-400 pl-6">{faq.a}</p>
              </div>
            ))}
            <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
              <h3 className="font-bold mb-2 flex items-start gap-2">
                <span className="text-cyan-400">Q.</span>
                특별가는 언제까지인가요?
              </h3>
              <p className="text-sm text-gray-400 pl-6">오픈 기념 특별가로 운영 중이며, 별도 공지 전까지 할인이 유지됩니다.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl p-8 border border-cyan-500/20">
          <Shield className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
          <h2 className="text-2xl font-bold mb-2">광고 상담이 필요하신가요?</h2>
          <p className="text-gray-400 mb-6">전문 상담사가 최적의 광고 상품을 추천해 드립니다.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:1660-0464" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold hover:opacity-90 transition-all">
              <MessageCircle className="w-5 h-5" />
              전화 상담 1660-0464
            </a>
          </div>
        </div>
      </main>

      <Footer variant="simple" />
    </div>
  );
}
