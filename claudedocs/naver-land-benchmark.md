# 네이버페이 부동산(fin.land.naver.com/map) 벤치마킹 분석 & 시세지도 개선 플랜

## Context (왜 이 작업을 하는가)

사용자가 네이버페이 부동산 지도 페이지(`fin.land.naver.com/map`)의 전체 렌더링 HTML을 제공하며
"우리가 하려던 게 잘 정리되어 있다 → 시스템을 파악하고 벤치마킹하자"고 요청.

우리는 이미 `시세지도(market)` 기능을 보유 (2026-05-11 라이브, `NEXT_PUBLIC_MARKET_ENABLED` 플래그).
국토부 실거래가 + 네이버 지도 v3 + recharts 기반으로 동작 중. 따라서 이 작업의 목표는
**0에서 만드는 게 아니라, 네이버페이의 검증된 UX/아키텍처 패턴을 디코딩하여 우리 시세지도의
구체적 갭을 식별하고, 우선순위가 매겨진 개선안을 제시**하는 것.

핵심 통찰: 네이버페이는 "정보 조회" 플랫폼이지만, **우리의 차별화 무기는 구인공고(jobs-nearby) +
중개업소(brokers-nearby) 오버레이** — 즉 "시세지도 위에서 일자리/경쟁업소를 본다"는 구인구직 맥락.
네이버의 UX 완성도는 흡수하되, 차별화 레이어는 우리 고유 자산으로 강화한다.

---

## Part 1. 네이버페이 부동산 시스템 분해 (HTML 디코딩)

### 1.1 기술 스택
| 영역 | 네이버페이 부동산 | 근거 (HTML) |
|------|------|------|
| 프레임워크 | **Next.js App Router + RSC 스트리밍** | `self.__next_f.push`, `MetadataBoundary`/`ViewportBoundary`/Suspense, build id `bDXDfVuNlCEZ6GwJH9nq-` |
| 서버상태 캐시 | **TanStack React Query** | `HydrationBoundary` 컴포넌트 (RSC prefetch → 클라 hydrate) |
| 지도 SDK | **네이버 지도 JS API v3** | `preconnect https://oapi.map.naver.com`, `#main_map` |
| 모니터링 | **Sentry** | 모든 노드에 `data-sentry-component`/`data-sentry-source-file` |
| 분석/로깅 | **NTM(네이버 태그매니저) + nlogs** | `ntm.pstatic.net`, 모든 클릭요소에 `data-nlogs-nsc`/`data-nlogs-area` |
| 광고 | GFP (`gfp-core.js`) | preload |
| 폰트 | 숫자용 **IBM Plex Sans Condensed** | `@font-face IBM`, 금융 수치 가독성 |
| CDN | property.pstatic.net | 정적 자산 분리 |

### 1.2 지도 페이지 아키텍처 (RSC payload에서 추출한 컴포넌트 트리)
```
MapLayout (NSCProvider — 로깅 컨텍스트)
├── MapHydrator        ← 쿠키에서 UI 상태 복원 (map_snb_collapsed=false)
├── MarkerManager      ← 마커를 지도와 분리해 중앙 관리 (별도 레이어)
├── Layout
│   ├── LayerManager   ← 지도 레이어 상태 관리 (URL의 layer 파라미터와 연동)
│   ├── ConfirmModal
│   └── MapPage
│       ├── HydrationBoundary  ← React Query 서버 프리페치 주입
│       ├── LogMapPageView     ← 페이지뷰 로깅
│       └── #main_map (BAILOUT_TO_CLIENT_SIDE_RENDERING — 지도는 CSR)
```
핵심 패턴: **지도는 CSR이지만 데이터는 RSC가 서버에서 프리페치 → React Query로 hydrate.**
초기 데이터가 HTML에 실려 와 첫 페인트가 빠르고, 이후 상호작용은 React Query 캐시로 처리.

### 1.3 URL = 완전한 공유가능 상태 (가장 중요한 UX 패턴)
```
/map?center=3ziamx-2AM6Tw&zoom=14.848587811931846&layer=NobwRAlgJmBcYAsD2BbApmANGAzmghgE4DGCACkfijnCAL50C6QA
```
- `center` — lat/lng를 압축 인코딩(base62류, `-` 구분)
- `zoom` — 평문 소수
- `layer` — **필터/레이어 전체 상태를 압축 직렬화** (`Nobw…` 프리픽스 = JSON→URL 압축 스킴, lz-string/json-url 계열)
- 결과: **어떤 지도 화면이든 URL 하나로 100% 재현·공유·북마크 가능.** canonical/og:url도 이 URL로 생성.

