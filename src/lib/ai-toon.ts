import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// 고정 캐릭터 설정
const CHARACTERS = {
  broker: { name: '부동산 아저씨', role: '현장 중개사', tone: '현실적, 경험 기반' },
  sales: { name: '분양 언니', role: '분양상담사', tone: '긍정적, 에너지 넘침' },
  official: { name: '정부 관료', role: '정책 발표자', tone: '딱딱함, 관료적' },
  buyer: { name: '실수요자', role: '일반 시민', tone: '걱정, 불안, 공감' },
};

// ── 1단계: 뉴스 분석 → 해설 기사 생성 ──
const ARTICLE_PROMPT = `당신은 "부동산인 온비스" AI 해설가입니다. 부동산 전문 해설 기사를 작성합니다.

아래 뉴스 정보를 바탕으로 해설 기사를 JSON으로 생성하세요.

## 출력 형식 (반드시 순수 JSON만 출력)
{
  "title": "클릭을 유도하는 강렬한 제목 (30자 이내)",
  "subtitle": "핵심 요약 부제목 (50자 이내)",
  "category": "시장동향|분양정보|정책|전망|부동산 중 하나",
  "article_html": "HTML 형식의 해설 본문",
  "article_summary": "SNS 공유용 한줄 요약 (100자 이내)"
}

## article_html 구성 규칙
- <h3>🎯 핵심 요약: ...</h3> 섹션으로 시작
- <div class="highlight-box">💡 <strong>부동산인 포인트</strong><br>...</div> 하이라이트 박스 포함
- <h3>📋 상세 분석</h3> 섹션
- <h3>🔮 전망</h3> 섹션
- <div class="highlight-box">🏠 <strong>부동산인 결론</strong><br>...</div> 결론 박스
- <p> 태그로 단락 구분, <strong>으로 핵심 강조
- 직설적이고 현장감 있게, 전문 용어는 쉽게 풀어서
- 원문 복사 금지, 독자적 시각으로 재해석
- 800~1200자 분량`;

// ── 2단계: 해설 기사 → 4컷 웹툰 스크립트 ──
const TOON_PROMPT = `당신은 부동산 풍자 4컷 웹툰 작가입니다.

해설 기사를 바탕으로 4컷 웹툰 시나리오를 JSON 배열로 생성하세요.

## 사용 가능 캐릭터
- "부동산 아저씨" — 현장 중개사, 현실적 시각
- "분양 언니" — 분양상담사, 긍정적 에너지
- "정부 관료" — 정책 발표자, 딱딱함
- "실수요자" — 일반 시민, 걱정과 불안

## 출력 형식 (반드시 순수 JSON 배열만 출력)
[
  {
    "panel": 1,
    "character": "캐릭터명",
    "dialogue": "메인 대사 (25자 이내)",
    "thought": "속마음/나레이션 (20자 이내, 없으면 null)",
    "scene": "장면 분위기 설명",
    "sfx": "효과음 텍스트 (없으면 null)"
  },
  ... (총 4개)
]

## 규칙
- 풍자적이되 정치적으로 중립
- 4컷째에 반전 또는 풍자 펀치라인 필수
- 각 대사는 25자 이내 (말풍선 크기 제한)
- 이모지 1~2개 활용 가능
- 4명의 캐릭터 중 2~4명을 사용 (매번 전원 등장할 필요 없음)
- 1컷: 상황 제시, 2컷: 전개, 3컷: 심화, 4컷: 반전/풍자`;

export interface ToonPanel {
  panel: number;
  character: string;
  dialogue: string;
  thought: string | null;
  scene: string;
  sfx: string | null;
}

export interface ToonArticle {
  title: string;
  subtitle: string;
  category: string;
  article_html: string;
  article_summary: string;
}

export interface GeneratedToon {
  article: ToonArticle;
  panels: ToonPanel[];
}

function extractJSON(text: string): string {
  // Gemini가 markdown 코드블록으로 감쌀 수 있으므로 추출
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  // 순수 JSON인 경우
  const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
  if (jsonMatch) return jsonMatch[0];
  return text.trim();
}

export async function generateToonFromNews(
  newsTitle: string,
  newsContent?: string,
  newsUrl?: string
): Promise<GeneratedToon> {
  const newsInfo = [
    `제목: ${newsTitle}`,
    newsContent ? `본문:\n${newsContent}` : '',
    newsUrl ? `원문 URL: ${newsUrl}` : '',
  ].filter(Boolean).join('\n\n');

  // 1단계: 해설 기사 생성
  const articleResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: `${ARTICLE_PROMPT}\n\n---\n\n${newsInfo}` }] }],
    config: {
      temperature: 0.8,
      maxOutputTokens: 4096,
    },
  });

  const articleText = articleResponse.text ?? '';
  let article: ToonArticle;
  try {
    article = JSON.parse(extractJSON(articleText));
  } catch (e) {
    throw new Error(`해설 기사 생성 실패: JSON 파싱 오류 - ${(e as Error).message}`);
  }

  // 2단계: 웹툰 스크립트 생성
  const toonInput = `제목: ${article.title}\n부제: ${article.subtitle}\n\n해설 기사:\n${article.article_html}`;

  const toonResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: `${TOON_PROMPT}\n\n---\n\n${toonInput}` }] }],
    config: {
      temperature: 0.9,
      maxOutputTokens: 2048,
    },
  });

  const toonText = toonResponse.text ?? '';
  let panels: ToonPanel[];
  try {
    panels = JSON.parse(extractJSON(toonText));
  } catch (e) {
    throw new Error(`웹툰 스크립트 생성 실패: JSON 파싱 오류 - ${(e as Error).message}`);
  }

  // 패널 유효성 검사: 4컷이어야 함
  if (!Array.isArray(panels) || panels.length !== 4) {
    throw new Error(`웹툰 패널 수 오류: ${panels?.length ?? 0}컷 (4컷 필요)`);
  }

  return { article, panels };
}

// slug 생성: 한글 지원, URL-safe
export function generateSlug(episodeNumber: number, title: string): string {
  const sanitized = title
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
    .replace(/-+$/, '');
  return `ep${String(episodeNumber).padStart(3, '0')}-${sanitized}`;
}

export { CHARACTERS };
