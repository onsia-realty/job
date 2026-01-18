-- 공개 INSERT 정책 추가 (로그인 없이 공고 등록 가능)
-- Supabase SQL Editor에서 실행하세요

-- 기존 정책 삭제 (있으면)
DROP POLICY IF EXISTS "Anyone can insert jobs" ON jobs;

-- 공개 INSERT 정책
CREATE POLICY "Anyone can insert jobs" ON jobs
  FOR INSERT TO public
  WITH CHECK (true);

-- 공개 SELECT 정책 재확인 (is_approved 조건 없이)
DROP POLICY IF EXISTS "Anyone can view active jobs" ON jobs;

CREATE POLICY "Anyone can view all active jobs" ON jobs
  FOR SELECT TO public
  USING (is_active = true);
