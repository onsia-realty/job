-- Read-only post-migration 047 checks. Run manually in an administrator session.
-- All rows should report ok=true. This script never applies the migration.
WITH required_columns(table_name, column_name) AS (
  VALUES ('payment_orders', 'order_id'), ('payment_orders', 'job_id_snapshot'),
    ('payment_orders', 'idempotency_key'), ('payment_orders', 'approved_at'),
    ('payments', 'order_id'), ('payments', 'job_id_snapshot'), ('payments', 'job_title'),
    ('payments', 'provider_status'), ('payments', 'balance_amount'), ('payments', 'cancels')
)
SELECT 'column ' || r.table_name || '.' || r.column_name AS check_name,
  EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public'
    AND c.table_name = r.table_name AND c.column_name = r.column_name) AS ok
FROM required_columns r;

SELECT c.relname || ' RLS enabled' AS check_name, c.relrowsecurity AS ok
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('payments', 'payment_orders');

SELECT r.role_name || ' ' || t.table_name || ' writes denied' AS check_name,
  NOT has_table_privilege(r.role_name, 'public.' || t.table_name, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name
      AND (has_column_privilege(r.role_name, 'public.' || t.table_name, c.column_name, 'INSERT')
        OR has_column_privilege(r.role_name, 'public.' || t.table_name, c.column_name, 'UPDATE')
        OR has_column_privilege(r.role_name, 'public.' || t.table_name, c.column_name, 'REFERENCES'))
  ) AS ok
FROM (VALUES ('anon'), ('authenticated')) r(role_name)
CROSS JOIN (VALUES ('payments'), ('payment_orders')) t(table_name);

SELECT r.role_name || ' ' || f.signature || ' execution' AS check_name,
  to_regprocedure(f.signature) IS NOT NULL
    AND COALESCE(has_function_privilege(r.role_name, to_regprocedure(f.signature), 'EXECUTE') = (r.role_name = 'service_role'), false) AS ok
FROM (VALUES ('anon'), ('authenticated'), ('service_role')) r(role_name)
CROSS JOIN (VALUES ('public.claim_payment_order(text,text)'),
  ('public.apply_payment_order(text,text,jsonb)'), ('public.payment_tier_rank(text,text)'),
  ('public.recompute_payment_job_ad(uuid,timestamp with time zone)')) f(signature);

SELECT t.table_name || '.job_id uses SET NULL' AS check_name,
  EXISTS (
    SELECT 1 FROM pg_constraint c JOIN pg_attribute a
      ON a.attrelid = c.conrelid AND a.attname = 'job_id'
    WHERE c.conrelid = ('public.' || t.table_name)::regclass AND c.contype = 'f'
      AND c.conkey = ARRAY[a.attnum]::smallint[]
      AND c.confrelid = 'public.jobs'::regclass AND c.confdeltype = 'n'
  ) AS ok
FROM (VALUES ('payments'), ('payment_orders')) t(table_name);

SELECT 'payments order_id unique' AS check_name,
  EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_attribute a
    ON a.attrelid = c.conrelid AND a.attname = 'order_id'
    WHERE c.conrelid = 'public.payments'::regclass AND c.contype = 'u'
      AND c.conkey = ARRAY[a.attnum]::smallint[]) AS ok;

-- Data sanity: nonzero counts require investigation; never print credentials/provider payloads.
SELECT count(*) FILTER (WHERE p.job_id IS NULL AND p.job_id_snapshot IS NOT NULL) AS preserved_deleted_job_payments,
  count(*) FILTER (WHERE p.order_id IS NOT NULL AND o.order_id IS NULL) AS orphan_order_payments,
  count(*) FILTER (WHERE p.order_id IS NOT NULL AND (p.payment_id IS DISTINCT FROM o.payment_key
    OR p.user_id IS DISTINCT FROM o.user_id OR p.amount IS DISTINCT FROM o.amount)) AS mismatched_order_payments
FROM public.payments p LEFT JOIN public.payment_orders o ON o.order_id = p.order_id;
