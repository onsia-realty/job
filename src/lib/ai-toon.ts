import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 고정 캐릭터 설정 (동물 캐릭터)
const CHARACTERS = {
  cat: { name: '고양이 기자', role: '부동산 뉴스 진행자', desc: 'white cat with round glasses and a microphone, wearing a press vest' },
  dog: { name: '영끌남', role: '실수요자/일반 시민', desc: 'beige puppy holding loan documents, wearing casual clothes, worried expression' },
  fox: { name: '여우 관료', role: '정부 관료/정책 발표자', desc: 'orange fox in a black business suit with red tie, stern expression' },
  horse: { name: '말 소장', role: '부동산 소장/중개사', desc: 'brown horse wearing a dress shirt and tie, friendly professional look' },
  squirrel: { name: '다람쥐 아내', role: '잔소리 마누라/현실주의', desc: 'brown squirrel in a yellow hoodie holding house keys, nagging expression' },
  owl: { name: '올빼미 교수', role: '전문가/분석가', desc: 'owl with round glasses holding a clipboard, scholarly and calm' },
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

// ── 2단계: 해설 기사 → 웹툰 스크립트 (6~8컷) ──
const TOON_PROMPT = `당신은 부동산 풍자 웹툰 작가입니다.

해설 기사를 바탕으로 웹툰 시나리오를 JSON 배열로 생성하세요.
**6컷~8컷**으로 제작하세요. 최소 6컷 이상이어야 합니다.

## 사용 가능 캐릭터 (동물 캐릭터)
- "고양이 기자" — 부동산 뉴스 진행자 (안경 쓴 하얀 고양이 + 마이크)
- "영끌남" — 실수요자/일반 시민 (서류 든 베이지 강아지)
- "여우 관료" — 정부 관료/정책 발표자 (검은 정장 오렌지 여우)
- "말 소장" — 부동산 소장/중개사 (셔츠+넥타이 갈색 말)
- "다람쥐 아내" — 잔소리 마누라/현실주의 (노란 후드 다람쥐 + 열쇠)
- "올빼미 교수" — 전문가/분석가 (안경+클립보드 올빼미)

## 출력 형식 (반드시 순수 JSON 배열만 출력)
[
  {
    "panel": 1,
    "characters": ["캐릭터명1", "캐릭터명2"],
    "dialogue": { "캐릭터명1": "대사", "캐릭터명2": "대사" },
    "scene": "장면 상세 묘사 (배경, 소품, 분위기 포함)",
    "mood": "happy|angry|sad|shocked|smug|neutral",
    "props": ["확성기", "서류", "간판 등 소품 목록"],
    "text_overlay": "패널 위에 표시할 텍스트 (없으면 null)",
    "sfx": "효과음 텍스트 (없으면 null)"
  }
]

## 규칙
- 풍자적이되 정치적으로 중립
- 마지막 컷에 반전 또는 풍자 펀치라인 필수
- 각 대사는 20자 이내 (말풍선에 들어갈 크기)
- 이모지 활용 가능
- 캐릭터 2~4명을 사용 (한 패널에 1~2명)
- 장면 묘사를 상세하게 (이미지 생성에 사용됨)
- 시간 경과 표현 가능 (예: "3년 후", "5년 후")
- 배경에 한국 도시 느낌 반영 (아파트, 건설현장, 부동산 사무실 등)`;

// ── 3단계: 이미지 생성 프롬프트 구성 (묘사형 Narrative 방식) ──
function buildImagePrompt(title: string, panels: ToonPanel[]): string {
  const panelCount = panels.length;
  const cols = 2;
  const rows = Math.ceil(panelCount / cols);

  // 각 패널: 장면 + 캐릭터 + 대사를 하나의 서술로 결합
  const panelDescriptions = panels.map((p, i) => {
    const charParts = p.characters.map(name => {
      const key = Object.keys(CHARACTERS).find(k =>
        CHARACTERS[k as keyof typeof CHARACTERS].name === name
      ) as keyof typeof CHARACTERS | undefined;
      const charInfo = key ? CHARACTERS[key] : null;
      const desc = charInfo?.desc || name;
      const dialogue = p.dialogue[name];
      return dialogue
        ? `${desc} (${p.mood} mood), saying "${dialogue}" in Korean speech bubble`
        : `${desc} (${p.mood} mood)`;
    }).join(' and ');

    const propsStr = p.props?.length ? `, props: ${p.props.join(', ')}` : '';
    const sfxStr = p.sfx ? `, bold SFX text: "${p.sfx}"` : '';
    const overlayStr = p.text_overlay ? `, text overlay: "${p.text_overlay}"` : '';

    return `Panel ${i + 1}: ${charParts}. Scene: ${p.scene}${propsStr}${sfxStr}${overlayStr}`;
  }).join('\n');

  return `A ${panelCount}-panel Korean webtoon BOOIN NEWS TOON comic strip in a ${cols}x${rows} grid layout.

Title banner at top: "BOOIN NEWS TOON — ${title}" in bold Korean text, dark navy background with white text.

Style: cute chibi animal characters, clean thick outlines, soft pastel colors, Korean webtoon style, professional news infographic feel, high resolution, consistent character design across all panels, warm color palette. Each panel has a distinct pastel background color (light yellow, light blue, light pink, light green, light purple, light orange). Korean text in clean speech bubbles with tails. Urban Korean city backgrounds. Panel numbers in small circles at top-left.

${panelDescriptions}

High-fidelity Korean text rendering. All speech bubbles must contain Korean text clearly readable with bold weight. Characters should be expressive with exaggerated emotions. Include relevant real estate themed background elements. Professional webtoon quality, high detail. Vertical layout optimized for mobile viewing.`;
}

export interface ToonPanel {
  panel: number;
  characters: string[];
  dialogue: Record<string, string>;
  scene: string;
  mood: string;
  props: string[] | null;
  text_overlay: string | null;
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
  toon_image_url: string | null;
}

function extractJSON(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
  if (jsonMatch) return jsonMatch[0];
  return text.trim();
}

// ── 이미지 생성 (Gemini) ──
async function generateToonImage(title: string, panels: ToonPanel[]): Promise<string | null> {
  try {
    const prompt = buildImagePrompt(title, panels);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        temperature: 0.8,
      },
    });

    // base64 이미지 추출
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) return null;

    for (const part of parts) {
      if (part.inlineData?.data) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        const mimeType = part.inlineData.mimeType || 'image/png';
        const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';

        // Supabase Storage에 업로드
        const fileName = `toon-${Date.now()}.${ext}`;
        const filePath = `toon-images/${fileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('ai-photos')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadError) {
          console.error('이미지 업로드 실패:', uploadError);
          return null;
        }

        // Public URL 생성
        const { data: urlData } = supabaseAdmin.storage
          .from('ai-photos')
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      }
    }

    return null;
  } catch (err) {
    console.error('웹툰 이미지 생성 실패:', err);
    return null;
  }
}

// ── 메인 파이프라인 ──
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

  // 2단계: 웹툰 스크립트 생성 (4~8컷 유동)
  const toonInput = `제목: ${article.title}\n부제: ${article.subtitle}\n\n해설 기사:\n${article.article_html}`;

  const toonResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: `${TOON_PROMPT}\n\n---\n\n${toonInput}` }] }],
    config: {
      temperature: 0.9,
      maxOutputTokens: 4096,
    },
  });

  const toonText = toonResponse.text ?? '';
  let panels: ToonPanel[];
  try {
    panels = JSON.parse(extractJSON(toonText));
  } catch (e) {
    throw new Error(`웹툰 스크립트 생성 실패: JSON 파싱 오류 - ${(e as Error).message}`);
  }

  // 패널 유효성 검사: 6~8컷
  if (!Array.isArray(panels) || panels.length < 6 || panels.length > 8) {
    throw new Error(`웹툰 패널 수 오류: ${panels?.length ?? 0}컷 (6~8컷 필요)`);
  }

  // 3단계: 웹툰 이미지 생성
  const toon_image_url = await generateToonImage(article.title, panels);

  return { article, panels, toon_image_url };
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
