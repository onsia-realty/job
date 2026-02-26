import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 3종 테마별 캐릭터 풀
const THEME_CHARACTERS = {
  animal: {
    cat: { name: '고양이 기자', role: '진행자/기자', desc: 'white cat with round glasses and a microphone, wearing a press vest' },
    dog: { name: '영끌남', role: '실수요자(영끌)', desc: 'beige puppy holding loan documents, wearing casual clothes, worried expression' },
    fox: { name: '여우 관료', role: '정책 발표자', desc: 'orange fox in a black business suit with red tie, stern expression' },
    horse: { name: '말 소장', role: '부동산 소장', desc: 'brown horse wearing a dress shirt and tie, friendly professional look' },
    squirrel: { name: '다람쥐 아내', role: '현실주의/아내', desc: 'brown squirrel in a yellow hoodie holding house keys, nagging expression' },
    owl: { name: '올빼미 교수', role: '전문가/분석가', desc: 'owl with round glasses holding a clipboard, scholarly and calm' },
  },
  human: {
    reporter: { name: '앵커', role: '진행자/기자', desc: 'neat 30s Korean male news anchor in a dark suit holding a microphone, trustworthy expression' },
    buyer: { name: '영끌남', role: '실수요자(영끌)', desc: 'tired 30s Korean man in hoodie with deep dark circles under eyes, holding mortgage papers' },
    gov: { name: '고위 관료', role: '정책 발표자', desc: 'silver-haired 50s Korean government official in suit with horn-rimmed glasses, stern and strict' },
    broker: { name: '부동산 소장', role: '부동산 소장', desc: '50s Korean man/woman in hiking vest, friendly warm smile, neighborhood real estate agent look' },
    spouse: { name: '현실주의 아내', role: '현실주의/아내', desc: '30s Korean woman with arms crossed sighing, realistic brake role stopping the husband' },
    expert: { name: '교수', role: '전문가/교수', desc: 'sharp Korean scholar in neat suit holding tablet, calm and analytical eyes' },
  },
  joseon: {
    storyteller: { name: '전기수', role: '진행자(전기수)', desc: 'Joseon era storyteller wearing gat hat holding a folding fan, charismatic speaker at a market' },
    peasant: { name: '평민', role: '실수요자(평민)', desc: 'sweating Joseon commoner in straw sandals dreaming of owning a thatched-roof house' },
    minister: { name: '호조판서', role: '정책(호조판서)', desc: 'Joseon minister in elaborate official robes stroking his beard, pompous expression' },
    middleman: { name: '거간꾼', role: '부동산 소장(거간꾼)', desc: 'sly Joseon middleman merchant holding a pouch of brass coins, cunning smile' },
    wife: { name: '아낙네', role: '현실주의(아낙네)', desc: 'fierce Joseon housewife holding a ladle ready to smack her dreaming husband on the back' },
    scholar: { name: '실학자', role: '전문가(실학자)', desc: 'strict Joseon scholar with thick old books and magnifying glass, worldly-wise expression' },
  },
};

// 하위 호환용 (기존 코드 참조)
const CHARACTERS = THEME_CHARACTERS.animal;

type ThemeType = 'animal' | 'human' | 'joseon';

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

// ── 2단계: 테마별 웹툰 스크립트 프롬프트 생성 ──
function buildToonPrompt(theme: ThemeType): string {
  const chars = THEME_CHARACTERS[theme];
  const charList = Object.values(chars)
    .map(c => `- "${c.name}" — ${c.role}`)
    .join('\n');

  const themeStyle: Record<ThemeType, string> = {
    animal: '동물 캐릭터 — 부드럽고 귀여운 풍자',
    human: '현대인 캐릭터 — 현실적이고 드라마틱한 시트콤',
    joseon: '조선시대 캐릭터 — 해학적 사극 풍자 (현대 부동산 용어를 조선시대식으로 비틀 것: 주택담보대출→고리대금, 아파트 청약→한양 기와집 추첨, 금리 인상→소작료 폭등)',
  };

  const bgStyle: Record<ThemeType, string> = {
    animal: '한국 도시 느낌 (아파트, 건설현장, 부동산 사무실 등)',
    human: '현실적인 한국 도시 배경 (아파트 단지, 은행, 부동산 사무실, 재개발 현장 등)',
    joseon: '조선시대 배경 (한양 저잣거리, 관아, 기와집 마을, 논밭 등)',
  };

  return `당신은 부동산 풍자 웹툰 작가입니다.
테마: ${themeStyle[theme]}

해설 기사를 바탕으로 웹툰 시나리오를 JSON 배열로 생성하세요.
**반드시 6컷 또는 8컷**으로 제작하세요. 짝수만 허용됩니다 (7컷 금지).

## 사용 가능 캐릭터
${charList}

## 출력 형식 (반드시 순수 JSON 배열만 출력)
[
  {
    "panel": 1,
    "characters": ["캐릭터명1", "캐릭터명2"],
    "dialogue": { "캐릭터명1": "대사", "캐릭터명2": "대사" },
    "scene": "장면 상세 묘사 (배경, 소품, 분위기 포함)",
    "mood": "happy|angry|sad|shocked|smug|neutral",
    "props": ["확성기", "서류", "간판 등 소품 목록"],
    "text_overlay": "패널 위에 표시할 텍스트 (없으면 null)"
  }
]

## 규칙
- 풍자적이되 정치적으로 중립
- 마지막 컷에 반전 또는 풍자 펀치라인 필수
- 각 대사는 20자 이내 (말풍선에 들어갈 크기)
- 이모지 활용 가능
- 캐릭터 2~4명을 사용 (한 패널에 1~2명)
- 장면 묘사를 상세하게 (이미지 생성에 사용됨)
- 배경: ${bgStyle[theme]}
- **반드시 6컷 또는 8컷만 생성 (홀수 금지)**`;
}

