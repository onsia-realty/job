# 온시아 Job Matching 프로젝트

## 프로젝트 개요
부동산 전문가를 위한 AI 기반 구인구직 플랫폼. 서비스명 **BOOIN(부인)**.

**도메인**: `booin.co.kr` (www → apex 리다이렉트) / 단기임대 `stay.booin.co.kr`
**Repository**: https://github.com/onsia-realty/job.git
**경쟁 대상**: 분양라인, 분다모, 분양의신

**핵심 기능**:
- 🏢 공인중개사(`/agent`) / 분양상담사(`/sales`) 구인구직
- 🗺️ **시세지도(`/market`)** — 국토부 실거래가·관리비·건축물대장 기반
- 📰 AI 요약 부동산 뉴스(`/news`) + 뉴스툰(`/toon`)
- 📸 AI 프로필 사진 생성
- 💳 토스페이먼츠 광고상품 결제 (등급 × 기간)
- 🔒 다날 UAS 휴대폰 본인인증

---

## ⚡ 명령어

```bash
npm run dev            # 개발 서버 (localhost:3000)
npm run build          # 프로덕션 빌드
npm run lint           # ESLint 9 (flat config)
npm run test           # Vitest 1회 실행
npm run test:watch     # Vitest watch
npm run test:coverage  # 커버리지 리포트
```

**Cron 수동 트리거** (`CRON_SECRET` 필요):
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://booin.co.kr/api/cron/sync-transactions?months=202608&concurrency=8"
```

---

## 🔑 환경 변수 (`.env.local`)

| 그룹 | 키 |
|------|-----|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` |
| 결제 | `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`, `TOSS_WEBHOOK_SECRET` |
| 인증 | `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `DANAL_CPID`, `DANAL_CPPWD`, `DANAL_TARGET_URL` |
| 시세지도 | `DATA_GO_KR_API_KEY`, `VWORLD_API_KEY`, `NEXT_PUBLIC_VWORLD_KEY`, `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`, `NAVER_GEOCODE_CLIENT_ID/SECRET`, `SEOUL_OPEN_API_KEY` |
| AI/콘텐츠 | `GEMINI_API_KEY`, `PEXELS_API_KEY` |
| 기타 | `CRON_SECRET`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_MARKET_ENABLED` |

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
| **Frontend** | Next.js 16.1 (App Router) + React 19.2 + TypeScript 5 |
| **Styling** | Tailwind CSS 4 (`@tailwindcss/postcss`) |
| **Backend** | Supabase (PostgreSQL + Auth + Storage) |
| **Auth** | Supabase Auth (이메일 주 / 구글 GIS `signInWithIdToken`) + 다날 UAS 본인인증 |
| **Server State** | TanStack React Query |
| **Payment** | 토스페이먼츠 (Toss Payments SDK) |
| **Map** | 네이버 지도 v3 + Leaflet / react-leaflet(+cluster) + VWorld 지오코딩 |
| **Chart** | Recharts |
| **공공데이터** | 국토부 실거래가 7종 · K-apt 3종 · 건축물대장 (`fast-xml-parser`) |
| **Editor** | TipTap |
| **AI** | Google Gemini `@google/genai` (AI Photo / 뉴스툰) |
| **알림** | Solapi (SMS/알림톡) |
| **Excel** | `xlsx` (시세 내보내기) |
| **Testing** | Vitest 4 + Testing Library + jsdom |
| **Icons** | Lucide React |
| **Dev Tool** | Claude Code |

---

## 🏗️ 프로젝트 구조

```
onsia-job/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 랜딩
│   │   ├── agent/                # 공인중개사 워크스페이스 (v2, 좌측네비+목록)
│   │   ├── sales/                # 분양상담사 (BOOIN 셸, 5섹션 tier 분기)
│   │   ├── market/               # 🗺️ 시세지도 (+ rankings)
│   │   ├── news/ · toon/         # 부동산 뉴스 / 뉴스툰
│   │   ├── premium/ · checkout/ · payment/   # 광고상품 결제
│   │   ├── profile/              # 프로필 (AI 사진)
│   │   └── api/
│   │       ├── market/           # aggregates, complex, price-table, rankings,
│   │       │                     #   transactions, brokers-nearby, jobs-nearby
│   │       ├── cron/             # sync-transactions, geocode-complexes,
│   │       │                     #   sync-mgmt-costs, build-rankings, expire-jobs
│   │       └── auth/danal/       # 본인인증 callback/cancel
│   ├── components/               # shared/, market/, agent/, sales/, editor/, security/
│   ├── data/                     # ⚠️ 정적 샘플 (salesJobsSample, agentJobsSample)
│   ├── lib/
│   │   ├── supabase.ts / supabase-server.ts   # Client / Server(service role)
│   │   ├── auth.ts               # AuthContext + useAuth()
│   │   ├── toss.ts               # 💰 광고상품 가격 단일 출처 (PRICING_TIERS)
│   │   ├── danal.ts              # 다날 UAS 본인인증
│   │   ├── market/               # publicApi, realEstate, aptMgmtCost,
│   │   │                         #   buildingLedger, complexes, rankings, surroundings
│   │   ├── commission-calculator.ts / ai-photo.ts / ai-toon.ts
│   │   └── validations/          # Zod 스키마
│   └── __tests__/setup.ts        # Vitest 전역 설정
├── supabase/migrations/          # DB 마이그레이션 (034까지)
├── scripts/                      # backfill-*.mjs (좌표·kapt·관리비·건축물대장)
├── claudedocs/                   # 분석 리포트 (네이버 벤치마킹, 크롤링 진화사 등)
├── vercel.json                   # Cron 스케줄 (UTC)
├── PROGRESS.md                   # 단기 기억 (세션 간 진행 상황)
└── CLAUDE.md                     # 본 문서
```

