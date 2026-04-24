# PROGRESS.md — 온시아 Job 프로젝트 진행 상황

> 이 파일은 Claude의 세션 간 컨텍스트 유지를 위한 **단기 기억 파일**입니다.
> 세션 시작 시 반드시 읽고, 종료 시 반드시 업데이트합니다.

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
- `supabase/migrations/017_security_hardening.sql` — 치명적 RLS 구멍 5개 차단:
  1. jobs UPDATE: `USING (true)` → `auth.uid() = user_id` (**누구나 모든 공고 수정 가능 상태였음**)
  2. news_toon_episodes: RLS 비활성화 → 활성화 + published 공개 SELECT만
  3. broker_offices: INSERT/UPDATE `USING (true)` → service_role만
  4. jobs INSERT: `WITH CHECK (true)` → `auth.uid() = user_id`
  5. storage.job-images: 누구나 업로드 → authenticated만

**중요**: 기존 API 라우트는 service_role로 DB 작업하므로 이 마이그레이션 적용해도 기능 영향 없음.

- `supabase/migrations/018_drop_stale_jobs_select.sql` — ✅ 적용 완료. 002에서 남은 `"Anyone can view jobs" USING (true)` 중복 SELECT 정책 제거. (이전까지 비활성 공고도 anon에 노출 가능했음)

**라이브 검증 결과** (pg_policies 조회):
- jobs 정책 4개: DELETE/INSERT/UPDATE는 본인만, SELECT는 `is_active = true`만
- news_toon_episodes RLS 활성화 + published만 공개 SELECT
- broker_offices는 SELECT만 남고 INSERT/UPDATE는 service_role 전용

### 모바일 반응형 점검 (Playwright 360×780)

검증 페이지: `/`, `/agent`, `/sales`, `/agent/auth/signup`, `/agent/auth/login`, `/toon`

**발견 이슈 + 수정**:
- 🔴 `/sales/{mypage,talents,search}` + `/sales/auth/login,signup` dead link (Header.tsx) → 신규 redirect/placeholder 6개 생성
- 🔴 `/agent/auth/login` Google GIS 버튼 width:400 하드코딩 → 컨테이너 폭 기반 동적 계산 + `max-w-[400px] overflow-hidden`
- 🟡 `/agent/talents` dead link (employer 메뉴) → placeholder 생성
- 🟡 헤더 로그인/마이페이지 버튼 32x40 → `min-h-[44px] min-w-[44px]`
- 🟢 `/icon.svg` 404 → `public/icon.svg` 생성 (blue-cyan gradient B 로고)
- 🟢 `apple-touch-icon.png` 404 → layout.tsx에서 참조 제거

**생성/수정 파일**:
- 생성: `src/app/sales/mypage/page.tsx` (redirect)
- 생성: `src/app/sales/search/page.tsx` (redirect)
- 생성: `src/app/sales/auth/login/page.tsx` (redirect with role param)
- 생성: `src/app/sales/auth/signup/page.tsx` (redirect with role param)
- 생성: `src/app/sales/talents/page.tsx` (준비중 placeholder)
- 생성: `src/app/agent/talents/page.tsx` (준비중 placeholder)
- 생성: `public/icon.svg`
- 수정: `src/app/agent/auth/login/page.tsx` (Google 버튼 반응형)
- 수정: `src/components/shared/Header.tsx` (터치 타깃 44px)
- 수정: `src/app/layout.tsx` (apple-touch-icon 참조 제거)

**검증**: `npx tsc --noEmit` + `npm run build` 둘 다 EXIT=0 통과
**배포 전 상태**: 코드는 준비됨. Vercel 배포 후 라이브에서 재확인 필요

---

## 마지막 작업 (2026-04-08)

### 최신 커밋 (2026-04-06 ~ 04-08)

#### 1. 결제 금액 부가세(10%) 적용 `6ffc1c1`
- **toss.ts**: `getVat()`, `getTotalPrice()` 유틸 함수 추가
- **checkout**: 위젯 금액 부가세 포함, 공급가액/부가세/총액 breakdown UI
- **confirm API**: 금액 검증·DB 저장·응답 모두 totalPrice 기준으로 통일
- **success**: 클라이언트 금액 검증도 `getTotalPrice()` 사용
- **premium**: 가격표에 '부가세(10%) 별도' 안내 문구 + 애니메이션

#### 2. 오픈 전 전면 점검 `b957c60`
- 회원가입: 소셜 로그인 프로필 완성 시 중개사 필드 누락 수정
- 회원가입: 서버사이드 유효성 검증 강화, 이메일/전화번호 중복 체크
- 결제: success 페이지 세션 로딩 대기 후 confirm API 호출 (401 수정)
- 보안: 미들웨어 외부 서비스 콜백 경로 면제, 웹훅 시크릿 검증
- 인증: 비밀번호 찾기/재설정 페이지 신규 추가

#### 3. EP.005 파크로쉬 서울원 뉴스툰 `52dad79`
- `scripts/generate-parkroshe-toon.js` — AI 헬스케어 뉴스툰 생성 스크립트

#### 4. 토스페이먼츠 라이브 결제 검증 ✅
- 테스트 키 + 라이브 키 전체 플로우 (결제/취소/웹훅) 검증 완료

---

## 미해결 이슈
- Pre-existing TS 에러: SecurityShield.tsx, Honeypot.tsx, dnaQuestions.ts (우리 변경과 무관)
- 뉴스툰 EP.003, EP.004의 패널 중복 이미지 (향후 생성분부터 짝수 강제 적용됨)
- commission-calculator 부동소수점 정밀도 이슈 (Math.floor + 0.7% → 1원 차이)

---

## 다음 단계 (오픈 전 남은 체크리스트)
- [ ] 모바일 반응형 점검
- [ ] 핵심 플로우 E2E 점검
- [ ] Supabase RLS 라이브 테스트
- [ ] 도메인/SSL 설정 확인

---

## 활성 스킬 문서
| 스킬 | 파일 | 설명 |
|---|---|---|
| 뉴스툰 생성 | `webtoonskill.md` | 뉴스 → AI 웹툰 변환 파이프라인 |
| 메모리 유지 | `.claude/skills/memory-skill.md` | 세션 간 컨텍스트 유지 규칙 |
| 테스팅 가이드 | `.claude/skills/testing-skill.md` | 테스트 작성 컨벤션 + 워크플로우 |
| 팀 스킬 | `TEAM_SKILL.md` | 5인 AI 팀 역할 + 회의 모드 |
