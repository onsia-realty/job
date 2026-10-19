# P0-01~04 권한·결제 경계 점검

작성: 2026-09-15 / 현행 갱신: 2026-10-20. 범위: 로컬 코드·회귀 테스트와 운영 적용·배포 확인 및 과거 감사 이력.

## 현행 상태 (2026-10-20)

- 앱 `383caca` 운영 배포 Ready·booin.co.kr 연결 확인. SecurityShield 창 크기 기반 차단/반복 debugger 제거 후 우회 없는 production18회귀 포함 전체528테스트·빌드 통과. 실제 운영320/390px 차단/가로 넘침 없음, 공개200·비로그인 주문401/관리자403/cron401 확인. 아래 미배포 설명은 당시 이력이다. 실계정 결제·실과금은 수행하지 않았다.

- 사용자 승인 후 운영 047/048 적용 완료: Chrome SQL Editor에서 예상 앱 프로젝트 `pkbnudkbkhzqjhwffkbj`의 main PRODUCTION/postgres를 확인하고 각 실행 성공을 확인했다. 039 정책과 046 컬럼은 실제 존재한다. 마이그레이션 이력 테이블은 없으므로 파일 번호별 전량 적용을 주장하지 않고 카탈로그·실행·검증 결과를 적용 근거로 삼는다.
- 운영 구조·권한 34검사, 실제 DB ROLLBACK 통합 15검사 통과. 기존 users14/jobs7/payments6의 금액/상태/기간 fingerprint 동일, orders0·합성 공고0으로 검증용 데이터 잔류 없음. 고객 행 없는 적용 전 카탈로그·baseline JSON은 `supabase/backups/`에 저장했다.
- 047은 운영 기존 `trigger_set_payment_expires_at`가 명시적 만료일을 덮어쓰는 문제를 조건부 보완했다. 명시적 expires_at 보존·레거시 NULL 계산·원본 함수 속성을 유지하고 운영 원본 트리거로 로컬 및 실제 DB ROLLBACK 15검사를 통과했다.
- 048은 함수 전용 `statement_timeout='60s'`·schema reload 보정 후 service_role REST에서 HTTP204·약10.9초로 실제 갱신 성공했다. 최초 8.4초의 57014를 해결했고 전역/역할 설정은 변경하지 않았다. 운영은 매매 MV만 존재하고 전세 MV(033)는 없으므로 별도 후속이다. 격리 SQL26도 재통과했다.
- 앱 배포·실카드 과금·커밋은 수행하지 않았다. 아래 미적용/미준비 문구는 승인 전 점검 이력이며 실계정 UI·토스 테스트 결제는 후속이다.
- 기준 `main` / `007e4d4`는 로컬·GitHub 일치. 아래 9월 운영 카탈로그·건수는 당시 관찰이며 현재 권한 상태로 단정하지 않는다.
- 광고 기간 분리·완료 결제 기반 재계산·연장·업그레이드 UI·만료 cron은 046과 `src/lib/ad-entitlement.ts`로 구현됐다. `sales-dia` 판매 차단은 유지한다.
- 신규 로컬 047: 서버 주문 스냅샷, 서버 전용 claim/apply RPC, 주문·공고 행 잠금으로 원장/광고 창/등급 트랜잭션 반영, 제공사 재확인과 멱등 복구, 부분취소 이력/잔액 보존(광고 유지), 공고 삭제 SET NULL 및 식별자·제목 스냅샷 보존. 격리 PGlite 047/048 SQL 26검사 통과. 사용자 삭제 CASCADE는 현행 유지한다.
- 공통 `recomputeJobAd`는 047 `recompute_payment_job_ad` 잠금 RPC로 최신 결제 창 조회와 등급 반영을 한 트랜잭션에 수행한다. 레거시 confirm/webhook와 만료 cron도 같은 보호를 받아 동시 처리 중 오래된 투영값 덮어쓰기를 방지한다.
- 적용 전 기준선은31파일442테스트다. 이후 039 정책·046 컬럼 존재와 047/048 적용·권한/ROLLBACK 통합을 확인했다. 039~046 전체 파일 이력·실계정 UI·실결제·앱 배포는 후속이며 백업 존재만으로 적용을 판단하지 않는다.
- 최종32파일494테스트·tsc0·변경/신규19소스 ESLint0/0·diff check·빌드110페이지 및 격리 SQL26 통과다. 운영 후속 후 전체 테스트와 SQL26도 재통과했다. 기존 middleware 폐기 예정 안내1건은 남아 있다. 사후 증적 `supabase/backups/post-048-refresh-2026-10-16.json` 및 PNG는 빈 search_path·timeout60초·definer·service 실행/공개 역할 차단을 확인한다.
- 현재 로컬 STAY UI/공개 DTO는 등록번호를 제외한다(기존 미커밋 변경). 서버 스냅샷 저장과 공개 응답 필드 수는 다르며 이 문서는 법률 적합성을 판단하지 않는다.

