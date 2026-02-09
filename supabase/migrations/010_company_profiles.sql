-- 기업 프로필 테이블
CREATE TABLE company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  business_type VARCHAR(50),       -- brokerage/agency/developer/builder/trust/other
  description TEXT,
  address TEXT,
  detail_address VARCHAR(200),
  region VARCHAR(50),
  phone VARCHAR(20),
  website VARCHAR(500),
  employee_count INTEGER,
  founded_year INTEGER,
  logo_url TEXT,                    -- Supabase Storage URL
  signboard_url TEXT,              -- 옥외 간판 사진
  interior_urls TEXT[] DEFAULT '{}', -- 내부 사진 (최대 5장)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS 활성화
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

-- 본인 프로필 조회
CREATE POLICY "Users can view own company profile"
  ON company_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 프로필 생성
CREATE POLICY "Users can insert own company profile"
  ON company_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 프로필 수정
CREATE POLICY "Users can update own company profile"
  ON company_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 본인 프로필 삭제
CREATE POLICY "Users can delete own company profile"
  ON company_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- 공개 조회 (구인글에 기업 정보 표시용)
CREATE POLICY "Anyone can view company profiles"
  ON company_profiles FOR SELECT
  USING (true);

-- 인덱스
CREATE INDEX idx_company_profiles_user_id ON company_profiles(user_id);
CREATE INDEX idx_company_profiles_region ON company_profiles(region);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_company_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_company_profiles_updated_at();
