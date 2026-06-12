# PROGRESS.md — 온시아 Job 프로젝트 진행 상황

> 이 파일은 Claude의 세션 간 컨텍스트 유지를 위한 **단기 기억 파일**입니다.
> 세션 시작 시 반드시 읽고, 종료 시 반드시 업데이트합니다.

---

## 마지막 작업 (2026-06-12) — 마커 네이버페이 부동산 스타일 (집 모양)

### 결론: "눈 아픈" 컬러 마커 → 네이버식 집 모양 마커 + 탭형 상세 패널

- **집 마커**: **파란(#2563EB) 지붕**(대표면적㎡, 오피스텔 "OP") + 흰 본문 2줄: **평균가(검정 "매/전/월/분") + 최근 실거래 1건(초록 "실 X억")** + 아래 단지명(흰 halo). 선택 시 본문 블루 반전. DEAL_RAMPS/quintile 색 인코딩 **전부 제거**. (검정 지붕은 "네이버 카피 같다" 피드백으로 블루 변경, 사용자가 "매매/실거래가" 병기 요청 → 평균+최근실거래 조합)
- **이중 집계**: bounds fetch가 trade+rent 병렬 (분양권 탭 +1). `MapComplexPoint`에 `avg_trade_manwon`/`avg_jeonse_manwon`/`latest_price_manwon`(최근 실거래)/`rep_area`(primary 면적 중앙값) 추가.
- **과밀 방지**: 줌 14에서 거래량 상위 90개만 마커 표시(`MAX_MID_ZOOM_MARKERS`), 줌 15+ 전량. 리스트는 항상 전체.
- **상세 패널 탭**: [시세/실거래(KPI+차트+거래량+평형별+최근거래)] [단지정보(건축물대장)] [인근(2km 비교)] — 헤더/탭 고정, 콘텐츠만 스크롤.
- **집계 마커(구/동)**·리스트 가격·모바일 peek 모두 무채색+초록 톤 통일.
- 로컬 검증 완료 (이번엔 localhost에서도 NCP 지도 인증 정상 — 마커 실물 확인).

### 추가 작업 (2026-06-12 심야)
- **건축물대장 파이프라인 복구**: pnu 백필(VWorld level4LC=표준 PNU 19자리) + BldRgstHubService 교체 + splitPnu 구분코드 변환 + cron keyset/스텁/스캔상한 수정. **9,997건 수집 완료, 잔여 ~2,400건은 data.go.kr 일일 쿼터(1만) 소진으로 내일 `node scripts/backfill-building-ledgers.mjs --ledger-only` 재실행 필요** (은마 포함)
- **인근 탭 마피앱 수준**: 지하철(노선뱃지)/버스/학교(탭+범례) 카드 UI + **클릭 시 단지→시설 점선 안내**(RouteOverlay, 노선색 점선 + 📍라벨)
- **서울 버스 정류장 11,253개 정적 데이터** (`src/data/seoul-bus-stops.json`, 서울 열린데이터광장) — odcloud의 서울 커버리지 부실 보완
- **파크하비오 버그 2개**: 주상복합 누락(bounds 단지 조회의 type 필터 제거) + loadData 레이스(시퀀스 가드)

### ⚠️ 미푸시 커밋 다수 — `git push origin main` 필요

---

## 이전 작업 (2026-06-11) — 시세지도 전면 개편 (호갱노노/네이버페이 부동산 스타일)

### 결론: 데이터(좌표 백필 완주) + UI(마커/패널/모바일) 5단계 전면 개편 완료

### P1. 좌표 백필 완주 ✅ (지도가 "이상했던" 근본 원인)
- **원인 1**: geocode cron이 ORDER BY 없는 `limit*30` 샘플링 → 미백필 단지에 영영 도달 못 함
- **원인 2**: 강남 등 단지들 lat=null 방치 (NCP 키 추가 전 실패분, 재시도 안 됨)
- **수정**: cron 후보 추출 = 재시도 풀(complexes lat=null, 7일 쿨다운) + 일별 지역 로테이션 발굴. 실패 시에도 geocoded_at 스탬프.
- **`scripts/backfill-geocode.mjs`** (신규, 로컬 실행): price_transactions 225k행 전체 스캔 → **12,481/12,517 지오코딩 성공 (99.7%, 4분41초, 전부 NCP naver)**. 실패 36건은 "가-" 분양권 블록 지번 (지오코딩 불가).
- **⚠️ `.in()` 청크 30개 제한**: 한글 complex_key는 URL 인코딩 시 키당 100-150바이트 → 100개만 넘어도 fetch failed. PostgREST 1000행 캡도 회피됨. (transactions route + cron)

### P2. 마커 리디자인 + 가격 포맷 통일 ✅
- **`src/lib/market/format.ts`** (신규): `formatKoreanPrice(만원, 'full'|'compact')` → "52억 5,000" / "52.5억". `formatEokUnit` (차트 축). 테스트 11개.
- 마커: 네이버식 — 가격(compact, 크게) + 단지명(6자컷) 말풍선 + 꼬리 + 거래건수 우상단 뱃지. 5분위 5색 → **dealType별 단색 농도 램프** (`DEAL_RAMPS`: 매매 rose / 전세 blue / 월세 emerald / 분양권 violet).
- 마커 diff 렌더: `markersRef`를 Map으로 — 선택 변경 시 2개만 setIcon (기존: 500개 전량 재생성).
- jitter fallback 제거 — 좌표 없는 단지는 마커 제외.

### P3. 줌 레벨별 집계 마커 ✅
- 줌 ≤11 구(원형, region_codes centroid) / 12~13 동(pill, 클라이언트 집계) / ≥14 단지
- **`/api/market/aggregates`** (신규): complex_aggregates MV 최근 3개월 → lawd_cd별 가중평균 (매매 기준). s-maxage=3600.
- `src/lib/market/aggregateMarkers.ts`: aggregateByDong (bounds 응답의 dong 사용)
- 집계 마커 클릭 → 드릴다운 줌인 (구→12, 동→14). 구 모드에서는 bounds 거래 fetch 생략.

### P4. 좌측 통합 패널 1개 + 지도 최대화 ✅
- `MarketDetailPanel`+`MarketGraphPanel`(380+440px) 삭제 → **`ComplexDetailView`** 1개(400px)로 통합 (KPI+듀얼라인 차트+거래량+평형별+건축물대장+인근비교+최근거래)
- 미선택 시 **`ComplexListPanel`**: viewport 단지 리스트 (가격/거래량 정렬) — 네이버페이 부동산 스타일
- **지역 칩(RegionPicker) 제거** — lawd_cd는 viewport 중심→최근접 매핑 자동 갱신 (`src/lib/market/regions.ts`)
- `ComplexDetail` 타입 → `src/lib/market/types.ts`, 필터 상수 → `src/lib/market/filters.ts`

### P5. 모바일 ✅
- **`BottomSheet.tsx`**: peek(124px)/half(50dvh)/full(92dvh) 스냅, 드래그는 grabber 전용 (콘텐츠 스크롤 충돌 없음)
- **`MarketFilterSheet.tsx`**: 필터 1줄 + 통합 필터 바텀시트

### ⚠️ 배포 관련 발견
- **라이브 ≠ origin/main이었음**: 라이브는 `ncpKeyId` 사용, repo HEAD(7941fb2)는 `ncpClientId` — 노트북 CLI 배포 추정. 이번 커밋에서 코드를 `ncpKeyId`로 통일 (검증된 파라미터).
- 라이브 프로덕션 지도 키: `2v2hncoi4d` (HTML에서 확인). Vercel env `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 값과 일치 여부는 배포 후 확인.
- SecurityShield 우회: `?devmode=onsia-dev-2026` (Playwright 검증 시 필수)

### 미해결 / 다음 단계
- [ ] 배포 후 라이브 검증: 강남 마커, 줌아웃 집계 마커, 모바일 시트
- [ ] 차트 1Y/3Y/5Y 데이터 백필 (sync-transactions 다회 실행)
- [ ] 분양권 "가-" 지번 36개 단지 지오코딩 (단지명 검색 fallback 검토)
- [ ] 줌 12~13 동 집계는 bounds 500단지 캡 기준 (광역 viewport에서 일부 누락 가능)

---

## 마지막 작업 (2026-06-03) — 라이브 배포 검증 ✅ (코드 변경 없음)

### 결론: booin.co.kr/market 정상 작동 확인 — 지도+마커+필터 전부 OK

사용자가 노트북에서 문제 수정 후 "배포된 것 확인" 요청. Playwright로 라이브 직접 검증.

### 검증 결과 (Playwright, https://booin.co.kr/market)
| 항목 | 상태 |
|------|------|
| 네이버 지도 타일 | ✅ 렌더링 (한강·압구정·코엑스 등) |
| 가격 마커 | ✅ 다수 표시 (27억·40억·156억6,000·32억 등 단지명+시세) |
| SDK 인증 | ✅ `window.naver.maps` 로드, URL `?ncpKeyId=2v2hncoi4d` |
| 필터 탭 | ✅ 매매/전세/월세/분양권 · 아파트/오피스텔 · 서울 강남 |
| 헤더 | ✅ "60개 단지" / 콘솔 에러 0건 |

### 주의 / 메모
- ⚠️ **`[data-complex-key]` 셀렉터 마커 카운트는 오탐** — 배포 버전 마커는 네이버 오버레이라 그 속성 미사용. 마커 검증은 셀렉터 카운트 말고 **스크린샷(시각)으로 판단**할 것.
- **GitHub `onsia-realty/job`에는 6/1 이후 새 커밋 없음** (local/origin main 모두 `7941fb2`). 라이브가 정상이므로 오늘 수정은 6/1 커밋에 이미 포함됐거나 Vercel 환경변수/대시보드 변경으로 추정. 코드 변경이었다면 노트북 push 미반영 상태 — 확인 필요.
- 로컬 `.env.local`은 오늘 03:41 수정 흔적 있으나 커밋 안 됨(gitignore).

---

## 마지막 작업 (2026-06-01) — Cron geocoding Naver 교체 + main 머지 + 라이브 검증 ✅

### 결론: 5/31 어제 작업 7커밋 + 오늘 Naver geocoding 1커밋 한꺼번에 main 머지 → 라이브 정상 작동

어제 작업의 핵심 미해결인 "Vercel(US 리전) → VWorld(KR 정부) 502 만성 실패" 근본 해결.
NCP Naver Geocoding API는 한국 서버라 Vercel US에서도 정상 응답 — geocode-complexes cron이 신규 단지 좌표를 자동으로 채울 수 있게 됨.

### 변경
- `src/lib/market/complexes.ts`: `geocodeNaver()` 추가, `geocodeWithDebug()` 재구성 (Naver 우선 → VWorld 도로명 → VWorld 지번 fallback)
- `src/app/api/cron/geocode-complexes/route.ts`: `geocode_source` 라벨 동기화 (`'naver' | 'vworld_road' | 'vworld_parcel'`)
- `.env.local`: `NAVER_GEOCODE_CLIENT_ID=2v2hncoi4d`, `NAVER_GEOCODE_CLIENT_SECRET` 추가
- Vercel Production + Preview 환경변수에 동일 키 2개 추가 (Playwright MCP)

### 커밋 시리즈 (main 기준)
- `d75ea69` feat(market): cron geocoding Naver 우선 + VWorld fallback로 교체
- `f0ad37e` (merge) Merge feature/market-naver-benchmark → main — 8 커밋 한꺼번에 라이브화

### 라이브 검증 (booin.co.kr/api/cron/geocode-complexes?limit=20&debug=true)
```
geocoded: 20 / failed: 0 / elapsed_ms: 3,492 / upserted: 20
debug_samples[*].naverStatus: "OK/total=1"   (5/5 첫 시도 성공)
debug_samples[*].vworldRoadStatus: ""        (Naver가 다 잡아서 fallback 안 감)
```

### 미해결 / 후속
- 차트 1Y/3Y/5Y 데이터 백필 (sync-transactions `?months=` 다회 실행)
- jobs-nearby 좌표 (구인공고 지오코딩)
- 남은 172개 단지명 정제 (지번 파편 / 재개발·멸실 추정)
- 라이브 UI 동작 확인 (URL 공유 / 차트 기간탭 / brokers·jobs 레이어 — 머지로 전부 라이브 반영됨)

---

## 마지막 작업 (2026-05-31) — 시세지도 네이버페이/호갱노노 벤치마킹 ✅

### 결론: 네이버페이 부동산 UX 갭 3종 + 호갱노노 차트 스타일 적용 (커밋·푸시 완료)

사용자가 네이버페이 부동산(`fin.land.naver.com/map`) HTML을 제공 → 시스템 디코딩 후
우리 시세지도와 벤치마크. 분석/플랜 문서: `claudedocs/naver-land-benchmark.md`.
**우리가 앞선 것**: 데이터 파이프라인·마커(5분위 색상)·차별화 데이터(구인/중개/AI/건축물대장).
**뒤처진 UX 3종**(전부 채택·구현): ① URL 공유 상태 ② React Query 캐시 ③ 차트 기간 탭.

### 커밋 시리즈 (브랜치 `feature/market-naver-benchmark`, origin 동기화 완료)
- `339b2e5` 시세지도 풀 리뉴얼 — 라이트 톤 + Recharts + 분양권 + 검색 (19파일, +2869)
  - 신규: `MarketDetailPanel.tsx`, `MarketGraphPanel.tsx`, `MarketSearch.tsx`, `buildingLedger.ts`,
    `api/market/search`, `api/cron/sync-building-ledgers`
- `8b9f678` bounds 모드 0건 시 lawd_cd 모드 자동 fallback
- `e7a7e48` 패키지 매니저 pnpm으로 통일
- `28e508f` **네이버페이 벤치마킹 본체** — React Query/URL공유/차트기간탭/구인중개 레이어 (11파일, +730)
  - 신규: `MarketQueryProvider.tsx`(@tanstack/react-query), `src/lib/market/queries.ts`(useQuery 훅 모음)
  - URL 상태 동기화, 차트 기간 탭, brokers-nearby 마커 + jobs-nearby 패널
- `dfc0ebc` (memory) 네이버 지도 키 인벤토리 보정 — Vercel 전용, 로컬 누락 주의
- `f5533f0` **호갱노노 스타일 차트** — 매매+전세 듀얼라인 + 기간대비% + 출처 푸터 (← 마지막 커밋)
  - `MarketGraphPanel.tsx` 대폭 리라이트, `api/market/complex/[key]/route.ts` 응답 보강

### 미해결 / 후속 (다음 작업자 주의)
- ⚠️ **로컬 `.env.local`에 네이버 지도 키 누락** — 키는 Vercel 환경에만 존재. 로컬 `pnpm dev`로
  `/market` 지도 확인하려면 `NEXT_PUBLIC_NAVER_MAP_*`(ncpKeyId) + `NEXT_PUBLIC_MARKET_ENABLED=true` 필요.
  (메모리 `dfc0ebc` 참조)
- **차트 장기 탭(1Y/3Y/5Y) 실데이터 부족** — `sync-transactions` cron 기본 최근 3개월만 수집.
  UI는 있으나 과거 백필(`?months=` 다회 실행) 필요. 데이터 없으면 "누적 중" 안내.
- **jobs-nearby lat/lng 없음** — 구인공고는 정밀 핀 불가, "이 지역 채용 N건" 패널 방식. 지오코딩은 차후.
- 라이브 배포 후 URL 공유/차트 기간탭/구인·중개 레이어 동작 확인 필요.
- `claudedocs/결제창.md` — 프리미엄 "공고 선택 → 결제" 플로우 복원 가이드 (PG 테스트 우회 중, 미커밋).

---

## 마지막 작업 (2026-05-19) — 시세지도 viewport bounds + 패널 정보 풍부도

### 결론: 드래그 즉시 반영 + 평형별/건축물대장/인근단지 표시

5/11 라이브 정상화 후 사용자 피드백 2건 해결:
1. **드래그 시 정보 안 바뀌는 문제** — MVP_REGIONS 8개 lawd_cd 매핑 한계가 원인. viewport bounds 모드로 전환.
2. **정보 빈약** — `unit_distribution`, `building_meta`, `nearby_complexes`, `monthly_split` 백엔드는 이미 반환 중. 패널 UI가 미사용. 4개 섹션 추가.

### 변경 (4 files)
- `src/app/api/market/transactions/route.ts` — `?bounds=sw_lat,sw_lng,ne_lat,ne_lng&type=&deal=&months=6` 모드 신설. `complexes` 테이블 좌표 범위 → `price_transactions` 6개월치. 국토부 API fetch 없이 캐시만 조회 (s-maxage=120). 기존 `lawd_cd+ym` 모드는 RegionPicker/cron 호환용 유지.
- `src/components/market/MarketMap.client.tsx` — `onBoundsChanged(sw_lat, sw_lng, ne_lat, ne_lng)` 콜백 + idle 이벤트에서 `map.getBounds().getMin()/getMax()` 호출. 초기 마운트 직후 1회 발화 (setTimeout 0).
- `src/app/market/MarketPageClient.tsx` — `boundsStr` state, `handleMapBoundsChanged` (재발화 차단 위해 string 비교), `handleMapCenterChanged` + 자동 lawd_cd 매핑 제거. RegionPicker 클릭 시 `setBoundsStr(null)` 로 리셋 후 새 center에서 idle → 새 bounds.
- `src/components/market/MarketDetailPanel.tsx` — 4개 섹션 추가: 미니 스파크라인(`lg:hidden`, recharts LineChart), 평형별 평균(가로 스크롤 카드), 단지 정보(건폐율/용적률/대지지분/주차/승강기/구조), 인근 단지 비교(거리순 5건). 헬퍼 `shortPrice(manwon)` 추가.

### 미해결 / 후속
- `complexes` 테이블 좌표 백필 커버리지 확인 필요 — bounds 모드는 좌표 있는 단지만 조회. 미백필 단지가 많으면 결과 빈약 가능.
- 라이브 배포 후 드래그/줌 동작 확인 필요.
- 다음 단계 (mapiapp 통합 — 학교/지하철 정적 JSON, apartment-ranking 등) 는 별도 작업.

---

## 마지막 작업 (2026-05-11) — 시세지도 완전 정상화 ✅

### 결론: 라이브에서 지도 + 130개 마커 정상 표시

12시간 디버깅 끝에 진짜 원인 2개로 압축됨:

1. **NCP가 SDK URL 파라미터를 `ncpClientId` → `ncpKeyId`로 변경했음** (조용히)
   - 옛 키 / 새 키 모두 `ncpKeyId`로만 인증 통과
   - validatev3 엔드포인트 직접 hit해서 결정적으로 확인
2. **CSS flex height 트랩**: `flex-1` 부모 안에서 `height:100%`가 0으로 계산
   - 컨테이너 `position: absolute; inset: 0`으로 우회

### 헛다리였던 가설들 (다음 작업자 주의)
- NCP 캐시 / 카드/결제 / 화이트리스트 URL 형식 / Strict Mode / map.destroy() / SDK 로드 타이밍 / 다른 계정 키 — **전부 본질 아님**.
- 콘솔에 `Authentication Failed Error Code 200` 메시지 뜨면 **1초 만에 파라미터 이름부터** 확인. NCP는 명확한 메시지 없이 deprecate함.

### 디버깅 핵심 무기 (재사용)
NCP 인증 결과 직접 hit (JSONP):
```js
const time = Date.now();
const cb = '__cb_' + time;
window[cb] = (r) => console.log(r);
const s = document.createElement('script');
s.src = `https://oapi.map.naver.com/v1/validatev3?ncpKeyId=KEY&uri=${encodeURIComponent(URL)}&time=${time}&callback=${cb}`;
document.head.appendChild(s);
// 응답 {error: {errorCode: '200', ...}} = 거부, 없음 = 통과
```

### 관련 메모리
- `feedback_ncp_maps_keyid_param.md` — ncpKeyId 파라미터 + 디버깅 무기
- `project_ncp_maps_account.md` — NCP 계정/Application/콘솔 경로
- `feedback_flex_height_100pct_trap.md` — flex height:100% 트랩

### 최종 커밋 시리즈
- `8def16c` Naver SDK 라이프사이클 안정화 (map.destroy 제거)
- `b2b2cf9` next/script로 SDK 로딩 페이지 레벨 이동
- `0a4f83d` ncpClientId → ncpKeyId (🎯 진짜 fix)
- `880187b` 지도 컨테이너 height 0 → absolute inset (🎯 마지막 fix)

---

## 이전 작업 (2026-04-27)

### 카카오 지도 마커 미생성 — 디버깅 진행 중 (미해결)

#### 진행 흐름
1. **카카오 권한 활성화 (우회)**: onsia-job 앱이 카카오맵 심사 반려 상태였음. 카카오 '1앱-1서비스' 정책상 계정 첫 번째 앱이 자동 권한을 받음 → 이미 onsia.city에서 사용 중인 첫 번째 앱(생성 2025-12-18)에 booin 도메인 추가하여 우회. JS 키: `99928cf1f21dbccb73c00344b2bd66d3`. onsia-job 앱은 카카오맵 미사용으로 booin 도메인 삭제.
2. **환경변수 교체** (`commit 7fe30be`): `.env.local` + Vercel 3개 환경 모두 새 키로. 시세지도 진입 카드(메인 페이지 광고 배너) 추가, 카카오 SDK 로드 실패 fallback 카피 정확화.
3. **카카오 SDK 정상 로드 확인**: 라이브 `/market` → 카카오 다크 스카이 모드 타일 로딩 OK, 콘솔 에러 0, "94개 단지" 헤더 표시.
4. **🔴 문제 발견**: 마커가 0개. `data-complex-key` 가진 div 0개. 헤더 카운트 94 vs DOM 0.
5. **수정 시도 1** (`commit b84bbed`): `mapReady` state 추가 — useEffect[points,mapReady] race condition 해결 시도. **실패** (마커 여전히 0).
6. **수정 시도 2** (`commit 15882af`): `drawMarkers` ref 패턴으로 재작성. SDK 로드 직후 직접 호출. **실패** (마커 여전히 0).
7. **디버깅 console.log 추가** (`commit 73cd07d`): MarketMap.client.tsx에 단계별 log. **라이브 콘솔에 안 찍힘** → 새 빌드가 dynamic chunk에 반영 안 된 것으로 추정.
8. **chunk 분석**: 이전 dynamic chunk(`545d38d88ee8ad5b.js`)는 9 bytes로 무효화, 새 chunk hash가 main HTML에서 안 보임. Vercel webpack chunk 매핑 또는 빌드 캐시 이슈 의심.

#### 미해결 — 사용자 결정 대기
- (A) Vercel `--force` rebuild + 추가 디버깅 (5분~∞)
- (B) **VWorld + Leaflet 전환** (1시간 내, 검증된 패턴, 부동산인 다른 모든 지도와 일관성)
- (C) 시세지도 잠시 보류, 다른 오픈 작업 우선

#### 임시 코드 정리 필요
- `src/components/market/MarketMap.client.tsx`에 디버깅 console.log 6개 남아있음. 결정 후 제거 또는 유지.

---

### 오픈 전 점검 라운드 3 — 라이브 검수 + cron 버그 수정

#### Step 1~2. 카카오 지도 인증 진단
- `/market` 라이브 접속 → 페이지 자체는 200 OK, 헤더/필터/단지 카운트(94개) 정상
- 카카오 SDK 요청: `net::ERR_BLOCKED_BY_ORB`
- 직접 API 응답: `403 NotAuthorizedError "App(onsia-job) disabled OPEN_MAP_AND_LOCAL service"`
- **결론**: 도메인 등록 문제 아니라 카카오 앱에서 **카카오맵 서비스 자체가 비활성화** 상태
- **대표님 작업 대기**: developers.kakao.com → onsia-job 앱 → 제품 설정 → 카카오맵 ON

#### Step 4. 🚨 cron 중대 버그 수정 + 라이브 검증 완료 (commit `afa091b`)
- **진단**: cron이 한 번도 정상 작동한 적 없음. Vercel Cron은 GET 호출인데 sync 로직이 POST에만 있어서 GET은 카운트만 반환하고 끝남.
- **수정**: `runSync()` 추출 → GET/POST 둘 다 호출하도록 통합 (`src/app/api/cron/sync-transactions/route.ts`)
- **라이브 검증** (1개월치 호출): apt_trade 7,355 + apt_rent 17,777 + offi_trade 1,124 + offi_rent 5,770 = 32,026건, errors 0, 21.4초
- **DB 반영**: 53,456 → **84,599** (+31,143건). 내일 04:00 KST Vercel Cron 자동 실행 시 동일 핸들러로 정상 작동 예정.
- **참고**: `expire-jobs`는 처음부터 GET 핸들러로 정상 구현되어 있었음.

#### Step 5. 도메인/SSL ✅ PASS
- `https://booin.co.kr` 200 OK (Browser UA), `http→https` 308, `www→root` 307
- SSL: Let's Encrypt, 2026-07-24까지 (자동 갱신)
- ⚠️ 메모: curl/봇 UA는 403 차단됨 — Vercel 기본 동작, 일반 사용자 영향 없음

#### CRON_SECRET 통일 확인
- 로컬·Vercel 모두 `booincronsecret20261024plain`로 통일됨 (메모리 업데이트 완료)

---

## 마지막 작업 (2026-04-25)

### 시세지도 지도 SDK 전환: 네이버 → 카카오 ✅ (블로커 해소)

#### 배경
- 네이버 클라우드 Maps `Authentication Failed` (errorCode 200) 블로커로 `/market` 접속 불가
- Naver Cloud "Maps" 서비스 활성화 / 도메인 매칭 / Web Dynamic Map 체크 등 모두 점검했으나 인증 실패 지속
- → 카카오 지도 JS SDK로 전환 결정

#### 변경 사항 (`src/components/market/MarketMap.client.tsx`)
- 환경변수: `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` → `NEXT_PUBLIC_KAKAO_MAP_KEY`
- 스크립트 로더: `oapi.map.naver.com` → `dapi.kakao.com/v2/maps/sdk.js?autoload=false` + `kakao.maps.load()` 콜백
- 지도 객체: `naver.maps.Map` → `kakao.maps.Map` (`zoom` → `level`)
- 마커: `naver.maps.Marker` → `kakao.maps.CustomOverlay` (HTML content + click 리스너 직접 부착)
- zoom 변환 함수 추가: `naverZoomToKakaoLevel(zoom)` — Naver 8~19 ↔ Kakao 14~1 선형 근사
- `onSelect`를 `onSelectRef`로 분리 — 콜백 변경 시 오버레이 재등록 방지

#### 다음 조치 (사용자 확인 필요)
- [ ] Vercel 환경변수에 `NEXT_PUBLIC_KAKAO_MAP_KEY` (Kakao Developer Console JavaScript 키) 추가
- [ ] Kakao Developer Console에서 사이트 도메인 등록 (`booin.co.kr`, `localhost:3000`)
- [ ] 배포 후 `/market` 접속해서 마커 정상 표시 + 클릭 → 단지 상세 이동 확인

---

### 시세지도 배포 시퀀스 완료 (⚠️ 네이버 지도 API 블로커 남음)

#### 1. upsert 버그 수정 + 마이그레이션 적용 ✅ (`2015d75`)
- `026_fix_unique_index_for_upsert.sql` — PostgREST onConflict 호환 (함수식 → plain column index)
- `realEstate.ts` null → 0/'' 정규화
- `MarketPageClient.tsx` — 3개월 순차 조회
- Supabase 라이브 적용 OK

#### 2. cron 자동 실행 설정 ✅ (`2ff2f03`)
- `vercel.json`에 `/api/cron/sync-transactions` 추가 (매일 04:00 KST)
- CRON_SECRET 로컬/Vercel 동기화 (`booincronsecret20261024plain`)
- 수동 트리거 검증: **53,039건 upsert 성공, 에러 0건, 29.5초**

#### 3. Market 플래그 오픈 ✅
- Vercel 환경변수 `NEXT_PUBLIC_MARKET_ENABLED=true` 설정 + 재배포
- `/market`, `/market/rankings`, `/market/[complex]` 접근 가능해짐

#### 4. 도메인 구조 정리 ✅
- Naver Cloud는 서브도메인 와일드카드 미지원 → 루트 도메인만 사용 필요
- **변경 전**: `booin.co.kr` → 307 → `www.booin.co.kr` (Production)
- **변경 후**: `booin.co.kr` (Production) ← `www.booin.co.kr` 307 redirect
- Vercel Domains 설정에서 Edit 처리

#### 5. ⚠️ 블로커: 네이버 지도 API 인증 실패
- `/market` 접속 시 "오류가 발생했습니다" 에러
- 원인: `TypeError: Cannot read properties of null (reading 'Marker')` — `window.naver.maps` null
- Validate 엔드포인트: `{"error":{"errorCode":"200","message":"Authentication Failed"}}`
- Client ID `nu2uv1l8nu` / 등록 URL 목록 (localhost:3000, booin.co.kr) 도메인 매칭 OK
- **추정 원인**: Naver Cloud "Maps" 서비스 비활성화 or Web Dynamic Map 미체크 or 크레딧 소진
- **다음 조치**: https://console.ncloud.com Maps 서비스 활성화 상태 확인 필요

### 사고 기록: `.env.local` 복구 (`sed -i`)
- Windows Git Bash에서 `sed -i`로 CRON_SECRET 수정 시도 → 파일 전체가 0줄로 비워짐
- **복구 성공**: IDE의 Ctrl+Z로 버퍼 복원 → 저장
- 메모리 저장: `feedback_never_sed_env.md` — `.env*` 파일은 Read+Edit만 사용 (sed/redirect 금지)

---

## 마지막 작업 (2026-04-24)

### 오픈 전 점검 라운드 2 — 코드 감사

#### 적용된 수정 (타입체크 통과)
- `src/app/api/auth/ensure-user/route.ts` — `.single()` → `.maybeSingle()`
- `src/app/api/toon/generate/route.ts` — verifyAdmin + lastEp 조회 2군데 `.single()` → `.maybeSingle()`
- `src/app/api/admin/route.ts`, `admin/payments/route.ts`, `admin/members/route.ts`, `admin/jobs/route.ts` — verifyAdmin `.single()` → `.maybeSingle()`
- `src/app/api/admin/members/[id]/route.ts` — verifyAdmin + member lookup 2군데
- `src/app/api/admin/jobs/[id]/route.ts` — verifyAdmin + job is_active lookup 2군데

#### 신규 마이그레이션 (✅ 라이브 적용 완료 via Playwright)
- `supabase/migrations/017_security_hardening.sql` — 치명적 RLS 구멍 5개 차단
- `supabase/migrations/018_drop_stale_jobs_select.sql` — 중복 SELECT 정책 제거

### 모바일 반응형 점검 (Playwright 360×780) ✅
- Google GIS 버튼 width 반응형, 헤더 터치타깃 44px, 각종 dead link 처리
- 커밋 `c24f4d2`, `f442ad2` Vercel 배포 완료

### 로그인 후 E2E ✅
- `/agent/jobs/new` 폼 가로 스크롤 제거 (AddressSearch, EditorToolbar)
- 라이브 검증: overflow 0 확인

---

## 미해결 이슈
- Pre-existing TS 에러: SecurityShield.tsx, Honeypot.tsx, dnaQuestions.ts (우리 변경과 무관)
- 뉴스툰 EP.003, EP.004의 패널 중복 이미지 (향후 생성분부터 짝수 강제 적용됨)
- commission-calculator 부동소수점 정밀도 이슈 (Math.floor + 0.7% → 1원 차이)
- /agent/mypage "수 정" 버튼 세로 쪼개짐 (오픈 후 개선)
- /premium "공인중개/사" 세로 쪼개짐 (오픈 후 개선)

---

## 다음 단계

### 시세지도 남은 작업
- [x] 공공데이터포털 API 키 온시아 서비스 활용신청 확인 (완료)
- [x] cron 실거래가 데이터 수집 정상 동작 확인 — `afa091b`로 GET 핸들러 추가 후 검증 완료
- [ ] **[대표님] Kakao Developer Console에서 카카오맵 서비스 활성화** (블로커)
- [ ] 카카오 활성화 후 지도 페이지 라이브 테스트 (`/market` 마커 표시 + 클릭)

### 오픈 전 남은 체크
- [x] 도메인/SSL 설정 확인 (booin.co.kr 정상)

---

## 시세지도 기능 개요 (2026-04-24~25 개발)

### 아키텍처
- **데이터 소스**: 국토부 실거래가 OPEN API (data.go.kr, `DATA_GO_KR_API_KEY`)
- **수집 방식**: Vercel Cron → `/api/cron/sync-transactions` (maxDuration 300, 병렬 처리)
- **DB**: `price_transactions` 테이블 (Supabase PostgreSQL)
- **지도**: 네이버 지도 JS API v3 (`NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`)

### 주요 파일
- `src/components/market/MarketMap.client.tsx` — 지도 컴포넌트
- `src/app/market/MarketPageClient.tsx` — 시세지도 메인 클라이언트
- `src/app/market/[complex]/page.tsx` — 단지 상세
- `src/app/market/rankings/page.tsx` — 단지 랭킹
- `src/app/api/market/transactions/route.ts` — 거래 조회 API
- `src/app/api/market/complex/[key]/route.ts` — 단지 상세 API
- `src/app/api/cron/sync-transactions/route.ts` — 데이터 수집 cron
- `src/lib/market/realEstate.ts` — MOLIT API fetch + transform
- `src/lib/market/aggregateByComplex.ts` — 단지별 집계

### DB 마이그레이션 이력
| 번호 | 내용 |
|------|------|
| 019 | price_transactions 테이블 생성 |
| 020 | unique index (함수식, 이후 026에서 교체) |
| 021~025 | 시세지도 기능 확장 |
| 026 | upsert onConflict 호환 — plain column index 재생성 ✅ |

---

## 활성 스킬 문서
| 스킬 | 파일 | 설명 |
|---|---|---|
| 뉴스툰 생성 | `webtoonskill.md` | 뉴스 → AI 웹툰 변환 파이프라인 |
| 메모리 유지 | `.claude/skills/memory-skill.md` | 세션 간 컨텍스트 유지 규칙 |
| 테스팅 가이드 | `.claude/skills/testing-skill.md` | 테스트 작성 컨벤션 + 워크플로우 |
| 팀 스킬 | `TEAM_SKILL.md` | 5인 AI 팀 역할 + 회의 모드 |