---

## 🗺️ 시세지도(market) 데이터 파이프라인

수집은 **크롤링이 아니라 공공데이터 정식 API**. 상세: `claudedocs/crawling-tech-evolution.md`

| Cron (UTC / KST) | 역할 |
|---|---|
| `sync-transactions` `0 19 *` / 04:00 | `region_codes`(is_mvp) × 최근 3개월 × 5종 실거래 → `price_transactions` upsert |
| `geocode-complexes` `30 19 *` / 04:30 | 단지 좌표 백필 (VWorld) |
| `sync-mgmt-costs` `0 20 *` / 05:00 | K-apt 공용/개별 관리비 → `apt_mgmt_costs` |
| `expire-jobs` `0 15 *` / 00:00 | 만료 공고 처리 |

- 인증: 모든 cron은 `Authorization: Bearer ${CRON_SECRET}` 검증
- 동시성: worker pool 기본 8 (`?concurrency=1~20`), `maxDuration = 300`
- 특정 시군구만 백필: `?lawd=41597,41595`
- 주요 테이블: `region_codes`, `price_transactions`, `complexes`, `apt_mgmt_costs`, `building_ledgers`, `market_rankings`

---

## ⚠️ Gotchas

- **`/market`은 플래그로 게이팅** — `NEXT_PUBLIC_MARKET_ENABLED === 'true'` 아니면 화면·헤더 메뉴 모두 숨겨짐. "지도가 안 보인다"면 여기부터.
- **VWorld 지오코딩은 한국 IP에서만** — Vercel(미국 IP)에서 502. 좌표 백필은 **로컬에서** `node scripts/backfill-complex-coords.mjs` 실행.
- **`/sales`·`/agent` 목록은 정적 샘플이 섞여 있다** — `src/data/salesJobsSample.ts`(28건), `agentJobsSample.ts`. DB 데이터와 머지·dedup되므로 "DB에 없는 공고가 보인다"는 정상.
- **광고 가격은 `src/lib/toss.ts`의 `PRICING_TIERS`가 단일 출처** — 등급 × 기간(10/20/30일) 구조. 다른 곳에 가격 하드코딩 금지.
- **행정구 개편 시 `region_codes`가 stale되면 단지가 통째로 누락** — 화성·부천 전례(2026-06). 신규 시군구는 `?lawd=`로 백필.
- **수집 실패는 조용히 넘어간다** — `Promise.allSettled` + `summary.errors[]`. retry/backoff 없음. 응답의 `errors` 배열을 반드시 확인.
- **Supabase SQL Editor는 60초 타임아웃** — 큰 마이그레이션은 분할 실행. 채팅 복붙 말고 **파일에서 직접 복사**(특수문자 깨짐).
- **구글 로그인은 `signInWithIdToken`(GIS)** — 리디렉션 URI가 아니라 **승인된 JavaScript 원본**만 검증. www→apex 리다이렉트라 GCP에 apex(`https://booin.co.kr`) 필수. 없으면 `origin_mismatch`.
- **`SecurityShield.tsx` devtools 감지 오탐** — 브라우저 사이드패널만 열어도 전체화면 차단. 우회: `?devmode=onsia-dev-2026`.

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
| `claudedocs/crawling-tech-evolution.md` | 데이터 수집 기술 진화사 (1~3세대 비교) |
| `claudedocs/naver-land-benchmark.md` | 네이버페이 부동산 아키텍처 벤치마킹 |
| `.claude/skills/testing-skill.md` | 테스트 작성 가이드 |
| `.claude/skills/memory-skill.md` | 세션 간 메모리 유지 규칙 |
| `webtoonskill.md` | 뉴스툰 생성 파이프라인 |

---

## 📚 참고

- **분양라인** (bunyangline.com): 구인구직 카드 UI
- **직방** (zigbang.com): 미디어 섹션, 레이아웃
- **온시아** (onsia.city): 타겟 비즈니스 모델

---

## 🤖 모델 라우팅 규칙 (토큰 최적화)

**기본 모델: Sonnet** — Opus는 아래 조건에서만 사용

### Opus 사용 조건 (아래 중 하나 이상 해당 시)
- 10개 이상 파일 동시 수정이 필요한 리팩토링
- 시스템 아키텍처 설계/변경
- 원인 불명의 복잡한 버그 디버깅 (3개+ 모듈 연쇄)
- 보안 취약점 분석/감사
- DB 스키마 대규모 마이그레이션
- `--think-hard` 또는 `--ultrathink` 플래그 사용 시

### Sonnet 사용 (기본, 대부분의 작업)
- 기능 구현 (컴포넌트, API 라우트, 페이지)
- 단일~소수 파일 수정 (1~9개)
- 테스트 작성
- 코드 리뷰/개선
- 문서 작성
- 일상 대화/질문
- `--think` 플래그

### 서브에이전트 모델 규칙
- 파일 탐색/검색 에이전트 → `haiku`
- 코드 구현/분석 에이전트 → `sonnet`
- 아키텍처 설계 에이전트 → `sonnet` (필요 시 `opus`)

### 자동 전환 알림
Opus 조건에 해당하는 작업 감지 시, 작업 시작 전에 사용자에게 알린다:
> "이 작업은 Opus가 적합합니다 (이유: ~). 전환할까요?"

Sonnet으로 충분한데 Opus로 실행 중이면 알린다:
> "이 작업은 Sonnet으로 충분합니다. 전환 권장합니다."

---

*Last Updated: 2026-08-05*
