# 온시아 부동산 데이터 수집 기술 진화사 (2025-07 → 2026-08)

> 작성일: 2026-08-05
> 조사 범위: `onsia-nest`(Vercel), `onsia_DB/naver_map_crawler`(로컬·GitHub), `onsia-job/market`(현행)
> 조사 방법: Vercel 배포 소스 뷰어 직접 열람 + 로컬 저장소 코드 확인

---

## 0. 요약

3년치가 아니라 **13개월 만의 변화**인데, 방식 자체가 두 번 갈아엎어졌다.

```
1세대 (2025-07)  네이버 비공개 API 직접 호출 + UA/Referer 위조 → 정적 JSON 1개
       ↓ 차단 리스크 / 확장 불가
2세대 (2025-09)  undetected-chromedriver 브라우저 자동화 → Excel
       ↓ 손으로 돌려야 함 / 여전히 회색지대
3세대 (2026-05~) 공공데이터 정식 API 11종 + Vercel Cron + Supabase 정규화 DB
```

**핵심 전환**: 업그레이드의 본질은 "봇 우회 능력 향상"이 **아니다**.
오히려 봇 우회 기술(2세대)은 버렸고, **데이터 소스를 합법 트랙으로 옮기고 운영을 자동화**한 것이 본질이다.
네이버는 이제 *긁는 대상*이 아니라 *벤치마킹 대상*이 되었다.

---

## 1. 1세대 — `onsia-nest` (2025-07-17)

### 1.1 프로젝트 정체

| 항목 | 내용 |
|---|---|
| 위치 | 개인 Vercel 계정 `realtors77-7871s-projects` (Hobby 플랜) |
| Git | **미연결** — Settings→Git: "This Project is not connected to a Git repository" |
| 배포 | `vercel deploy` CLI 업로드 10건, **전부 2025-07-17 하루**, 그중 6건 Error |
| 생성 도구 | `package.json` name = **`my-v0-project`** → v0 생성. `.gemini/`, `gemini.md` → Gemini CLI로 작업 |
| 스택 | Next.js App Router + radix/shadcn + **leaflet** + axios |
| 앱 골격 | `app/jobs`, `app/login`, `app/properties`, `app/api/auth` — **현 onsia-job의 원형** |

> ⚠️ 소스는 Vercel 배포 소스 뷰어에만 존재하고, Deployment Retention이 켜져 있어 언젠가 삭제된다.
> 열람 경로: `https://vercel.com/realtors77-7871s-projects/onsia-nest/KTTUTVc4oUXrFwqf44EyNmQxX4Sd/source?f=src%2F<경로>`

### 1.2 크롤링 코드 (`get_gwangjin_data.js` — 전체 25줄)

```js
const axios = require('axios');
const fs = require('fs');

async function getGwangjinRealEstateData() {
  const cortarNo = '11215'; // Gwangjin-gu cortarNo
  const apiUrl = `https://new.land.naver.com/api/complexes/single-markers/2.0?cortarNo=${cortarNo}&zoom=13&priceType=RETAIL&realEstateType=APT%3AABYG%3AJGC%3AOPST%3AOBYG%3AJGB%3APRE&tradeType=&...&leftLon=127.06&rightLon=127.12&topLat=37.57&bottomLat=37.52&isPresale=true`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ... Chrome/91.0.4472.124 ...',
        'Accept': 'application/json',
        'Referer': 'https://new.land.naver.com/'   // ← 위조 헤더로 우회
      }
    });
    fs.writeFileSync('gwangjin_real_estate.json', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error fetching data:', error.message);   // ← 오류 처리 전부
  }
}
getGwangjinRealEstateData();
```

### 1.3 서빙 방식 (`app/api/naver-real-estate/route.ts`)

**런타임 크롤링이 아니다.** 1회 덤프한 정적 파일을 디스크에서 읽어 메모리 필터만 한다.

```ts
const filePath = path.join(process.cwd(), 'gwangjin_real_estate.json');
const fileContent = await fs.readFile(filePath, 'utf-8');
const data = JSON.parse(fileContent);

let properties = data.map((item) => ({
  id: item.complexNo, complexName: item.complexName,
  latitude: item.latitude, longitude: item.longitude,
  minDealPrice: item.minDealPrice, maxDealPrice: item.maxDealPrice, ...
}));

