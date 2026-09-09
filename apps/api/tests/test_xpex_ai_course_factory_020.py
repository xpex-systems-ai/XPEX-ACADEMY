from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FACTORY = ROOT / "src" / "services" / "xpex" / "course_factory.py"


def test_flagship_factory_targets_professional_11_module_course() -> None:
    source = FACTORY.read_text(encoding="utf-8")

    assert 'FACTORY_KEY = "XPEX-AI-COURSE-FACTORY-021"' in source
    assert "Inteligência Artificial Profissional — do Básico ao Avançado" in source
    assert "FLAGSHIP_MODULE_COUNT = 11" in source
    assert "module_count=FLAGSHIP_MODULE_COUNT" in source


def test_video_factory_stops_at_human_approval_boundary() -> None:
    source = FACTORY.read_text(encoding="utf-8")

    assert 'job.state == "AWAITING_HUMAN_APPROVAL"' in source
    assert 'factory_status = "AWAITING_HUMAN_APPROVAL"' in source
    assert "approve_video_job" not in source
    assert "attach_video_job" not in source
    assert "publish_video_job" not in source
    assert "Open Course Studio to inspect, approve" in source