### 운영 적용 전 스키마 준비 상태 확인 이력

적용 전 예상 앱 프로젝트 확인 후 service_role REST HEAD만 요청했다. `jobs?select=ad_expires_at`과 `payments?select=starts_at`은 200으로 046 컬럼 존재를 확인했다. 047 `payment_orders?select=order_id`는 404, 결제 추가 컬럼 조회는 400이었다. 이 관찰 이후 사용자 승인으로 047/048을 적용하고 위 운영 검증을 완료했다. 최초 읽기 점검에서는 행 본문·키 값 출력과 DB 변경이 없었다.

### 웹훅 신뢰 경계

일반 토스 웹훅에는 네이티브 `x-webhook-secret` 서명 헤더가 없다. 헤더 누락 자체를 거절 근거로 삼지 않고, 인증된 Toss Query API로 결제를 다시 조회하여 paymentKey/orderId/amount/currency 및 저장된 주문 연결을 검증한 뒤 반영한다. 커스텀 헤더를 명시 제공한 요청은 설정된 secret과 다르면 401로 거절한다. 토스 설정·환경변수 실제 변경은 수행하지 않았다. 근거: [토스페이먼츠 공식 연동 참고](https://docs.tosspayments.com/guides/v2/get-started/llms-quick-reference).

### 047/048 SQL 재현 검증

저장소 의존성을 변경하지 않고 별도 임시 폴더에 PGlite를 설치한 뒤 아래 명령으로 실행한다. `<임시폴더>`는 작업자가 만든 별도 폴더로 바꾼다.

```powershell
npm install --prefix <임시폴더> --no-save --package-lock=false --ignore-scripts @electric-sql/pglite
node scripts/test-payment-order-ledger.mjs <임시폴더>
```

이 스크립트는 운영 연결 없는 격리 DB에서 047/048을 검사한다. 현재 26검사 통과: 결제 원자 적용·중복/복구·부분취소·삭제 보존, 역할별 실행권한, 두 MV 실제 갱신 및 재적용, 최신 환불 재계산 반복과 공개 역할의 재계산 실행 차단을 포함한다. 실제 운영 스키마·제공사·배포 검증을 대체하지 않는다.

## 확인 범위와 제한

- 시작 브랜치: `feature/stay-mvp-2026-09`, 기준 HEAD `cd7400c`.
- 기존 단기임대 등록·내 매물·사무소 동기화 미커밋 작업을 보존한다.
- API 회귀 테스트는 실제 핸들러를 호출하고 Supabase와 결제 서버를 모킹한다. 운영 인증 계정 간 테스트와 구분한다.
- SQL 변경 파일 작성은 운영 적용을 의미하지 않는다. Supabase SQL Editor에서 스키마 카탈로그를 읽기 전용으로 조회했으며, `039` 적용과 데이터 변경은 수행하지 않았다.

## 운영 읽기 전용 점검

`.env.local`의 앱 프로젝트가 `pkbnudkbkhzqjhwffkbj`인지 확인한 뒤 REST `HEAD`, `select=id`, `limit=1`, `Prefer: count=exact`로 건수만 확인했다. 각 요청에 User-Agent를 지정했다. 행 본문, 개인정보, 토큰 값은 출력하지 않았다.

| 조회 조건 | 익명 권한 건수 | service_role 건수 | 해석 |
|---|---:|---:|---|
| stays: 비활성 또는 미승인 | 0 | 3 | 존재하는 비공개 행이 익명 조회에서 숨겨짐 |
| jobs: 비활성 또는 미승인 | 0 | 7 | 존재하는 비공개 행이 익명 조회에서 숨겨짐 |
| resumes: is_public=false | 0 | 0 | 대상 데이터가 없어 차단 여부 판단 불가 |
| payments 전체 | 0 | 6 | 존재하는 결제 행이 익명 조회에서 숨겨짐 |
| users 전체 | 0 | 12 | 존재하는 회원 행이 익명 조회에서 숨겨짐 |

응답은 모두 HTTP 200 또는 206이었다. 위 결과는 특정 조회의 관찰 결과이며 실제 RLS 정의 일치, 로그인 사용자 A/B 간 격리, UPDATE/INSERT 차단을 증명하지 않는다. 건수는 실제 고객 활동 지표가 아니다.

## 운영 RLS·권한 카탈로그 비교

2026-09-15 앱 프로젝트 `pkbnudkbkhzqjhwffkbj`의 `pg_policies`, `pg_class`, `information_schema.table_privileges`, `information_schema.column_privileges`, 트리거와 `SECURITY DEFINER` 함수 목록을 SQL Editor에서 SELECT로만 조회했다.

- 여섯 테이블 모두 RLS가 활성화돼 있고 `FORCE ROW LEVEL SECURITY`는 꺼져 있다.
- `anon`, `authenticated`, `service_role`에 여섯 테이블의 SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER 권한이 모두 부여돼 있다. INSERT/UPDATE/REFERENCES 컬럼 권한도 모든 컬럼에 열려 있다.
- `users`는 본인 행 UPDATE 정책과 전체 컬럼 UPDATE 권한이 함께 있다. 따라서 인증 사용자가 직접 REST를 호출해 본인 `user_type`을 `admin`으로 바꿀 수 있는 권한 경로가 카탈로그상 성립한다.
- `jobs` 공개 정책은 `is_active=true`만 검사해 미승인 공고도 공개 대상이 된다. 본인 INSERT/UPDATE는 승인·광고 등급을 포함한 모든 컬럼을 허용한다.
- `stays` 공개 조회는 active+approved를 검사하지만 본인 INSERT/UPDATE가 모든 컬럼에 열려 있어 승인 상태와 법정표기 스냅샷을 직접 주입할 수 있다.
- `applications`는 지원자 본인에게 ALL 정책이 있어 상태·공고·이력서 연결을 직접 바꿀 수 있고, 공고 소유자의 조회/상태 변경 정책은 없다.
- `resumes`는 공개 설정 또는 본인 조회·수정을 허용하지만 실제 제출을 받은 공고 소유자 조회 정책은 없다. `payments` 본인 조회 정책은 있으나 테이블 권한은 불필요하게 넓다.
- 공개 실행 가능한 `SECURITY DEFINER` 함수는 `increment_stay_views(uuid)`와 `increment_ai_usage(uuid,date,integer)` 두 개다. 후자는 클라이언트가 사용자 ID와 제한값을 지정할 수 있어 `039`에서 둘 다 service_role 전용으로 제한하도록 보완했다.
- 대상 테이블에는 updated_at·결제 만료 트리거만 확인됐고 `auth.users` 가입 트리거는 조회 결과에 없었다.

따라서 운영 정책은 로컬 `039`의 목표 계약과 일치하지 않는다. `039`는 위 직접 쓰기·과도한 grant·공개 RPC를 닫지만 아직 운영 DB에 적용하거나 테스트 DB에서 실행 검증하지 않았다. 실제 쓰기 우회는 운영 데이터 보호를 위해 시도하지 않았다.

Supabase Advisor에는 별도 CRITICAL 4건도 표시됐다: `public.notices` RLS 미활성화, `public.complex_monthly_growth`, `public.complex_aggregates_with_geo`, `public.public_bookings`의 Security Definer View. 추가 카탈로그 조회에서 네 객체 모두 익명 SELECT 가능함을 확인했다. 특히 `notices`는 RLS 없이 익명·인증 사용자에게 전체 쓰기와 TRUNCATE까지 허용돼 공지 변조가 가능하다. 이를 공개 읽기/service_role 쓰기로 제한하는 미적용 초안 `040_security_advisor_hardening.sql`을 분리 작성했다.

세 뷰의 현재 출력은 시세 집계·좌표와 `public_bookings`의 `property_id/start_date/end_date`뿐이다. 그러나 `public_bookings`는 저장소에 정의가 없고, `security_invoker` 전환 시 하위 테이블/MV의 RLS·grant에 따라 기존 공개 조회가 끊기거나 더 넓은 원본 grant가 필요할 수 있다. 따라서 이번 초안은 뷰를 바꾸지 않고 `scripts/audit-security-advisor-hardening.sql`로 PostgreSQL 버전, 정의, 의존성, 실제 권한과 하위 정책부터 확인하도록 했다.

## 인증 근거

Supabase의 `user_metadata`는 로그인 사용자의 `updateUser({ data: ... })`로 수정할 수 있다. 서버가 다시 읽어도 권한 근거로 안전해지지 않는다. 권한 정보는 서버 관리 `app_metadata`에서 읽고 기존 사용자 메타데이터를 자동 승격하지 않는다.

공식 문서: [사용자 메타데이터 수정](https://supabase.com/docs/reference/javascript/auth-updateuser), [RLS와 메타데이터 신뢰 경계](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 후속 정책 결정

- 중개사무소 등록번호 검색은 사무소의 존재 확인이다. 계정의 소속·대표자 권한 입증은 별도다.
- 소속 승인에 사용할 증빙, 검토 담당자, 승인·회수 절차는 아직 확정하지 않았다. 기존 `user_metadata` 인증 플래그와 프로필 등록번호는 승인 증빙으로 사용하지 않는다.
- 기존 계정은 별도 확인 후 서버 관리 인증 정보와 사무소 연결을 부여해야 한다. 자동 이전하지 않는다.
- 공개 이력서의 연락처·상세정보 노출 범위는 기존 `is_public` 공개 설정을 따른다. 별도의 연락처 공개 동의나 채용기업 제한은 제품 정책 결정이 필요하다.

## 결제 흐름 P0-04 1차 보완

- 결제 승인 전에 공고의 `category`와 서버 카탈로그 상품의 `category`를 정확히 비교한다. 불일치하거나 공고 카테고리가 비어 있으면 토스 승인 호출 전 거절한다.
- 저장소 DB CHECK와 목록 UI가 지원하지 않는 `sales-dia`는 `purchaseEnabled: false`로 두고 프리미엄·공고등록 CTA, 직접 checkout, confirm API에서 모두 차단한다.
- 토스 승인과 결제 원장 저장 뒤 공고 tier 적용이 실패하면 성공으로 응답하지 않는다. 동일한 completed 결제의 재요청에서는 tier 적용을 다시 시도한다.
- 교차 카테고리, 빈 카테고리, DIA 직접 요청, tier 적용 실패, 정상 agent/sales 조합을 실제 confirm 핸들러 테스트로 검증했다. 관련 3파일 70테스트와 TypeScript가 통과했고 변경 파일 lint는 0 errors/5 warnings였다.

2026-10-16 정정: 모집 `deadline`과 광고 만료/결제 시작일 분리 및 유효 등급 재계산은 046으로 구현됐다. 047은 서버 주문 원장·제공사 확인/복구·원자적 원장/광고 적용·부분취소 이력/잔액·공고 삭제 후 보존을 로컬 구현한다. 운영 039~046 확인→047/048 적용→권한 검사→앱 배포→실계정·토스 테스트 결제 순서로 확인해야 한다. 원장 없는 구버전 checkout 미승인 주문은 새 checkout에서 다시 시작하며 공고 없는 선결제의 신규 공고 자동 연결은 후속이다. 운영 검증까지 마치기 전 P0-04와 유료 운영 확대는 완료로 표시하지 않는다.

## 권한 표

아래는 수정된 API와 039 마이그레이션의 목표 계약이다. 운영 DB에 적용됐다는 뜻은 아니다.

| 자료 | 비로그인 | 사용자 A의 본인 자료 | 사용자 B | 관리자 |
|---|---|---|---|---|
| stays | 활성·승인 자료 조회 | 비공개 포함 조회, API 수정·삭제 | 공개 자료만 조회, A 자료 변경 거절 | 관리자 API 조회·승인·변경·삭제; 일반 소유자 API는 타인 변경 거절 |
| jobs | 승인된 공고만 상세 조회, 마감은 410 | 편집용 조회·수정·삭제 | 미승인 자료 조회·A 자료 변경 거절 | 관리자 API 관리; 일반 소유자 API는 타인 변경 거절 |
| resumes | 직접 DB는 공개 설정 자료만 조회; 상세 API는 로그인 필요 | 조회·저장·삭제 | 공개 자료 또는 본인 공고에 실제 제출된 이력서만 조회 | 일반 상세 API에 포괄 열람 예외 없음 |
| payments | 조회 거절 | 본인 내역 조회, 본인 공고 결제 확인 | A 결제 재확인·내역 조회 거절 | 관리자 결제 API 조회 |
| applications | 조회·지원 거절 | 본인 이력서로 지원·지원 취소 | 본인 공고에 접수된 지원 조회·상태 변경 | 일반 지원자 API에는 소유권 적용 |

039는 브라우저의 users/stays/payments 직접 쓰기와 jobs 등급·승인 필드 쓰기를 차단한다. 서비스 키를 사용하는 API는 별도로 인증·소유권을 확인한다. `users.user_type` 관리자 판정이 안전하려면 이 DB 보호와 외부 가입 트리거 점검이 함께 필요하다.

## DB 변경 검토 순서

1. 이번 읽기 전용 결과를 기준으로, 적용 직전 `scripts/audit-p0-permissions.sql` 전체 결과를 다시 내보내 보관한다.
2. 저장소 밖에서 만든 가입 트리거, SECURITY DEFINER 함수, view가 사용자 입력을 관리자 권한으로 승격하거나 비공개 자료를 노출하지 않는지 확인한다. Advisor 뷰는 `scripts/audit-security-advisor-hardening.sql` 결과를 먼저 검토한다.
3. `supabase/migrations/039_p0_authorization_boundaries.sql`과 API 변경의 적용 순서를 정한다. 이 파일은 6개 테이블의 기존 정책을 교체하므로 운영의 별도 정책을 먼저 비교해야 한다.
4. 별도 테스트 DB에서 039와 040을 순서대로 적용하고 `scripts/check-p0-permissions.sql`, Advisor audit 및 실제 비로그인/A/B/지원받은 구인자/관리자 권한 테스트를 실행한다.
5. 기존 인증 플래그를 복사하지 않고 계정별 소속 증빙을 재확인한다. 서버 관리 `app_metadata.brokerVerified=true`와 `brokerRegNo`를 한 쌍으로 부여한다. 사업자 승인은 `app_metadata.businessVerified=true`다. 승인·회수는 서버 관리 권한으로만 수행한다.

카탈로그 SELECT는 운영 SQL Editor에서 실행했지만 `039`와 적용 후 검사 SQL의 문법·효과는 아직 테스트 DB에서 검증하지 않았다. 롤백 시 전체 예전 정책 복원은 기존 권한 상승 경로를 다시 열 수 있으므로 보관한 정책에서 필요한 권한만 선택적으로 복원한다.
