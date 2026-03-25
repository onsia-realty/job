require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const THEME_CHARACTERS = {
  cat: { name: '고양이 기자', role: '진행자/기자', desc: 'white cat with round glasses and a microphone, wearing a press vest' },
  dog: { name: '영끌남', role: '실수요자(영끌)', desc: 'beige puppy holding loan documents, wearing casual clothes, worried expression' },
  fox: { name: '여우 관료', role: '정책 발표자', desc: 'orange fox in a black business suit with red tie, stern expression' },
  horse: { name: '말 소장', role: '부동산 소장', desc: 'brown horse wearing a dress shirt and tie, friendly professional look' },
  squirrel: { name: '다람쥐 아내', role: '현실주의/아내', desc: 'brown squirrel in a yellow hoodie holding house keys, nagging expression' },
  owl: { name: '올빼미 교수', role: '전문가/분석가', desc: 'owl with round glasses holding a clipboard, scholarly and calm' },
};

const NEWS_TITLE = "'파크로쉬 서울원'에 AI 헬스케어 탑재…복합개발 디벨로퍼 전환 가속";
const NEWS_CONTENT = `HDC현대산업개발이 인공지능(AI)과 디지털 기술을 앞세워 사업 구조를 손질하고 새 성장 전략 마련에 나섰다. 주택 사업을 넘어 대규모 복합개발과 사회간접자본(SOC) 인프라 구축으로 사업 영역을 본격적으로 확장한다.

HDC현대산업개발은 전국 주요 공사 현장에 드론을 투입해 시공 오차를 줄이고 있다. 드론으로 현장을 촬영한 뒤 가상 환경에서 콘크리트 타설량을 예측하고 기둥·파일 위치를 도면과 비교해 시공 정밀도를 높이는 방식이다.

올해 공급 예정인 1만3000여가구 단지에도 첨단 기술을 접목한다. 공장에서 미리 만든 콘크리트 부재를 현장에서 조립하는 PC(프리캐스트 콘크리트) 공법도 넓혀 공사 기간과 원가를 줄인다. 올해 상반기 공급하는 대규모 복합개발 단지 '파크로쉬 서울원'에는 아산병원과 연계한 디지털 헬스케어 시스템을 도입해 웨어러블 기기로 입주민의 건강 상태를 실시간 분석하고 맞춤형 관리를 제공한다.

사업 구조는 기존 주택 시공 중심에서 벗어나 인프라와 도심 복합건물 개발로 다각화한다. 지난 1월 남부내륙철도 노반 신설 공사 수주를 시작으로, 향후 항만과 고속도로 등 국가 기반 시설 사업으로 수주 영역을 넓힌다. 남산스퀘어 프로젝트를 통해 난도가 높은 도심 복합건물 리모델링 시장에도 진입하며 신규 사업 모델을 확보할 계획이다.

이 같은 사업 다각화와 신기술 투자는 견고한 실적을 바탕으로 추진된다. HDC현대산업개발의 지난해 연결 기준 매출액은 4조1470억원, 영업이익은 2486억원을 기록했다. 서울원 아이파크, 청주 가경 아이파크 6단지, 수원 아이파크 시티 11·12단지 등 대형 사업장의 매출 반영이 본격화하며 영업이익이 1년 전보다 640억원 늘었다. 신규 수주액은 5조8304억원으로 연간 목표의 124%를 달성했고, 아파트 공급 물량은 1만1000여가구를 기록했다.

도시정비 부문에서도 용산 정비창 전면 제1구역, 대전 변동 A구역 재개발 등을 따내 누적 수주액 4조8012억원을 달성했다.`;

function extractJSON(text) {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
  if (jsonMatch) return jsonMatch[0];
  return text.trim();
}

