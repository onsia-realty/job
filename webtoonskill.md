# BOOIN NEWS TOON 웹툰 생성 스킬

## 개요
부동산 뉴스를 AI 웹툰(BOOIN NEWS TOON)으로 변환하는 작업 가이드.
사용자가 뉴스 기사를 공유하면 이 문서 기반으로 실행.

---

## 파이프라인 (3단계)

### 1단계: 뉴스 → 해설 기사
- **모델**: `gemini-2.5-flash` (텍스트, 저비용)
- **입력**: 뉴스 제목 + 본문
- **출력**: JSON `{ title, subtitle, category, article_html, article_summary }`
- **카테고리**: 시장동향 | 분양정보 | 정책 | 전망 | 부동산
- **분량**: 800~1200자, 원문 복사 금지, 독자적 시각으로 재해석

### 2단계: 해설 기사 → 웹툰 스크립트
- **모델**: `gemini-2.5-flash`
- **출력**: JSON 배열 (패널 목록)
- **컷 수**: **반드시 6컷 또는 8컷 (짝수만)**
  - 2xN 그리드 레이아웃 → 홀수면 빈칸 생겨서 Gemini가 중복 이미지 채움
  - 홀수 나오면 마지막 컷 자동 제거 (코드에 안전장치 있음)
- **SFX 없음**: 효과음 텍스트 사용하지 않음

### 3단계: 스크립트 → 이미지 생성
- **모델**: `gemini-3-pro-image-preview` (이미지, 고비용)
- **레이아웃**: 2xN 그리드 (6컷=2x3, 8컷=2x4)
- **스타일**: 치비 동물 캐릭터, 파스텔 배경, 한국 웹툰 스타일
- **브랜딩**:
  - 상단 배너: "BOOIN NEWS TOON — {제목}"
  - 각 패널 우하단: "BOOIN" 워터마크 (반투명 30~40%, 라이트 그레이, 작은 폰트)
- **업로드**: Supabase Storage `ai-photos/toon-images/`

---

## 에피소드 테마 및 캐릭터 풀 (3종 테마 중 택 1)

> **[주의] 에피소드마다 기사의 분위기를 파악하여 A(동물), B(현대인), C(조선시대) 중 하나의 테마만 선택하여 전체 컷의 일관성을 유지할 것. 테마 혼용 금지.**

### A. 동물 테마 (부드러운 풍자/일상)

| 키 | 역할 | 외형 |
|---|---|---|
| cat | 진행자/기자 | 안경 쓴 하얀 고양이 + 마이크 + 기자 조끼 |
| dog | 실수요자(영끌) | 대출 서류 든 베이지 강아지, 걱정 표정 |
| fox | 정책 발표자 | 검은 정장 + 빨간 넥타이 오렌지 여우, 근엄 |
| horse | 부동산 소장 | 셔츠 + 넥타이 갈색 말, 친근한 전문가 |
| squirrel | 현실주의/아내 | 노란 후드 + 열쇠 든 다람쥐, 잔소리 표정 |
| owl | 전문가/분석가 | 안경 + 클립보드 올빼미, 차분 |

### B. 사람 테마 (현실적/드라마틱 시트콤)

| 키 | 역할 | 외형 |
|---|---|---|
| reporter | 진행자/기자 | 단정한 정장의 30대 뉴스 앵커, 마이크를 든 신뢰감 있는 표정 |
| buyer | 실수요자(영끌) | 다크서클이 깊고 피곤한 표정의 30대 후드티 직장인 |
| gov | 정책 발표자 | 은발의 50대 고위 관료, 깐깐한 인상, 뿔테 안경과 정장 |
| broker | 부동산 소장 | 등산복 조끼를 입은 50대 아저씨/아주머니, 사람 좋은 친근한 미소 |
| spouse | 현실주의/아내 | 팔짱을 끼고 한숨 쉬는 30대 여성, 영끌남을 제지하는 현실적인 브레이크 역할 |
| expert | 전문가/교수 | 지휘봉이나 태블릿을 든 깔끔한 정장의 학자, 차분하고 냉철한 눈빛 |

