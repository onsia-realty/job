# 부동산인(BOOIN) / onsia-job — 개발 현황 핸드오프

> 대상: Codex(신규 합류 AI 에이전트)
> 현행 갱신: 2026-10-20 · 기준 브랜치: `main` · 배포 결과는 `PROGRESS.md` 최신 블록 우선
> 이 문서 하나로 "무엇을 / 어떻게 만들었고 / 지금 어디까지 왔는지"를 파악할 수 있게 썼다.
> 세션 단기기억은 루트 `PROGRESS.md`, /stay 전용은 `docs/stay-progress.md`.

---

## 현재 인계 요약 (2026-10-20)

- 최신 STAY 방침은 등록번호 전체 비노출이 아닌 '매물 상세 하단 중개사 정보 한 곳에만 표시'다. 공개 목록은 번호·전화 제외, 상세 사무소 전화는 레지스트리 재조회만 허용(개인 프로필 fallback 없음), 직접 임대인 오래된 중개사 스냅샷은 비공개다. 인증된 관리/서버 저장은 유지한다. 전체537테스트 통과, 배포 결과는 PROGRESS 최신 블록 우선. 아래 별도2파일 제외 설명은 이전 릴리스 이력이다.

- 홈 디자인 반영 후 SecurityShield의 창 크기 차이 기반 차단·반복 debugger를 제거했다. production 우회 없는 회귀18개 포함 전체528테스트, 연결기12·격리DB26검사 및 빌드110페이지 통과. 운영 빌드320/390/768/1440px에서 보호 화면·가로 넘침이 없었다. 물리 기기·실결제 검증은 별도다.
- 사용자 요청으로 결제/집계/홈/보안 앱 커밋 `383caca`를 main에 푸시하고 운영 배포 Ready·booin.co.kr alias를 확인했다. 운영320/390px 보호 화면 없음, 공개 홈/STAY/뉴스/웹툰200·비로그인 주문401/관리자403/cron401 확인. 별도 STAY 등록번호 비노출2파일·DB 백업·로컬 bridge 설정은 보존/제외했다. 아래 미배포 설명은 당시 이력이며 최종 배포 결과는 PROGRESS 최신 블록을 따른다.

