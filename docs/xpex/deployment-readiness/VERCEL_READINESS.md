# Vercel Readiness

## Recommended settings

- Root directory: `apps/web`.
- Install command: `bun install --frozen-lockfile` or Vercel Bun equivalent.
- Build command: `bun run build`.
- Output: Next.js standalone/serverless handled by Vercel; Dockerfile is not required for Vercel.
- Public variables only: `NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL`, `NEXT_PUBLIC_LEARNHOUSE_API_URL`, `NEXT_PUBLIC_LEARNHOUSE_DOMAIN`, `NEXT_PUBLIC_LEARNHOUSE_ENV`, optional public analytics/Sentry values.

## Must not be placed in Vercel frontend env

Database URLs, JWT secrets, Redis URLs, storage secret keys, SMTP passwords, Stripe secret keys, webhook secrets, internal service keys and provider API secrets.

## Readiness status

Vercel is documentation-ready but not deployment-authorized. A staging Vercel project should be created only after API URL/domain decisions are approved.
