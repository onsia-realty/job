# Testing Skill — onsia-job 테스트 작성 가이드

## 실행 명령어

```bash
npm test              # 전체 테스트 (vitest run)
npm run test:watch    # 워치 모드 (vitest)
npm run test:coverage # 커버리지 리포트
```

## 파일 컨벤션

- **위치**: 소스 파일 옆에 co-locate (`*.test.ts` 접미사)
  - `src/lib/foo.ts` → `src/lib/foo.test.ts`
  - `src/app/api/bar/route.ts` → `src/app/api/bar/route.test.ts`
- **설정**: `vitest.config.ts` (루트), `src/__tests__/setup.ts` (전역 설정)
- **환경변수**: `setup.ts`에서 `vi.stubEnv()` — 모듈 로드 전 설정 필수

## 작성 패턴

### 1. 순수 함수 테스트 (Tier 1 — 최우선)
```ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './my-module';

describe('myFunction', () => {
  it('정상 케이스', () => { expect(myFunction(input)).toBe(expected); });
  it('경계값', () => { ... });
  it('에러 케이스', () => { expect(() => myFunction(bad)).toThrow(); });
});
```

**레퍼런스**: `src/lib/commission-calculator.test.ts`

### 2. 설정 데이터 + 유틸리티 (Tier 2)
- 상수 개수, 필수 필드 존재, 값 범위 검증
- 유틸 함수: 포맷, 고유성, 정규식 매칭

**레퍼런스**: `src/lib/toss.test.ts`

### 3. Zod 스키마 + 파일 검증 (Tier 2)
- `.parse()` 성공/실패, 경계값 (파일 크기 등)
- `createMockFile()` 헬퍼로 File 객체 생성

**레퍼런스**: `src/lib/validations/ai-photo.test.ts`

### 4. API 내부 함수 — export 안 된 경우 (Tier 3)
- 테스트 파일에 함수 복제 + 리팩토링 주석
- `// 리팩토링 후: import from '@/lib/xxx'`
- 리팩토링 시 export 후 import로 교체

**레퍼런스**: `src/app/api/business-verify/route.test.ts`

### 5. API Route 통합 테스트 (Tier 4 — 향후)
- `NextRequest` 모킹, `POST()` 직접 호출
- Supabase/fetch 모킹 필요

### 6. React 컴포넌트 테스트 (Tier 5 — 향후)
- `@testing-library/react` + `@testing-library/user-event`
- 렌더, 인터랙션, 상태 변화 검증

## 우선순위 Tier

| Tier | 대상 | 난이도 | 예시 |
|------|------|--------|------|
| 1 | 순수 함수 (lib/) | 쉬움 | commission-calculator |
| 2 | 설정 데이터, Zod 스키마 | 쉬움 | toss, ai-photo validation |
| 3 | API 내부 함수 (미 export) | 보통 | business-verify |
| 4 | API Route 통합 | 보통~어려움 | POST /api/xxx |
| 5 | React 컴포넌트 | 어려움 | 로그인 폼, 프로필 등 |

## 필수 규칙

- `describe` / `it` / `expect` 는 `vitest`에서 import (globals: true이므로 생략 가능하나 명시 권장)
- 한글 테스트명 사용 (it 설명문)
- 경계값 테스트 반드시 포함
- 모킹은 최소화 — 순수 함수 우선

## 금지 규칙

- `jest` import 금지 (vitest 사용)
- 실제 외부 API 호출 금지 (fetch 모킹)
- 실제 Supabase 호출 금지 (클라이언트 모킹)
- `test.only`, `describe.only` 커밋 금지

## 모킹 패턴

### 환경변수
```ts
// src/__tests__/setup.ts에서 전역 설정
vi.stubEnv('MY_KEY', 'test-value');
```

### fetch (API 테스트)
```ts
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'mocked' }),
}));
```

### Supabase
```ts
vi.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));
```

## 리팩토링 워크플로우

1. **코드 읽기**: 대상 파일의 현재 구조 파악
2. **테스트 확인**: 기존 테스트 있는지 확인 (`*.test.ts`)
3. **테스트 작성**: 없으면 현재 동작 기준으로 테스트 작성
4. **GREEN 확인**: `npm test` — 모든 테스트 통과
5. **리팩토링 실행**: 구조 변경
6. **GREEN 확인**: `npm test` — 모든 테스트 여전히 통과
