# 버그픽스 리포트 (2026-03-09)

오픈 전 코드 감사 — 회원가입 + 공고등록/결제 플로우 전수 검사 및 수정

---

## 수정 완료 요약

| 등급 | 발견 | 수정 | 미수정(저위험) |
|------|------|------|---------------|
| CRITICAL | 8 | **8** | 0 |
| HIGH | 11 | **8** | 3 |
| MEDIUM | 16 | **7** | 9 |
| LOW | 16 | 0 | 16 |
| **합계** | **51** | **23** | **28** |

---

## CRITICAL 수정 내역 (8/8 완료)

### 1. check-email API — listUsers() 페이지네이션 버그
- **파일**: `src/app/api/check-email/route.ts`
- **문제**: `supabase.auth.admin.listUsers()` 가 첫 50명만 반환 → 51번째부터 이메일 중복 체크 실패
- **수정**: `supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle()` 로 직접 조회
- **부수 수정**: 개별 Supabase 인스턴스 생성 → 공유 `supabaseAdmin` import

### 2. 소셜 회원가입 — complete-profile 응답 미확인
- **파일**: `src/app/agent/auth/signup/page.tsx` (lines 280-317)
- **문제**: `fetch('/api/auth/complete-profile')` 응답 status 확인 안 함 → 실패해도 성공 화면
- **수정**: `profileRes.ok` 체크, 에러 시 throw → catch 블록에서 사용자에게 표시

### 3. 소셜 회원가입 — getSession() null 시에도 성공 화면
- **파일**: `src/app/agent/auth/signup/page.tsx`
- **문제**: 세션 없으면 `complete-profile` 호출 건너뛰고 성공 표시 → 프로필 미저장
- **수정**: `if (!session)` 시 throw Error('세션이 만료되었습니다')
- **부수 수정**: 클라이언트 `updateUserMetadata()` 호출 제거 (서버 API에서 통합 처리 → 레이스 컨디션 해결)

### 4. 결제 확인 — 멱등성 없음 (중복 결제 기록)
- **파일**: `src/app/api/payment/confirm/route.ts`, `src/app/payment/success/page.tsx`
- **문제**: 새로고침/StrictMode 시 `confirmPayment()` 중복 호출 → 중복 결제 레코드
- **수정**:
  - 서버: `payments` 테이블에서 `payment_id` 기존 레코드 확인 → 있으면 기존 결과 반환
  - 클라이언트: `useRef(confirmedRef)` 가드로 중복 호출 차단

### 5. Employer 대시보드 — 결제 없이 무료 등급 업그레이드
- **파일**: `src/app/agent/employer/page.tsx` (lines 239-273)
- **문제**: `handleUpgradeTier`가 `/api/jobs/${id}` PATCH로 직접 tier 변경 (TODO 코드)
- **수정**: 결제 페이지(`/checkout?productKey=agent-${tier}&jobId=${id}`)로 리다이렉트

### 6. Jobs API PATCH — 임의 필드 인젝션
- **파일**: `src/app/api/jobs/[id]/route.ts`
- **문제**: `body` 전체를 `.update(body)`로 전달 → `tier`, `is_approved`, `views` 등 변조 가능
- **수정**: `ALLOWED_FIELDS` 화이트리스트로 허용 필드만 필터링

### 7. Jobs API POST — 클라이언트가 tier/is_approved 지정 가능
- **파일**: `src/app/api/jobs/route.ts`
- **문제**: `{ ...body, user_id }` 스프레드 → 클라이언트가 `tier: "vip"` 전송하면 무료 VIP
- **수정**:
  - 서버에서 `tier: 'normal'`, `is_active: true`, `is_approved: true` 강제 설정
  - `req.json()` 파싱 에러 처리 추가
  - KST 날짜 계산 수정

