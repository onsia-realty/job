// Runs the REAL project code (publicApi + realEstate) locally
// so we confirm the fix end-to-end before redeploying.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const envPath = resolve(process.cwd(), '.env.local');
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

// Use tsx loader to import .ts files directly
try {
  register('tsx/esm', pathToFileURL('./'));
} catch {
  // fallback: user may not have tsx installed — surface a helpful error
}

const { fetchApartmentTrades, fetchApartmentRents, fetchOfficetelTrades, fetchOfficetelRents } =
  await import('../src/lib/market/realEstate.ts');

const KEY = process.env.DATA_GO_KR_API_KEY;
const LAWD_CD = '11680';
const YM = '202602';

console.log(`=== fetchApartmentTrades(${LAWD_CD}, ${YM}) ===`);
const aptT = await fetchApartmentTrades(LAWD_CD, YM, KEY);
console.log(`length: ${aptT.length}`);
console.log(`first: ${JSON.stringify(aptT[0], null, 2)}`);

console.log(`\n=== fetchApartmentRents(${LAWD_CD}, ${YM}) ===`);
const aptR = await fetchApartmentRents(LAWD_CD, YM, KEY);
console.log(`length: ${aptR.length}`);
console.log(`first: ${JSON.stringify(aptR[0], null, 2)}`);

console.log(`\n=== fetchOfficetelTrades(${LAWD_CD}, ${YM}) ===`);
const offiT = await fetchOfficetelTrades(LAWD_CD, YM, KEY);
console.log(`length: ${offiT.length}`);
console.log(`first: ${JSON.stringify(offiT[0], null, 2)}`);

console.log(`\n=== fetchOfficetelRents(${LAWD_CD}, ${YM}) ===`);
const offiR = await fetchOfficetelRents(LAWD_CD, YM, KEY);
console.log(`length: ${offiR.length}`);
console.log(`first: ${JSON.stringify(offiR[0], null, 2)}`);
