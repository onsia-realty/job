// Isolated PostgreSQL verification; never connects to the application's database.
// Usage: node scripts/test-payment-order-ledger.mjs <directory containing node_modules/@electric-sql/pglite>
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const modulePath = process.argv[2]
  ? pathToFileURL(resolve(process.argv[2], 'node_modules/@electric-sql/pglite/dist/index.js')).href
  : '@electric-sql/pglite';
const { PGlite } = await import(modulePath);
const db = new PGlite();
let checks = 0;
const userId = randomUUID();
const jobId = randomUUID();
const now = new Date();
const paidAt = now.toISOString();
const oneDay = 86400000;

async function row(sql, params = []) {
  return (await db.query(sql, params)).rows[0];
}
async function check(name, fn) {
  await fn();
  checks++;
  process.stdout.write(`PASS ${name}\n`);
}
async function order(overrides = {}) {
  const id = randomUUID();
  const values = {
    job_id: jobId, job_id_snapshot: jobId, product_key: 'sales-premium', product_name: '베이직',
    tier: 'premium', category: 'sales', days: 7, exposure_days: 14, duration: '14일',
    amount: 53900, ...overrides,
  };
  await db.query(`INSERT INTO payment_orders
    (order_id, user_id, job_id, job_id_snapshot, job_title, product_key, product_name,
     tier, category, days, exposure_days, duration, amount, currency, idempotency_key)
    VALUES ($1,$2,$3,$4,'Test job',$5,$6,$7,$8,$9,$10,$11,$12,'KRW',$13)`,
  [id, userId, values.job_id, values.job_id_snapshot, values.product_key, values.product_name,
    values.tier, values.category, values.days, values.exposure_days, values.duration, values.amount, randomUUID()]);
  return { orderId: id, key: `test-${randomUUID()}`, ...values };
}
function provider(o, overrides = {}) {
  return {
    paymentKey: o.key, orderId: o.orderId, totalAmount: o.amount, currency: 'KRW',
    status: 'DONE', approvedAt: paidAt, method: 'CARD', balanceAmount: o.amount, cancels: [],
    ...overrides,
  };
}
async function claim(o, key = o.key) {
  return row('SELECT claim_payment_order($1,$2) AS result', [o.orderId, key]);
}
async function apply(o, event = provider(o)) {
  return row('SELECT apply_payment_order($1,$2,$3::jsonb) AS result', [o.orderId, o.key, JSON.stringify(event)]);
}

