#!/usr/bin/env python3
"""Academy migration preflight. Read-only; never migrates or prints credentials.

Run from apps/api after installing API dependencies:
  python ../../scripts/academy_migration_preflight.py
Then, only after reviewing output and a backup/restore test:
  alembic -c alembic.ini upgrade head
"""
from __future__ import annotations
import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlsplit

API_DIR = Path(__file__).resolve().parents[1] / "apps" / "api"


def main() -> int:
    raw = os.getenv("LEARNHOUSE_SQL_CONNECTION_STRING", "")
    if not raw:
        print("BLOCKED: LEARNHOUSE_SQL_CONNECTION_STRING is not set; no database operation performed.")
        return 2
    try:
        url = urlsplit(raw.replace("postgresql+asyncpg://", "postgresql://", 1))
    except ValueError:
        print("BLOCKED: invalid database connection string; value not printed.")
        return 2
    if url.scheme not in {"postgresql", "postgres"} or not url.hostname:
        print("BLOCKED: expected a valid PostgreSQL URL; value not printed.")
        return 2
    if url.hostname in {"localhost", "127.0.0.1", "db"}:
        print("BLOCKED: development database hostname; cannot validate dedicated Supabase.")
        return 2
    if url.hostname not in {"db.krvoedwbdnvoziiaavwp.supabase.co"} and not url.hostname.endswith(".pooler.supabase.com"):
        print("BLOCKED: DB host not recognized as Academy dedicated Supabase. Review manually.")
        return 2
    print("PASS: dedicated Supabase hostname shape confirmed (no credentials displayed).")
    if not (API_DIR / "migrations" / "versions").is_dir():
        print("BLOCKED: Alembic revisions directory missing.")
        return 2
    cmd = [sys.executable, "-m", "alembic", "-c", "alembic.ini", "heads"]
    try:
        result = subprocess.run(cmd, cwd=API_DIR, capture_output=True, text=True, timeout=40)
    except (OSError, subprocess.TimeoutExpired):
        print("BLOCKED: cannot run Alembic heads; check API dependencies.")
        return 2
    if result.returncode != 0:
        print("BLOCKED: Alembic revision validation failed; inspect local logs securely.")
        return 2
    heads = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    print(f"Alembic heads detected: {len(heads)}")
    if len(heads) != 1:
        print("BLOCKED: expected one migration head; review migration graph.")
        return 2
    print("PRECHECK PASS: this does NOT prove migrations are compatible or applied.")
    print("NEXT: inspect migrations, test staging backup/restore, then run upgrade with explicit approval.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
