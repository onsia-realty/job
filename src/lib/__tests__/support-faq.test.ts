import { afterEach, describe, expect, it, vi } from 'vitest';
import { PRICING_TIERS, getTotalPrice } from '@/lib/toss';
import { REFUND_POLICY, getSupportContact } from '@/lib/support-knowledge';
import {
  buildFaqAnswer,
  buildPaymentRefundAnswer,
  detectHandoffRequest,
  matchFaq,
  normalizeQuestion,
  resolveCanned,
  shouldSkipCanned,
  type FaqIntentId,
} from '@/lib/support-faq';
import { AnswerCache, isCacheable } from '@/lib/support-answer-cache';

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('normalizeQuestion', () => {
  it('공백·문장부호·대소문자를 무시한다', () => {
    expect(normalizeQuestion(' 베이직 가격?! ')).toBe('베이직가격');
    expect(normalizeQuestion('VIP 가격')).toBe('vip가격');
  });
});

describe('matchFaq — 문장별 의도', () => {
  const cases: [string, FaqIntentId | null][] = [
    ['분양 광고 얼마에요', 'pricing-sales'],
    ['분양상담사 광고 가격 알려주세요', 'pricing-sales'],
    ['베이직가격', 'pricing-sales-basic'],
    ['분양 베이직 가격이 어떻게 돼요?', 'pricing-sales-basic'],
    ['슈페리어 얼마예요?', 'pricing-sales-superior'],
    ['다이아 등급 가격', 'pricing-sales-dia'],
    ['유니크 비용이 어떻게 되나요', 'pricing-sales-unique'],
    ['공인중개사 광고 비용', 'pricing-agent'],
    ['중개사 VIP 가격', 'pricing-agent'],
    ['광고 가격 얼마예요', 'pricing-all'],
    ['무료 공고 며칠 노출돼요?', 'free-post'],
    ['구인글 어떻게 올려요', 'post-howto'],
    ['유료로 업그레이드 하려면 어떻게 해요', 'upgrade-howto'],
    ['광고 기간 연장 가능한가요', 'extend-period'],
    ['환불 되나요', 'refund-policy'],
    ['환불 규정이 어떻게 돼요?', 'refund-policy'],
    ['결제 취소는 어떻게 하나요', 'refund-policy'],
    ['결제 수단 뭐 있어요', 'payment-method'],
    ['세금계산서 발행 되나요', 'tax-invoice'],
    ['회원가입 어떻게 해요', 'signup-howto'],
    ['회원 가입 방법', 'signup-howto'],
    ['핸드폰 인증 꼭 해야 하나요', 'identity-verification'],
    ['카카오로 로그인 돼요?', 'social-login'],
    ['비번 까먹었어요', 'password-reset'],
    ['비밀번호 찾기', 'password-reset'],
    ['회원 탈퇴 하고 싶어요', 'withdraw'],
    ['기업인증 어떻게 하나요', 'company-verify'],
    ['이력서 등록 방법', 'resume-howto'],
    ['고객센터 운영시간', 'contact-hours'],
    ['고객센터 전화번호 알려줘', 'contact-hours'],
    // 매칭하면 안 되는 질문
    ['그거 20일은요?', null],
    ['내 결제 언제 끝나요', null],
    ['수수료 협상 팁 알려줘', null],
    ['분양가 얼마예요', null],
    ['중개보수 얼마예요', null],
    ['강남 아파트 전세 시세', null],
    ['안녕하세요', null],
    ['전세 계약갱신 연장 되나요', null],
    ['분양 베이직이랑 중개사 BASIC 가격 비교해줘', null],
  ];

  it.each(cases)('"%s" → %s', (q, expected) => {
    expect(matchFaq(q)?.id ?? null).toBe(expected);
  });
});

