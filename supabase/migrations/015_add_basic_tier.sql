-- 015: 'basic' 티어 추가
-- Supabase SQL Editor에서 실행하세요

-- tier CHECK 제약조건에 'basic' 추가
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_tier_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_tier_check
  CHECK (tier IN ('vip', 'unique', 'superior', 'premium', 'basic', 'normal'));
