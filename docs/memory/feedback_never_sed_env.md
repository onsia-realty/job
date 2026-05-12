---
name: .env 파일에 sed -i 금지 — 파일 통째로 날아감
description: Windows/Git Bash에서 sed -i로 .env 파일을 수정하면 파일 전체가 비워진 사고가 있음. 절대 쓰지 말 것.
type: feedback
originSessionId: 13bbd32d-2ca0-4f12-93e9-06f62bd48bcf
---
**절대 규칙**: `.env`, `.env.local` 등 환경변수 파일을 수정할 때 `sed -i`를 쓰지 않는다.

**Why**: 2026-04-25, Windows Git Bash 환경에서 `sed -i 's/^CRON_SECRET=.*/.../' .env.local` 실행 결과 파일 전체가 0줄로 비어버렸음. Supabase 서비스 롤 키, 토스 키, Google/Naver API 키 등 복구 어려운 값들이 한꺼번에 날아감. 사용자가 크게 화냄("잘좀하자").

**How to apply**:
- `.env*` 파일은 **반드시 Read → Edit 툴로만 수정**한다.
- `sed -i` 뿐 아니라 `> file`, `cat > file`, `echo > file` 등 파일 덮어쓰기 형태의 Bash 명령은 절대 금지.
- 값 하나 바꾸는 거라도 Read → Edit 경유.
- 파일 수정 전 반드시 Read로 현재 내용 확인 (통째 날림 방지).

**복구 경로 (우선순위)**:
1. **에디터의 Ctrl+Z** — 2026-04-25에 이걸로 실제 복구됨. 파일이 에디터에서 열려있었기 때문. 가장 빠름.
2. VS Code/Cursor Timeline 패널 (자동 Local History)
3. Windows 탐색기 → 우클릭 → "이전 버전" (File History 활성 시)
4. Vercel 환경변수에서 키 조회 (민감 값은 regenerate 필요)
