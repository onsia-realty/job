# Astra 작업 요약

작성 기준: **2026-10-23 KST**. 저장소 문서·현재 소스와 사용자 전달 이력을 요약했다. 이번 실행은 문서 작성만 수행했으며, 아래 과거 검증을 재실행한 것은 아니다.

**root auditor의 최종 독립 QA에서 Vitest 53파일 708테스트, TypeScript, `git diff --check`가 통과했다. 최종 Next.js 16.1.3 프로덕션 빌드도 PASS(exit 0), 정적 페이지 110/110 생성 및 빌드 내 TypeScript PASS로 확인됐다. 로컬 devserver는 재시작 후 localhost:3000에서 Ready를 root가 확인했다. 이 문서 스냅샷 시점에 원래 사용자 승인 범위의 커밋·푸시·배포는 여전히 대기다.** 아래 결과는 사용자가 전달한 root auditor의 검증 결과이며 이번 문서 수정에서 재실행한 결과가 아니다. 로컬 HEAD는 기존 기록 기준 `c05c9d7`, 아래 신규 구현은 미커밋 상태다. 운영도 마지막 읽기 전용 확인 당시 같은 HEAD였다는 전달 기록을 기준으로 하며 이번에는 운영을 조회하지 않았다. 이 문서 작성 시점까지 이번 작업의 새 배포는 없다.

## 진행 순서와 구현 내용

1. **협업 실행 기반 정리** — 협업 앱 브리지와 Astra medium 실행 맥락은 별도 `collab-desktop` 프로젝트의 작업이다. 이 저장소의 BOOIN 구현과 구분하며, 이번에는 해당 프로젝트·브리지·사적 대화를 열거나 실행하지 않았다. BOOIN 역할 계약은 [COLLABORATION.md](COLLABORATION.md)에 있다.

2. **BOOIN 홈·상용 이용 동선** — 구직, 채용공고 등록·광고, STAY 진입을 분리하고 STAY 활성 여부에 맞춰 홈을 구성했다. 공간 이미지를 실제 공고로 오인하지 않도록 표시했다. 접근성 제목의 줄바꿈 앞 공백도 독립 QA 후 보정했다. 주요 파일: [홈](../src/app/page.tsx), [HomeJourneys](../src/components/home/HomeJourneys.tsx), [광고 상품](../src/app/premium/page.tsx).

3. **다날 본인인증·가입 상태 보정** — Supabase Auth 계정 생성과 앱 프로필 완료를 구분했다. 잘못된 증명은 저장 전에 거절하고, 필수 모드의 증명 없는 신규 이메일 사용자와 신규 소셜 사용자에게 추가입력 상태를 반환한다. 신원은 서버 증명의 이름·전화번호를 사용하며 기존 인증 신원은 보존한다. 이메일·소셜 로그인은 서버 상태와 안전한 내부 STAY 복귀 경로를 처리한다. 주요 파일: [ensure-user](../src/app/api/auth/ensure-user/route.ts), [complete-profile](../src/app/api/auth/complete-profile/route.ts), [상태 헬퍼](../src/lib/auth-profile-state.ts), [로그인](../src/app/agent/auth/login/page.tsx), [콜백](../src/app/agent/auth/callback/page.tsx).

   **미해결:** 원시 Supabase 가입 자체를 차단한 것은 아니다. 보호된 가입 완료 필드·기존 계정 이관, 기능별 필수 gate, 운영 grants/RLS 감사, 증명 만료·사용자 바인딩·원자적 소비가 남아 있다. 다날 계약·가맹점 활성화와 실제 E2E도 미확인이다. 플래그만으로 가입 보안이나 계약 활성화가 완료되지 않는다.

4. **광고 주문 안전장치** — 신규 주문은 실제 공고 UUID, 소유권, 상품 카테고리, 활성·승인 상태와 한국 날짜 기준 마감일을 확인한다. 선택 UI와 서버가 공통 자격 조건을 쓰고, 주문 생성 실패 시 결제 제공사 호출로 진행하지 않는다. 기존 주문 확인·복구·환불 경로는 유지한다. 주요 파일: [자격 검사](../src/lib/advertisement-job.ts), [주문 API](../src/app/api/payment/orders/route.ts), [checkout](../src/app/checkout/page.tsx), [premium](../src/app/premium/page.tsx). **실결제·유료 테스트는 하지 않았다.**

