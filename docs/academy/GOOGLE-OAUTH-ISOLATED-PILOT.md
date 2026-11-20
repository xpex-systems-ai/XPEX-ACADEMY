# XPeX Academy — Google OAuth pilot (isolated, NO-GO)

## Scope
- Branch isolated from PR #259; based on `fix/academy-pilot-otp-existing-users-20261117`.
- Google OAuth PKCE routes: `/api/academia/oauth/google` and `/api/academia/oauth/callback`.
- Entry page: `/academy/entry`; fallback to existing email login.
- Current pilot role destinations: admin/teacher /academia?section=polo, student /academia?section=cursos. These are RLS-scoped pilot views, not LearnHouse /xpex/* single sign-on.
- Links do **not** grant roles; server-side authorization and RLS remain mandatory.

## Configuration gate (human approval; never paste secrets)
1. In the dedicated pilot Supabase project, configure Google provider and approved OAuth client.
2. Configure exact authorized callback `https://<preview-host>/api/academia/oauth/callback` in Supabase redirect allowlist, and the Supabase Auth callback in Google Cloud.
3. Only in isolated Preview, set `XPEX_PILOT_GOOGLE_OAUTH_ENABLED=true`; retain existing pilot URL, publishable key and explicit email allowlist.
4. Validate that Supabase Auth returns the expected `code` and `state` to the app callback. The callback intentionally fails closed if state is missing or mismatched. Confirm the provider flow end-to-end before considering rollout.
5. Confirm user already exists and is invited; Google must not create an Academy membership or bypass RLS. Consider disabling new user creation at the Auth provider/project level for the pilot.

## Evidence gates — NOT_VERIFIED
- Strict lint/build and static review of OAuth callback / PKCE state lifecycle.
- Anonymous / unauthorised email / missing flag / mismatched state rejection.
- Authorized synthetic Google identity -> session -> role-scoped Polo/Academy -> logout -> 401.
- Verify that the authenticated user has an existing `academy_pilot_invites` row before accessing any privileged module.
- Independent review and SHA-matched Preview deployment; no production deploy.

## Known integration caveat
The pilot session cookies are scoped to `/api/academia`. Existing legacy pages may use separate auth and therefore may still show their own login. A complete SSO cutover requires explicitly validating each destination's server-side auth middleware; do not claim seamless access until tested.

**Release decision: NO-GO.** No production settings, student accounts, secrets or payment flows were changed.


## Mission GX-ACADEMY-READY-001 — 2026-11-19 (code corrections; release still NO-GO)

- `/academy/entry` now links pilot roles to `/academia?section=...`, **not** to the LearnHouse `/xpex/*` panels. This is NOT a working single sign-on for those legacy panels.
- Public Academy CTAs go to `/academy/entry`; email fallback goes to the existing Supabase Auth form at `/academia`.
- Google authorization now binds the app-side CSRF state in the `redirect_to` callback URL instead of assuming Supabase's provider-managed OAuth state will be forwarded to the app. Runtime behavior remains **NOT_VERIFIED**.
- The Next.js Academy page selects a role-appropriate pilot section. UI selection cannot replace Supabase Auth + RLS authorization.
- Added `apps/web/tests/academy-google-oauth-source-contract.test.mjs` and a Web Lint workflow step. These checks validate repository source contracts only; they do not demonstrate runtime login.
- Read-only Vercel environment metadata: **zero branch-scoped pilot variables** for `feat/academy-google-oauth-isolated-20261118`. The three pilot variables are instead scoped to `fix/academy-pilot-otp-existing-users-20261117` (PR #259) or a different audit branch. `XPEX_PILOT_GOOGLE_OAUTH_ENABLED` is not configured. No variable values were decrypted. The Google CTA must be considered **disabled/not configured** until Preview-only human-approved configuration.

**Release gates:** branch-specific Preview configuration; provider allowlist for callback query; existing synthetic invited identity; anonymous HTTP 401 and authenticated HTTP 200 captures; OAuth PKCE/state recovery and invalid-state denial; role/Polo isolation; logout->401; email fallback; independent reviewer; human release sign-off. No production changes or students.


## GX-ACADEMY-READY-003 — Synthetic QA and review gate (2026-11-19)

**Baseline evidence before this documentation-only change:** GitHub PR #260 Draft, SHA 2c8d7ed27bffaa10a4373e22983dcee0eddecd6c, Vercel deployment dpl_Ci7vb5XBYkNuxgKyDNcHD5kCPZJ8 READY, target null, URL https://xpex-academy-58cjskevk-xpex-neural.vercel.app. Three encrypted Preview variables are scoped only to the PR #260 branch; Google OAuth opt-in remains off.

### Verified (NOT positive E2E)
- [x] Web Lint and Notify Infrastructure GitHub Actions passed for the baseline SHA.
- [x] External read-only Preview smoke: /academy/entry rendered; anonymous /api/academia => HTTP 401; Google availability endpoint => googleAvailable:false; /api/academia/oauth/google => HTTP 503. Repeat entry/status fetch succeeded after initial transient timeouts.
- [x] Earlier negative browser test with the fictitious uninvited address preview-uninvited-test@example.invalid was denied; no account created.
- [x] Read-only Supabase audit: 3 Auth users, 3 invites, 3 matching Auth/invite addresses; only 1 matching account has a confirmed email. No enrollments or progress. These aggregates do NOT establish any synthetic test identity.
- [x] Prior policy audit: RLS enabled on six academic tables, nine policies reference authenticated identity. This does NOT prove runtime role/Polo isolation.
- [x] GitHub review audit: PR #259 and #260 have zero independent reviews; the PR author and connected GitHub account are xpex-systems-ai. Historical commenter chatgpt-codex-connector has no repository collaborator permission.
- [ ] Other Vercel status contexts with failures must be mapped to required/noncanonical gates before release.

### Positive test handoff (blocked; run only with explicitly approved synthetic QA identity)
- [ ] Authorized tester provides a dedicated QA mailbox they control, not a real student account; do not put email, passwords, OTP, magic links, refresh tokens or cookies in GitHub or test logs.
- [ ] Authorized administrator provisions confirmed Supabase Auth QA identity, exact Preview-only allowlist and RLS-scoped academic invitation for role and Polo. The pilot Supabase project also serves PR #259; do not modify shared data without separate approval. Prefer a dedicated test project where possible.
- [ ] From a clean browser profile, perform passwordless OTP/magic-link or already-approved password login; verify GET /api/academia?view=session returns HTTP 200 for authenticated QA and GET /api/academia returns permitted invite/course rows. A successful session response without an invite is NOT authorization.
- [ ] Check rejected missing/uninvited identity and cross-role/cross-Polo requests; two test roles and a second QA Polo are needed for full isolation proof. There is presently only one Polo in the pilot.
- [ ] On QA-only fixture, enroll in a published course and record a completed lesson; verify authorization and persistence after refresh/relogin, and idempotence on repeated request. Do not touch real student progress.
- [ ] Logout via Academy, recheck session API => HTTP 401. Redact all response bodies containing personal data.
- [ ] Configure Google provider and approved OAuth client on Supabase/Google Cloud, allowlist the exact Preview callback including query behavior; only then enable Preview-only Google feature flag and prove PKCE/state matching, mismatch denial, invited role, and logout. It is disabled and not verified today.
- [ ] Independent human reviewer with confirmed access and identity distinct from the author performs authorization/security review of PR #259 and PR #260. Record their submitted GitHub review; self-comments and unqualified bot feedback do not count.
- [ ] Resolve all required CI/deployment check contexts, confirm latest SHA equals READY Preview SHA; obtain explicit human release decision. No merge, production deploy or opening student enrollment here.

**Exact NO-GO blockers:** no verified consenting synthetic QA mailbox/session, Google OAuth provider not configured/tested, no eligible independent reviewer identified, cross-Polo fixture absent, and complete Academy E2E unproven. Production and student gates remain closed.