### C. 조선시대 테마 (해학적 사극/강한 풍자)

| 키 | 역할 | 외형 |
|---|---|---|
| storyteller | 진행자(전기수) | 갓을 쓰고 부채를 든 입담 좋은 이야기꾼, 장터에서 소식을 전함 |
| peasant | 실수요자(평민) | 내 집(초가집) 마련이 꿈인 땀 흘리는 짚신 차림의 덥룩한 평민 |
| minister | 정책(호조판서) | 화려한 관복을 입고 수염을 쓰다듬는 조정의 고위 대신, 거드름 피우는 표정 |
| middleman | 부동산 소장(거간꾼) | 엽전 꾸러미를 들고 능글맞게 웃는 중간 상인(객주) |
| wife | 현실주의(아낙네) | 주걱이나 국자를 들고 헛된 꿈을 꾸는 남편을 등짝 스매싱하는 억척스러운 아내 |
| scholar | 전문가(실학자) | 두꺼운 고서를 들고 돋보기를 쓴 깐깐한 선비, 세상 물정에 밝음 |

> **C 테마 활용 팁**: 현대 부동산 용어를 조선시대식으로 유쾌하게 비튼다.
> (예: 주택담보대출 → 고리대금 장부, 아파트 청약 → 한양 기와집 추첨, 금리 인상 → 소작료 폭등)

### 캐릭터 사용 규칙
- 선택된 1개 테마 안에서 한 에피소드에 2~4명만 등장 (테마 혼용 금지)
- 한 패널에 1~2명 배치 (화면 답답하지 않게)
- 각 대사 20자 이내 (말풍선 크기)
- 이모지 활용 가능
- 마지막 컷에 반전/풍자 펀치라인 필수
- 생성 이미지 각 패널 오른쪽 하단에 "BOOIN" 워터마크 기재

---

## 실행 방법

### 방법 1: 스크립트 (권장)
```bash
# scripts/generate-toons.ts 생성 후 실행
npx tsx --tsconfig tsconfig.json scripts/generate-toons.ts
```
- `.env.local`에서 `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 자동 로드
- JSON 파싱 실패 시 최대 3회 재시도 (temperature 낮춰서)
- 여러 기사 순차 처리, 기사 사이 10초 대기 (레이트 리밋 방지)

### 방법 2: API 호출 (관리자 인증 필요)
```
POST /api/toon/generate
Authorization: Bearer {admin_token}
Body: { "newsTitle": "...", "newsContent": "..." }
```

---

## DB 스키마

**테이블**: `news_toon_episodes`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK |
| episode_number | int | 에피소드 번호 (자동 증가) |
| title | text | AI 생성 제목 |
| subtitle | text | 부제목 |
| slug | text | URL 슬러그 (`ep001-제목`) |
| category | text | 카테고리 |
| article_html | text | 해설 기사 HTML |
| article_summary | text | SNS 공유용 한줄 요약 |
| panels | jsonb | 패널 배열 |
| toon_image_url | text | 생성된 이미지 URL |
| source_news_url | text | 원본 뉴스 URL |
| source_news_title | text | 원본 뉴스 제목 |
| status | text | draft / published |
| published_at | timestamptz | 발행 시간 |
| view_count | int | 조회수 |
| created_at | timestamptz | 생성 시간 |

---

## 스토리지 규칙

- **경로**: `ai-photos/toon-images/toon-{timestamp}.{jpg|png}`
- **이전 이미지 절대 삭제 금지** — 항상 새 파일 생성, URL만 업데이트
- `upsert: true`로 업로드하되 파일명에 timestamp 포함하여 충돌 방지

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/toon` | 에피소드 목록 (episode_number 내림차순) |
| GET | `/api/toon/[slug]` | 에피소드 상세 + 조회수 증가 |
| POST | `/api/toon/generate` | 뉴스툰 생성 (관리자 전용) |

