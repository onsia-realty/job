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

async function regen() {
  console.log('🔄 EP.001 새 프롬프트로 재생성 (BOOIN 워터마크 + 한글 강화)...\n');

  // 현재 panels 가져오기
  const { data: ep } = await supabase
    .from('news_toon_episodes')
    .select('title, panels')
    .eq('episode_number', 1)
    .single();

  const panels = ep.panels;
  const title = ep.title;
  const panelCount = panels.length;
  const cols = 2;
  const rows = Math.ceil(panelCount / cols);

  // 패널 설명 조립 (한글 대사 명확 분리)
  const panelDescriptions = panels.map((p, i) => {
    const charDescs = p.characters.map(name => {
      const key = Object.keys(CHARACTERS).find(k => CHARACTERS[k].name === name);
      const charInfo = key ? CHARACTERS[key] : null;
      const desc = charInfo?.desc || name;
      return `${desc} (${p.mood} mood)`;
    }).join(' and ');

    const dialogueLines = p.characters.map(name => {
      const text = p.dialogue[name];
      if (!text) return null;
      return `Speech bubble for ${name}: exact Korean text "${text}"`;
    }).filter(Boolean).join('. ');

    const propsStr = p.props?.length ? `. Props: ${p.props.join(', ')}` : '';
    const sfxStr = p.sfx ? `. Bold SFX: "${p.sfx}"` : '';
    const overlayStr = p.text_overlay ? `. Text overlay banner: "${p.text_overlay}"` : '';

    return `Panel ${i + 1}: ${charDescs}. ${dialogueLines}. Scene: ${p.scene}${propsStr}${sfxStr}${overlayStr}. Small "BOOIN" watermark in bottom-right (subtle, semi-transparent white).`;
  }).join('\n\n');

  // 한글 대사 참조 목록
  const koreanTextRef = panels.flatMap((p, i) =>
    p.characters.map(name => {
      const text = p.dialogue[name];
      return text ? `Panel ${i + 1} - ${name}: "${text}"` : null;
    }).filter(Boolean)
  ).join('\n');

  console.log('📝 한글 대사 목록:');
  console.log(koreanTextRef);

  const imagePrompt = `Create a Korean webtoon comic strip with exactly ${panelCount} panels in a ${cols}x${rows} grid layout.

## HEADER
Title banner at top: "BOOIN NEWS TOON" logo on left side (bold white text), then "${title}" in bold Korean text. Dark navy (#1a1a2e) background with white text.

## ART STYLE
- Cute chibi Korean webtoon style (2D digital illustration)
- Pastel color palette with soft cel-shading
- Thick clean black outlines (3px stroke)
- Each panel has a distinct pastel background color
- Bold black panel borders (4px)
- Panel numbers in small dark circles at top-left of each panel
- Urban Korean city backgrounds

## CHARACTER CONSISTENCY
Each animal character must look IDENTICAL across all panels.

## PANELS
${panelDescriptions}

## KOREAN TEXT RENDERING — CRITICAL
The following Korean text MUST appear EXACTLY as written. Each character (글자) must be rendered correctly with proper consonants (자음) and vowels (모음). Do NOT approximate or corrupt any Korean syllable. Use a clean, bold Korean font (similar to Noto Sans KR Bold or Malgun Gothic Bold).

Reference list of ALL Korean text:
${koreanTextRef}

## SPEECH BUBBLES
- White rounded rectangle bubbles with thin black border
- Pointed tail toward the speaking character
- Korean text must be LARGE enough to read clearly (minimum 14pt equivalent)
- Use bold weight for all Korean text
- Maximum 2 lines per bubble, centered alignment

## WATERMARK
- Each panel has a small "BOOIN" text watermark in bottom-right corner
- Semi-transparent white text (30% opacity), small size

## QUALITY
- Professional webtoon production quality
- High detail on character expressions
- Relevant real estate themed background elements
- Vertical layout optimized for mobile viewing`;

  console.log(`\n🎨 ${panelCount}컷 이미지 생성 중 (Pro 모델)...`);

  const imageResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{ role: 'user', parts: [{ text: imagePrompt }] }],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      temperature: 0.7,
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
      const fileName = `toon-ep001-v3-${Date.now()}.${ext}`;
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

      const { error: updateError } = await supabase
        .from('news_toon_episodes')
        .update({ toon_image_url })
        .eq('episode_number', 1);

      if (updateError) {
        console.error('❌ DB 업데이트 실패:', updateError);
      } else {
        console.log('✅ 완료:', toon_image_url);
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
