-- Manual integration check AFTER migrations 047/048, as postgres in SQL Editor.
-- No provider/network calls. Uses one existing user ID READ-ONLY as FK owner.
-- Every job, order and payment below is synthetic, uncommitted and ROLLED BACK.
-- Run the WHOLE script together. Never replace the final ROLLBACK with COMMIT.
BEGIN;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';

CREATE TEMP TABLE payment_integration_results (
  label text PRIMARY KEY,
  passed boolean NOT NULL
) ON COMMIT DROP;

CREATE FUNCTION pg_temp.payment_integration_assert(p_label text, p_ok boolean)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_ok IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Payment integration assertion failed: %', p_label;
  END IF;
  INSERT INTO pg_temp.payment_integration_results VALUES (p_label, true);
END;
$$;

DO $$
DECLARE
  owner_id uuid;
  fixture_job uuid := gen_random_uuid();
  deleted_job uuid := gen_random_uuid();
  agent_job uuid := gen_random_uuid();
  first_order text := 'integration-no-charge-' || gen_random_uuid()::text;
  upgrade_order text := 'integration-no-charge-' || gen_random_uuid()::text;
  delete_order text := 'integration-no-charge-' || gen_random_uuid()::text;
  agent_first text := 'integration-no-charge-' || gen_random_uuid()::text;
  agent_second text := 'integration-no-charge-' || gen_random_uuid()::text;
  first_key text := 'integration-no-charge-' || gen_random_uuid()::text;
  upgrade_key text := 'integration-no-charge-' || gen_random_uuid()::text;
  delete_key text := 'integration-no-charge-' || gen_random_uuid()::text;
  agent_first_key text := 'integration-no-charge-' || gen_random_uuid()::text;
  agent_second_key text := 'integration-no-charge-' || gen_random_uuid()::text;
  approved timestamptz := now();
  approval_text text;
  first_provider jsonb;
  upgrade_provider jsonb;
  delete_provider jsonb;
  agent_provider jsonb;
  patch jsonb;
  result jsonb;
  before_start timestamptz;
  before_end timestamptz;
  denied boolean;