5. **STAY 샘플·개인정보 경계** — 알려진 12개 seed UUID만 샘플로 판정한다. 목록·지도·상세·이미지에 예시임을 표시하고 문의 UI를 안내로 바꿨으며, 문의 API에서도 해당 ID를 DB 접근 전에 거절한다. 실제 매물의 기존 문의 흐름은 유지했다. 앞서 정한 중개사 정보의 상세 하단 한 곳 표시, 공개 목록의 번호·전화 제외, 개인 프로필 전화 fallback 금지 경계도 보존했다. 주요 파일: [샘플 판정](../src/lib/stay/demo.ts), [샘플 안내](../src/components/stay/StayDemoNotice.tsx), [상세](../src/app/stay/[id]/page.tsx), [문의 API](../src/app/api/stay-inquiries/route.ts). 매물 삭제·seed 실행·운영 데이터 수정은 하지 않았다.

6. **시세지도 UX·데스크톱/모바일** — 로딩·실패·정상 빈 결과를 구분하고 재시도를 제공했다. 필터 전환의 이전 응답과 다른 단지 상세가 섞이지 않도록 정리했다. 검색의 로딩·빈 결과·오류·Escape 처리를 보완했다. 지표 기본값을 닫고 모바일 지표는 바텀시트에서 열며, 검색을 별도 줄에 배치했다. 평균·최근 거래·근사 대표면적과 과거 거래라는 의미를 설명한다. 주요 파일: [MarketPageClient](../src/app/market/MarketPageClient.tsx), [검색](../src/components/market/MarketSearch.tsx), [지도 안내](../src/components/market/MarketMapNotice.tsx), [BottomSheet](../src/components/market/BottomSheet.tsx), [목록](../src/components/market/ComplexListPanel.tsx), [쿼리](../src/lib/market/queries.ts).

7. **거래 취소·페이지네이션·월말·메타데이터** — 취소 거래 처리와 수집 배치 중복 정리를 보강했다. 정확히 같은 conflict key의 제공사 값을 갱신하고 동일 배치 중복은 취소 행을 우선한다. 거래 조회는 페이지를 순회하며 예산 초과를 완전한 성공으로 반환하지 않는다. 월별 종료일은 월말과 한국 기준 오늘을 반영하고 잘못된 type/deal 조합을 차단한다. 거래 기간, 관찰 행 수집 범위, 별도 순위 계산 시각, stale/truncated/저장 실패·누락을 구분해 보여준다. 주요 파일: [거래 API](../src/app/api/market/transactions/route.ts), [수집 API](../src/app/api/cron/sync-transactions/route.ts), [publicApi](../src/lib/market/publicApi.ts), [배치 중복 처리](../src/lib/market/transactionBatch.ts), [페이지·메타데이터](../src/lib/market/transactionData.ts), [집계](../src/app/api/market/aggregates/route.ts), [순위](../src/app/api/market/rankings/top10/route.ts), [데이터 안내](../src/components/market/MarketDataNotice.tsx).

   **데이터 한계:** 역사 데이터 backfill은 실행하지 않았다. 응답에 없는 키 삭제·전체 스냅샷 정합화·과거 오류 자동 복구를 구현한 것은 아니다. 현재 MV 갱신 시각은 확인 불가이며 응답 시각을 갱신 시각으로 제시하지 않는다. 관찰 행의 수집 범위도 전체 수집 완료를 뜻하지 않는다.

8. **시세 일러스트 반영** — 사전에 생성·승인된 2172×724 PNG를 원본과 동일한 해시로 복사하고 목록 상단에 모바일 64px/데스크톱 90px 배너로 연결했다. “AI 생성 이미지 · 실제 통계 아님”을 표시한다. 파일: [이미지](../public/images/market-prices-volume-20261023.png), [MarketIllustration](../src/components/market/MarketIllustration.tsx). 반영 worker와 이번 문서 작업에서 이미지 생성 서비스를 호출한 것은 아니다.

## 구현과 구분해야 할 관찰·제안

- **ONSIA 휠 비교:** 읽기 전용 비교·관찰이며 BOOIN에 휠 동작을 이식했다는 의미가 아니다.
- **최신 ValueUpMap 분석:** 사용자 최신 요청에 따른 디자인 분석·제안 단계다. ValueUpMap식 UI 구현 완료로 기록하지 않는다.
- **로컬 Supabase 로그:** 전달된 관찰상 오래된 세션의 invalid-refresh 로그는 자동 정리됐다. 운영 인증 장애 해결이나 별도 인증 코드 수정의 증거로 확대하지 않는다.
- **샘플·헤더 혼재:** `/sales`·`/agent`의 실제/샘플 공고 혼합과 화면별 헤더·디자인 혼재는 남아 있다. 이번 홈·STAY 개선이 사이트 전체 상용 전환 완료를 뜻하지 않는다.

## 검증 근거와 남은 QA

