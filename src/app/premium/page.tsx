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
} from 'lucide-react';

// 카테고리 타입
type CategoryType = 'agent' | 'sales';

// 가격 정책 데이터
const PRICING_DATA = {
  agent: {
    title: '공인중개사',
    icon: Building2,
    color: 'blue',
    plans: [
      {
        tier: 'normal',
        name: '일반',
        badge: '무료로 시작',
        color: 'emerald',
        gradientFrom: 'from-emerald-600',
        gradientTo: 'to-teal-500',
        borderColor: 'border-emerald-500/30',
        bgColor: 'bg-emerald-50',
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
        color: 'blue',
        gradientFrom: 'from-blue-600',
        gradientTo: 'to-blue-500',
        borderColor: 'border-blue-400',
        bgColor: 'bg-blue-50',
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
        color: 'amber',
        gradientFrom: 'from-amber-500',
        gradientTo: 'to-yellow-500',
        borderColor: 'border-amber-400',
        bgColor: 'bg-amber-50',
        prices: [
          { duration: '7일', price: 99000, perDay: 14143, discount: null },
          { duration: '14일', price: 179000, perDay: 12786, discount: 10 },
          { duration: '30일', price: 299000, perDay: 9967, discount: 20 },
        ],
        features: [
          '검색 결과 최상단 노출',
          '대형 썸네일 이미지',
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
        name: '일반',
        badge: '무료로 시작',
        color: 'emerald',
        gradientFrom: 'from-emerald-600',
        gradientTo: 'to-teal-500',
        borderColor: 'border-emerald-500/30',
        bgColor: 'bg-emerald-50',
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
        color: 'cyan',
        gradientFrom: 'from-cyan-500',
        gradientTo: 'to-teal-500',
        borderColor: 'border-cyan-400',
        bgColor: 'bg-cyan-50',
        prices: [
          { duration: '7일', price: 49000, perDay: 7000, discount: null },
          { duration: '14일', price: 89000, perDay: 6357, discount: 10 },
          { duration: '30일', price: 149000, perDay: 4967, discount: 20 },
        ],
        features: [
          '프리미엄 영역 노출',
          '프리미엄 시안 배지',
          '조회수 2배 증가 효과',
          '지원자 알림',
        ],
        recommended: false,
      },
      {
        tier: 'superior',
        name: '수페리어',
        badge: '프리미엄 노출',
        color: 'blue',
        gradientFrom: 'from-blue-600',
        gradientTo: 'to-indigo-500',
        borderColor: 'border-blue-400',
        bgColor: 'bg-blue-50',
        prices: [
          { duration: '7일', price: 79000, perDay: 11286, discount: null },
          { duration: '14일', price: 139000, perDay: 9929, discount: 10 },
          { duration: '30일', price: 229000, perDay: 7633, discount: 20 },
        ],
        features: [
          '유니크 다음 상위 노출',
          '수페리어 블루 배지',
          '조회수 4배 증가 효과',
          '현장 로고 강조',
          '지원자 우선 알림',
        ],
        recommended: false,
      },
      {
        tier: 'unique',
        name: '유니크',
        badge: '단독 최상위',
        color: 'purple',
        gradientFrom: 'from-purple-600',
        gradientTo: 'to-pink-500',
        borderColor: 'border-purple-400',
        bgColor: 'bg-purple-50',
        prices: [
          { duration: '7일', price: 149000, perDay: 21286, discount: null },
          { duration: '14일', price: 269000, perDay: 19214, discount: 10 },
          { duration: '30일', price: 449000, perDay: 14967, discount: 20 },
        ],
        features: [
          '현장별 단독 최상위 노출',
          '대형 배너 이미지',
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
  { icon: Eye, value: '5배', label: 'VIP 평균 조회수 증가', color: 'text-amber-500' },
  { icon: Users, value: '3.2배', label: '프리미엄 지원자 증가', color: 'text-blue-500' },
  { icon: Clock, value: '48시간', label: '평균 채용 완료 시간', color: 'text-green-500' },
  { icon: TrendingUp, value: '89%', label: '광고주 만족도', color: 'text-purple-500' },
];

export default function PremiumPricingPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('agent');
  const [selectedDuration, setSelectedDuration] = useState(0); // 0: 7일, 1: 14일, 2: 30일

  const currentData = PRICING_DATA[selectedCategory];
  const CategoryIcon = currentData.icon;

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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full border border-amber-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-300">프리미엄 광고로 채용 성공률 UP!</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            광고 상품 안내
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            부동산인에서 최고의 인재를 빠르게 만나보세요.<br />
            상위 노출 광고로 지원자 수와 조회수를 극대화하세요.
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
                {idx > 0 && (
                  <span className="ml-1 text-xs text-green-400">
                    -{idx === 1 ? '10' : '20'}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 가격표 카드 */}
        <div className={`grid gap-6 mb-16 ${
          selectedCategory === 'agent' ? 'md:grid-cols-3' : 'md:grid-cols-4'
        }`}>
          {currentData.plans.map((plan) => {
            const priceInfo = plan.prices[selectedDuration];
            const isRecommended = plan.recommended;

            return (
              <div
                key={plan.tier}
                className={`relative rounded-2xl overflow-hidden transition-all hover:scale-[1.02] flex flex-col ${
                  isRecommended
                    ? `border-2 ${plan.borderColor} shadow-xl shadow-${plan.color}-500/20`
                    : plan.tier === 'normal'
                    ? 'border border-emerald-500/20 hover:border-emerald-500/40'
                    : 'border border-slate-700'
                }`}
              >
                {/* 추천 배지 */}
                {isRecommended && (
                  <div className={`absolute top-0 left-0 right-0 py-1.5 bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo} text-center text-xs font-bold`}>
                    <Zap className="w-3 h-3 inline mr-1" />
                    추천
                  </div>
                )}

                <div className={`p-6 ${isRecommended ? 'pt-10' : ''} bg-slate-800/50 flex-1 flex flex-col`}>
                  {/* 티어 배지 */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo}`}>
                      {plan.tier === 'vip' || plan.tier === 'unique' ? (
                        <Star className="w-3 h-3 fill-current" />
                      ) : plan.tier === 'normal' ? (
                        <Zap className="w-3 h-3" />
                      ) : (
                        <Crown className="w-3 h-3" />
                      )}
                      {plan.name}
                    </span>
                    <span className="text-xs text-gray-500">{plan.badge}</span>
                  </div>

                  {/* 가격 */}
                  <div className="mb-6">
                    <div className="flex items-end gap-1 mb-1">
                      <span className={`text-3xl font-bold ${plan.tier === 'normal' ? 'text-emerald-400' : ''}`}>
                        {formatPrice(priceInfo.price)}
                      </span>
                      {priceInfo.price > 0 && (
                        <span className="text-sm text-gray-500 mb-1">/ {['7일', '14일', '30일'][selectedDuration]}</span>
                      )}
                    </div>
                    {priceInfo.price > 0 ? (
                      <p className="text-xs text-gray-500">
                        일 {formatPrice(priceInfo.perDay)}
                        {priceInfo.discount && (
                          <span className="ml-2 text-green-400">{priceInfo.discount}% 할인</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-emerald-500/70">부담 없이 바로 시작하세요</p>
                    )}
                  </div>

                  {/* 기능 목록 */}
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 text-${plan.color}-400`} />
                        <span className="text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA 버튼 */}
                  <button
                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      plan.tier === 'normal'
                        ? 'border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10'
                        : `bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo} hover:opacity-90`
                    }`}
                  >
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
                q: '광고 기간을 연장할 수 있나요?',
                a: '네, 마이페이지에서 언제든지 광고 기간을 연장하실 수 있습니다. 연장 시에도 할인이 적용됩니다.',
              },
              {
                q: 'VIP와 프리미엄의 차이점은 무엇인가요?',
                a: 'VIP는 가장 상단에 대형 썸네일과 함께 노출되며, 프리미엄은 VIP 다음 영역에 로고와 함께 노출됩니다.',
              },
              {
                q: '환불 정책은 어떻게 되나요?',
                a: '광고 시작 후 24시간 이내 미노출 시 전액 환불, 이후에는 잔여 기간에 대해 비례 환불됩니다.',
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
              href="tel:1660-0000"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold hover:opacity-90 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              전화 상담 1660-0000
            </a>
            <Link
              href="/event/premium"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-700 rounded-xl font-medium hover:bg-slate-600 transition-all"
            >
              플랫폼 소개 보기
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
