-- Read-only catalog snapshot. No customer rows, keys, or provider payloads.
SELECT jsonb_build_object(
  'captured_at', now(), 'database', current_database(), 'role', current_user,
  'tables', (SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity,
      pg_get_userbyid(c.relowner) AS owner, c.relacl::text AS acl
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname IN ('users','jobs','payments','payment_orders',
      'complex_aggregates','complex_rent_aggregates')
  ) x),
  'columns', (SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT table_name,column_name,data_type,is_nullable,column_default
    FROM information_schema.columns WHERE table_schema='public'
      AND table_name IN ('users','jobs','payments','payment_orders')
    ORDER BY table_name,ordinal_position
  ) x),
  'constraints', (SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT c.conrelid::regclass::text AS relation,c.conname,pg_get_constraintdef(c.oid) AS definition
    FROM pg_constraint c WHERE c.conrelid IN (to_regclass('public.users'),to_regclass('public.jobs'),
      to_regclass('public.payments'),to_regclass('public.payment_orders'))
  ) x),
  'policies', (SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT * FROM pg_policies WHERE schemaname='public'
      AND tablename IN ('users','jobs','payments','payment_orders')
  ) x),
  'grants', (SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT grantee,table_name,privilege_type FROM information_schema.table_privileges
    WHERE table_schema='public' AND table_name IN ('users','jobs','payments','payment_orders')
  ) x),
  'column_grants', (SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT grantee,table_name,column_name,privilege_type FROM information_schema.column_privileges
    WHERE table_schema='public' AND table_name IN ('users','jobs','payments','payment_orders')
  ) x),
  'triggers', (SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT t.tgrelid::regclass::text AS relation,t.tgname,pg_get_triggerdef(t.oid) AS definition,
      pg_get_functiondef(t.tgfoid) AS function_definition
    FROM pg_trigger t WHERE NOT t.tgisinternal AND t.tgrelid IN (
      to_regclass('public.users'),to_regclass('public.jobs'),to_regclass('public.payments'))
  ) x),
  'functions', (SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT p.oid::regprocedure::text AS signature,p.prosecdef,p.proconfig,
      pg_get_userbyid(p.proowner) AS owner,p.proacl::text AS acl,pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
      AND p.proname IN ('refresh_market_aggregates','payment_tier_rank',
        'claim_payment_order','apply_payment_order','recompute_payment_job_ad')
  ) x),
  'materialized_views', (SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT * FROM pg_matviews WHERE schemaname='public'
      AND matviewname IN ('complex_aggregates','complex_rent_aggregates')
  ) x),
  'indexes', (SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT * FROM pg_indexes WHERE schemaname='public' AND tablename IN (
      'jobs','payments','payment_orders','complex_aggregates','complex_rent_aggregates')
  ) x)
) AS catalog_backup;
