-- 008: 이력서 테이블 (resumes)
-- Supabase SQL Editor에서 실행하세요

-- 1. 이력서 테이블
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 기본 정보
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  birth_year INTEGER,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
  photo TEXT,  -- 프로필 사진 URL

  -- 자격증 정보
  license_number VARCHAR(50),  -- 공인중개사 자격번호
  license_date VARCHAR(10),    -- 취득연도

  -- 경력 정보
  total_experience VARCHAR(20) DEFAULT 'none' CHECK (total_experience IN ('none', '6month', '1year', '2year', '3year', '5year')),
  careers JSONB DEFAULT '[]',  -- AgentCareer[] 배열

  -- 희망 조건
  preferred_regions TEXT[] DEFAULT '{}',
  preferred_types TEXT[] DEFAULT '{}',
  preferred_salary JSONB DEFAULT '{"type": "mixed"}',
  available_date DATE,  -- 입사 가능일

  -- 자기소개
  introduction TEXT,
  strengths TEXT[] DEFAULT '{}',

  -- 공개 설정
  is_public BOOLEAN DEFAULT true,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- 한 사용자당 하나의 이력서만 (나중에 여러개 지원시 제거)
  UNIQUE(user_id)
);

-- 2. applications 테이블에 resume_id 추가
ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL;

-- 3. applications 테이블 상태 확장 (contacted, hired 추가)
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending', 'viewed', 'contacted', 'rejected', 'hired'));

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_is_public ON resumes(is_public);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_resume_id ON applications(resume_id);

-- 5. RLS 정책
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- 본인 이력서 관리
CREATE POLICY "Users can manage own resume" ON resumes
  FOR ALL USING (auth.uid() = user_id);

-- 공개 이력서는 기업회원이 열람 가능 (is_public = true)
CREATE POLICY "Employers can view public resumes" ON resumes
  FOR SELECT USING (is_public = true);

-- 6. updated_at 자동 업데이트 트리거
CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 구인자가 지원자의 이력서를 볼 수 있도록 applications 정책 추가
CREATE POLICY "Employers can view applications to their jobs" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.user_id = auth.uid()
    )
  );

-- 구인자가 지원 상태를 업데이트할 수 있도록
CREATE POLICY "Employers can update application status" ON applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.user_id = auth.uid()
    )
  );