describe('기능 플래그 의도', () => {
  it('단기임대·시세지도는 플래그가 켜졌을 때만 매칭한다', () => {
    vi.stubEnv('NEXT_PUBLIC_STAY_ENABLED', 'false');
    vi.stubEnv('NEXT_PUBLIC_MARKET_ENABLED', 'false');
    expect(matchFaq('단기임대 서비스 뭐예요')).toBeNull();
    expect(matchFaq('시세지도 어디서 봐요')).toBeNull();
    vi.stubEnv('NEXT_PUBLIC_STAY_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_MARKET_ENABLED', 'true');
    expect(matchFaq('단기임대 서비스 뭐예요')?.id).toBe('stay-intro');
    expect(matchFaq('시세지도 어디서 봐요')?.id).toBe('market-intro');
  });

  it('본인인증 답변은 NEXT_PUBLIC_DANAL_REQUIRED 를 요청 시점에 읽는다', () => {
    vi.stubEnv('NEXT_PUBLIC_DANAL_REQUIRED', '');
    expect(buildFaqAnswer('identity-verification')).toContain('필요 없어요');
    vi.stubEnv('NEXT_PUBLIC_DANAL_REQUIRED', 'true');
    expect(buildFaqAnswer('identity-verification')).toContain('필수예요');
    expect(buildFaqAnswer('signup-howto')).toContain('본인인증이 필요해요');
  });
});

describe('가격 답변 — toss.ts 실제 숫자 + 부가세 별도', () => {
  it('등급별 답변에 모든 기간 옵션의 공급가·결제금액이 들어간다', () => {
    const map: [FaqIntentId, string][] = [
      ['pricing-sales-basic', 'sales-premium'],
      ['pricing-sales-superior', 'sales-superior'],
      ['pricing-sales-unique', 'sales-unique'],
    ];
    for (const [intent, key] of map) {
      const answer = buildFaqAnswer(intent);
      expect(answer).toContain('부가세 별도');
      for (const o of PRICING_TIERS[key].options) {
        expect(answer).toContain(`${won(o.price)} (부가세 별도, 결제금액 ${won(getTotalPrice(o.price))})`);
      }
    }
  });

  it('베이직 첫 옵션은 "49,000원 (부가세 별도, 결제금액 53,900원)" 형식이다', () => {
    const o = PRICING_TIERS['sales-premium'].options[0];
    expect(buildFaqAnswer('pricing-sales-basic')).toContain(
      `${won(o.price)} (부가세 별도, 결제금액 ${won(getTotalPrice(o.price))})`,
    );
  });

  it('다이아는 판매 준비 중으로 안내한다', () => {
    expect(PRICING_TIERS['sales-dia'].purchaseEnabled).toBe(false);
    expect(buildFaqAnswer('pricing-sales-dia')).toContain('판매 준비 중');
  });

  it('분양·중개사 요약에 판매 중인 등급의 가격이 모두 들어간다', () => {
    const sales = buildFaqAnswer('pricing-sales');
    const agent = buildFaqAnswer('pricing-agent');
    for (const t of Object.values(PRICING_TIERS)) {
      if (t.purchaseEnabled === false) continue;
      const text = t.category === 'sales' ? sales : agent;
      expect(text).toContain(t.name);
      for (const o of t.options) expect(text).toContain(won(o.price));
    }
    expect(sales).toContain('부가세 별도');
    expect(agent).toContain('부가세 별도');
    expect(sales).not.toContain('부가세 포함');
    expect(buildFaqAnswer('pricing-all')).toContain('부가세(10%)는 별도');
  });
});

describe('환불 규정 / 결제 답변', () => {
  it('REFUND_POLICY 에서 생성한다', () => {
    const a = buildFaqAnswer('refund-policy');
    for (const s of REFUND_POLICY.withdrawalAllowed) expect(a).toContain(s);
    for (const s of REFUND_POLICY.procedure) expect(a).toContain(s);
    expect(a).toContain(REFUND_POLICY.pageUrl);
    expect(buildPaymentRefundAnswer()).toContain('토스페이먼츠');
  });

  it('연락처 답변은 getSupportContact 값을 쓴다', () => {
    const c = getSupportContact();
    const a = buildFaqAnswer('contact-hours');
    expect(a).toContain(c.email);
    expect(a).toContain(c.phone);
    expect(matchFaq('고객센터 운영시간')?.handoff).toBe(true);
  });
});

