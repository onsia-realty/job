-- READ ONLY. Run against the app project (not CRM), before AND after 039.
-- Contains schema/security definitions only, no user rows, keys or CI/DI values.
BEGIN TRANSACTION READ ONLY;

SELECT current_database(), current_user;
SELECT n.nspname AS schema, c.relname, c.relrowsecurity, c.relforcerowsecurity,
  pg_get_userbyid(c.relowner) AS owner
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('users', 'jobs', 'stays', 'resumes', 'payments', 'applications');

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public'
  AND tablename IN ('users', 'jobs', 'stays', 'resumes', 'payments', 'applications')
ORDER BY tablename, policyname;

SELECT grantee, table_name, privilege_type FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('users', 'jobs', 'stays', 'resumes', 'payments', 'applications')
ORDER BY table_name, grantee, privilege_type;
SELECT grantee, table_name, column_name, privilege_type FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name IN ('users', 'jobs', 'stays', 'resumes', 'payments', 'applications')
ORDER BY table_name, grantee, column_name, privilege_type;

-- Effective privileges catch inherited grants, beyond explicit ACLs above.
SELECT r.rolname, r.rolsuper, r.rolbypassrls, c.relname,
  has_table_privilege(r.oid, c.oid, 'SELECT') AS can_select,
  has_table_privilege(r.oid, c.oid, 'INSERT') AS can_insert,
  has_table_privilege(r.oid, c.oid, 'UPDATE') AS can_update_all_columns,
  has_table_privilege(r.oid, c.oid, 'DELETE') AS can_delete,
  has_table_privilege(r.oid, c.oid, 'TRUNCATE') AS can_truncate
FROM pg_roles r CROSS JOIN pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE r.rolname IN ('anon', 'authenticated', 'service_role') AND n.nspname = 'public'
  AND c.relname IN ('users', 'jobs', 'stays', 'resumes', 'payments', 'applications');

-- Auth provisioning is not defined in this repository. Check dashboard-only
-- triggers for raw_user_meta_data -> admin/verified fields before deployment.
SELECT n.nspname, c.relname, t.tgname, pg_get_triggerdef(t.oid) AS trigger_definition,
  pg_get_functiondef(t.tgfoid) AS function_definition
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal AND ((n.nspname = 'auth' AND c.relname = 'users')
  OR (n.nspname = 'public' AND c.relname IN
    ('users', 'jobs', 'stays', 'resumes', 'payments', 'applications')));

-- Review every exposed definer RPC, including dashboard-only increment_job_views.
SELECT p.oid::regprocedure AS function, p.prosecdef, p.proconfig, p.proacl,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f' AND p.prosecdef;
SELECT c.relname, c.reloptions, c.relacl, pg_get_viewdef(c.oid, true) AS definition
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'v';

COMMIT;
