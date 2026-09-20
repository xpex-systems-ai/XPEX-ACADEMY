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


def test_wave1_media_canary_is_opt_in_on_startup():
    repo_root = Path(__file__).resolve().parents[3]
    start_script = (repo_root / "docker" / "start.sh").read_text()

    assert 'XPEX_WAVE1_MEDIA_CANARY_ON_START:-0' in start_script
    assert 'XPEX-WAVE1-MEDIA-CANARY disabled by default' in start_script
    gate_index = start_script.index('XPEX_WAVE1_MEDIA_CANARY_ON_START:-0')
    diagnostic_index = start_script.index('scripts/xpex_wave1_media_canary_diagnostic_041.py')
    resume_index = start_script.index('scripts/xpex_wave1_media_canary_final_043.py --execute')
    assert gate_index < diagnostic_index < resume_index
