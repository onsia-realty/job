# Supabase RLS + ES256 JWT 문제

## 문제 요약
클라이언트에서 직접 `supabase.from('jobs').update()`를 호출하면 RLS 정책 `auth.uid() = user_id`에서 항상 차단됨. SELECT는 공개 정책으로 정상 동작하지만, UPDATE/DELETE는 무조건 0 rows 반환.

## 근본 원인
Supabase GoTrue가 **ES256** (ECDSA) 알고리즘으로 JWT access_token을 서명하지만, PostgREST의 `auth.uid()` 함수가 이 토큰에서 `sub` 클레임을 제대로 추출하지 못함.

### 증거
1. JWT 헤더: `{"alg": "ES256", "kid": "...", "typ": "JWT"}`
2. JWT 페이로드의 `sub`와 DB의 `user_id`가 동일함을 확인
3. access_token으로 PATCH 요청 → HTTP 200 but 빈 배열 `[]` (RLS 차단)
4. anon key로 SELECT → 공개 정책(`is_active = true`)으로 정상 반환
5. service_role key로 PATCH → 정상 동작 (RLS 우회)

### 왜 SELECT는 되고 UPDATE만 안 되는가
```
jobs 테이블 RLS 정책:
1. "Anyone can view all active jobs" FOR SELECT USING (is_active = true)  ← 공개
2. "Users can manage own jobs" FOR ALL USING (auth.uid() = user_id)       ← 인증 필요
3. "Anyone can insert jobs" FOR INSERT WITH CHECK (true)                   ← 공개

SELECT: 정책 1번(공개)으로 통과 → auth.uid() 불필요
INSERT: 정책 3번(공개)으로 통과 → auth.uid() 불필요
UPDATE: 정책 2번만 해당 → auth.uid() = NULL → 차단!
```

## 해결 방법: API 라우트 패턴
클라이언트에서 직접 Supabase 호출 대신, Next.js API 라우트를 통해 서버에서 `supabaseAdmin` (service_role key)으로 처리.

### 구현
- `POST /api/jobs` — 공고 등록 (user_id는 서버에서 토큰으로 확인 후 설정)
- `GET /api/jobs/[id]` — 내 공고 조회 (수정 페이지용)
- `PATCH /api/jobs/[id]` — 공고 수정

### 인증 흐름
```
Client → Bearer token → API Route → supabaseAdmin.auth.getUser(token) → user.id 확인
                                   → supabaseAdmin.from('jobs').update().eq('user_id', user.id)
```

### 적용된 파일
- `src/app/api/jobs/route.ts` (POST)
- `src/app/api/jobs/[id]/route.ts` (GET, PATCH)
- `src/app/agent/jobs/new/page.tsx` — fetch('/api/jobs/...') 사용
- `src/app/sales/jobs/new/page.tsx` — fetch('/api/jobs') 사용

## 교훈 & 규칙
1. **Supabase에서 INSERT/UPDATE/DELETE가 필요한 모든 작업은 API 라우트 + supabaseAdmin 패턴을 사용할 것**
2. 클라이언트 Supabase는 공개 SELECT (읽기 전용)에만 사용
3. `.single()` 대신 `.maybeSingle()` 사용 (0 rows일 때 406 에러 방지)
4. 공고 등록 시 `user_id`는 반드시 서버에서 토큰 검증 후 설정 (클라이언트 위변조 방지)

## 관련 버그 (함께 수정됨)
- `.single()` → 406 에러: `.maybeSingle()` 또는 `.select()` 배열 패턴으로 변경
- 듀얼 Supabase 클라이언트: `supabase.ts`가 `auth.ts`의 클라이언트를 re-export하도록 통합
- 회사 전화번호 포맷팅: 가운데 자릿수 3/4자리 자동 판별
- sales/jobs/new에서 user_id 누락: API 라우트에서 자동 설정
