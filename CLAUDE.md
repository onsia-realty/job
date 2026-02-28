# 온시아 Job Matching 프로젝트

## 프로젝트 개요
부동산 전문가를 위한 AI 기반 구인구직 플랫폼 (Mapi App 내 Job Matching 모듈)

**핵심 기능**:
- 🏢 공인중개사 / 분양상담사 구인구직
- 📰 AI 요약 부동산 뉴스 + 뉴스툰
- 🎥 AI 숏폼 영상 콘텐츠
- 📸 AI 프로필 사진 생성
- 💳 토스페이먼츠 결제 (프리미엄 공고)
- 👥 커뮤니티 네트워킹

**경쟁 대상**: 분양라인, 분다모
**Repository**: https://github.com/onsia-realty/job.git

---

## 🏢 조직도

```
                    연대겸 (대표)
                        │
                 온비스 / 온디아
                        │
        ┌───────┬───────┼───────┬───────┐
        │       │       │       │       │
       PM    Product  Design   Tech   Growth
       이사   매니저   디자이너  리드    매니저
```

> 상세 역할 정의: `TEAM_SKILL.md` 참조

---

## 🔧 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 16 (App Router) + React 19 + TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| **Auth** | Supabase Auth (카카오/구글 소셜 로그인) |
| **Payment** | 토스페이먼츠 (Toss Payments SDK) |
| **AI** | Google Gemini (AI Photo/Toon) |
| **Testing** | Vitest 4 + Testing Library + jsdom |
| **Icons** | Lucide React |
| **Dev Tool** | Claude Code |

---

## 🏗️ 프로젝트 구조

```
onsia-job/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 메인 페이지 (5개 탭)
│   │   ├── agent/                # 공인중개사 (auth, jobs, profile)
│   │   ├── sales/                # 분양상담사
│   │   ├── premium/              # 프리미엄 결제
│   │   ├── checkout/             # 결제 위젯
│   │   ├── profile/              # 프로필 (AI 사진)
│   │   └── api/                  # API Routes
│   ├── components/               # shared/, feature별 컴포넌트
│   ├── lib/                      # 유틸, 설정, Supabase 클라이언트
│   │   ├── supabase.ts           # Client Supabase
│   │   ├── supabase-server.ts    # Server Supabase (service role)
│   │   ├── auth.ts               # AuthContext + useAuth()
│   │   ├── toss.ts               # 결제 설정
│   │   ├── commission-calculator.ts  # 중개보수 계산기
│   │   ├── ai-photo.ts           # AI 프로필 사진
│   │   ├── ai-toon.ts            # 뉴스툰 파이프라인
│   │   └── validations/          # Zod 스키마
│   └── __tests__/setup.ts        # Vitest 전역 설정
├── supabase/migrations/          # DB 마이그레이션
├── vitest.config.ts              # 테스트 설정
├── TEAM_SKILL.md                 # 5인 AI 팀 역할 정의
├── PROJECT_INSTRUCTIONS.txt      # Claude.ai Project Instructions
├── PROGRESS.md                   # 단기 기억 (세션 간 진행 상황)
└── CLAUDE.md                     # 본 문서
```

---

## 🎨 디자인 시스템

| 항목 | 값 |
|------|-----|
| **Primary** | Blue-600 (#2563eb) → Cyan-600 (#0891b2) |
| **Secondary** | Teal-600, Orange-500 |
| **Accent** | Gradient from-blue-600 to-cyan-600 |

---

## 📋 문서 체계

| 문서 | 역할 |
|------|------|
| `CLAUDE.md` | 프로젝트 개요, 구조, 스택 (본 문서) |
| `PROGRESS.md` | 단기 기억 — 현재 작업, 미해결 이슈, 다음 단계 |
| `TEAM_SKILL.md` | 5인 AI 팀 역할 + 호출 규칙 + 회의 모드 |
| `PROJECT_INSTRUCTIONS.txt` | Claude.ai Project Instructions용 |
| `.claude/skills/testing-skill.md` | 테스트 작성 가이드 |
| `.claude/skills/memory-skill.md` | 세션 간 메모리 유지 규칙 |
| `webtoonskill.md` | 뉴스툰 생성 파이프라인 |

---

## 📚 참고

- **분양라인** (bunyangline.com): 구인구직 카드 UI
- **직방** (zigbang.com): 미디어 섹션, 레이아웃
- **온시아** (onsia.city): 타겟 비즈니스 모델

---

*Last Updated: 2026-02-28*
