# PROGRESS.md — 온시아 Job 프로젝트 진행 상황

> 이 파일은 Claude의 세션 간 컨텍스트 유지를 위한 **단기 기억 파일**입니다.
> 세션 시작 시 반드시 읽고, 종료 시 반드시 업데이트합니다.

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
