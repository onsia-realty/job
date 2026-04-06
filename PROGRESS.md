# PROGRESS.md — 온시아 Job 프로젝트 진행 상황

> 이 파일은 Claude의 세션 간 컨텍스트 유지를 위한 **단기 기억 파일**입니다.
> 세션 시작 시 반드시 읽고, 종료 시 반드시 업데이트합니다.

---

## 마지막 작업 (2026-04-06)

### 이번 세션 완료 작업

#### 1. 회원가입 플로우 전면 점검 & 수정
- **complete-profile API**: 중개사 필드 누락 수정 (brokerRegNo, brokerAddress, brokerRegDate)
- **complete-profile API**: 서버사이드 유효성 검증 강화 (닉네임 2-12자/regex, 연락처 형식, 이름 1-50자, 타입 체크)
- **ensure-user API**: nickname, business_no, broker_reg_no 등 메타데이터 필드 추가
- **check-email API**: auth.users까지 이메일 중복 체크 확장 (listUsers)
- **signup 페이지**: 전화번호 중복 체크 onBlur 연동, 디자인 emerald/cyan/slate 통일
- **비밀번호 찾기/재설정**: forgot-password, reset-password 페이지 신규 생성

#### 2. 결제/보안 인프라 수정
- **결제 success 페이지**: 세션 로딩 대기 후 confirm API 호출 (401 에러 수정)
- **웹훅**: TOSS_WEBHOOK_SECRET 시크릿 검증 + 중복 상태 업데이트 방지
- **미들웨어**: 외부 서비스 콜백 경로 면제 (webhook, cron)
- **vitest setup**: `/// <reference types="vitest/globals" />` 추가

#### 3. 토스페이먼츠 라이브 결제 검증 ✅ 완료
- Vercel 환경변수: docs 샘플 키 → 실제 상점 키 교체
- 테스트 키(`test_gck_/test_gsk_`)로 전체 흐름 검증
- 라이브 키(`live_gck_/live_gsk_`)로 교체 후 실결제 ₩4,900 성공
- 취소/환불 → 웹훅 자동 동작 확인:
  - payments.payment_status → refunded ✅
  - jobs.tier → normal 복구 ✅

#### 4. Vercel 환경변수 정리
- `CRON_SECRET` 추가 완료
- `NEXT_PUBLIC_TOSS_CLIENT_KEY` → 라이브 위젯 키 (live_gck_)
- `TOSS_SECRET_KEY` → 라이브 시크릿 키 (live_gsk_)

### 커밋
- `b957c60` — `fix: 오픈 전 회원가입/결제/보안 전면 점검` (10 files, +608 -109)

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
