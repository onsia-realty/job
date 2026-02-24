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
};

// 개선된 article_html (중복 타임라인 제거 + 전문가 톤)
const newArticleHtml = `<h3>🎯 핵심 요약: 대출 차단, 허가제, 공급 약속 — 3대 카드의 실체</h3>
<p>이재명 정부는 전임 정부의 세금 중심 규제에서 벗어나 <strong>대출 한도 제한, 토지거래허가제, 공급 확대</strong>라는 3대 카드를 꺼냈습니다. 그러나 시장 참여자들의 반응은 냉담합니다. 규제가 수요를 억누를수록, 시장은 규제를 우회하는 방법을 먼저 학습한다는 것이 역사적 교훈이기 때문입니다.</p>

<div class="highlight-box">
💡 <strong>부동산인 포인트</strong><br>
대출이 막히면 현금거래가 늘고, 허가가 걸리면 대기 수요가 쌓이고, 규제지역이 확대되면 비규제지역으로 풍선효과가 발생합니다. 문재인 정부 5년간 26차례 규제에도 서울 아파트값은 52% 상승했습니다.
</div>

<h3>📋 정책 분석: 이재명 정부 3대 카드</h3>
<p><strong>① 6·27 대출 차단</strong> — 주담대 한도 6억 원 상한, 다주택자 신규 대출 전면 차단. 실수요자 입장에서는 "자금력이 아니라 제도가 내 집 마련을 가로막는다"는 볼멘소리가 나옵니다. 현금 동원력이 있는 자산가와 없는 실수요자 간 격차만 벌어질 수 있습니다.</p>
<p><strong>② 9·7 공급 확대</strong> — 2030년까지 수도권 135만 호 착공 목표를 제시했습니다. 그러나 정비사업 인허가-이주-철거-착공까지 통상 5~7년이 소요됩니다. 시장이 원하는 것은 "착공 숫자"가 아니라 "입주 가능한 실물 주택"입니다.</p>
<p><strong>③ 10·15 토허제 확대</strong> — 서울 전역과 경기 12개 지역을 토지거래허가구역으로 지정했습니다. 시가 25억 초과 주택은 대출 한도가 2억 원으로 제한됩니다. 거래 위축은 불가피하나, 가격 하락으로 이어질지는 별개의 문제입니다.</p>

<h3>🔮 시장 전망: 1년·3년·5년 시나리오</h3>
<p><strong>1년 뒤 — 거래 절벽과 양극화.</strong> 강남·용산·마포 등 상급지는 현금 거래 중심으로 호가가 유지됩니다. 반면 노원·도봉·강북 등 대출 의존도가 높은 중하급지는 거래가 급감하며 가격 조정 압력을 받습니다. 서울이 "두 개의 시장"으로 분리되는 양극화가 심화됩니다.</p>
<p><strong>3년 뒤 — 공급 병목과 전세 불안.</strong> 정비사업 병목으로 실제 공급이 지연되는 가운데, 갭투자 차단으로 임대 물량까지 줄어듭니다. "전세난 → 전셋값 상승 → 매매가 상승"이라는 역대 정부에서 반복된 악순환 고리가 재현될 가능성이 있습니다.</p>
<p><strong>5년 뒤 — 정상화 또는 데자뷔.</strong> 공급이 실물로 나타나고 규제가 단계적으로 완화되면 연착륙이 가능합니다. 그러나 공급이 지연되고 규제만 장기화되면 상급지 쏠림이 고착되고, 경매·법인 거래 등 우회 경로만 확대되는 최악의 시나리오가 됩니다.</p>

<div class="highlight-box">
🏠 <strong>부동산인 결론</strong><br>
진짜 질문은 "집값이 오르냐 내리냐"가 아닙니다. <strong>"누가, 어떤 방식으로, 어느 지역의 주택에 접근할 수 있는가"</strong>입니다. 규제만으로 집값을 잡지 못한다는 것은 이미 반복 검증된 사실입니다. 실효성 있는 공급 확대와 맞춤형 대출 완화 없이는, 시장의 우회와 양극화만 가속될 것입니다.
</div>`;

async function upgradeEp001() {
  console.log('📝 1단계: 기사 HTML 업데이트...');

  // article_html 업데이트 (중복 타임라인 제거, 전문가 톤)
  const { error: updateError } = await supabase
    .from('news_toon_episodes')
    .update({ article_html: newArticleHtml })
    .eq('episode_number', 1);

  if (updateError) {
    console.error('❌ 기사 업데이트 실패:', updateError);
    return;
  }
  console.log('✅ 기사 HTML 업데이트 완료');

  // ── 2단계: Pro 모델로 이미지 재생성 ──
  console.log('\n🎨 2단계: Pro 모델로 웹툰 이미지 재생성...');

  const title = '규제로 집값 잡겠다? 시장은 칼 피하는 법부터 배운다';

  const imagePrompt = `Create a Korean webtoon comic strip with exactly 4 panels in a 2x2 grid layout.

Title banner at top: "${title}" in bold Korean text, dark navy background with white text, NEWS TOON subtitle.

Style requirements:
- Cute chibi Korean webtoon style (2D illustration)
- Pastel color palette with soft shading
- Thick clean outlines
- Each panel has a distinct pastel background color
- Bold black panel borders
- Korean text in clean speech bubbles with tails
- Urban Korean city backgrounds (apartments, government buildings, real estate offices)
- Panel numbers in small circles at top-left of each panel

Character consistency is critical - each animal character must look the same across all panels.

Panel 1: ${CHARACTERS.fox.desc} (angry mood), confidently holding a megaphone, saying "대출 막고! 허가제 걸고!" in Korean speech bubble. Scene: Government podium with "부동산 규제" signs, Korean city skyline background. Bold SFX text: "번쩍!"

Panel 2: ${CHARACTERS.dog.desc} (sad mood), saying "제도가 못 사게 합니다..." in Korean speech bubble. Scene: In front of a bank with "대출 한도 6억" sign, the puppy looking dejected holding rejection papers.

Panel 3: ${CHARACTERS.horse.desc} (smug mood), casually holding stacks of cash, saying "대출? 그게 뭐죠? 강남 하나 더!" in Korean speech bubble. Scene: Luxury apartment building background, the horse looking confident and wealthy.

Panel 4: ${CHARACTERS.fox.desc} (shocked mood), glasses askew, saying "거래만 죽고 집값은 그대로?!" in Korean speech bubble. Scene: The fox looking at a graph showing flat prices but declining transactions, looking confused and frustrated.

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
    console.log('⚠️ 이미지 생성 실패: parts 없음');
    return;
  }

  for (const part of parts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, 'base64');
      const mimeType = part.inlineData.mimeType || 'image/png';
      const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
      const fileName = `toon-ep001-pro-${Date.now()}.${ext}`;
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
      console.log('✅ 이미지 업로드 완료:', toon_image_url);

      // DB 업데이트
      const { error: imgUpdateError } = await supabase
        .from('news_toon_episodes')
        .update({ toon_image_url })
        .eq('episode_number', 1);

      if (imgUpdateError) {
        console.error('❌ 이미지 URL 업데이트 실패:', imgUpdateError);
      } else {
        console.log('✅ EP.001 이미지 업그레이드 완료!');
      }
      return;
    }
  }

  console.log('⚠️ 이미지 데이터 없음');
}

upgradeEp001().catch(err => {
  console.error('❌ 에러:', err);
  process.exit(1);
});