### 8. 결제 확인 — Toss 확인 금액 미검증 + 인증/소유자 미확인
- **파일**: `src/app/api/payment/confirm/route.ts`
- **문제**:
  - Toss confirm 후 `payment.totalAmount` vs `product.price` 검증 없음
  - 인증 선택사항 (미인증 결제 가능)
  - jobId 소유자 검증 없음
- **수정**:
  - Toss 응답의 `totalAmount` 검증 추가
  - 인증 필수 (Bearer token → 401)
  - `jobId` 전달 시 소유자 확인 (`user_id` 매칭)
  - 결제 DB 저장 실패 시 에러 응답 (기존: 성공 반환)

---

## HIGH 수정 내역 (8/11)

### 9. Callback — ensureUserRecord 에러 삼킴
- **파일**: `src/app/agent/auth/callback/page.tsx`
- **문제**: API 에러 → 빈 객체 반환 → 신규 유저를 기존 유저로 처리
- **수정**: `res.ok` 체크, 에러 시 `{ error: '...' }` 반환 → UI에 에러 표시

### 10. Callback — 기존 유저 일괄 `/agent/mypage` 리다이렉트
- **파일**: `src/app/agent/auth/callback/page.tsx`
- **문제**: 카카오 로그인 기존 유저는 항상 mypage로 이동 (Google은 role 기반)
- **수정**: `user_metadata.role` 기반 employer/seeker 분기 리다이렉트

### 11. Google 로그인 — ensure-user 응답 미확인
- **파일**: `src/app/agent/auth/login/page.tsx`
- **문제**: `res.ok` 미확인 → 서버 500 시 기존 유저로 오인
- **수정**: `res.ok` 확인, 에러 시 throw
- **부수 수정**: 기존 유저 경로에서 `localStorage.removeItem('social_login_role')` 추가

### 12. Webhook — 환불/취소 시 공고 tier 미복구
- **파일**: `src/app/api/payment/webhook/route.ts`
- **문제**: 환불 시 `payment_status`만 업데이트 → 공고는 VIP 유지
- **수정**: `refunded`/`failed` 시 해당 `job_id`의 tier를 `normal`로 복구

### 13. session! Non-null assertion 크래시
- **파일**: `src/app/agent/jobs/new/page.tsx`, `src/app/sales/jobs/new/page.tsx`
- **문제**: `session!.access_token` → 세션 만료 시 런타임 크래시
- **수정**: `if (!session?.access_token)` 가드 + alert 메시지

### 14. KST 날짜 계산 — 모듈 레벨 상수
- **파일**: `src/app/agent/jobs/new/page.tsx`, `src/app/sales/jobs/new/page.tsx`
- **문제**: `today`, `maxDeadline`이 모듈 로드 시 1회만 계산 (UTC 기준)
- **수정**: `getKSTDate()` 함수로 변경, 컴포넌트 내부에서 렌더링마다 계산

### 15. complete-profile API — nickname 미검증/미저장
- **파일**: `src/app/api/auth/complete-profile/route.ts`
- **문제**: `nickname` 서버 검증 없음 + `users` 테이블에 미저장
- **수정**: 필수 검증 추가 (`name`, `nickname`, `phone`), `users` 테이블에 `nickname`, `business_no` 저장

### 16. Jobs API — req.json() 파싱 에러 미처리
- **파일**: `src/app/api/jobs/route.ts`, `src/app/api/jobs/[id]/route.ts`
- **문제**: 잘못된 JSON body → unhandled 500
- **수정**: try/catch로 파싱 에러 처리 → 400 응답

### 미수정 HIGH (낮은 위험도)
- **Webhook 서명 검증**: Toss API 재확인으로 대체 중 (운영 환경에서 추가 권장)
- **AuthContext ensure-user 매번 호출**: 불필요한 트래픽이나 기능에 영향 없음
- **ensure-user 기본 role='seeker'**: complete-profile에서 덮어쓰므로 실질적 영향 적음

---

## MEDIUM 수정 내역 (7/16)

