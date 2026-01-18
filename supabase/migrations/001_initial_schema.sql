-- 온시아 JOB 초기 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  company_name VARCHAR(200),
  user_type VARCHAR(20) NOT NULL DEFAULT 'seeker' CHECK (user_type IN ('employer', 'seeker', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. 구인공고 테이블 (핵심!)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  title VARCHAR(200) NOT NULL,
  description TEXT,
  html_content TEXT,  -- 잡코리아 스타일 HTML 콘텐츠

  -- 분류
  category VARCHAR(20) NOT NULL DEFAULT 'sales' CHECK (category IN ('sales', 'agent')),  -- 분양상담사/공인중개사
  type VARCHAR(20) NOT NULL CHECK (type IN ('apartment', 'officetel', 'store', 'industrial')),
  tier VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (tier IN ('unique', 'superior', 'premium', 'normal')),
  badges TEXT[] DEFAULT '{}',  -- ['new', 'hot', 'jackpot', 'popular']

  -- 모집 조건
  position VARCHAR(20) NOT NULL CHECK (position IN ('headTeam', 'teamLead', 'member')),
  salary_type VARCHAR(20) NOT NULL CHECK (salary_type IN ('commission', 'base_incentive', 'daily')),
  salary_amount VARCHAR(100),
  benefits TEXT[] DEFAULT '{}',
  experience VARCHAR(20) DEFAULT 'none' CHECK (experience IN ('none', '1month', '3month', '6month', '12month')),

  -- 회사 정보
  company VARCHAR(200) NOT NULL,
  company_type VARCHAR(20) CHECK (company_type IN ('developer', 'builder', 'agency', 'trust')),

  -- 위치
  region VARCHAR(50) NOT NULL,
  address TEXT,

  -- 미디어
  thumbnail TEXT,
  images TEXT[] DEFAULT '{}',

  -- 연락처
  phone VARCHAR(20),
  contact_name VARCHAR(50),

  -- 메타
  views INTEGER DEFAULT 0,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  deadline DATE,
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,  -- 관리자 승인

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. 관심 공고 (찜하기)
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, job_id)
);

-- 4. 지원 내역
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, job_id)
);

-- 5. 결제 내역 (유료 광고)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL,  -- 결제한 티어
  amount INTEGER NOT NULL,    -- 금액 (원)
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 6. 공지사항
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성 (검색 성능)
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_tier ON jobs(tier);
CREATE INDEX IF NOT EXISTS idx_jobs_region ON jobs(region);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);

-- RLS (Row Level Security) 정책
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (jobs)
CREATE POLICY "Anyone can view active jobs" ON jobs
  FOR SELECT USING (is_active = true AND is_approved = true);

-- 본인 데이터 관리 정책
CREATE POLICY "Users can manage own jobs" ON jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own applications" ON applications
  FOR ALL USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