// ── 3단계: 이미지 생성 프롬프트 구성 (테마별) ──
function buildImagePrompt(title: string, panels: ToonPanel[], theme: ThemeType = 'animal'): string {
  const panelCount = panels.length;
  const cols = 2;
  const rows = Math.ceil(panelCount / cols);
  const chars = THEME_CHARACTERS[theme];

  const styleMap: Record<ThemeType, string> = {
    animal: 'cute chibi animal characters, clean thick outlines, soft pastel colors, Korean webtoon style, warm color palette',
    human: 'semi-realistic Korean webtoon characters, clean art style, expressive faces, modern Korean urban setting, sitcom-like comedic tone',
    joseon: 'traditional Korean sageuk art style with comedic chibi proportions, Joseon dynasty clothing and architecture, ink-wash inspired coloring with vibrant accents',
  };

  const bgMap: Record<ThemeType, string> = {
    animal: 'Urban Korean city backgrounds (apartments, construction sites, real estate offices)',
    human: 'Realistic modern Korean city backgrounds (apartment complexes, banks, redevelopment areas)',
    joseon: 'Joseon dynasty backgrounds (Hanyang marketplace, government offices, tiled-roof villages, rice paddies)',
  };

  const panelDescriptions = panels.map((p, i) => {
    const charsMap = chars as Record<string, { name: string; role: string; desc: string }>;
    const charParts = p.characters.map(name => {
      const key = Object.keys(charsMap).find(k => charsMap[k].name === name);
      const charInfo = key ? charsMap[key] : null;
      const desc = charInfo?.desc || name;
      const dialogue = p.dialogue[name];
      return dialogue
        ? `${desc} (${p.mood} mood), saying "${dialogue}" in Korean speech bubble`
        : `${desc} (${p.mood} mood)`;
    }).join(' and ');

    const propsStr = p.props?.length ? `, props: ${p.props.join(', ')}` : '';
    const overlayStr = p.text_overlay ? `, text overlay: "${p.text_overlay}"` : '';

    return `Panel ${i + 1}: ${charParts}. Scene: ${p.scene}${propsStr}${overlayStr}`;
  }).join('\n');

  return `A ${panelCount}-panel Korean webtoon BOOIN NEWS TOON comic strip in a ${cols}x${rows} grid layout.

Title banner at top: "BOOIN NEWS TOON — ${title}" in bold Korean text, dark navy background with white text.

Style: ${styleMap[theme]}, professional news infographic feel, high resolution, consistent character design across all panels. Each panel has a distinct pastel background color. Korean text in clean speech bubbles with tails. ${bgMap[theme]}. Panel numbers in small circles at top-left.

IMPORTANT BRANDING: Every panel must have a small subtle "BOOIN" text watermark in the bottom-right corner. Semi-transparent (30-40% opacity), light gray, small font — visible but not distracting.

${panelDescriptions}

High-fidelity Korean text rendering. All speech bubbles must contain Korean text clearly readable with bold weight. Characters should be expressive with exaggerated emotions. Professional webtoon quality, high detail. Each panel has "BOOIN" watermark in bottom-right corner.`;
}

export interface ToonPanel {
  panel: number;
  characters: string[];
  dialogue: Record<string, string>;
  scene: string;
  mood: string;
  props: string[] | null;
  text_overlay: string | null;
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
async function generateToonImage(title: string, panels: ToonPanel[], theme: ThemeType = 'animal'): Promise<string | null> {
  try {
    const prompt = buildImagePrompt(title, panels, theme);

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
  newsUrl?: string,
  theme: ThemeType = 'animal'
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

  // 2단계: 웹툰 스크립트 생성 (테마별, 짝수 컷)
  const toonInput = `제목: ${article.title}\n부제: ${article.subtitle}\n\n해설 기사:\n${article.article_html}`;
  const toonPrompt = buildToonPrompt(theme);

  const toonResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: `${toonPrompt}\n\n---\n\n${toonInput}` }] }],
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

  // 패널 유효성 검사: 짝수만 (6 또는 8컷)
  if (!Array.isArray(panels) || panels.length < 6 || panels.length > 8) {
    throw new Error(`웹툰 패널 수 오류: ${panels?.length ?? 0}컷 (6 또는 8컷 필요)`);
  }
  // 홀수면 마지막 패널 제거해서 짝수로 맞춤 (2xN 그리드 빈칸 방지)
  if (panels.length % 2 !== 0) {
    panels = panels.slice(0, panels.length - 1);
  }

  // 3단계: 웹툰 이미지 생성
  const toon_image_url = await generateToonImage(article.title, panels, theme);

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

export { CHARACTERS, THEME_CHARACTERS };
export type { ThemeType };
