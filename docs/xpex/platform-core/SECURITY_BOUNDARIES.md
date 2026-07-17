# Platform Core Security Boundaries

## Autenticação

Authentication is centralized in `apps/api/src/security/auth.py` and exposed by `apps/api/src/routers/auth.py`. It covers password verification, JWT access token creation, refresh token rotation/replay controls and current-user resolution. Frontend consumers must use `apps/web/services/auth/` and shared providers rather than creating local session stores.

## Autorização

Authorization is split deliberately:

1. Auth identifies the principal.
2. `UserOrganization` proves tenant membership.
3. `Role.rights` and RBAC helpers determine allowed actions.
4. Resource access checks apply ownership, usergroups, public/dashboard context and admin bypass rules.

Product domains must not infer permission from authentication alone.

## Multi-tenancy

`Organization` and `org_id` are the tenant boundary. `apps/api/src/security/org_auth.py` is the central helper for membership/admin checks. Tenant resources must validate `org_id` in service/route code and avoid cross-tenant lookup by UUID alone.

## Tokens

| Token type | Boundary |
|---|---|
| User JWT | Identifies a user session; does not grant tenant access by itself. |
| Refresh token | Rotated and revocable; cookie/session handling remains Platform Core. |
| Organization API token | Scoped to one `org_id`, carries rights and active/expiry metadata. |
| Superadmin API token | Separate high-privilege principal and must remain isolated from org token checks. |
| Webhook secret | Stored as encrypted secret field on webhook endpoint; never documented with real values. |

## Secrets

Secrets belong in environment/config paths, not documentation. This mission adds no credentials and preserves AGPL/LearnHouse attribution. Future missions must continue to avoid literal API keys, JWT secrets, SMTP passwords, Stripe secrets, webhook secrets or personal data.

## Storage

Storage uses shared media/content delivery routers and config-selected filesystem or S3-compatible backend. Domains must not expose raw static files or create separate media authorization paths.

## Billing

Billing provider secrets and webhooks are Platform Core. Product domains may consume plan/usage gates but must not duplicate Stripe/payment configuration or bypass billing guards.

## Webhooks

Webhook endpoints are org-owned and include encrypted secret fields and delivery logs. Event publication and retry guarantees require follow-up before classifying the full webhook capability as production ready.

## Princípio de menor privilégio

- Use role rights buckets instead of admin-only shortcuts when possible.
- Use org API tokens for automation; do not share user passwords.
- Keep superadmin bypass explicit and restricted.
- Add rights buckets through ADR/validator updates before new domain privileges are introduced.

## Lacunas conhecidas

| Lacuna | Risco | Prioridade |
|---|---|---|
| Unified immutable audit log not evidenced | Limited forensic traceability | Alta |
| Webhook delivery guarantees unclear | External automation may miss events | Alta |
| Media retention/scanning lifecycle unclear | Compliance and malware risk | Média |
| General feature flag service absent | Product toggles may drift into local logic | Média |
| Notification event bus absent | Domains may create ad hoc notification flows | Média |
