-- 042: LOCAL DRAFT, NOT APPLIED. Requires 001..038 (stays + auth/users).
-- Does not require 039/040/041. Review/export live stays policies, table/column
-- grants and dependent views/RPCs first; dashboard-only changes are replaced.
-- API reads/writes use service_role; public callers use /api/stays DTOs.
-- If 039 is applied later, immediately reapply 042: 039 restores public SELECT.
-- No public view is introduced: an invoker view needs underlying SELECT and a
-- definer view can bypass RLS. Audit existing views/RPCs separately before release.
BEGIN;

DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stays'
  LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES (%I) ON public.stays FROM PUBLIC, anon, authenticated', item.column_name);
  END LOOP;
  FOR item IN SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'stays'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.stays', item.policyname);
  END LOOP;
END $$;

REVOKE ALL PRIVILEGES ON TABLE public.stays FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.stays TO service_role;
ALTER TABLE public.stays ENABLE ROW LEVEL SECURITY;
-- Preserve authenticated own-row reads. All writes, including approval and
-- legal-display snapshots, must pass through the existing authenticated APIs.
GRANT SELECT ON TABLE public.stays TO authenticated;
CREATE POLICY stays_private_own_read ON public.stays FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Close the legacy 037 SECURITY DEFINER path too when 039 is not installed.
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

COMMIT;