- 사용자 승인으로 운영 047/048 적용 완료. 예상 프로젝트 main PRODUCTION/postgres에서 실행 성공, 실제 구조·권한34·DB ROLLBACK 통합15검사 통과, 기존 users14/jobs7/payments6 fingerprint 동일 및 orders0·합성 공고0 확인. 카탈로그/고객 행 없는 baseline 증적은 `supabase/backups/`에 저장했다. 이력 테이블이 없어 실행 결과·카탈로그로 판정한다.
- 운영 기존 결제 만료 트리거를 047에서 조건부 호환 보완해 명시 expires_at은 보존하고 레거시 NULL 계산·원본 속성은 유지한다. 048 함수 전용 timeout60초와 schema reload로 최초57014를 해결한 뒤 service_role 집계 REST204·10.9초 성공. 전역/역할 설정 변경 없음. 운영 전세 MV(033)는 없으므로 추가 적용은 후속이다.
- 앱 배포·실카드 결제·커밋은 하지 않았다. 아래 운영 미준비/미검증 설명은 승인 전 기준선이며 최신 결과는 이 블록을 우선한다.
- 2026-10-13 병합 후 로컬/GitHub `main` HEAD가 일치한다. 아래 과거 작업 방식·운영 수치·완료 기록은 이력으로 읽고 현재 코드와 재확인 결과를 우선한다.
- 31파일 442테스트는 추가 구현 전 기준선이다. 이후 039 정책·046 컬럼 존재와 047/048 적용·권한/ROLLBACK 통합을 확인했다. 039~046 전체 파일 적용 이력·실계정 UI·실결제·앱 배포는 후속이다.
- 추가 구현 후 현재 검증은 32파일 494테스트 통과, TypeScript 오류 0, 변경·신규 소스 19개 ESLint 오류/경고 0, diff check와 프로덕션 빌드 통과(정적 페이지 110개)다. 기존 middleware 폐기 예정 안내 1건이 남아 있다. 격리 SQL 26검사는 운영 DB 검증을 대신하지 않는다.
- STAY 호스트 등록·게스트 문의·등록 도움·내 신청·위임 초안·소유주 확인·관리자 승인 구현 완료. 관리자 위임 흐름은 `/stay/admin`을 포함한다. 기존 미커밋 등록번호 비노출 2파일과 `supabase/backups/`는 보존한다.
- 046 광고 기간 관리에 이어 047 서버 주문 스냅샷·멱등 claim/apply·제공사 확인/복구·부분취소 이력/잔액·공고 삭제 후 원장 보존을 로컬 구현했다. checkout 주문 API·success 재확인 및 관리자 잔액 기준 통계가 연결된다. 공통 재계산도 `recompute_payment_job_ad` 잠금 RPC로 레거시 confirm/webhook·만료 cron까지 최신 창 조회와 등급 반영을 한 트랜잭션에 처리한다. 격리 PGlite SQL 26검사(047/048) 통과. DIA 판매 차단·사용자 삭제 CASCADE 정책은 유지한다.
- `/sales/jobs`는 실제 공고·URL 필터·정렬이 추가됐지만 `/sales` 메인에는 샘플 병합이 남아 있다. 고객센터는 상담원→FAQ→캐시→AI, 시세 인사이트는 실거래 통계 계산으로 전환됐다.
- 집계 GET/POST·06:00 KST cron 연결과 회귀12테스트가 완료됐다. 운영 048은 두 public MV만 갱신하는 definer·빈 search_path·timeout60초·service_role 전용 EXECUTE를 확인했고 실제 HTTP204·10.9초로 갱신했다. 운영 전세 MV가 없어 매매만 갱신하며 앱 cron 배포 후 실행 확인은 후속이다.
- 다음은 앱 배포→실계정·토스 테스트 결제다. 원장 없는 구버전 checkout 미승인 주문은 새 checkout에서 다시 시작한다. 공고 없는 기존 선결제는 보존하지만 신규 공고 자동 연결은 후속이다. 현재 체크리스트는 `docs/IMPROVEMENT_ROADMAP.md` 참조.
- 적용 전 REST HEAD 이력은 046컬럼200·047테이블404/추가컬럼400이며 이후 승인된 047/048 적용·검증으로 준비를 완료했다. 최초 읽기 점검에는 DB 변경·행 본문/키 출력이 없었다. 사후 권한/timeout 증적은 `supabase/backups/post-048-refresh-2026-10-16.json` 및 PNG에 있다.

---

## 1. 제품 정의

**부동산 실무자(공인중개사 · 분양상담사)를 위한 버티컬 플랫폼.**
출발은 구인구직이었으나 현재는 4개 축으로 확장됐다.

| 축 | 라우트 | 한 줄 정의 |
|---|---|---|
| 구인구직 | `/sales`, `/agent` | 분양상담사 / 공인중개사 채용공고 + 인재검색 + 유료 광고 |
| 시세지도 | `/market` | 국토부 실거래가 기반 아파트/오피스텔 시세 지도 (호갱노노·네이버페이부동산 벤치마크) |
| 단기임대 | `/stay` | 중개사가 올리는 단기/한달살기 매물 (MVP, 플래그 뒤) |
| 콘텐츠 | `/news`, `/toon` | AI 요약 부동산 뉴스 + 뉴스툰(포토툰) |

부가: AI 프로필 사진(`/profile/ai-photo`), AI 어시스턴트(`/agent/ai-assistant`), 중개실무 도구(중개보수 계산기·특약·판례·계약서), 관리자 백오피스(`/onsia`).

**도메인**: booin.co.kr (프로덕션, Vercel)
**저장소**: https://github.com/onsia-realty/job.git
**경쟁사**: 분양라인(bunyangline.com), 분양의신(bunshin.kr), 분다모

---

## 2. 어떻게 만들었나 — 개발 방식

코드 자체보다 이 절을 먼저 이해해야 기존 결정들이 납득된다.

### 2.1 전부 Claude Code로 씀
- 1인 개발(대표 겸 공인중개사) + Claude Code CLI. 커밋 로그의 거의 전량이 에이전트 작업이다.
- 그래서 **문서가 곧 기억장치**다. 세션이 끊기면 컨텍스트가 날아가므로 다음 3층 구조로 관리한다:
  - `CLAUDE.md` — 불변 개요(스택·구조·디자인토큰)
  - `PROGRESS.md` — 세션 간 단기기억. 날짜별 역순 누적. **세션 시작 시 읽고 종료 시 갱신**
  - `~/.claude/projects/.../memory/*.md` — 장기 기억(함정·결정사항·계정정보 포인터)
