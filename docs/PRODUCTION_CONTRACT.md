# PRODUCTION CONTRACT VALIDATION CHECKLIST

## Purpose
Verify that the production environment has all required configuration to support the student golden path without hidden failures.

---

## Critical Path Environment Variables

### Authentication & Security
- [ ] `LEARNHOUSE_AUTH_JWT_SECRET_KEY` (API)
  - Used for: JWT signing/validation
  - Risk if missing: API boot fails, all auth endpoints return 500
  - Validation: API should start without error on boot
  
- [ ] `LEARNHOUSE_COOKIE_DOMAIN` (API/Web)
  - Used for: Setting cookie domain scope (shared org subdomains)
  - Risk if missing: Cookies set as host-only, cross-subdomain auth fails
  - Validation: Check if Platform is multi-tenant (subdomains)

### Persistence
- [ ] `LEARNHOUSE_SQL_CONNECTION_STRING` (API)
  - Used for: PostgreSQL async driver connection
  - Risk if missing: Health check fails, no data access
  - Validation: `GET /health` must return 200 with DB status

- [ ] `LEARNHOUSE_REDIS_CONNECTION_STRING` (API)
  - Used for: Token revocation, session cache, feature usage
  - Risk if missing: Features degrade gracefully, but revocation doesn't persist
  - Risk level: Medium (token revocation unreliable in multi-pod setup)

### Frontend Configuration
- [ ] `NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL` (Web)
  - Used for: API endpoint base for all backend calls
  - Risk if missing: Frontend points to wrong API, 502 on auth endpoints
  - Validation: Verify matches actual API URL

- [ ] `NEXT_PUBLIC_LEARNHOUSE_DOMAIN` (Web)
  - Used for: Multi-tenant domain resolution, custom domain detection
  - Risk if missing: Login cross-domain cookies fail, auth loop
  - Validation: Must match LEARNHOUSE_DOMAIN on API side

- [ ] `NEXT_PUBLIC_LEARNHOUSE_ENV` (Web)
  - Used for: Feature gates (SaaS vs OSS mode)
  - Risk if missing: Defaults to OSS, may disable paywall features
  
### Organization & Multi-Tenancy
- [ ] `LEARNHOUSE_DOMAIN` (API)
  - Used for: Cookie domain, tenant resolution
  - Risk if missing: Defaults to localhost, fails in production
  - Validation: Must be actual production domain

- [ ] `LEARNHOUSE_SAAS` (API)
  - Used for: SaaS mode features (email verification, turnstile, etc.)
  - Risk if missing: Some signup protections disabled

- [ ] `LEARNHOUSE_TENANCY` (API)
  - Used for: "single" or "multi" mode
  - Risk if missing: Defaults to single-tenant
  - Validation: Verify matches actual deployment model

### Default Organization (for MVP)
- [ ] Ensure a "default" organization exists
  - XpeX hardcodes `kelle-digital-lab` slug for pilot
  - Risk if missing: Dashboard queries fail, 403 on `/xpex/learning-dashboard`

### Optional but Recommended
- [ ] `LEARNHOUSE_SENTRY_DSN` (API/Web)
  - Used for: Error tracking
  - Risk if missing: Errors not reported to Sentry, manual log review needed

---

## Pre-Launch Validation Checklist

### Configuration Audit (Read-Only)
- [ ] Verify `LEARNHOUSE_DOMAIN` is set to production domain
- [ ] Verify `LEARNHOUSE_SQL_CONNECTION_STRING` points to valid PostgreSQL
- [ ] Verify `LEARNHOUSE_AUTH_JWT_SECRET_KEY` is strong (>32 characters, random)
- [ ] Verify `NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL` matches API endpoint
- [ ] Verify `NEXT_PUBLIC_LEARNHOUSE_DOMAIN` matches `LEARNHOUSE_DOMAIN`

### Database Validation
- [ ] Confirm PostgreSQL is running and accessible
- [ ] Confirm Alembic migrations have been applied (check `alembic_version` table)
- [ ] Confirm test/pilot organization exists (e.g., `kelle-digital-lab`)

