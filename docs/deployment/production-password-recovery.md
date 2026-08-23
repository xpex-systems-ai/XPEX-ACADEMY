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
LEARNHOUSE_FRONTEND_DOMAIN=xpex-academy-ai.vercel.app
LEARNHOUSE_SSL=true
LEARNHOUSE_ALLOWED_ORIGINS=https://xpex-academy-ai.vercel.app
LEARNHOUSE_EMAIL_PROVIDER=resend
LEARNHOUSE_RESEND_API_KEY=<REDACTED>
LEARNHOUSE_SYSTEM_EMAIL_ADDRESS=<VERIFIED_SENDER_ADDRESS>
```

`LEARNHOUSE_RESEND_API_KEY` is a secret and must be a valid production Resend
credential installed by an authorized operator. The sender address is not an
API credential, but it must belong to a domain verified for that Resend
account. Do not put either effective value in source control, tickets, browser
responses, or command output.

`LEARNHOUSE_DOMAIN` is not required to select the email-link frontend in this
single-tenancy deployment. It can continue to represent other routing needs;
it must not be changed to the Railway API host as a workaround. No wildcard
origin or general `*.vercel.app` trust is needed.

## Post-deploy verification

1. From `https://xpex-academy-ai.vercel.app/forgot`, request recovery for a
   controlled account.
2. Confirm the request is not rejected for its Origin or Referer and does not
   return `503`.
3. Confirm delivery, and verify the link starts with
   `https://xpex-academy-ai.vercel.app/reset?`.
4. Complete the reset and log in with the new password.
5. Confirm the session and `/xpex` still work, inspect API logs for secret
   leakage, and verify a deliberately untrusted Origin remains rejected.

## Rollback

Revert only the password-recovery change if code behavior regresses. For
configuration rollback, restore only the previous email/origin variables; do
not alter database, Redis, JWT, or collaboration secrets. This change has no
database migration or data rollback.
