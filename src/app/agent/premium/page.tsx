'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Crown, Star, Check, Zap, TrendingUp, Eye, Users, Clock,
  Building2, ArrowRight, Sparkles, Shield, MessageCircle, ChevronLeft,
  ChevronRight, MapPin, Briefcase,
} from 'lucide-react';

// VIP 슬라이드 더미 데이터
const VIP_JOBS = [
  {
    id: 'v1',
    title: '강남역 초역세권 중개사무소 공인중개사 모집',
    description: '월 거래량 50건 이상! 강남 핵심상권 대형 중개사무소에서 함께할 공인중개사를 모집합니다.',
    company: '(주)강남부동산',
    region: '서울 강남',
    jobType: '매매·임대',
    salary: '기본급 300만 + 인센티브',
    badges: ['HOT', '급구'],
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
  },
];

const PLANS = [
  {
    tier: 'normal',
    name: '무료',
    badge: '기본 공고',
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-teal-500',
    borderColor: 'border-emerald-500/30',
    checkColor: 'text-emerald-400',
    prices: [
      { duration: '7일', price: 0, perDay: 0, discount: null },
      { duration: '14일', price: 0, perDay: 0, discount: null },
      { duration: '30일', price: 0, perDay: 0, discount: null },
    ],
    features: [
      '기본 리스트 노출',
      '텍스트 형식 공고',
      '기본 지원 접수',
    ],
    recommended: false,
  },
  {
    tier: 'premium',
    name: '프리미엄',
    badge: '상위 노출',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-blue-500',
    borderColor: 'border-blue-400',
    checkColor: 'text-blue-400',
    prices: [
      { duration: '7일', price: 49000, perDay: 7000, discount: null },
      { duration: '14일', price: 89000, perDay: 6357, discount: 10 },
      { duration: '30일', price: 149000, perDay: 4967, discount: 20 },
    ],
    features: [
      'VIP 다음 상위 노출',
      '프리미엄 블루 배지',
      '조회수 3배 증가 효과',
      '로고 강조 표시',
      '지원자 알림',
    ],
    recommended: false,
  },
  {
    tier: 'vip',
    name: 'VIP',
    badge: '최상위 노출',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-yellow-500',
    borderColor: 'border-amber-400',
    checkColor: 'text-amber-400',
    prices: [
      { duration: '7일', price: 99000, perDay: 14143, discount: null },
      { duration: '14일', price: 179000, perDay: 12786, discount: 10 },
      { duration: '30일', price: 299000, perDay: 9967, discount: 20 },
    ],
    features: [
      '검색 결과 최상단 노출',
      '대형 슬라이드 배너',
      'VIP 골드 배지',
      '조회수 5배 증가 효과',
      '지원자 우선 알림',
      '상세페이지 하이라이트',
    ],
    recommended: true,
  },
];

const STATS = [
  { icon: Eye, value: '5배', label: 'VIP 평균 조회수 증가', color: 'text-amber-500' },
  { icon: Users, value: '3.2배', label: '프리미엄 지원자 증가', color: 'text-blue-500' },
  { icon: Clock, value: '48시간', label: '평균 채용 완료 시간', color: 'text-green-500' },
  { icon: TrendingUp, value: '89%', label: '광고주 만족도', color: 'text-blue-500' },
];

const FAQS = [
  { q: '광고 효과는 언제부터 시작되나요?', a: '결제 완료 후 즉시 광고가 적용됩니다. 관리자 승인 없이 바로 상위 노출이 시작됩니다.' },
  { q: '광고 기간을 연장할 수 있나요?', a: '네, 마이페이지에서 언제든지 광고 기간을 연장하실 수 있습니다. 연장 시에도 할인이 적용됩니다.' },
  { q: 'VIP와 프리미엄의 차이점은 무엇인가요?', a: 'VIP는 가장 상단에 대형 슬라이드 배너로 노출되며, 프리미엄은 VIP 다음 영역에 로고와 함께 노출됩니다.' },
  { q: '환불 정책은 어떻게 되나요?', a: '광고 시작 후 24시간 이내 미노출 시 전액 환불, 이후에는 잔여 기간에 대해 비례 환불됩니다.' },
];

