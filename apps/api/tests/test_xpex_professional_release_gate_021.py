from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FACTORY = ROOT / "src" / "services" / "xpex" / "course_factory.py"


def test_professional_course_stays_private_until_all_videos_publish() -> None:
    source = FACTORY.read_text(encoding="utf-8")

    assert 'FACTORY_KEY = "XPEX-AI-COURSE-FACTORY-021"' in source
    assert "await _set_student_visibility(" in source
    assert "course_uuid,\n        False," in source
    assert "await create_video_batch" in source
    assert source.index("course_uuid,\n        False,") < source.index("await create_video_batch")
    assert "if all_published:" in source
    assert "course_uuid,\n            True," in source
    assert "The course remains private" in source


def test_factory_keeps_explicit_human_video_gate() -> None:
    source = FACTORY.read_text(encoding="utf-8")

    assert 'job.state == "AWAITING_HUMAN_APPROVAL"' in source
    assert "approve_video_job" not in source
    assert "attach_video_job" not in source
    assert "publish_video_job" not in source
