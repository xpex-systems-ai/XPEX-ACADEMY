# Production password-recovery configuration

Password-recovery URLs are derived from a request `Origin` or `Referer` only
after that origin passes the email URL trust check. In single-tenancy mode,
`LEARNHOUSE_FRONTEND_DOMAIN` and `LEARNHOUSE_DOMAIN` are the only trusted host
values; `LEARNHOUSE_ALLOWED_ORIGINS` remains the separate browser CORS
allowlist. An untrusted request header falls back to the configured frontend
host rather than being copied into an email.

## XpeX production Railway API manifest

Apply these variables to the Railway production service **XPEX-ACADEMY**, then
redeploy it. The frontend domain is a hostname without a scheme or path. The
allowed origin is a complete HTTPS origin.

```dotenv
LEARNHOUSE_TENANCY=single
LEARNHOUSE_FRONTEND_DOMAIN=<CANONICAL_FRONTEND_HOSTNAME>
LEARNHOUSE_SSL=true
LEARNHOUSE_ALLOWED_ORIGINS=https://<CANONICAL_FRONTEND_HOSTNAME>
LEARNHOUSE_EMAIL_PROVIDER=brevo
LEARNHOUSE_BREVO_API_KEY=<SECRET_CONFIGURED_IN_RAILWAY>
LEARNHOUSE_SYSTEM_EMAIL_ADDRESS=<VERIFIED_SENDER_ADDRESS>
```

`LEARNHOUSE_BREVO_API_KEY` is a secret and must be a valid production Brevo
credential installed by an authorized operator. The API sends transactional
mail to Brevo over HTTPS; SMTP variables are not required for this provider.
The sender address is not an API credential, but it must be an active sender or
belong to a domain authenticated in the same Brevo account. Do not put any
effective value in source control, tickets, browser responses, or command
output.

`<CANONICAL_FRONTEND_HOSTNAME>` must be replaced only after the operator has
confirmed which Vercel project is canonical. Do not infer it from an old
runbook or configure more than one production origin as a shortcut.

`LEARNHOUSE_DOMAIN` is not required to select the email-link frontend in this
single-tenancy deployment. It can continue to represent other routing needs;
it must not be changed to the Railway API host as a workaround. No wildcard
origin or general `*.vercel.app` trust is needed.

## Post-deploy verification

1. From `https://<CANONICAL_FRONTEND_HOSTNAME>/forgot`, request recovery for a
   controlled account.
2. Confirm the request is not rejected for its Origin or Referer and does not
   return `503`.
3. Confirm delivery, and verify the link starts with
   `https://<CANONICAL_FRONTEND_HOSTNAME>/reset?`.
4. Complete the reset and log in with the new password.
5. Confirm the session and `/xpex` still work, inspect API logs for secret
   leakage, and verify a deliberately untrusted Origin remains rejected.

## Rollback

Revert only the password-recovery change if code behavior regresses. For
configuration rollback, restore only the previous email/origin variables; do
not alter database, Redis, JWT, or collaboration secrets. This change has no
database migration or data rollback.
