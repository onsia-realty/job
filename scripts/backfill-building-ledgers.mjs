/**
 * 건축물대장 백필 스크립트 (로컬 실행 전용)
 *
 * 1단계: complexes.pnu 백필 — VWorld 주소 API의 level4LC(표준 PNU 19자리) 사용
 * 2단계: 로컬 dev 서버의 /api/cron/sync-building-ledgers를 반복 호출해
 *        건축물대장 수집 + complexes 메타(세대수/연식/층수) 역반영
 *
 * 사전 조건: `npm run dev` 실행 중 (2단계가 localhost:3000 호출)
 *
 * 사용법:
 *   node scripts/backfill-building-ledgers.mjs            # 전체
 *   node scripts/backfill-building-ledgers.mjs --pnu-only # 1단계만
 *   node scripts/backfill-building-ledgers.mjs --ledger-only
 *   node scripts/backfill-building-ledgers.mjs --limit=500
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const content = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const VWORLD_KEY = env.VWORLD_API_KEY || env.NEXT_PUBLIC_VWORLD_KEY;
const CRON_SECRET = env.CRON_SECRET;

if (!SUPABASE_URL || !SERVICE_KEY || !VWORLD_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / VWORLD_API_KEY 필요');
  process.exit(1);
}

const args = process.argv.slice(2);
const PNU_ONLY = args.includes('--pnu-only');
const LEDGER_ONLY = args.includes('--ledger-only');
const LIMIT = (() => {
  const m = args.find((a) => a.startsWith('--limit='));
  return m ? parseInt(m.split('=')[1], 10) : Infinity;
})();

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function rest(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: { ...HEADERS, ...(opts.headers || {}) } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`REST ${path.slice(0, 80)} -> ${res.status}: ${body.slice(0, 200)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// VWorld 주소 → 표준 PNU 19자리 (refined.structure.level4LC)
async function pnuFromAddress(address) {
  const url =
    `https://api.vworld.kr/req/address?service=address&request=getcoord` +
    `&address=${encodeURIComponent(address)}&type=parcel&format=json&key=${VWORLD_KEY}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 600 * attempt));
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      });
      if (!res.ok) {
        if (res.status >= 500) continue;
        return null;
      }
      const data = await res.json();
      const lc = data?.response?.refined?.structure?.level4LC;
      if (lc && /^\d{19}$/.test(lc)) return lc;
      return null;
    } catch {
      // retry
    }
  }
  return null;
}

async function fillPnu() {
  console.log('1) pnu 미백필 단지 로드 (jibun_address 보유분)...');
  const targets = [];
  let cursor = '';
  for (;;) {
    const rows = await rest(
      `complexes?select=complex_key,jibun_address&pnu=is.null&jibun_address=not.is.null` +
      `&complex_key=gt.${encodeURIComponent(cursor)}&order=complex_key.asc&limit=1000`,
    );
    if (!rows || rows.length === 0) break;
    cursor = rows[rows.length - 1].complex_key;
    for (const r of rows) {
      if (r.jibun_address && r.jibun_address.trim() && !r.jibun_address.includes('가-')) targets.push(r);
    }
    if (rows.length < 1000) break;
  }
  const work = targets.slice(0, LIMIT);
  console.log(`   대상 ${targets.length}개 (이번 실행 ${work.length}개)`);

  let ok = 0;
  let fail = 0;
  const started = Date.now();
  const CHUNK = 200;
  for (let ci = 0; ci < work.length; ci += CHUNK) {
    const chunk = work.slice(ci, ci + CHUNK);
    const results = [];
    let idx = 0;
    await Promise.all(
      Array.from({ length: 3 }, async () => {
        while (idx < chunk.length) {
          const c = chunk[idx++];
          const pnu = await pnuFromAddress(c.jibun_address);
          if (pnu) {
            results.push({ complex_key: c.complex_key, pnu });
            ok++;
          } else {
            fail++;
          }
        }
      }),
    );
    // 개별 PATCH 대신 키별 업데이트 (pnu만 갱신 — upsert로 다른 컬럼 덮지 않게)
    for (const r of results) {
      await rest(`complexes?complex_key=eq.${encodeURIComponent(r.complex_key)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ pnu: r.pnu }),
      });
    }
    const done = ci + chunk.length;
    const elapsed = ((Date.now() - started) / 1000).toFixed(0);
    console.log(`   ${done}/${work.length} (${elapsed}s) pnu 성공 ${ok} 실패 ${fail}`);
  }
  console.log(`   pnu 백필 완료: 성공 ${ok} / 실패 ${fail}`);
}

async function fillLedgers() {
  if (!CRON_SECRET) {
    console.error('CRON_SECRET 없음 — 2단계 생략');
    return;
  }
  console.log('2) 건축물대장 수집 (localhost:3000 cron 반복 호출)...');
  let round = 0;
  let totalOk = 0;
  for (;;) {
    round++;
    let data;
    try {
      const res = await fetch('http://localhost:3000/api/cron/sync-building-ledgers?limit=300', {
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
        signal: AbortSignal.timeout(290000),
      });
      data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data).slice(0, 200));
    } catch (e) {
      console.error(`   round ${round} 실패: ${e.message} — dev 서버 실행 중인지 확인`);
      break;
    }
    const s = data.summary || {};
    totalOk += s.succeeded || 0;
    console.log(
      `   round ${round}: 대상 ${s.to_fetch} 성공 ${s.succeeded} 미발견 ${s.not_found} 에러 ${(s.errors || []).length} (${Math.round((s.elapsed_ms || 0) / 1000)}s)`,
    );
    if ((s.errors || []).length > 0 && round === 1) console.log('   에러 샘플:', (s.errors || []).slice(0, 3));
    if (!s.to_fetch || s.to_fetch === 0) break;
    // 일일 쿼터 소진 신호: 전부 에러면 중단
    if (s.succeeded === 0 && s.not_found === 0 && (s.errors || []).length > 0) {
      console.log('   전건 에러 — API 쿼터 소진 가능성. 중단 (내일 재실행 시 이어서 진행됨)');
      break;
    }
  }
  console.log(`   건축물대장 수집 누적 성공: ${totalOk}`);
}

async function main() {
  if (!LEDGER_ONLY) await fillPnu();
  if (!PNU_ONLY) await fillLedgers();
  console.log('완료');
}

main().catch((e) => {
  console.error('실패:', e);
  process.exit(1);
});
