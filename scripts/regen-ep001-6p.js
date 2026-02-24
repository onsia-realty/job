require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CHARACTERS = {
  cat: { name: '고양이 기자', desc: 'white cat with round glasses and a microphone, wearing a press vest' },
  dog: { name: '영끌남', desc: 'beige puppy holding loan documents, wearing casual clothes, worried expression' },
  fox: { name: '여우 관료', desc: 'orange fox in a black business suit with red tie, stern expression' },
  horse: { name: '말 소장', desc: 'brown horse wearing a dress shirt and tie, friendly professional look' },
  squirrel: { name: '다람쥐 아내', desc: 'brown squirrel in a yellow hoodie holding house keys, nagging expression' },
  owl: { name: '올빼미 교수', desc: 'owl with round glasses holding a clipboard, scholarly and calm' },
};

function extractJSON(text) {
  let cleaned = text.replace(/^```(?:json)?\s*/gm, '').replace(/^```\s*$/gm, '');
  const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
  if (jsonMatch) return jsonMatch[0];
  return cleaned.trim();
}

async function regen() {
  console.log('🔄 EP.001 6~8컷으로 재생성 시작...\n');

  // 현재 기사 가져오기
  const { data: ep } = await supabase
    .from('news_toon_episodes')
    .select('title, subtitle, article_html')
    .eq('episode_number', 1)
    .single();

  // ── 1단계: 6~8컷 웹툰 스크립트 생성 ──
  console.log('🎬 1단계: 6~8컷 웹툰 스크립트 생성 중...');

  const toonPrompt = `당신은 부동산 풍자 웹툰 작가입니다.

해설 기사를 바탕으로 웹툰 시나리오를 JSON 배열로 생성하세요.
**반드시 6컷~8컷**으로 제작하세요. 4컷은 부족합니다.

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
    "characters": ["캐릭터명1"],
    "dialogue": { "캐릭터명1": "대사" },
    "scene": "장면 상세 묘사",
    "mood": "happy|angry|sad|shocked|smug|neutral",
    "props": ["소품 목록"],
    "text_overlay": null,
    "sfx": null
  }
]

## 규칙
- 풍자적이되 정치적으로 중립
- 마지막 컷에 반전 또는 풍자 펀치라인 필수
- 각 대사는 20자 이내
- 이모지 활용 가능
- 캐릭터 3~4명을 골고루 사용
- 장면 묘사를 상세하게 (이미지 생성에 사용됨)
- 시간 경과 표현 가능 ("1년 후", "3년 후")
- 한국 도시 배경 (아파트, 건설현장, 부동산 사무실)
- 기승전결 구조: 도입(1~2컷) → 전개(3~4컷) → 위기(5~6컷) → 결말/반전(7~8컷)`;

  const toonInput = `제목: ${ep.title}\n부제: ${ep.subtitle}\n\n해설 기사:\n${ep.article_html}`;
  const toonResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: `${toonPrompt}\n\n---\n\n${toonInput}` }] }],
    config: { temperature: 0.9, maxOutputTokens: 4096 },
  });

  const toonText = toonResponse.text || '';
  const toonJson = extractJSON(toonText);
  let panels;
  try {
    panels = JSON.parse(toonJson);
  } catch {
    // Fix unescaped newlines in JSON strings
    const fixed = toonJson.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    panels = JSON.parse(fixed);
  }
  console.log(`✅ 웹툰 스크립트 생성 완료: ${panels.length}컷`);
  panels.forEach(p => {
    const chars = p.characters.join(', ');
    const lines = Object.values(p.dialogue).join(' / ');
    console.log(`  패널 ${p.panel}: [${chars}] ${lines}`);
  });

  if (panels.length < 6) {
    console.error(`❌ ${panels.length}컷은 부족합니다. 6컷 이상 필요.`);
    return;
  }

  // ── 2단계: 이미지 생성 ──
  console.log(`\n🎨 2단계: ${panels.length}컷 웹툰 이미지 생성 중 (Pro 모델)...`);

  const cols = 2;
  const rows = Math.ceil(panels.length / cols);

  const panelDescriptions = panels.map((p, i) => {
    const charDescs = p.characters.map(name => {
      const key = Object.keys(CHARACTERS).find(k => CHARACTERS[k].name === name);
      const charInfo = key ? CHARACTERS[key] : null;
      const desc = charInfo?.desc || name;
      const dialogue = p.dialogue[name] || '';
      return `${desc} (${p.mood} mood)${dialogue ? `, saying "${dialogue}" in Korean speech bubble` : ''}`;
    }).join(' and ');

    const propsStr = p.props?.length ? `, props: ${p.props.join(', ')}` : '';
    const sfxStr = p.sfx ? `, bold SFX text: "${p.sfx}"` : '';
    const overlayStr = p.text_overlay ? `, text overlay: "${p.text_overlay}"` : '';

    return `Panel ${i + 1}: ${charDescs}. Scene: ${p.scene}${propsStr}${sfxStr}${overlayStr}`;
  }).join('\n');

  const imagePrompt = `Create a Korean webtoon comic strip with exactly ${panels.length} panels in a ${cols}x${rows} grid layout.

Title banner at top: "${ep.title}" in bold Korean text, dark navy background with white text, NEWS TOON subtitle.

Style requirements:
- Cute chibi Korean webtoon style (2D illustration)
- Pastel color palette with soft shading
- Thick clean outlines
- Each panel has a distinct pastel background color (light yellow, light blue, light pink, light green, light purple, light orange)
- Bold black panel borders
- Korean text in clean speech bubbles with tails
- Urban Korean city backgrounds (apartments, construction cranes, real estate offices, government buildings)
- Panel numbers in small circles at top-left of each panel

Character consistency is critical - each animal character must look the same across all panels.

${panelDescriptions}

Important:
- All speech bubbles must contain Korean text clearly readable
- Characters should be expressive with exaggerated emotions
- Include relevant real estate themed background elements
- Professional webtoon quality, high detail
- Vertical layout optimized for mobile viewing`;

  const imageResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{ role: 'user', parts: [{ text: imagePrompt }] }],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      temperature: 0.8,
    },
  });

  const parts = imageResponse.candidates?.[0]?.content?.parts;
  if (!parts) {
    console.log('⚠️ 이미지 생성 실패');
    return;
  }

  for (const part of parts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, 'base64');
      const mimeType = part.inlineData.mimeType || 'image/png';
      const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
      const fileName = `toon-ep001-6p-${Date.now()}.${ext}`;
      const filePath = `toon-images/${fileName}`;

      console.log(`📤 이미지 업로드 중... (${(buffer.length / 1024).toFixed(1)}KB)`);

      const { error: uploadError } = await supabase.storage
        .from('ai-photos')
        .upload(filePath, buffer, { contentType: mimeType, upsert: true });

      if (uploadError) {
        console.error('❌ 업로드 실패:', uploadError);
        return;
      }

      const { data: urlData } = supabase.storage.from('ai-photos').getPublicUrl(filePath);
      const toon_image_url = urlData.publicUrl;

      // DB 업데이트 (panels + image)
      const { error: updateError } = await supabase
        .from('news_toon_episodes')
        .update({ panels, toon_image_url })
        .eq('episode_number', 1);

      if (updateError) {
        console.error('❌ DB 업데이트 실패:', updateError);
      } else {
        console.log('✅ 이미지 업로드 완료:', toon_image_url);
        console.log(`\n🎉 EP.001 ${panels.length}컷으로 업그레이드 완료!`);
      }
      return;
    }
  }

  console.log('⚠️ 이미지 데이터 없음');
}

regen().catch(err => {
  console.error('❌ 에러:', err);
  process.exit(1);
});
