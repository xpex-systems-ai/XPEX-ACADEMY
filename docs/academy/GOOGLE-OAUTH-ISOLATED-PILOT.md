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