### 1.4 콘텐츠/기능 (좌측 SNB + 부동산 홈 레이어)
- SNB: 홈 / **관심부동산(즐겨찾기)** / 분양(별도 `pre.land.naver.com`) / 뉴스 / **우리집(내집 시세)** / 부동산금융(대출)
- "아파트 매물 동향" 카드:
  - 필터 칩: **매매** + **전체면적** (`ChipsGroup`/`ChipsItem` 디자인시스템 — 재사용 컴포넌트)
  - 지표 셀렉터: **평당가** (토글식 — 다른 지표로 전환 가능)
  - **기간 탭: 1개월 / 6개월 / 1년 / 3년 / 5년** ← 시계열 깊이
  - 라인 차트(평당가 추이) + 로딩 스켈레톤("차트를 만들고 있어요")
- **LazySection**: IntersectionObserver(`InView`)로 스크롤 시 섹션 지연 로드 (min-height 100px 플레이스홀더 ~8개)
- 지도 컨트롤: 줌 +/-(`MapZoomControls`), 우하단 컨트롤 스택

### 1.5 성능 패턴
- 공격적 코드 스플리팅(라우트별 수십 개 청크), preconnect/preload 힌트
- IntersectionObserver 지연 로딩, 숫자 전용 폰트, 지도 CSR + 데이터 RSC 프리페치

---

## Part 2. 벤치마크: 네이버페이 vs 우리 시세지도

| 항목 | 네이버페이 | 우리 시세지도 (현재) | 갭 |
|------|------|------|------|
| 프레임워크 | Next.js App Router + RSC | Next.js 16 App Router (지도 `dynamic ssr:false`) | 동등 |
| 지도 SDK | 네이버 v3 | **네이버 v3** (`ncpKeyId`) | ✅ 동일 |
| 서버상태 캐시 | React Query + RSC 프리페치 | **raw `fetch()` + useState, 캐시 라이브러리 없음** | 🔴 큼 |
| URL 상태 공유 | center/zoom/filter 전체 URL 직렬화 | **없음 (딥링크 불가)** | 🔴 큼 |
| 차트 시계열 | 기간 탭 1M/6M/1Y/3Y/5Y + 지표 토글 | recharts, **기간 탭 없음(최신 6개월 고정)** | 🟡 중 |
| 마커 관리 | MarkerManager(중앙 분리 레이어) | `MarketMap.client` 인라인 | 🟡 중 |
| 마커 색상 | — | **5분위 색상 + 선택 강조** (오히려 우위) | ✅ 우위 |
| 지연 로딩 | IntersectionObserver 섹션 | 없음 | 🟢 소 |
| 분석/로깅 | nlogs 전요소 태깅 | 없음 | 🟡 중 |
| 모니터링 | Sentry | 없음 | 🟡 중 |
| 관심부동산(즐겨찾기) | 있음 | 없음 | 기능 갭 |
| 우리집(내집 시세) | 있음 | 없음 | 기능 갭(낮은 우선순위) |
| 숫자 폰트 | IBM Plex Condensed | 기본 | 🟢 코스메틱 |
| **구인공고 오버레이** | ❌ 없음 | ✅ **jobs-nearby API 보유** | 🟢 **우리 차별화** |
| **중개업소 오버레이** | ❌ 없음 | ✅ **brokers-nearby API 보유** | 🟢 **우리 차별화** |
| AI 인사이트 | ❌ | ✅ Gemini insights | 🟢 우리 차별화 |
| 건축물대장 enrich | ❌(표면상) | ✅ 용적률/건폐율/주차/승강기 | 🟢 우리 우위 |

**요약**: 데이터 파이프라인·마커·차별화 데이터(구인/중개/AI/건축물대장)는 우리가 동등하거나 앞섬.
**뒤처지는 건 "프론트 UX 완성도" 3가지 — ① URL 공유 상태 ② React Query 캐시 ③ 차트 기간 탭.**

---

## Part 3. 구현 플랜 (사용자 확정: 4개 영역 전부 채택)

