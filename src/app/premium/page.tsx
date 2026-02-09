'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Crown,
  Star,
  Check,
  Zap,
  TrendingUp,
  Eye,
  Users,
  Clock,
  Building2,
  HardHat,
  ArrowRight,
  Sparkles,
  Shield,
  MessageCircle,
  ChevronLeft,
  Tag,
} from 'lucide-react';

// 카테고리 타입
type CategoryType = 'agent' | 'sales';

// 가격 정책 데이터 - 4단계 티어 (90% OFF 오픈 특별가)
const PRICING_DATA = {
  agent: {
    title: '공인중개사',
    icon: Building2,
    color: 'blue',
    plans: [
      {
        tier: 'normal',
        name: '무료',
        badge: '24시간 한정',
        icon: Zap,
        gradientFrom: 'from-slate-500',
        gradientTo: 'to-slate-400',
        borderColor: 'border-slate-500/30',
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
    ],
  },
  sales: {
    title: '분양상담사',
    icon: HardHat,
    color: 'purple',
    plans: [
      {
        tier: 'normal',
        name: '무료',
        badge: '24시간 한정',
        icon: Zap,
        gradientFrom: 'from-slate-500',
        gradientTo: 'to-slate-400',
        borderColor: 'border-slate-500/30',
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
    ],
  },
};

// 효과 통계 데이터
const STATS = [
  { icon: Eye, value: '5배', label: 'VIP/유니크 평균 조회수 증가', color: 'text-amber-500' },
  { icon: Users, value: '3.2배', label: '프리미엄 지원자 증가', color: 'text-blue-500' },
  { icon: Clock, value: '48시간', label: '평균 채용 완료 시간', color: 'text-green-500' },
  { icon: TrendingUp, value: '89%', label: '광고주 만족도', color: 'text-purple-500' },
];

export default function PremiumPricingPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('agent');

  const currentData = PRICING_DATA[selectedCategory];

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
            <Link
              href="/agent/auth/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              로그인
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* 타이틀 섹션 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full border border-red-500/30 mb-6">
            <Tag className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-300 font-bold">오픈 기념 90% OFF! 경쟁사 대비 1/15~1/50 가격</span>
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

        {/* 상품 가격 */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">상품 가격</h2>
            <p className="text-gray-400 text-sm">정상가 대비 <span className="text-red-400 font-bold text-lg">90% OFF</span> 오픈 특별가</p>
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

        {/* FAQ 섹션 */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-center mb-8">자주 묻는 질문</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              {
                q: '광고 효과는 언제부터 시작되나요?',
                a: '결제 완료 후 즉시 광고가 적용됩니다. 관리자 승인 없이 바로 상위 노출이 시작됩니다.',
              },
              {
                q: '무료 공고와 유료 상품의 차이점은?',
                a: '무료 공고는 24시간 후 자동 만료됩니다. BASIC/프리미엄(₩4,900)은 5일간 반짝이 효과로 강조 노출됩니다.',
              },
              {
                q: 'VIP/유니크와 프리미엄/슈페리어의 차이점은?',
                a: 'VIP/유니크는 최상단에 레인보우 네온 슬라이더 배너로 노출되며, 프리미엄/슈페리어는 그 다음 전용 그리드에 노출됩니다.',
              },
              {
                q: '90% 할인은 언제까지인가요?',
                a: '오픈 기념 특별가로 운영 중이며, 별도 공지 전까지 할인이 유지됩니다.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
                <h3 className="font-bold mb-2 flex items-start gap-2">
                  <span className="text-cyan-400">Q.</span>
                  {faq.q}
                </h3>
                <p className="text-sm text-gray-400 pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="text-center bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl p-8 border border-cyan-500/20">
          <Shield className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
          <h2 className="text-2xl font-bold mb-2">광고 상담이 필요하신가요?</h2>
          <p className="text-gray-400 mb-6">
            전문 상담사가 최적의 광고 상품을 추천해 드립니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:1660-0464"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold hover:opacity-90 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              전화 상담 1660-0464
            </a>
            <Link
              href="/agent/premium"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-700 rounded-xl font-medium hover:bg-slate-600 transition-all"
            >
              상세 상품안내 보기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© BOOIN Corp. 부동산 전문가를 위한 AI 매칭 플랫폼</p>
        </div>
      </footer>
    </div>
  );
}