describe('detectHandoffRequest — 요청 vs 규정 질문', () => {
  it.each([
    ['상담원 연결해 주세요', 'person'],
    ['사람이랑 얘기하고 싶어요', 'person'],
    ['직원분 바꿔주세요', 'person'],
    ['전화 상담 가능할까요', 'person'],
    ['환불해 주세요', 'refund'],
    ['환불 요청합니다', 'refund'],
    ['환불 요청했는데 언제 돼요?', 'refund'],
    ['결제가 안 돼요', 'payment'],
    ['결제 오류가 났어요', 'payment'],
    ['이중결제 됐어요', 'payment'],
    ['결제 취소해 주세요', 'cancel'],
  ])('"%s" → %s', (q, reason) => {
    expect(detectHandoffRequest(q)).toBe(reason);
  });

  it.each([
    '환불 규정이 어떻게 돼요?',
    '환불 되나요',
    '환불 신청 방법 알려주세요',
    '결제 취소는 어떻게 하나요',
    '분양상담사 광고 가격',
    '고객센터 전화번호 알려줘',
    '직원 뽑으려면 공고 어떻게 올려요',
  ])('"%s" → 핸드오프 아님', (q) => {
    expect(detectHandoffRequest(q)).toBeNull();
  });
});

describe('resolveCanned — 파이프라인', () => {
  const anon = { hasHistory: false, loggedIn: false };

  it('환불 요청은 handoff, 환불 규정 질문은 faq', () => {
    const req = resolveCanned({ text: '환불해 주세요', ...anon });
    expect(req?.source).toBe('handoff');
    expect(req?.handoff).toBe(true);
    const q = resolveCanned({ text: '환불 규정이 어떻게 돼요?', ...anon });
    expect(q?.source).toBe('faq');
    expect(q?.intent).toBe('refund-policy');
    expect(q?.handoff).toBe(false);
  });

  it('핸드오프는 대화 맥락과 무관하게 먼저 처리한다', () => {
    expect(resolveCanned({ text: '상담원', hasHistory: true, loggedIn: true })?.source).toBe('handoff');
  });

  it('이전 대화가 있으면 짧은/지시어 질문은 AI 로 넘긴다', () => {
    expect(resolveCanned({ text: '그럼 슈페리어 가격은요?', hasHistory: true, loggedIn: false })).toBeNull();
    expect(resolveCanned({ text: '20일은요?', hasHistory: true, loggedIn: false })).toBeNull();
    expect(resolveCanned({ text: '베이직가격', hasHistory: true, loggedIn: false })).toBeNull();
    // 맥락 없이도 완결된 질문은 대화 중이어도 FAQ
    expect(resolveCanned({ text: '분양 광고 가격이 얼마예요', hasHistory: true, loggedIn: false })?.intent).toBe('pricing-sales');
  });

  it('로그인 회원의 본인 데이터 질문은 AI 로 넘긴다', () => {
    const text = '제 광고 기간 연장 가능한가요';
    expect(shouldSkipCanned({ text, hasHistory: false, loggedIn: true })).toBe(true);
    expect(resolveCanned({ text, hasHistory: false, loggedIn: true })).toBeNull();
    expect(resolveCanned({ text: '광고 기간 연장 가능한가요', hasHistory: false, loggedIn: true })?.intent).toBe('extend-period');
  });
});

describe('AnswerCache — LRU + TTL', () => {
  it('정규화된 질문으로 hit 한다', () => {
    const cache = new AnswerCache();
    cache.set('단기 임대 뭐예요?', 'A');
    expect(cache.get('단기임대 뭐예요')).toBe('A');
  });

  it('TTL 이 지나면 만료된다 (주입 시계)', () => {
    let t = 1_000;
    const cache = new AnswerCache({ ttlMs: 60_000, now: () => t });
    cache.set('질문', '답');
    t += 59_999;
    expect(cache.get('질문')).toBe('답');
    t += 1;
    expect(cache.get('질문')).toBeNull();
    expect(cache.size).toBe(0);
  });

  it('최대 개수를 넘으면 가장 오래 안 쓴 항목을 버린다', () => {
    const cache = new AnswerCache({ maxEntries: 2 });
    cache.set('가', '1');
    cache.set('나', '2');
    expect(cache.get('가')).toBe('1'); // '가' 최근 사용 → '나'가 가장 오래됨
    cache.set('다', '3');
    expect(cache.size).toBe(2);
    expect(cache.get('나')).toBeNull();
    expect(cache.get('가')).toBe('1');
    expect(cache.get('다')).toBe('3');
  });

  it('비로그인 첫 턴만 캐시 대상이다', () => {
    expect(isCacheable({ hasHistory: false, loggedIn: false })).toBe(true);
    expect(isCacheable({ hasHistory: true, loggedIn: false })).toBe(false);
    expect(isCacheable({ hasHistory: false, loggedIn: true })).toBe(false);
  });
});