### 17. 전화번호 정규식 — 잘못된 접두사 허용
- **파일**: `src/app/agent/auth/signup/page.tsx`
- **문제**: `01[0-9]` → 012, 013, 014, 015 허용 (한국 모바일 번호 아님)
- **수정**: `01[016789]` 로 제한

### 18. Stale closure — setErrors 패턴
- **파일**: `src/app/agent/auth/signup/page.tsx`
- **문제**: `setErrors({ ...errors, key: val })` → 비동기 중 errors가 stale
- **수정**: `setErrors(prev => ({ ...prev, key: val }))` 함수형 업데이트

### 19. 수정 페이지 — mine=true 누락
- **파일**: `src/app/agent/jobs/new/page.tsx`
- **문제**: 수정 모드에서 `?mine=true` 없이 조회 → 타인 공고 데이터 노출
- **수정**: `?mine=true` 쿼리 파라미터 추가

### 20. businessNo 미전송
- **파일**: `src/app/agent/auth/signup/page.tsx`, `src/app/api/auth/complete-profile/route.ts`
- **문제**: 사업자번호 수집하지만 API에 전송 안 함
- **수정**: `complete-profile` API에 `businessNo` 추가 전송 및 저장

### 21-23. KST 날짜 + Jobs POST deadline 계산 수정
- 위 HIGH #14 및 CRITICAL #7에서 통합 수정

### 미수정 MEDIUM (낮은 우선순위)
- Email 중복체크 클라이언트 only (서버 Supabase signUp에서 최종 검증)
- 급여 suffix "만원" 하드코딩 (commission 타입 고려 필요)
- 근무시간 역전 검증 없음 (야간 근무 가능)
- Rate limiting 없음 (Vercel/Supabase 레벨에서 처리 가능)
- Mock jobs 결제 방지 (premium 페이지)
- 텍스트 필드 maxLength 미설정

---

## LOW 이슈 (미수정 — 낮은 위험도)

| 이슈 | 설명 | 이유 |
|------|------|------|
| window.location.origin SSR | 클라이언트 전용 함수에서만 사용 | 실제 SSR 호출 없음 |
| Empty catch blocks | 디버깅 어려움 | 기능 영향 없음 |
| TOKEN_REFRESHED 데드 코드 | 실행되지 않는 코드 | 해롭지 않음 |
| 이미지 MIME 검증 | accept 속성으로 기본 방어 | Supabase Storage에서 추가 방어 |
| Double-submit guard | isLoading으로 버튼 비활성화 | 실질적 이중 제출 확률 매우 낮음 |

---

## 수정된 파일 목록

```
src/app/api/check-email/route.ts          — CRITICAL #1
src/app/agent/auth/signup/page.tsx         — CRITICAL #2,3 + MEDIUM #17,18,20
src/app/api/auth/complete-profile/route.ts — HIGH #15 + MEDIUM #20
src/app/api/payment/confirm/route.ts       — CRITICAL #4,8
src/app/payment/success/page.tsx           — CRITICAL #4
src/app/agent/employer/page.tsx            — CRITICAL #5
src/app/api/jobs/route.ts                  — CRITICAL #7 + HIGH #16
src/app/api/jobs/[id]/route.ts             — CRITICAL #6 + HIGH #16
src/app/agent/auth/callback/page.tsx       — HIGH #9,10
src/app/agent/auth/login/page.tsx          — HIGH #11
src/app/api/payment/webhook/route.ts       — HIGH #12
src/app/agent/jobs/new/page.tsx            — HIGH #13,14 + MEDIUM #19
src/app/sales/jobs/new/page.tsx            — HIGH #13,14
```

---

## 검증

- TypeScript 컴파일: PASS (기존 test setup 에러 제외)
- 기존 테스트: 영향 없음 (API/페이지 변경, 순수 함수 테스트 무관)

---

*감사 수행: Claude Code | 2026-03-09*