// 지도 바운드가 모두 유효하면 필터링
if (!isNaN(leftLon) && ...) {
  properties = properties.filter(p =>
    p.latitude >= bottomLat && p.latitude <= topLat &&
    p.longitude >= leftLon && p.longitude <= rightLon);
}
```

### 1.4 분석 문서 (`naver_real_estate_data_analysis.md`)

네이버 부동산의 내부 API를 리버스 엔지니어링한 기록이 남아 있다.

- 엔드포인트: `https://new.land.naver.com/api/complexes/single-markers/2.0`
- 파라미터: `cortarNo`(지역코드), `zoom`, `realEstateType`(APT/OPST), `tradeType`(A1 매매/B1 전세),
  `priceMin/Max`, `areaMin/Max`, `leftLon/rightLon/topLat/bottomLat`
- 응답: GeoJSON — `complexNo`, `complexName`, `tradeCount`, `rentCount`, `leaseCount`, `latitude`, `longitude`
- 문서 말미 경고: *"API 사양은 예고 없이 변경될 수 있습니다"*

### 1.5 한계

- 네이버가 차단/스펙 변경하면 그날로 종료 (문서에도 명시된 리스크)
- 지역 1개 하드코딩, 확장하려면 코드 수정
- 갱신 개념 없음 — 파일을 덮어쓸 뿐, 이력·중복 처리 없음
- 재시도/백오프/로깅 없음, 오류 시 `console.error` 한 줄

---

## 2. 2세대 — `onsia_DB/naver_map_crawler` (2025-09-15)

GitHub `onsia-realty/onsia_DB`, Python.

```python
"""
네이버 지도 크롤러 - Undetected Chrome 버전
봇 감지 우회에 특화된 Selenium 기반 크롤러
"""
import undetected_chromedriver as uc
from config import BASE_URL, DELAY_RANGE, MAX_RETRIES, LOCATIONS, KEYWORDS, ...

class UndetectedNaverCrawler:
    def __enter__(self): self.initialize_driver(); return self
    def __exit__(self, *a): self.close()
```

| 항목 | 내용 |
|---|---|
| 의존성 | `undetected-chromedriver>=3.5.0`, `selenium>=4.15.0`, `openpyxl`, `pandas` |
| 대상 | 네이버 **지도(장소)** — 용인 처인구·기흥구 음식점·카페 |
| 우회 | 봇 감지 회피 드라이버 + `DELAY_RANGE` 랜덤 대기 |
| 견고성 | `MAX_RETRIES`, 컨텍스트 매니저로 드라이버 정리, `crawler.log` 로깅 |
| 저장 | Excel (`save_to_excel`) |
| 실행 | 수동 (`python crawler_selenium.py`) |

**의의**: 봇 우회 기술 자체는 **여기가 정점**. 다만 대상이 부동산 매물이 아니라 장소 데이터고,
여전히 수동 실행 + 파일 저장이며 회색지대에 있다.
README에도 *"네이버 서비스 약관 준수 / robots.txt 확인 필수 / 상업적 사용 전 법적 검토 필요"* 라고 적혀 있다.

---

## 3. 3세대 — `onsia-job/src/lib/market` + Cron (2026-05 ~ 현재)

### 3.1 데이터 소스 — 정식 인증키 API 11종

`src/lib/market/publicApi.ts`:

```ts
export const API_BASE = {
  MOLIT_APT_TRADE : '.../RTMSDataSvcAptTradeDev',  // 아파트 매매
  MOLIT_APT_RENT  : '.../RTMSDataSvcAptRent',      // 아파트 전월세
  MOLIT_OFFI_TRADE: '.../RTMSDataSvcOffiTrade',    // 오피스텔 매매
  MOLIT_OFFI_RENT : '.../RTMSDataSvcOffiRent',     // 오피스텔 전월세
  MOLIT_NRG_TRADE : '.../RTMSDataSvcNrgTrade',     // 상가
  MOLIT_RH_TRADE  : '.../RTMSDataSvcRHTrade',      // 연립·다세대
  MOLIT_SILV_TRADE: '.../RTMSDataSvcSilvTrade',    // 분양권 전매
  APPLYHOME       : 'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1',
  BLDG_LEDGER     : '.../BldRgstHubService',       // 건축물대장 (구 v2는 폐기)
  KAPT_LIST       : '.../AptListService3',         // 단지목록 → kaptCode
  KAPT_CMN_COST   : '.../AptCmnuseManageCostServiceV2',   // 공용관리비 17종
  KAPT_IND_COST   : '.../AptIndvdlzManageCostServiceV2',  // 개별사용료 10종
  KAPT_BASIS      : '.../AptBasisInfoServiceV4',   // 단지 기본정보
} as const;
```

