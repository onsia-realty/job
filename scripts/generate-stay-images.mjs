/**
 * 단기임대(/stay) 시드 12건용 데모 사진 생성기 (로컬 실행 전용)
 *
 * - 모델: gemini-2.5-flash-image (나노바나나). 장당 약 $0.039.
 * - 매물당 1장만 생성한다. 결과는 public/images/stay/stay-NN.jpg (4:3, 웹 최적화).
 * - 이미 파일이 있으면 건너뛴다(재실행 시 중복 과금 방지). --force 로 덮어쓰기.
 * - 특정 번호만: node scripts/generate-stay-images.mjs 1
 *
 * 사용법:
 *   node scripts/generate-stay-images.mjs        # 없는 것만 전부
 *   node scripts/generate-stay-images.mjs 1      # 1번만 (품질 확인용)
 *   node scripts/generate-stay-images.mjs --force 3 7
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'images', 'stay');

function loadEnv() {
  const envPath = join(__dirname, '..', '.env.local');
  try {
    const content = readFileSync(envPath, 'utf-8');
    const env = {};
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('[gen-stay-images] GEMINI_API_KEY 가 없습니다.');
  process.exit(1);
}

// 공통 지시문 — 한국 부동산 매물 사진 톤. 사람/얼굴 금지, 실제 건물 재현 금지.
const COMMON = [
  'Photorealistic Korean real-estate listing photo, shot by a Korean agent with a wide-angle phone camera.',
  'Looks like a photo from a Korean property listing site (Zigbang / Naver Budongsan), not a Western interior design stock photo.',
  'Korean domestic details: white vinyl or light wood-grain flooring, white silk wallpaper, flat white ceiling with a slim square LED light, aluminium sash windows, white PVC baseboards.',
  'Absolutely no people, no faces, no pets. No text, no logos, no watermarks, no signage with brand names.',
  'Not a recognizable real building. Generic, ordinary, slightly modest — realistic rather than luxury magazine styling.',
  'Bright natural daylight, clean and tidy, neutral white balance, straight horizon, no fisheye distortion, no HDR halos.',
].join(' ');

/** 시드 12건과 1:1 대응 (scripts/seed-stays.mjs SEED_ROWS 순서) */
const SHOTS = [
  { n: 1, type: 'officetel', p: 'Interior of a brand-new small studio (one-room) officetel unit in Gangnam, Seoul. About 26 square meters. Built-in white kitchenette along one wall with induction cooktop, a compact bed with grey bedding, a small desk, a floor-to-ceiling window showing blurred Seoul office towers outside. Full-option furnished.' },
  { n: 2, type: 'apartment', p: 'Living room of a Korean 3-bedroom apartment in Mapo, Seoul, about 84 square meters. Wide living room with a beige fabric sofa, a low TV cabinet, light wood-grain flooring, a large sliding window to an enclosed balcony with a drying rack. Typical Korean apartment layout, family home, lived-in but tidy.' },
  { n: 3, type: 'officetel', p: 'Interior of a newly built officetel unit in Munjeong, Songpa, Seoul. Separated bedroom and living area (one-and-a-half room), grey-toned built-in wardrobe, dark grey kitchen cabinets, a two-seat dining table, a window with a roller blind. Modern, clean, unfurnished except built-ins.' },
  { n: 4, type: 'villa', p: 'Interior of a quiet two-room low-rise Korean villa (multi-family house) in Yeonhui-dong, Seodaemun, Seoul. Modest older building renovated inside: white wallpaper, light wood flooring, a small living room connecting to a kitchen with a sink and a mint-colored tiled backsplash, a window showing green trees of a hillside neighborhood.' },
  { n: 5, type: 'office', p: 'Empty small office suite in a Yeouido, Seoul office building, about 40 square meters. Bare grey carpet tile floor, white painted walls, exposed white ceiling grid with fluorescent troffer lights, a glass entrance door, a wall of windows with vertical blinds overlooking other office buildings. Vacant, ready for a tenant.' },
  { n: 6, type: 'store', p: 'Street-level view of a vacant ground-floor retail unit (sangga) in Jeongja, Bundang, Seongnam. Empty storefront with large clear glass windows and an aluminium frame, a blank white signboard area above with no lettering, grey stone-tiled sidewalk in front, low-rise commercial buildings around. Daytime, no people.' },
  { n: 7, type: 'officetel', p: 'Interior of a compact studio officetel unit in Gwanggyo, Suwon. About 23 square meters, full-option: built-in wardrobe, small kitchenette with a sink and induction, a washing machine tucked in a utility alcove, a single bed, a window with a view of a new-town apartment cluster.' },
  { n: 8, type: 'apartment', p: 'Living room of a Korean apartment in Ilsan, Goyang, facing Lake Park. About 59 square meters. Simple living room with light wallpaper, wood flooring, a small sofa, and a wide window showing green park trees and a lake in the distance. Bright afternoon light.' },
  { n: 9, type: 'office', p: 'Empty office floor inside a Korean knowledge-industry center (jisik-saneop-center) in Jung-dong, Bucheon. Open rectangular space with epoxy or grey tile floor, white walls, exposed ceiling with square LED panels, a row of large windows, an electrical panel and floor outlets. Completely vacant industrial-office space.' },
  { n: 10, type: 'officetel', p: 'Interior of a studio officetel unit in Suji, Yongin. About 25 square meters, one-room layout with a raised loft-free flat ceiling, a compact built-in kitchen, a small round table with two chairs, a bed, and a balcony-style window showing suburban apartment blocks and hills.' },
  { n: 11, type: 'villa', p: 'Interior of a small one-room unit in an older Korean villa in Cheolsan-dong, Gwangmyeong. Modest, budget rental: white wallpaper, light grey vinyl flooring, a tiny kitchenette with a stainless sink and a two-burner gas range, a compact bathroom door, one window with a simple curtain. Clean but plain and inexpensive-looking.' },
  { n: 12, type: 'store', p: 'Interior of a vacant second-floor commercial unit (sangga) in Pyeongchon, Anyang. Empty open space with bare concrete-look floor, white walls, exposed ceiling wiring and lights, a wide band of windows overlooking a commercial street. Unfinished, awaiting a tenant fit-out.' },
];