- Codex도 같은 규약을 따라주면 좋다. 작업 후 `PROGRESS.md` 맨 위에 날짜 블록 추가.

### 2.2 "벤치마크는 창의적 재해석 말고 구조 그대로 이식"
반복해서 실패한 뒤 확정된 원칙이다. 경쟁사/레퍼런스를 볼 때:
1. 스크린샷 + DOM 텍스트로 실제 구조를 채증한다 (루트에 `bunshin-*.png`, `naver-land-*.png`, `aptgin-*` 등 채증본 다수)
2. 레이아웃·섹션 순서·티어 구조를 **1:1로 먼저 이식**
3. 그다음 브랜딩/톤을 one-by-one으로 바꾼다

`/sales`와 `/agent` 메인이 이 절차로 만들어졌다.

### 2.3 디자인 핸드오프 워크플로
Claude Design으로 `.dc.html` 시안을 만들고 → README(토큰/레이아웃/데이터모델 정답지) + 인라인스타일 HTML을 export → React로 1:1 포팅한다.
- `/sales/page.tsx`: `design_handoff_booin_sales/` 핸드오프 충실 이식본
- `/agent/page.tsx`: dc-template(인라인 스타일 373개) 1:1 교체본
- 교체 전 원본은 **항상** `_backup/` 에 보존 (`src/app/sales/_backup/`, `src/app/agent/_backup/`)

### 2.4 검증 규칙 (실패로 배운 것들)
- 라우트는 "에러 없음"이 아니라 **HTTP 200 + 기대값 일치**까지 확인한다
- `curl` 검증 시 **User-Agent 헤더 필수** — 미들웨어가 UA 없으면 봇으로 보고 403
- 지도/마커 작업은 **반드시 스크린샷**으로 실물 확인 (코드상 정상인데 지도 인증 실패로 안 보이는 사례 반복)
- Supabase 마이그레이션은 **SQL Editor에서 파일 복사 → 단계 분할 실행**. 한 방 배치는 60초 upstream 타임아웃으로 전체 롤백된다

---

## 3. 기술 스택

| 영역 | 선택 |
|---|---|
| Framework | Next.js **16.1.3** (App Router) / React **19.2.3** / TypeScript 5 |
| Styling | Tailwind CSS 4 (`@theme` 토큰) + 일부 인라인 스타일(디자인 핸드오프 이식분) |
| DB/Auth/Storage | Supabase (PostgreSQL + Auth + Storage + RLS) |
| 상태/데이터 | TanStack Query 5, Zod 4 |
| 지도 | NCP Naver Maps (시세지도·stay) / Leaflet + react-leaflet-cluster (보조) |
| 결제 | 토스페이먼츠 SDK 2.5 (PortOne 키도 남아있으나 **토스가 정본**) |
| 본인인증 | 다날 UAS 휴대폰 본인확인 (NICE 아님 — 결정 완료) |
| AI | Google Gemini (`@google/genai`) — AI 사진 / 뉴스툰 / 어시스턴트 |
| 에디터 | TipTap 3 (공고·뉴스 본문) |
| 차트 | Recharts 3 |
| SMS | Solapi |
| 테스트 | Vitest 4 + Testing Library + jsdom |
| 배포 | Vercel (cron 포함) |
| PM | pnpm 10.16.1 |

---

## 4. 코드 구조

