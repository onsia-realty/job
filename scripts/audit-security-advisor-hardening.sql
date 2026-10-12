-- READ ONLY. Run against the app project before applying 040 and before
-- changing any Advisor-reported view. This returns schema/security metadata
-- only; it does not read notice, market, or booking rows.
BEGIN TRANSACTION READ ONLY;

SELECT current_database(), current_user,
  current_setting('server_version') AS server_version,
  current_setting('server_version_num')::integer >= 150000
    AS supports_security_invoker_views;

-- notices should have RLS enabled, a SELECT-only client grant, and exactly one
-- public SELECT policy after 040. Effective privileges include inherited ACLs.
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity,
  pg_get_userbyid(c.relowner) AS owner,
  r.rolname,
  has_table_privilege(r.oid, c.oid, 'SELECT') AS can_select,
  has_table_privilege(r.oid, c.oid, 'INSERT') AS can_insert,
  has_table_privilege(r.oid, c.oid, 'UPDATE') AS can_update,
  has_table_privilege(r.oid, c.oid, 'DELETE') AS can_delete,
  has_table_privilege(r.oid, c.oid, 'TRUNCATE') AS can_truncate
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN pg_roles r
WHERE n.nspname = 'public'
  AND c.relname = 'notices'
  AND r.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY r.rolname;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'notices'
ORDER BY policyname;

SELECT grantee, table_name, column_name, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'notices'
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY grantee, column_name, privilege_type;

-- A view can safely use security_invoker only after its callers have the
-- required access to every dependency and underlying RLS matches the intended
-- public contract. public_bookings has no repository definition, so its live
-- definition and dependencies must be reviewed rather than inferred.
SELECT c.relname AS view_name,
  c.reloptions,
  COALESCE(c.reloptions, ARRAY[]::text[]) @> ARRAY['security_invoker=true']
    AS security_invoker,
  has_table_privilege('anon', c.oid, 'SELECT') AS anon_can_select_view,
  has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_can_select_view,
  pg_get_viewdef(c.oid, true) AS definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
  AND c.relname IN (
    'complex_monthly_growth',
    'complex_aggregates_with_geo',
    'public_bookings'
  )
ORDER BY c.relname;

-- Duplicate dependency rows are collapsed. relkind: r=table, p=partitioned
-- table, v=view, m=materialized view, f=foreign table.
WITH target_views AS (
  SELECT c.oid, c.relname
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND c.relname IN (
      'complex_monthly_growth',
      'complex_aggregates_with_geo',
      'public_bookings'
    )
), dependencies AS (
  SELECT DISTINCT tv.relname AS view_name, src.oid AS source_oid,
    src_ns.nspname AS source_schema, src.relname AS source_name,
    src.relkind AS source_kind, src.relrowsecurity, src.relforcerowsecurity
  FROM target_views tv
  JOIN pg_rewrite rw ON rw.ev_class = tv.oid
  JOIN pg_depend dep
    ON dep.classid = 'pg_rewrite'::regclass
   AND dep.objid = rw.oid
   AND dep.refclassid = 'pg_class'::regclass
  JOIN pg_class src ON src.oid = dep.refobjid AND src.oid <> tv.oid
  JOIN pg_namespace src_ns ON src_ns.oid = src.relnamespace
  WHERE dep.deptype IN ('n', 'a')
)
SELECT view_name, source_schema, source_name, source_kind,
  relrowsecurity, relforcerowsecurity,
  has_table_privilege('anon', source_oid, 'SELECT') AS anon_can_select_source,
  has_table_privilege('authenticated', source_oid, 'SELECT')
    AS authenticated_can_select_source
FROM dependencies
ORDER BY view_name, source_schema, source_name;

-- Review policies on ordinary/partitioned table dependencies. Materialized
-- views cannot use RLS and therefore require deliberate SELECT grants if an
-- invoker view must remain directly callable by anon/authenticated.
WITH dependency_tables AS (
  SELECT DISTINCT src_ns.nspname AS source_schema, src.relname AS source_name
  FROM pg_class view_class
  JOIN pg_namespace view_ns ON view_ns.oid = view_class.relnamespace
  JOIN pg_rewrite rw ON rw.ev_class = view_class.oid
  JOIN pg_depend dep
    ON dep.classid = 'pg_rewrite'::regclass
   AND dep.objid = rw.oid
   AND dep.refclassid = 'pg_class'::regclass
  JOIN pg_class src ON src.oid = dep.refobjid AND src.oid <> view_class.oid
  JOIN pg_namespace src_ns ON src_ns.oid = src.relnamespace
  WHERE view_ns.nspname = 'public'
    AND view_class.relkind = 'v'
    AND view_class.relname IN (
      'complex_monthly_growth',
      'complex_aggregates_with_geo',
      'public_bookings'
    )
    AND src.relkind IN ('r', 'p')
)
SELECT p.schemaname, p.tablename, p.policyname, p.roles, p.cmd,
  p.qual, p.with_check
FROM pg_policies p
JOIN dependency_tables d
  ON d.source_schema = p.schemaname AND d.source_name = p.tablename
ORDER BY p.schemaname, p.tablename, p.policyname;

COMMIT;
