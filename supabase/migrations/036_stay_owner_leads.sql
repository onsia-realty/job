-- 036: 소유주 등록신청 리드 테이블 (stay_owner_leads)
--
-- 목적: 건물 소유주가 QR 랜딩(?src=캠페인코드)에서 "내 건물 등록 신청"을 넣는 접수 테이블.
--       접수된 리드를 영업 확인 후 stays 매물로 전환(converted)한다.
--
-- 적용 순서: 035 → [036] → 037  (converted_stay_id 가 stays(id)를 참조하므로 035 필수)
-- 적용 방법: Supabase SQL Editor 수동 실행
--
-- ⚠️ 법적 요건 (개인정보보호법 제22조)
--    필수동의(privacy_agreed)와 선택동의(marketing_agreed)는 반드시 분리된 별도 컬럼이며,
--    동의 시각도 각각 따로 기록한다. 하나로 합치면 "선택동의 강제" 위반 소지가 있다.

-- ============================================================
-- 1. stay_owner_leads 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS stay_owner_leads (
  id BIGSERIAL PRIMARY KEY,

  -- 신청자 정보
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  building_name VARCHAR(200),
  unit_count INTEGER,                    -- 등록 희망 호실 수
  memo TEXT,

  -- 동의 (필수/선택 분리 — 합치지 말 것)
  privacy_agreed BOOLEAN NOT NULL,                   -- 필수: 개인정보 수집·이용 동의
  marketing_agreed BOOLEAN NOT NULL DEFAULT false,   -- 선택: 마케팅 정보 수신 동의
  privacy_agreed_at TIMESTAMP WITH TIME ZONE,
  marketing_agreed_at TIMESTAMP WITH TIME ZONE,

  -- 유입
  source_code VARCHAR(30),               -- QR 캠페인 코드 (?src=)

  -- 처리 상태
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'dropped')),
  converted_stay_id UUID REFERENCES stays(id) ON DELETE SET NULL,

  -- 어뷰징 방지 (원본 IP 미저장 — 해시만)
  ip_hash VARCHAR(64),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- 필수동의 미체크 접수를 DB 레벨에서도 차단
  CONSTRAINT stay_owner_leads_privacy_required CHECK (privacy_agreed = true)
);

-- ============================================================
-- 2. 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sol_status ON stay_owner_leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sol_phone ON stay_owner_leads(phone);
CREATE INDEX IF NOT EXISTS idx_sol_source_code ON stay_owner_leads(source_code) WHERE source_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sol_converted_stay ON stay_owner_leads(converted_stay_id) WHERE converted_stay_id IS NOT NULL;

-- ============================================================
-- 3. RLS
--    ⚠️ 의도적으로 정책을 하나도 만들지 않는다.
--    개인정보(이름·연락처·주소)가 담기는 테이블이므로 anon/authenticated의
--    SELECT/INSERT/UPDATE/DELETE를 전부 차단하고, 서버 API 라우트의
--    service_role(RLS 우회)로만 접근한다.
--    → 정책이 없는 상태가 곧 "서버 전용 잠금"이다. 나중에 관리자 화면이 필요해도
--      정책을 추가하지 말고 /onsia 관리자 API(service_role)로 처리할 것.
--    (017_security_hardening.sql 의 news_toon_episodes / broker_offices 와 동일한 방식)
-- ============================================================
ALTER TABLE stay_owner_leads ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 검증 쿼리 (수동 실행)
-- ============================================================
-- RLS 켜졌는지 확인 (rowsecurity = true 여야 함)
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'stay_owner_leads';
--
-- 정책이 0건이어야 정상 (1건이라도 나오면 잘못 적용된 것)
-- SELECT policyname, cmd, roles FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'stay_owner_leads';
--
-- 필수동의 CHECK 확인
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conrelid = 'stay_owner_leads'::regclass ORDER BY conname;
