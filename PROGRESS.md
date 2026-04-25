# PROGRESS.md — 온시아 Job 프로젝트 진행 상황

> 이 파일은 Claude의 세션 간 컨텍스트 유지를 위한 **단기 기억 파일**입니다.
> 세션 시작 시 반드시 읽고, 종료 시 반드시 업데이트합니다.

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
- [ ] 공공데이터포털 API 키 온시아 서비스 활용신청 확인 (완료)
- [ ] cron 실거래가 데이터 수집 정상 동작 확인 (upsert 수정 후 첫 실행)
- [ ] 지도 페이지 라이브 테스트 (`/market`)

### 오픈 전 남은 체크
- [ ] 도메인/SSL 설정 확인

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
