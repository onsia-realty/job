-- 020: 실거래가 캐시 테이블 (국토부 API 결과 저장)
-- 매일 cron으로 MVP 지역 × 최근 3개월 수집

CREATE TABLE IF NOT EXISTS price_transactions (
  id BIGSERIAL PRIMARY KEY,

  -- 분류
  property_type VARCHAR(20) NOT NULL
    CHECK (property_type IN ('apt', 'officetel', 'villa', 'store', 'presale')),
  deal_type VARCHAR(20) NOT NULL
    CHECK (deal_type IN ('trade', 'rent', 'presale_resale')),

  -- 지역
  lawd_cd CHAR(5) NOT NULL REFERENCES region_codes(lawd_cd),
  deal_ymd CHAR(6) NOT NULL,           -- 202604
  deal_date DATE NOT NULL,             -- 2026-04-15

  -- 단지·건물
  complex_name TEXT NOT NULL,           -- "래미안원베일리"
  complex_key TEXT NOT NULL,            -- 정규화 키 (소문자+공백제거+jibun)
  dong TEXT,                            -- 법정동명
  jibun TEXT,                           -- 지번

  -- 물건 정보
  exclusive_area NUMERIC(8,2),          -- 전용면적(㎡)
  floor INTEGER,
  build_year INTEGER,

  -- 거래 정보
  price_manwon INTEGER,                 -- 거래금액(만원)
  deposit_manwon INTEGER,               -- 보증금(전세/월세)
  monthly_manwon INTEGER,               -- 월세금(만원)
  cancel_yn BOOLEAN DEFAULT false,
  deal_channel VARCHAR(20),             -- '중개거래' | '직거래'

  -- 메타
  raw JSONB,                            -- 국토부 원본 JSON
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_pt_lawd_ymd ON price_transactions(lawd_cd, deal_ymd);
CREATE INDEX IF NOT EXISTS idx_pt_complex ON price_transactions(complex_key);
CREATE INDEX IF NOT EXISTS idx_pt_deal_date ON price_transactions(deal_date DESC);
CREATE INDEX IF NOT EXISTS idx_pt_type ON price_transactions(property_type, deal_type);
CREATE INDEX IF NOT EXISTS idx_pt_lawd_type_date ON price_transactions(lawd_cd, property_type, deal_date DESC);

-- 중복 방지 (동일 거래 UPSERT용)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pt_unique_deal ON price_transactions(
  property_type, deal_type, lawd_cd, deal_ymd, complex_name, COALESCE(jibun, ''),
  COALESCE(exclusive_area, 0), COALESCE(floor, 0), deal_date, COALESCE(price_manwon, 0), COALESCE(deposit_manwon, 0)
);

-- RLS
ALTER TABLE price_transactions ENABLE ROW LEVEL SECURITY;

-- 누구나 조회 가능 (취소 거래 제외는 애플리케이션 레벨에서)
CREATE POLICY "Anyone can view transactions" ON price_transactions
  FOR SELECT TO public
  USING (true);

-- INSERT/UPDATE는 service_role만 (cron에서 사용)

-- 검증
-- SELECT lawd_cd, property_type, COUNT(*) FROM price_transactions GROUP BY 1,2;
