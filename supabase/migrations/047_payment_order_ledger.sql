-- 047: server-created order snapshots and atomic, idempotent payment application.
-- Requires 039 and 046. Review and apply manually BEFORE deploying the order API.
-- This migration does not change the existing ON DELETE CASCADE user policy:
-- deleting a user still deletes their orders/payments. Job deletion preserves them.
BEGIN;

CREATE TABLE IF NOT EXISTS public.payment_orders (
  order_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  job_id_snapshot uuid,
  job_title text,
  product_key text NOT NULL,
  product_name text NOT NULL,
  tier text NOT NULL,
  category text NOT NULL CHECK (category IN ('sales', 'agent')),
  days integer NOT NULL CHECK (days > 0),
  exposure_days integer NOT NULL CHECK (exposure_days > 0),
  duration text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'KRW' CHECK (currency = 'KRW'),
  idempotency_key uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  payment_key text UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'refunded', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  CHECK ((category = 'sales' AND tier IN ('premium', 'superior', 'dia', 'unique'))
      OR (category = 'agent' AND tier IN ('basic', 'premium', 'vip')))
);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_created ON public.payment_orders(user_id, created_at DESC);
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_orders FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.payment_orders TO authenticated;
GRANT ALL ON public.payment_orders TO service_role;
DROP POLICY IF EXISTS payment_orders_own_read ON public.payment_orders;
CREATE POLICY payment_orders_own_read ON public.payment_orders FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS order_id text UNIQUE REFERENCES public.payment_orders(order_id),
  ADD COLUMN IF NOT EXISTS job_id_snapshot uuid,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS provider_status text,
  ADD COLUMN IF NOT EXISTS balance_amount integer CHECK (balance_amount >= 0),
  ADD COLUMN IF NOT EXISTS cancels jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(cancels) = 'array');

-- Some deployed databases have a legacy BEFORE INSERT expiry trigger. It must
-- keep deriving expiry for old inserts, but preserve the explicit queued window
-- passed by apply_payment_order (not reset a second 5-day purchase to paid_at+5).
-- Edit its existing definition so security/search_path attributes are unchanged.
DO $migration$
DECLARE
  legacy_definition text;
BEGIN
  IF to_regprocedure('public.set_payment_expires_at()') IS NOT NULL THEN
    SELECT pg_get_functiondef('public.set_payment_expires_at()'::regprocedure) INTO legacy_definition;
    IF position('IF NEW.expires_at IS NOT NULL THEN' IN legacy_definition) = 0 THEN
      EXECUTE regexp_replace(legacy_definition, '\mBEGIN\M',
        E'BEGIN\n    IF NEW.expires_at IS NOT NULL THEN RETURN NEW; END IF;', 'i');
    END IF;
  END IF;
END;
$migration$;

UPDATE public.payments p
  SET job_id_snapshot = COALESCE(p.job_id_snapshot, p.job_id), job_title = COALESCE(p.job_title, j.title)
  FROM public.jobs j WHERE j.id = p.job_id AND p.order_id IS NULL
    AND (p.job_id_snapshot IS NULL OR p.job_title IS NULL);

-- Constraint names can differ in deployed databases. Replace only payments.job_id FKs.
DO $$
DECLARE fk record;
BEGIN
  FOR fk IN
    SELECT c.conname FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attname = 'job_id'
    WHERE c.conrelid = 'public.payments'::regclass AND c.contype = 'f'
      AND c.conkey = ARRAY[a.attnum]::smallint[]
  LOOP
    EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I', fk.conname);
  END LOOP;
END $$;
ALTER TABLE public.payments ADD CONSTRAINT payments_job_id_fkey
  FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;

-- Remove table AND column write grants, including grants predating 039.
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.payments
  FROM PUBLIC, anon, authenticated;
