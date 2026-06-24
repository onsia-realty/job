# 백업 · 분양상담사(/sales) 리디자인 마일스톤 — 2026-06-25

이 문서는 이번 커밋 시점의 상태와 **이전 버전 복구 방법**을 기록한다.

## 이번 마일스톤 요약
- **/sales 목록**: Claude Design 핸드오프(BOOIN 구인) 충실 이식. 다크 좌측네비 + 헤더(구인공고·분양인재·분양대행) + 메인 피드 + 우측 사이드바(SPECIAL·실시간 인기·빠른 메뉴).
  - 섹션: 프리미엄 대표 현장(unique, 가로 큰카드) / 추천 현장(superior, **4단 고정** `.bn-grid4`) / **광고대행사 전문 노출(신규 4단 그리드)** / **부인 알고리즘 추천 공고**(premium, **2단 고정** `.bn-grid2`) / 오늘의 핵심 공고(normal).
  - 데이터 부족분은 `fillTo()`로 회전 노출(꽉 차 보이게). 실데이터(`fetchJobs('sales')`)는 샘플 위에 병합.
- **/sales/jobs/new 공고 등록**: 핸드오프 픽셀 이식(7섹션 + 점선 커넥터 + 완성도 사이드바).
  - 실로직 보존: 인증 게이트 · 임시저장 · 썸네일 업로드 · `/api/jobs` 제출 · 완성도.
  - 신규 필드(시행/대행/시공/신탁사·투입일·직책별 수수료)는 `html_content`로, 혜택은 `benefits[]`로 매핑(데이터 손실 0).
  - **광고 상품 Section 7**: BOOIN pay 제거 → 주문 요약(총 선택상품/할인/주문금액) + **토스 결제**(유료 선택 시 `/checkout?productKey=...&jobId=...`). 단가=배포본(VIP 24,900/슈페리어 9,900/프리미엄 4,900/일반 0, 90% 할인).
  - **실제 노출 미리보기(iframe)**: `/sales` 축소판(scale 0.228). 등급 클릭 시 해당 섹션 **빨간 테두리 + 나머지 검정 딤 스포트라이트** + 스크롤. 미리보기에선 좌측네비·우측사이드바·하단탭 숨김(iframe 스타일 주입, 실제 /sales는 그대로).
- **저작권 회피**: bunshin 대화체 카피 → BOOIN 배포본 중립 문구. 헤더 탭 `구인공고·분양인재·분양대행`(분양의신 고유어 제거).
- **next.config.mjs**: 미리보기 iframe용으로 `X-Frame-Options: SAMEORIGIN` / CSP `frame-ancestors 'self'`(외부 프레이밍은 계속 차단, 동일 출처만 허용).

## 이전 버전 복구(백업 위치)
원본 코드는 `src/app/sales/_backup/`에 보존:
- `_backup/handoff-20260625/page.tsx` · `layout.tsx` — 직전 /sales
- `_backup/handoff-20260625/jobs-new-page.tsx.bak` — 직전 공고 등록(비주얼 에디터 RichTextEditor 포함 버전)
- `_backup/jobs/`, `_backup/reskin-20260624/` — 그 이전 단계들

git에서 직전 커밋으로 비교/복구:
```
git log --oneline -5
git diff HEAD~1 -- src/app/sales
git checkout HEAD~1 -- src/app/sales/page.tsx   # 특정 파일만 되돌리기
```

## 참고
- 디자인 확정본(핸드오프): `C:\Users\Dae\Desktop\design_handoff_booin_sales\`, `E:\다운로드\design_handoff_booin_register\`
- 잔여(다음): 상세 화면 `/sales/jobs/[id]` 톤 통일, 토스 실결제 E2E, 미사용 구컴포넌트(VipSlider/SalesFeaturedCard/SalesSidebar) 정리.
