-- 시세자료 지표 사전계산 캐시 테이블
-- 느린 지표(신고가/최근하락/최근상승)를 cron이 미리 계산해 저장 → API는 읽기만 → 즉시 응답.
CREATE TABLE IF NOT EXISTS market_rankings (
  cache_key     text PRIMARY KEY,        -- "${metric}|${sido}|${property_type}"
  metric        text NOT NULL,           -- highest | drop | rise
  sido          text NOT NULL,           -- all | 서울특별시 | 경기도
  property_type text NOT NULL,           -- apt | officetel
  data          jsonb NOT NULL,          -- 랭킹 배열 (사전계산 결과)
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE market_rankings ENABLE ROW LEVEL SECURITY;
-- 공개 읽기 (시세 정보 도구)
DROP POLICY IF EXISTS "market_rankings_select" ON market_rankings;
CREATE POLICY "market_rankings_select" ON market_rankings FOR SELECT USING (true);
