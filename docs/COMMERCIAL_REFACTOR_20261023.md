

## Phase 2 — Danal signup correctness (2026-10-23)

### Why signup works before Danal activation
Supabase Auth signup and application profile completion are different operations. `signUpWithEmail` calls Supabase directly; Danal contract/payment activation is not queried there. The signup screen only conditionally requires Danal with `NEXT_PUBLIC_DANAL_REQUIRED === 'true'`. This pass did not read credentials or the configured flag value, enable the flag, change signup availability, or contact any provider.

### Local changes
- New-profile `ensure-user` rejects supplied invalid/malformed/empty Danal tokens (400) before any user write instead of silently creating an unverified profile. Existing profiles do not reconsume historical signup metadata tokens; their identity comes from protected DB fields.
- `complete-profile` enforces required mode on the server. Without a new token it requires an existing `realname_verified=true`, nonempty DI and verified_at; editable user_metadata is not evidence. Optional no-token completion remains valid. Explicit invalid replacement tokens fail even for verified profiles. Reusing existing verification preserves the stored phone rather than replacing it with an unverified request phone.
- Both routes fail closed on profile lookup errors. Identity fields are not returned to the browser.
- A new social account no longer receives a placeholder users row from ensure-user. Repeated AuthContext SIGNED_IN/callback/GIS calls return `needsProfileCompletion: true`; complete-profile creates the row after validation. Callback and GIS use explicit completion/identity states and preserve safe internal STAY redirects.
- Existing profiles report `needsProfileCompletion: null` (unknown), not a claim of completed signup; `needsIdentityVerification` is derived separately from server profile and required mode. Concurrent email insert conflict reloads server state.

### Exact unresolved completion gap
The schema has no protected completion timestamp/version recording validated required fields and accepted terms. Existing users rows may originate from automatic ensure-user creation or an actual completed form. Neither row existence, nickname/phone presence, nor user_metadata.profile_completed distinguishes them reliably. This change prevents new social placeholders but cannot repair legacy rows or provide universal signup authorization. Existing unknown rows retain login compatibility; email/password login and AuthContext are not universal onboarding gates. Signup UI still asks for a fresh token in required mode even if the API could accept an existing verified identity. Follow-up needs a protected completion field, explicit legacy backfill/reverification policy, and consistent server authorization at protected feature boundaries. Do not infer completion from editable metadata.

### Production readiness blockers (not executed)
1. Raw Supabase signup remains available independently of this API. An Auth account/session is not proof of application signup completion or identity. Decide which actions require each state and enforce on the server, including email signup/login paths and immediate-session success UI.
2. Trust in users identity fields requires migration 039's server-only writes plus a live audit of all grants, column grants, RLS, security-definer functions, triggers and other service-role endpoints. Migration 034 alone does not revoke historical users UPDATE access. No live DB audit or migration was performed here. Existing identity data provenance must be reviewed before relying on it.
3. `getConfirmedVerificationByToken` still checks status only; confirmed_at age is not checked. Expiry duration and pre-auth/email-confirmation behavior need an explicit policy, not an invented timeout. Current write and consumption are separate operations, and consumption errors are ignored by the existing helper. DI uniqueness is not transaction binding or reliable single consumption. Design a service-role-only transactional operation that locks the verification, checks status/expiry and intended user or pre-signup binding, writes identity and marks consumption together; define replay/idempotency and rollback behavior. Concurrent completion and stale metadata require tests against that transaction.
4. Legacy users need a migration policy distinguishing verified identity, unknown completion, and accounts requiring re-verification; avoid locking all existing logins before activation.
5. Actual Danal contract, merchant activation, callback domain and credential readiness are unverified. A flag alone does not activate the contract. No flags, environment, settings, DB, accounts, payments, commits or deployment were changed.
6. Run actual authorized test-mode E2E later: email confirmation (including expired token), GIS/OAuth, cancel/failure, duplicate DI, stale/replayed tokens, concurrent calls, optional/required modes, existing verified profile and STAY round trips. Mock tests are not provider certification.

