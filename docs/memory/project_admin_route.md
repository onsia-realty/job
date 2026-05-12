---
name: 관리자 페이지는 /onsia (비공개 경로)
description: 관리자 UI는 반드시 /src/app/onsia/에만 만든다. /admin은 보안상 금지.
type: project
originSessionId: fde5644d-f4a0-4300-9af4-779467b5138e
---
관리자 패널은 `/src/app/onsia/page.tsx`에 있다 (1400줄, 6개 탭: dashboard/members/jobs/payments/ads/settings).
URL은 `https://www.booin.co.kr/onsia` — 회사명으로 obscure한 비공개 경로.

**Why:** `/admin`, `/dashboard` 같은 predictable URL은 자동 크롤러·해킹 봇의 1순위 타겟. 브루트포스 로그인 시도, 취약점 스캔이 집중됨. 회사명을 URL로 쓰면 최소한 URL 레벨에서 자동 공격 대상에서 벗어남 (방어 심층 중 첫 단계).

**How to apply:**
- 관리자용 새 기능·페이지는 반드시 `/src/app/onsia/` 안에 추가
- `/src/app/admin/` 디렉토리는 절대 만들지 말 것
- 기존 `/onsia/page.tsx`에 탭 추가 또는 sub-route(`/onsia/<feature>/page.tsx`) 패턴
- 관리자 API는 `/api/admin/*` 그대로 유지 OK (API는 Bearer 토큰으로 보호되므로 URL 노출이 덜 치명적)
- 관리 기능 요구 시 먼저 `/src/app/onsia/page.tsx` 구조를 읽고 기존 탭과의 중복/통합 여부 확인

**과거 실수 (2026-04-24):**
Claude가 오픈 전 점검 중 관리자 대시보드 없다고 판단하여 `/admin/*` 4개 페이지 신규 생성.
사용자가 "admin은 해킹 위험이라 onsia로 만들었다"고 정정. 즉시 /admin 경로 삭제.
향후 관리자 기능 요청은 `/onsia`에서 시작할 것.
