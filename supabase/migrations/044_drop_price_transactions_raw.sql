-- 044: price_transactions.raw 제거 (DB 용량 절감)
--
-- raw = 국토부 API 원본 JSON. 필요한 값은 이미 개별 컬럼으로 저장되고 있고,
-- 앱 코드 어디에서도 읽지 않음. 행 텍스트의 약 53%를 차지해 Free 플랜 0.5GB 초과의 주원인.
--
-- 적용 순서 (반드시 지킬 것):
--   1) raw를 더 이상 쓰지 않는 앱 코드 배포 (cron/sync-transactions, api/market/transactions)
--   2) 이 파일 실행 (DROP COLUMN — 메타데이터만 바뀌어 즉시 끝남)
--   3) 별도 실행: VACUUM FULL public.price_transactions;
--      (트랜잭션 블록 안에서는 실행 불가. 테이블을 새로 써서 실제 디스크를 회수.
--       실행 중 수십 초~수 분간 해당 테이블 잠금 → 트래픽 적은 시간에)
--
-- 되돌리기: ALTER TABLE public.price_transactions ADD COLUMN raw JSONB;
--          (삭제된 원본 JSON 값은 복구되지 않음 — 필요 시 국토부 API 재수집)

ALTER TABLE public.price_transactions DROP COLUMN IF EXISTS raw;
