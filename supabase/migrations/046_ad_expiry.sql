-- 046: 광고 기간을 서버가 관리 (jobs.ad_expires_at, payments.starts_at)
--
-- 적용: 소유자가 Supabase SQL Editor 에서 수동 실행. 코드 배포 "전"에 실행해야 한다
--       (새 코드는 jobs.ad_expires_at / payments.starts_at 를 읽고 쓴다).
-- 멱등: 여러 번 실행해도 결과가 같다 (IF NOT EXISTS, ad_expires_at IS NULL 인 행만 백필).
--
-- 권한(ad_expires_at, tier 는 서버 전용):
--   * 039(p0_authorization_boundaries)가 적용돼 있으면 jobs 에 대해 authenticated 는
--     UPDATE(is_active) 만 가진다 → 새 컬럼도 자동으로 클라이언트 수정 불가.
--   * 039 가 적용되지 않았을 수 있다. Postgres 에서 컬럼 단위 REVOKE 는 "테이블 단위" UPDATE
--     권한을 없애지 못한다. 그래서 아래 DO 블록은 anon/authenticated 가 테이블 단위 UPDATE 를
--     가진 경우에만, 테이블 UPDATE 를 회수하고 (tier, ad_expires_at 를 뺀) 나머지 모든 컬럼에
--     컬럼 단위 UPDATE 를 다시 준다 → 기존 동작은 유지하고 두 컬럼만 막는다.
--     039 가 이미 적용된 DB 에서는 이 블록이 아무것도 하지 않는다.
--   * 마지막 검증 블록이 두 컬럼에 대해 anon/authenticated UPDATE 가 남아 있으면 EXCEPTION 으로
--     전체를 롤백한다.
--   * INSERT 로 tier 를 지정하는 구멍(039 미적용 시)은 039 의 범위다. API(POST /api/jobs)는
--     tier='normal' 을 강제하고 ad_expires_at 는 받지 않는다. 039 적용을 권장한다.
BEGIN;

-- 1) jobs.ad_expires_at ---------------------------------------------------------
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS ad_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_jobs_ad_expires_at
  ON public.jobs (ad_expires_at)
  WHERE ad_expires_at IS NOT NULL;

-- 2) 서버 전용 컬럼 권한 -----------------------------------------------------------
DO $$
DECLARE
  r text;
  col record;
  had_table_update boolean;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    had_table_update := has_table_privilege(r, 'public.jobs', 'UPDATE');
    IF had_table_update THEN
      -- PUBLIC 에 준 테이블 권한도 함께 회수 (역할별 회수만으론 PUBLIC 상속이 남는다)
      EXECUTE 'REVOKE UPDATE ON public.jobs FROM PUBLIC';
      EXECUTE format('REVOKE UPDATE ON public.jobs FROM %I', r);
      FOR col IN
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'jobs'
          AND column_name NOT IN ('tier', 'ad_expires_at')
      LOOP
        EXECUTE format('GRANT UPDATE (%I) ON public.jobs TO %I', col.column_name, r);
      END LOOP;
      RAISE NOTICE '046: % 의 jobs 테이블 UPDATE 를 컬럼 단위로 전환 (tier, ad_expires_at 제외)', r;
    END IF;
  END LOOP;
END $$;

REVOKE UPDATE (ad_expires_at, tier) ON public.jobs FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF has_column_privilege('anon', 'public.jobs', 'ad_expires_at', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.jobs', 'ad_expires_at', 'UPDATE')
     OR has_column_privilege('anon', 'public.jobs', 'tier', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.jobs', 'tier', 'UPDATE') THEN
    RAISE EXCEPTION '046: anon/authenticated 가 jobs.tier 또는 jobs.ad_expires_at 를 아직 UPDATE 할 수 있습니다';
  END IF;
END $$;

-- 3) payments.starts_at ---------------------------------------------------------
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS starts_at timestamptz;

UPDATE public.payments
SET starts_at = COALESCE(paid_at, created_at)
WHERE starts_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payments_job_status
  ON public.payments (job_id, payment_status)
  WHERE job_id IS NOT NULL;

-- 4) jobs_tier_check 에 'dia' 포함 (015 기준 목록 + dia) -------------------------
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_tier_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_tier_check
  CHECK (tier IN ('vip', 'unique', 'dia', 'superior', 'premium', 'basic', 'normal'));