---

## 프론트엔드 페이지

| 경로 | 설명 |
|---|---|
| `/toon` | 에피소드 목록 |
| `/toon/[slug]` | 에피소드 상세 (기사 좌 + 웹툰 우) |

---

## 주요 파일

| 파일 | 역할 |
|---|---|
| `src/lib/ai-toon.ts` | 핵심 파이프라인 (3단계 생성 로직) |
| `src/app/api/toon/generate/route.ts` | 생성 API (관리자 전용) |
| `src/app/api/toon/route.ts` | 목록 API |
| `src/app/api/toon/[slug]/route.ts` | 상세 API |
| `src/app/toon/page.tsx` | 목록 페이지 UI |
| `src/app/toon/[slug]/page.tsx` | 상세 페이지 UI |

---

## 자동 실행 워크플로우

> **지시: 사용자가 뉴스 기사를 공유하면, Claude는 아래 순서에 따라 파일 쓰기/터미널 실행/DB 확인/정리까지 모든 과정을 직접 자동화한다. 사용자에게 추가 확인을 구하지 않고 즉시 실행한다.**

### 실행 순서

0. **컨텍스트 확인**: `PROGRESS.md` 읽기 → 마지막 에피소드 번호, 미해결 이슈 파악
1. **기사 전처리**: 제목에서 특수문자(`"`, `…`, `'`, `"`, `"`) 제거 — JSON 파싱 오류 방지
2. **스크립트 생성**: `scripts/generate-toons.ts` 파일을 직접 작성 (Write 도구 사용)
   - NEWS_ARTICLES 배열에 기사 제목 + 본문 추가
   - robustJSONParse + 3회 재시도 로직 포함
   - 기사 간 10초 대기 (레이트 리밋 방지)
3. **터미널 실행**: `npx tsx --tsconfig tsconfig.json scripts/generate-toons.ts` 명령어 직접 실행 (Bash 도구, timeout 600초)
4. **결과 확인**: DB에서 episode_number, title, toon_image_url 조회 (node 스크립트로 직접 확인)
5. **published_at 보정**: null이면 현재 시간으로 직접 업데이트
6. **정리**: 임시 스크립트 삭제 (`rm scripts/generate-toons.ts`)
7. **사용자에게 결과 보고**: EP 번호, 제목, 이미지 여부, 상태를 테이블로 출력
8. **PROGRESS.md 업데이트**: 생성된 에피소드 정보, 성공/실패 여부 기록

### 컨텍스트 연동 (memory-skill.md)
- **시작 전 확인**: PROGRESS.md에서 마지막 EP 번호, 미해결 생성 오류 확인
- **완료 후 기록**: 생성된 EP 번호/제목/이미지 여부, 에러 발생 시 상세 내용

---

## 트러블슈팅

| 문제 | 원인 | 해결 |
|---|---|---|
| JSON 파싱 실패 | Gemini가 HTML 안에 `"` 사용 | 재시도 (temperature 낮춰서), robustJSONParse 사용 |
| 패널 중복 이미지 | 홀수 컷 → 2xN 그리드 빈칸 | 짝수만 허용 (6/8컷), 홀수면 마지막 컷 제거 |
| Gemini 500 에러 | 서버 일시 오류 | 10초 대기 후 재시도 |
| Gemini 429 에러 | 레이트 리밋 | 기사 사이 10초 대기, 시간 두고 재실행 |
| published_at null | 스크립트에서 미설정 | 수동 업데이트 또는 status='published' 시 자동 설정 |
| 이미지 생성 실패 | 모델 거부/오류 | 텍스트만 저장됨, 나중에 이미지만 재생성 가능 |

---

## 비용 참고

- **텍스트 (1~2단계)**: gemini-2.5-flash — 에피소드당 약 ₩1~2
- **이미지 (3단계)**: gemini-3-pro-image-preview — 에피소드당 약 ₩50~100
- **하루 2개 기준**: 월 ₩3,000~6,000 예상