### API Boot Test
- [ ] Start API: `docker run ... /app/docker-entrypoint.sh`
- [ ] Confirm startup logs show no errors
- [ ] Curl `GET /health` → should return 200 with DB/Redis status

### Frontend Boot Test
- [ ] Build Next.js: `bun run build` (should capture public env vars)
- [ ] Start Next.js: `PORT=3000 bun run start`
- [ ] Navigate to `/login` → should load without errors
- [ ] Check browser console for no auth endpoint errors

### Golden Path Pre-Flight
1. **Signup**
   - [ ] POST `/api/signup` with valid email/password → 200
   - [ ] Verify user record created in database

2. **Login**
   - [ ] POST `/api/auth/login` with credentials → 200
   - [ ] Check cookies set (LH_session marker, httpOnly auth cookies)
   - [ ] Verify access token returned

3. **Session**
   - [ ] GET `/users/session` with Authorization header → 200
   - [ ] Verify user roles returned
   - [ ] Verify organization membership resolved

4. **Logout**
   - [ ] POST `/api/auth/logout` with Authorization header → 200 or 401
   - [ ] Verify session marker cookie cleared
   - [ ] POST again → should return 401 (idempotent)

5. **Dashboard**
   - [ ] GET `/xpex/learning-dashboard?organization_slug=kelle-digital-lab` → 200
   - [ ] Should return empty or real course list (not error)

---

## Known Production Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Redis not available | Revocation blocker won't work; deploy Redis alongside API |
| Wrong cookie domain | Subdomains won't share session; verify LEARNHOUSE_DOMAIN |
| Invalid JWT secret | All tokens invalid; verify secret strength |
| Database unavailable | Health check fails; verify connection string |
| Wrong API URL in frontend | Signup/login hit wrong API; verify NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL |
| Missing organization | Dashboard 403; ensure pilot org exists |
| Token revocation Redis unreliable | In multi-pod setup, revocation may not sync; use shared Redis |

---

## Deployment Contract

### For Railway / Docker Deployment
Ensure these are set in the platform's secret store (NOT git):

**API Service Secrets:**
```
LEARNHOUSE_AUTH_JWT_SECRET_KEY=<strong_random_32+_chars>
LEARNHOUSE_SQL_CONNECTION_STRING=postgresql://...@db:5432/...
LEARNHOUSE_REDIS_CONNECTION_STRING=redis://...@cache:6379
```

**API Service Environment:**
```
LEARNHOUSE_DOMAIN=<production_domain>
LEARNHOUSE_ENV=production
LEARNHOUSE_DEVELOPMENT_MODE=false
LEARNHOUSE_SAAS=true (if SaaS mode)
LEARNHOUSE_TENANCY=multi (if multi-tenant)
```

**Web Service Environment (Public Only):**
```
NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL=https://api.<domain>
NEXT_PUBLIC_LEARNHOUSE_DOMAIN=<production_domain>
NEXT_PUBLIC_LEARNHOUSE_ENV=production
```

### For Vercel Deployment
- Use Vercel's Environment Variables feature
- **Secrets:** Do NOT store database URLs, JWT secrets, or API keys in Vercel
- **Public:** Only NEXT_PUBLIC_* variables go to Vercel
- **Connection:** Point to Railway API URL in `NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL`

---

## Smoke Test Commands

```bash
# API Health
curl -H "Authorization: Bearer <valid_jwt>" \
  https://api.xpex.example.com/api/v1/health

# Frontend Assets
curl https://www.xpex.example.com/_next/static/ \
  -I | grep 200

# Login Gateway
curl -X POST https://www.xpex.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@test.com","password":"test"}' \
  -i

# Logout Gateway
curl -X POST https://www.xpex.example.com/api/auth/logout \
  -H "Authorization: Bearer <token>" \
  -i
```

---

## Verification Status

**Last Updated:** <deployment_date>
**Validation By:** <human_approval>
**Ready for Launch:** YES / NO

If NO, document blockers in the PR.