| 구분 | 확인된 결과와 범위 |
|---|---|
| 앱 worker Vitest | Vite 설정 로딩 중 `spawn EPERM`으로 본문 미실행. 대체 시도도 picomatch `require is not defined`로 시작 실패했다. 테스트 통과가 아니다. |
| 독립 일반 개발환경 테스트 | 사용자 전달 단계별 실행 결과는 phase1 **21개**, phase2 **29개**, phase3 **7개** 통과다. 앱 worker 결과나 현재 전체 회귀 통과와 구분한다. |
| 전체 회귀 최종 결과 | root auditor의 독립 최종 Vitest **53파일 708테스트 PASS**. 상용 문서의 645/646, 이후 market 문서의 660/661은 과거 실패 기록이며 해당 실패는 해결됐다. 권한 mock·React Query 테스트 구독 보정 이후 최종 full suite 검증이 완료됐으므로 이전의 재실행 대기 문구를 정정한다. 앱 worker의 실행 실패 이력과는 구분한다. |
| 정적 검사·빌드 | root auditor의 최종 **TypeScript PASS**, **`git diff --check` PASS**. 변경 65파일 lint는 로그인 기존 `no-explicit-any` 오류 **7건**, 경고 **4건**(기존 3건, 신규 `vitest.config` 익명 export 1건)이며 **새로 도입된 lint 오류는 없다**. lint 전체 통과는 아니다. 기존 단계별 검사·중간 빌드 기록은 이력으로 보존한다. 최종 **Next.js 16.1.3 프로덕션 빌드 PASS(exit 0)**, **정적 페이지 110/110 생성**, **빌드 내 TypeScript PASS**를 root가 확인했다. 최종 빌드 경고는 기존 **middleware → proxy 전환 deprecation 경고만** 남았다. |
| 브라우저 | 과거 독립 관찰에서 홈 데스크톱·390px 가로 넘침 없음, STAY 상세 390px 샘플 안내 표시·문의 버튼 0개·넘침 없음을 확인했다. market 수정 전에는 390px 화면의 scrollWidth 398px와 모바일 지표 미노출이 관찰됐다. **최신 root 관찰에서는 데스크톱과 실제 렌더링 폭 433px 모바일에 가로 넘침이 없고 이미지·데이터 안내·지도·목록이 동작했다.** 모바일 override 요청은 390px였으나 브라우저 줌으로 실제 433px로 렌더링됐으므로 최신 검수를 정확한 390px 검증으로 기록하지 않는다. |
| 로컬 서버 | 사용자 전달 최신 결과에 따르면 프로덕션 빌드 후 로컬 devserver를 재시작했고 **localhost:3000에서 Ready**를 root가 확인했다. 이번 문서 worker는 서버를 재시작하거나 프로세스·포트·브라우저를 조회하지 않았다. |

최종 독립 전체 회귀, 위 범위의 화면 검수, 최종 프로덕션 빌드 PASS와 로컬 devserver 재시작·Ready 확인 결과를 반영했다. **이 문서 스냅샷 시점에 원래 사용자 승인 범위의 커밋·푸시·배포는 여전히 대기**다. 이 문서 수정 요청은 그 작업을 실행하라는 요청이 아니며 커밋·푸시·배포를 완료 처리하지 않는다.

## 근거 문서와 이번 실행 범위

- 상세 이력: [COMMERCIAL_REFACTOR_20261023.md](COMMERCIAL_REFACTOR_20261023.md), [MARKET_REVIEW_20261023.md](MARKET_REVIEW_20261023.md), [PROGRESS.md](../PROGRESS.md), [HANDOFF_CODEX.md](HANDOFF_CODEX.md).
- 최초 문서 작성 실행: 프로젝트 지침·지정 문서·필요한 소스 읽기, `git status --short`와 HEAD 확인, 이 파일 하나를 `apply_patch`로 추가, `git diff --check` 검사.
- 이번 QA 결과 갱신 실행: bound cwd의 프로젝트 지침·문서 확인, 사용자 전달 root auditor 결과를 이 파일에만 `apply_patch`로 반영, `git diff --check` 검사. 문서 전용이므로 tsc·Vitest·lint·빌드·브라우저 검수는 재실행하지 않는다.
- `RULES.md`와 `fable/active.md`는 bound cwd에 없어 읽기에 실패했다. 외부 경로를 찾지 않았으며 이번 실행에서 sandbox 작업 거절은 없었다.
- 기존 변경과 [로컬 증적 폴더](../claudedocs/home-review-2026-10-20/)는 그대로 보존했다. 코드 변경, 네트워크·외부 서비스·provider·DB·Jev, 환경/자격증명 파일, 사적 대화 가져오기, 에이전트 재호출, 전역 설정, 커밋·푸시·배포는 수행하지 않았다.
