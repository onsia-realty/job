# PROGRESS.md — 온시아 Job 프로젝트 진행 상황

> 이 파일은 Claude의 세션 간 컨텍스트 유지를 위한 **단기 기억 파일**입니다.
> 세션 시작 시 반드시 읽고, 종료 시 반드시 업데이트합니다.

---

## 마지막 작업 (2026-04-25)

### 시세지도 upsert 버그 수정 + 마이그레이션 적용 ✅

**문제**: `020` 마이그레이션에서 생성한 UNIQUE INDEX가 함수식(`COALESCE(jibun, '')` 등)으로
만들어져 PostgREST의 `onConflict` 매칭 불가 → 모든 upsert 실패

**수정 내용** (커밋 `2015d75`):
- `supabase/migrations/026_fix_unique_index_for_upsert.sql`
  - nullable 컬럼 → NOT NULL + DEFAULT 정규화 (jibun, exclusive_area, floor, price_manwon 등)
  - plain column UNIQUE INDEX 재생성 (`idx_pt_unique_deal`)
- `src/lib/market/realEstate.ts` — transform 함수 null → 0/'' 반환 (schema 정규화 대응)
- `src/app/market/MarketPageClient.tsx` — 1개월 고정 → 최근 3개월 순차 시도 (데이터 밀도 확보)
- `src/app/api/market/complex/[key]/route.ts` — complex_name, dong 필드 select 추가

**Supabase 라이브 적용**: ✅ "Success. No rows returned"
**GitHub push**: ✅ `e0ee41d..2015d75`

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
