/**
 * apt_mgmt_costs 백필 — K-apt 공용관리비(17) + 개별사용료(10) + 단지 기본정보(세대수/부과면적).
 *
 * 사전: 028 적용 + complexes.kapt_code 백필(backfill-kapt-codes.mjs --write).
 * 사용법:
 *   node scripts/backfill-mgmt-costs.mjs                  # 강남(11680), 최근월 1개
 *   node scripts/backfill-mgmt-costs.mjs --month=202601   # 특정 월 1개
 *   node scripts/backfill-mgmt-costs.mjs --months=12      # 최근 12개월 (계절통계용)
 *   node scripts/backfill-mgmt-costs.mjs --sigungu=11650
 *   node scripts/backfill-mgmt-costs.mjs --all            # kapt_code 있는 전 단지
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split(/\r?\n/).map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean)
    .map((m) => [m[1], m[2].trim()]),
);
const SB = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const sk = encodeURIComponent(env.DATA_GO_KR_API_KEY);
if (!SB || !KEY || !env.DATA_GO_KR_API_KEY) { console.error('env 누락'); process.exit(1); }

const args = process.argv.slice(2);
const ALL = args.includes('--all');
const SIGUNGU = (args.find((a) => a.startsWith('--sigungu=')) || '--sigungu=11680').split('=')[1];
const MONTHS_N = parseInt((args.find((a) => a.startsWith('--months=')) || '--months=1').split('=')[1], 10);
const ONE_MONTH = (args.find((a) => a.startsWith('--month=')) || '').split('=')[1] || null;

// 수집 대상 월 목록 (YYYYMM). --month 우선, 없으면 최근 MONTHS_N개월(2개월 지연 반영).
function recentMonths(n) {
  // K-apt는 보통 2개월 지연 공개 → 기준월 = 현재-2
  const now = new Date();
  const out = [];
  for (let i = 2; i < 2 + n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}
const MONTHS = ONE_MONTH ? [ONE_MONTH] : recentMonths(MONTHS_N);

const CMN_BASE = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';
const IND_BASE = 'https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2';
const BASIS_BASE = 'https://apis.data.go.kr/1613000/AptBasisInfoServiceV4';
const UA = { headers: { 'User-Agent': 'Mozilla/5.0' } };

const CMN_OPS = [
  ['getHsmpLaborCostInfoV2', 'cmn_labor'], ['getHsmpTaxdueInfoV2', 'cmn_tax'],
  ['getHsmpVhcleMntncCostInfoV2', 'cmn_vehicle'], ['getHsmpEtcCostInfoV2', 'cmn_etc'],
  ['getHsmpOfcrkCostInfoV2', 'cmn_office'], ['getHsmpClothingCostInfoV2', 'cmn_clothing'],
  ['getHsmpEduTraingCostInfoV2', 'cmn_education'], ['getHsmpCleaningCostInfoV2', 'cmn_cleaning'],
  ['getHsmpGuardCostInfoV2', 'cmn_security'], ['getHsmpDisinfectionCostInfoV2', 'cmn_disinfect'],
  ['getHsmpElevatorMntncCostInfoV2', 'cmn_elevator'], ['getHsmpHomeNetworkMntncCostInfoV2', 'cmn_network'],
  ['getHsmpRepairsCostInfoV2', 'cmn_repair'], ['getHsmpFacilityMntncCostInfoV2', 'cmn_facility'],
  ['getHsmpSafetyCheckUpCostInfoV2', 'cmn_safety'], ['getHsmpDisasterPreventionCostInfoV2', 'cmn_disaster'],
  ['getHsmpConsignManageFeeInfoV2', 'cmn_consign'],
];
// 개별사용료: [op, col, bucket] — bucket 'heat' = 난방비 버킷(난방만), 'etc' = 기타개별
const IND_OPS = [
  ['getHsmpHeatCostInfoV2', 'ind_heat', 'heat'],
  ['getHsmpHotWaterCostInfoV2', 'ind_hotwater', 'etc'],
  ['getHsmpGasRentalFeeInfoV2', 'ind_gas', 'etc'],
  ['getHsmpElectricityCostInfoV2', 'ind_elec', 'etc'],
  ['getHsmpWaterCostInfoV2', 'ind_water', 'etc'],
  ['getHsmpDomesticWasteFeeInfoV2', 'ind_waste', 'etc'],
  ['getHsmpBuildingInsuranceFeeInfoV2', 'ind_insurance', 'etc'],
  ['getHsmpElectionOrpnsInfoV2', 'ind_election', 'etc'],
  ['getHsmpMovingInRepresentationMtgInfoV2', 'ind_repr_council', 'etc'],
  ['getHsmpWaterPurifierTankFeeInfoV2', 'ind_septic', 'etc'],
];

function toNum(v) {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

/** 단일 오퍼레이션 호출 → 식별자 외 전 숫자필드 합 = 항목총액 */
async function fetchOp(base, kaptCode, searchDate, op) {
  const url = `${base}/${op}?serviceKey=${sk}&kaptCode=${kaptCode}&searchDate=${searchDate}&pageNo=1&numOfRows=1&_type=json`;
  try {
    const j = JSON.parse(await (await fetch(url, UA)).text());
    const item = j?.response?.body?.item;
    if (!item) return null;
    let total = 0, any = false;
    for (const [k, v] of Object.entries(item)) {
      if (k === 'kaptCode' || k === 'kaptName') continue;
      const n = toNum(v);
      if (n != null) { total += n; any = true; }
    }
    return any ? total : null;
  } catch { return null; }
}

