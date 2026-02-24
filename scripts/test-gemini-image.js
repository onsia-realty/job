// Gemini 이미지 생성 테스트
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

async function testImageGeneration() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  console.log('🎨 Gemini 이미지 생성 테스트 시작...');

  const prompt = `Create a 4-panel Korean webtoon comic strip in a 2x2 grid layout.

Title banner at top: "대출 막았더니 시장이 런함 😤" in bold Korean text, dark navy background.

Style: Cute chibi Korean webtoon style, pastel colors, thick clean outlines, Korean speech bubbles.

Panel 1 (top-left, light yellow bg): An orange fox in black business suit with red tie, angrily announcing "대출 조인다!" with a megaphone. Signs showing "LTV 제한" and "다주택 금지". Korean city background.

Panel 2 (top-right, light blue bg): A beige puppy holding loan documents, happily saying "오... 그럼 이제 떨어지는 거죠?" looking at a map. Korean apartment buildings in background.

Panel 3 (bottom-left, light green bg): Same beige puppy, now looking worried, saying "전세 왜 더 비싸요...?" Text overlay: "3년 후". Dead trees and rising price graph.

Panel 4 (bottom-right, light pink bg): The orange fox smugly pointing at construction cranes, saying "공급은 2030년 예정입니다."

All text must be in Korean, clearly readable in speech bubbles.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        temperature: 0.8,
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      console.log('❌ 응답에 parts가 없습니다');
      console.log('Response:', JSON.stringify(response, null, 2).substring(0, 500));
      return;
    }

    let imageFound = false;
    for (const part of parts) {
      if (part.text) {
        console.log('📝 텍스트 응답:', part.text.substring(0, 200));
      }
      if (part.inlineData?.data) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        const ext = (part.inlineData.mimeType || '').includes('jpeg') ? 'jpg' : 'png';
        const filename = `test-toon-image.${ext}`;
        fs.writeFileSync(filename, buffer);
        console.log(`✅ 이미지 생성 성공! ${filename} (${(buffer.length / 1024).toFixed(1)}KB)`);
        imageFound = true;
      }
    }

    if (!imageFound) {
      console.log('⚠️ 이미지가 생성되지 않았습니다. 텍스트만 반환됨.');
      console.log('Parts:', parts.map(p => ({ text: !!p.text, image: !!p.inlineData })));
    }
  } catch (err) {
    console.error('❌ 에러:', err.message);
    if (err.message.includes('not found') || err.message.includes('not supported')) {
      console.log('\n💡 다른 모델 시도 중...');
      // 대안 모델 시도
      try {
        const response2 = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: 'A cute Korean webtoon style 4-panel comic about real estate market, chibi animal characters, pastel colors',
          config: { numberOfImages: 1 },
        });

        if (response2.generatedImages?.[0]?.image?.imageBytes) {
          const buffer = Buffer.from(response2.generatedImages[0].image.imageBytes, 'base64');
          fs.writeFileSync('test-toon-imagen.png', buffer);
          console.log(`✅ Imagen 3 성공! test-toon-imagen.png (${(buffer.length / 1024).toFixed(1)}KB)`);
        }
      } catch (err2) {
        console.error('❌ Imagen 3도 실패:', err2.message);
      }
    }
  }
}

testImageGeneration();
