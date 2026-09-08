from pathlib import Path


def test_startup_runs_alembic_before_xpex_bootstraps():
    repo_root = Path(__file__).resolve().parents[3]
    start_script = (repo_root / "docker" / "start.sh").read_text()

    migration = '.venv/bin/alembic upgrade head'
    first_course = 'XPEX_LAUNCH course bootstrap requested'
    enrollment = 'XPEX_OPS bootstrap requested'
    first_flow = 'XPEX_FIRST_FLOW bootstrap requested'

    assert migration in start_script
    assert 'XPEX_DB_MIGRATION BLOCKED upgrade=head failed' in start_script
    assert start_script.index(migration) < start_script.index(first_course)
    assert start_script.index(migration) < start_script.index(enrollment)
    assert start_script.index(migration) < start_script.index(first_flow)