export default function AgentPremiumPage() {
  const [selectedDuration, setSelectedDuration] = useState(0);
  const [vipIndex, setVipIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // VIP 자동 슬라이드
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setVipIndex((prev) => (prev + 1) % VIP_JOBS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrev = () => {
    setVipIndex((prev) => (prev - 1 + VIP_JOBS.length) % VIP_JOBS.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setVipIndex((prev) => (prev + 1) % VIP_JOBS.length);
    setIsAutoPlaying(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  };

  const currentVip = VIP_JOBS[vipIndex];

  const formatPrice = (price: number) => {
    if (price === 0) return '무료';
    return price.toLocaleString() + '원';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* 헤더 */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/agent" className="flex items-center gap-2">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xl font-bold">
                부동산<span className="text-blue-400">인</span>
              </span>
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">공인중개사</span>
            </Link>
            <Link href="/agent/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              로그인
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* 타이틀 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full border border-amber-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-300">프리미엄 광고로 채용 성공률 UP!</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <Building2 className="w-8 h-8 inline mr-2 text-blue-400" />
            공인중개사 광고 상품 안내
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            우수한 공인중개사를 빠르게 채용하세요.<br />
            상위 노출 광고로 지원자 수와 조회수를 극대화합니다.
          </p>
          <Link href="/agent/jobs" className="inline-flex items-center gap-1 mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            부동산 구인공고 바로가기 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* VIP 공고 슬라이드 미리보기 */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h2 className="text-lg font-bold">VIP 공고는 이렇게 노출됩니다</h2>
          </div>
          <div
            className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-900 rounded-xl overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* VIP 라벨 */}
            <div className="absolute top-3 left-3 z-10">
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                VIP
              </span>
            </div>
            {/* 슬라이드 카운터 */}
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {vipIndex + 1} / {VIP_JOBS.length}
              </span>
            </div>

            <div className="flex flex-col md:flex-row">
              {/* 썸네일 영역 */}
              <div className="relative w-full md:w-1/2 h-48 md:h-64 bg-gradient-to-br from-blue-700 to-cyan-700 flex items-center justify-center">
                <Building2 className="w-20 h-20 text-white/20" />
                {currentVip.badges.length > 0 && (
                  <div className="absolute bottom-3 left-3 flex gap-1">
                    {currentVip.badges.map((badge) => (
                      <span
                        key={badge}
                        className={`text-xs px-2 py-0.5 rounded font-bold ${
                          badge === 'HOT' ? 'bg-red-500 text-white' :
                          badge === '급구' ? 'bg-yellow-500 text-black' :
                          badge === '신규' ? 'bg-green-500 text-white' :
                          'bg-purple-500 text-white'
                        }`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 정보 영역 */}
              <div className="flex-1 p-4 md:p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {currentVip.jobType}
                  </span>
                  <span className="text-white/70 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {currentVip.region}
                  </span>
                </div>

                <h3 className="text-lg md:text-xl font-bold mb-2 line-clamp-2">
                  {currentVip.title}
                </h3>

                <p className="text-white/80 text-sm mb-3 line-clamp-2">
                  {currentVip.description}
                </p>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-amber-500/30 text-amber-300 px-2 py-1 rounded">
                    {currentVip.salary}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-white/60 text-xs">{currentVip.company}</span>
                  <span className="text-amber-400 text-sm font-medium">자세히 보기 →</span>
                </div>
              </div>
            </div>

            {/* 네비게이션 버튼 */}
            <button
              onClick={goToPrev}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* 도트 인디케이터 */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {VIP_JOBS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setVipIndex(idx);
                    setIsAutoPlaying(false);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === vipIndex ? 'bg-white w-4' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            * VIP 공고는 메인 최상단 슬라이드에 대형 배너로 노출됩니다
          </p>
        </div>

        {/* 기간 선택 */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-slate-800/30 rounded-lg p-1 border border-slate-700/50">
            {['7일', '14일', '30일'].map((duration, idx) => (
              <button
                key={duration}
                onClick={() => setSelectedDuration(idx)}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedDuration === idx
                    ? 'bg-white text-slate-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {duration}
                {idx > 0 && <span className="ml-1 text-xs text-green-400">-{idx === 1 ? '10' : '20'}%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 가격표 카드 */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => {
            const priceInfo = plan.prices[selectedDuration];
            return (
              <div
                key={plan.tier}
                className={`relative rounded-2xl overflow-hidden transition-all hover:scale-[1.02] flex flex-col ${
                  plan.recommended
                    ? `border-2 ${plan.borderColor} shadow-xl shadow-amber-500/20`
                    : plan.tier === 'normal'
                    ? 'border border-emerald-500/20 hover:border-emerald-500/40'
                    : 'border border-slate-700'
                }`}
              >
                {plan.recommended && (
                  <div className={`absolute top-0 left-0 right-0 py-1.5 bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo} text-center text-xs font-bold`}>
                    <Zap className="w-3 h-3 inline mr-1" />추천
                  </div>
                )}
                <div className={`p-6 ${plan.recommended ? 'pt-10' : ''} bg-slate-800/50 flex-1 flex flex-col`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo}`}>
                      {plan.tier === 'vip' ? <Star className="w-3 h-3 fill-current" /> : plan.tier === 'normal' ? <Zap className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                      {plan.name}
                    </span>
                    <span className="text-xs text-gray-500">{plan.badge}</span>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-end gap-1 mb-1">
                      <span className={`text-3xl font-bold ${plan.tier === 'normal' ? 'text-emerald-400' : ''}`}>
                        {formatPrice(priceInfo.price)}
                      </span>
                      {priceInfo.price > 0 && <span className="text-sm text-gray-500 mb-1">/ {['7일', '14일', '30일'][selectedDuration]}</span>}
                    </div>
                    {priceInfo.price > 0 ? (
                      <p className="text-xs text-gray-500">
                        일 {formatPrice(priceInfo.perDay)}
                        {priceInfo.discount && <span className="ml-2 text-green-400">{priceInfo.discount}% 할인</span>}
                      </p>
                    ) : (
                      <p className="text-xs text-emerald-500/70">부담 없이 바로 시작하세요</p>
                    )}
                  </div>
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.checkColor}`} />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    plan.tier === 'normal'
                      ? 'border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10'
                      : `bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo} hover:opacity-90`
                  }`}>
                    {plan.tier === 'normal' ? '무료로 시작하기' : '광고 신청하기'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
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
                  <span className="text-blue-400">Q.</span>{faq.q}
                </h3>
                <p className="text-sm text-gray-400 pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl p-8 border border-blue-500/20">
          <Shield className="w-12 h-12 mx-auto mb-4 text-blue-400" />
          <h2 className="text-2xl font-bold mb-2">광고 상담이 필요하신가요?</h2>
          <p className="text-gray-400 mb-6">전문 상담사가 최적의 광고 상품을 추천해 드립니다.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:1660-0464" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-bold hover:opacity-90 transition-all">
              <MessageCircle className="w-5 h-5" />전화 상담 1660-0464
            </a>
            <Link href="/sales/premium" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-700 rounded-xl font-medium hover:bg-slate-600 transition-all">
              분양상담사 상품안내 <ArrowRight className="w-4 h-4" />
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
