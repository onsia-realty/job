# Market 데이터·검색 상태 검토 — 2026-10-23

## 최종 테스트 구독 보정 — job 8cff1c30-8c94-45ae-9062-39b1b44e47b2

- 전달받은 독립 QA 결과: TypeScript와 market 12파일 lint 통과, 빌드 110/110 통과. 수정 전 전체 테스트는 47파일 중 46통과·1실패, 661테스트 중 660통과·1실패였다.
- 단일 파일의 읽기 전용 메모리 진단에서 첫 테스트가 React Query 결과 프록시를 그대로 반환하고 data만 먼저 읽어 isError 전환을 구독하지 않는 원인을 확인했다. B의 data는 undefined로 유지되며 전환 후 waitFor에서 처음 isError를 읽는 것은 늦었다. fetch는 재시도·중복 없이 A 다음 B로 정확히 호출됐다.
- 첫 테스트의 renderHook 콜백에서 렌더 중 data와 isError를 구조 분해하고 일반 객체로 반환하도록 최소 수정했다. 모든 assertion과 프로덕션/query 알림 동작은 유지했다.
- 전달받은 메모리 진단은 3/3 통과했지만 실제 수정 파일의 Vitest 및 전체 테스트 재실행은 독립 QA 대기다. 이번 앱 실행에서는 알려진 EPERM 때문에 요청대로 Vitest를 실행하지 않는다. 앞선 QA 수치는 이번 실행 결과가 아니다.
- 이번 실제 실행: 대상 테스트 ESLint exit 0, 두 대상 경로의 git diff --check exit 0. git diff 출력이 없어 파일 내용을 직접 확인했다. 실행 거절은 없었다.

## 지도 상태 안내 보정 — job 93b12896-3586-44ff-bc06-9b674ce2b5ec

- MarketPageClient의 loading/loadError를 MarketMap optional loading/error props로 연결했다. SDK 자체 loadError와 거래 조회 error는 별도로 유지한다.
- 실제 지도에서 렌더하는 MarketMapNotice를 분리했다. 단지 모드에서 로딩은 `거래 데이터를 불러오는 중…`, 실패는 `거래 데이터를 불러오지 못했습니다`, 성공한 빈 결과는 `현재 조건에 맞는 거래가 없습니다`로 표시한다. 수집 여부를 단정하지 않는다. 성공한 비어 있지 않은 결과와 집계 모드에서는 안내를 숨긴다. 재시도는 기존 목록/공용 패널에 유지한다.
- 데스크톱 상단 건수는 오류 시 `거래 데이터 조회 실패`를 표시한다. 기존 UI·상태 변경은 보존했다.
- 추가 회귀: 실제 안내 컴포넌트의 로딩/실패/빈 결과/비어 있지 않은 결과/집계 모드/우선순위, 기존 부모 테스트의 지도 props 전달 및 실패 시 0개 미표시·재시도 성공 시 0개 표시.
- 실제 실행: `node node_modules/typescript/bin/tsc --noEmit --incremental false` exit 0; 대상 부모/지도/안내/부모 테스트/안내 테스트 5파일 ESLint exit 0; `git diff --check` exit 0. diff 확인에서 기존 BottomSheet/ComplexListPanel LF→CRLF 안내만 있었다.
- Vitest는 요청에 따라 실행하지 않았다(알려진 EPERM 재시도 없음). 테스트 실행 통과를 주장하지 않으며 root 독립 QA가 필요하다. 브라우저·실제 SDK 검증도 미실행이다.
- 실행 거절 없음. cwd의 RULES.md와 fable/active.md는 파일 부재로 읽기 실패했다. 외부 경로·사적 대화·환경/자격증명 파일·네트워크·Jev·재위임·전역 설정·API/DB 쓰기·cron·커밋·배포는 사용하지 않았다.

대상: `/market?lat=37.51720&lng=127.04730&zoom=14&deal=trade&type=apt&region=11680`

## 확인 및 수정

