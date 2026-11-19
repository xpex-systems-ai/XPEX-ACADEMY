# Polo preview — real access incident

Operator report (2026-11-15): the Vercel Academy preview opens, but Polo access fails. Deployment `dpl_6hXYXR9KRauFnwwAgHRrNWFrJf3w` is `READY`; this does **not** prove the app works.

## Verified source paths
- `apps/web/app/xpex/polo/page.tsx` renders `AuthenticatedXpexExperience(requestedRole='polo')`.
- `apps/web/components/Xpex/AuthenticatedXpexExperience.tsx` requires an authenticated session, an eligible organization membership and manager/teacher permissions. No session redirects to `/login?next=...`; missing role or membership yields access denied.
- `apps/web/services/config/config.ts` requires an HTTPS `NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL` in deployed environments; missing/invalid URL throws rather than using localhost.
- `apps/web/proxy.ts` requests API `/api/v1/instance/info` and falls back to tenant `default` when backend is unavailable, which can mask the intended Kelle tenant.
- No runtime logs returned for the last 30 minutes; this is inconclusive.

## Next safe checks
1. Confirm `NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL` is present in Vercel preview (key presence only, do not expose secret values), points to a functioning HTTPS FastAPI API, and returns instance info.
2. Test preview routes `/login?next=%2Fxpex%2Fpolo`, `/xpex/polo`, `/beta/polo`; record HTTP status and exact user-visible failure.
3. Verify user session and the organization membership/role for Polo Kelle with authorized account. Never bypass authorization to force access.
4. Confirm backend API, Redis and canonical PostgreSQL are operational; dedicated Supabase currently requires verified Alembic migration before use.
5. Add E2E checks and only then promote preview.

This is a diagnostic record, **not a confirmed root cause or a resolved incident**.

## Verification snapshot — 2026-11-15 (read-only)
- Supabase project `krvoedwbdnvoziiaavwp`: `ACTIVE_HEALTHY`, PostgreSQL 17, region `us-east-1`.
- `public` tables: zero; Supabase migration records: zero. Do **not** point Academy at this empty database or move student records.
- Vercel project `prj_EvLi9wcPcy2p7op1ChdvI8kPksKV`: latest preview `dpl_Dtck6KyzjTEehjBomJd7fuhpcxF9`, `READY`, target null, project `live=false`; SSO protection enabled for preview. Previous preview is superseded.
- GitHub PR #254 remains the migration review gate; no merge or production promotion authorized.
- No Firebase read/write or backup verification was completed in this snapshot. Do not infer Firebase readiness.

### Next execution gate
1. Read PR diff and checks; compare deployment commit against PR head before debugging stale previews.
2. Check nonsecret presence/scope of backend URL in preview and test health endpoint with an authorized session.
3. Use synthetic teacher/student accounts to validate Polo Kelle login, membership, enrollment, lesson access, progress and certificate generation. Record pass/fail per stage.
4. Obtain verified source backups and Alembic revision inventory before any dedicated Supabase schema or data migration.