> 사용자가 **URL 공유 / 차트 기간탭+지표토글 / 구인+중개 레이어 / React Query** 4종 모두 선택.
> 실제 코드 확인 결과를 반영한 4단계 순차 구현. React Query를 1단계 기반으로 깔고,
> 이후 단계의 신규 데이터 호출(차트 기간, 구인/중개)을 처음부터 `useQuery`로 작성해 재작업 방지.

### Phase 1 — React Query 기반 도입 (foundation)
**왜 먼저**: Phase 2~4가 새 fetch를 추가하므로, 데이터 레이어를 먼저 표준화하면 한 번에 올바르게 작성됨.

1. `pnpm add @tanstack/react-query @tanstack/react-query-devtools` (현재 미설치 확인됨).
2. 신규 `src/app/market/MarketQueryProvider.tsx` (`'use client'`) — `QueryClient`+`QueryClientProvider`.
   - `src/app/market/layout.tsx`(서버 컴포넌트, metadata export)에서 `{children}`을 이 프로바이더로 래핑.
3. 신규 `src/lib/market/queries.ts` — 쿼리 키/페처 모음:
   - `useComplexDetail(key)` → `/api/market/complex/[key]` (현 `MarketPageClient.tsx:114`의 fetch + `MarketDetailPanel` 내부 fetch 통합)
   - `useMarketSearch(q)` → `/api/market/search` (현 `MarketSearch.tsx` 250ms 디바운스 유지)
4. `MarketPageClient.tsx`의 단지 상세 `useEffect`(108~119) → `useComplexDetail`로 치환.
   - 지도 points 로딩(`loadData`, 121~256)은 bounds/lawd_cd 폴백 + 클라 집계 로직이 무거워 **이번엔 그대로 두고** `useQuery` wrapper만 씌우는 것도 가능(점진). 최소 변경: 상세/검색부터 전환.

**대상**: `src/app/market/layout.tsx`, 신규 `MarketQueryProvider.tsx`, 신규 `src/lib/market/queries.ts`, `MarketPageClient.tsx`, `MarketDetailPanel.tsx`, `MarketSearch.tsx`.

### Phase 2 — URL 상태 동기화 (딥링크/공유) ★ 네이버 핵심 UX
- 현재 `MarketPageClient.tsx`의 `center`(86) `dealType`(92) `property_type`(91) `lawd_cd`(87) `areaBand/ageBand/householdBand`(93-95) `selectedKey`(98)가 useState 전용 → URL 미반영. `zoom`은 `<MarketMap zoom={14}>`(410)로 고정이라 공유하려면 state로 승격.
- 개선: `useSearchParams`+`useRouter().replace`로 평문 쿼리 동기화 (압축 불필요, MVP):
  `?lat=&lng=&zoom=&deal=&type=&region=&area=&age=&hhld=&sel=`
  - 초기 마운트: URL → 초기 state 복원.
  - state 변경 시: `router.replace`(scroll 막기, history 오염 방지)로 URL 갱신. 지도 idle bounds 변경은 `lat/lng/zoom`만 갱신(쿼리 폭주 방지 위해 디바운스).
- **주의**: `useSearchParams`는 Suspense 경계 필요 → 페이지를 `<Suspense>`로 감싸거나 layout에서 처리.
- 효과: 단지 선택/필터/위치 화면을 URL 하나로 카톡 공유·새로고침 복원. canonical도 동적화 가능.
- **대상**: `MarketPageClient.tsx`, `src/app/market/page.tsx`(Suspense 경계).

### Phase 3 — 차트 기간 탭 + 지표 토글
**3a. 기간 탭 (1M / 6M / 1Y / 3Y / 5Y)**
- 실제 확인: `/api/market/complex/[key]/route.ts`는 **6개월 하드코딩**(`.limit(6)` line 32, `sixMonthsAgo` line 35-37). `?range=` 파라미터 없음 → **신설 필요**.
- 라우트 수정: `?range=1m|6m|1y|3y|5y` 파싱 → 월 수 매핑 → MV `.limit(n)` + raw tx `gte(date)` 동적화.
- UI: `MarketGraphPanel.tsx` 상단(line 86 헤더 영역)에 기간 탭 추가, 선택 시 `useComplexDetail(key, range)` 리페치(Phase 1 RQ 활용).
- **정직한 제약**: `sync-transactions` cron이 기본 최근 3개월만 수집 → MV에 장기 데이터 부족. **1Y/3Y/5Y 탭은 UI는 만들되, 실데이터는 백필 필요** (`/api/cron/sync-transactions?months=...` 다회 실행으로 과거 축적). 데이터 없는 기간은 "데이터 누적 중" 안내.

