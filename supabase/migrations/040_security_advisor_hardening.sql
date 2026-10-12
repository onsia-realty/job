-- 040: Supabase Security Advisor hardening (local draft; NOT APPLIED)
--
-- Scope intentionally limited to public.notices. The three Advisor-reported
-- SECURITY DEFINER views are not changed here because public.public_bookings is
-- absent from the repository and live grants/RLS on every underlying relation
-- have not yet been verified. Run scripts/audit-security-advisor-hardening.sql
-- against the app project before drafting that separate view migration.
BEGIN;

-- Table-level REVOKE does not remove independently granted column privileges.
DO $$
DECLARE item record;
BEGIN
  FOR item IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notices'
  LOOP
    EXECUTE format(
      'REVOKE ALL PRIVILEGES (%I) ON public.notices FROM PUBLIC, anon, authenticated',
      item.column_name
    );
  END LOOP;
END $$;

REVOKE ALL PRIVILEGES ON TABLE public.notices FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.notices TO service_role;

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Replace all dashboard/repository policies so the resulting contract is
-- deterministic: clients may read every notice but cannot write any notice.
DO $$
DECLARE item record;
BEGIN
  FOR item IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notices'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.notices', item.policyname);
  END LOOP;
END $$;

GRANT SELECT ON TABLE public.notices TO anon, authenticated;
CREATE POLICY advisor_notices_public_read
  ON public.notices
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMIT;
