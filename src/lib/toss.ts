// 토스페이먼츠 결제 관련 유틸리티

export const TOSS_CONFIG = {
  clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!,
} as const;

// 결제 상품 정보 타입
export interface PaymentProduct {
  tier: string;
  name: string;
  price: number;
  duration: string;
  category: 'agent' | 'sales';
}

// 결제 가능한 상품 목록 (무료 제외)
export const PAYMENT_PRODUCTS: Record<string, PaymentProduct> = {
  // 공인중개사
  'agent-basic': { tier: 'basic', name: '공인중개사 BASIC', price: 4900, duration: '5일', category: 'agent' },
  'agent-premium': { tier: 'premium', name: '공인중개사 프리미엄', price: 9900, duration: '1주일', category: 'agent' },
  'agent-vip': { tier: 'vip', name: '공인중개사 VIP', price: 24900, duration: '1주일', category: 'agent' },
  // 분양상담사
  'sales-premium': { tier: 'premium', name: '분양상담사 프리미엄', price: 4900, duration: '5일', category: 'sales' },
  'sales-superior': { tier: 'superior', name: '분양상담사 슈페리어', price: 9900, duration: '1주일', category: 'sales' },
  'sales-unique': { tier: 'unique', name: '분양상담사 유니크', price: 24900, duration: '1주일', category: 'sales' },
};

// 고유 주문 ID 생성
export function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `order-${timestamp}-${random}`;
}
