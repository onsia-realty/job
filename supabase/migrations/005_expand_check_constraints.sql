-- 005: CHECK 제약조건 확장 (Agent/Sales 폼 값 호환)
-- Supabase SQL Editor에서 실행하세요

-- 1. type: Agent 페이지에서 villa, office, building, auction 추가
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_type_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_type_check
  CHECK (type IN ('apartment', 'officetel', 'store', 'industrial', 'villa', 'office', 'building', 'auction'));

-- 2. salary_type: Agent(monthly, commission, mixed) + Sales(per_contract, percentage) + 기존값
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_salary_type_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_salary_type_check
  CHECK (salary_type IN ('commission', 'base_incentive', 'daily', 'monthly', 'mixed', 'per_contract', 'percentage'));

-- 3. experience: Agent 페이지에서 1year, 2year, 3year, 5year 추가
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_experience_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_experience_check
  CHECK (experience IN ('none', '1month', '3month', '6month', '12month', '1year', '2year', '3year', '5year'));
