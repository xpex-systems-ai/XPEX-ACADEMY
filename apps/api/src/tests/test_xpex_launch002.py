from src.services.xpex.launch002 import build_launch002_course


def test_launch002_course_has_exactly_six_modules_and_twenty_four_lessons():
    draft = build_launch002_course()

    assert draft.title == "Criação de Sites Profissionais — do Zero ao Deploy"
    assert len(draft.modules) == 6
    assert sum(len(module.lessons) for module in draft.modules) == 24
    assert all(len(module.lessons) == 4 for module in draft.modules)
    assert draft.publication_status == "DRAFT"


def test_launch002_lessons_are_practical_and_assessable():
    draft = build_launch002_course()

    for module in draft.modules:
        assert module.lab
        assert module.evidence
        for lesson in module.lessons:
            assert len(lesson.objective) >= 12
            assert len(lesson.explanation) >= 40
            assert len(lesson.practice) >= 20
            assert len(lesson.assessment) >= 20
            assert "MDN Web Docs" in lesson.resource_suggestions
