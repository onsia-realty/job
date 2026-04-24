-- 024: 시세지도 베타 대기자 (사전 티저용, 로그인 없이 이메일만)

CREATE TABLE IF NOT EXISTS map_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role VARCHAR(20),                     -- 'agent' | 'sales' | 'other'
  interested_region VARCHAR(100),       -- 관심 지역
  source VARCHAR(50),                   -- 'banner' | 'popup' | 'email'
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_mw_created ON map_waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mw_notified ON map_waitlist(notified);

ALTER TABLE map_waitlist ENABLE ROW LEVEL SECURITY;

-- 로그인 유저는 본인 신청 이력만 조회
CREATE POLICY "Users can view own waitlist" ON map_waitlist
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- INSERT는 service_role만 (API 라우트에서 처리)
