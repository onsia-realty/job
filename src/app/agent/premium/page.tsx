'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Crown, Star, Check, Zap, TrendingUp, Eye, Users, Clock,
  Building2, ArrowRight, Sparkles, Shield, MessageCircle, ChevronLeft,
  ChevronRight, MapPin, Briefcase, AlertCircle, Tag,
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
    tier: 'basic',
    name: 'BASIC',
    badge: '반짝이 효과',
    icon: Sparkles,
    gradientFrom: 'from-amber-400',
    gradientTo: 'to-yellow-400',
    borderColor: 'border-amber-400/50',
    bgColor: 'bg-slate-800/50',
    checkColor: 'text-amber-400',
    originalPrice: 49000,
    discountedPrice: 4900,
    duration: '5일',
    perDay: '980원',
    features: [
      '일반 목록에서 반짝이 효과',
      'BASIC 배지 부여',
      '회사명 볼드 + 급여 컬러 강조',
      '골드 글로우 테두리',
      '5일간 노출 보장',
    ],
    recommended: false,
  },
  {
    tier: 'premium',
    name: '프리미엄',
    badge: '전용 그리드',
    icon: Crown,
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-blue-500',
    borderColor: 'border-blue-400',
    bgColor: 'bg-slate-800/50',
    checkColor: 'text-blue-400',
    originalPrice: 99000,
    discountedPrice: 9900,
    duration: '1주일',
    perDay: '1,414원',
    features: [
      'VIP 아래 전용 그리드 섹션',
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
    badge: '최상단 슬라이더',
    icon: Star,
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-yellow-500',
    borderColor: 'border-amber-400',
    bgColor: 'bg-slate-800/50',
    checkColor: 'text-amber-400',
    originalPrice: 249000,
    discountedPrice: 24900,
    duration: '1주일',
    perDay: '3,557원',
    features: [
      '레인보우 네온 슬라이더 최상단',
      '4열 × 2행 VIP 전용 그리드',
      'VIP 골드 배지',
      '조회수 5배 증가 효과',
      '지원자 우선 알림',
      '상세페이지 하이라이트',
    ],
    recommended: true,
  },
];

const COMPETITORS = [
  { name: '잡코리아', dailyCost: '2~5만원', monthlyCost: '60~150만원' },
  { name: '알바몬', dailyCost: '2~3만원', monthlyCost: '60~90만원' },
  { name: '부동산인 VIP', dailyCost: '3,557원', monthlyCost: '9.96만원', highlight: true },
  { name: '부동산인 프리미엄', dailyCost: '1,414원', monthlyCost: '3.96만원', highlight: true },
  { name: '부동산인 BASIC', dailyCost: '980원', monthlyCost: '2.94만원', highlight: true },
];

const STATS = [
  { icon: Eye, value: '5배', label: 'VIP 평균 조회수 증가', color: 'text-amber-500' },
  { icon: Users, value: '3.2배', label: '프리미엄 지원자 증가', color: 'text-blue-500' },
  { icon: Clock, value: '48시간', label: '평균 채용 완료 시간', color: 'text-green-500' },
  { icon: TrendingUp, value: '89%', label: '광고주 만족도', color: 'text-blue-500' },
];

const FAQS = [
  { q: '광고 효과는 언제부터 시작되나요?', a: '결제 완료 후 즉시 광고가 적용됩니다. 관리자 승인 없이 바로 상위 노출이 시작됩니다.' },
  { q: '무료 공고와 BASIC의 차이점은?', a: '무료 공고는 24시간 후 자동 만료됩니다. BASIC(₩4,900)은 5일간 반짝이 효과로 강조 노출됩니다.' },
  { q: 'VIP와 프리미엄의 차이점은 무엇인가요?', a: 'VIP는 가장 상단에 레인보우 네온 슬라이드 배너로 노출되며, 프리미엄은 VIP 다음 전용 그리드에 노출됩니다.' },
];