여기에 VWorld 지오코딩, 네이버 지도 v3(표출용)이 더해진다.

### 3.2 자동 실행 — Vercel Cron 4종 (`vercel.json`, UTC 표기)

| path | schedule (UTC) | KST |
|---|---|---|
| `/api/cron/expire-jobs` | `0 15 * * *` | 00:00 |
| `/api/cron/sync-transactions` | `0 19 * * *` | 04:00 |
| `/api/cron/geocode-complexes` | `30 19 * * *` | 04:30 |
| `/api/cron/sync-mgmt-costs` | `0 20 * * *` | 05:00 |

### 3.3 수집 엔진 (`api/cron/sync-transactions/route.ts`)

```ts
export const maxDuration = 300;   // 서버리스 한계까지 사용

// 1) 인증
if (!secret || authHeader !== `Bearer ${secret}`) return 401;   // CRON_SECRET

// 2) 대상 = region_codes 테이블(is_mvp) × 최근 3개월, ?lawd= 로 특정 시군구 백필 가능
const tasks = [];
for (const r of regions) for (const ym of months) tasks.push({ lawd_cd: r.lawd_cd, ym });

// 3) 소스 5종 동시 호출, 개별 성패 분리
const [aptT, aptR, offiT, offiR, aptS] = await Promise.allSettled([...]);
if (aptT.status === 'fulfilled') summary.apt_trade += aptT.value.length;
else summary.errors.push(`apt_trade ${t.sigungu} ${t.ym}: ...`);

// 4) 11컬럼 복합키 upsert — 중복 무시
await supabaseAdmin.from('price_transactions').upsert(rows, {
  onConflict: 'property_type,deal_type,lawd_cd,deal_ymd,complex_name,jibun,exclusive_area,floor,deal_date,price_manwon,deposit_manwon',
  ignoreDuplicates: true,
});

// 5) worker pool 동시성 제어 (기본 8, ?concurrency= 로 1~20)
const workers = Array.from({ length: concurrency }, async () => {
  while (cursor < tasks.length) await processOne(tasks[cursor++]);
});
await Promise.all(workers);
```

### 3.4 저장 — Supabase 정규화 스키마 (34개 마이그레이션)

market 관련 테이블: `region_codes`, `price_transactions`, `building_ledgers`,
`complex_aggregates`, `complexes`, `apt_mgmt_costs`, `market_rankings`, `market_alerts`, `broker_offices`

운영 이슈까지 마이그레이션으로 다룬 흔적:
`026_fix_unique_index_for_upsert`, `029_hwaseong_district_split`(행정구 개편), `033_price_table_rent_aggregates`

### 3.5 코드 규모

```
src/lib/market/*.ts          약 2,300줄 (realEstate 329, aptMgmtCost 364, surroundings 292 …)
scripts/backfill-*.mjs       약 920줄  (geocode / complex-coords / kapt-codes / mgmt-costs / building-ledgers)
api/cron/*/route.ts          약 730줄
────────────────────────────────────
합계                          약 4,500줄
```

### 3.6 네이버의 역할 변화

`claudedocs/naver-land-benchmark.md` — 네이버페이 부동산(`fin.land.naver.com/map`)의 렌더링 HTML을
디코딩해 **아키텍처를 벤치마킹**한 문서. 긁는 대상이 아니라 참고 대상이 되었다.

> 추출 내용: Next.js App Router + RSC 스트리밍, TanStack React Query `HydrationBoundary`,
> 네이버 지도 JS v3, Sentry, NTM 로깅, `MarkerManager`(마커를 지도와 분리한 중앙 관리 레이어),
> `MapHydrator`(쿠키 기반 UI 상태 복원), 숫자용 IBM Plex Sans Condensed 폰트
>
> 차별화 포인트로 정리된 것: 시세지도 위에 **구인공고(jobs-nearby) + 중개업소(brokers-nearby)** 오버레이

---

## 4. 세대별 비교표

