# GX-ACADEMY-LOGIN-004 — Preview auth gate (Polo Kelle)

Status: **NO-GO** for real students, payments, merge, and production deploy.

## Evidence (read-only connector checks)

- PR #259 is open/draft, commit `7d3af90a80e490b95087ebf784e5fb7680003d3c`; zero independent reviews at inspection.
- Workflow `Notify Infrastructure` succeeded; `Web Lint` was still in progress. Canonical Vercel status was pending; other Vercel projects reported mixed results. None proves the canonical preview passed E2E.
- Vercel project `prj_uKx4ggmKth6IAp9m8RxszXo6Ls9p` under `xpex-neural`: `XPEX_PILOT_ALLOWED_EMAILS`, `XPEX_PILOT_SUPABASE_URL`, and `XPEX_PILOT_SUPABASE_PUBLISHABLE_KEY` exist only as **preview variables scoped to branch** `chore/academy-vercel-supabase-migration-audit`. PR #259 uses `fix/academy-pilot-otp-existing-users-20261117`, so those variables are **not verified to apply to its preview**. Secret values were not decrypted.
- Supabase pilot invite + Auth join: admin and teacher users exist but have unconfirmed email; synthetic student is confirmed. No identities were changed.
- The code checks `email_confirmed_at`, restricts `request_code`/verification by `XPEX_PILOT_ALLOWED_EMAILS`, and uses `create_user: false` on this branch.

## Human-approved environment configuration gate

1. In the canonical Vercel project's **Preview** environment, verify the three variable names and the **branch scope**. Arrange a scoped preview configuration for the intended test branch after authorization; do not copy secret values into GitHub, logs, comments, or tickets.
2. Confirm `XPEX_PILOT_SUPABASE_URL` points to dedicated project `krvoedwbdnvoziiaavwp` and the publishable key belongs to the same project, without disclosing either value. Confirm the invited administrator email is present in the allowlist using authorized dashboard access.
3. In Supabase Auth, inspect **Site URL**, allowed redirects, email provider, and email template. `{{ .ConfirmationURL }}` sends a Magic Link; `{{ .Token }}` sends an OTP. Do not claim either is configured until inspected.
4. Let the actual invited administrator confirm their email via legitimate link/OTP; never set `email_confirmed_at` via SQL or use an administrative bypass.

## Synthetic preview acceptance matrix (NOT YET RUN)

| Test | Expected evidence |
|---|---|
| Anonymous GET `/api/academia?view=session` | HTTP 401, no session |
| Non-allowlisted email `request_code` | HTTP 403, no OTP issued |
| Allowlisted existing synthetic identity `request_code` | Auth request accepted; delivery verified separately |
| Magic Link / OTP verification | One-time valid token establishes session; invalid/expired rejected |
| Session GET | HTTP 200 with authenticated identity, no tokens in response |
| GET academic data | Role and Polo Kelle invite visible only to authorized identity under RLS |
| Logout + session GET | Session cleared; subsequent GET HTTP 401 |
| Second synthetic identity | No cross-user enrollment/progress leakage |
| Missing preview environment variable | Controlled HTTP 503, not false login success |

Do not send real emails, reuse private tokens, mutate student records, or claim test success without actual HTTP results and evidence. Require independent review, CI and deployment SHA before any merge/cutover.