```
onsia-job/
├── src/
│   ├── app/
│   │   ├── page.tsx                 랜딩(직방 스타일 다크)
│   │   ├── agent/                   공인중개사 워크스페이스
│   │   ├── sales/                   분양상담사 구인구직
│   │   ├── market/                  시세지도
│   │   ├── stay/                    단기임대 (플래그)
│   │   ├── news/ toon/              뉴스 / 뉴스툰
│   │   ├── onsia/                   관리자 백오피스 (⚠️ /admin 아님)
│   │   ├── premium/ checkout/ payment/  광고상품·결제
│   │   └── api/                     67개 라우트 핸들러
│   ├── components/  agent sales market stay landing shared editor ai-photo security providers
│   ├── lib/
│   │   ├── supabase.ts / supabase-server.ts   client / service-role
│   │   ├── auth.ts / auth-server.ts           AuthContext, verifyUser
│   │   ├── toss.ts                            광고상품 가격 **단일 출처**
│   │   ├── danal.ts                           본인인증
│   │   ├── market/                            17개 모듈 (집계·포맷·공공API·마커·랭킹)
│   │   ├── stay/                              8개 모듈 (PNU·중개사스냅샷·포맷·인근시세)
│   │   └── validations/                       Zod 스키마 (job, stay, ai-photo)
│   ├── middleware.ts                봇/UA 차단 + 외부 콜백 예외
│   └── types/                       index.ts, stay.ts
├── supabase/migrations/             001~048 + ai_photo_generations (운영 적용은 현행 요약 확인)
├── scripts/                         백필·시딩·툰 합성 (24개 .mjs/.js)
└── docs/ claudedocs/                기능별 스펙·벤치마크 분석
```

---

## 5. 기능별 현황

### 5.1 구인구직 — 분양상담사 `/sales` ✅ 운영중
- 메인: 다크 좌측네비(240px) + 헤더 + 메인그리드(1fr+340px) + 우측 사이드바 + 모바일 하단탭. 반응형 1180/920/640
- **5섹션 tier 분기**: 🏆unique(가로 큰카드) / 👍superior(4단 세로) / 🔍premium(2단 가로) / ⚡normal(컴팩트)
- 샘플데이터(`src/data/salesJobsSample.ts`) 즉시 표시 → `fetchJobs('sales')` 실데이터 병합·dedup. 슬롯이 비면 샘플로 fill
- 하위: `jobs/[id]` 상세, `jobs/new` 등록(이미지 업로드·광고상품 선택·미리보기 iframe), `talents` 인재검색, `search`, `mypage`, `premium`
- 등록폼 `salary_type`은 정규 enum(`commission` / `base_incentive` / `daily`)

