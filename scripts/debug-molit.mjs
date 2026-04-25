// MOLIT API raw response debugger
// usage: node scripts/debug-molit.mjs

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// load .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const envText = readFileSync(envPath, 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const KEY = process.env.DATA_GO_KR_API_KEY;
if (!KEY) {
  console.error('DATA_GO_KR_API_KEY not set');
  process.exit(1);
}

const endpoints = [
  { name: 'APT_TRADE', url: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev' },
  { name: 'APT_RENT', url: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent' },
  { name: 'OFFI_TRADE', url: 'https://apis.data.go.kr/1613000/RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade' },
  { name: 'OFFI_RENT', url: 'https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent' },
];

const LAWD_CD = '11680'; // 강남구
const DEAL_YMD = '202602';

console.log(`key length: ${KEY.length}, first 10: ${KEY.slice(0, 10)}..., last 4: ${KEY.slice(-4)}`);
console.log(`target: LAWD_CD=${LAWD_CD}, DEAL_YMD=${DEAL_YMD}\n`);

for (const ep of endpoints) {
  const url = new URL(ep.url);
  url.searchParams.set('serviceKey', KEY);
  url.searchParams.set('LAWD_CD', LAWD_CD);
  url.searchParams.set('DEAL_YMD', DEAL_YMD);
  url.searchParams.set('numOfRows', '3');
  url.searchParams.set('pageNo', '1');

  console.log(`--- ${ep.name} ---`);
  console.log(`URL: ${url.toString().slice(0, 150)}...`);
  try {
    const res = await fetch(url.toString());
    console.log(`HTTP: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`BODY (first 1500 chars):`);
    console.log(text.slice(0, 1500));
    console.log(`\n(total length: ${text.length})\n`);
  } catch (e) {
    console.log(`FETCH ERROR:`, e.message);
  }
  console.log('');
}
