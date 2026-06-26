// 토스페이먼츠 결제 관련 유틸리티 + 광고상품 단일 가격 출처(single source of truth)

export const TOSS_CONFIG = {
  clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!,
} as const;

// 부가세율
const VAT_RATE = 0.1;

// ────────────────────────────────────────────────────────────
// 광고상품 데이터 모델 (4등급 × 기간선택)
// ────────────────────────────────────────────────────────────

// 한 등급 안의 기간 옵션 (10/20/30일 각각)
export interface DurationOption {
  days: number;        // 구매 기간 (7, 10, 20, 30)
  bonusDays: number;   // 무료 증정일 (0 | 7 | 10)
  price: number;       // 공급가액 (부가세 별도)
  listPrice?: number;  // 정가 취소선용 (없으면 미표시)
}

// 등급 (입문/2단계/다이아/VIP)
export interface PricingTier {
  id: string;                  // 'premium' | 'superior' | 'dia' | 'unique' | 'basic' | 'vip'
  name: string;                // 표시명
  category: 'agent' | 'sales';
  exclusive: boolean;          // 지역 독점(유니크/VIP) 여부
  options: DurationOption[];   // 입문/agent는 길이 1, 나머지 3
}

// ── 헬퍼 ──
export function getVat(price: number): number {
  return Math.round(price * VAT_RATE);
}
export function getTotalPrice(price: number): number {
  return price + getVat(price);
}
// 총 노출일 = 구매일 + 보너스일
export function getExposureDays(o: DurationOption): number {
  return o.days + o.bonusDays;
}
// 할인율(%) — listPrice 대비. 없으면 null
export function getDiscountRate(o: DurationOption): number | null {
  if (!o.listPrice || o.listPrice <= o.price) return null;
  return Math.round((1 - o.price / o.listPrice) * 100);
}

// ────────────────────────────────────────────────────────────
// 가격표 (단일 출처) — key = `${category}-${id}`
// listPrice = 오픈 특별가 ~30% 연출용 앵커 (실가 ÷ 0.7, 만원 단위 반올림). 마케팅 조정 가능값.
// ────────────────────────────────────────────────────────────
export const PRICING_TIERS: Record<string, PricingTier> = {
  // ── 분양상담사 (신규 4등급 + 기간선택) ──
  'sales-premium': {
    id: 'premium', name: '베이직', category: 'sales', exclusive: false,
    options: [
      { days: 7, bonusDays: 7, price: 49000, listPrice: 70000 },   // 7일+7일=14일 (기본)
      { days: 20, bonusDays: 10, price: 98000, listPrice: 140000 }, // 20일+10일=30일 노출
      { days: 30, bonusDays: 0, price: 147000, listPrice: 210000 },
    ],
  },
  'sales-superior': {
    id: 'superior', name: '슈페리어', category: 'sales', exclusive: false,
    options: [
      { days: 10, bonusDays: 0, price: 99000, listPrice: 140000 },
      { days: 20, bonusDays: 10, price: 198000, listPrice: 280000 },
      { days: 30, bonusDays: 0, price: 297000, listPrice: 420000 },
    ],
  },
  'sales-dia': {
    id: 'dia', name: '다이아', category: 'sales', exclusive: false,
    options: [
      { days: 10, bonusDays: 0, price: 150000, listPrice: 210000 },
      { days: 20, bonusDays: 10, price: 300000, listPrice: 430000 },
      { days: 30, bonusDays: 0, price: 450000, listPrice: 640000 },
    ],
  },
  'sales-unique': {
    id: 'unique', name: '유니크', category: 'sales', exclusive: true,
    options: [
      { days: 10, bonusDays: 0, price: 249000, listPrice: 360000 },
      { days: 20, bonusDays: 0, price: 498000, listPrice: 710000 },
      { days: 30, bonusDays: 0, price: 747000, listPrice: 1070000 },
    ],
  },

  // ── 공인중개사 (현행 단가 유지 — UI 리모델 전까지 동작 불변) ──
  'agent-basic': {
    id: 'basic', name: 'BASIC', category: 'agent', exclusive: false,
    options: [{ days: 5, bonusDays: 0, price: 4900, listPrice: 49000 }],
  },
  'agent-premium': {
    id: 'premium', name: '프리미엄', category: 'agent', exclusive: false,
    options: [{ days: 7, bonusDays: 0, price: 9900, listPrice: 99000 }],
  },
  'agent-vip': {
    id: 'vip', name: 'VIP', category: 'agent', exclusive: true,
    options: [{ days: 7, bonusDays: 0, price: 24900, listPrice: 249000 }],
  },
};

// 특정 등급의 기간 옵션 조회. days 미지정 시: 단일옵션이면 그것, 다중이면 20일(주력) 우선 → 첫 옵션.
export function findOption(productKey: string, days?: number): DurationOption | undefined {
  const tier = PRICING_TIERS[productKey];
  if (!tier) return undefined;
  if (days != null) return tier.options.find((o) => o.days === days);
  if (tier.options.length === 1) return tier.options[0];
  return tier.options.find((o) => o.days === 20) ?? tier.options[0];
}

// 결제/서버에서 쓰는 평탄화된 상품 정보. 잘못된 키/일수면 null.
export interface ResolvedProduct {
  productKey: string;
  tier: string;
  name: string;
  category: 'agent' | 'sales';
  exclusive: boolean;
  price: number;        // 공급가액
  listPrice?: number;
  days: number;
  bonusDays: number;
  exposureDays: number; // 실제 노출일 (만료일 계산 기준)
  durationLabel: string;
}

export function resolveProduct(productKey: string, days?: number): ResolvedProduct | null {
  const tier = PRICING_TIERS[productKey];
  if (!tier) return null;
  const opt = findOption(productKey, days);
  if (!opt) return null;
  const exposureDays = getExposureDays(opt);
  return {
    productKey,
    tier: tier.id,
    name: tier.name,
    category: tier.category,
    exclusive: tier.exclusive,
    price: opt.price,
    listPrice: opt.listPrice,
    days: opt.days,
    bonusDays: opt.bonusDays,
    exposureDays,
    durationLabel: `${exposureDays}일`,
  };
}

// 고유 주문 ID 생성
export function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `order-${timestamp}-${random}`;
}
