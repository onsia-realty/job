import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { bridge, allowedContext, parseProvider, runProcess } from './claude-design-bridge.mjs';

const success = { code: 0, stdout: JSON.stringify({ is_error: false, subtype: 'success', result: '디자인 제안: 여백을 개선하세요.' }) };
async function fixture(t) {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'booin-relay-test-'));
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  const root = path.join(base, 'project');
  const vault = path.join(base, 'vault');
  const taskDir = path.join(vault, 'AI-Sessions/wiki/dev-tasks/booin-collaboration');
  for (const directory of [path.join(root, 'scripts'), path.join(vault, '.obsidian'), path.join(vault, 'AI-Sessions/wiki/projects'), taskDir]) await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(vault, 'AGENTS.md'), 'Fixture vault');
  await fs.writeFile(path.join(vault, 'AI-Sessions/wiki/projects/booin-codex-claude-collaboration.md'), 'Claude designs; Codex verifies.');
  const config = { projectPath: root, vaultPath: vault, claudePath: process.execPath, timeoutMs: 1000 };
  await fs.writeFile(path.join(root, 'scripts/claude-design-bridge.config.json'), JSON.stringify(config));
  const task = path.join(taskDir, 'design-review.md');
  await fs.writeFile(task, '모바일 디자인을 제안해 주세요.');
  return { root, vault, task, config, base };
}

test('default-deny context paths and sensitive app routes', () => {
  for (const filename of ['.env.local', '../CLAUDE.md', 'src/app/api/x.tsx', 'src/app/checkout/page.tsx', 'src/app/payment/success/page.tsx', 'src/app/auth/page.tsx', 'src/app/(auth)/page.tsx', 'src/components/PaymentForm.tsx', 'src/components/secret-config.tsx', 'supabase/backups/x.tsx', 'src/components/../keys/x.tsx', 'src/components/.private/x.tsx', 'C:/private.tsx']) assert.equal(allowedContext(filename), false, filename);
  for (const filename of ['CLAUDE.md', 'docs/COLLABORATION.md', 'src/components/shared/Card.tsx', 'src/app/agent/page.tsx', 'src/app/globals.css']) assert.equal(allowedContext(filename), true, filename);
});

test('provider output rejects malformed, failed, empty and nonzero responses', () => {
  for (const response of [{ code: 1, stdout: success.stdout }, { code: 0, stdout: 'private diagnostic not JSON' }, { code: 0, stdout: JSON.stringify({ subtype: 'error', is_error: true, result: 'bad' }) }, { code: 0, stdout: JSON.stringify({ subtype: 'success', is_error: false, result: '' }) }]) assert.throws(() => parseProvider(response));
  assert.equal(parseProvider(success), '디자인 제안: 여백을 개선하세요.');
});

test('success packages only explicit context and writes unique Korean handoff reports', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.root, 'PROGRESS.md'), 'Explicit context marker');
  let calls = 0;
  const runner = async (_exe, args, options) => {
    calls++;
    assert.equal(args.includes('--dangerously-skip-permissions'), false);
    assert.equal(args[args.indexOf('--tools') + 1], '');
    assert.equal(args[args.indexOf('--permission-mode') + 1], 'dontAsk');
    assert.match(options.input, /Explicit context marker/);
    assert.match(options.input, /모바일 디자인/);
    assert.equal(options.cwd, os.tmpdir());
    return success;
  };
  const a = await bridge(['run', '--task', f.task, '--context', 'PROGRESS.md'], { root: f.root, runner });
  const b = await bridge(['run', '--task', f.task, '--context', 'PROGRESS.md'], { root: f.root, runner });
  assert.equal(calls, 2);
  assert.equal(a.ok, true);
  assert.notEqual(a.reportPath, b.reportPath);
  const report = await fs.readFile(a.reportPath, 'utf8');
  assert.match(report, /Status: success/);
  assert.match(report, /디자인 제안: 여백을 개선하세요/);
  assert.doesNotMatch(report, /Explicit context marker/);
});

test('provider timeout and malformed output save failure, never success', async (t) => {
  const f = await fixture(t);
  for (const runner of [async () => { throw Object.assign(new Error('SECRET PRIVATE STDERR'), { safeCode: 'TIMEOUT' }); }, async () => ({ code: 0, stdout: 'private invalid json' })]) {
    const result = await bridge(['run', '--task', f.task], { root: f.root, runner });
    assert.equal(result.ok, false);
    const report = await fs.readFile(result.reportPath, 'utf8');
    assert.match(report, /Status: failed/);
    assert.doesNotMatch(report, /SECRET|private invalid/);
  }
});

