-- P0: review locally first; NOT applied by the code change.
-- Prerequisites: 001..038 and scripts/audit-p0-permissions.sql output reviewed.
-- This intentionally replaces policies on the six named tables. Export existing
-- policies/grants first, including dashboard-only changes. No data is rewritten.
-- API writes use service_role; browser helpers retain resume/application writes,
-- own job activation/deletion. There is no client-side administrator bypass.
BEGIN;

DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('users', 'jobs', 'stays', 'resumes', 'payments', 'applications')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', item.policyname, item.schemaname, item.tablename);
  END LOOP;
  -- A table REVOKE does not remove pre-existing column grants.
  FOR item IN SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('users', 'jobs', 'stays', 'resumes', 'payments', 'applications')
  LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES (%I) ON public.%I FROM PUBLIC, anon, authenticated',
      item.column_name, item.table_name);
  END LOOP;
END $$;

REVOKE ALL PRIVILEGES ON public.users, public.jobs, public.stays,
  public.resumes, public.payments, public.applications FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON public.users, public.jobs, public.stays,
  public.resumes, public.payments, public.applications TO service_role;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Profile/admin/identity/office association fields are server writes only.
GRANT SELECT ON public.users TO authenticated;
CREATE POLICY p0_users_own_read ON public.users FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

GRANT SELECT ON public.jobs TO anon, authenticated;
GRANT UPDATE (is_active) ON public.jobs TO authenticated;
GRANT DELETE ON public.jobs TO authenticated;
CREATE POLICY p0_jobs_public_read ON public.jobs FOR SELECT TO anon, authenticated
  USING (is_active = true AND is_approved = true);
CREATE POLICY p0_jobs_own_read ON public.jobs FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY p0_jobs_own_update ON public.jobs FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY p0_jobs_own_delete ON public.jobs FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Approval and legal-display snapshots must pass through the authenticated API.
GRANT SELECT ON public.stays TO anon, authenticated;
CREATE POLICY p0_stays_public_read ON public.stays FOR SELECT TO anon, authenticated
  USING (is_active = true AND is_approved = true);
CREATE POLICY p0_stays_own_read ON public.stays FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

GRANT SELECT ON public.payments TO authenticated;
CREATE POLICY p0_payments_own_read ON public.payments FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Preserve the existing is_public opt-in semantics. Product changes to public
-- resume contact visibility require a separate decision across API and UI.
GRANT SELECT ON public.resumes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
CREATE POLICY p0_resumes_public_read ON public.resumes FOR SELECT TO anon, authenticated
  USING (is_public = true);
CREATE POLICY p0_resumes_own ON public.resumes FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY p0_resumes_recipient_read ON public.resumes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id = a.job_id
    WHERE a.resume_id = resumes.id AND a.user_id = resumes.user_id
      AND j.user_id = (SELECT auth.uid())
  ));

GRANT SELECT, INSERT, DELETE ON public.applications TO authenticated;
GRANT UPDATE (status) ON public.applications TO authenticated;
CREATE POLICY p0_applications_own_read ON public.applications FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY p0_applications_recipient_read ON public.applications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j
    WHERE j.id = applications.job_id AND j.user_id = (SELECT auth.uid())));
CREATE POLICY p0_applications_own_insert ON public.applications FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()) AND status = 'pending'
    AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = applications.job_id
      AND j.is_active = true AND j.is_approved = true AND j.user_id <> (SELECT auth.uid()))
    AND (resume_id IS NULL OR EXISTS (SELECT 1 FROM public.resumes r
      WHERE r.id = applications.resume_id AND r.user_id = (SELECT auth.uid())))
  );
CREATE POLICY p0_applications_recipient_update ON public.applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j
    WHERE j.id = applications.job_id AND j.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j
    WHERE j.id = applications.job_id AND j.user_id = (SELECT auth.uid())));
CREATE POLICY p0_applications_own_delete ON public.applications FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- SECURITY DEFINER RPC must not reveal/increment hidden records. The API may
-- call this with service_role, so enforce visibility inside the function too.
CREATE OR REPLACE FUNCTION public.increment_stay_views(stay_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE new_views integer;
BEGIN
  UPDATE public.stays SET views = COALESCE(views, 0) + 1
    WHERE id = stay_id AND is_active = true AND is_approved = true
    RETURNING views INTO new_views;
  RETURN new_views;
END;
$$;
REVOKE ALL ON FUNCTION public.increment_stay_views(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_stay_views(uuid) TO service_role;

-- AI usage is incremented only by the server-side admin client. The deployed
-- SECURITY DEFINER function currently inherits the default PUBLIC execute
-- grant, which lets clients choose another user id and an arbitrary limit.
REVOKE ALL ON FUNCTION public.increment_ai_usage(uuid, date, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(uuid, date, integer) TO service_role;

-- The old increment_job_views is absent from repository migrations; use a new
-- name to avoid assuming its deployed return type. Remove client execution on
-- every old overload; audit its definition/dependencies before dropping it.
DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT p.oid::regprocedure AS signature
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'increment_job_views'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', item.signature);
  END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.increment_public_job_views(job_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE new_views integer;
BEGIN
  UPDATE public.jobs SET views = COALESCE(views, 0) + 1
    WHERE id = job_id AND is_active = true AND is_approved = true
    RETURNING views INTO new_views;
  RETURN new_views;
END;
$$;
REVOKE ALL ON FUNCTION public.increment_public_job_views(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_public_job_views(uuid) TO service_role;

COMMIT;