- 저장소 관련 사용처를 검색하고 프로젝트 지침을 확인했다. 기존 home/auth/payment/STAY 미커밋 변경은 수정하지 않았다.
- `MarketPageClient`: bounds 및 지역/월 fallback의 HTTP 오류를 빈 거래로 취급하던 경로를 제거했다. 요청 시작 시 이전 필터의 단지·동 집계를 비우고 로딩을 표시한다. 활성 거래나 참고 거래 중 하나라도 실패하면 전체 결과를 표시하지 않는 방식을 선택했다. 데스크톱 목록과 모바일 시트의 공용 콘텐츠에 오류·재시도를 제공하고 모바일 요약에서 실패를 0개로 표시하지 않는다.
- 성공·오류·finally를 동일 요청 순서로 보호한다. effect 정리에서 요청을 무효화하므로 필터/모드 변경과 unmount 이후의 오래된 응답은 상태를 덮어쓰지 않는다. gu 진입 시 거래 상태를 초기화한다.
- `useComplexDetail`: 이전 query placeholder를 제거했다. 기간 변경 시에도 로딩할 수 있지만 다른 단지 데이터를 빌리지 않는다. 상세 패널에 단지 key를 부여해 탭·기간·시설 선택 상태를 새 단지에서 초기화한다.
- `MarketSearch`: 비어 있지 않은 입력/포커스 시 패널을 열고 로딩·빈 결과·오류·재시도를 분리했다. debounce 및 fetch 중 이전 검색 결과는 클릭할 수 없다. 검색 placeholder를 제거하고 입력/지우기 접근성 이름과 Escape 닫기를 추가했다. 응답 도착이 닫힌 패널을 다시 열지 않는다.

## 검증

- 추가한 mocked 회귀: 거래 HTTP 오류→재시도→정상 빈 결과, 참고 거래 실패, 필터 변경 시 이전 결과 제거, 이전 요청 오류 및 gu 모드 전환 보호, 상세 A→B 로딩/오류 격리, 검색 첫 입력·빈 결과·오류·재시도·debounce·Escape·지우기.
- TypeScript `--noEmit --incremental false`: 최종 통과. 추가 테스트의 지원되지 않는 `getByRole` 옵션으로 한 차례 실패했고 해당 옵션 제거 후 재검사했다.
- 대상 5개 소스/테스트 ESLint: 최초 오류 1건·경고 3건 수정 후 통과. 최종 수정 테스트도 재검사 통과했다.
- `git diff --check`: 통과. 기존 변경을 포함한 diff를 검사했으며 기존 변경은 보존했다.
- Vitest: 사용자 지시에 따라 실행하지 않았다. 알려진 app spawn EPERM을 재시도하지 않았고 독립 root QA의 실제 실행이 필요하다. 위 테스트는 작성·정적 검사이며 실행 통과를 의미하지 않는다.
- 외부 서비스/네트워크/지도 SDK/실제 데이터/브라우저 검증은 수행하지 않았다. 도구 실행 거절은 없었다.
- 의존성 추가, 환경·자격증명 파일 읽기, 전역 설정, 재위임, DB 쓰기, 커밋·푸시·배포 없음. 데이터 취소/캡·모바일 배치 변경은 다음 단계로 남겼다.

## Phase 2 — 모바일 지표·배치·가격 설명

