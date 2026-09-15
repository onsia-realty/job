# 단기임대(/stay) MVP 진행 상황

> 전체 프로젝트 진행은 루트 `PROGRESS.md`. 이 파일은 /stay 전용.


플랜 원본: `C:\Users\Dae\.claude\plans\gleaming-herding-turing.md`
상세 결정사항: 메모리 `project_short_term_rental_stay.md`, `project_stay_business_model.md`

## 완료
| Phase | 내용 | 상태 |
|---|---|---|
| 0 | `NEXT_PUBLIC_STAY_ENABLED` 플래그 + `/stay` 스텁 + 링크 조건부 교체 | ✅ |
| 1 | 마이그레이션 035~037 작성 | ✅ |
| 2 | 타입/Zod/`/api/stays` POST·GET·`[id]`·`[id]/view` | ✅ tsc0, Zod 29/29 |
| 3 | `api/stays/lookup-building` + `lib/stay/pnu.ts` | ✅ |
| 4 | `StayImageGallery` + upload 확장 | ✅ |
| 5 | `/stay/new` 등록폼 + 038 SQL | ✅ tsc0/lint0/165테스트/route 200 |
| 6 | `/stay` 목록·필터 + `/stay/[id]` 상세 | ✅ |
| 7 | `/onsia` 단기임대 탭 + admin API 3종 | ✅ tsc0/165테스트/무토큰 403 |
| 8 | `/stay/owner` 랜딩 + leads | ✅ |
| — | **035~038 라이브 DB 적용** | ✅ `GET /api/stays` 200, 검증 9항목 일치 |

## 남은 작업
- **admin 토큰 실검증 (미완)** — 승인/노출 토글·status 변경이 실제 DB에 반영되는지. 현재는 무토큰 403 경로만 검증됨. 관리자 계정 자격 증명 필요
- **주입차단 로컬 회귀 완료 / 실계정 검증 미완** — API 핸들러 테스트에서 `agent_*` / `is_approved` / `user_id` / `views` 강제 주입 무시 확인. 로그인 테스트 계정과 운영·스테이징 DB 검증은 남음
- **Phase 9** — `NEXT_PUBLIC_STAY_ENABLED=true` 플래그 on + 스테이징 전체 1회전
- (선택) `stay-leads` 는 API만 있고 `/onsia` 탭 UI 미연결

## 미결
- 메뉴명 확정: 단기임대 / 한달살기 / 중기임대 (현재 '단기임대', `lib/stay/constants.ts` 한 곳)
- `/public/images/stay/` 자산 0장 → 전 카드 폴백. Gemini 12건×4장 ≈ $1.9

## 함정 (반복 실수 방지)
- 금액은 **원 단위 `_won` 접미사**. 시세 도메인(만원)의 `formatKoreanPrice` 금지 → `lib/stay/format.ts` 사용
- `stayCreateSchema`는 `.passthrough()` 금지 (명시 화이트리스트만)
- curl 검증 시 **User-Agent 헤더 필수** — middleware가 UA 없으면 403 오탐
- 중개사 법정표기 6항목은 **서버 스냅샷**. anon RLS로 조인 불가
- 중개사 자동 승인은 서버 관리 `app_metadata.brokerVerified + brokerRegNo` 연결이 필요하다. `user_metadata`의 기존 플래그나 users 프로필 등록번호를 권한 근거로 사용하지 않는다.
- Supabase 프로젝트 2개 혼동 주의: 앱은 `pkbnudkbkhzqjhwffkbj`(onsia-job, FREE). `uwddeseqwdsryvuoulsm`은 별개 앱(onsia-crm)
- dev 포트 `3007` + `NEXT_PUBLIC_STAY_ENABLED=true`
- **`npm run lint` 는 리포 전체 106 errors / 217 warnings 가 사전 베이스라인**이다. "lint 0" 은 달성 불가 → 변경한 파일만 대상으로 eslint 돌려 비교할 것
- dev 서버가 죽은 채 포트를 잡고 있으면 `_error` 페이지가 500을 뱉는다. 내 코드 탓으로 오인하지 말 것(`.next/dev/lock` 확인)

## 세션 운영 규칙
- Phase 단위로 새 세션. 첫 명령: "progress.md 읽고 이어서 Phase N 시작"
- 파일 전체 읽기 금지 → grep/검색으로 필요 구간만
- 수정은 Edit(부분 치환)만. 전체 덮어쓰기 금지
- 테스트/빌드 로그는 실패 원인만. 성공 로그 전문 금지
- 계획 장황 설명·수정 코드 재출력 금지. 답변 3줄 이내