export default function AgentPremiumPage() {
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
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  };

  const currentVip = VIP_JOBS[vipIndex];

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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full border border-red-500/30 mb-6">
            <Tag className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-300 font-bold">오픈 기념 90% OFF! 경쟁사 대비 1/15~1/50 가격</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <Building2 className="w-8 h-8 inline mr-2 text-blue-400" />
            구인공고 상품 안내
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            커피 한 잔 값으로 5일간 공고를 노출하세요.<br />
            <span className="text-amber-400 font-bold">BASIC ₩4,900</span> · <span className="text-blue-400 font-bold">프리미엄 ₩9,900</span> · <span className="text-yellow-400 font-bold">VIP ₩24,900</span>
          </p>
          <Link href="/agent/jobs" className="inline-flex items-center gap-1 mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            구인공고 바로가기 <ArrowRight className="w-3 h-3" />
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
            <div className="absolute top-3 left-3 z-10">
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                VIP
              </span>
            </div>
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {vipIndex + 1} / {VIP_JOBS.length}
              </span>
            </div>

            <div className="flex flex-col md:flex-row">
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
                <h3 className="text-lg md:text-xl font-bold mb-2 line-clamp-2">{currentVip.title}</h3>
                <p className="text-white/80 text-sm mb-3 line-clamp-2">{currentVip.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-amber-500/30 text-amber-300 px-2 py-1 rounded">{currentVip.salary}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-white/60 text-xs">{currentVip.company}</span>
                  <span className="text-amber-400 text-sm font-medium">자세히 보기 →</span>
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
              {VIP_JOBS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setVipIndex(idx); setIsAutoPlaying(false); }}
                  className={`w-2 h-2 rounded-full transition-all ${idx === vipIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            * VIP 공고는 레인보우 네온 슬라이더 + 최상단 그리드에 대형 배너로 노출됩니다
          </p>
        </div>

        {/* ★ 4단계 가격표 카드 - 90% OFF */}
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
                      ? `border-2 ${plan.borderColor} shadow-xl shadow-amber-500/20`
                      : plan.tier === 'normal'
                      ? 'border border-slate-700/50'
                      : `border border-slate-700 hover:${plan.borderColor}`
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute top-0 left-0 right-0 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-center text-xs font-bold text-black">
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

        {/* 동시 노출 할인 (업셀) - 히든 */}
        <div className="hidden bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 md:p-8 border border-blue-500/20 mb-16">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-2">
              <Tag className="w-5 h-5 inline mr-1 text-cyan-400" />
              주거용 + 상업용 동시 구매 10% 추가 할인
            </h2>
            <p className="text-sm text-gray-400">양쪽 카테고리에 동시 노출하여 더 많은 지원자를 확보하세요</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { tier: 'VIP', single: 24900, dual: 44800, save: 5000, color: 'from-amber-500 to-yellow-500' },
              { tier: '프리미엄', single: 9900, dual: 17800, save: 2000, color: 'from-blue-600 to-blue-500' },
              { tier: 'BASIC', single: 4900, dual: 8800, save: 1000, color: 'from-amber-400 to-yellow-400' },
            ].map((item) => (
              <div key={item.tier} className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${item.color} text-white mb-2`}>
                  {item.tier}
                </span>
                <p className="text-sm text-gray-400 mb-1">
                  {item.single.toLocaleString()}원 × 2 = <span className="line-through">{(item.single * 2).toLocaleString()}원</span>
                </p>
                <p className="text-xl font-black text-white">
                  {item.dual.toLocaleString()}<span className="text-sm font-normal text-gray-400">원</span>
                </p>
                <p className="text-xs text-green-400 mt-1">{item.save.toLocaleString()}원 절약</p>
              </div>
            ))}
          </div>
        </div>

        {/* 경쟁사 비교 테이블 (히든) */}
        <div className="hidden mb-16">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold mb-2">경쟁사 대비 가격 비교</h2>
            <p className="text-sm text-gray-400">잡코리아 대비 <span className="text-cyan-400 font-bold">1/15~1/42</span>, 알바몬 대비 <span className="text-cyan-400 font-bold">1/20~1/50</span></p>
          </div>
          <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
            <div className="grid grid-cols-3 gap-0 text-xs font-bold text-gray-400 uppercase tracking-wide border-b border-slate-700">
              <div className="px-4 py-3">플랫폼</div>
              <div className="px-4 py-3 text-center">상위노출 비용/일</div>
              <div className="px-4 py-3 text-center">월 기준</div>
            </div>
            {COMPETITORS.map((comp, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-3 gap-0 border-b border-slate-700/50 ${
                  comp.highlight ? 'bg-blue-500/5' : ''
                }`}
              >
                <div className={`px-4 py-3 text-sm ${comp.highlight ? 'text-cyan-400 font-bold' : 'text-gray-300'}`}>
                  {comp.name}
                </div>
                <div className={`px-4 py-3 text-center text-sm ${comp.highlight ? 'text-white font-bold' : 'text-gray-400'}`}>
                  {comp.dailyCost}
                </div>
                <div className={`px-4 py-3 text-center text-sm ${comp.highlight ? 'text-white font-bold' : 'text-gray-400'}`}>
                  {comp.monthlyCost}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">
            * BASIC 4,900원 = 커피 한 잔 값 = 임펄스 구매 영역
          </p>
        </div>

        {/* 슬롯 구조 안내 - 히든 */}
        <div className="hidden bg-slate-800/30 rounded-2xl p-6 md:p-8 border border-slate-700 mb-16">
          <h2 className="text-xl font-bold text-center mb-6">카테고리별 독립 슬롯 구조</h2>
          <p className="text-center text-sm text-gray-400 mb-6">주거용 / 상업용 각각 독립 슬롯 → 유료 인벤토리 2배</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { tier: 'VIP 슬라이더', slots: '8개 회전', total: '× 2 = 16', color: 'text-amber-400', border: 'border-amber-500/30' },
              { tier: 'VIP 그리드', slots: '8칸', total: '× 2 = 16', color: 'text-amber-400', border: 'border-amber-500/30' },
              { tier: '프리미엄', slots: '15칸', total: '× 2 = 30', color: 'text-blue-400', border: 'border-blue-500/30' },
              { tier: 'BASIC', slots: '30칸', total: '× 2 = 60', color: 'text-yellow-400', border: 'border-yellow-500/30' },
            ].map((slot) => (
              <div key={slot.tier} className={`text-center p-4 rounded-xl bg-slate-800/50 border ${slot.border}`}>
                <p className={`text-sm font-bold ${slot.color} mb-1`}>{slot.tier}</p>
                <p className="text-lg font-black text-white">{slot.slots}</p>
                <p className="text-xs text-gray-500">{slot.total}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-4">무료 공고: 무제한 (24시간 한정) · 일반 테이블 20개/페이지</p>
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
