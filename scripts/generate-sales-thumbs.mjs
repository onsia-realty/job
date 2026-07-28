/**
 * 분양 공고 샘플 썸네일 생성 (데모용)
 *
 * 배경: Gemini(gemini-2.5-flash-image)로 생성한 제너릭 건축 렌더
 *       — 실존 단지를 특정할 수 있는 형태/로고/문자는 금지 프롬프트로 배제
 * 오버레이: sharp + SVG 로 공고 데이터(현장명·모집직급·조건)를 조판
 * 출력: public/images/sales-thumbs/{id}.jpg  (800x800, 카드 썸네일 슬롯은 128px 폭)
 *
 * 사용법: node scripts/generate-sales-thumbs.mjs
 * 규칙: 기존 파일 덮어쓰기 금지 — 이미 있으면 건너뜀 (--force 로 재생성)
 */
import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'images', 'sales-thumbs');
const FORCE = process.argv.includes('--force');

const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

// 키 검사는 실제 생성 시점까지 미룬다 (preview 스크립트가 임포트만 할 수 있도록)
let _ai = null;
function getAI() {
  const key = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('❌ GEMINI_API_KEY 없음 — .env.local 에 추가하세요.');
    process.exit(1);
  }
  if (!_ai) _ai = new GoogleGenAI({ apiKey: key });
  return _ai;
}

const SIZE = 800;

// ── 대상: 노출 우선순위가 가장 높은 5건 (unique 2 + superior 3) ──
// headline/chip 은 salesJobsSample.ts 의 실제 필드에서 가져온 값
export const TARGETS = [
  {
    id: '1',
    tier: 'unique',
    meta: '경기 · 아파트',
    headline: ['팀 / 직원', '모집'],
    site: '힐스테이트',
    chip: '최대 400만',
    sub: '숙소제공 · 일비',
    scene:
      'a cluster of modern high-rise residential towers at dusk, warm golden window lights, wide city skyline behind, low aerial view',
    accent: '#F5B742',
  },
  {
    id: '8',
    tier: 'unique',
    meta: '세종 · 지식산업센터',
    headline: ['팀장', '모집'],
    site: '세종 지식산업센터',
    chip: '최대 600만',
    sub: '숙소 · 차량 · 식대',
    scene:
      'a contemporary glass knowledge-industry office complex at blue hour, clean geometric facade, landscaped plaza in front, low aerial view',
    accent: '#5EC8F5',
  },
  {
    id: 's1',
    tier: 'superior',
    meta: '서울 · 아파트',
    headline: ['팀장', '모집'],
    site: '강서 민간임대',
    chip: '팀 수수료 1,100',
    sub: '중식제공 · 광고지원',
    scene:
      'modern mid-rise apartment buildings beside a wide riverside park at sunset, soft orange sky, low aerial view',
    accent: '#7DD3A0',
  },
  {
    id: 's2',
    tier: 'superior',
    meta: '서울 · 레지던스',
    headline: ['상담사', '모집'],
    site: '파크로쉬 레지던스',
    chip: '상담 문의',
    sub: '신규 오픈 현장',
    scene:
      'a premium residence tower with warm lobby lighting at night, tree-lined approach road, cinematic architectural render, low angle',
    accent: '#C9A227',
  },
  {
    id: 's3',
    tier: 'superior',
    meta: '인천 · 민간임대',
    headline: ['직원', '모집'],
    site: '인천시청역 민간임대',
    chip: '일비 3만원',
    sub: '역세권 현장',
    scene:
      'new apartment towers next to a subway station plaza in the early evening, city lights turning on, low aerial view',
    accent: '#8AB4FF',
  },
];

const NEGATIVE =
  'Do NOT include any text, letters, numbers, signage, logos, watermarks, brand names, or people. ' +
  'Do NOT depict any real, identifiable, or existing building complex — the architecture must be generic and non-specific.';

