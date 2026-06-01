/**
 * 로컬 단지 좌표 백필 스크립트 (VWorld geocoding)
 *
 * 배경: Vercel(미국 리전) → VWorld(한국 정부 서버) 호출이 502/fetch failed로 만성 실패.
 *       로컬(한국 IP)에서는 VWorld가 정상 동작하므로, 여기서 일괄 지오코딩 후
 *       Supabase complexes 테이블에 좌표를 직접 채운다.
 *
 * 사용:
 *   node scripts/backfill-complex-coords.mjs            # lat NULL 인 단지 전부
 *   node scripts/backfill-complex-coords.mjs --limit 50 # 50개만 (테스트)
 *   node scripts/backfill-complex-coords.mjs --force     # 좌표 있는 것도 재시도
 *
 * 의존성 없음 (Node 18+ 내장 fetch). .env.local 직접 파싱.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── .env.local 파싱 ──
function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch (e) {
    console.error('.env.local 읽기 실패:', e.message);
    process.exit(1);
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const VWORLD_KEY = env.VWORLD_API_KEY || env.NEXT_PUBLIC_VWORLD_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !VWORLD_KEY) {
  console.error('필수 환경변수 누락:', {
    SUPABASE_URL: !!SUPABASE_URL,
    SERVICE_KEY: !!SERVICE_KEY,
    VWORLD_KEY: !!VWORLD_KEY,
  });
  process.exit(1);
}

// ── CLI 인자 ──
const args = process.argv.slice(2);
const getArg = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const LIMIT = parseInt(getArg('--limit', '0'), 10) || 0; // 0 = 전부
const FORCE = args.includes('--force');
const CONCURRENCY = parseInt(getArg('--concurrency', '6'), 10) || 6;

// sigungu_cd(앞 2자리) → 시도명. jibun_address에 시도 접두어가 없으면 보강.
// VWorld는 sido prefix가 빠지면 짧은 지번 단지를 매칭 못 함 (complexes.ts 주석 참조).
const SIDO_BY_CODE = {
  '11': '서울특별시', '26': '부산광역시', '27': '대구광역시', '28': '인천광역시',
  '29': '광주광역시', '30': '대전광역시', '31': '울산광역시', '36': '세종특별자치시',
  '41': '경기도', '42': '강원특별자치도', '43': '충청북도', '44': '충청남도',
  '45': '전라북도', '46': '전라남도', '47': '경상북도', '48': '경상남도',
  '50': '제주특별자치도', '51': '강원특별자치도', '52': '전북특별자치도',
};
const SIDO_NAMES = new Set(Object.values(SIDO_BY_CODE));

function ensureSido(address, sigungu_cd) {
  const addr = (address || '').trim();
  if (!addr) return addr;
  const firstToken = addr.split(/\s+/)[0];
  // 이미 시도로 시작하면 그대로
  if (SIDO_NAMES.has(firstToken) || firstToken.endsWith('특별시') || firstToken.endsWith('광역시')) {
    return addr;
  }
  const sido = SIDO_BY_CODE[(sigungu_cd || '').slice(0, 2)];
  return sido ? `${sido} ${addr}` : addr;
}

// ── Supabase REST 헬퍼 ──
const sb = (path, opts = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });

// ── VWorld geocode (도로명 우선 → 지번 fallback, 재시도 3회) ──
async function geocode(address) {
  const tryType = async (type) => {
    const url =
      `https://api.vworld.kr/req/address?service=address&request=getcoord` +
      `&address=${encodeURIComponent(address)}&type=${type}&format=json&key=${VWORLD_KEY}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await sleep(400 * 2 ** (attempt - 1));
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
        const pt = data?.response?.result?.point;
        if (pt) return { lat: parseFloat(pt.y), lng: parseFloat(pt.x), source: type };
        return null; // 정상 응답이나 결과 없음 → 재시도 무의미
      } catch {
        // 네트워크 예외 → 재시도
      }
    }
    return null;
  };
  return (await tryType('parcel')) || (await tryType('road'));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 대상 단지 로드 (페이지네이션) ──
async function loadTargets() {
  const all = [];
  const PAGE = 1000;
  let from = 0;
  const filter = FORCE ? '' : '&lat=is.null';
  for (;;) {
    const res = await sb(
      `complexes?select=complex_key,complex_name,jibun_address,road_address,sigungu_cd${filter}&order=complex_key&limit=${PAGE}&offset=${from}`,
    );
    if (!res.ok) {
      console.error('대상 로드 실패:', res.status, await res.text());
      process.exit(1);
    }
    const rows = await res.json();
    all.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
    if (LIMIT && all.length >= LIMIT) break;
  }
  return LIMIT ? all.slice(0, LIMIT) : all;
}

// ── 좌표 update ──
async function updateCoord(complex_key, lat, lng, source) {
  const res = await sb(`complexes?complex_key=eq.${encodeURIComponent(complex_key)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      lat,
      lng,
      geocode_source: `vworld_${source}`,
      geocoded_at: new Date().toISOString(),
    }),
  });
  return res.ok;
}

// ── 메인 ──
async function main() {
  console.log(`[backfill] 대상 로드 중... (force=${FORCE}, limit=${LIMIT || '전부'})`);
  const targets = await loadTargets();
  console.log(`[backfill] 대상 단지: ${targets.length}개`);
  if (targets.length === 0) {
    console.log('[backfill] 처리할 단지 없음. 종료.');
    return;
  }

  const stats = { ok: 0, fail: 0, noaddr: 0, updateFail: 0 };
  const failedSamples = [];
  let cursor = 0;
  const started = Date.now();

  const worker = async (wid) => {
    while (cursor < targets.length) {
      const idx = cursor++;
      const c = targets[idx];
      const rawAddress = (c.jibun_address || c.road_address || '').trim();
      const address = ensureSido(rawAddress, c.sigungu_cd);
      if (!address) {
        stats.noaddr++;
        continue;
      }
      const pt = await geocode(address);
      if (!pt) {
        stats.fail++;
        if (failedSamples.length < 10) failedSamples.push(`${c.complex_name} / ${address}`);
      } else {
        const updated = await updateCoord(c.complex_key, pt.lat, pt.lng, pt.source);
        if (updated) stats.ok++;
        else { stats.updateFail++; if (failedSamples.length < 10) failedSamples.push(`UPDATE_FAIL: ${c.complex_key}`); }
      }
      const done = stats.ok + stats.fail + stats.noaddr + stats.updateFail;
      if (done % 50 === 0 || done === targets.length) {
        const pct = ((done / targets.length) * 100).toFixed(1);
        const eta = ((Date.now() - started) / done) * (targets.length - done);
        console.log(
          `[backfill] ${done}/${targets.length} (${pct}%) ok=${stats.ok} fail=${stats.fail} noaddr=${stats.noaddr} | ETA ${(eta / 1000 / 60).toFixed(1)}분`,
        );
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));

  const elapsed = ((Date.now() - started) / 1000 / 60).toFixed(1);
  console.log('\n========== 백필 완료 ==========');
  console.log(`성공(좌표 채움): ${stats.ok}`);
  console.log(`지오코딩 실패:   ${stats.fail}`);
  console.log(`주소 없음:       ${stats.noaddr}`);
  console.log(`update 실패:     ${stats.updateFail}`);
  console.log(`소요 시간:       ${elapsed}분`);
  if (failedSamples.length > 0) {
    console.log('\n실패 샘플:');
    failedSamples.forEach((s) => console.log('  -', s));
  }
}

main().catch((e) => {
  console.error('치명적 오류:', e);
  process.exit(1);
});
