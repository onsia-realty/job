# 로그인/인증 시스템 문서

## 인증 구조

### 기술 스택
- **Supabase Auth** (GoTrue 기반)
- **Provider**: Google, Kakao, Email/Password
- **클라이언트**: `@supabase/supabase-js`

### 로그인 방식 3가지

| 방식 | 구현 | 파일 |
|------|------|------|
| **구글** | Google Identity Services (GIS) → `signInWithIdToken` | `src/app/agent/auth/login/page.tsx` |
| **카카오** | Supabase OAuth → `signInWithOAuth({ provider: 'kakao' })` | `src/lib/auth.ts` |
| **이메일/비번** | `signInWithPassword({ email, password })` | `src/lib/auth.ts` |

### 회원가입
- **이메일**: `signUpWithEmail()` — 이메일 인증 필요 (Confirm email ON)
- **소셜**: 첫 소셜 로그인 시 자동 가입

---

## 계정 연결 (User Linking)

### Supabase 설정 (2026-02-21 적용)
- **Allow new users to sign up**: ON
- **Allow manual linking**: ON
- **Allow anonymous sign-ins**: OFF
- **Confirm email**: ON

### 자동 연결 (Automatic Linking)
- Supabase 기본 동작: 동일 이메일이면 자동으로 같은 계정에 연결
- 예: 구글(`user@gmail.com`) → 카카오(같은 `user@gmail.com`) = 하나의 계정
- **조건**: 양쪽 provider에서 반환하는 이메일이 동일해야 함

### 수동 연결 (Manual Linking)
- "Allow manual linking" 설정 ON (Dashboard에서 활성화 완료)
- API: `supabase.auth.linkIdentity({ provider: 'kakao' })`
- 용도: 구글/카카오에 다른 이메일을 사용하는 경우, 마이페이지에서 직접 연결
- **향후 구현 필요**: 마이페이지 계정 연결 UI

### 이메일 전달 방식

| Provider | 이메일 전달 | 비고 |
|----------|------------|------|
| Google | 항상 전달 | Gmail 이메일 자동 |
| Kakao | 대부분 전달 | 카카오 앱 설정에서 `account_email` 동의항목 필요 |
| Email | 직접 입력 | 회원가입 시 입력 |

---

## 주요 파일

```
src/
├── lib/
│   ├── auth.ts                    # 인증 함수 (signIn, signUp, signOut 등)
│   └── supabase.ts                # Supabase 클라이언트 (anon key)
├── contexts/
│   └── AuthContext.tsx             # AuthProvider + useAuth() hook
├── components/providers/
│   └── Providers.tsx              # AuthProvider 래핑
└── app/agent/auth/
    ├── login/page.tsx             # 로그인 페이지 (카카오, 구글 GIS, 이메일)
    ├── signup/page.tsx            # 회원가입 페이지
    ├── callback/page.tsx          # OAuth 콜백 처리
    └── forgot-password/page.tsx   # 비밀번호 찾기
```

## 인증 흐름

### 소셜 로그인 (구글)
```
1. 로그인 페이지 → Google GIS 버튼 클릭
2. Google 팝업에서 계정 선택
3. credential(JWT) 반환
4. supabase.auth.signInWithIdToken({ provider: 'google', token: credential })
5. Supabase가 세션 생성 → AuthContext에 user/session 저장
6. /agent/mypage로 리다이렉트
```

### 소셜 로그인 (카카오)
```
1. 로그인 페이지 → "카카오로 시작하기" 클릭
2. signInWithOAuth({ provider: 'kakao', redirectTo: '/agent/auth/callback' })
3. 카카오 인증 페이지로 리다이렉트
4. 인증 완료 → /agent/auth/callback으로 돌아옴
5. Supabase가 세션 생성 → AuthContext에 user/session 저장
```

### 이메일 로그인
```
1. 이메일/비밀번호 입력 → 로그인 버튼
2. signInWithPassword({ email, password })
3. 세션 생성 → /agent/mypage로 리다이렉트
```

## API 인증 패턴

```typescript
// API route에서 인증 확인
const authHeader = request.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');
const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
```

## 구인글 작성 인증 (`/agent/jobs/new`)

1. 비로그인 → "로그인이 필요합니다" 안내 페이지
2. 로그인 but 미인증 → 카테고리 선택 후 "기업 인증이 필요합니다" 모달
3. 인증 완료 → 구인글 작성 가능
4. 제출 시 `user_id: authUser.id` 로 저장

### 인증 종류
- **중개업소 인증** (`brokerVerified`): 공인중개사 구인글 작성 가능
- **사업자 인증** (`businessVerified`): 분양상담사 구인글 작성 가능
- **명함 인증** (`cardVerified`): 분양상담사 구인글 작성 가능

---

## 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=https://pkbnudkbkhzqjhwffkbj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

## Supabase Dashboard
- 프로젝트: https://supabase.com/dashboard/project/pkbnudkbkhzqjhwffkbj
- Auth 설정: https://supabase.com/dashboard/project/pkbnudkbkhzqjhwffkbj/auth/providers

---

*Last Updated: 2026-02-21*
