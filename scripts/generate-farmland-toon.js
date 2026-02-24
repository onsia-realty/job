require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const newsTitle = '이 대통령 "산골짜기 밭도 20만~30만원"…부동산 타깃 확대';
const newsContent = `이재명 대통령이 24일 국무회의에서 "귀농·귀촌을 하려 해도 가서 터를 잡기 어렵다"며 값비싼 농지 문제에 대한 대책 마련을 지시했다. 부동산 투기 근절의 타깃을 주택에서 농지로 확대한 것이다.

이 대통령은 "산골짜기에 버려지다시피 한 밭도 5만원, 10만원, 심하게는 20만~30만원씩 하니 농사를 지을 수가 없다"며 "수도권이 집값 때문에 난리가 났다가 지금은 약간 소강상태가 된 것 같다. 농지 가격에 대해서도 검토를 한번 해봐야 한다"고 말했다.

이 대통령은 특히 농지가 투기 대상이 된 현실을 지적했다. "땅값이 오르지 않을 것 같으면 땅을 내놔야 정상인데, 값이 오를 것 같으니 다 가지고 있는 것"이라며 "헌법에 경자유전이라 명시하고도 온갖 위헌 행위를 방치하고 있다"고 말했다.

이 대통령은 "하여튼 이 나라의 모든 문제의 원천은 부동산 문제"라며 "세제, 규제, 금융 등 부동산을 투기·투자용으로 보유하는 것이 '하나 마나 한 일'이라는 생각이 들게 하지 않으면 사회의 정상적인 발전이 불가능하다"고 말했다.

또한 담합 등 불공정거래 행위 척결을 위해 "신고하면 팔자를 고치도록 포상금을 확 주라"고 주문했다. "4천억원 규모 신고를 하면 몇백억원을 줘라. 로또 하느니 담합 뒤지자고 생각하게 만들어야 한다"고 했다.`;

// ── 캐릭터 설정 ──
const CHARACTERS = {
  cat: { name: '고양이 기자', desc: 'white cat with round glasses and a microphone, wearing a press vest' },
  dog: { name: '영끌남', desc: 'beige puppy holding loan documents, wearing casual clothes, worried expression' },
  fox: { name: '여우 관료', desc: 'orange fox in a black business suit with red tie, stern expression' },
  horse: { name: '말 소장', desc: 'brown horse wearing a dress shirt and tie, friendly professional look' },
  squirrel: { name: '다람쥐 아내', desc: 'brown squirrel in a yellow hoodie holding house keys, nagging expression' },
  owl: { name: '올빼미 교수', desc: 'owl with round glasses holding a clipboard, scholarly and calm' },
};

function extractJSON(text) {
  // Remove markdown code blocks
  let cleaned = text.replace(/^```(?:json)?\s*/gm, '').replace(/^```\s*$/gm, '');
  // Try to find JSON object or array
  const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
  if (jsonMatch) return jsonMatch[0];
  return cleaned.trim();
}

