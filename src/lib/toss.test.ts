import { describe, it, expect } from 'vitest';
import { generateOrderId, PAYMENT_PRODUCTS, TOSS_CONFIG } from './toss';

// ============================================================
// TOSS_CONFIG
// ============================================================
describe('TOSS_CONFIG', () => {
  it('clientKey가 존재한다 (setup.ts에서 stubEnv)', () => {
    expect(TOSS_CONFIG.clientKey).toBe('test-toss-client-key');
  });
});

// ============================================================
// generateOrderId
// ============================================================
describe('generateOrderId', () => {
  it('order- 접두사로 시작', () => {
    const id = generateOrderId();
    expect(id).toMatch(/^order-/);
  });

  it('포맷: order-{timestamp}-{random}', () => {
    const id = generateOrderId();
    const parts = id.split('-');
    // order, timestamp, random (random에 - 없음)
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe('order');
    // timestamp는 숫자
    expect(Number(parts[1])).toBeGreaterThan(0);
    // random은 alphanumeric 6자
    expect(parts[2]).toMatch(/^[a-z0-9]{1,6}$/);
  });

  it('100회 생성 시 모두 고유', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateOrderId()));
    expect(ids.size).toBe(100);
  });
});

// ============================================================
// PAYMENT_PRODUCTS
// ============================================================
describe('PAYMENT_PRODUCTS', () => {
  it('총 6개 상품', () => {
    expect(Object.keys(PAYMENT_PRODUCTS)).toHaveLength(6);
  });

  it('공인중개사 3개 (agent-)', () => {
    const agentKeys = Object.keys(PAYMENT_PRODUCTS).filter((k) => k.startsWith('agent-'));
    expect(agentKeys).toHaveLength(3);
    expect(agentKeys).toEqual(['agent-basic', 'agent-premium', 'agent-vip']);
  });

  it('분양상담사 3개 (sales-)', () => {
    const salesKeys = Object.keys(PAYMENT_PRODUCTS).filter((k) => k.startsWith('sales-'));
    expect(salesKeys).toHaveLength(3);
    expect(salesKeys).toEqual(['sales-premium', 'sales-superior', 'sales-unique']);
  });

  it('모든 상품에 필수 필드 존재', () => {
    for (const [key, product] of Object.entries(PAYMENT_PRODUCTS)) {
      expect(product, `${key} missing tier`).toHaveProperty('tier');
      expect(product, `${key} missing name`).toHaveProperty('name');
      expect(product, `${key} missing price`).toHaveProperty('price');
      expect(product, `${key} missing duration`).toHaveProperty('duration');
      expect(product, `${key} missing category`).toHaveProperty('category');
    }
  });

  it('가격 범위 1,000원 ~ 100,000원', () => {
    for (const [key, product] of Object.entries(PAYMENT_PRODUCTS)) {
      expect(product.price, `${key} price`).toBeGreaterThanOrEqual(1000);
      expect(product.price, `${key} price`).toBeLessThanOrEqual(100000);
    }
  });

  it('category는 agent 또는 sales', () => {
    for (const product of Object.values(PAYMENT_PRODUCTS)) {
      expect(['agent', 'sales']).toContain(product.category);
    }
  });

  it('키 형식: {category}-{tier}', () => {
    for (const [key, product] of Object.entries(PAYMENT_PRODUCTS)) {
      expect(key).toBe(`${product.category}-${product.tier}`);
    }
  });
});
