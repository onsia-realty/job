-- 033: 전세(월세 제외) 집계 — 시세표(PriceTable) 데이터 레이어
-- 022(complex_aggregates, 매매 전용)의 자매 집계. 전세만: deal_type='rent' AND 월세금 없음.
-- 기존 trade 집계(022)는 절대 건드리지 않고 병렬로 추가만 한다.
-- 022와 동일하게 MATERIALIZED VIEW + UNIQUE INDEX(CONCURRENTLY 대상) 구조.

-- ── 단지×월 전세 집계 MV ──
CREATE MATERIALIZED VIEW IF NOT EXISTS complex_rent_aggregates AS
SELECT
  complex_key,
  MAX(complex_name) AS complex_name,
  lawd_cd,
  property_type,
  DATE_TRUNC('month', deal_date)::DATE AS ym,
  COUNT(*) AS rent_count,
  AVG(deposit_manwon) AS avg_deposit_manwon,
  AVG(deposit_manwon / NULLIF(exclusive_area, 0)) * 3.3058 AS avg_pyeong_deposit,
  MIN(deposit_manwon) AS min_deposit_manwon,
  MAX(deposit_manwon) AS max_deposit_manwon,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY deposit_manwon) AS median_deposit_manwon,
  AVG(exclusive_area) AS avg_area,
  MIN(deal_date) AS first_deal_date,
  MAX(deal_date) AS last_deal_date
FROM price_transactions
WHERE deal_type = 'rent'
  AND cancel_yn = false
  AND deposit_manwon IS NOT NULL
  AND deposit_manwon > 0
  AND (monthly_manwon IS NULL OR monthly_manwon = 0)   -- 순수 전세만 (월세 제외)
GROUP BY complex_key, lawd_cd, property_type, DATE_TRUNC('month', deal_date);

-- 유니크 인덱스 (REFRESH ... CONCURRENTLY 필수 조건)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cra_unique
  ON complex_rent_aggregates(complex_key, property_type, ym);

-- 검색용 인덱스 (지역/단지 조회)
CREATE INDEX IF NOT EXISTS idx_cra_lawd_ym
  ON complex_rent_aggregates(lawd_cd, ym DESC);
CREATE INDEX IF NOT EXISTS idx_cra_complex
  ON complex_rent_aggregates(complex_key);

-- ── 통합 갱신 함수 ──
-- 기존 cron(refresh-aggregates)이 부를 단일 진입점. 매매+전세 MV를 함께 새로고침한다.
-- 매매 MV(022)가 미존재해도 전세만 갱신되도록 각각 방어. 새 단지 유입이 없으면 no-op.
-- CONCURRENTLY는 각 MV에 유니크 인덱스가 있어야 동작(둘 다 보유).
CREATE OR REPLACE FUNCTION refresh_market_aggregates()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- 매매 집계 (022) — 존재할 때만
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'complex_aggregates') THEN
    BEGIN
      REFRESH MATERIALIZED VIEW CONCURRENTLY complex_aggregates;
    EXCEPTION WHEN feature_not_supported THEN
      -- 최초 1회는 데이터가 없어 CONCURRENTLY 불가 → 일반 REFRESH
      REFRESH MATERIALIZED VIEW complex_aggregates;
    END;
  END IF;

  -- 전세 집계 (033)
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'complex_rent_aggregates') THEN
    BEGIN
      REFRESH MATERIALIZED VIEW CONCURRENTLY complex_rent_aggregates;
    EXCEPTION WHEN feature_not_supported THEN
      REFRESH MATERIALIZED VIEW complex_rent_aggregates;
    END;
  END IF;
END;
$$;

-- 사용법:
-- SELECT refresh_market_aggregates();                         -- 매매+전세 동시 갱신
-- REFRESH MATERIALIZED VIEW CONCURRENTLY complex_rent_aggregates;  -- 전세만 수동 갱신

-- 검증
-- SELECT lawd_cd, COUNT(*) FROM complex_rent_aggregates GROUP BY 1 ORDER BY 2 DESC LIMIT 10;
-- SELECT * FROM complex_rent_aggregates WHERE lawd_cd = '11680' ORDER BY ym DESC LIMIT 10;
