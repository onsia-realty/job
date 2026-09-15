-- READ ONLY catalog assertions after migration 039. Not a substitute for
-- role-based integration tests with actual A/B/admin accounts in a test project.
BEGIN TRANSACTION READ ONLY;
DO $$
DECLARE tab text; col record;
BEGIN
  FOREACH tab IN ARRAY ARRAY['users', 'stays', 'payments'] LOOP
    IF has_table_privilege('authenticated', 'public.' || tab, 'INSERT,UPDATE,DELETE,TRUNCATE')
      OR has_table_privilege('anon', 'public.' || tab, 'INSERT,UPDATE,DELETE,TRUNCATE') THEN
      RAISE EXCEPTION 'Unexpected client write grant: %', tab;
    END IF;
    FOR col IN SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tab LOOP
      IF has_column_privilege('authenticated', 'public.' || tab, col.column_name, 'INSERT,UPDATE') THEN
        RAISE EXCEPTION 'Unexpected client column write: %.%', tab, col.column_name;
      END IF;
    END LOOP;
  END LOOP;
  IF has_table_privilege('authenticated', 'public.jobs', 'INSERT,UPDATE,TRUNCATE')
    OR NOT has_column_privilege('authenticated', 'public.jobs', 'is_active', 'UPDATE') THEN
    RAISE EXCEPTION 'Job write grants do not match activation-only contract';
  END IF;
  FOR col IN SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name <> 'is_active' LOOP
    IF has_column_privilege('authenticated', 'public.jobs', col.column_name, 'UPDATE') THEN
      RAISE EXCEPTION 'Unexpected job column write: %', col.column_name;
    END IF;
  END LOOP;
  IF has_function_privilege('anon', 'public.increment_stay_views(uuid)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.increment_stay_views(uuid)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.increment_ai_usage(uuid,date,integer)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.increment_ai_usage(uuid,date,integer)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.increment_public_job_views(uuid)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.increment_public_job_views(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Counter RPC exposed to client';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('users', 'jobs', 'stays', 'resumes', 'payments', 'applications')
      AND NOT c.relrowsecurity) THEN
    RAISE EXCEPTION 'RLS disabled';
  END IF;
END $$;
COMMIT;
