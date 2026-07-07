/**
 * 포토툰 에피소드 합성 + 업로드 + draft 등록 (수동 생성 컷 → BOOIN NEWS TOON)
 *
 * 입력: 드리미나/나노바나나 등에서 수작업 생성한 컷 PNG들 (CUTS 배열)
 * 출력: 다크 프레임 세로 웹툰 마스터(JPEG) + 썸네일 → ai-photos/toon-images/ 업로드
 *       → news_toon_episodes에 status='draft'로 insert (검수 후 발행)
 *
 * 사용법: node scripts/compose-phototoon-ep.mjs
 * 규칙: 기존 이미지 삭제 절대 금지 — 항상 새 파일명으로 업로드
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const SB = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB || !KEY) { console.error('env 누락'); process.exit(1); }
const supabase = createClient(SB, KEY);

// ── 에피소드 정의 ──
const EP = {
  slug: 'balloon-effect-byeongjeom-namyangju-20260707',
  title: '규제 찍자, 옆동네가 부풀었다',
  subtitle: '동탄·기흥·구리 지정 일주일 만에 병점·남양주 호가 최대 1억 급등',
  category: '정책',
  source_news_title: '동탄 옆 병점, 구리 옆 남양주도… 추가 규제 지역 인근 호가 급등',
  article_summary: '규제지역 지정 일주일 만에 옆동네 병점·남양주 호가가 최대 1억 급등. 전세난에 밀린 실수요가 대체지로 옮겨가며 풍선효과가 역대급 속도로 나타나고 있다.',
};

const CUTS = [
  { file: 'E:/다운로드/cut1.png', scene: '정부 규제지역 발표', dialogue: '동탄·기흥·구리, 규제지역 추가 지정' },
  { file: 'E:/다운로드/cut 2.png', scene: '병점 호가 풍선 급등', dialogue: '일주일 만에… 옆동네 병점 호가 급등 (7.6억→8억)' },
  { file: 'E:/다운로드/cut3.png', scene: '남양주 동반 급등', dialogue: '남양주도 최대 1억 껑충 (10.5→10.8억, 11→12억)' },
  { file: 'E:/다운로드/cut 4.png', scene: '부동산 사무실 문의 폭주', dialogue: '매수 문의 폭주, 집주인은 "급할 게 없어요~"' },
  { file: 'E:/다운로드/cut 5.png', scene: '전세난민의 이동', dialogue: '전셋값에 밀려난 실수요자, 대체지로' },
  { file: 'E:/다운로드/cut 6.png', scene: '국토부 모니터링', dialogue: '"모니터링 하겠습니다…" 다음 풍선은 어디?' },
];

const ARTICLE_HTML = `
<h3>🎯 핵심 요약: 규제 도장 찍고 딱 일주일, 옆동네가 먼저 움직였다</h3>
<p>지난달 30일 정부가 경기 화성 동탄구·용인 기흥구·구리시를 규제지역으로 추가 지정하자, <strong>불과 일주일 만에</strong> 바로 옆 비규제 지역인 병점과 남양주의 아파트 호가가 수천만 원에서 최대 1억 원까지 뛰었습니다. 병점역아이파크캐슬 84㎡는 7억6000만원에서 8억원으로, 신동탄포레자이는 9억7000만원에서 10억7000만원으로 호가가 올랐고, 남양주 힐스테이트다산도 11억원에서 12억원으로 상향됐습니다.</p>
<div class="highlight-box">💡 <strong>부동산인 포인트</strong><br>과거 풍선효과는 규제 후 2~3주 관망을 거쳐 나타났습니다. 이번엔 <strong>즉각 반응</strong>했다는 게 핵심입니다. 반복 학습된 시장은 이제 "다음 오를 곳"을 규제 발표 당일에 계산합니다.</div>
<h3>📋 상세 분석</h3>
<p>병점이 첫 풍선이 된 건 우연이 아닙니다. <strong>동탄 생활권과 맞붙어 있고 삼성전자 화성캠퍼스 배후 수요</strong>까지 겹치는, 사실상 예고된 대체지였습니다. 현장 중개사들은 "거래가 폭발한 건 아니지만 매수 문의가 눈에 띄게 늘었고, 집주인들은 '급할 게 없다'며 매물을 거둬들이거나 호가를 올리는 분위기"라고 전합니다. 문의는 늘고 매물은 잠기는 전형적인 <strong>호가 선행 구간</strong>입니다.</p>
<p>수요의 정체도 중요합니다. 지금 움직이는 매수 주체는 투기 수요가 아니라 <strong>전셋값 급등에 밀려난 실수요자</strong>입니다. 서울 전세 매물이 1년 새 10% 넘게 줄고 전셋값이 20주 넘게 오르는 상황에서, 규제로 한 지역이 막히면 이들은 관망이 아니라 <strong>대체지 탐색</strong>을 선택할 수밖에 없습니다.</p>
<h3>🔮 전망</h3>
<p>국토부는 "시장 모니터링 후 추가 지정 여부를 판단하겠다"는 입장입니다. 다만 공급 부족과 전월세 불안이 해소되지 않는 한, 추가 지정은 또 다른 인접지의 풍선으로 이어질 공산이 큽니다. 전문가들 사이에서도 "지역별 정도의 차이만 있을 뿐 풍선효과 자체를 피하긴 어렵다"는 평가가 우세합니다. 다음 관전 포인트는 병점·남양주의 <strong>호가가 실거래로 확인되는 시점</strong>, 그리고 그 시점의 정부 대응 속도입니다.</p>
<div class="highlight-box">🏠 <strong>부동산인 결론</strong><br>규제는 수요를 없애지 못하고 옮길 뿐입니다. 실수요자라면 호가만 오른 구간의 추격 매수는 경계하되, 인접 대체지의 <strong>실거래 추이</strong>를 부동산인 시세표로 확인하며 움직이는 것이 안전합니다.</div>`.trim();

// ── 레이아웃 상수 (다크 프레임 2열×3행 그리드) ──
const W = 1080, MARGIN = 36, GAP = 26, RADIUS = 14;
const HEADER_H = 190, FOOTER_H = 96;
const BG = '#0F172A';
const PANEL_W = W - MARGIN * 2;
const COLS = 2, ROWS = 3;
const CELL_W = Math.round((W - MARGIN * 2 - GAP) / COLS); // 491
const CELL_H = Math.round((CELL_W * 10) / 16);            // 307 (16:10)

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FONT = "'Malgun Gothic','Pretendard',sans-serif";

// ── 한 컷 → 셀 버퍼 (fit:contain, 잘림 없음 + 라운드 마스크 + BOOIN 워터마크) ──
async function makeCell(cut) {
  // contain: 원본 비율 유지, 남는 여백은 배경색으로 채움 (자막 잘림 방지)
  const resized = await sharp(cut.file)
    .resize(CELL_W, CELL_H, { fit: 'contain', background: BG })
    .toBuffer();
  const mask = Buffer.from(
    `<svg width="${CELL_W}" height="${CELL_H}"><rect x="0" y="0" width="${CELL_W}" height="${CELL_H}" rx="${RADIUS}" fill="#fff"/></svg>`
  );
  const wm = Buffer.from(
    `<svg width="${CELL_W}" height="${CELL_H}"><text x="${CELL_W - 14}" y="${CELL_H - 12}" text-anchor="end" font-family=${JSON.stringify(FONT)} font-size="18" font-weight="700" fill="#FFFFFF" fill-opacity="0.55">BOOIN</text></svg>`
  );
  return sharp(resized)
    .composite([
      { input: mask, blend: 'dest-in' },
      { input: wm, blend: 'over' },
    ])
    .png()
    .toBuffer();
}

async function main() {
  // 1) 각 컷 → 셀 (2열×3행 배치용)
  const cells = [];
  for (const cut of CUTS) cells.push(await makeCell(cut));

  // 2) 캔버스 조립 (그리드)
  const bodyH = CELL_H * ROWS + GAP * (ROWS - 1);
  const totalH = HEADER_H + bodyH + FOOTER_H;

  const dateStr = '2026.07.07';
  const headerSvg = Buffer.from(`<svg width="${W}" height="${totalH}">
    <defs><linearGradient id="acc" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0891B2"/><stop offset="1" stop-color="#10B981"/>
    </linearGradient></defs>
    <text x="${MARGIN}" y="64" font-family=${JSON.stringify(FONT)} font-size="34" font-weight="900" fill="url(#acc)" letter-spacing="1">BOOIN</text>
    <text x="${MARGIN + 128}" y="64" font-family=${JSON.stringify(FONT)} font-size="26" font-weight="700" fill="#94A3B8" letter-spacing="6">NEWS TOON</text>
    <text x="${W - MARGIN}" y="64" text-anchor="end" font-family=${JSON.stringify(FONT)} font-size="20" fill="#64748B">${dateStr} · ${esc(EP.category)}</text>
    <text x="${MARGIN}" y="122" font-family=${JSON.stringify(FONT)} font-size="42" font-weight="900" fill="#F8FAFC">${esc(EP.title)}</text>
    <text x="${MARGIN}" y="158" font-family=${JSON.stringify(FONT)} font-size="21" fill="#94A3B8">${esc(EP.subtitle)}</text>
    <rect x="${MARGIN}" y="${HEADER_H - 14}" width="${PANEL_W}" height="4" rx="2" fill="url(#acc)"/>
    <text x="${W / 2}" y="${totalH - 38}" text-anchor="middle" font-family=${JSON.stringify(FONT)} font-size="19" fill="#64748B">ⓒ BOOIN 부동산인 · AI 포토툰 · 무단 전재 금지</text>
  </svg>`);

  // 배치: 1행(컷1,컷2), 2행(컷3,컷4), 3행(컷5,컷6) — 좌→우, 위→아래
  const composites = [{ input: headerSvg, top: 0, left: 0 }];
  cells.forEach((buf, i) => {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    composites.push({
      input: buf,
      top: HEADER_H + row * (CELL_H + GAP),
      left: MARGIN + col * (CELL_W + GAP),
    });
  });

  const outDir = join(__dirname, '..', '.toon-out');
  mkdirSync(outDir, { recursive: true });
  const masterPath = join(outDir, `${EP.slug}-grid.jpg`);
  await sharp({ create: { width: W, height: totalH, channels: 3, background: BG } })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toFile(masterPath);
  console.log('그리드 합성 완료:', masterPath, `(${W}x${totalH})`);

  // 3) 그리드 마스터 업로드 (항상 새 파일명 — 기존 이미지 절대 삭제 금지)
  const stamp = Date.now();
  const up = async (local, remote) => {
    const { error } = await supabase.storage
      .from('ai-photos')
      .upload(remote, readFileSync(local), { contentType: 'image/jpeg', upsert: false });
    if (error) throw new Error(`upload ${remote}: ${error.message}`);
    return supabase.storage.from('ai-photos').getPublicUrl(remote).data.publicUrl;
  };
  const toon_image_url = await up(masterPath, `toon-images/${EP.slug}-grid-${stamp}.jpg`);
  console.log('업로드 완료:', toon_image_url);

  // 4) slug로 기존 에피소드 조회 → 있으면 update(toon_image_url만), 없으면 insert
  const { data: existing, error: findErr } = await supabase
    .from('news_toon_episodes')
    .select('id, slug, status')
    .eq('slug', EP.slug)
    .maybeSingle();
  if (findErr) throw new Error(`find: ${findErr.message}`);

  if (existing) {
    // 기존 row 갱신: toon_image_url만 교체 (thumbnail_url·기타 필드·이전 스토리지 파일 보존)
    const { data, error } = await supabase
      .from('news_toon_episodes')
      .update({ toon_image_url })
      .eq('id', existing.id)
      .select('id, episode_number, slug, status, toon_image_url');
    if (error) throw new Error(`update: ${error.message}`);
    console.log(`에피소드 업데이트 (updated rows ${data.length}):`, JSON.stringify(data[0]));
  } else {
    // 신규 draft 등록 (썸네일 포함)
    const thumbPath = join(outDir, `${EP.slug}-thumb.jpg`);
    await sharp(CUTS[0].file).resize(800).jpeg({ quality: 88 }).toFile(thumbPath);
    const thumbnail_url = await up(thumbPath, `toon-images/${EP.slug}-thumb-${stamp}.jpg`);
    const { data, error } = await supabase
      .from('news_toon_episodes')
      .insert({
        title: EP.title,
        subtitle: EP.subtitle,
        slug: EP.slug,
        source_news_title: EP.source_news_title,
        category: EP.category,
        article_html: ARTICLE_HTML,
        article_summary: EP.article_summary,
        panels: CUTS.map((c, i) => ({ panel: i + 1, scene: c.scene, dialogue: c.dialogue })),
        toon_image_url,
        thumbnail_url,
        status: 'draft',
      })
      .select('id, episode_number, slug, status')
      .single();
    if (error) throw new Error(`insert: ${error.message}`);
    console.log('에피소드 draft 등록:', JSON.stringify(data));
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