test('rejects task traversal and forbidden context without invoking provider', async (t) => {
  const f = await fixture(t);
  const runner = () => assert.fail('must not invoke provider');
  await assert.rejects(bridge(['run', '--task', path.join(f.base, 'outside.md')], { root: f.root, runner }), /TASK_OUTSIDE/);
  await assert.rejects(bridge(['run', '--task', f.task, '--context', '.env.local'], { root: f.root, runner }), /CONTEXT_FORBIDDEN/);
});

test('rejects symlink escape in optional context', async (t) => {
  const f = await fixture(t);
  const outside = path.join(f.base, 'outside');
  await fs.mkdir(outside);
  await fs.writeFile(path.join(outside, 'Card.tsx'), 'private');
  await fs.mkdir(path.join(f.root, 'src'));
  await fs.symlink(outside, path.join(f.root, 'src/components'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(bridge(['run', '--task', f.task, '--context', 'src/components/Card.tsx'], { root: f.root, runner: () => assert.fail('provider') }), /PATH_OUTSIDE/);
});

test('active lock is not deleted or replaced', async (t) => {
  const f = await fixture(t);
  const dir = path.join(f.vault, 'AI-Sessions/conversations/booin-collaboration');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, '.relay.lock'), 'other run');
  await assert.rejects(bridge(['run', '--task', f.task], { root: f.root, runner: () => assert.fail('provider') }), /RUN_ALREADY_ACTIVE/);
  assert.equal(await fs.readFile(path.join(dir, '.relay.lock'), 'utf8'), 'other run');
});

test('rejects symlink escape in task folder and oversized context', async (t) => {
  const f = await fixture(t);
  const outside = path.join(f.base, 'outside-tasks');
  await fs.mkdir(outside);
  await fs.writeFile(path.join(outside, 'design.md'), 'private task');
  const link = path.join(path.dirname(f.task), 'linked');
  await fs.symlink(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(bridge(['run', '--task', path.join(link, 'design.md')], { root: f.root, runner: () => assert.fail('provider') }), /PATH_OUTSIDE/);
  await fs.writeFile(path.join(f.root, 'PROGRESS.md'), 'x'.repeat(48 * 1024 + 1));
  await assert.rejects(bridge(['run', '--task', f.task, '--context', 'PROGRESS.md'], { root: f.root, runner: () => assert.fail('provider') }), /FILE_SIZE/);
});

test('config cannot expand timeout or use another project', async (t) => {
  const f = await fixture(t);
  const configFile = path.join(f.root, 'scripts/claude-design-bridge.config.json');
  await fs.writeFile(configFile, JSON.stringify({ ...f.config, timeoutMs: 180001 }));
  await assert.rejects(bridge(['check'], { root: f.root }), /CONFIG_INVALID/);
  await fs.writeFile(configFile, JSON.stringify({ ...f.config, projectPath: f.base }));
  await assert.rejects(bridge(['check'], { root: f.root }), /PROJECT_CONFIG_MISMATCH/);
});

test('check sanitizes auth output without invoking a model', async (t) => {
  const f = await fixture(t);
  const result = await bridge(['check'], { root: f.root, runner: async (_exe, args) => ({ code: 0, stdout: args[0] === '--version' ? '2.1.289 (Claude Code)' : JSON.stringify({ loggedIn: true, email: 'secret@example.com', orgId: 'private' }) }) });
  assert.equal(result.ok, true);
  assert.equal(result.version, '2.1.289');
  assert.doesNotMatch(JSON.stringify(result), /secret@example|orgId|private/);
});

test('process runner kills bounded child on timeout', async () => {
  await assert.rejects(runProcess(process.execPath, ['-e', 'setTimeout(()=>{},10000)'], { timeoutMs: 30, cwd: os.tmpdir() }), /TIMEOUT/);
});

test('process runner preserves Korean and strips provider secret environment', async () => {
  process.env.BOOIN_RELAY_TEST_SECRET = 'do-not-forward';
  try {
    const response = await runProcess(process.execPath, ['-e', 'process.stdout.write(JSON.stringify({text:"한글 디자인",secret:process.env.BOOIN_RELAY_TEST_SECRET??null}))'], { timeoutMs: 1000, cwd: os.tmpdir() });
    assert.deepEqual(JSON.parse(response.stdout), { text: '한글 디자인', secret: null });
  } finally { delete process.env.BOOIN_RELAY_TEST_SECRET; }
});