### 5.2 구인구직 — 공인중개사 `/agent` ✅ 운영중 (v2)
- "공고 메인 + 허브 레이어" 구조. `/sales`와 같은 BOOIN 뼈대, 액센트만 에메랄드(#10B981)
- 브리핑 스트립 · 공고 fillTo(VIP 8 / 프리미엄 15 / BASIC 30) · 실무 바로가기 8종 · AI 미니챗 · 시세지도 카드
- **시세표 슬라이드 패널(440px)**: 좌측네비 "아파트/오피스텔 시세" → `PriceTable.tsx`(시도탭 → 구 요약 → 단지 드릴다운) + `api/market/price-table`
- 하위: `auth/*`(로그인·가입·비번재설정·콜백), `jobs/*`, `employer/*`(공고관리·지원자), `mypage/*`(프로필·회사·이력서·DNA·지원현황·북마크·본인인증), `tools/*`(중개보수·특약·판례·계약서), `ai-assistant`, `talents`, `premium`, `stays`(신규·미커밋)
- `/agent/jobs` → `/agent` redirect. `[id]`·`new` 는 유지

### 5.3 시세지도 `/market` ✅ 운영중 — 가장 복잡한 서브시스템
데이터 파이프라인과 UI를 5단계에 걸쳐 전면 개편했다.

**데이터**
- 국토부(data.go.kr) 실거래가 → `price_transactions` (약 225k행)
- 좌표: NCP Naver Geocoding 우선 + VWorld fallback. 로컬 백필로 **12,481/12,517 = 99.7%** 완주
- 건축물대장: VWorld PNU(19자리) 백필 → `BldRgstHubService` → `building_ledgers` (9,997건 수집, 잔여 ~2,400건은 일일 쿼터 소진)
- 관리비: K-apt 연동 → `apt_mgmt_costs` (네이버식 세대당 3버킷 + 계절통계)
- 집계 MV: `complex_aggregates`, 전월세/전세율 집계(033)
- 서울 버스정류장 11,253개 정적 데이터 (`src/data/seoul-bus-stops.json`)

**UI**
- 줌 ≤11 구(원형) / 12~13 동(pill) / ≥14 단지 — 줌 레벨별 집계 마커, 클릭 시 드릴다운
- 마커: 네이버식 **집 모양** — 파란 지붕(대표 면적㎡, 오피스텔 "OP") + 평균가 + 최근 실거래 1건 + 단지명. 컬러 인코딩은 전부 제거(눈 아픔 피드백)
- 좌측 통합 패널 `ComplexDetailView`(400px): 탭 [시세/실거래] [단지정보] [인근]
  - 인근 탭: 지하철(노선뱃지)/버스/학교 카드 + 클릭 시 단지→시설 **점선 경로 안내**
- 미선택 시 `ComplexListPanel` (viewport 단지 리스트)
- 모바일 `BottomSheet`: peek(124px)/half(50dvh)/full(92dvh) 스냅, 드래그는 grabber 전용
- 과밀 방지: 줌 14에서 거래량 상위 90개만, 줌 15+ 전량
- 파생: `/market/[complex]` 단지, `/market/insights/[complex]` 인사이트, `/market/rankings` 랭킹

### 5.4 단기임대 `/stay` 🟡 코드 구현 완료·실계정 통합 검증 잔여
- Phase 0~8 전부 ✅ (플래그 → 마이그 035~038 → API → PNU조회 → 이미지갤러리 → 등록폼 → 목록/상세 → 관리자탭 → 소유주 랜딩)
- 035~038은 과거 라이브 적용 기록이 있다. 현재 운영 DB 적용 이력은 이번 점검에서 재검증하지 않았다.
- 화면: `/stay`(홈) `/stay/map` `/stay/list` `/stay/[id]` `/stay/new` `/stay/owner` 및 `/stay/inquiries`·`/stay/requests`·`/stay/admin`
- **서버 중개사 스냅샷** — `lib/stay/agent-snapshot.ts`가 서버 승인 `app_metadata.brokerVerified + brokerRegNo`로 `broker_offices`를 읽는다. 사용자 프로필 등록번호는 승인 증거가 아니다. 로컬 미커밋 공개 DTO/UI는 등록번호를 제외해 사무소명·소재지·연락처·대표자만 표시한다. 법률 적합성을 판단한 문구가 아니다.
- 플래그와 dev 포트는 세션 시작 시 실제 환경을 확인한다. 과거 작업에서는 STAY 활성화·3007을 사용했다.

**미완**
- admin 토큰 실검증 (무토큰 403 경로만 확인됨)
- 주입차단 실증 (`agent_*` / `is_approved` 강제 주입 무시 확인)
- `public/images/stay/` 자산 13파일 존재. 카드별 연결·브라우저 품질 검증은 별도
- 메뉴명 미확정: 단기임대 / 한달살기 / 중기임대 (`lib/stay/constants.ts` 한 곳)

### 5.5 결제 / 광고상품 — 광고 기간 관리 구현·주문 원장 후속
- 토스페이먼츠 라이브 키 적용. `/premium`(안내) → `/checkout`(위젯) → `/payment/success|fail`
- `api/payment/confirm`(승인) + `api/payment/webhook`(웹훅)
- **가격은 `src/lib/toss.ts` 단일 출처**. 4등급 × 기간선택(10/20/30일), 엔트리=베이직 7+7=14일 기본
- 광고 미리보기는 등록폼 안에서 **iframe**으로 렌더 (지우면 안 됨)
- 046의 `jobs.ad_expires_at`·`payments.starts_at` 및 `lib/ad-entitlement.ts`로 광고 창을 서버 계산한다. 유효 완료 결제 중 등급을 선택하며 동급 연장·즉시 업그레이드·환불 후 재계산·만료 cron이 연결돼 있다. 047은 서버 주문 원장·부분취소 이력/잔액·공고 삭제 후 보존과 원자 적용·복구를 로컬 구현한다. 운영 검증은 후속이며 `sales-dia` 구매는 차단돼 있다.

### 5.6 본인인증 (다날 UAS) ✅
- `api/auth/danal/{ready,callback,cancel}` + `lib/danal.ts` + 마이그 034
- 거래서버 `uas.teledit.com`, 인증창 `wauth.teledit.com`. CPTITLE = `BOOIN(부인)`
- **콜백은 프로덕션 도메인이어야 다날이 POST 가능**
- ⚠️ 교차출처 콜백이 403 나면 `middleware.ts`의 `EXTERNAL_API_PATHS` 예외 확인

### 5.7 콘텐츠 — 뉴스 / 뉴스툰 🟡
- `/news` RSS 수집 + AI 요약, TipTap 에디터로 편집
- `/toon` 뉴스툰 2.0 = **포토툰** 워크플로: 나노바나나2로 컷 수작업 → `scripts/compose-phototoon-ep.mjs`가 2×3 그리드 합성·업로드·draft 등록
- 상세 페이지 좌우 스왑(왼쪽 툰 / 오른쪽 기사)
- EP.01 "규제 찍자, 옆동네가 부풀었다" — **draft 상태, 발행 SQL 미실행**

### 5.8 관리자 `/onsia` 및 STAY 운영 `/stay/admin`
- 일반 관리자 경로는 `/onsia`다. `/admin` 페이지를 새로 가정하지 않는다. STAY 등록 도움·위임·승인은 `/stay/admin`에도 구현돼 있다.
- 대시보드·회원·공고·결제·설정 + 단기임대 탭
- API: `api/admin/{jobs,members,payments,stays,stay-leads}` — 토큰 없으면 403

---

## 6. DB — 마이그레이션 계보

| 범위 | 내용 |
|---|---|
| 001~003 | 초기 스키마 / Storage / 공개 공고 정책 |
| 004~007 | 중개사무소(LOCALDATA) · 체크제약 확장 · 사무실 전화 · VIP 티어 |
| 008~013 | 이력서 · DNA 필드 · 회사 프로필 · 채팅이력 · AI 사용량 · 매물 카테고리 |
| 014~018 | 결제 · BASIC 티어 · 뉴스툰 · **보안 하드닝** · stale select 정책 제거 |
| 019~026 | 시세지도 1차: 지역코드 · 실거래 · 건축물대장 · 집계MV · 알림 · 대기자 · jobs.lawd_cd · upsert 유니크 인덱스 |
| 027~033 | 시세지도 2차: 단지 마스터 · 관리비 · 화성 행정구 분할 · AI사용량 원자증가 · users 중개사 컬럼 · 랭킹 · 전월세 집계 |
| 034 | 다날 본인인증 |
| 035~038 | 단기임대: stays · owner_leads · RPC/Storage · status/agent/lead_detail |
| 039~043 | 권한 경계·Advisor 하드닝·문의·비공개 읽기·등록 도움/소유주 승인 워크플로 |
| 044~046 | 실거래 raw 정리·고객센터 채팅·광고 만료/결제 시작일 및 재계산 백필 |
| 047 | 서버 주문 스냅샷·멱등/원자적 결제 적용·부분취소 이력/잔액·공고 삭제 후 원장 보존·기존 만료 트리거 호환 (운영 적용·권한/ROLLBACK 검증 완료) |
| 048 | 집계 고정 MV·service_role 전용 RPC·함수 timeout60초 (운영 적용·실제 REST204 검증, 전세 MV는 없음) |

**적용 방법**: Supabase SQL Editor에서 파일 열어 전체 복사 → Run. 큰 마이그레이션은 단계 분할. 이후 `NOTIFY pgrst, 'reload schema';` 단독 실행.

**주의**: Supabase 프로젝트가 둘이다. 앱은 `pkbnudkbkhzqjhwffkbj`(onsia-job, FREE). `uwddeseqwdsryvuoulsm`은 별개 앱(onsia-crm).

---

## 7. Cron / 배치

`vercel.json` 등록분 (KST = UTC+9):

| 경로 | 스케줄(UTC) | 역할 |
|---|---|---|
| `/api/cron/expire-jobs` | `0 15 * * *` | 광고 기간 만료 처리 |
| `/api/cron/sync-transactions` | `0 19 * * *` | 국토부 실거래가 수집 |
| `/api/cron/geocode-complexes` | `30 19 * * *` | 단지 좌표 백필 (NCP 우선) |
| `/api/cron/sync-mgmt-costs` | `0 20 * * *` | K-apt 관리비 |
| `/api/cron/refresh-aggregates` | `0 21 * * *` | 06:00 KST, RPC 운영 REST 갱신 검증 완료·앱 cron 배포 후 실행 확인 잔여 (운영 전세 MV 없음) |

코드에 있으나 **vercel.json 미등록**: `sync-building-ledgers`, `build-rankings` → 등록 필요.
`CRON_SECRET`으로 보호.

로컬 백필 스크립트: `scripts/backfill-{geocode,building-ledgers,complex-coords,kapt-codes,mgmt-costs}.mjs`

---

## 8. 환경변수 (`.env.local`, 값은 절대 커밋 금지)

```
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
DATA_GO_KR_API_KEY            국토부 실거래·건축물대장 (일일 쿼터 1만)
SEOUL_OPEN_API_KEY            서울 열린데이터광장
VWORLD_API_KEY / NEXT_PUBLIC_VWORLD_KEY   전국 중개사무소·PNU
NEXT_PUBLIC_KAKAO_MAP_KEY
PEXELS_API_KEY                뉴스 썸네일
NEXT_PUBLIC_GOOGLE_CLIENT_ID  구글 로그인(GIS)
GEMINI_API_KEY                AI 사진 / 툰 / 어시스턴트
NEXT_PUBLIC_TOSS_CLIENT_KEY / TOSS_SECRET_KEY / TOSS_WEBHOOK_SECRET
NEXT_PUBLIC_PORTONE_*         (레거시, 토스가 정본)
CRON_SECRET
NEXT_PUBLIC_MARKET_ENABLED=true
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
NAVER_GEOCODE_CLIENT_ID / NAVER_GEOCODE_CLIENT_SECRET
DANAL_CPID / DANAL_CPPWD / DANAL_TARGET_URL
NEXT_PUBLIC_STAY_ENABLED
```

⚠️ **`.env` 계열은 `sed`/리다이렉트로 수정 금지. 반드시 Read → Edit.** (과거 파일 날려먹은 이력 있음)

---

## 9. 반복해서 밟은 함정 — Codex가 꼭 알아야 할 것

**검증**
1. 라우트는 HTTP 200 + **기대값 일치**까지 확인. "에러 안 남"은 검증이 아니다
2. `curl` 에는 **User-Agent 필수**. 없으면 미들웨어가 403
3. 지도/마커는 스크린샷으로 실물 확인
4. 106 errors / 217 warnings는 과거 lint 기준선이다. 코드 정리 이후 현재 값으로 인용하지 않고 검사 결과를 새로 기록한다
5. dev 서버가 죽은 채 포트를 잡고 있으면 `_error`가 500을 뱉는다. `.next/dev/lock` 확인

**Supabase**
6. **`.in()` 필터는 30개씩 청크**. 한글 complex_key는 URL 인코딩 시 키당 100~150바이트라 100개만 넘어도 fetch failed. PostgREST 1000행 캡도 같이 회피됨
7. RLS + JWT 이슈는 메모리 `supabase-rls-issue.md` 참조 (Critical)
8. 큰 마이그레이션 한 방 실행 → 60초 타임아웃 전체 롤백

**지도**
9. NCP Maps SDK 파라미터는 **`ncpKeyId`**. 옛 `ncpClientId` 키는 **silent fail** (에러 없이 안 뜸)
10. 로컬(`localhost:3000`) 401이면 NCP 콘솔 Application의 Web 서비스 URL 화이트리스트 확인

**도메인/단위**
11. 시세는 **만원 단위**(`lib/market/format.ts` `formatKoreanPrice`), 단기임대는 **원 단위 `_won` 접미사**(`lib/stay/format.ts`). 섞으면 1만배 틀린다
12. 실거래 데이터로 **보증금 평균 내지 말 것** (전세/월세 혼재로 무의미)
13. `stayCreateSchema`는 `.passthrough()` 금지 — 명시 화이트리스트만

**UI**
14. flex 컨테이너 안 `height:100%` 트랩 — 부모에 `min-height:0` 없으면 스크롤 깨짐
15. JSX 대량 치환 Edit은 닫는 태그 짝이 자주 어긋난다. 큰 덩어리는 나눠서

---

## 10. 과거 인계 기록 (2026-09-15 당시)

이 절의 브랜치·미커밋 목록·백로그는 당시 기록이다. 현재 상태와 우선순위는 상단 '현재 인계 요약'과 개선 로드맵을 따른다. 과거 미실행 SQL·데이터 건수도 적용 전에 다시 확인한다.

### 브랜치
`feature/stay-mvp-2026-09` (origin 동기화됨). 최신 커밋 `cd7400c feat(stay): 3화면 재편 + 실거래 마커 레이어 + 이미지 자산`

### 미커밋 작업 (working tree)
```
M src/app/agent/mypage/page.tsx
M src/app/agent/mypage/verification/page.tsx
M src/app/api/stays/route.ts
M src/app/stay/StayHomeClient.tsx
M src/app/stay/new/page.tsx
M src/components/shared/Header.tsx
M src/components/stay/StayAgentFields.tsx
M src/components/stay/StayCreateForm.tsx     (+235줄, 가장 큼)
?? src/app/agent/stays/page.tsx              중개사 매물관리 화면 (신규)
?? src/app/api/agent/broker-sync/route.ts    중개사 인증결과 → users 반영 (신규)
```
맥락: 가입 **후에** 중개사 인증을 한 계정은 `auth.users.user_metadata`만 갱신되고 `public.users`의 broker 컬럼이 null로 남아 `/stay/new` 제출이 하드 블록된다. `broker-sync`가 그 간극을 메운다. 개설등록번호 **하나만** 입력받고 나머지는 서버가 레지스트리에서 읽는다.

### 백로그 (우선순위 순)
1. **`/stay` Phase 9** — 플래그 on + 스테이징 전체 1회전 + admin 토큰 실검증 + 주입차단 실증
2. **미실행 SQL 2건** — ① `033_price_table_rent_aggregates.sql` (MV+인덱스+함수, refresh 호출은 금지) ② EP.01 발행 `UPDATE news_toon_episodes SET status='published', published_at=NOW() WHERE id='36cd3918-ba55-4678-8ed8-c3d7a7939b75';`
3. **cron 미등록 2종(2026-10-16 정정)** — `sync-building-ledgers` / `build-rankings` 스케줄 검토. `refresh-aggregates`는 실제 RPC·GET/POST·06:00 KST cron 구현 완료이며 운영 실행 검증 상태는 상단 현행 요약을 따른다.
4. **건축물대장 잔여 ~2,400건** — `node scripts/backfill-building-ledgers.mjs --ledger-only` (일일 쿼터 리셋 후)
5. **`/sales` Phase 2** — AI 이력서 흐름(`agent/mypage/resume` + `dna`)과 인재검색(`/sales/talents`)을 BOOIN 셸/톤으로 통일
6. **미사용 구컴포넌트 정리** — `VipSlider`, `SalesFeaturedCard`, `SalesSidebar`
7. **빈 라우트** — 쇼츠 / 중개사 라운지 (좌측 네비에서 현재 `#`)
8. 시세표 Phase 3 — 행안부 법정동 인구 API + 청약홈 분양정보 API + "부인 시세지표"(신고가 비율 + 거래량 증감)
9. `/public/images/stay/` 자산 생성 (Gemini 12건×4장 ≈ $1.9)

---

## 11. 실행

```bash
pnpm install
pnpm dev          # 기본 3000. stay 작업 시 3007 + NEXT_PUBLIC_STAY_ENABLED=true
pnpm build
pnpm test         # 2026-10-16 추가 구현 후: 32파일 494테스트 통과
pnpm lint         # 현재 결과를 새로 기록 (과거 106E/217W 인용 금지)
```

테스트 위치: `src/__tests__/stay-*.test.ts`, `src/lib/{commission-calculator,toss,market/format}.test.ts`, `src/lib/validations/ai-photo.test.ts`, `src/app/api/business-verify/route.test.ts`

---

## 12. 더 볼 문서

| 파일 | 내용 |
|---|---|
| `PROGRESS.md` | 세션별 작업 로그 (역순, 가장 상세) |
| `docs/stay-progress.md` | 단기임대 Phase 표 + 함정 |
| `CLAUDE.md` | 스택·구조·디자인 토큰·모델 라우팅 |
| `TEAM_SKILL.md` | 5인 AI 팀 역할 정의 |
| `claudedocs/naver-land-benchmark.md` | 네이버 부동산 구조 분석 |
| `claudedocs/결제창.md` | 결제 플로우 복원 가이드 |
| `보안.md` | 보안 점검 항목 |
| `공인중개사api.md` | LOCALDATA/VWorld 중개사무소 API |
| `사업자.md` | 사업자 정보·정책 |
| `webtoonskill.md`, `NEWS-TOON-README.md` | 뉴스툰 파이프라인 |
| `중개보수_계산_개발명세서.md` (루트 상위) | 중개보수 계산 스펙 |