### Validation actually run
- Added mocked negative route tests for required missing token, forged metadata, invalid supplied tokens, optional no-token creation/completion, existing verified identity, valid confirmed token, repeated social ensure, and lookup failure; extended callback/GIS internal STAY redirect tests.
- Attempted `node node_modules/vitest/vitest.mjs run --config vitest.commercial.local.ts src/__tests__/auth-signup-correctness.test.ts src/__tests__/agent-login-stay-redirect.test.tsx src/__tests__/agent-auth-callback-stay-redirect.test.tsx`. Config disables env-file loading. Sandbox denied child-process spawning (`spawn EPERM`) during Vite config loading: no tests ran, no pass claim. No permission escalation or workaround.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: first run found a nullable profile access; corrected it; second run passed (exit 0).
- ESLint on the two API routes, new state helper, new route tests and two redirect test files passed (exit 0). `git diff --check` passed.
- Read local project instructions/current diffs; RULES.md and fable/active.md imports are absent in the bound workspace. Did not search outside it or import private conversations. Previous homepage/premium changes preserved. No network, external service, credentials, agents or redispatch used.

## Phase 2 independent-review corrections (2026-10-23)

This follow-up supersedes the earlier email-login limitation only for the application-profile checks below. Prior changes remain in place.

- Both authenticated profile routes use trimmed server verification.name and normalized verification.phone for fresh proof; missing/blank name or missing/invalid phone rejects the proof before profile writes or token consumption. Request/metadata name and phone cannot replace those values. Nickname remains editable.
- Without fresh proof, complete-profile retains the verified profile's stored name and phone, and writes those same values to Auth metadata. Existing ensure-user (including insert-conflict reload) synchronizes Auth name/phone from the protected profile without consuming historical metadata tokens. Responses expose state, not identity fields. Metadata write errors now return failure rather than success; profile and Auth writes remain separate, not atomic.
- Required-mode new EMAIL users without proof receive needsProfileCompletion=true and needsIdentityVerification=true without a users insert, including repeated calls and forged completion metadata. Optional-mode creation and existing-profile unknown-completion semantics remain compatible.
- Email/password login now checks ensure-user before redirecting. Either required state opens the existing authenticated completion form (social=true selects that session-based form for email users too). Valid internal STAY paths/fragments survive; unsafe destinations do not. Server errors prevent a success redirect. No blanket SIGNED_IN redirect was added.
- Focused mocked regressions cover forged name/phone versus proof in both routes, incomplete proof, preserving existing name/phone and Auth metadata with editable nickname, repeated required EMAIL gating, email completion/identity state, STAY preservation/rejection, server failure and existing normal-login fallbacks.

Verification actually run:
- One supported alternative attempt: `node node_modules/vitest/vitest.mjs run --config vitest.commercial.local.ts --configLoader runner --pool threads src/__tests__/auth-signup-correctness.test.ts src/__tests__/agent-login-stay-redirect.test.tsx src/__tests__/agent-auth-callback-stay-redirect.test.tsx`. Installed CLI source confirmed these options. Env-file loading remains disabled. Startup failed loading picomatch with `ReferenceError: require is not defined`; no tests ran. The earlier EPERM bundle path was not repeated; no permission changes or custom assertion replacement.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: passed, including the final rerun after metadata error handling changes (exit 0).
- ESLint across both routes, auth-profile-state, login page and both changed tests: failed with seven pre-existing no-explicit-any errors in login/page.tsx (23, 24, 25, 109, 202, 229, 245). No new any was introduced. A subsequent check of both routes, helper and both changed tests passed (exit 0). The login page is not claimed lint-clean.
- `git diff --check` passed. Imported RULES.md and fable/active.md are missing in the bound workspace; no outside search. A documentation patch with unmatched context was rejected and changed nothing; this follow-up section records the correction instead.
- No network/provider calls, credential/env-file reads, DB changes, activation flags, agents/redispatch, external sharing, global settings, commits or deployment.

Limits: this enforces application-profile creation/completion paths, not raw Supabase Auth account creation. DB grants/RLS enforcement and existing completion-state migration remain separate. Token expiry, atomic consumption/binding, concurrent profile writes, provider readiness and live E2E remain unresolved/unverified. Existing issued session/JWT metadata is not refreshed by this server change; clients must not treat editable or cached metadata as identity evidence. No universal signup-security completion claim.

## Phase 3 — rental demo transparency (2026-10-23)

