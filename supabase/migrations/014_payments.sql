-- 기존 payments 테이블에 포트원 연동용 컬럼 추가
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_id TEXT UNIQUE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS product_key TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KRW';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS pg_provider TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_category_tier ON payments(category, tier);
CREATE INDEX IF NOT EXISTS idx_payments_expires_at ON payments(expires_at);

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payments"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');