- 사용자 제공 브라우저 관찰: 데스크톱 기본 열린 360px 지표가 400px 목록과 함께 지도를 좁힘. 모바일 390px에서 document scrollWidth 398px, 검색 입력 압축, 지표 칩 선택 후 보이는 결과 없음. 이번 실행은 브라우저를 재실행하지 않았으며 이 수치는 수정 전 전달 증거다.
- 소스 확인: 지표 초기값 rise 및 md:flex 전용 렌더, 한 줄 검색, h-screen, 목록의 고정 최근 6개월 문구를 확인했다. bounds 조회는 6개월 요청이지만 지역 fallback은 최근 3개월을 순서대로 조회해 처음 거래가 있는 한 달만 반환한다.
- 지표 기본값을 닫힘으로 변경. 모바일 칩은 기존 BottomSheet를 half로 열어 실제 MarketIndicatorPanel을 표시한다. 닫기는 목록으로 복귀하고 랭킹 선택은 지표를 닫아 기존 단지 상세로 전환한다. 헤더 칩과 패널 탭에 aria-pressed를 추가했다.
- 검색을 모바일 전체 너비 둘째 줄에 배치하고 min-w-0, h-dvh, min-h-0 및 메인 layout containment를 적용했다. 가로 필터 스크롤은 유지한다. 시트 높이는 지도 영역 안으로 제한하고 지표 거래 행은 좁은 화면에서 줄바꿈한다. 바텀시트의 기존 렌더 중 ref 참조는 렌더용 드래그 상태로 변경했다.
- 목록에 평균 약 / 최근 거래를 구분하고 기존 응답에서 계산한 최근 거래일만 표시한다. 대표면적은 근사값으로 표시하고 동일 면적 평균이 아니라는 설명, 전체 면적 혼합/선택 면적 구간 설명, 국토교통부 출처, 과거 체결 거래이며 현재 매물이 아니라는 안내를 추가했다. 업데이트 시각은 만들지 않았다. 고정 6개월 대신 조회 경로별 기간이 다름을 알린다.
- 중간 줌 지도 제한이 실제 적용되면 목록 수와 지도 표시 수를 함께 안내한다. 기존 상위 90개 + 선택 단지 예외 및 SDK·필터·플래그·상세 이동은 유지한다. 선행 상태 무결성 변경과 home/auth/payment/STAY 작업은 보존했다.

### 실제 검증 및 한계

- 추가 테스트 `src/__tests__/market-ui.test.tsx`: 실제 BottomSheet/MarketIndicatorPanel에 mocked 데이터로 열기→목록 복귀→랭킹 상세 이동, 기본 닫힘과 aria-pressed, 평균·최근·대표면적·거래일·혼합면적·과거 거래 안내를 확인하도록 작성했다.
- TypeScript `--noEmit --incremental false` 통과. 대상 5개 UI 파일과 신규 테스트 ESLint는 기존 BottomSheet react-hooks/refs 오류를 수정한 뒤 통과. git diff --check 통과(기존 파일 LF→CRLF 안내만 출력).
- Vitest는 사용자 지시에 따라 실행하지 않았다. root 독립 QA에서 새 테스트 및 선행 market 상태 테스트를 함께 실행해야 한다. 브라우저·실제 지도 SDK·네트워크를 사용하지 않았으므로 수정 후 390px scrollWidth와 실기기 시트 높이/가로 스크롤은 아직 검증되지 않았다.
- 취소 거래 제외 여부, 페이지네이션/서버 응답 캡과 전체 거래 완전성, 데이터 신선도 및 수집 기준일 감사는 별도 후속이다. 이 UI 변경은 해당 데이터 문제를 해결했다고 주장하지 않는다.
- 재위임·외부 서비스·API/DB 쓰기·cron·환경/자격증명 읽기·설정 변경·커밋·배포 없음. 도구 실행 거절 없음. cwd의 RULES.md와 fable/active.md는 없어 읽기 실패했으며 외부 경로를 탐색하지 않았다.


## Phase 4 — 데이터 기준 안내와 승인 이미지 (2026-10-23)

