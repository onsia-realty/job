# Onsia Job Project Memory

## Project Structure
- **Root**: `D:\claude\onsia-Job\onsia-job\` (note: nested `onsia-job` dir)
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Supabase (no Prisma/ORM - direct Supabase client)
- **Auth**: Supabase Auth via `AuthContext` + `useAuth()` hook
- **Icons**: Lucide React

## Key Patterns
- Components in `src/components/shared/`, `src/components/{feature}/`
- API routes use `NextRequest`/`NextResponse` from `next/server`
- Auth in API: Get Bearer token from header → `supabaseAdmin.auth.getUser(token)`
- Server Supabase: Use service role key (`SUPABASE_SERVICE_ROLE_KEY`) in `src/lib/supabase-server.ts`
- Client Supabase: `src/lib/supabase.ts` (re-exports from `auth.ts`) and `src/lib/auth.ts` (singleton Proxy)

## ⚠️ Supabase RLS + ES256 JWT 문제 (Critical)
- 자세한 내용: [supabase-rls-issue.md](supabase-rls-issue.md)

## 협업 방식
- 오픈 전 점검 자율 진행: [feedback_prelaunch_autonomy.md](feedback_prelaunch_autonomy.md) — 작은 수정 즉시, 큰 변경만 확인

## 🔒 관리자 페이지 규칙 (보안)
- 관리자 UI는 `/onsia` 전용: [project_admin_route.md](project_admin_route.md) — `/admin` 경로는 해킹 위험으로 금지

## npm Issues
- Mixed pnpm artifacts in node_modules caused install failures
- Fix: `rm -rf node_modules/.pnpm` then `npm install`
- `.env.local` contains actual API keys (be careful with git)

## ⚠️ .env 파일 수정 금지 명령 (Critical)
- 자세한 내용: [feedback_never_sed_env.md](feedback_never_sed_env.md) — `.env*` 파일은 무조건 Read → Edit. sed -i / redirect 금지.

## 🔑 .env.local 키 인벤토리
- 키 이름/용도 목록: [project_env_inventory.md](project_env_inventory.md) — **값은 저장 금지**, 파일/Vercel 참조

## 🗺️ 카카오 디벨로퍼스 앱 구성 (2026-04-27, 참고용)
- 온시아 계정 두 앱 + '1앱-1서비스' 정책: [project_kakao_apps.md](project_kakao_apps.md) — 시세지도는 네이버로 재전환되어 현재 카카오 키 미사용

## 🗺️ NCP Maps 계정/Application/키 (2026-05-11)
- 위치와 키 인벤토리: [project_ncp_maps_account.md](project_ncp_maps_account.md) — 콘솔 경로는 `/maps/application` (AI·NAVER API 아님!)

## ⚠️ NCP Maps SDK 파라미터: ncpKeyId (Critical)
- 옛 `ncpClientId`는 deprecated, silent fail: [feedback_ncp_maps_keyid_param.md](feedback_ncp_maps_keyid_param.md) — 인증 실패 시 가장 먼저 확인

## CSS 트랩: flex item 안 height:100%
- 0으로 계산되는 케이스 + 회피법: [feedback_flex_height_100pct_trap.md](feedback_flex_height_100pct_trap.md)

## Pre-existing TS Errors
- SecurityShield.tsx, Honeypot.tsx, dnaQuestions.ts have type errors (not from our changes)

## AI Photo Feature (2026-02-09)
- Files: `src/lib/ai-photo.ts`, `src/lib/supabase-server.ts`, `src/lib/validations/ai-photo.ts`
- API: `/api/ai-photo/generate`, `/api/ai-photo/save`, `/api/ai-photo/history`
- UI: `src/components/ai-photo/` (4 components) + `src/app/profile/ai-photo/page.tsx`
- DB: `ai_photo_generations` table (SQL migration in `supabase/migrations/`)
- Storage: `ai-photos` bucket (originals/, generated/)
- AI: Google Gemini 2.5 Flash via `@google/genai`

## Social Login → Signup Flow (2026-02-24)
소셜 로그인(카카오/구글) 후 신규 유저는 회원가입 폼으로 이동하여 필수 정보 수집

### 수정 파일
- `src/app/agent/auth/login/page.tsx` — localStorage에 role 저장, Google GIS는 activeRoleRef 사용 (재초기화 방지)
- `src/app/agent/auth/callback/page.tsx` — ensureUserRecord 응답으로 신규/기존 분기
- `src/app/agent/auth/signup/page.tsx` — `social=true` 모드: 이메일 readonly, 비밀번호 숨김, complete-profile API 호출
- `src/app/api/auth/complete-profile/route.ts` — 신규 API: users 테이블 + auth 메타데이터 업데이트

### 핵심 로직
- 카카오: OAuth redirect → callback에서 `ensureUserRecord` → created면 signup으로
- 구글: GIS id_token → login에서 직접 `ensureUserRecord` → created면 signup으로
- signup `social=true`: `updateUserMetadata()` + `/api/auth/complete-profile` 호출
- `ensure-user` API: 이미 `created`/`exists` 응답 제공 (수정 불필요)

### UI 변경
- 소셜 모드: 헤더 "추가 정보 입력", 버튼 "프로필 등록하기", 안내 배너 표시
- 기업회원: 이름 라벨 → "이름(기업명)", placeholder "이름 또는 기업명을 입력하세요"
- 사업자번호 필드 추가 (선택, 연락처 아래, 포맷 000-00-00000)

### Google GIS 재초기화 버그 수정
- 원인: `handleGoogleCredential`이 `activeRole` 의존 → 탭 전환마다 GIS 재초기화 → 403 에러
- 해결: `activeRoleRef` 사용, useCallback dependency에서 `activeRole` 제거

## NEWS TOON (뉴스툰) Feature (2026-02-25)
- Core: `src/lib/ai-toon.ts` — 3단계 파이프라인 (기사→스크립트→이미지)
- Models: `gemini-2.5-flash` (text), `gemini-3-pro-image-preview` (image)
- DB: `news_toon_episodes` table, Storage: `ai-photos` bucket > `toon-images/`
- Branding: "BOOIN NEWS TOON" header + per-panel "BOOIN" watermark
- Panels: 6~8컷 (2xN grid layout)
- **⚠️ CRITICAL RULE: 이전 생성 이미지 절대 삭제 금지** — Supabase Storage에서 항상 새 파일 생성, toon_image_url만 업데이트. 이전 이미지 파일은 보존.

## Test Infrastructure (2026-02-28)
- **Runner**: Vitest 4 + jsdom + @testing-library/react
- **Config**: `vitest.config.ts` (루트), `src/__tests__/setup.ts` (env stub)
- **Scripts**: `npm test`, `npm run test:watch`, `npm run test:coverage`
- **Convention**: 소스 옆 co-locate (`*.test.ts`), 한글 테스트명
- **레퍼런스 테스트 4개** (74 tests 전체 통과):
  - `src/lib/commission-calculator.test.ts` — 순수 함수 정석
  - `src/lib/toss.test.ts` — 유틸 + 설정 데이터
  - `src/lib/validations/ai-photo.test.ts` — Zod 스키마 + 파일 검증
  - `src/app/api/business-verify/route.test.ts` — 미export 함수 복제 패턴
- **Skill**: `.claude/skills/testing-skill.md` — 테스트 작성 가이드
- **Known Issue**: commission-calculator 부동소수점 정밀도 (Math.floor + 0.7% → 1원 차이)

## 조직 & 팀 스킬 (2026-02-28)
- **대표**: 연대겸 / 온비스·온디아
- **AI 팀 5인**: PM이사, Product매니저, Design디자이너, Tech리드, Growth매니저
- **TEAM_SKILL.md** (프로젝트 루트): 5인 역할 정의 + 호출 규칙 + 회의 모드
- **PROJECT_INSTRUCTIONS.txt** (프로젝트 루트): Claude.ai Project Instructions용 짧은 규칙
- 호출: "Tech, ~" → 단독 답변 / "팀 회의" → 5인 순차 검토 → PM 최종 정리

## Memory & Context System (2026-02-26)
- **PROGRESS.md** (프로젝트 루트): 단기 기억 — 현재 진행 상황, 미해결 이슈, 다음 계획
- **MEMORY.md** (여기): 장기 기억 — 프로젝트 구조, 패턴, 주요 결정사항
- **memory-skill.md** (`.claude/skills/`): 메모리 유지 규칙 스킬
- **세션 시작 시**: 반드시 PROGRESS.md → MEMORY.md → 관련 스킬 순서로 읽기
- **세션 종료 시**: 반드시 PROGRESS.md 업데이트 (작업 내용, 미해결 이슈, 다음 단계)

## 토스페이먼츠 결제 시스템 (2026-04-08)
- **SDK**: `@tosspayments/tosspayments-sdk` (결제위젯 방식)
- **상점 MID**: `booinbjhvj` (심사 완료)
- **키 종류**: 결제위젯 연동 키 사용 (`gck_`/`gsk_` 접두사, `ck_`/`sk_` 아님!)
- **Vercel 환경변수**: `NEXT_PUBLIC_TOSS_CLIENT_KEY` (live_gck_), `TOSS_SECRET_KEY` (live_gsk_)
- **결제 흐름**: checkout → 토스 위젯 → success 페이지 → confirm API → DB 기록
- **웹훅**: `/api/payment/webhook` — 토스 API 재검증 방식 (TOSS_WEBHOOK_SECRET은 선택)
- **상품**: 6종 (agent-basic/premium/vip, sales-premium/superior/unique) — `src/lib/toss.ts`
- **부가세**: 10% VAT 별도 — `getVat()`, `getTotalPrice()` 유틸 (공급가액 + 부가세 = 총액)
- **DB**: `payments` 테이블 (payment_status: completed/refunded/failed), 금액은 totalPrice(VAT 포함) 기준
- **취소 시**: 웹훅이 자동으로 payment_status → refunded, jobs.tier → normal 복구
- **검증 완료**: 테스트키 + 라이브키 결제/취소 전체 플로우 (2026-04-06)

## 오픈 전 점검 현황 (2026-05-11 최신)
- [x] 회원가입 플로우 점검 (8건 수정)
- [x] 결제/보안 인프라 (4건 수정)
- [x] 토스페이먼츠 라이브 결제/취소 검증
- [x] Vercel 환경변수 정리 (CRON_SECRET, TOSS 라이브 키)
- [x] 모바일 반응형 점검 (2026-04-24)
- [x] 핵심 플로우 E2E 점검 (2026-04-24)
- [x] Supabase RLS 라이브 테스트 (017, 018 마이그레이션 적용)
- [x] 도메인/SSL 설정 확인 (2026-04-27)
- [x] 시세지도 라이브 동작 (2026-05-11, 네이버 지도 + 마커 정상)

## 시세지도 (Market Map) Feature (2026-04-24 ~ 2026-05-11)
- **데이터**: 국토부 실거래가 OPEN API (`DATA_GO_KR_API_KEY`, data.go.kr — 활용신청 완료)
- **지도**: 네이버 클라우드 Maps JS API v3 (`NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 환경변수, NCP `booin-market` Application)
- **상태 (2026-05-11)**: ✅ 라이브 정상 작동 (지도 + 마커 표시 확인)
- **SDK 로딩 패턴**: `MarketPageClient.tsx`에서 `next/script strategy="afterInteractive"`로 단 한 번 로드, `MarketMap.client.tsx`는 `window.naver.maps` 폴링 후 사용
- **⚠️ SDK URL**: `?ncpKeyId=KEY` 사용 (옛 `ncpClientId`는 silent fail — 별도 메모 참조)
- **수집**: Vercel Cron `/api/cron/sync-transactions` (maxDuration 300, 병렬)
- **DB**: `price_transactions` 테이블
- **핵심 파일**: `src/components/market/MarketMap.client.tsx`, `src/lib/market/realEstate.ts`, `src/lib/market/aggregateByComplex.ts`
- **마이그레이션 026**: plain column UNIQUE INDEX 재생성 (PostgREST onConflict 호환) — 라이브 적용 ✅
- **⚠️ upsert 패턴**: nullable 컬럼은 NOT NULL DEFAULT (0/'') 정규화 필수. 함수식 unique index는 PostgREST onConflict 불호환.
- **페이지**: `/market` (지도), `/market/[complex]` (단지상세), `/market/rankings` (랭킹)
- **MarketMap height 트랩 fix**: outer wrapper에 `position: absolute; inset: 0` 사용 (flex item 안 height:100% 0 계산 회피)

# currentDate
Today's date is 2026-04-25.
