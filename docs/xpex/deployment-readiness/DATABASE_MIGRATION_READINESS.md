# Database Migration Readiness

## Findings

- API uses SQLModel/SQLAlchemy with `LEARNHOUSE_SQL_CONNECTION_STRING` and Alembic configuration in `apps/api/alembic.ini`.
- `pgvector` is a Python dependency, so AI/RAG features may require PostgreSQL vector support depending on enabled migrations/features.
- Health check executes `SELECT 1`, so staging health depends on a reachable database.
- No remote migration was executed in this mission.

## Safe staging sequence

1. Provision managed PostgreSQL with backups enabled.
2. Store connection string only in Railway API secrets.
3. Run migrations as a separate one-off/manual operation after backup verification.
4. Verify `/api/v1/health` returns success.
5. Record rollback plan: restore backup or apply Alembic downgrade only if downgrade scripts are verified.

## Blockers before migration

- Confirm exact migration command for Railway run context.
- Confirm pgvector extension requirement for the selected staging feature set.
- Confirm backup/restore procedure and restricted credentials.
