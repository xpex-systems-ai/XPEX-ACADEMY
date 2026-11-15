# XPeX Academy Everywhere — Universal Login (design and release gates)

## Product goal
Allow students and staff to access the same Academy account via Google and GitHub where the existing backend identity provider supports them. A ChatGPT-facing app must use the host's supported account-linking authorization flow; it must **not** treat the user's ChatGPT session as an Academy login token. A standalone 'Continue with ChatGPT' social-login button is disabled until an official compatible identity-provider flow is documented, configured and verified.

## Existing system constraints
- The Academy is a LearnHouse-derived Next.js + FastAPI system with WorkOS dependencies. Inspect its current login, session and role implementation before changing authentication.
- Supabase is the dedicated **academic PostgreSQL** target. Do not switch auth authorities to Supabase Auth just because the database exists.
- Firebase remains for approved telemetry and feature flags. Firebase Authentication must not be enabled as a parallel source of truth without an explicit account migration and identity mapping.
- An MCP app using OAuth authorization to access Academy is **not** the same as 'Login with ChatGPT'.

## Identity design
1. One canonical immutable Academy user ID, linked to provider identities by verified issuer + subject, never email alone.
2. Existing user must authenticate before linking a second provider. Prevent account takeover through unverified or reused email addresses.
3. Authorization code with PKCE, exact registered redirects, state, nonce for OIDC, issuer/audience checks, secure HttpOnly cookies, short-lived tokens and logout/revocation.
4. Server-side organization/Polo membership and roles (student/teacher/admin) are checked on **every** sensitive API call. No role assignment from frontend claims.
5. Enrollment and payment are separate consented actions with idempotency, audit trail and human-reviewed production activation.
6. Privacy notice, consent, deletion/export, age-related safeguards, logs without tokens and incident-response procedures.

## Provider matrix
| Provider | Intended purpose | Current status |
| --- | --- | --- |
| Google | OAuth/OIDC Academy login | Pending provider configuration, backend verification and E2E |
| GitHub | OAuth Academy login | Pending provider configuration, backend verification and E2E |
| ChatGPT/OpenAI | Account linking inside an approved ChatGPT app, using Academy as identity provider | MCP bootstrap exists; linking and app publication not implemented |
| Supabase | Academic data | Dedicated project exists, migrations pending |
| Firebase | Telemetry/feature flags | Runtime verification pending |

## Initial delivered API
`GET /api/xpex/auth/providers` reports providers as disabled until they pass verification; it does not implement login or create users. Do not show an active sign-in button based solely on this endpoint.

## Launch acceptance
- Backend URL reachable; sessions and identity provider verified.
- Test Google and GitHub sign-in, logout, account linking, repeat sign-in and recovery on a non-production tenant.
- Validate staff roles, Polo isolation, enrollment, progress and certificate authorization.
- Confirm the ChatGPT app OAuth flow separately and obtain app approval before announcing availability.
- Complete backups, database migrations and payment provider validation before commercial enrollment.
