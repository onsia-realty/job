# 프로젝트 메모리 (Claude AI 컨텍스트)

Claude Code가 세션 간 컨텍스트를 유지하기 위해 사용하는 메모리 파일들의 GitHub 백업.

**원본 위치**: `~/.claude/projects/D--claude-onsia-Job/memory/` (사용자 로컬)
**여기**: GitHub 백업 + 팀 공유용

## 파일 종류

- `MEMORY.md` — 인덱스 (각 메모 파일 한 줄 요약)
- `feedback_*.md` — 사용자 피드백/협업 방식
- `project_*.md` — 프로젝트 컨벤션/환경/계정 정보
- `supabase-rls-issue.md` — Supabase RLS 관련 알려진 이슈

## 민감 정보 정책

**이 폴더는 public 레포에 푸시됩니다.** 실제 API 키/시크릿/비밀번호 절대 저장 금지:
- ❌ Client Secret, API Key 값
- ❌ 비밀번호, CRON_SECRET 값
- ❌ 이메일 주소 (계정 정보)

대신:
- ✅ 환경변수 이름만 (`NEXT_PUBLIC_FOO`)
- ✅ 어디서 값을 찾을지 안내 (`.env.local`, Vercel, 1Password 등)
- ✅ 발급 절차, 콘솔 경로

## 동기화

로컬 메모리 변경 시 `cp ~/.claude/projects/D--claude-onsia-Job/memory/*.md docs/memory/` 후 redact + 커밋.
