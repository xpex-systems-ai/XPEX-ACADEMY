from pathlib import Path

from scripts.xpex_launch_course import COURSE_NAME, COURSE_SLUG, MODULES


def test_first_ai_course_manifest_is_complete_and_unique():
    assert COURSE_NAME == "Inteligência Artificial — do Básico ao Avançado"
    assert COURSE_SLUG == "ia-do-basico-ao-avancado"
    assert len(MODULES) == 11
    assert len({name for name, _ in MODULES}) == len(MODULES)
    assert len({filename for _, filename in MODULES}) == len(MODULES)


def test_every_launch_module_has_versioned_markdown_content():
    repo_root = Path(__file__).resolve().parents[3]
    content_root = repo_root / "docs" / "courses" / COURSE_SLUG
    missing = [filename for _, filename in MODULES if not (content_root / filename).is_file()]
    assert missing == []