async function generate() {
  console.log('🚀 뉴스툰 생성 시작: 파크로쉬 서울원 AI 헬스케어\n');

  // ── 1단계: 해설 기사 생성 ──
  console.log('📝 1단계: 해설 기사 생성 중...');
  const articlePrompt = `당신은 "부동산인 온비스" AI 해설가입니다. 부동산 전문 해설 기사를 작성합니다.

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
- 800~1200자 분량

---

제목: ${NEWS_TITLE}

본문:
${NEWS_CONTENT}`;

  const articleRes = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: articlePrompt }] }],
    config: { temperature: 0.8, maxOutputTokens: 4096 },
  });

  const article = JSON.parse(extractJSON(articleRes.text));
  console.log(`  ✅ 제목: ${article.title}`);
  console.log(`  ✅ 카테고리: ${article.category}\n`);

  // ── 2단계: 웹툰 스크립트 생성 ──
  console.log('🎬 2단계: 웹툰 스크립트 생성 중...');
  const charList = Object.values(THEME_CHARACTERS).map(c => `- "${c.name}" — ${c.role}`).join('\n');

  const toonPrompt = `당신은 부동산 풍자 웹툰 작가입니다.
테마: 동물 캐릭터 — 부드럽고 귀여운 풍자

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
- 배경: 한국 도시 느낌 (아파트, 건설현장, 부동산 사무실 등)
- **반드시 6컷 또는 8컷만 생성 (홀수 금지)**

---

제목: ${article.title}
부제: ${article.subtitle}

해설 기사:
${article.article_html}`;

  const toonRes = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: toonPrompt }] }],
    config: { temperature: 0.9, maxOutputTokens: 4096 },
  });

  let panels = JSON.parse(extractJSON(toonRes.text));
  if (panels.length % 2 !== 0) panels = panels.slice(0, panels.length - 1);
  console.log(`  ✅ ${panels.length}컷 생성 완료`);
  panels.forEach(p => {
    console.log(`  Panel ${p.panel}: ${p.characters.join(', ')} — ${Object.values(p.dialogue).join(' / ')}`);
  });
  console.log('');

  // ── 3단계: 이미지 생성 ──
  console.log('🎨 3단계: 웹툰 이미지 생성 중... (1~2분 소요)');
  const cols = 2;
  const rows = Math.ceil(panels.length / cols);

  const panelDescriptions = panels.map((p, i) => {
    const charParts = p.characters.map(name => {
      const key = Object.keys(THEME_CHARACTERS).find(k => THEME_CHARACTERS[k].name === name);
      const charInfo = key ? THEME_CHARACTERS[key] : null;
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

  const imagePrompt = `A ${panels.length}-panel Korean webtoon BOOIN NEWS TOON comic strip in a ${cols}x${rows} grid layout.

Title banner at top: "BOOIN NEWS TOON — ${article.title}" in bold Korean text, dark navy background with white text.

Style: cute chibi animal characters, clean thick outlines, soft pastel colors, Korean webtoon style, warm color palette, professional news infographic feel, high resolution, consistent character design across all panels. Each panel has a distinct pastel background color. Korean text in clean speech bubbles with tails. Urban Korean city backgrounds (apartments, construction sites, real estate offices). Panel numbers in small circles at top-left.

IMPORTANT BRANDING: Every panel must have a small subtle "BOOIN" text watermark in the bottom-right corner. Semi-transparent (30-40% opacity), light gray, small font — visible but not distracting.

${panelDescriptions}

High-fidelity Korean text rendering. All speech bubbles must contain Korean text clearly readable with bold weight. Characters should be expressive with exaggerated emotions. Professional webtoon quality, high detail. Each panel has "BOOIN" watermark in bottom-right corner.`;

  const imageRes = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{ role: 'user', parts: [{ text: imagePrompt }] }],
    config: { responseModalities: ['TEXT', 'IMAGE'], temperature: 0.8 },
  });

  let toon_image_url = null;
  const parts = imageRes.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if (part.inlineData?.data) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        const mimeType = part.inlineData.mimeType || 'image/png';
        const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
        const fileName = `toon-${Date.now()}.${ext}`;
        const filePath = `toon-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('ai-photos')
          .upload(filePath, buffer, { contentType: mimeType, upsert: true });

        if (uploadError) {
          console.error('  ❌ 이미지 업로드 실패:', uploadError);
        } else {
          const { data: urlData } = supabase.storage.from('ai-photos').getPublicUrl(filePath);
          toon_image_url = urlData.publicUrl;
          console.log(`  ✅ 이미지 업로드 완료: ${toon_image_url}`);
        }
      }
    }
  }

  if (!toon_image_url) {
    console.log('  ⚠️ 이미지 생성 실패 — 텍스트만 저장합니다');
  }

  // ── 4단계: DB 저장 ──
  console.log('\n💾 4단계: DB 저장 중...');
  const { data: lastEp } = await supabase
    .from('news_toon_episodes')
    .select('episode_number')
    .order('episode_number', { ascending: false })
    .limit(1)
    .single();

  const nextEpNumber = (lastEp?.episode_number ?? 0) + 1;
  const sanitized = article.title
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
    .replace(/-+$/, '');
  const slug = `ep${String(nextEpNumber).padStart(3, '0')}-${sanitized}`;

  const { data: episode, error: insertError } = await supabase
    .from('news_toon_episodes')
    .insert({
      episode_number: nextEpNumber,
      title: article.title,
      subtitle: article.subtitle,
      slug,
      source_news_url: null,
      source_news_title: NEWS_TITLE,
      category: article.category,
      article_html: article.article_html,
      article_summary: article.article_summary,
      panels,
      toon_image_url,
      status: 'published',
    })
    .select()
    .single();

  if (insertError) {
    console.error('  ❌ DB 저장 실패:', insertError);
    return;
  }

  console.log(`  ✅ EP.${String(nextEpNumber).padStart(3, '0')} 저장 완료!`);
  console.log(`  📌 slug: ${slug}`);
  console.log(`  📌 상태: published`);
  console.log(`\n🎉 뉴스툰 생성 완료!`);
}

generate().catch(err => {
  console.error('❌ 에러:', err);
  process.exit(1);
});
