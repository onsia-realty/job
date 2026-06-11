/**
 * 단지 좌표 일회성 대량 백필 스크립트 (로컬 실행 전용)
 *
 * price_transactions 전체를 스캔해 complexes에 좌표가 없는 모든 단지를
 * NCP Naver Geocoding(우선) → VWorld(도로명→지번) 순으로 지오코딩 후 upsert.
 * 로컬(한국 IP)에서는 VWorld도 정상 동작하므로 Vercel cron보다 성공률 높음.
 *
 * 사용법:
 *   node scripts/backfill-geocode.mjs            # 미백필 전체 (신규 + lat=null 재시도)
 *   node scripts/backfill-geocode.mjs --dry-run  # 후보 수만 집계
 *   node scripts/backfill-geocode.mjs --limit=500
 *
 * 200건 단위로 upsert하므로 중단해도 재실행 시 이어서 진행됨.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── env 로드 ──
function loadEnv() {
  const envPath = join(__dirname, '..', '.env.local');
  const content = readFileSync(envPath, 'utf-8');
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
const NCP_ID = env.NAVER_GEOCODE_CLIENT_ID || '';
const NCP_SECRET = env.NAVER_GEOCODE_CLIENT_SECRET || '';
const VWORLD_KEY = env.VWORLD_API_KEY || env.NEXT_PUBLIC_VWORLD_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요 (.env.local)');
  process.exit(1);
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
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
    throw new Error(`REST ${path} -> ${res.status}: ${body.slice(0, 200)}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── 지오코딩 (src/lib/market/complexes.ts와 동일 로직) ──
async function geocodeNaver(address) {
  if (!NCP_ID || !NCP_SECRET) return { point: null, status: 'NO_KEY' };
  const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'x-ncp-apigw-api-key-id': NCP_ID, 'x-ncp-apigw-api-key': NCP_SECRET, Accept: 'application/json' },
      });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      if (!res.ok) return { point: null, status: `HTTP_${res.status}` };
      const data = await res.json();
      if ((data?.meta?.totalCount ?? 0) > 0 && data.addresses?.[0]) {
        const a = data.addresses[0];
        return { point: { lat: parseFloat(a.y), lng: parseFloat(a.x), source: 'naver' }, status: 'OK' };
      }
      return { point: null, status: 'total=0' };
    } catch (e) {
      if (attempt === 1) return { point: null, status: `EXCEPTION:${String(e.message).slice(0, 40)}` };
    }
  }
  return { point: null, status: 'RETRY_EXHAUSTED' };
}

async function geocodeVworld(address, type) {
  if (!VWORLD_KEY) return { point: null, status: 'NO_KEY' };
  const url =
    `https://api.vworld.kr/req/address?service=address&request=getcoord` +
    `&address=${encodeURIComponent(address)}&type=${type}&format=json&key=${VWORLD_KEY}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      });
      if (!res.ok) {
        if (res.status >= 500) continue;
        return { point: null, status: `HTTP_${res.status}` };
      }
      const data = await res.json();
      if (data.response?.result?.point) {
        return {
          point: {
            lat: parseFloat(data.response.result.point.y),
            lng: parseFloat(data.response.result.point.x),
            source: type === 'road' ? 'vworld_road' : 'vworld_parcel',
          },
          status: 'OK',
        };
      }
      return { point: null, status: data?.response?.status || 'NOT_FOUND' };
    } catch {
      // retry
    }
  }
  return { point: null, status: 'RETRY_EXHAUSTED' };
}

async function geocode(address) {
  if (!address || !address.trim()) return { point: null, status: 'EMPTY_ADDRESS' };
  const naver = await geocodeNaver(address);
  if (naver.point) return naver;
  const road = await geocodeVworld(address, 'road');
  if (road.point) return road;
  const parcel = await geocodeVworld(address, 'parcel');
  if (parcel.point) return parcel;
  return { point: null, status: `naver=${naver.status} road=${road.status} parcel=${parcel.status}` };
}

function buildAddress({ sido, sigungu, dong, jibun }) {
  return [sido, sigungu, dong, jibun].filter(Boolean).join(' ').trim();
}

// ── 메인 ──
async function main() {
  console.log('1) region_codes 로드...');
  const regions = await rest('region_codes?select=lawd_cd,sido,sigungu&order=lawd_cd');
  const regionByLawd = new Map(regions.map((r) => [r.lawd_cd, r]));
  console.log(`   ${regions.length}개 지역`);

  console.log('2) complexes 기존 행 로드...');
  const existingKeys = new Set();
  const retryPool = []; // lat=null 재시도 (jibun_address 보유분)
  for (let offset = 0; ; offset += 1000) {
    const rows = await rest(
      `complexes?select=complex_key,complex_name,sigungu_cd,property_type,jibun_address,lat&order=complex_key&limit=1000&offset=${offset}`,
    );
    for (const r of rows) {
      existingKeys.add(r.complex_key);
      if (r.lat == null && r.jibun_address) {
        retryPool.push({
          complex_key: r.complex_key,
          complex_name: r.complex_name,
          lawd_cd: r.sigungu_cd,
          property_type: r.property_type,
          address: r.jibun_address,
        });
      }
    }
    if (rows.length < 1000) break;
  }
  console.log(`   기존 ${existingKeys.size}개 (lat=null 재시도 대상 ${retryPool.length}개)`);

  console.log('3) price_transactions 전체 스캔 (신규 단지 발굴)...');
  const discovered = new Map();
  let lastId = 0;
  let scanned = 0;
  for (;;) {
    const rows = await rest(
      `price_transactions?select=id,complex_key,complex_name,lawd_cd,dong,jibun,property_type&id=gt.${lastId}&order=id.asc&limit=1000`,
    );
    if (!rows || rows.length === 0) break;
    lastId = rows[rows.length - 1].id;
    scanned += rows.length;
    for (const t of rows) {
      if (existingKeys.has(t.complex_key) || discovered.has(t.complex_key)) continue;
      const region = regionByLawd.get(t.lawd_cd);
      discovered.set(t.complex_key, {
        complex_key: t.complex_key,
        complex_name: t.complex_name,
        lawd_cd: t.lawd_cd,
        property_type: t.property_type,
        address: buildAddress({ sido: region?.sido, sigungu: region?.sigungu, dong: t.dong, jibun: t.jibun }),
      });
    }
    if (scanned % 20000 < 1000) console.log(`   ...${scanned}행 스캔, 신규 ${discovered.size}개`);
    if (rows.length < 1000) break;
  }
  console.log(`   스캔 완료: ${scanned}행, 신규 단지 ${discovered.size}개`);

  let candidates = [...discovered.values(), ...retryPool].slice(0, LIMIT);
  console.log(`4) 지오코딩 대상: ${candidates.length}개 (신규 ${Math.min(discovered.size, LIMIT)} + 재시도 ${candidates.length - Math.min(discovered.size, LIMIT)})`);

  if (DRY_RUN) {
    const byLawd = {};
    for (const c of candidates) byLawd[c.lawd_cd] = (byLawd[c.lawd_cd] || 0) + 1;
    console.log('   지역별:', JSON.stringify(byLawd, null, 2));
    return;
  }

  console.log('5) 지오코딩 시작 (동시 4, 200건 단위 upsert)...');
  const stats = { geocoded: 0, failed: 0, upserted: 0, bySource: {}, failSamples: [] };
  const CHUNK = 200;
  const started = Date.now();

  for (let ci = 0; ci < candidates.length; ci += CHUNK) {
    const chunk = candidates.slice(ci, ci + CHUNK);
    const results = [];
    let cursor = 0;
    await Promise.all(
      Array.from({ length: 4 }, async () => {
        while (cursor < chunk.length) {
          const c = chunk[cursor++];
          const { point, status } = await geocode(c.address);
          if (point) {
            stats.geocoded++;
            stats.bySource[point.source] = (stats.bySource[point.source] || 0) + 1;
          } else {
            stats.failed++;
            if (stats.failSamples.length < 20) stats.failSamples.push({ key: c.complex_key, address: c.address, status });
          }
          results.push({
            complex_key: c.complex_key,
            complex_name: c.complex_name,
            lat: point?.lat ?? null,
            lng: point?.lng ?? null,
            road_address: null,
            jibun_address: c.address,
            sigungu_cd: c.lawd_cd,
            property_type: c.property_type,
            geocode_source: point ? point.source : null,
            geocoded_at: new Date().toISOString(),
          });
        }
      }),
    );

    await rest('complexes?on_conflict=complex_key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(results),
    });
    stats.upserted += results.length;

    const done = ci + chunk.length;
    const elapsed = ((Date.now() - started) / 1000).toFixed(0);
    const rate = (done / Math.max(1, (Date.now() - started) / 1000)).toFixed(1);
    console.log(
      `   ${done}/${candidates.length} (${elapsed}s, ${rate}/s) 성공 ${stats.geocoded} 실패 ${stats.failed}`,
    );
  }

  console.log('\n── 완료 ──');
  console.log(`성공 ${stats.geocoded} / 실패 ${stats.failed} / upsert ${stats.upserted}`);
  console.log('출처별:', JSON.stringify(stats.bySource));
  if (stats.failSamples.length) {
    console.log('실패 샘플:');
    for (const f of stats.failSamples) console.log(`  - [${f.key}] "${f.address}" → ${f.status}`);
  }
}

main().catch((e) => {
  console.error('백필 실패:', e);
  process.exit(1);
});
