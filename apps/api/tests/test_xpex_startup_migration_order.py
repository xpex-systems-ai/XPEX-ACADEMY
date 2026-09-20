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


def test_assessment_schema_repair_bootstraps_only_a_demonstrably_fresh_database():
    repo_root = Path(__file__).resolve().parents[3]
    repair = (
        repo_root / "apps" / "api" / "scripts" / "xpex_assessment_schema_ready.py"
    ).read_text()

    table_probe = "table_name = 'assignment'"
    bootstrap = "SQLModel.metadata.create_all"
    required_tables = 'required_tables = ("assignment", "user", "organization")'

    assert table_probe in repair
    assert bootstrap in repair
    assert required_tables in repair
    assert repair.index(table_probe) < repair.index(bootstrap)
    assert "CREATE EXTENSION IF NOT EXISTS vector" in repair
    assert "XPEX_DB_BOOTSTRAP PASS core_schema=true" in repair


def test_course001_production_prepare_is_explicit_and_runs_after_course_bootstrap():
    repo_root = Path(__file__).resolve().parents[3]
    start_script = (repo_root / "docker" / "start.sh").read_text()

    course_bootstrap = "XPEX_LAUNCH course bootstrap requested"
    prepare_gate = "XPEX_COURSE001_PREPARE_ON_START:-0"
    prepare_script = "scripts/xpex_course001_prepare.py"
    enrollment = "XPEX_OPS bootstrap requested"

    assert prepare_gate in start_script
    assert prepare_script in start_script
    assert start_script.index(course_bootstrap) < start_script.index(prepare_gate)
    assert start_script.index(prepare_gate) < start_script.index(prepare_script)
    assert start_script.index(prepare_script) < start_script.index(enrollment)