async function generate() {
  console.log('🚀 웹툰 생성 시작...');
  console.log('📰 뉴스:', newsTitle);

  // ── 1단계: 해설 기사 생성 ──
  console.log('\n📝 1단계: 해설 기사 생성 중...');
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
- 800~1200자 분량`;

  const articleResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: `${articlePrompt}\n\n---\n\n제목: ${newsTitle}\n\n본문:\n${newsContent}` }] }],
    config: { temperature: 0.8, maxOutputTokens: 4096 },
  });

  const articleText = articleResponse.text || '';
  const articleJson = extractJSON(articleText);
  // Fix unescaped newlines inside JSON string values
  const fixedJson = articleJson.replace(/(?<=":[ ]*"(?:[^"\\]|\\.)*)(\n)(?=[^"]*")/g, '\\n');
  let article;
  try {
    article = JSON.parse(fixedJson);
  } catch (e) {
    // Fallback: more aggressive newline fixing
    const aggressiveFix = articleJson.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    article = JSON.parse(aggressiveFix);
  }
  console.log('✅ 해설 기사 생성 완료:', article.title);

  // ── 2단계: 웹툰 스크립트 생성 ──
  console.log('\n🎬 2단계: 웹툰 스크립트 생성 중...');
  const toonPrompt = `당신은 부동산 풍자 웹툰 작가입니다.

해설 기사를 바탕으로 웹툰 시나리오를 JSON 배열로 생성하세요.
뉴스 내용의 복잡도에 따라 **4컷~8컷**을 자유롭게 결정하세요.

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
- 배경에 한국 도시 느낌 반영 (아파트, 건설현장, 부동산 사무실 등)`;

  const toonInput = `제목: ${article.title}\n부제: ${article.subtitle}\n\n해설 기사:\n${article.article_html}`;
  const toonResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: `${toonPrompt}\n\n---\n\n${toonInput}` }] }],
    config: { temperature: 0.9, maxOutputTokens: 4096 },
  });

  const toonText = toonResponse.text || '';
  const panels = JSON.parse(extractJSON(toonText));
  console.log(`✅ 웹툰 스크립트 생성 완료: ${panels.length}컷`);
  panels.forEach(p => {
    console.log(`  패널 ${p.panel}: ${p.characters.join(', ')} - ${Object.values(p.dialogue).join(' / ')}`);
  });

  // ── 3단계: 이미지 생성 (Pro 모델) ──
  console.log('\n🎨 3단계: 웹툰 이미지 생성 중 (Pro 모델)...');

  const panelCount = panels.length;
  const cols = 2;
  const rows = Math.ceil(panelCount / cols);

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

  const imagePrompt = `Create a Korean webtoon comic strip with exactly ${panelCount} panels in a ${cols}x${rows} grid layout.

Title banner at top: "${article.title}" in bold Korean text, dark navy background with white text, NEWS TOON subtitle.

Style requirements:
- Cute chibi Korean webtoon style (2D illustration)
- Pastel color palette with soft shading
- Thick clean outlines
- Each panel has a distinct pastel background color (light yellow, light blue, light pink, light green, light purple, light orange)
- Bold black panel borders
- Korean text in clean speech bubbles with tails
- Korean rural and urban backgrounds (rice paddies, mountains, farmland, apartments, government buildings)
- Panel numbers in small circles at top-left of each panel

Character consistency is critical - each animal character must look the same across all panels.

${panelDescriptions}

Important:
- All speech bubbles must contain Korean text clearly readable
- Characters should be expressive with exaggerated emotions
- Include relevant farmland and real estate themed background elements
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

  let toon_image_url = null;
  const parts = imageResponse.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if (part.inlineData?.data) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        const mimeType = part.inlineData.mimeType || 'image/png';
        const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
        const fileName = `toon-${Date.now()}.${ext}`;
        const filePath = `toon-images/${fileName}`;

        console.log(`📤 이미지 업로드 중... (${(buffer.length / 1024).toFixed(1)}KB)`);

        const { error: uploadError } = await supabase.storage
          .from('ai-photos')
          .upload(filePath, buffer, { contentType: mimeType, upsert: true });

        if (uploadError) {
          console.error('❌ 업로드 실패:', uploadError);
        } else {
          const { data: urlData } = supabase.storage.from('ai-photos').getPublicUrl(filePath);
          toon_image_url = urlData.publicUrl;
          console.log('✅ 이미지 업로드 완료:', toon_image_url);
        }
        break;
      }
    }
  }

  if (!toon_image_url) {
    console.log('⚠️ 이미지 생성 실패, 텍스트만 저장합니다.');
  }

  // ── 4단계: DB 저장 ──
  console.log('\n💾 DB 저장 중...');
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
      source_news_title: newsTitle,
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
    console.error('❌ DB 저장 실패:', insertError);
    return;
  }

  console.log(`\n🎉 완료! EP.${String(nextEpNumber).padStart(3, '0')} - ${article.title}`);
  console.log(`📄 Slug: ${slug}`);
  console.log(`🖼️ 이미지: ${toon_image_url ? '있음' : '없음'}`);
  console.log(`🔗 URL: /toon/${slug}`);
}

generate().catch(err => {
  console.error('❌ 에러:', err);
  process.exit(1);
});