/** 한 단지·한 달 공용+개별 전체 → apt_mgmt_costs 행 (데이터 없으면 null) */
async function fetchMonthRow(kaptCode, month, area) {
  const [cmnVals, indVals] = await Promise.all([
    Promise.all(CMN_OPS.map(([op]) => fetchOp(CMN_BASE, kaptCode, month, op))),
    Promise.all(IND_OPS.map(([op]) => fetchOp(IND_BASE, kaptCode, month, op))),
  ]);
  const row = { kapt_code: kaptCode, search_date: month };
  let cmnTotal = 0, indTotal = 0, any = false;
  CMN_OPS.forEach(([, col], i) => {
    row[col] = cmnVals[i];
    if (cmnVals[i] != null) { cmnTotal += cmnVals[i]; any = true; }
  });
  IND_OPS.forEach(([, col], i) => {
    row[col] = indVals[i];
    if (indVals[i] != null) { indTotal += indVals[i]; any = true; }
  });
  if (!any) return null;
  row.cmn_total = cmnTotal;
  row.ind_total = indTotal;
  row.total_cost = cmnTotal + indTotal;
  if (area != null) row.area_total = area;
  return row;
}

/** 단지 기본정보 (세대수/부과면적) */
async function fetchBasis(kaptCode) {
  const url = `${BASIS_BASE}/getAphusBassInfoV4?serviceKey=${sk}&kaptCode=${kaptCode}&_type=json`;
  try {
    const j = JSON.parse(await (await fetch(url, UA)).text());
    const item = j?.response?.body?.item;
    if (!item) return null;
    return { hhld: toNum(item.kaptdaCnt), area: toNum(item.kaptMarea), name: item.kaptName };
  } catch { return null; }
}

async function readMapped() {
  const out = [];
  const filt = ALL ? '' : `&sigungu_cd=eq.${SIGUNGU}`;
  for (let from = 0; ; from += 1000) {
    const r = await fetch(
      `${SB}/rest/v1/complexes?select=complex_key,complex_name,kapt_code,hhld_cnt&kapt_code=not.is.null${filt}`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Range: `${from}-${from + 999}` } },
    );
    const rows = await r.json();
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

async function upsert(rows) {
  let ok = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const r = await fetch(`${SB}/rest/v1/apt_mgmt_costs?on_conflict=kapt_code,search_date`, {
      method: 'POST',
      headers: {
        apikey: KEY, Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(chunk),
    });
    if (r.ok) ok += chunk.length;
    else console.error('  upsert 실패:', r.status, (await r.text()).slice(0, 200));
  }
  return ok;
}

async function patchHhld(complexKey, hhld) {
  await fetch(`${SB}/rest/v1/complexes?complex_key=eq.${encodeURIComponent(complexKey)}`, {
    method: 'PATCH',
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify({ hhld_cnt: hhld }),
  });
}

async function main() {
  const complexes = await readMapped();
  const uniqKapt = [...new Set(complexes.map((c) => c.kapt_code))];
  console.log(`대상: ${complexes.length}단지(고유 kaptCode ${uniqKapt.length}) | 월 [${MONTHS.join(', ')}]\n`);

  // 1) 기본정보 1회 수집 (세대수/부과면적) — kaptCode 단위
  console.log('① 기본정보(세대수/부과면적) 수집...');
  const basis = new Map();
  for (let i = 0; i < uniqKapt.length; i++) {
    const b = await fetchBasis(uniqKapt[i]);
    if (b) basis.set(uniqKapt[i], b);
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${uniqKapt.length}`);
  }
  console.log(`  기본정보 확보: ${basis.size}/${uniqKapt.length}`);

  // 2) complexes.hhld_cnt 결측 보강
  let patched = 0;
  for (const c of complexes) {
    if (c.hhld_cnt == null) {
      const b = basis.get(c.kapt_code);
      if (b?.hhld != null) { await patchHhld(c.complex_key, b.hhld); patched++; }
    }
  }
  console.log(`  세대수 보강: ${patched}건\n`);

  // 3) 월별 관리비 수집 → upsert
  let grandOk = 0;
  for (const month of MONTHS) {
    const rows = [];
    let withData = 0;
    for (let i = 0; i < uniqKapt.length; i++) {
      const kc = uniqKapt[i];
      const row = await fetchMonthRow(kc, month, basis.get(kc)?.area ?? null);
      if (row) { rows.push(row); withData++; }
      if ((i + 1) % 50 === 0) console.log(`  [${month}] ${i + 1}/${uniqKapt.length} (데이터 ${withData})`);
    }
    const ok = await upsert(rows);
    grandOk += ok;
    console.log(`② [${month}] 수집 ${withData}/${uniqKapt.length} → upsert ${ok}`);
  }
  console.log(`\n완료: 총 upsert ${grandOk}행 (${MONTHS.length}개월)`);

  // 샘플
  const sample = await fetchMonthRow(uniqKapt[0], MONTHS[0], basis.get(uniqKapt[0])?.area ?? null);
  if (sample) {
    const b = basis.get(uniqKapt[0]);
    const per = b?.hhld ? Math.round(sample.total_cost / b.hhld) : null;
    console.log(`\n샘플 ${uniqKapt[0]} ${MONTHS[0]}: 공용 ${sample.cmn_total?.toLocaleString()} + 개별 ${sample.ind_total?.toLocaleString()} = 총 ${sample.total_cost?.toLocaleString()}원` + (per ? ` (세대당 ${per.toLocaleString()}원)` : ''));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