DO $$
DECLARE col record;
BEGIN
  FOR col IN SELECT attname FROM pg_attribute
    WHERE attrelid = 'public.payments'::regclass AND attnum > 0 AND NOT attisdropped
  LOOP
    EXECUTE format('REVOKE INSERT (%I), UPDATE (%I), REFERENCES (%I) ON public.payments FROM PUBLIC, anon, authenticated',
      col.attname, col.attname, col.attname);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.payment_tier_rank(p_category text, p_tier text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE WHEN p_category = 'sales' THEN
    CASE p_tier WHEN 'premium' THEN 1 WHEN 'superior' THEN 2 WHEN 'dia' THEN 3 WHEN 'unique' THEN 4 ELSE 0 END
  ELSE
    CASE p_tier WHEN 'basic' THEN 1 WHEN 'premium' THEN 2 WHEN 'vip' THEN 3 ELSE 0 END
  END
$$;
REVOKE ALL ON FUNCTION public.payment_tier_rank(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.payment_tier_rank(text, text) TO service_role;

-- All projection writers share the same job lock with apply_payment_order. Read
-- completed windows only AFTER acquiring it, so a stale TS read cannot overwrite
-- a refund or a concurrently applied purchase with an obsolete tier.
CREATE OR REPLACE FUNCTION public.recompute_payment_job_ad(p_job_id uuid, p_now timestamptz DEFAULT now())
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  job public.jobs%ROWTYPE;
  projected_tier text;
  projected_end timestamptz;
  latest_end timestamptz;
BEGIN
  IF p_now IS NULL OR NOT isfinite(p_now) THEN RAISE EXCEPTION 'valid projection timestamp required'; END IF;
  SELECT * INTO job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT p.tier, p.expires_at INTO projected_tier, projected_end
    FROM public.payments p WHERE p.job_id = job.id AND p.payment_status = 'completed'
      AND COALESCE(p.starts_at, p.paid_at) <= p_now AND p.expires_at > p_now
      AND p.expires_at > COALESCE(p.starts_at, p.paid_at)
      AND public.payment_tier_rank(job.category, p.tier) > 0
    ORDER BY public.payment_tier_rank(job.category, p.tier) DESC, p.expires_at DESC LIMIT 1;
  SELECT max(p.expires_at) INTO latest_end FROM public.payments p
    WHERE p.job_id = job.id AND p.payment_status = 'completed'
      AND p.expires_at > COALESCE(p.starts_at, p.paid_at);
  UPDATE public.jobs SET tier = COALESCE(projected_tier, 'normal'),
    ad_expires_at = COALESCE(projected_end, latest_end) WHERE id = job.id;
  RETURN jsonb_build_object('tier', COALESCE(projected_tier, 'normal'),
    'ad_expires_at', COALESCE(projected_end, latest_end));
END;
$$;
REVOKE ALL ON FUNCTION public.recompute_payment_job_ad(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_payment_job_ad(uuid, timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_payment_order(p_order_id text, p_payment_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE ord public.payment_orders%ROWTYPE;
BEGIN
  IF p_payment_key IS NULL OR btrim(p_payment_key) = '' THEN
    RAISE EXCEPTION 'payment key required';
  END IF;
  SELECT * INTO ord FROM public.payment_orders WHERE order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment order not found'; END IF;
  IF ord.payment_key IS NOT NULL AND ord.payment_key <> p_payment_key THEN
    RAISE EXCEPTION 'payment key conflicts with order';
  END IF;
  -- A key cannot be rebound to a second order (UNIQUE). Terminal states stay terminal.
  UPDATE public.payment_orders SET payment_key = p_payment_key,
    status = CASE WHEN status IN ('pending', 'processing') THEN 'processing' ELSE status END
    WHERE order_id = p_order_id RETURNING * INTO ord;
  RETURN to_jsonb(ord);
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_payment_order(p_order_id text, p_payment_key text, p_provider jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  ord public.payment_orders%ROWTYPE;
  pay public.payments%ROWTYPE;
  job public.jobs%ROWTYPE;
  provider_state text;
  cancel_list jsonb;
  balance integer;
  approved timestamptz;
  win_start timestamptz;
  win_end timestamptz;
  active_rank integer;
  projected_tier text;
  projected_end timestamptz;
  latest_end timestamptz;
  payment_exists boolean;
  job_exists boolean := false;
  activate_job boolean := false;
BEGIN
  SELECT * INTO ord FROM public.payment_orders WHERE order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment order not found'; END IF;
  IF p_payment_key IS NULL OR btrim(p_payment_key) = ''
      OR ord.payment_key IS DISTINCT FROM p_payment_key
      OR p_provider->>'paymentKey' IS DISTINCT FROM p_payment_key
      OR p_provider->>'orderId' IS DISTINCT FROM ord.order_id
      OR p_provider->>'currency' IS DISTINCT FROM ord.currency
      OR jsonb_typeof(p_provider->'totalAmount') IS DISTINCT FROM 'number'
      OR (p_provider->>'totalAmount')::numeric IS DISTINCT FROM ord.amount::numeric THEN
    RAISE EXCEPTION 'provider payment does not match order snapshot';
  END IF;
  provider_state := p_provider->>'status';
  IF provider_state IS NULL OR provider_state NOT IN ('DONE', 'PARTIAL_CANCELED', 'CANCELED', 'ABORTED', 'EXPIRED') THEN
    RAISE EXCEPTION 'unsupported provider payment status';
  END IF;
  cancel_list := COALESCE(NULLIF(p_provider->'cancels', 'null'::jsonb), '[]'::jsonb);
  IF jsonb_typeof(cancel_list) <> 'array' THEN RAISE EXCEPTION 'invalid cancels'; END IF;
  IF p_provider->'balanceAmount' IS NULL OR p_provider->'balanceAmount' = 'null'::jsonb THEN
    balance := CASE WHEN provider_state = 'CANCELED' THEN 0 ELSE ord.amount END;
  ELSE
    IF jsonb_typeof(p_provider->'balanceAmount') <> 'number'
      OR (p_provider->>'balanceAmount')::numeric <> trunc((p_provider->>'balanceAmount')::numeric)
      OR (p_provider->>'balanceAmount')::numeric NOT BETWEEN 0 AND ord.amount THEN
      RAISE EXCEPTION 'invalid balance amount';
    END IF;
    balance := (p_provider->>'balanceAmount')::integer;
  END IF;
  IF (provider_state = 'DONE' AND balance <> ord.amount)
      OR (provider_state = 'CANCELED' AND balance <> 0)
      OR (provider_state = 'PARTIAL_CANCELED' AND (balance <= 0 OR balance >= ord.amount)) THEN
    RAISE EXCEPTION 'provider status and balance disagree';
  END IF;

  -- Serialize all orders for one job before reading their entitlement windows.
  IF ord.job_id IS NOT NULL THEN
    SELECT * INTO job FROM public.jobs WHERE id = ord.job_id FOR UPDATE;
    job_exists := FOUND;
    IF job_exists AND (job.user_id IS DISTINCT FROM ord.user_id OR job.category IS DISTINCT FROM ord.category) THEN
      RAISE EXCEPTION 'job owner/category no longer matches order';
    END IF;
  END IF;
  SELECT * INTO pay FROM public.payments WHERE order_id = ord.order_id FOR UPDATE;
  payment_exists := FOUND;

  -- Never resurrect refunded/failed orders from stale DONE events. Provider fetch is
  -- performed by the API; this additional guard also handles concurrent deliveries.
  IF ord.status IN ('refunded', 'failed') AND provider_state IN ('DONE', 'PARTIAL_CANCELED') THEN
    RAISE EXCEPTION 'terminal order cannot be restored';
  END IF;
  IF payment_exists AND pay.payment_status IN ('refunded', 'failed')
      AND provider_state IN ('DONE', 'PARTIAL_CANCELED') THEN
    RAISE EXCEPTION 'terminal payment cannot be restored';
  END IF;
  IF payment_exists AND pay.provider_status = 'PARTIAL_CANCELED' AND provider_state = 'DONE' THEN
    RAISE EXCEPTION 'partial cancellation cannot regress to DONE';
  END IF;
  IF payment_exists AND pay.balance_amount IS NOT NULL AND balance > pay.balance_amount THEN
    RAISE EXCEPTION 'payment balance cannot increase';
  END IF;
  IF provider_state IN ('ABORTED', 'EXPIRED') THEN
    IF payment_exists OR ord.status IN ('completed', 'refunded') THEN
      RAISE EXCEPTION 'approved payment cannot become unapproved';
    END IF;
    UPDATE public.payment_orders SET payment_key = p_payment_key, status = 'failed'
      WHERE order_id = ord.order_id;
    RETURN NULL; -- A failed, unapproved attempt must not create a payment/advertisement.
  END IF;

  -- PostgreSQL accepts 'infinity' and bare dates: require an explicit ISO timestamp
  -- and timezone as returned by Toss, then validate its actual calendar value.
  IF COALESCE(p_provider->>'approvedAt', '') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$' THEN
    RAISE EXCEPTION 'valid provider approvedAt required';
  END IF;
  approved := (p_provider->>'approvedAt')::timestamptz;
  IF NOT isfinite(approved) OR (ord.approved_at IS NOT NULL AND approved <> ord.approved_at) THEN
    RAISE EXCEPTION 'provider approval timestamp conflicts with order';
  END IF;

  IF NOT payment_exists THEN
    win_start := approved;
    IF job_exists THEN
      SELECT public.payment_tier_rank(ord.category, p.tier) INTO active_rank
        FROM public.payments p WHERE p.job_id = job.id AND p.payment_status = 'completed'
          AND COALESCE(p.starts_at, p.paid_at) <= approved AND p.expires_at > approved
          AND p.expires_at > COALESCE(p.starts_at, p.paid_at)
          AND public.payment_tier_rank(ord.category, p.tier) > 0
        ORDER BY public.payment_tier_rank(ord.category, p.tier) DESC, p.expires_at DESC LIMIT 1;
      IF active_rank IS NOT NULL AND public.payment_tier_rank(ord.category, ord.tier) <= active_rank THEN
        SELECT greatest(approved, max(p.expires_at)) INTO win_start
          FROM public.payments p WHERE p.job_id = job.id AND p.payment_status = 'completed'
            AND p.expires_at > approved AND p.expires_at > COALESCE(p.starts_at, p.paid_at);
      END IF;
    END IF;
    -- Match JS's exposureDays * 86400000 even under a non-UTC database timezone.
    win_end := win_start + ord.exposure_days * interval '24 hours';
    INSERT INTO public.payments (
      order_id, payment_id, user_id, job_id, job_id_snapshot, job_title,
      product_key, product_name, amount, currency, tier, category, duration,
      payment_status, payment_method, pg_provider, paid_at, starts_at,
      start_date, end_date, expires_at, provider_status, balance_amount, cancels
    ) VALUES (
      ord.order_id, p_payment_key, ord.user_id, ord.job_id, ord.job_id_snapshot, ord.job_title,
      ord.product_key, ord.product_name, ord.amount, ord.currency, ord.tier, ord.category, ord.duration,
      CASE WHEN provider_state = 'CANCELED' THEN 'refunded' ELSE 'completed' END,
      COALESCE(p_provider->>'method', 'CARD'), 'tosspayments', approved, win_start,
      (win_start AT TIME ZONE 'UTC')::date, (win_end AT TIME ZONE 'UTC')::date, win_end,
      provider_state, balance, cancel_list
    ) RETURNING * INTO pay;
    activate_job := provider_state IN ('DONE', 'PARTIAL_CANCELED');
  ELSE
    IF pay.payment_id IS DISTINCT FROM p_payment_key OR pay.user_id IS DISTINCT FROM ord.user_id
      OR pay.amount IS DISTINCT FROM ord.amount THEN RAISE EXCEPTION 'existing payment conflicts with order'; END IF;
    -- Retrying an already applied approval preserves hidden/deactivated job state.
    UPDATE public.payments SET
      payment_status = CASE WHEN provider_state = 'CANCELED' THEN 'refunded' ELSE 'completed' END,
      provider_status = provider_state, balance_amount = balance, cancels = cancel_list, updated_at = now()
      WHERE id = pay.id RETURNING * INTO pay;
  END IF;
  UPDATE public.payment_orders SET payment_key = p_payment_key, approved_at = approved,
    status = CASE WHEN provider_state = 'CANCELED' THEN 'refunded' ELSE 'completed' END
    WHERE order_id = ord.order_id;

  IF job_exists THEN
    SELECT p.tier, p.expires_at INTO projected_tier, projected_end
      FROM public.payments p WHERE p.job_id = job.id AND p.payment_status = 'completed'
        AND COALESCE(p.starts_at, p.paid_at) <= now() AND p.expires_at > now()
        AND p.expires_at > COALESCE(p.starts_at, p.paid_at)
        AND public.payment_tier_rank(job.category, p.tier) > 0
      ORDER BY public.payment_tier_rank(job.category, p.tier) DESC, p.expires_at DESC LIMIT 1;
    SELECT max(p.expires_at) INTO latest_end FROM public.payments p
      WHERE p.job_id = job.id AND p.payment_status = 'completed'
        AND p.expires_at > COALESCE(p.starts_at, p.paid_at);
    UPDATE public.jobs SET tier = COALESCE(projected_tier, 'normal'),
      ad_expires_at = COALESCE(projected_end, latest_end),
      is_active = CASE WHEN activate_job THEN true ELSE is_active END,
      deadline = CASE WHEN activate_job AND deadline IS NOT NULL AND latest_end IS NOT NULL
        THEN greatest(deadline, (latest_end AT TIME ZONE 'Asia/Seoul')::date) ELSE deadline END
      WHERE id = job.id;
  END IF;
  RETURN to_jsonb(pay);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_payment_order(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_payment_order(text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_payment_order(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_payment_order(text, text, jsonb) TO service_role;

COMMIT;
