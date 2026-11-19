# XPeX Academy — dedicated Supabase environment
Verified via connected Supabase project API:
- Project: xpex-academy
- Ref: krvoedwbdnvoziiaavwp
- URL: https://krvoedwbdnvoziiaavwp.supabase.co
- Region: us-east-1; PostgreSQL 17; ACTIVE_HEALTHY
- public schema: zero tables at inspection.

## Migration rules
Do not invent a new academic schema. This repository uses FastAPI, SQLModel and Alembic migrations under apps/api. Inspect migration history and existing source database, then migrate only after encrypted backup and restore testing.
Never commit database credentials. The checked-in apps/api/alembic.ini has a localhost development URL, not a production credential.
Preserve Firebase Analytics, Remote Config and App Check, with privacy controls for minors.
Supabase Postgres does not replace FastAPI, Redis, background jobs or realtime collaboration.

## Gates
- [x] Dedicated project healthy and public schema inspected
- [ ] Source DB backup and restore verified
- [ ] Alembic migrations inventoried and tested
- [ ] API runtime, Redis, storage and email validated
- [ ] Canonical Vercel project and preview build validated
- [ ] Polo Kelle teacher/student E2E and tenant isolation passed
- [ ] Production cutover approved with rollback plan

No database schema changes or student data movement were performed.