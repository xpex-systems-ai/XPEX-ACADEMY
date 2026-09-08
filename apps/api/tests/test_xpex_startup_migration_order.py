from pathlib import Path


def test_startup_runs_scoped_schema_repair_before_xpex_bootstraps():
    repo_root = Path(__file__).resolve().parents[3]
    start_script = (repo_root / "docker" / "start.sh").read_text()

    migration = "scripts/xpex_assessment_schema_ready.py"
    first_course = "XPEX_LAUNCH course bootstrap requested"
    enrollment = "XPEX_OPS bootstrap requested"
    first_flow = "XPEX_FIRST_FLOW bootstrap requested"

    assert migration in start_script
    assert "XPEX_DB_MIGRATION BLOCKED assessment_schema_ready=false" in start_script
    assert ".venv/bin/alembic upgrade head" not in start_script
    assert start_script.index(migration) < start_script.index(first_course)
    assert start_script.index(migration) < start_script.index(enrollment)
    assert start_script.index(migration) < start_script.index(first_flow)


def test_schema_repair_is_scoped_to_assignment_passing_score():
    repo_root = Path(__file__).resolve().parents[3]
    repair = (repo_root / "apps" / "api" / "scripts" / "xpex_assessment_schema_ready.py").read_text()

    assert "assignment.passing_score" in repair
    assert "ADD COLUMN passing_score" in repair
    assert "ck_assignment_passing_score" in repair
    assert "XPEX_DB_MIGRATION PASS assessment_schema_ready=true" in repair
    assert "DELETE FROM" not in repair
    assert "DROP TABLE" not in repair
    assert "UPDATE user" not in repair
