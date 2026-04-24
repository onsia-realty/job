-- 023: 시세 알림 (핫딜, 평균가 하락, 신규 거래, 분양)
-- v1.0에서는 저장만 + UI. v1.1에서 cron 기반 푸시 연동

CREATE TABLE IF NOT EXISTS market_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 대상
  complex_key TEXT,                     -- 단지 지정 (optional)
  lawd_cd CHAR(5),                      -- 지역 지정 (optional)

  -- 알림 조건
  alert_type VARCHAR(30) NOT NULL
    CHECK (alert_type IN ('hot_deal', 'avg_drop', 'new_transaction', 'presale', 'price_spike')),
  threshold JSONB,                      -- {pct: -5, days: 7} 등

  -- 상태
  is_active BOOLEAN DEFAULT true,
  last_fired_at TIMESTAMPTZ,
  fire_count INTEGER DEFAULT 0,

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ma_user ON market_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_ma_active ON market_alerts(is_active, last_fired_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ma_complex ON market_alerts(complex_key) WHERE complex_key IS NOT NULL;

ALTER TABLE market_alerts ENABLE ROW LEVEL SECURITY;

-- 본인 알림만 CRUD
CREATE POLICY "Users can manage own market alerts" ON market_alerts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_market_alerts_updated_at
  BEFORE UPDATE ON market_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
