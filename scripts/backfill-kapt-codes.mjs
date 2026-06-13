/**
 * complexes.kapt_code 백필 — K-apt 단지목록(AptListService3)으로 단지명+법정동 매칭.
 *
 * 사전: 028 마이그레이션 적용(complexes.kapt_code 컬럼) — --write 시에만 필요.
 * 사용법:
 *   node scripts/backfill-kapt-codes.mjs                 # 강남(11680) dry-run (기본)
 *   node scripts/backfill-kapt-codes.mjs --sigungu=11650 # 다른 구
 *   node scripts/backfill-kapt-codes.mjs --all           # 전국 (시군구 자동 발굴)
 *   node scripts/backfill-kapt-codes.mjs --write         # 실제 UPDATE (028 필요)
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()]),
);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = env.DATA_GO_KR_API_KEY;
if (!SUPABASE_URL || !SERVICE_KEY || !API_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATA_GO_KR_API_KEY 필요');
  process.exit(1);
}

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const ALL = args.includes('--all');
const sigArg = args.find((a) => a.startsWith('--sigungu='));
const TARGET_SIGUNGU = sigArg ? sigArg.split('=')[1] : '11680';

const sb = (path, opts = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, ...(opts.headers || {}) },
  });

const sk = encodeURIComponent(API_KEY);
const UA = { headers: { 'User-Agent': 'Mozilla/5.0' } };

const BRANDS = [
  ["i'park", '아이파크'], ['ipark', '아이파크'], ['e-편한세상', '이편한세상'],
  ['e편한세상', '이편한세상'], ['xi', '자이'], ['the#', '더샵'], ['thesharp', '더샵'],
  ['the sharp', '더샵'], ['sk view', '에스케이뷰'], ['skview', '에스케이뷰'],
  ['sk뷰', '에스케이뷰'], ['lg', '엘지'], ['gs', '지에스'],
];
/** 단지명 정규화 — 괄호/동범위 제거, 영문브랜드 변환, 공백/접미사 제거 */
function norm(name) {
  let s = (name || '').normalize('NFC').toLowerCase();
  s = s.replace(/\(.*?\)/g, '');           // (208~211동) 등 괄호 제거
  s = s.replace(/[~∼].*$/, '');            // 동범위 ~ 이후 제거
  for (const [k, v] of BRANDS) s = s.split(k).join(v);
  s = s.replace(/\s+/g, '');
  s = s.replace(/아파트|맨션|@/g, '');
  s = s.replace(/[^가-힣0-9a-z]/g, '');
  return s;
}
/** 차수 토큰 제거(순서 차이 흡수용): 도곡2차아이파크 ↔ 도곡아이파크2차 */
function stripCha(n) {
  return n.replace(/\d+차/g, '');
}

async function fetchKaptSigungu(sigunguCode) {
  const url = `https://apis.data.go.kr/1613000/AptListService3/getSigunguAptList3?serviceKey=${sk}&sigunguCode=${sigunguCode}&pageNo=1&numOfRows=10000&_type=json`;
  const r = await fetch(url, UA);
  const j = JSON.parse(await r.text());
  return j?.response?.body?.items || [];
}

