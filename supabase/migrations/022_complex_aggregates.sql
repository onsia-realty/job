-- 022: 단지별 월별 집계 Materialized View
-- raps aggregateByComplex.ts 로직의 SQL 버전
-- cron sync-transactions 직후 REFRESH 호출

CREATE MATERIALIZED VIEW IF NOT EXISTS complex_aggregates AS
SELECT
  complex_key,
  MAX(complex_name) AS complex_name,
  lawd_cd,
  property_type,
  DATE_TRUNC('month', deal_date)::DATE AS ym,
  COUNT(*) AS trade_count,
  AVG(price_manwon) AS avg_price_manwon,
  AVG(price_manwon / NULLIF(exclusive_area, 0)) * 3.3058 AS avg_pyeong_price,
  MIN(price_manwon) AS min_price_manwon,
  MAX(price_manwon) AS max_price_manwon,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_manwon) AS median_price_manwon,
  AVG(exclusive_area) AS avg_area,
  MIN(deal_date) AS first_deal_date,
  MAX(deal_date) AS last_deal_date
FROM price_transactions
WHERE deal_type = 'trade'
  AND cancel_yn = false
  AND price_manwon IS NOT NULL
  AND price_manwon > 0
GROUP BY complex_key, lawd_cd, property_type, DATE_TRUNC('month', deal_date);

-- 유니크 인덱스 (CONCURRENTLY REFRESH 필수)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ca_unique
  ON complex_aggregates(complex_key, property_type, ym);

-- 검색용 인덱스
CREATE INDEX IF NOT EXISTS idx_ca_lawd_ym
  ON complex_aggregates(lawd_cd, ym DESC);
CREATE INDEX IF NOT EXISTS idx_ca_complex
  ON complex_aggregates(complex_key);

-- 사용법:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY complex_aggregates;

-- 월간 변동률 뷰 (LAG 윈도)
CREATE OR REPLACE VIEW complex_monthly_growth AS
SELECT
  ca.*,
  LAG(avg_price_manwon) OVER (PARTITION BY complex_key, property_type ORDER BY ym) AS prev_avg_price,
  CASE
    WHEN LAG(avg_price_manwon) OVER (PARTITION BY complex_key, property_type ORDER BY ym) IS NULL
      THEN NULL
    ELSE ROUND(
      ((avg_price_manwon - LAG(avg_price_manwon) OVER (PARTITION BY complex_key, property_type ORDER BY ym))
       / NULLIF(LAG(avg_price_manwon) OVER (PARTITION BY complex_key, property_type ORDER BY ym), 0) * 100)::NUMERIC,
      2
    )
  END AS growth_pct
FROM complex_aggregates ca;

-- 검증
-- SELECT * FROM complex_aggregates WHERE lawd_cd = '11680' ORDER BY ym DESC LIMIT 10;
-- SELECT * FROM complex_monthly_growth WHERE growth_pct IS NOT NULL ORDER BY ABS(growth_pct) DESC LIMIT 20;
