-- 026: upsert onConflict 호환 — functional unique index 를 plain index 로 재생성
--
-- 문제: 020에서 UNIQUE INDEX가 COALESCE(jibun, ''), COALESCE(floor, 0) 등
-- **함수식**으로 생성됨. PostgREST의 `onConflict`는 함수식 인덱스를 매칭 못해
-- "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification" 오류로 모든 upsert 실패.
--
-- 해결: nullable 컬럼을 NOT NULL + DEFAULT 로 정규화 → plain column unique
-- index 재생성. 애플리케이션 transform 도 null 대신 0/'' 반환하도록 수정
-- (같은 커밋의 src/lib/market/realEstate.ts).

DROP INDEX IF EXISTS idx_pt_unique_deal;

-- 컬럼 기본값 설정 (기존 NULL 값 업데이트 후 NOT NULL 부여)
ALTER TABLE price_transactions
  ALTER COLUMN jibun SET DEFAULT '',
  ALTER COLUMN exclusive_area SET DEFAULT 0,
  ALTER COLUMN floor SET DEFAULT 0,
  ALTER COLUMN price_manwon SET DEFAULT 0,
  ALTER COLUMN deposit_manwon SET DEFAULT 0,
  ALTER COLUMN monthly_manwon SET DEFAULT 0;

UPDATE price_transactions SET jibun = '' WHERE jibun IS NULL;
UPDATE price_transactions SET exclusive_area = 0 WHERE exclusive_area IS NULL;
UPDATE price_transactions SET floor = 0 WHERE floor IS NULL;
UPDATE price_transactions SET price_manwon = 0 WHERE price_manwon IS NULL;
UPDATE price_transactions SET deposit_manwon = 0 WHERE deposit_manwon IS NULL;
UPDATE price_transactions SET monthly_manwon = 0 WHERE monthly_manwon IS NULL;

ALTER TABLE price_transactions
  ALTER COLUMN jibun SET NOT NULL,
  ALTER COLUMN exclusive_area SET NOT NULL,
  ALTER COLUMN floor SET NOT NULL,
  ALTER COLUMN price_manwon SET NOT NULL,
  ALTER COLUMN deposit_manwon SET NOT NULL,
  ALTER COLUMN monthly_manwon SET NOT NULL;

-- plain column unique index — PostgREST onConflict 호환
CREATE UNIQUE INDEX IF NOT EXISTS idx_pt_unique_deal ON price_transactions(
  property_type, deal_type, lawd_cd, deal_ymd, complex_name, jibun,
  exclusive_area, floor, deal_date, price_manwon, deposit_manwon
);

-- 검증:
-- SELECT conname, pg_get_indexdef(indexrelid)
-- FROM pg_index JOIN pg_class ON pg_class.oid = indexrelid
-- WHERE relname = 'idx_pt_unique_deal';
