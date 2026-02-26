# PROGRESS.md — 온시아 Job 프로젝트 진행 상황

> 이 파일은 Claude의 세션 간 컨텍스트 유지를 위한 **단기 기억 파일**입니다.
> 세션 시작 시 반드시 읽고, 종료 시 반드시 업데이트합니다.

---

## 마지막 작업 (2026-02-26)

### 이번 세션 완료 작업
- 메모리 유지 스킬 시스템 구축 (`memory-skill.md` + `PROGRESS.md`)
- `webtoonskill.md`에 컨텍스트 연동 단계 추가 (0단계: 읽기, 8단계: 기록)
- MEMORY.md에 Memory & Context System 섹션 추가

### 이전 세션 완료 작업 (같은 날)
- 뉴스툰 3종 테마 시스템 구현 (동물/사람/조선시대) → `src/lib/ai-toon.ts`
- SFX 제거, BOOIN 워터마크, 짝수 패널 강제 적용
- `webtoonskill.md` 스킬 문서 생성 (자동 실행 워크플로우 포함)
- 무료 공고 24시간 자동 만료 시스템 (`/api/cron/expire-jobs`)
- 미들웨어 레이트 리밋 개선 (600/min, 60/3sec burst)

### 수정한 파일 (이번 세션)
- `.claude/skills/memory-skill.md` — **신규** 메모리 유지 스킬
- `PROGRESS.md` — **신규** 단기 기억 파일
- `webtoonskill.md` — 컨텍스트 연동 단계 추가

### 최근 커밋
```
16fa98a feat: 무료공고 24시간 만료, 뉴스툰 3종 테마, 미들웨어 레이트리밋 개선
```
```
2fa8462 feat: 메모리 유지 스킬 시스템 구축 (세션 간 컨텍스트 유지)
```

---

## 미해결 이슈
- `CRON_SECRET` 환경변수 Vercel에 추가 필요 (만료 cron 인증용)
- Pre-existing TS 에러: SecurityShield.tsx, Honeypot.tsx, dnaQuestions.ts (우리 변경과 무관)
- 뉴스툰 EP.003, EP.004의 패널 중복 이미지 (이미 생성된 건 수정 불가, 향후 생성분부터 짝수 강제 적용됨)

---

## 다음 단계
- 새 뉴스 기사 공유 시 → `webtoonskill.md` 워크플로우에 따라 자동 생성
- QA 테스트 계획 (plan 파일 존재: `refactored-whistling-star.md`)
- 커뮤니티 기능 구현 (우선순위 3)

---

## 활성 스킬 문서
| 스킬 | 파일 | 설명 |
|---|---|---|
| 뉴스툰 생성 | `webtoonskill.md` | 뉴스 → AI 웹툰 변환 파이프라인 |
| 메모리 유지 | `.claude/skills/memory-skill.md` | 세션 간 컨텍스트 유지 규칙 |
