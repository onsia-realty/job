-- 018: 002에서 남은 jobs SELECT 공개 정책 제거
-- 002_storage_setup.sql의 "Anyone can view jobs" USING (true)가 003에서 교체되지 않고 공존 중이었음
-- Postgres RLS 복수 정책은 OR로 합쳐지므로 비활성 공고까지 anon에 노출되는 상태였음
-- 017 적용 후 후속 정리

DROP POLICY IF EXISTS "Anyone can view jobs" ON jobs;

-- 이후 남는 jobs 정책:
--   SELECT  "Anyone can view all active jobs"  USING (is_active = true)
--   INSERT  "Authenticated users can insert own jobs"  WITH CHECK (auth.uid() = user_id)
--   UPDATE  "Users can update own jobs"  USING (auth.uid() = user_id)
--   DELETE  "Users can delete own jobs"  USING (auth.uid() = user_id)
