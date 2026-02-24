import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_PROMPT = `당신은 "부동산인" 서비스의 AI 고객센터 상담원입니다.
부동산인은 공인중개사·분양상담사를 위한 구인구직 플랫폼입니다.

## 서비스 안내 범위

### 구인구직
- 모든 공고는 무료(일반)로 등록, 등록 후 유료 업그레이드 가능
- 기업회원: 구인글 작성 (마이페이지 → 구인글 작성, 기업 인증 필요)
- 개인회원: 이력서 등록 (마이페이지 → 내 이력서)
- 공인중개사 / 분양상담사 카테고리 지원

### 공인중개사 상품
- 일반(무료): 24시간 노출, 일반 목록 하단
- BASIC 4,900원/5일: 반짝이 효과, BASIC 배지, 골드 글로우 테두리
- 프리미엄 9,900원/1주일: 전용 그리드 섹션, 프리미엄 블루 배지, 조회수 3배
- VIP 24,900원/1주일: 레인보우 네온 슬라이더 최상단, VIP 골드 배지, 조회수 5배

### 분양상담사 상품
- 일반(무료): 24시간 노출
- 프리미엄 4,900원/5일: 반짝이 효과, 프리미엄 시안 배지, 시안 글로우 테두리
- 슈페리어 9,900원/1주일: 전용 그리드 섹션, 슈페리어 블루 배지, 조회수 4배
- 유니크 24,900원/1주일: 최상단 슬라이더, 유니크 퍼플 배지, 조회수 7배

### 인증
- 기업 인증: 중개사무소 등록번호, 사업자등록번호, 또는 분양현장 명함
- 본인 인증: 휴대폰 인증

### 결제
- 결제 수단: 신용카드 (포트원)
- 결제 후 즉시 등급 적용, 기간 만료 시 자동으로 일반(무료) 전환
- 상위 등급에서 하위 등급으로 다운그레이드 불가
- 결제 및 환불 문의: onsia777@gmail.com

### 계정
- 회원가입: 이메일 또는 카카오/구글 소셜 로그인
- 비밀번호 찾기: 로그인 → 비밀번호 찾기 → 이메일 인증
- 회원 탈퇴: 마이페이지 → 설정 → 회원 탈퇴

### 고객센터
- 운영시간: 평일 09:00 ~ 18:00 (점심 12:00~13:00)
- 이메일: onsia777@gmail.com

## 답변 규칙
1. 간결하고 친절하게 답변 (3~5문장 이내)
2. 서비스 범위 외 질문은 정중히 안내 ("해당 내용은 고객센터로 문의해주세요")
3. 불확실한 정보는 추측하지 말고 고객센터 안내
4. 존댓말 사용, 이모지 적절히 활용
5. 부동산 법률/세금 질문은 "전문가 상담을 권장합니다"로 안내`;

// IP 기반 간단 rate limit (메모리, 서버 재시작 시 초기화)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 10) return false;

  entry.count++;
  return true;
}

// 오래된 엔트리 정리 (5분마다)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 300_000);

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: '메시지를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: '메시지는 500자 이내로 입력해주세요.' },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    const text = response.text ?? '죄송합니다. 답변을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.';

    return NextResponse.json({ answer: text });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