| 축 | 1세대 (2025-07) | 2세대 (2025-09) | 3세대 (2026-05~) |
|---|---|---|---|
| 접근 방식 | 비공개 API + UA/Referer 위조 | undetected-chromedriver 자동화 | 인증키 기반 정식 공개 API |
| 데이터 소스 | 네이버 부동산 1종 | 네이버 지도 1종 | 국토부 7 + K-apt 3 + 건축물대장 + VWorld |
| 지역 범위 | 광진구 하드코딩 | 용인 처인·기흥 | `region_codes` 테이블 기반 전 MVP 지역 |
| 시간 범위 | 시점 1개 | 시점 1개 | 최근 3개월 롤링 + 임의 월 백필 |
| 저장소 | JSON 파일 1개 | Excel | Supabase 12+ 테이블 |
| 실행 | 손으로 `node` | 손으로 `python` | Vercel Cron 4종 자동 |
| 동시성 | 없음 | 랜덤 딜레이 | worker pool 8 (1~20 조절) |
| 실패 처리 | `console.error` 1줄 | `MAX_RETRIES` | 소스별 성패 분리 집계 + `summary.errors[]` |
| 중복 처리 | 없음(덮어쓰기) | 없음 | 11컬럼 복합키 upsert |
| 인증/보안 | — | — | `CRON_SECRET` Bearer, service_role 서버 전용 |
| 법적 위치 | 회색지대 | 회색지대 | 정식 개방 데이터 |
| 코드량 | 25줄 | 약 400줄 | 약 4,500줄 |

---

## 5. 솔직한 평가

### 진짜 업그레이드된 것
1. **소스의 지속가능성** — 차단당하면 끝나는 구조에서, 차단 개념이 없는 구조로.
2. **운영 자동화** — 손으로 돌리는 스크립트 → 매일 도는 파이프라인.
3. **데이터 모델링** — 파일 덤프 → 정규화 + 중복 제어 + 이력 축적.
4. **다중 소스 조인** — 실거래가 + 관리비 + 건축물대장 + 좌표를 단지 단위로 결합. 1세대엔 없던 개념.

### 오해하면 안 되는 것
- **봇 우회 기술은 오히려 후퇴했다.** undetected-chromedriver 같은 회피 기술은 지금 안 쓴다.
  이건 퇴보가 아니라 **선택**이다 — 그 기술이 필요 없는 트랙으로 옮겼기 때문.
- 3세대를 "크롤링"이라 부르는 건 정확하지 않다. **정식 API 수집 파이프라인**에 가깝다.

### 현재 남은 약점
1. **재시도/백오프 부재** — `src/lib/market/realEstate.ts`에 retry·backoff 로직이 없다.
   `Promise.allSettled`가 실패를 `summary.errors[]`로 삼키고 넘어가므로,
   data.go.kr가 일시 오류를 내면 **그 지역·그 달 데이터가 조용히 빈다.** 개선 1순위.
2. **VWorld 지오코딩의 리전 의존** — Vercel(미국 IP)에서 502, 로컬(한국 IP)에서만 백필 가능.
   (관련 메모리: `vworld-geocoding-vercel-502`)
3. **시군구 코드 개편 stale** — 행정구 개편 시 `region_codes`가 낡으면 단지가 통째로 누락된다.
   화성·부천은 2026-06-14 수동 복구(commit 4ce208a). 자동 감지 장치는 아직 없다.
4. **onsia-nest 소스 소실 위험** — Git 미연결 + Deployment Retention 활성.
   보존하려면 Vercel 소스 뷰어에서 내려받아 두어야 한다.

---

## 부록. 확인 경로

| 대상 | 경로 |
|---|---|
| onsia-nest 소스 | `https://vercel.com/realtors77-7871s-projects/onsia-nest/KTTUTVc4oUXrFwqf44EyNmQxX4Sd/source?f=src%2F<경로>` |
| 2세대 크롤러 | `D:\claude\onsia_DB\naver_map_crawler\crawler_selenium.py` |
| 3세대 수집 엔진 | `src/app/api/cron/sync-transactions/route.ts` |
| 3세대 API 상수 | `src/lib/market/publicApi.ts` |
| 네이버 벤치마킹 | `claudedocs/naver-land-benchmark.md` |
| Cron 스케줄 | `vercel.json` |
