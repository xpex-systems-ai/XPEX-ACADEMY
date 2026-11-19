# Academy API and Alembic runtime audit

Source inspected: apps/api/migrations/env.py, apps/api/alembic.ini, apps/api/pyproject.toml, apps/api/Dockerfile and apps/api/config/config.py on dev.

## Confirmed
- Alembic env.py reads `LEARNHOUSE_SQL_CONNECTION_STRING` and converts `postgresql+asyncpg://` to `postgresql://` for synchronous migrations.
- The checked-in alembic.ini contains a localhost fallback. It must never be used to target the new Supabase database accidentally.
- Alembic imports SQLModel metadata dynamically from src/db and runs migrations using a synchronous SQLAlchemy engine.
- API runtime uses Python 3.14.3 and a Docker image with ffmpeg, espeak-ng and uv. A generic Vercel frontend deployment cannot replace this container runtime.
- FastAPI dependencies include Redis, asyncpg, psycopg2, pgvector and background-related capabilities.

## Required preflight before any DDL
1. Inventory Alembic revision graph under apps/api/migrations/versions, including extensions and SQL privileges.
2. Locate source PostgreSQL, identify live users/tenants and verify encrypted backup and restore.
3. Validate Supabase connection using a server-side secret only. Do not place database passwords or service-role keys in NEXT_PUBLIC variables.
4. Verify extensions, connection pool compatibility and whether migrations assume public-schema ownership or superuser permissions.
5. Run Alembic upgrade against disposable staging with explicit environment URL; inspect resulting schema and permissions.
6. Verify role-based access and Polo Kelle tenant isolation before importing student records.
7. Choose container-compatible API hosting and Redis before Vercel preview smoke tests.

Current state: migration preflight only. No DDL applied, no credentials retrieved, no production changes.
