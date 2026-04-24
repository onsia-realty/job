-- 017: 오픈 전 보안 강화 (RLS 구멍 차단)
-- 실행 전 반드시 검토: 기존 API 라우트가 supabaseAdmin(service_role)을 쓰므로 기능에는 영향 없음

-- ============================================================
-- 1. jobs UPDATE 정책 정상화
--    002_storage_setup.sql에서 "Anyone can update own jobs USING (true)"로 풀림
--    → anon/authenticated 누구나 모든 공고 UPDATE 가능 상태
-- ============================================================
DROP POLICY IF EXISTS "Anyone can update own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can manage own jobs" ON jobs;

-- 본인 공고만 수정/삭제 가능 (API route 경유 시 service_role이 우회하므로 영향 없음)
CREATE POLICY "Users can update own jobs" ON jobs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs" ON jobs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. news_toon_episodes: RLS 활성화 누락
--    016_news_toon.sql에 ENABLE ROW LEVEL SECURITY 없음
--    → anon이 INSERT/UPDATE/DELETE 가능 상태
-- ============================================================
ALTER TABLE news_toon_episodes ENABLE ROW LEVEL SECURITY;

-- published만 공개 조회
CREATE POLICY "Anyone can view published episodes" ON news_toon_episodes
  FOR SELECT TO public
  USING (status = 'published');

-- INSERT/UPDATE/DELETE 정책 없음 → service_role만 가능 (API 라우트에서 admin 검증 후 처리)

-- ============================================================
-- 3. broker_offices: 서버 전용으로 잠금
--    004_broker_offices.sql에서 INSERT/UPDATE가 WITH CHECK (true)/USING (true)
--    → anon이 캐시 데이터를 조작 가능
-- ============================================================
DROP POLICY IF EXISTS "broker_offices_insert" ON broker_offices;
DROP POLICY IF EXISTS "broker_offices_update" ON broker_offices;

-- SELECT 공개는 유지 (검색에 필요)
-- INSERT/UPDATE/DELETE 정책 없음 → service_role만 가능

-- ============================================================
-- 4. jobs INSERT 정책 정상화 (선택)
--    003_public_jobs_policy.sql에서 WITH CHECK (true)로 풀림
--    → anon이 직접 Supabase에 INSERT 가능 (API route 우회 가능)
--    → 현재 운영은 API route 통해 service_role로 처리하므로 기능 영향 없음
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert jobs" ON jobs;

CREATE POLICY "Authenticated users can insert own jobs" ON jobs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. job-images 버킷: authenticated만 업로드
--    002_storage_setup.sql에서 누구나 업로드 가능
-- ============================================================
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;

CREATE POLICY "Authenticated can upload job images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'job-images');

-- ============================================================
-- 검증 쿼리 (수동 실행)
-- ============================================================
-- SELECT tablename, policyname, cmd, qual FROM pg_policies
-- WHERE schemaname = 'public' AND tablename IN ('jobs', 'news_toon_episodes', 'broker_offices')
-- ORDER BY tablename, cmd;