-- 5) 백필: 완료 결제로부터 jobs.tier / jobs.ad_expires_at ---------------------------
--    앱의 projectJobAd 와 같은 규칙: 지금 유효한 창 중 서열 최고(동률 → 늦게 끝나는 것)의 등급/끝,
--    유효한 창이 없으면 tier='normal', ad_expires_at = max(expires_at).
--    ad_expires_at 가 이미 있는 행은 건드리지 않는다(재실행 안전).
WITH win AS (
  SELECT
    p.job_id,
    p.tier,
    COALESCE(p.starts_at, p.paid_at) AS s,
    p.expires_at AS e,
    CASE WHEN j.category = 'sales' THEN
      CASE p.tier WHEN 'premium' THEN 1 WHEN 'superior' THEN 2 WHEN 'dia' THEN 3 WHEN 'unique' THEN 4 ELSE 0 END
    ELSE
      CASE p.tier WHEN 'basic' THEN 1 WHEN 'premium' THEN 2 WHEN 'vip' THEN 3 ELSE 0 END
    END AS rnk
  FROM public.payments p
  JOIN public.jobs j ON j.id = p.job_id
  WHERE p.payment_status = 'completed'
    AND p.job_id IS NOT NULL
    AND p.expires_at IS NOT NULL
),
active AS (
  SELECT DISTINCT ON (job_id) job_id, tier, e
  FROM win
  WHERE rnk > 0 AND s <= now() AND e > now()
  ORDER BY job_id, rnk DESC, e DESC
),
latest AS (
  SELECT job_id, max(e) AS e FROM win GROUP BY job_id
),
proj AS (
  SELECT l.job_id,
         COALESCE(a.tier, 'normal') AS tier,
         COALESCE(a.e, l.e) AS ad_expires_at
  FROM latest l
  LEFT JOIN active a USING (job_id)
)
UPDATE public.jobs j
SET tier = proj.tier,
    ad_expires_at = proj.ad_expires_at
FROM proj
WHERE j.id = proj.job_id
  AND j.ad_expires_at IS NULL;

-- 결제 기록이 없는 유료 등급 공고(수동 지정·테스트 데이터)는 그대로 둔다(tier 유지, ad_expires_at NULL).
-- 이런 공고는 기존처럼 모집 마감일(deadline) 기준으로만 닫힌다. 목록 확인용:
--
--   SELECT j.id, j.title, j.category, j.tier, j.deadline, j.created_at
--   FROM public.jobs j
--   WHERE j.tier <> 'normal'
--     AND NOT EXISTS (
--       SELECT 1 FROM public.payments p
--       WHERE p.job_id = j.id AND p.payment_status = 'completed'
--     )
--   ORDER BY j.created_at DESC;

COMMIT;

-- 적용 후 확인:
--   SELECT grantee, privilege_type, column_name FROM information_schema.column_privileges
--   WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name IN ('tier', 'ad_expires_at');
--   → anon/authenticated 행이 없어야 한다.
--   SELECT id, tier, ad_expires_at FROM public.jobs WHERE ad_expires_at IS NOT NULL ORDER BY ad_expires_at DESC LIMIT 20;

-- ─────────────────────────────────────────────────────────────────────────────
-- 롤백 (필요 시 수동 실행. 코드도 함께 이전 버전으로 되돌릴 것)
-- ─────────────────────────────────────────────────────────────────────────────
-- BEGIN;
-- DROP INDEX IF EXISTS public.idx_jobs_ad_expires_at;
-- DROP INDEX IF EXISTS public.idx_payments_job_status;
-- ALTER TABLE public.jobs DROP COLUMN IF EXISTS ad_expires_at;
-- ALTER TABLE public.payments DROP COLUMN IF EXISTS starts_at;
-- -- 'dia' 공고가 없을 때만:
-- -- ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_tier_check;
-- -- ALTER TABLE public.jobs ADD CONSTRAINT jobs_tier_check
-- --   CHECK (tier IN ('vip', 'unique', 'superior', 'premium', 'basic', 'normal'));
-- -- 2) 권한 블록이 테이블 UPDATE 를 컬럼 단위로 바꿨다면(NOTICE 확인) 그대로 두는 편이 안전하다.
-- --    원복하려면: GRANT UPDATE ON public.jobs TO authenticated;  (039 미적용 DB 에 한함)
-- COMMIT;
