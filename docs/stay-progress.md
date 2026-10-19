# 단기임대(/stay) MVP 진행 상황

> 전체 프로젝트 진행은 루트 `PROGRESS.md`. 이 파일은 /stay 전용.

## 현재 상태 (2026-10-16)

- 결제/집계 후속 운영 047/048은 사용자 승인으로 적용하고 구조·권한34·실제 DB ROLLBACK 통합15검사 및 데이터 fingerprint 보존을 확인했다. service_role 집계 REST204·10.9초 성공(함수 전용 timeout60초), 격리 SQL26 재통과. 앱 배포·실카드 결제는 하지 않았으며 STAY 실계정 전체 흐름/039~046 전량 적용 이력 확인과는 구분한다.
- `main` / `007e4d4`에 호스트·게스트·중개사 흐름이 병합됐다. `/stay/new`, `/stay/inquiries`, `/stay/requests`, `/stay/admin`과 등록 도움·위임 초안·소유주 확인·관리자 승인 API가 구현돼 있다.
- 공개 매물 DTO·인증 사용자 관리 응답을 분리하고 신규 등록과 내용 수정은 승인 대기로 처리한다. 문의 041, 비공개 읽기 042, 소유주 워크플로 043이 저장소에 있다.
- 기존 미커밋 `StayAgentBlock.tsx`·`public-dto.ts`는 등록번호 표시와 공개 응답을 제거한다. 현재 공개 중개사 필드는 사무소명·소재지·연락처·대표자 4개이며 서버 저장 스냅샷과 다르다. 법률 적합성 판단을 뜻하지 않는다.
- 로컬 자산 `public/images/stay/`는 13파일 존재한다. 과거 '0장' 기록은 폐기한다. 실제 카드별 연결·품질은 브라우저 검증이 필요하다.
- 추가 구현 전 코드 기준선은31파일442테스트다. 운영039 정책·046 컬럼 존재 및047/048 적용·검증은 확인했으며 039~046 전량 파일 이력·실제 계정별 STAY 등록/수정/승인/문의 UI·앱 배포는 후속이다.
- 결제·집계 후속을 포함한 최종 전체 검증은 32파일 494테스트, tsc, 변경·신규 소스 19개 lint 오류/경고 0, diff check 및 프로덕션 빌드(정적 페이지 110개) 통과다. 기존 middleware 폐기 예정 안내 1건과 STAY 실계정 검증은 별개로 남아 있다.

아래 Phase 표는 초기 MVP 이력이다. 035~038 운영 적용 기록도 과거 확인이며 현재 운영 스키마 재검증을 대신하지 않는다.

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
- 등록 도움 신청은 `/stay/admin`에서 접수·위임 초안·승인 UI가 연결됐다. `/onsia` 탭 연결 여부와 별개로 해당 화면을 실제 관리자 계정으로 검증한다.

## 미결
- 메뉴명 확정: 단기임대 / 한달살기 / 중기임대 (현재 '단기임대', `lib/stay/constants.ts` 한 곳)
- `public/images/stay/` 13파일의 카드 연결 및 실패 폴백을 브라우저에서 확인한다. 신규 생성 비용은 추가 작업 확정 후 산정한다.

## 함정 (반복 실수 방지)
- 금액은 **원 단위 `_won` 접미사**. 시세 도메인(만원)의 `formatKoreanPrice` 금지 → `lib/stay/format.ts` 사용
- `stayCreateSchema`는 `.passthrough()` 금지 (명시 화이트리스트만)
- curl 검증 시 **User-Agent 헤더 필수** — middleware가 UA 없으면 403 오탐
- 중개사 서버 스냅샷과 공개 DTO를 구분한다. 서버는 승인된 `app_metadata.brokerRegNo`로 레지스트리를 읽으며 현재 로컬 공개 응답은 등록번호를 제외한다. 익명 직접 DB 조인에 의존하지 않는다.
- 중개사 자동 승인은 서버 관리 `app_metadata.brokerVerified + brokerRegNo` 연결이 필요하다. `user_metadata`의 기존 플래그나 users 프로필 등록번호를 권한 근거로 사용하지 않는다.
- Supabase 프로젝트 2개 혼동 주의: 앱은 `pkbnudkbkhzqjhwffkbj`(onsia-job, FREE). `uwddeseqwdsryvuoulsm`은 별개 앱(onsia-crm)
- dev 포트 `3007` + `NEXT_PUBLIC_STAY_ENABLED=true`
- 106 errors / 217 warnings는 과거 lint 기준선이다. 정리 이후 현재 수치로 인용하지 않으며 변경 파일과 필요한 전체 검사 결과를 새로 기록한다.
- dev 서버가 죽은 채 포트를 잡고 있으면 `_error` 페이지가 500을 뱉는다. 내 코드 탓으로 오인하지 말 것(`.next/dev/lock` 확인)

## 세션 운영 규칙
- Phase 단위로 새 세션. 첫 명령: "progress.md 읽고 이어서 Phase N 시작"
- 파일 전체 읽기 금지 → grep/검색으로 필요 구간만
- 수정은 Edit(부분 치환)만. 전체 덮어쓰기 금지
- 테스트/빌드 로그는 실패 원인만. 성공 로그 전문 금지
- 계획 장황 설명·수정 코드 재출력 금지. 답변 3줄 이내