const argv = process.argv.slice(2);
const force = argv.includes('--force');
const nums = argv.filter((a) => /^\d+$/.test(a)).map(Number);
const targets = SHOTS.filter((s) => (nums.length === 0 ? true : nums.includes(s.n)));

const pad = (n) => String(n).padStart(2, '0');
const outPath = (n) => join(OUT_DIR, `stay-${pad(n)}.jpg`);

async function main() {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  let calls = 0;
  let saved = 0;
  const failed = [];

  for (const shot of targets) {
    const dest = outPath(shot.n);
    if (existsSync(dest) && !force) {
      console.log(`[skip] stay-${pad(shot.n)}.jpg 이미 존재`);
      continue;
    }

    const prompt = `${shot.p}\n\n${COMMON}`;
    let buffer = null;

    // 실패해도 최대 2회까지만 시도한다 (과금 방지).
    for (let attempt = 1; attempt <= 2 && !buffer; attempt++) {
      try {
        calls++;
        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseModalities: ['IMAGE'],
            imageConfig: { aspectRatio: '4:3' },
          },
        });
        const parts = res.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            buffer = Buffer.from(part.inlineData.data, 'base64');
            break;
          }
        }
        if (!buffer) console.log(`  ⚠️ ${shot.n}번 시도 ${attempt}: 이미지 파트 없음`);
      } catch (e) {
        console.log(`  ⚠️ ${shot.n}번 시도 ${attempt} 실패: ${e?.message ?? e}`);
      }
    }

    if (!buffer) {
      failed.push(shot.n);
      continue;
    }

    // 웹 최적화: 1200px 폭, 4:3 커버 크롭, JPEG q78 → 목표 500KB 이하
    const jpg = await sharp(buffer)
      .resize(1200, 900, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 78, mozjpeg: true, progressive: true })
      .toBuffer();
    writeFileSync(dest, jpg);
    saved++;
    console.log(`✅ stay-${pad(shot.n)}.jpg (${shot.type}) ${(jpg.length / 1024).toFixed(0)}KB`);
  }

  console.log(`\n[gen-stay-images] 저장 ${saved}장 / API 호출 ${calls}회 / 추정비용 $${(calls * 0.039).toFixed(3)}`);
  if (failed.length) console.log(`[gen-stay-images] 실패: ${failed.join(', ')}`);
}

main().catch((e) => {
  console.error('[gen-stay-images] 치명적 오류:', e?.message ?? e);
  process.exit(1);
});