**3b. 지표 토글 (평당가 ↔ 매매가 ↔ 전세가율)**
- API가 이미 `avg_pyeong_price`/`avg_price_manwon`(monthly_split)/`lease_ratio` 반환 → UI 토글만.
- `MarketGraphPanel.tsx` 차트 dataKey/formatter를 선택 지표에 따라 분기(현 line 173-185 Line 영역).
- (선택) 지도 마커 라벨 지표 전환은 `MarketMap.client.tsx` — 2차.
- **대상**: `src/app/api/market/complex/[key]/route.ts`, `MarketGraphPanel.tsx`.

### Phase 4 — 구인공고 + 중개업소 레이어 ★ 우리 차별화 (네이버엔 없음)
**실제 확인된 제약**:
- `brokers-nearby` → **latitude/longitude 보유** → 지도에 실제 마커 가능.
- `jobs-nearby` → `region/address`만, **lat/lng 없음**(route line 18). → 정밀 마커 불가.

**현실적 설계**:
1. **중개업소**: `brokers-nearby?lawd_cd=` → 지도에 보조 마커 레이어(토글 on/off). 단지 마커와 시각 구분(다른 색/아이콘).
2. **구인공고**: 정밀 핀 대신 **"이 지역 채용 N건" 오버레이 패널/배지** — 현재 viewport의 중심 lawd_cd로 `jobs-nearby` 조회, 리스트로 표시. 클릭 시 공고 상세로. (정밀 핀은 jobs 주소 지오코딩이 선행돼야 하므로 차후 — `geocode-complexes` 패턴 재사용 가능.)
3. 레이어 토글 UI: 필터바(2번째 row, line 343 영역)에 "중개업소"/"구인공고" 토글 칩 추가.
- 데이터 호출은 Phase 1 RQ(`useBrokersNearby`, `useJobsNearby`)로 작성.
- **대상**: `MarketMap.client.tsx`(브로커 마커 레이어), `MarketPageClient.tsx`(토글+구인 패널), `src/lib/market/queries.ts`(신규 훅).

### 차후(여력 시, 이번 범위 외)
- 관심단지(즐겨찾기) — `market_alerts`/`map_waitlist` + Supabase Auth.
- 분석 로깅(nlogs류), Sentry/Vercel 모니터링(과거 지도 SDK auth 실패·지오코딩 502 이력).
- 숫자 폰트(Condensed), LazySection.
- RSC 프리페치(HydrationBoundary)로 첫 페인트 데이터 주입(React Query 2단계 심화).

---

## Part 4. 검증 방법
- `NEXT_PUBLIC_MARKET_ENABLED=true` 설정 후 `pnpm dev` → `/market` 진입.
- **Phase 1**: React Query Devtools에서 `complex/[key]`·`search` 캐시 히트 확인, 같은 단지 재선택 시 네트워크 미발생.
- **Phase 2**: 단지 선택/필터/지도 이동 → 주소창 쿼리 갱신 → 그 URL을 새 탭에 붙여넣어 동일 화면 복원 확인. 뒤로가기 history 오염 없음 확인.
- **Phase 3a**: 기간 탭 클릭 → `?range=` 리페치 → recharts 정상 렌더. 장기 탭은 데이터 부족 안내 노출 확인.
- **Phase 3b**: 지표 토글(평당가/매매가/전세가율) → 차트 축·값 전환 확인.
- **Phase 4**: 중개업소 토글 → `brokers-nearby` 마커 표시(좌표 일치). 구인공고 토글 → 현재 지역 공고 리스트 = `jobs-nearby?lawd_cd=` 응답 일치.
- **회귀**: 기존 bounds 모드 단지 마커(5분위 색상/선택 강조 1.18×)·모바일 bottom sheet·AI 인사이트 링크 정상 유지. `pnpm build` 타입체크 통과.

## 산출물
- 이 분석/플랜 문서를 `claudedocs/naver-land-benchmark.md`로도 복제 저장(레포 내 공유용).
