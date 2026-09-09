from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "xpex_professional_course_release.py"


def test_professional_course_is_distinct_and_video_gated() -> None:
    source = SCRIPT.read_text(encoding="utf-8")

    assert 'COURSE_NAME = "Inteligência Artificial Profissional — do Básico ao Avançado"' in source
    assert 'COURSE_SLUG = "inteligencia-artificial-profissional"' in source
    assert 'VIDEO_MAP_ENV = "XPEX_PRO_COURSE_VIDEO_URLS_JSON"' in source
    assert '"DRAFT_VIDEO_PENDING"' in source
    assert '"PUBLISHED_PROFESSIONAL"' in source
    assert "course.published = all_videos_ready" in source
    assert "len(video_map) == len(MODULES)" in source


def test_professional_course_has_real_learning_contract() -> None:
    source = SCRIPT.read_text(encoding="utf-8")

    assert "_ensure_foundations_assessment" in source
    assert "_ensure_certificate" in source
    assert "ActivityTypeEnum.TYPE_VIDEO" in source
    assert "SUBTYPE_VIDEO_YOUTUBE" in source
    assert "SUBTYPE_VIDEO_HOSTED" in source
    assert "for offset, other in enumerate(other_links, start=2)" in source
    assert "professional_video_assets_missing=true" in source
    assert "PASS professional_course_ready=true" in source


def test_video_map_rejects_non_https_and_unknown_modules() -> None:
    source = SCRIPT.read_text(encoding="utf-8")

    assert 'parsed.scheme == "https"' in source
    assert "module < 1 or module > len(MODULES)" in source
    assert "invalid HTTPS video URL" in source
