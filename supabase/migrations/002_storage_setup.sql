-- Storage 버킷 생성 및 정책 설정
-- Supabase Dashboard > Storage > New Bucket 으로도 생성 가능

-- 1. 이미지 저장 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-images', 'job-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 누구나 이미지 업로드 가능 (테스트용 - 나중에 인증 추가)
CREATE POLICY "Anyone can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'job-images');

-- 3. 누구나 이미지 조회 가능
CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'job-images');

-- 4. jobs 테이블 - 테스트용 임시 정책 (누구나 등록 가능)
-- 주의: 프로덕션에서는 인증된 사용자만 가능하도록 변경해야 함!
DROP POLICY IF EXISTS "Anyone can view active jobs" ON jobs;
DROP POLICY IF EXISTS "Users can manage own jobs" ON jobs;

CREATE POLICY "Anyone can view jobs" ON jobs
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert jobs" ON jobs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update own jobs" ON jobs
  FOR UPDATE USING (true);
