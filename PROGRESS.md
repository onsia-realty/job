# PROGRESS.md — 온시아 Job 프로젝트 진행 상황

> 이 파일은 Claude의 세션 간 컨텍스트 유지를 위한 **단기 기억 파일**입니다.
> 세션 시작 시 반드시 읽고, 종료 시 반드시 업데이트합니다.

---

## 마지막 작업 (2026-02-28)

### 이번 세션 완료 작업
- **테스트 인프라 구축** — Vitest 4 + Testing Library + jsdom 설치 및 설정
  - `vitest.config.ts`, `src/__tests__/setup.ts` 생성
  - `package.json`에 test/test:watch/test:coverage 스크립트 추가
- **레퍼런스 테스트 4개 작성** (74 tests 전체 통과)
  - `src/lib/commission-calculator.test.ts` — 순수 함수 테스트 정석
  - `src/lib/toss.test.ts` — 유틸 + 설정 데이터 검증
  - `src/lib/validations/ai-photo.test.ts` — Zod 스키마 + 파일 검증
  - `src/app/api/business-verify/route.test.ts` — 미export 함수 복제 패턴
- **테스팅 스킬 파일** — `.claude/skills/testing-skill.md`
- **팀 스킬 정리** — `TEAM_SKILL.md` + `PROJECT_INSTRUCTIONS.txt` → 프로젝트 루트로 이동
  - 조직도 추가 (연대겸 대표 / 온비스·온디아 / 5인 AI 팀)
  - Tech 스택 갱신 (Next.js 16, Gemini, 토스페이먼츠 등)
  - CLAUDE.md에도 조직도 반영

### 이전 세션 (2026-02-26)
- 메모리 유지 스킬 시스템 구축 (`memory-skill.md` + `PROGRESS.md`)
- 뉴스툰 3종 테마, 무료 공고 만료, 미들웨어 레이트리밋 개선

### 수정한 파일 (이번 세션)
- `vitest.config.ts` — **신규**
- `src/__tests__/setup.ts` — **신규**
- `src/lib/commission-calculator.test.ts` — **신규**
- `src/lib/toss.test.ts` — **신규**
- `src/lib/validations/ai-photo.test.ts` — **신규**
- `src/app/api/business-verify/route.test.ts` — **신규**
- `.claude/skills/testing-skill.md` — **신규**
- `package.json` — devDependencies + scripts 추가
- `TEAM_SKILL.md` — 프로젝트 루트로 이동, 조직도/스택 갱신
- `PROJECT_INSTRUCTIONS.txt` — 프로젝트 루트로 이동, 스택 갱신
- `CLAUDE.md` — 조직도 섹션 추가

---

## 미해결 이슈
- `CRON_SECRET` 환경변수 Vercel에 추가 필요 (만료 cron 인증용)
- Pre-existing TS 에러: SecurityShield.tsx, Honeypot.tsx, dnaQuestions.ts (우리 변경과 무관)
- 뉴스툰 EP.003, EP.004의 패널 중복 이미지 (이미 생성된 건 수정 불가, 향후 생성분부터 짝수 강제 적용됨)
- commission-calculator 부동소수점 정밀도 이슈 (Math.floor + 0.7% → 1원 차이, 리팩토링 시 개선 대상)
- TEAM_SKILL.md Design 시스템 Font: Pretendard 실제 적용 여부 확인 필요

---

## 다음 단계
- 리팩토링 시작 (테스트 안전망 구축 완료 → 테스트 통과 유지하며 진행)
- business-verify 내부 함수 export 분리 (`src/lib/business-verify.ts`) — 리팩토링 1순위
- 추가 테스트 확장 (Tier 4: API Route 통합, Tier 5: 컴포넌트)
- 새 뉴스 기사 공유 시 → `webtoonskill.md` 워크플로우에 따라 자동 생성
- 커뮤니티 기능 구현 (우선순위 3)

---

## 활성 스킬 문서
| 스킬 | 파일 | 설명 |
|---|---|---|
| 뉴스툰 생성 | `webtoonskill.md` | 뉴스 → AI 웹툰 변환 파이프라인 |
| 메모리 유지 | `.claude/skills/memory-skill.md` | 세션 간 컨텍스트 유지 규칙 |
| 테스팅 가이드 | `.claude/skills/testing-skill.md` | 테스트 작성 컨벤션 + 워크플로우 |
| 팀 스킬 | `TEAM_SKILL.md` | 5인 AI 팀 역할 + 회의 모드 |