async function generateBackground(scene) {
  const prompt =
    `Photorealistic architectural marketing render: ${scene}. ` +
    `Korean urban context, clean modern architecture, rich saturated colors, high contrast, ` +
    `dramatic sky, professional real-estate promotional photography quality. ` +
    `Square 1:1 composition with the buildings positioned in the upper two-thirds, ` +
    `leaving the lower third visually calm for a text overlay. ${NEGATIVE}`;

  const response = await getAI().models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { responseModalities: ['image', 'text'] },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart?.inlineData) throw new Error('이미지 파트 없음');
  return Buffer.from(imagePart.inlineData.data, 'base64');
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function overlaySvg(t) {
  const W = SIZE;
  const H = SIZE;
  const tierLabel = t.tier === 'unique' ? 'UNIQUE' : 'SUPERIOR';
  const tierBg = t.tier === 'unique' ? '#7C3AED' : '#2563EB';
  const [line1, line2] = t.headline;

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#050B18" stop-opacity="0.72"/>
      <stop offset="38%"  stop-color="#050B18" stop-opacity="0.30"/>
      <stop offset="62%"  stop-color="#050B18" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#050B18" stop-opacity="0.95"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#scrim)"/>

  <!-- 등급 배지 -->
  <rect x="40" y="40" rx="10" width="168" height="52" fill="${tierBg}"/>
  <text x="124" y="76" font-family="Malgun Gothic" font-size="27" font-weight="bold"
        fill="#FFFFFF" text-anchor="middle" letter-spacing="2">${tierLabel}</text>

  <!-- 지역 · 유형 -->
  <text x="40" y="138" font-family="Malgun Gothic" font-size="27"
        fill="#D6DEEC" letter-spacing="1">${esc(t.meta)}</text>

  <!-- 메인 헤드라인 -->
  <text x="40" y="430" font-family="Malgun Gothic" font-size="104" font-weight="bold"
        fill="#FFFFFF">${esc(line1)}</text>
  <text x="40" y="540" font-family="Malgun Gothic" font-size="104" font-weight="bold"
        fill="${t.accent}">${esc(line2)}</text>

  <!-- 현장명 -->
  <text x="40" y="618" font-family="Malgun Gothic" font-size="38" font-weight="bold"
        fill="#FFFFFF" opacity="0.95">${esc(t.site)}</text>

  <!-- 조건 칩 -->
  <rect x="40" y="662" rx="12" width="${28 + t.chip.length * 24}" height="60"
        fill="${t.accent}"/>
  <text x="${54 + (t.chip.length * 24) / 2}" y="703" font-family="Malgun Gothic"
        font-size="33" font-weight="bold" fill="#0B1220" text-anchor="middle">${esc(t.chip)}</text>

  <!-- 보조 문구 -->
  <text x="40" y="762" font-family="Malgun Gothic" font-size="26"
        fill="#B8C4D8">${esc(t.sub)}</text>
</svg>`;
}

async function build(t) {
  const outPath = join(OUT_DIR, `${t.id}.jpg`);
  if (existsSync(outPath) && !FORCE) {
    console.log(`⏭  ${t.id} 이미 있음 — 건너뜀 (--force 로 재생성)`);
    return;
  }

  process.stdout.write(`🎨 ${t.id} (${t.site}) 배경 생성 중... `);
  const bg = await generateBackground(t.scene);
  process.stdout.write('합성 중... ');

  const base = await sharp(bg).resize(SIZE, SIZE, { fit: 'cover' }).toBuffer();
  const out = await sharp(base)
    .composite([{ input: Buffer.from(overlaySvg(t)), top: 0, left: 0 }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  writeFileSync(outPath, out);
  console.log(`✅ ${(out.length / 1024).toFixed(0)}KB`);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`📁 출력: ${OUT_DIR}\n`);

  let ok = 0;
  for (const t of TARGETS) {
    try {
      await build(t);
      ok += 1;
    } catch (e) {
      console.log(`❌ ${t.id} 실패: ${e.message}`);
    }
  }

  console.log(`\n완료: ${ok}/${TARGETS.length}`);
  console.log('검수 후 salesJobsSample.ts 각 항목에 다음을 추가하면 카드에 반영됩니다:');
  TARGETS.forEach((t) => console.log(`  id '${t.id}' → thumbnail: '/images/sales-thumbs/${t.id}.jpg',`));
}

// 직접 실행할 때만 동작 (preview 스크립트에서 TARGETS/overlaySvg 임포트 가능)
if (process.argv[1] && process.argv[1].endsWith('generate-sales-thumbs.mjs')) main();