- 목록(bounds/월별 fallback과 매매·전월세 참고 응답 포함), 실제 ComplexDetailView의 실거래/월별 집계, 시세 지표에 metadata를 연결했다. 거래 대상 기간, 조회 행 수집 시각 최솟값~최댓값(전체 수집 완료 시각 아님), 집계 갱신 시각 확인 불가, 별도 순위 계산 시각을 구분한다. servedAt은 신선도로 사용하지 않는다.
- 다중 응답은 하나라도 stale/truncated/metadata 누락이면 보수적으로 안내하고 저장 실패도 표시한다. 필터·새 요청·오류 시 이전 안내를 지운다. 구 집계 hook은 기존 배열 반환과 함께 metadata를 전달한다. 지표 HTTP 실패는 오류 안내로 분리했다.
- 승인된 2172×724 PNG를 public/images/market-prices-volume-20261023.png로 복사했다. 원본과 복사본 SHA-256 F2C946C17F8B60F02BB3D043FC4B60AD34E0C82EEAD6CC06DA193EF5E8698F98 일치. 이미지 편집·생성 호출 없음. next/image fill/sizes, 요청 alt와 AI 생성 이미지 · 실제 통계 아님 문구 적용. 목록 스크롤 영역 상단에 모바일 64px/데스크톱 90px로 배치하여 지도 컨테이너/조작 영역 높이 유지.
- 회귀 추가: 시각 의미 분리/servedAt 비노출, 다중 응답 경고·누락 합성, 지표 HTTP 실패와 이전 metadata 제거. 기존 목록 필터 전환 회귀에 metadata 표시/로딩 시 제거와 이미지 연결 assertion 추가.
- 실제 검증: TypeScript --noEmit --incremental false 통과. 대상 8파일 ESLint 오류 0, 기존 ComplexDetailView의 Link/Sparkles 미사용 경고 2건. git diff --check 통과(기존 BottomSheet CRLF 안내). 최종 소규모 수정 재검사 결과는 아래 기록.
- Vitest 대상 5파일 실행을 1회 시도했으나 설정 로딩의 externalize-deps spawn EPERM으로 종료, 테스트 본문 미실행. sandbox 재시도·우회 없음. 브라우저/실제 지도·반응형 시각 검수 및 회귀 실행 통과는 미완료.
- RULES.md, fable/active.md는 cwd에 없어 읽기 실패. 기존 변경 보존. 외부 서비스·네트워크·제공사·Jev·환경/자격증명·사적 대화·전역 설정·DB·재위임·커밋·배포 작업 없음.
- 최종 소규모 수정 3파일 ESLint와 TypeScript --noEmit --incremental false 재검사도 종료 코드 0으로 통과. 회귀 테스트 본문은 EPERM으로 미실행.
# Phase 2/3 날짜 경계 독립 리뷰 보정 (2026-10-23)

- MV 순위의 9월 기간 종료일은 9월 30일이다. 집계와 단지 monthlyMetadata는 반환된 최신 월의 월말을 사용하고 한국 기준 오늘을 상한으로 둔다. 월 버킷 조회의 `.eq('ym', 월초)` 및 월초 범위 필터는 유지한다.
- bounds 거래 조회는 한국 날짜와 월말 보정 헬퍼를 사용하며 `deal_date <= periodEnd`를 적용한다. 지원하지 않는 type/deal 및 officetel + presale_resale은 두 모드 모두 조회 전에 400으로 거절한다.
- collection 시각 범위는 관찰·반환된 행의 수집 시각이며 전체 모집단 수집 완료를 뜻하지 않는다. 제공사 응답은 정확히 일치하는 conflict key에 한해 권위 있는 최신 값으로 갱신한다. 응답에 없는 키를 자동 삭제하거나 과거 데이터를 자동 복구하지 않는다. 동일 수집 배치의 중복은 취소 행 우선이며, 전체 스냅샷 대조·정합화(snapshot reconciliation)를 구현했다는 의미가 아니다.
- 기존 테스트를 유지하고 KST 자정, 3월 31일→2월 28일, 9월 30일, 현재 월 오늘 상한, 월초 쿼리 보존, 잘못된 필터의 조회 차단 fixture를 추가했다.
- 검증: `tsc --noEmit --incremental false` exit 0, 변경 소스·테스트 7파일 ESLint exit 0, `git diff --check` exit 0. Vitest 5파일 실행 1회: envDir=false 설정을 사용했으나 설정 로딩 중 spawn EPERM으로 실패하여 테스트 본문은 미실행. 권한 우회·재시도 없음.
- 기존 UI/기타 변경 보존. 네트워크·DB·실제 제공사·환경/자격증명 파일·Jev·에이전트·커밋·배포 없음. RULES.md와 fable/active.md는 cwd에 없어 읽지 못했다.