try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_user::text $$;
    CREATE TABLE public.users (id uuid PRIMARY KEY);
    CREATE TABLE public.jobs (
      id uuid PRIMARY KEY, user_id uuid REFERENCES users(id), title text,
      category text, tier text NOT NULL DEFAULT 'normal', ad_expires_at timestamptz,
      deadline date, is_active boolean DEFAULT true, is_approved boolean DEFAULT false,
      updated_at timestamptz DEFAULT now()
    );
    CREATE TABLE public.payments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      job_id uuid REFERENCES jobs(id) ON DELETE CASCADE, tier varchar(20) NOT NULL,
      amount integer NOT NULL, payment_method varchar(50),
      payment_status varchar(20) DEFAULT 'pending'
        CHECK (payment_status IN ('pending','completed','failed','refunded')),
      start_date date, end_date date, created_at timestamptz DEFAULT now(),
      payment_id text UNIQUE, product_key text, product_name text, currency text DEFAULT 'KRW',
      category text, duration text, pg_provider text, paid_at timestamptz DEFAULT now(),
      starts_at timestamptz, expires_at timestamptz, updated_at timestamptz DEFAULT now()
    );
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
  `);
  await db.query('INSERT INTO users(id) VALUES ($1)', [userId]);
  await db.query("INSERT INTO jobs(id,user_id,title,category,deadline) VALUES ($1,$2,'Test job','sales',CURRENT_DATE)", [jobId, userId]);
  const migration = await readFile(new URL('../supabase/migrations/047_payment_order_ledger.sql', import.meta.url), 'utf8');
  await check('migration executes', () => db.exec(migration));
  await check('migration can be reapplied', () => db.exec(migration));

  await check('legacy snapshots backfill once and survive later job edits', async () => {
    await db.query(`INSERT INTO payments(payment_id,user_id,job_id,tier,amount,payment_status)
      VALUES ('legacy',$1,$2,'normal',100,'failed')`, [userId, jobId]);
    await db.exec(migration);
    await db.query("UPDATE jobs SET title='Changed title' WHERE id=$1", [jobId]);
    await db.exec(migration);
    const p = await row("SELECT job_title,job_id_snapshot FROM payments WHERE payment_id='legacy'");
    assert.equal(p.job_title, 'Test job');
    assert.equal(p.job_id_snapshot, jobId);
  });

  const first = await order();
  await check('unclaimed payment cannot grant an advertisement', async () => {
    await assert.rejects(() => apply(first));
  });
  await check('payment key is bound once', async () => {
    await claim(first);
    await claim(first);
    await assert.rejects(() => claim(first, 'different-key'));
  });
  await check('provider identity and amount must match', async () => {
    for (const patch of [{ orderId: 'wrong' }, { paymentKey: 'wrong' }, { totalAmount: 1 }, { currency: 'USD' }]) {
      await assert.rejects(() => apply(first, provider(first, patch)));
    }
    assert.equal((await row('SELECT count(*)::int AS n FROM payments WHERE order_id IS NOT NULL')).n, 0);
  });
  await check('approval creates payment and advertisement together', async () => {
    await apply(first);
    const p = await row('SELECT * FROM payments WHERE order_id=$1', [first.orderId]);
    assert.equal(p.payment_status, 'completed');
    assert.equal(p.amount, 53900);
    assert.equal(Date.parse(p.expires_at) - Date.parse(p.starts_at), 14 * oneDay);
    assert.equal((await row('SELECT tier FROM jobs WHERE id=$1', [jobId])).tier, 'premium');
  });
  await check('approval replay does not extend or duplicate', async () => {
    const before = await row('SELECT starts_at,expires_at FROM payments WHERE order_id=$1', [first.orderId]);
    await apply(first);
    assert.deepEqual(await row('SELECT starts_at,expires_at FROM payments WHERE order_id=$1', [first.orderId]), before);
    assert.equal((await row('SELECT count(*)::int AS n FROM payments WHERE order_id=$1', [first.orderId])).n, 1);
  });
  const second = await order();
  await claim(second);
  await check('second same-tier purchase follows first window', async () => {
    await apply(second);
    const a = await row('SELECT expires_at FROM payments WHERE order_id=$1', [first.orderId]);
    const b = await row('SELECT starts_at,expires_at FROM payments WHERE order_id=$1', [second.orderId]);
    assert.equal(Date.parse(b.starts_at), Date.parse(a.expires_at));
    assert.equal(Date.parse(b.expires_at) - Date.parse(b.starts_at), 14 * oneDay);
  });
  await check('partial cancellation persists without removing entitlement', async () => {
    const event = provider(first, { status: 'PARTIAL_CANCELED', balanceAmount: 43900,
      cancels: [{ transactionKey: 'cancel-1', cancelAmount: 10000, canceledAt: paidAt }] });
    await apply(first, event);
    await apply(first, event);
    const p = await row('SELECT payment_status,balance_amount,cancels FROM payments WHERE order_id=$1', [first.orderId]);
    assert.equal(p.payment_status, 'completed');
    assert.equal(p.balance_amount, 43900);
    assert.equal(p.cancels.length, 1);
  });
  await check('full cancellation preserves other paid windows', async () => {
    // Refund the queued second window; the first is still currently active.
    await apply(second, provider(second, { status: 'CANCELED', balanceAmount: 0,
      cancels: [{ transactionKey: 'cancel-2', cancelAmount: 53900, canceledAt: paidAt }] }));
    assert.equal((await row('SELECT payment_status FROM payments WHERE order_id=$1', [second.orderId])).payment_status, 'refunded');
    assert.equal((await row('SELECT tier FROM jobs WHERE id=$1', [jobId])).tier, 'premium');
  });
  await check('unknown provider state is not silently accepted', async () => {
    await assert.rejects(() => apply(first, provider(first, { status: 'UNRECOGNIZED' })));
  });
  await check('refunded orders cannot be resurrected by an old approval', async () => {
    await assert.rejects(() => apply(second));
    assert.equal((await row('SELECT payment_status FROM payments WHERE order_id=$1', [second.orderId])).payment_status, 'refunded');
  });
  await check('a payment key cannot be claimed by a second order', async () => {
    const other = await order();
    await assert.rejects(() => claim(other, first.key));
  });
  await check('job update failure rolls back the whole payment and retry recovers', async () => {
    const upgrade = await order({ product_key: 'sales-superior', product_name: '슈페리어',
      tier: 'superior', days: 10, exposure_days: 10, duration: '10일', amount: 108900 });
    await claim(upgrade);
    await db.exec(`CREATE FUNCTION test_reject_job_update() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'injected job failure'; END $$;
      CREATE TRIGGER test_job_failure BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION test_reject_job_update();`);
    await assert.rejects(() => apply(upgrade));
    assert.equal((await row('SELECT count(*)::int AS n FROM payments WHERE order_id=$1', [upgrade.orderId])).n, 0);
    assert.equal((await row('SELECT status FROM payment_orders WHERE order_id=$1', [upgrade.orderId])).status, 'processing');
    await db.exec('DROP TRIGGER test_job_failure ON jobs; DROP FUNCTION test_reject_job_update();');
    await apply(upgrade);
    assert.equal((await row('SELECT count(*)::int AS n FROM payments WHERE order_id=$1', [upgrade.orderId])).n, 1);
    assert.equal((await row('SELECT tier FROM jobs WHERE id=$1', [jobId])).tier, 'superior');
    const p = await row('SELECT starts_at FROM payments WHERE order_id=$1', [upgrade.orderId]);
    assert.equal(new Date(p.starts_at).getTime(), Date.parse(paidAt));
  });
  await check('approval replay preserves a deliberately hidden job', async () => {
    await db.query('UPDATE jobs SET is_active=false WHERE id=$1', [jobId]);
    await apply(first, provider(first, { status: 'PARTIAL_CANCELED', balanceAmount: 43900,
      cancels: [{ transactionKey: 'cancel-1', cancelAmount: 10000, canceledAt: paidAt }] }));
    assert.equal((await row('SELECT is_active FROM jobs WHERE id=$1', [jobId])).is_active, false);
  });
  await check('unapproved failed attempts never create a paid window', async () => {
    const failed = await order();
    await claim(failed);
    await apply(failed, provider(failed, { status: 'ABORTED', approvedAt: null }));
    assert.equal((await row('SELECT status FROM payment_orders WHERE order_id=$1', [failed.orderId])).status, 'failed');
    assert.equal((await row('SELECT count(*)::int AS n FROM payments WHERE order_id=$1', [failed.orderId])).n, 0);
  });
  await check('standalone prepayment remains recorded without a job', async () => {
    const standalone = await order({ job_id: null, job_id_snapshot: null });
    await claim(standalone);
    await apply(standalone);
    const p = await row('SELECT payment_status,job_id FROM payments WHERE order_id=$1', [standalone.orderId]);
    assert.equal(p.payment_status, 'completed');
    assert.equal(p.job_id, null);
  });
  await check('first recovery after partial cancellation activates the paid job', async () => {
    const recovered = await order({ product_key: 'sales-unique', product_name: '유니크',
      tier: 'unique', days: 10, exposure_days: 10, duration: '10일', amount: 273900 });
    await claim(recovered);
    await db.query('UPDATE jobs SET is_active=false,deadline=CURRENT_DATE WHERE id=$1', [jobId]);
    await apply(recovered, provider(recovered, { status: 'PARTIAL_CANCELED', balanceAmount: 263900,
      cancels: [{ transactionKey: 'cancel-recovery', cancelAmount: 10000, canceledAt: paidAt }] }));
    const job = await row('SELECT tier,is_active,deadline FROM jobs WHERE id=$1', [jobId]);
    assert.equal(job.is_active, true);
    assert.equal(job.tier, 'unique');
    assert.ok(new Date(job.deadline).getTime() > now.getTime());
  });
  await check('public roles cannot mutate orders or execute privileged RPCs', async () => {
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`SET ROLE ${role}`);
      try {
        await assert.rejects(() => db.query('DELETE FROM payment_orders'));
        await assert.rejects(() => claim(first));
        await assert.rejects(() => apply(first));
      } finally { await db.exec('RESET ROLE'); }
    }
  });
  await check('deleting job keeps payments and immutable snapshots', async () => {
    await db.query('DELETE FROM jobs WHERE id=$1', [jobId]);
    const p = await row('SELECT job_id,job_id_snapshot,job_title FROM payments WHERE order_id=$1', [first.orderId]);
    assert.equal(p.job_id, null);
    assert.equal(p.job_id_snapshot, jobId);
    assert.equal(p.job_title, 'Test job');
    const o = await row('SELECT job_id,job_id_snapshot FROM payment_orders WHERE order_id=$1', [first.orderId]);
    assert.equal(o.job_id, null);
    assert.equal(o.job_id_snapshot, jobId);
  });
  await db.exec(`CREATE TABLE refresh_fixture(id integer PRIMARY KEY, amount integer NOT NULL);
    INSERT INTO refresh_fixture VALUES (1,10);
    CREATE MATERIALIZED VIEW public.complex_aggregates AS SELECT * FROM refresh_fixture;
    CREATE UNIQUE INDEX fixture_trade_idx ON public.complex_aggregates(id);
    CREATE MATERIALIZED VIEW public.complex_rent_aggregates AS SELECT * FROM refresh_fixture;
    CREATE UNIQUE INDEX fixture_rent_idx ON public.complex_rent_aggregates(id);`);
  const refreshMigration = await readFile(new URL('../supabase/migrations/048_refresh_aggregates_permissions.sql', import.meta.url), 'utf8');
  await check('refresh migration executes and can be reapplied', async () => {
    await db.exec(refreshMigration);
    await db.exec(refreshMigration);
    const config = await row("SELECT proconfig FROM pg_proc WHERE oid='public.refresh_market_aggregates()'::regprocedure");
    assert.ok(config.proconfig.includes('statement_timeout=60s'));
  });
  await check('service role refreshes both owner-held materialized views', async () => {
    await db.exec('UPDATE refresh_fixture SET amount=25; SET ROLE service_role;');
    try { await db.query('SELECT public.refresh_market_aggregates()'); }
    finally { await db.exec('RESET ROLE'); }
    assert.equal((await row('SELECT amount FROM public.complex_aggregates')).amount, 25);
    assert.equal((await row('SELECT amount FROM public.complex_rent_aggregates')).amount, 25);
  });
  await check('public roles cannot invoke the refresh function', async () => {
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`SET ROLE ${role}`);
      try { await assert.rejects(() => db.query('SELECT public.refresh_market_aggregates()')); }
      finally { await db.exec('RESET ROLE'); }
    }
  });
  await check('locked projection always reads the latest refund state', async () => {
    const legacyJob = randomUUID();
    await db.query("INSERT INTO jobs(id,user_id,title,category) VALUES ($1,$2,'Legacy race','agent')", [legacyJob, userId]);
    await db.query(`INSERT INTO payments(payment_id,user_id,job_id,tier,amount,payment_status,starts_at,expires_at)
      VALUES ('legacy-race',$1,$2,'basic',5390,'completed',$3,$4)`,
    [userId, legacyJob, paidAt, new Date(now.getTime() + 5 * oneDay).toISOString()]);
    const project = () => db.query('SELECT public.recompute_payment_job_ad($1,$2)', [legacyJob, paidAt]);
    await project();
    assert.equal((await row('SELECT tier FROM jobs WHERE id=$1', [legacyJob])).tier, 'basic');
    await db.query("UPDATE payments SET payment_status='refunded' WHERE payment_id='legacy-race'");
    await project();
    await project(); // A delayed older handler has no stale windows to write back.
    assert.equal((await row('SELECT tier FROM jobs WHERE id=$1', [legacyJob])).tier, 'normal');
  });
  await check('public roles cannot invoke locked projection', async () => {
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`SET ROLE ${role}`);
      try {
        await assert.rejects(() => db.query('SELECT public.recompute_payment_job_ad($1,$2)', [jobId, paidAt]));
      } finally { await db.exec('RESET ROLE'); }
    }
  });
  process.stdout.write(`${checks} PostgreSQL checks passed (isolated PGlite; no production access).\n`);
} catch (error) {
  console.error(`PostgreSQL check failed: ${error.message}`);
  if (error.detail) console.error(error.detail);
  if (error.where) console.error(error.where);
  process.exitCode = 1;
} finally {
  await db.close();
}
