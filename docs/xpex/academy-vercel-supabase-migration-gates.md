# GXEON Academy — Migration Gate (Vercel + Supabase + Firebase)

Status: AUDIT / NO PRODUCTION CUTOVER. Owner approval: migration strategy approved. Source branch: dev.

## Verified architecture
- Next.js frontend: apps/web; FastAPI backend: apps/api; collaboration: apps/collab.
- GitHub is source of truth; Vercel ignoreCommand in root and apps/web currently skips legacy builds.
- Firebase Fabric supports feature flags and telemetry and must remain available during migration.
- Existing authentication and academic database are canonical until data inventory, backup and migration checks pass.
- Supabase must be a dedicated Academy project, not the existing OMNIX AI or Growth OS database.
- FastAPI, Redis, background workers, transactional email and media storage require separate hosting/configuration decisions; Supabase PostgreSQL is not a replacement for the full backend.

## Safe execution gates
1. Inventory schema, migrations, extensions, database size, current auth, tenant IDs, file storage, Redis and background jobs. No live student data in logs.
2. Export encrypted backups and test a restore. Record row counts, foreign keys, indexes and organization isolation.
3. Provision dedicated Academy Supabase staging; import schema and data in staging only; test permissions and restore.
4. Choose a single canonical Vercel project/account and inspect build settings, root directory, environment names and current deployment aliases. Do not re-enable builds until configuration is tested in preview.
5. Select compatible FastAPI hosting outside Railway (or validate an explicitly scoped serverless refactor), plus Redis and storage. Keep secrets server-side.
6. Preserve Firebase Analytics, Remote Config, Performance and App Check with consent/privacy checks, particularly for minors; do not duplicate sensitive identifiers across telemetry systems.
7. Test professor/admin/student roles, Polo Kelle tenant isolation, invite, enrollment, lesson playback, progress, assessments, certificate, media, password recovery and mobile UX.
8. Promote only after CI, E2E, monitoring, backup/restore and rollback tests; require explicit production cutover approval.

## No-go conditions
- Missing or unverified backup; unknown live database location; missing API hosting; missing Redis; failed auth or tenant-isolation tests; failed certificate/lesson tests; secrets exposed; telemetry of minors without suitable privacy controls.

## Immediate next actions
- Inspect Vercel projects and select canonical destination.
- Confirm ownership and configuration of the current PostgreSQL database.
- Create dedicated Academy Supabase project after capacity/billing review.
- Produce dependency map and PR with code/config changes; do not merge or deploy until checks pass.

Evidence: repository README.md; docs/xpex/deploy-strategy.md; vercel.json; apps/web/vercel.json; PRs #248, #249, #252.