BEGIN
  -- No INSERT/UPDATE/DELETE against existing users or auth.users.
  SELECT id INTO owner_id FROM public.users ORDER BY id LIMIT 1;
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Integration requires an existing public.users FK owner; no user was created';
  END IF;
  approval_text := to_char(approved AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"');

  INSERT INTO public.jobs (id, user_id, title, category, type, tier, position,
    salary_type, company, region, deadline, is_active, is_approved)
  VALUES
    (fixture_job, owner_id, '[ROLLBACK ONLY] Payment integration', 'sales', 'apartment',
      'normal', 'member', 'commission', '[ROLLBACK ONLY]', '서울', current_date, false, false),
    (deleted_job, owner_id, '[ROLLBACK ONLY] Deleted job integration', 'sales', 'apartment',
      'normal', 'member', 'commission', '[ROLLBACK ONLY]', '서울', current_date, false, false),
    (agent_job, owner_id, '[ROLLBACK ONLY] Agent extension integration', 'agent', 'apartment',
      'normal', 'member', 'commission', '[ROLLBACK ONLY]', '서울', current_date, false, false);

  INSERT INTO public.payment_orders (order_id, user_id, job_id, job_id_snapshot,
    job_title, product_key, product_name, tier, category, days, exposure_days,
    duration, amount, currency, idempotency_key)
  VALUES
    (first_order, owner_id, fixture_job, fixture_job, '[ROLLBACK ONLY] Payment integration',
      'sales-premium', 'Integration basic', 'premium', 'sales', 7, 14, '14일', 53900, 'KRW', gen_random_uuid()),
    (upgrade_order, owner_id, fixture_job, fixture_job, '[ROLLBACK ONLY] Payment integration',
      'sales-superior', 'Integration upgrade', 'superior', 'sales', 10, 10, '10일', 108900, 'KRW', gen_random_uuid()),
    (delete_order, owner_id, deleted_job, deleted_job, '[ROLLBACK ONLY] Deleted job integration',
      'sales-premium', 'Integration deletion', 'premium', 'sales', 7, 14, '14일', 53900, 'KRW', gen_random_uuid()),
    (agent_first, owner_id, agent_job, agent_job, '[ROLLBACK ONLY] Agent extension integration',
      'agent-basic', 'Integration agent first', 'basic', 'agent', 5, 5, '5일', 5390, 'KRW', gen_random_uuid()),
    (agent_second, owner_id, agent_job, agent_job, '[ROLLBACK ONLY] Agent extension integration',
      'agent-basic', 'Integration agent second', 'basic', 'agent', 5, 5, '5일', 5390, 'KRW', gen_random_uuid());

  first_provider := jsonb_build_object('paymentKey', first_key, 'orderId', first_order,
    'totalAmount', 53900, 'currency', 'KRW', 'status', 'DONE', 'approvedAt', approval_text,
    'method', 'CARD', 'balanceAmount', 53900, 'cancels', '[]'::jsonb);
  upgrade_provider := first_provider || jsonb_build_object('paymentKey', upgrade_key,
    'orderId', upgrade_order, 'totalAmount', 108900, 'balanceAmount', 108900);
  delete_provider := first_provider || jsonb_build_object('paymentKey', delete_key, 'orderId', delete_order);

  denied := false;
  BEGIN
    PERFORM public.apply_payment_order(first_order, first_key, first_provider);
  EXCEPTION WHEN raise_exception THEN denied := true;
  END;
  PERFORM pg_temp.payment_integration_assert('unclaimed order rejects payment application', denied);

  PERFORM public.claim_payment_order(first_order, first_key);
  PERFORM public.claim_payment_order(first_order, first_key);
  PERFORM pg_temp.payment_integration_assert('same claim is idempotent',
    (SELECT payment_key = first_key AND status = 'processing' FROM public.payment_orders WHERE order_id = first_order));
  denied := false;
  BEGIN
    PERFORM public.claim_payment_order(first_order, 'integration-no-charge-conflicting-key');
  EXCEPTION WHEN raise_exception THEN denied := true;
  END;
  PERFORM pg_temp.payment_integration_assert('same order rejects different payment key', denied);

  denied := false;
  BEGIN
    PERFORM public.claim_payment_order(upgrade_order, first_key);
  EXCEPTION WHEN unique_violation THEN denied := true;
  END;
  PERFORM pg_temp.payment_integration_assert('payment key cannot bind two orders', denied);

  FOR patch IN SELECT value FROM jsonb_array_elements(jsonb_build_array(
    jsonb_build_object('orderId', 'integration-no-charge-wrong-order'),
    jsonb_build_object('paymentKey', 'integration-no-charge-wrong-key'),
    jsonb_build_object('currency', 'USD'), jsonb_build_object('totalAmount', 1)))
  LOOP
    denied := false;
    BEGIN
      PERFORM public.apply_payment_order(first_order, first_key, first_provider || patch);
    EXCEPTION WHEN raise_exception THEN denied := true;
    END;
    IF NOT denied THEN RAISE EXCEPTION 'Payment provider identity guard failed'; END IF;
  END LOOP;
  PERFORM pg_temp.payment_integration_assert('provider identity currency and amount mismatch rejected',
    NOT EXISTS (SELECT 1 FROM public.payments WHERE order_id = first_order));

  result := public.apply_payment_order(first_order, first_key, first_provider);
  PERFORM pg_temp.payment_integration_assert('approval creates payment and advertisement atomically',
    result->>'payment_status' = 'completed'
    AND (SELECT tier = 'premium' AND ad_expires_at > approved AND NOT is_approved FROM public.jobs WHERE id = fixture_job));
  SELECT starts_at, expires_at INTO before_start, before_end FROM public.payments WHERE order_id = first_order;
  PERFORM public.apply_payment_order(first_order, first_key, first_provider);
  PERFORM pg_temp.payment_integration_assert('approval replay keeps one unchanged advertisement window',
    (SELECT count(*) = 1 AND min(starts_at) = before_start AND min(expires_at) = before_end
      FROM public.payments WHERE order_id = first_order));

  first_provider := first_provider || jsonb_build_object('status', 'PARTIAL_CANCELED', 'balanceAmount', 43900,
    'cancels', jsonb_build_array(jsonb_build_object('transactionKey', 'integration-no-charge-partial',
      'cancelAmount', 10000, 'canceledAt', approval_text)));
  PERFORM public.apply_payment_order(first_order, first_key, first_provider);
  PERFORM public.apply_payment_order(first_order, first_key, first_provider);
  PERFORM pg_temp.payment_integration_assert('partial refund persists balance history and completed entitlement',
    (SELECT payment_status = 'completed' AND provider_status = 'PARTIAL_CANCELED'
      AND balance_amount = 43900 AND jsonb_array_length(cancels) = 1 FROM public.payments WHERE order_id = first_order));

  PERFORM public.claim_payment_order(upgrade_order, upgrade_key);
  PERFORM public.apply_payment_order(upgrade_order, upgrade_key, upgrade_provider);
  PERFORM pg_temp.payment_integration_assert('upgrade starts immediately above remaining lower window',
    (SELECT tier = 'superior' FROM public.jobs WHERE id = fixture_job)
    AND (SELECT starts_at = approved FROM public.payments WHERE order_id = upgrade_order));
  upgrade_provider := upgrade_provider || jsonb_build_object('status', 'CANCELED', 'balanceAmount', 0,
    'cancels', jsonb_build_array(jsonb_build_object('transactionKey', 'integration-no-charge-full',
      'cancelAmount', 108900, 'canceledAt', approval_text)));
  PERFORM public.apply_payment_order(upgrade_order, upgrade_key, upgrade_provider);
  PERFORM pg_temp.payment_integration_assert('full refund removes only refunded window',
    (SELECT payment_status = 'refunded' AND balance_amount = 0 FROM public.payments WHERE order_id = upgrade_order)
    AND (SELECT tier = 'premium' FROM public.jobs WHERE id = fixture_job));
  denied := false;
  BEGIN
    PERFORM public.apply_payment_order(upgrade_order, upgrade_key,
      upgrade_provider || jsonb_build_object('status', 'DONE', 'balanceAmount', 108900));
  EXCEPTION WHEN raise_exception THEN denied := true;
  END;
  PERFORM pg_temp.payment_integration_assert('refunded order cannot be resurrected', denied);

  -- Touch ONLY our synthetic job, then verify server projection restores the
  -- actual remaining paid window without changing activity/approval/deadline.
  UPDATE public.jobs SET tier = 'normal', ad_expires_at = NULL,
    is_active = false, deadline = current_date WHERE id = fixture_job;
  result := public.recompute_payment_job_ad(fixture_job, approved);
  PERFORM pg_temp.payment_integration_assert('locked projection restores latest remaining payment only',
    result->>'tier' = 'premium'
    AND (SELECT tier = 'premium' AND NOT is_active AND NOT is_approved AND deadline = current_date
      FROM public.jobs WHERE id = fixture_job));

  PERFORM public.claim_payment_order(delete_order, delete_key);
  PERFORM public.apply_payment_order(delete_order, delete_key, delete_provider);
  DELETE FROM public.jobs WHERE id = deleted_job;
  PERFORM pg_temp.payment_integration_assert('deleted job keeps payment and order snapshots',
    (SELECT job_id IS NULL AND job_id_snapshot = deleted_job AND job_title = '[ROLLBACK ONLY] Deleted job integration'
      FROM public.payments WHERE order_id = delete_order)
    AND (SELECT job_id IS NULL AND job_id_snapshot = deleted_job
      FROM public.payment_orders WHERE order_id = delete_order));
  PERFORM pg_temp.payment_integration_assert('deleted job projection returns null',
    public.recompute_payment_job_ad(deleted_job, approved) IS NULL);

  agent_provider := first_provider || jsonb_build_object('paymentKey', agent_first_key,
    'orderId', agent_first, 'totalAmount', 5390, 'balanceAmount', 5390, 'status', 'DONE', 'cancels', '[]'::jsonb);
  PERFORM public.claim_payment_order(agent_first, agent_first_key);
  PERFORM public.apply_payment_order(agent_first, agent_first_key, agent_provider);
  PERFORM public.claim_payment_order(agent_second, agent_second_key);
  PERFORM public.apply_payment_order(agent_second, agent_second_key,
    agent_provider || jsonb_build_object('paymentKey', agent_second_key, 'orderId', agent_second));
  PERFORM pg_temp.payment_integration_assert('legacy expiry trigger preserves second agent five-day extension',
    (SELECT starts_at = approved AND expires_at = approved + interval '120 hours'
      FROM public.payments WHERE order_id = agent_first)
    AND (SELECT starts_at = approved + interval '120 hours' AND expires_at = approved + interval '240 hours'
      FROM public.payments WHERE order_id = agent_second));
END;
$$;

-- Results contain assertion labels and booleans only; no customer/provider data.
SELECT label, passed FROM pg_temp.payment_integration_results ORDER BY label;
SELECT count(*) AS passed_checks, bool_and(passed) AS all_passed,
  'Synthetic rows are uncommitted; final ROLLBACK follows' AS transaction_note
FROM pg_temp.payment_integration_results;
ROLLBACK;
-- SQL Editor displays the last result set. Reaching here means every assertion
-- above succeeded and the entire synthetic fixture transaction was rolled back.
SELECT 15 AS passed_checks, true AS all_passed,
  'All synthetic rows rolled back; no provider call'::text AS transaction_note;
