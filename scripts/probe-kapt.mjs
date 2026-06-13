/**
 * K-apt 정밀 진단: 1613000 기준 오퍼레이션/파라미터 변형 + 정확한 에러코드 캡처.
 * 실행: node scripts/probe-kapt.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
function loadEnv() {
  const txt = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
  const out = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}
const KEY = loadEnv().DATA_GO_KR_API_KEY;
const sk = encodeURIComponent(KEY);

async function hit(label, url) {
  console.log(`\n===== ${label} =====`);
  console.log('  ', url.replace(sk, 'KEY'));
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const text = await res.text();
    console.log('   status:', res.status, '| len:', text.length);
    console.log('  ', text.slice(0, 500).replace(/\n/g, ' '));
  } catch (e) {
    console.log('   ERROR:', e.message);
  }
}

// 후보 provider × 서비스/오퍼레이션 매트릭스
const candidates = [
  // 단지목록 (kaptCode 매핑 소스)
  ['1613000/AptListService3/getSigunguAptList3', 'sigunguCode=11680'],
  ['1611000/AptListService3/getSigunguAptList3', 'sigunguCode=11680'],
  ['1613000/AptListService2/getSigunguAptList', 'sigunguCode=11680'],
  ['1611000/AptListService2/getSigunguAptList', 'sigunguCode=11680'],
  ['1613000/AptListService/getSigunguAptList', 'sigunguCode=11680'],
  // 법정동 변형 (역삼동)
  ['1613000/AptListService3/getLegaldongAptList3', 'bjdCode=1168010100'],
  // 공용관리비 (kaptCode 필요 — 임시 샘플)
  ['1613000/AptManageCostInfoOfHouseholdService/getHsmpCmnuseManageCostInfo', 'kaptCode=A13816002&searchDate=202504'],
  ['1611000/AptManageCostInfoOfHouseholdService/getHsmpCmnuseManageCostInfo', 'kaptCode=A13816002&searchDate=202504'],
];

for (const [path, params] of candidates) {
  await hit(path.split('/').slice(1).join('/') + ` [${path.split('/')[0]}]`,
    `https://apis.data.go.kr/${path}?serviceKey=${sk}&${params}&pageNo=1&numOfRows=3`);
}
