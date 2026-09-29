// 고객센터 챗봇 — AI 호출 전에 쓰는 "준비된 답변" 계층
//
// 1) detectHandoffRequest : 상담원·환불 요청·결제 문제 → AI 없이 상담원 연결
// 2) matchFaq             : 맥락 없는 단순 질문 → 코드(단일 출처)에서 만든 FAQ 답변
// 3) shouldSkipCanned     : 이전 대화에 기대는 질문·로그인 회원 본인 데이터 질문은 FAQ/캐시를 건너뜀
//
// 답변 텍스트는 전부 빌더 함수가 toss.ts / support-knowledge.ts 에서 만든다 (숫자 하드코딩 금지).
// 위젯(ChatWidget)의 FAQ 버튼도 같은 빌더를 쓴다 → 서버 전용 import 금지.
// 원칙: 틀린 준비 답변은 AI 호출보다 나쁘다 — 애매하면 매칭하지 않는다.

import { PRICING_TIERS, getTotalPrice, getExposureDays, type PricingTier } from '@/lib/toss';
import {
  buildPricingFaqText,
  getSupportContact,
  FREE_POST_EXPOSURE,
  REFUND_POLICY,
} from '@/lib/support-knowledge';

// ────────────────────────────────────────────────────────────
// 정규화
// ────────────────────────────────────────────────────────────
/** 소문자화 + 공백·문장부호·이모지 제거 (띄어쓰기/조사 차이에 강하게) */
export function normalizeQuestion(text: string): string {
  return text.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

// ────────────────────────────────────────────────────────────
// 기능 플래그 — 리터럴 접근이라 클라이언트 번들에서는 빌드 시점 값, 서버에서는 요청 시점 값
// ────────────────────────────────────────────────────────────
const danalRequired = () => process.env.NEXT_PUBLIC_DANAL_REQUIRED === 'true';
const stayEnabled = () => process.env.NEXT_PUBLIC_STAY_ENABLED === 'true';
const marketEnabled = () => process.env.NEXT_PUBLIC_MARKET_ENABLED === 'true';

// ────────────────────────────────────────────────────────────
// 답변 빌더
// ────────────────────────────────────────────────────────────
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
const VAT_NOTE = '※ 표시 금액은 공급가이고 부가세(10%)는 별도예요. 결제할 때 부가세가 더해진 결제금액이 청구돼요.';
const PAGE = { agent: '/agent/premium', sales: '/sales/premium' } as const;

function tiersOf(category: PricingTier['category']): PricingTier[] {
  return Object.values(PRICING_TIERS).filter((t) => t.category === category);
}

function tierByName(name: string): PricingTier | undefined {
  return tiersOf('sales').find((t) => t.name === name);
}

function optionLine(o: PricingTier['options'][number]): string {
  const period = o.bonusDays > 0
    ? `${o.days}일 + ${o.bonusDays}일 무료(총 ${getExposureDays(o)}일 노출)`
    : `${o.days}일 노출`;
  return `• ${period}: ${won(o.price)} (부가세 별도, 결제금액 ${won(getTotalPrice(o.price))})`;
}

function tierSummaryLine(t: PricingTier): string {
  if (t.purchaseEnabled === false) return `• ${t.name}: 판매 준비 중`;
  const first = t.options[0];
  const from = t.options.length > 1 ? '부터' : '';
  const period = first.bonusDays > 0 ? `${first.days}+${first.bonusDays}일` : `${first.days}일`;
  return `• ${t.name}${t.exclusive ? '(지역 독점)' : ''}: ${period} ${won(first.price)}${from} (부가세 별도, 결제금액 ${won(getTotalPrice(first.price))})`;
}

function buildCategoryPricing(category: PricingTier['category']): string {
  const label = category === 'sales' ? '분양상담사' : '공인중개사';
  const tiers = tiersOf(category);
  const names = tiers.map((t) => t.name).join('·');
  const lines = [`${label} 구인공고 광고상품은 ${names} ${tiers.length}등급이에요.`, ''];
  lines.push(`• 일반(무료): ${FREE_POST_EXPOSURE} 노출`);
  for (const t of tiers) {
    if (t.purchaseEnabled === false || t.options.length === 1) {
      lines.push(tierSummaryLine(t));
    } else {
      lines.push(`• ${t.name}${t.exclusive ? '(지역 독점)' : ''}: ${t.options
        .map((o) => `${o.bonusDays > 0 ? `${o.days}+${o.bonusDays}일` : `${o.days}일`} ${won(o.price)}`)
        .join(' / ')} (부가세 별도)`);
    }
  }
  lines.push('', VAT_NOTE, `자세한 내용과 구매는 ${PAGE[category]} 에서 할 수 있어요.`);
  return lines.join('\n');
}

function buildSalesTierPricing(name: string): string {
  const t = tierByName(name);
  if (!t) return buildCategoryPricing('sales');
  if (t.purchaseEnabled === false) {
    const others = tiersOf('sales').filter((x) => x.purchaseEnabled !== false).map((x) => x.name).join('·');
    return `분양상담사 ${t.name} 등급은 지금 판매 준비 중이라 결제할 수 없어요.\n지금은 ${others} 등급을 이용할 수 있어요. 가격은 ${PAGE.sales} 에서 확인해 주세요.`;
  }
  return [
    `분양상담사 ${t.name}${t.exclusive ? '(지역 독점)' : ''} 광고 가격이에요.`,
    ...t.options.map(optionLine),
    '',
    VAT_NOTE,
    `구매는 ${PAGE.sales} 에서 할 수 있어요.`,
  ].join('\n');
}

function contactLines(): string {
  const c = getSupportContact();
  return [
    `📧 이메일: ${c.email}`,
    `📞 전화: ${c.phone}`,
    `🕘 운영시간: ${c.hours}`,
    ...(c.kakaoChannelUrl ? [`💬 카카오톡 채널: ${c.kakaoChannelUrl}`] : []),
  ].join('\n');
}

function buildRefundPolicyAnswer(): string {
  return [
    '환불·취소 규정을 안내해 드릴게요.',
    '',
    `• ${REFUND_POLICY.serviceStart}`,
    '',
    '✅ 환불이 가능한 경우',
    ...REFUND_POLICY.withdrawalAllowed.map((s) => `- ${s}`),
    '',
    '⚠️ 환불이 제한될 수 있는 경우',
    ...REFUND_POLICY.withdrawalLimited.map((s) => `- ${s}`),
    '',
    `💰 ${REFUND_POLICY.amountRule}`,
    '',
    '📝 절차',
    ...REFUND_POLICY.procedure.map((s) => `- ${s}`),
    '',
    `실제 환불 요청은 상담원이 직접 확인해 드려요. 자세한 내용은 ${REFUND_POLICY.pageUrl} 에서 확인해 주세요.`,
  ].join('\n');
}

function buildPaymentMethodAnswer(): string {
  return [
    '결제는 토스페이먼츠로 진행돼요 (신용카드 등).',
    '• 결제 즉시 선택한 등급이 공고에 적용돼요',
    '• 기간이 끝나면 일반(무료) 공고로 돌아가요',
    `• 표시 가격은 공급가이고 부가세(10%)는 별도예요`,
  ].join('\n');
}

/** 위젯 "결제 및 환불" 버튼용 — 결제 수단 + 환불 규정 */
export function buildPaymentRefundAnswer(): string {
  return `💳 ${buildPaymentMethodAnswer()}\n\n🔄 ${buildRefundPolicyAnswer()}`;
}

function buildSignupAnswer(): string {
  return [
    '아래 방법으로 간편하게 가입할 수 있어요.',
    '',
    '📧 이메일 회원가입 (/agent/auth/signup): 약관 동의 → 정보 입력 → 인증 메일 확인',
    '🟡 카카오 로그인',
    '🔵 구글 로그인',
    '',
    danalRequired()
      ? '📱 현재 회원가입 시 휴대폰 본인인증이 필요해요.'
      : '📱 현재 회원가입에 휴대폰 본인인증은 필요 없어요.',
    '비밀번호를 잊으셨다면: 로그인 화면 → 비밀번호 찾기 → 이메일로 재설정할 수 있어요.',
  ].join('\n');
}

function buildIdentityAnswer(): string {
  return danalRequired()
    ? '네, 현재 회원가입 시 휴대폰 본인인증이 필수예요. 가입 화면(/agent/auth/signup)에서 안내에 따라 인증해 주세요.'
    : '현재 회원가입에 휴대폰 본인인증은 필요 없어요. 이메일 인증(또는 카카오·구글 로그인)만으로 가입할 수 있어요.\n\n구인공고를 올리려면 휴대폰 인증과 별개로 마이페이지에서 기업 인증이 필요해요.';
}

const ANSWERS = {
  'pricing-all': () => buildPricingFaqText(),
  'pricing-sales': () => buildCategoryPricing('sales'),
  'pricing-sales-basic': () => buildSalesTierPricing('베이직'),
  'pricing-sales-superior': () => buildSalesTierPricing('슈페리어'),
  'pricing-sales-dia': () => buildSalesTierPricing('다이아'),
  'pricing-sales-unique': () => buildSalesTierPricing('유니크'),
  'pricing-agent': () => buildCategoryPricing('agent'),
  'free-post': () =>
    `공고는 무료(일반)로 등록할 수 있어요.\n\n• 일반(무료) 공고는 등록 후 ${FREE_POST_EXPOSURE} 노출되고, 이후 자동으로 비활성화돼요\n• 더 오래, 더 위에 노출하려면 유료 등급을 이용해 주세요 (분양 공고는 등록할 때 선택, 중개사 공고는 "채용관리"에서 업그레이드)\n• 구인공고를 올리려면 기업 인증이 먼저 필요해요`,
  'post-howto': () =>
    `모든 공고는 무료(일반)로 등록할 수 있어요.\n\n✅ 기업 인증 완료 후 작성 가능해요\n✅ 공인중개사(/agent) / 분양상담사(/sales) 카테고리를 선택해요\n✅ 분양 공고는 등록 화면에서 유료 등급과 기간을 함께 고를 수 있어요\n✅ 중개사 공고는 등록 후 "채용관리"에서 유료 등급으로 업그레이드할 수 있어요\n\n📌 무료 공고는 ${FREE_POST_EXPOSURE} 노출 후 자동 만료돼요.`,
  'upgrade-howto': () =>
    `유료 등급은 이렇게 이용해요.\n\n• 분양상담사 공고: 공고 등록 화면 마지막 단계에서 등급과 기간을 고르고 토스페이먼츠로 결제해요 (상품 안내 ${PAGE.sales})\n• 공인중개사 공고: 먼저 무료로 등록한 뒤 "채용관리"에서 공고를 골라 업그레이드해요 (상품 안내 ${PAGE.agent})\n\n결제 즉시 등급이 적용되고, 기간이 끝나면 일반 공고로 돌아가요.\n이미 등록한 분양 공고의 등급을 바꾸고 싶으면 상담원에게 문의해 주세요.`,
  'extend-period': () =>
    '유료 광고 기간이 끝나면 공고는 일반(무료) 공고로 돌아가요.\n\n기간 연장은 아직 화면에서 직접 할 수 없어서 상담원이 도와드리고 있어요. 아래 연락처로 공고 제목과 원하는 기간을 알려 주세요.',
  'refund-policy': buildRefundPolicyAnswer,
  'payment-method': buildPaymentMethodAnswer,
  'tax-invoice': () =>
    '표시 가격은 공급가이고 부가세(10%)는 별도예요. 결제할 때 부가세가 더해진 금액이 청구돼요.\n\n세금계산서·영수증 발행 같은 증빙 요청은 상담원이 직접 도와드릴게요.',
  'signup-howto': buildSignupAnswer,
  'identity-verification': buildIdentityAnswer,
  'social-login': () =>
    '카카오와 구글 계정으로 로그인할 수 있어요 (로그인 페이지 /agent/auth/login).\n\n처음 소셜 로그인하면 추가 정보 입력 화면이 나와요. 다른 소셜 계정은 아직 지원하지 않아요.',
  'password-reset': () =>
    '비밀번호를 잊으셨다면 /agent/auth/forgot-password 에서 가입한 이메일을 입력해 주세요.\n\n재설정 링크가 메일로 오면 새 비밀번호로 바꿀 수 있어요. 카카오·구글로 가입하셨다면 해당 계정으로 로그인하면 돼요.',
  withdraw: () =>
    '회원 탈퇴는 고객센터로 요청해 주시면 확인 후 처리해 드려요. 탈퇴하면 개인정보는 즉시 파기돼요.\n\n아래 연락처로 가입한 이메일과 함께 요청해 주세요.',
  'company-verify': () =>
    '마이페이지 → 기업 인증에서 아래 서류 중 하나로 인증할 수 있어요.\n\n📋 중개사무소 등록번호\n📋 사업자등록번호\n📋 분양현장 명함\n\n⚠️ 기업 인증이 완료되어야 구인글을 작성할 수 있어요.',
  'resume-howto': () =>
    '마이페이지 → 내 이력서에서 등록할 수 있어요.\n\n✏️ 경력, 자격증, 희망 근무조건 등을 입력하시면 기업회원에게 노출돼요.\n\n💡 이력서를 자세히 작성할수록 매칭 확률이 높아져요!',
  'contact-hours': () => `부동산인 고객센터 안내예요.\n\n${contactLines()}`,
  'stay-intro': () =>
    '단기임대 STAY(/stay)에서 단기임대 매물을 보고 지도에서 찾을 수 있어요.\n\n• 매물 등록: /stay/new\n• 마음에 드는 매물은 문의하기로 연락할 수 있어요',
  'market-intro': () =>
    '시세지도(/market)에서 아파트 실거래 시세를 지도로 볼 수 있어요.\n\n지역별 순위는 /market/rankings 에서 확인할 수 있어요.',
} satisfies Record<string, () => string>;

export type FaqIntentId = keyof typeof ANSWERS;

/** 위젯 FAQ 버튼·API 공용 — 의도 id 로 답변 생성 */
export function buildFaqAnswer(id: FaqIntentId): string {
  return ANSWERS[id]();
}

// ────────────────────────────────────────────────────────────
// 의도 정의 (정규화된 텍스트에 적용 — 패턴에 공백 넣지 말 것)
// ────────────────────────────────────────────────────────────
const PRICE = /가격|얼마|비용|요금|금액|단가|광고비|몇원|가격표/;
const HOWTO = /방법|어떻게|어떡|어케|절차|하려면|하는법|어디서|어디에서|어디로|순서|하나요|하면돼|하면되|알려/;
// 부동산 가격·보수 질문은 광고 가격이 아님
const NOT_AD_PRICE = /수수료|중개보수|복비|보수|월급|급여|연봉|시세|매매가|전세|월세|보증금|분양가|집값|실거래/;

interface FaqIntent {
  id: FaqIntentId;
  /** 모든 그룹에서 하나 이상 걸려야 후보가 됨 (핵심어 AND 한정어) */
  groups: RegExp[];
  /** 하나라도 걸리면 제외 */
  exclude?: RegExp[];
  /** 가산점 (선택) */
  boost?: RegExp[];
  /** 이 의도가 매칭되면 후보에서 빼는 더 일반적인 의도 */
  overrides?: readonly FaqIntentId[];
  /** 답변과 함께 상담원 연결 카드를 보여줄지 */
  handoff?: boolean;
  enabled?: () => boolean;
}

const INTENTS: FaqIntent[] = [
  {
    id: 'pricing-all',
    groups: [PRICE, /광고|상품|유료|등급|프리미엄|요금제|노출|공고|업그레이드|이용료/],
    exclude: [NOT_AD_PRICE],
    overrides: ['tax-invoice'],
  },
  {
    id: 'pricing-sales',
    groups: [/분양/, PRICE],
    exclude: [NOT_AD_PRICE, /중개사|공인중개/],
    boost: [/광고|상품|공고|유료|등급/],
    overrides: ['pricing-all', 'tax-invoice'],
  },
  {
    id: 'pricing-sales-basic',
    groups: [/베이직/, PRICE],
    exclude: [NOT_AD_PRICE, /중개사|공인중개|basic/],
    overrides: ['pricing-all', 'pricing-sales', 'tax-invoice'],
  },
  {
    id: 'pricing-sales-superior',
    groups: [/슈페리어|슈페리얼|수페리어|슈퍼리어/, PRICE],
    exclude: [NOT_AD_PRICE, /중개사|공인중개/],
    overrides: ['pricing-all', 'pricing-sales', 'tax-invoice'],
  },
  {
    id: 'pricing-sales-dia',
    groups: [/다이아/, PRICE],
    exclude: [NOT_AD_PRICE, /중개사|공인중개/],
    overrides: ['pricing-all', 'pricing-sales', 'tax-invoice'],
  },
  {
    id: 'pricing-sales-unique',
    groups: [/유니크/, PRICE],
    exclude: [NOT_AD_PRICE, /중개사|공인중개/],
    overrides: ['pricing-all', 'pricing-sales', 'tax-invoice'],
  },
  {
    id: 'pricing-agent',
    groups: [/중개사|공인중개|basic|vip|브이아이피/, PRICE],
    exclude: [NOT_AD_PRICE, /분양/],
    overrides: ['pricing-all', 'tax-invoice'],
  },
  {
    id: 'free-post',
    groups: [/무료|일반공고|공짜/, /공고|구인글|등록|노출|기간|며칠|올리|게시|광고/],
    exclude: [/증정|보너스/],
    overrides: ['post-howto', 'pricing-all'],
  },
  {
    id: 'post-howto',
    groups: [/공고|구인글|채용글|구인광고/, /등록|작성|올리|올려|쓰는|쓰려|게시/, HOWTO],
    exclude: [/이력서/],
  },
  {
    id: 'upgrade-howto',
    groups: [/업그레이드|유료로|유료전환|유료상품|상위노출|프리미엄으로|등급올|유료광고|광고신청/, /방법|어떻게|어디서|하려면|절차|신청|구매|결제하/],
    overrides: ['payment-method'],
  },
  {
    id: 'extend-period',
    groups: [/연장|기간늘|더길게|재구매|재결제|갱신/, /공고|광고|기간|노출|상품|등급|방법|어떻게|하려면|가능|되나|돼요|되요/],
    exclude: [/계약갱신|갱신요구|전세|월세|임대차|임차|임대인/],
    handoff: true, // 연장 화면이 아직 없어 상담원이 처리 — 연락처 카드 표시
  },
  {
    id: 'refund-policy',
    groups: [/환불|청약철회|결제취소|취소하면|취소되|취소가능|취소규정|취소는/],
  },
  {
    id: 'payment-method',
    groups: [/결제/, /수단|카드|토스|무통장|계좌이체|뭘로|무엇으로|어떤걸로|간편결제|페이|방법|어떻게|가능한/],
    exclude: [/환불|취소|세금계산서|영수증|부가세|계산서/],
  },
  {
    id: 'tax-invoice',
    groups: [/세금계산서|현금영수증|계산서|부가세|영수증|증빙|vat/],
    handoff: true,
  },
  {
    id: 'signup-howto',
    groups: [/회원가입|가입/, /방법|어떻게|어떡|어케|절차|하려면|하는법|어디서|순서|하나요|하면돼|하면되|알려|하고싶/],
    exclude: [/탈퇴|가입비/],
  },
  {
    id: 'identity-verification',
    groups: [/본인인증|휴대폰인증|핸드폰인증|폰인증|실명인증|문자인증|휴대폰본인|핸드폰본인|다날/],
    overrides: ['signup-howto'],
  },
  {
    id: 'social-login',
    groups: [/카카오|구글|소셜|sns|네이버|애플/, /로그인|가입|계정|연동/],
    exclude: [/카카오톡채널|카톡상담|카카오톡상담/],
    overrides: ['signup-howto'],
  },
  {
    id: 'password-reset',
    groups: [/비밀번호|비번|패스워드/, /찾|분실|잊|잃어|까먹|재설정|변경|바꾸|바꿀|초기화|모르/],
  },
  {
    id: 'withdraw',
    groups: [/탈퇴|계정삭제|회원삭제|계정지우|계정없애/],
    handoff: true,
    overrides: ['signup-howto'],
  },
  {
    id: 'company-verify',
    groups: [/기업인증|기업회원인증|중개사인증|사업자인증|중개사무소인증|사무소인증|명함인증|등록번호인증/],
    exclude: [/본인인증|휴대폰|핸드폰/],
    overrides: ['post-howto'],
  },
  {
    id: 'resume-howto',
    groups: [/이력서/, /등록|작성|올리|올려|쓰는|쓰려|수정|어디|어떻게|방법/],
  },
  {
    id: 'contact-hours',
    groups: [/고객센터|연락처|전화번호|이메일주소|메일주소|운영시간|상담시간|영업시간|몇시까지|문의처|상담가능시간/],
    handoff: true,
  },
  {
    id: 'stay-intro',
    groups: [/단기임대|stay|스테이|한달살기|단기숙소/],
    enabled: stayEnabled,
  },
  {
    id: 'market-intro',
    groups: [/시세지도|시세맵|시세랭킹|지역랭킹|시세/, /지도|랭킹|어디서|보는법|볼수|확인|서비스|뭐예요|뭐에요|뭔가요|기능/],
    exclude: [/얼마/],
    enabled: marketEnabled,
  },
];

// 매칭 파라미터
const GROUP_WEIGHT = 2;
const BOOST_WEIGHT = 1;
/** 1위가 2위보다 이만큼 높아야 채택 (1그룹짜리 의도 2개가 겹치면 탈락) */
const MIN_MARGIN = 3;
/** 긴 질문은 여러 요구가 섞였을 가능성 → AI */
const MAX_NORMALIZED_CHARS = 50;

export interface FaqMatch {
  id: FaqIntentId;
  answer: string;
  handoff: boolean;
  score: number;
}

export function scoreIntents(text: string): { id: FaqIntentId; score: number }[] {
  const n = normalizeQuestion(text);
  const matched: { intent: FaqIntent; score: number }[] = [];
  for (const intent of INTENTS) {
    if (intent.enabled && !intent.enabled()) continue;
    if (intent.exclude?.some((re) => re.test(n))) continue;
    if (!intent.groups.every((re) => re.test(n))) continue;
    const score = intent.groups.length * GROUP_WEIGHT
      + (intent.boost?.filter((re) => re.test(n)).length ?? 0) * BOOST_WEIGHT;
    matched.push({ intent, score });
  }
  const overridden = new Set(matched.flatMap((m) => m.intent.overrides ?? []));
  return matched
    .filter((m) => !overridden.has(m.intent.id))
    .map((m) => ({ id: m.intent.id, score: m.score }))
    .sort((a, b) => b.score - a.score);
}

/** 준비된 답변 매칭 — 확신이 없으면 null (AI 로 넘김) */
export function matchFaq(text: string): FaqMatch | null {
  const n = normalizeQuestion(text);
  if (n.length < 2 || n.length > MAX_NORMALIZED_CHARS) return null;
  if (ANAPHORA.test(n)) return null;
  const ranked = scoreIntents(text);
  if (ranked.length === 0) return null;
  const [best, second] = ranked;
  if (second && best.score - second.score < MIN_MARGIN) return null;
  const intent = INTENTS.find((i) => i.id === best.id)!;
  return { id: best.id, answer: buildFaqAnswer(best.id), handoff: intent.handoff ?? false, score: best.score };
}

// ────────────────────────────────────────────────────────────
// 준비된 답변(FAQ/캐시)을 쓰면 안 되는 경우
// ────────────────────────────────────────────────────────────
/** 이전 대화를 가리키는 말 (정규화 텍스트 기준) */
const ANAPHORA = /^(그거|그건|그게|그걸|그것|그럼|그러면|그래서|그리고|근데|그런데|그중|이거|이건|저거|저건|거기|아까|방금|위에)|아까|방금|위에서|위에꺼|말씀하신|말한거|그거|그건|그럼|그중에/;
/** "20일은요?", "30일은?" 같은 짧은 되묻기 */
const SHORT_FOLLOWUP = /^\S{1,8}(은요|는요|은|는)\??$/;
/** 로그인 회원 본인 데이터 질문 */
const PERSONAL = /(내|제|저의|나의|우리)(결제|공고|광고|계정|이력서|상품|주문|구매|등급|포인트)|언제까지|남은기간|남은일|며칠남|만료|언제끝|끝나|결제내역|결제한|구매한|등록한공고|올린공고/;
const MIN_CONTEXTLESS_CHARS = 8;

export function shouldSkipCanned(input: { text: string; hasHistory: boolean; loggedIn: boolean }): boolean {
  const n = normalizeQuestion(input.text);
  if (ANAPHORA.test(n) || SHORT_FOLLOWUP.test(input.text.trim())) return true;
  if (input.hasHistory && n.length < MIN_CONTEXTLESS_CHARS) return true;
  if (input.loggedIn && PERSONAL.test(n)) return true;
  return false;
}

// ────────────────────────────────────────────────────────────
// AI 없이 상담원 연결 (요청 vs 규정 질문 구분)
// ────────────────────────────────────────────────────────────
export type HandoffReason = 'person' | 'refund' | 'payment' | 'cancel' | 'account';

const PERSON = /상담원|(?<!분양)상담사(랑|와|하고|한테|에게|연결|바꿔)|사람(이랑|과|하고|한테|에게|바꿔|연결|이야기|얘기|상담)|진짜사람|실제사람|직원(이랑|과|하고|한테|에게|분|연결|바꿔|상담)|담당자(랑|와|하고|한테|에게|분|연결|바꿔)|전화(상담|해줘|해주세요|해주실|주세요|연결|통화|좀|로상담|로문의|부탁|받고)|통화(하고|가능|할수|원해|요청|부탁|연결|하고싶)|콜백|연락주세요|연락해주/;
/** 무조건 요청으로 보는 환불 표현 */
const REFUND_STRONG = /환불해(줘|주세요|주십|주실|주시|달라)|환불부탁|환불받고싶|환불원해|환불원합|환불요청(합니다|할게|드려|드립|해요|했)|환불신청(합니다|할게|했)|환불처리해/;
/** 요청일 수도, 절차 질문일 수도 있는 표현 → 질문 표지가 없을 때만 요청 */
const REFUND_WEAK = /환불(요청|신청|처리|진행)/;
const POLICY_QUESTION = /규정|정책|기준|방법|어떻게|절차|되나|될까|가능|돼요|되요|조건|어디|언제까지|며칠|기간/;
const PAYMENT_PROBLEM = /결제가?안(돼|되|됨|됐|된)|결제오류|결제에러|결제실패|결제가실패|이중결제|중복결제|두번결제|결제가두번|결제(는|가)?됐는데|결제했는데|결제는했는데|돈만(나가|빠져)|카드값만|돈이두번|승인이?두번/;
const CANCEL_REQUEST = /취소해(줘|주세요|주십|주실|주시|달라)|취소부탁|취소요청(합|드|해요|할게)|취소하고싶|취소원해|취소원합/;
const ACCOUNT_PROBLEM = /해킹|도용|계정(이)?(잠겼|잠김|정지|막혔)/;

export function detectHandoffRequest(text: string): HandoffReason | null {
  const n = normalizeQuestion(text);
  if (PAYMENT_PROBLEM.test(n)) return 'payment';
  if (REFUND_STRONG.test(n)) return 'refund';
  if (REFUND_WEAK.test(n) && !POLICY_QUESTION.test(n)) return 'refund';
  if (CANCEL_REQUEST.test(n)) return 'cancel';
  if (ACCOUNT_PROBLEM.test(n)) return 'account';
  if (PERSON.test(n)) return 'person';
  return null;
}

export function buildHandoffAnswer(reason: HandoffReason): string {
  const c = getSupportContact();
  const lead: Record<HandoffReason, string> = {
    person: '상담원이 직접 도와드릴게요.',
    refund: '환불 요청은 상담원이 결제 내역을 확인한 뒤 직접 처리해 드려요.',
    payment: '결제 문제는 상담원이 결제 내역을 확인해서 빠르게 도와드릴게요.',
    cancel: '취소 요청은 상담원이 결제 내역을 확인한 뒤 직접 처리해 드려요.',
    account: '계정 문제는 상담원이 직접 확인해 드릴게요.',
  };
  return `${lead[reason]}\n아래 연락처로 문의해 주시면 운영시간(${c.hoursShort}) 안에 확인해 드릴게요.`;
}

// ────────────────────────────────────────────────────────────
// AI 이전 단계 통합 (라우트·테스트 공용, 순수 함수)
// ────────────────────────────────────────────────────────────
export type CannedSource = 'handoff' | 'faq';

export interface CannedResult {
  source: CannedSource;
  answer: string;
  handoff: boolean;
  intent?: FaqIntentId;
}

/** 1) 상담원 요청 → 2) FAQ. 둘 다 아니면 null (캐시·AI 단계로) */
export function resolveCanned(input: { text: string; hasHistory: boolean; loggedIn: boolean }): CannedResult | null {
  const reason = detectHandoffRequest(input.text);
  if (reason) return { source: 'handoff', answer: buildHandoffAnswer(reason), handoff: true };
  if (shouldSkipCanned(input)) return null;
  const faq = matchFaq(input.text);
  if (!faq) return null;
  return { source: 'faq', answer: faq.answer, handoff: faq.handoff, intent: faq.id };
}
