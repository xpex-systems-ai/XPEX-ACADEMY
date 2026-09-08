from pathlib import Path

from scripts.xpex_first_student_flow import CERTIFICATE_MARKER


def test_first_flow_bootstrap_has_stable_certificate_marker():
    assert CERTIFICATE_MARKER == "xpex-first-flow-v1"


def test_first_flow_bootstrap_covers_standard_student_path():
    script = (
        Path(__file__).resolve().parents[1]
        / "scripts"
        / "xpex_first_student_flow.py"
    ).read_text()
    assert "launch_course(org_slug, execute, author_uuid)" in script
    assert "ensure_enrollment(" in script
    assert "assessment=true grading=server passing_score=70" in script
    assert "player_route=true certificate_hook=true" in script
    assert "professional_video_assets_pending=true" in script


def test_startup_runs_first_flow_when_controlled_enrollment_bootstrap_is_enabled():
    start = (Path(__file__).resolve().parents[3] / "docker" / "start.sh").read_text()
    assert "XPEX_FIRST_STUDENT_FLOW_ON_START" in start
    assert "scripts/xpex_first_student_flow.py --execute" in start