### Evidence and scope
- Human-provided browser evidence: /stay/list exposed six short_term examples and normal detail inquiry CTA without sample labels. This task did not repeat browser/provider requests.
- Read scripts/seed-stays.mjs as source only: sid(1) through sid(12) use decimal suffixes 01–12 on 5eed0000-0000-4000-8000-0000000000. Never executed the script. No arbitrary rows are classified from title, owner, image or prefix alone.
- Local instructions read; RULES.md and fable/active.md are absent in this workspace (initial read returned exit 1 for missing imports). No outside-workspace/private conversation imports. Earlier phases preserved.

### Changes
- Added shared exact-ID membership helper; uppercase UUID spelling matches the same ID, suffix 00/13/99/0a/0b/0c and malformed lookalikes do not.
- Shared row/tile card replaces availability badge with 샘플 매물; covers list and map panel. Map price markers and nearby detail cards also identify samples.
- Detail shows sample notice before gallery: UI demonstration only, not actually available, images illustrative rather than property evidence. Gallery image titles identify examples.
- General desktop/mobile inquiry bar, host quote entry and inquiry form replace sample submission controls with explanation and /stay/new host-registration link. Host mobile shortcut says sample guidance. Non-demo controls retain existing behavior.
- POST /api/stay-inquiries rejects the known IDs with 403 after authentication/body/consent validation and before DB access. Existing real-property availability, ownership, rate limit, duplicate and participant privacy guards remain. Approved broker-info block/placement and public DTOs unchanged.
- No row deletion, price/contact mutation, sample hiding or image generation.

### Validation and limits
- Added exact-ID positive/negative tests, all 12 demo endpoint rejection/no-DB tests, real and similar-ID (suffix 13) successful inquiry insert tests, host demo UI test, list/map card and inquiry form/sidebar/mobile UI tests.
- Attempted: node node_modules/vitest/vitest.mjs run --config vitest.commercial.local.ts src/__tests__/stay-demo.test.ts src/__tests__/stay-inquiries.test.ts src/components/stay/StayHostQuote.test.tsx src/__tests__/stay-public-api.test.ts src/components/stay/StayAgentBlock.test.tsx
- Vitest config load denied child process spawn (EPERM); no tests ran. No bypass/escalation. stay-demo-ui.test.tsx was subsequently added and linted; its execution remains blocked/unattempted under the same startup limitation. Config disables env-file loading.
- TypeScript noEmit/incremental false and ESLint on all Phase 3 source/tests passed; git diff --check passed. These are static checks, not real inquiry/provider verification.
- Map/list/card/marker code paths covered in source; live Naver rendering, marker label fit, mobile overflow and detail visual layout remain unverified. No known additional public list card surface was found in the targeted search. Rerun focused tests and visual checks in an authorized environment before release.
- No network, external service, credentials/env reads, DB writes, seed execution, agents/redispatch, global settings, commit/push or deployment.

### Recommended next separate phase
Supply-side CSV import with recorded owner consent, duplicate detection, freshness timestamps/reconfirmation, availability calendar and inquiry response-time tracking. Define validation and dry-run review before any import. No revenue or actual property verification claim is made.

## Independent QA — homepage heading whitespace correction (2026-10-23)

- Human-dispatched independent normal-dev Vitest result before this correction: 73/75 targeted tests passed, 2 failed. Both failures are the STAY flag cases in src/app/page.test.tsx:44: the expected accessible region name contains a space after the comma, while HomeJourneys omitted it around the br element. This is separate from the prior app-worker spawn EPERM startup failures, where no tests ran.
- Added an explicit JSX space after the comma before br, preserving the visual line break and the human-readable heading `다음 일터를 찾고, 함께할 사람을 만나다.`. Existing test expectations already match that text and remain unchanged. No other logic changed.
- Root browser results supplied with this task: new homepage desktop and 390px had no horizontal overflow; demo STAY detail at 390px had sampleNotice=true, inquiryButtons=0 and no horizontal overflow. These were independent results, not browser checks run by this worker.
- This worker inspected the heading and existing test expectation; did not rerun known-blocked sandbox Vitest. Post-correction test execution remains pending the main independent QA rerun; no 75/75 pass claim.
- RULES.md and fable/active.md imports were absent in the bound workspace. No outside-workspace search, network, external services, credential reads, DB changes, agents/redispatch, commits or deployment.


## Phase 4 follow-up — require public approval for new ads (2026-10-23)