async function readComplexes(sigunguCode) {
  // PostgREST 페이지네이션 (1000행 캡)
  const out = [];
  for (let from = 0; ; from += 1000) {
    const r = await sb(
      `complexes?select=complex_key,complex_name,sigungu_cd,bjdong_cd&sigungu_cd=eq.${sigunguCode}`,
      { headers: { Range: `${from}-${from + 999}` } },
    );
    const rows = await r.json();
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

async function processSigungu(sigunguCode) {
  const [kapt, complexes] = await Promise.all([
    fetchKaptSigungu(sigunguCode),
    readComplexes(sigunguCode),
  ]);

  // K-apt 인덱스 (bjdCode 단위)
  const byBjdName = new Map();   // "bjd|norm" → kaptCode (정확)
  const byBjdCha = new Map();    // "bjd|stripCha(norm)" → kaptCode
  const byName = new Map();      // norm → kaptCode (전역 fallback)
  const kaptByBjd = new Map();   // bjd → [{n, code, name}] (포함매칭용)
  for (const it of kapt) {
    const n = norm(it.kaptName);
    byBjdName.set(`${it.bjdCode}|${n}`, it.kaptCode);
    const ch = stripCha(n);
    if (ch && ch !== n && !byBjdCha.has(`${it.bjdCode}|${ch}`)) byBjdCha.set(`${it.bjdCode}|${ch}`, it.kaptCode);
    if (!byName.has(n)) byName.set(n, it.kaptCode);
    if (!kaptByBjd.has(it.bjdCode)) kaptByBjd.set(it.bjdCode, []);
    kaptByBjd.get(it.bjdCode).push({ n, code: it.kaptCode, name: it.kaptName });
  }

  let matched = 0;
  const updates = [];
  const misses = [];
  const matchedCodes = new Set();
  for (const c of complexes) {
    const bjd = `${c.sigungu_cd}${c.bjdong_cd}`;
    const n = norm(c.complex_name);
    let code = byBjdName.get(`${bjd}|${n}`) || byBjdCha.get(`${bjd}|${stripCha(n)}`) || null;
    // 같은 법정동 내 포함매칭 (한쪽이 다른쪽을 포함, 4자+, 유일할 때만)
    if (!code && n.length >= 4) {
      const cands = (kaptByBjd.get(bjd) || []).filter((k) => k.n.includes(n) || n.includes(k.n));
      if (cands.length === 1) code = cands[0].code;
    }
    if (!code) code = byName.get(n) || null;
    if (code) {
      matched++;
      matchedCodes.add(code);
      updates.push({ complex_key: c.complex_key, kapt_code: code });
    } else {
      misses.push(c.complex_name);
    }
  }

  return {
    sigunguCode, kaptCount: kapt.length, complexCount: complexes.length,
    matched, kaptCovered: matchedCodes.size, updates, misses,
  };
}

async function writeUpdates(updates) {
  let ok = 0;
  for (let i = 0; i < updates.length; i += 100) {
    const chunk = updates.slice(i, i + 100);
    await Promise.all(
      chunk.map((u) =>
        sb(`complexes?complex_key=eq.${encodeURIComponent(u.complex_key)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ kapt_code: u.kapt_code }),
        }).then((r) => { if (r.ok) ok++; }),
      ),
    );
  }
  return ok;
}

async function main() {
  let targets = [TARGET_SIGUNGU];
  if (ALL) {
    const r = await sb('complexes?select=sigungu_cd');
    const rows = await r.json();
    targets = [...new Set(rows.map((x) => x.sigungu_cd).filter(Boolean))].sort();
  }
  console.log(`모드: ${WRITE ? 'WRITE' : 'DRY-RUN'} | 대상 시군구: ${targets.length}개\n`);

  let totMatched = 0, totComplex = 0;
  for (const sg of targets) {
    const res = await processSigungu(sg);
    const pct = res.complexCount ? ((res.matched / res.complexCount) * 100).toFixed(1) : '0';
    const kpct = res.kaptCount ? ((res.kaptCovered / res.kaptCount) * 100).toFixed(1) : '0';
    console.log(`[${sg}] K-apt ${res.kaptCount} | complexes ${res.complexCount} | 매칭 ${res.matched} (${pct}%) | K-apt커버 ${res.kaptCovered}/${res.kaptCount} (${kpct}%)`);
    if (!ALL && res.misses.length) {
      console.log(`   미매칭 샘플(${res.misses.length}): ${res.misses.slice(0, 25).join(', ')}`);
    }
    if (WRITE && res.updates.length) {
      const ok = await writeUpdates(res.updates);
      console.log(`   → UPDATE ${ok}/${res.updates.length}`);
    }
    totMatched += res.matched;
    totComplex += res.complexCount;
  }
  console.log(`\n총 매칭: ${totMatched}/${totComplex} (${totComplex ? ((totMatched / totComplex) * 100).toFixed(1) : 0}%)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
