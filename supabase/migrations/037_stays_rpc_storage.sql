-- 037: stays 조회수 RPC + Storage 정책 현황 점검
--
-- 목적:
--   1) increment_stay_views(uuid) — stays.views 원자적 증가 RPC
--   2) storage.objects UPDATE/DELETE 정책 검토 결과 기록 (이번엔 변경하지 않음 — 아래 근거 참조)
--
-- 적용 순서: 035 → 036 → [037]  (stays 테이블 필요)
-- 적용 방법: Supabase SQL Editor 수동 실행

-- ============================================================
-- 1. increment_stay_views RPC
--
--    참고: 기존 조회수 RPC 'increment_job_views' 는 src/app/api/jobs/[id]/view/route.ts:11
--    에서 호출하지만, supabase/migrations 어디에도 정의가 없다(전수 확인 완료).
--    라우트에 "rpc가 없으면 직접 update fallback" 경로가 있어 지금까지 표면화되지 않았고,
--    실제로는 매 요청마다 RPC 실패 → SELECT + UPDATE 2-step 으로 동작 중이다.
--    → 따라 만들 원본이 없으므로, 프로젝트에 실재하는 유일한 RPC 관행인
--      030_ai_usage_atomic_increment.sql 의 스타일을 그대로 따른다.
--      (LANGUAGE plpgsql / SECURITY DEFINER / SET search_path = public)
--
--    SECURITY DEFINER 근거: 조회수 증가는 비로그인(anon) 요청에서도 발생하는데
--    stays UPDATE 정책은 auth.uid() = user_id 로 소유자 한정이다. DEFINER 로
--    RLS를 우회하되, 함수가 손대는 컬럼은 views 하나뿐이라 권한 상승 위험이 없다.
--
--    반환값: 증가 후 views (정수), 해당 id가 없으면 NULL
-- ============================================================
CREATE OR REPLACE FUNCTION increment_stay_views(stay_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_views integer;
BEGIN
  UPDATE stays
     SET views = COALESCE(views, 0) + 1
   WHERE id = stay_id
  RETURNING views INTO new_views;

  -- 존재하지 않는 id면 UPDATE 0건 → RETURNING 없음 → NULL
  RETURN new_views;
END;
$$;

-- updated_at 트리거가 조회수 때문에 튀는 것을 원치 않으면 아래를 고려할 것.
-- 현재는 stays 의 update_stays_updated_at 트리거가 함께 발동해 updated_at 이 갱신된다.
-- 목록 정렬은 created_at DESC 기준이므로 노출 순서에는 영향이 없어 그대로 둔다.

-- ============================================================
-- 2. storage.objects UPDATE/DELETE 정책 — 이번 마이그레이션에서는 변경하지 않음
--
--    [실제 확인 결과] 브리핑의 전제("002가 UPDATE/DELETE를 누구나로 열어뒀다")는 사실과 다름.
--      - 002_storage_setup.sql 이 storage.objects 에 만든 정책은 INSERT / SELECT 2개뿐.
--        ("Anyone can update own jobs" 는 storage 가 아니라 public.jobs 테이블 정책이며
--         017 에서 이미 제거됨)
--      - ai_photo_generations.sql 도 SELECT / INSERT 만 추가.
--      - 017 은 INSERT 를 authenticated 로 교체.
--      → 즉 storage.objects 에 UPDATE/DELETE 정책은 애초에 0건이다.
--        storage.objects 는 RLS가 켜진 상태이므로 정책 부재 = anon/authenticated 모두 거부.
--        "누구나 지울 수 있는" 구멍은 존재하지 않는다. 조일 대상이 없다.
--
--    [부수 발견 — 조이면 안 되는 이유이자 별건 버그]
--      src/lib/upload.ts:137 deleteUploadedImage() 는 anon 클라이언트(@/lib/supabase)로
--      storage.remove() 를 호출한다. DELETE 정책이 없으므로 이 호출은 지금도 항상 실패하며,
--      catch 없이 console.error 후 false 만 반환해 조용히 무시되고 있다.
--      호출처: src/app/agent/mypage/company/page.tsx:154, 161, 171 (로고/간판/내부사진 교체)
--      → 기능상 "교체는 되지만 옛 파일이 스토리지에 남는" 상태(용량 누수).
--      여기서 owner = auth.uid() DELETE 정책을 추가하면 조이는 게 아니라 오히려 여는 것인데,
--      017 이전에 anon 으로 업로드된 레거시 객체는 owner 가 NULL 이라 여전히 못 지운다.
--      → 정책 변경은 (a) 서버 API 라우트에서 service_role 로 삭제하도록 옮기거나
--         (b) 레거시 owner 백필을 한 뒤에 판단해야 하는 별도 과제다.
--         이번 Phase 1(단기임대 스키마)의 범위를 벗어나므로 손대지 않는다.
--
--    아래는 위 (b)가 정리된 뒤 적용할 후보 정책이다. 지금은 실행하지 말 것.
--
-- CREATE POLICY "Owners can update own job images" ON storage.objects
--   FOR UPDATE TO authenticated
--   USING (bucket_id = 'job-images' AND owner = auth.uid());
--
-- CREATE POLICY "Owners can delete own job images" ON storage.objects
--   FOR DELETE TO authenticated
--   USING (bucket_id = 'job-images' AND owner = auth.uid());
--
--   ※ 최신 Supabase는 storage.objects.owner(uuid)를 deprecated 처리하고 owner_id(text)를 쓴다.
--     적용 시점에 실제 컬럼을 먼저 확인할 것:
--     SELECT column_name, data_type FROM information_schema.columns
--      WHERE table_schema='storage' AND table_name='objects' AND column_name LIKE 'owner%';
--
--   적용 전 반드시 아래로 레거시 객체 수를 확인할 것 (0이 아니면 백필 먼저):
-- SELECT count(*) FILTER (WHERE owner IS NULL) AS legacy_no_owner,
--        count(*) AS total
--   FROM storage.objects WHERE bucket_id = 'job-images';

-- ============================================================
-- 검증 쿼리 (수동 실행)
-- ============================================================
-- RPC 생성 확인
-- SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args,
--        p.prosecdef AS security_definer, p.proconfig
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE n.nspname = 'public' AND p.proname IN ('increment_stay_views', 'increment_ai_usage');
--
-- RPC 동작 확인 (임의의 stays.id 로)
-- SELECT increment_stay_views((SELECT id FROM stays LIMIT 1));
--
-- storage.objects 정책 현황 (UPDATE/DELETE 가 0건이면 이 파일의 판단대로임)
-- SELECT policyname, cmd, roles, qual, with_check FROM pg_policies
--  WHERE schemaname = 'storage' AND tablename = 'objects'
--  ORDER BY cmd, policyname;
