# XPeX Academy — Google OAuth pilot (isolated, NO-GO)

## Scope
- Branch isolated from PR #259; based on `fix/academy-pilot-otp-existing-users-20261117`.
- Google OAuth PKCE routes: `/api/academia/oauth/google` and `/api/academia/oauth/callback`.
- Entry page: `/academy/entry`; fallback to existing email login.
- Post-login destinations for RLS-authorized invitation roles: admin `/xpex/admin`, teacher `/xpex/polo`, student `/xpex/activities`.
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