- Finding: jobs POST sets is_active=true independently of verified-business is_approved; public jobs require both. New-order eligibility previously checked only active/deadline.
- src/lib/advertisement-job.ts now requires is_approved === true as well as active and the existing inclusive KST deadline. Missing/null/false approval fails closed. Ownership/category/UUID checks remain at the API and selector boundaries.
- src/app/api/payment/orders/route.ts selects is_approved and rejects ineligible jobs before inserting an order, with an approved-active-job explanation. No pricing, schema or DB changes.
- src/app/premium/page.tsx extends MyJob and its select projection, filters selection and the purchase recheck through the shared guard, and explains approval/active/deadline requirements. Returned owned/category-matching rows with explicit false approval trigger a separate approval-pending notice, including alongside eligible jobs; null/missing approval is blocked without asserting a known pending state. State resets for every query and query errors remain distinct. No new approval-status taxonomy is inferred from the boolean.
- Both category FAQs now explain approved active listing plus completed payment instead of administrator-free immediate exposure.
- Tests updated: approved fixtures for helper, new-order and selector success; false/null/missing approval rejection; pending notice and no selectable/payable target; mixed-list approved selection; both category FAQ copy; checkout server approval rejection prevents provider payment; existing-order confirmation remains allowed after a job becomes unapproved. Existing deadline boundary tests remain.
- Historical confirm/recovery/webhook/refund implementation unchanged. Shared eligibility has only the new-order and premium-selector production callers. Previous phase edits preserved.

Validation actually run:
- Changed source/test ESLint passed (exit 0): advertisement-job helper/tests, orders route, confirm route tests, premium page/tests, checkout tests.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: passed (exit 0).
- `git diff --check`: passed (exit 0); only the existing PROGRESS.md LF/CRLF advisory.
- Vitest deliberately NOT rerun per request because prior sandbox startup paths are known blocked. Added/updated tests await independent QA; no test-pass or live-payment claim.
- Initial local instruction read returned exit 1 because RULES.md and fable/active.md are absent in the bound workspace. One initial rg glob was invalid on Windows; subsequent explicit-file searches succeeded. No sandbox action denial occurred in this follow-up.
- Bound workspace only; no network, services, credentials/env reads, real payments, DB writes, Jev, agents/redispatch, settings/permissions changes, commits or deployment.

## Independent QA follow-up — profile permission regression (2026-10-23)

- Human-supplied independent normal-dev full Vitest result before this correction: 43 files, 42 passed / 1 failed; 646 tests, 645 passed / 1 failed; 39.47 seconds, exit 1. Independent TypeScript passed. These are supplied QA results, not commands run by this worker.
- Sole reported failure: api-permissions expected 409 for a missing public profile, although complete-profile intentionally inserts validated missing social profiles. Its unconfigured updateUserById mock returned undefined, producing 500 after the insert.
- Updated only src/__tests__/api-permissions.test.ts and this document. Optional-mode completion now expects success with authenticated id A despite injected id/user_id B and admin role; stored user_type and completed metadata role must be seeker. Auth metadata update has an explicit resolved success mock. Existing permission tests remain intact; production validation/source unchanged.
- Added required-mode missing-proof rejection with zero profile writes and no Auth metadata calls, plus insert-error coverage returning 500 without completed metadata. The query mock propagates insert errors through select/maybeSingle with null data rather than fabricating a successful inserted row. Recorded writes represent attempted writes in the failure test. Mode values are isolated test stubs only; no application flags/settings changed.
- Actually run: local instruction/source/diff inspection; `node node_modules/eslint/bin/eslint.js src/__tests__/api-permissions.test.ts` passed (exit 0); scoped `git diff --check -- src/__tests__/api-permissions.test.ts docs/COMMERCIAL_REFACTOR_20261023.md` passed (exit 0).
- Vitest and TypeScript were not rerun by this worker. Post-change actual Vitest remains pending root independent QA; no new pass claim. Earlier app-worker spawn EPERM and picomatch startup failures above are preserved and remain distinct from the independent executed test failure.
- Initial instruction read returned exit 1 because RULES.md and fable/active.md are absent in the bound workspace; no outside search. No sandbox action denial occurred. No network, external services/providers, credentials/env-file reads, private conversation imports, DB changes, Jev, agents/sessions/redispatch, global settings, commits or deployment.
