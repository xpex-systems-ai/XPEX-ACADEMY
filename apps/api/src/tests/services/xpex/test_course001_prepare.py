from scripts.xpex_course001_prepare import VIDEO_LESSONS, _video_draft


def test_course001_video_draft_has_welcome_plus_eleven_modules():
    draft = _video_draft()

    assert len(VIDEO_LESSONS) == 12
    assert len(draft.modules) == 12
    assert draft.modules[0].lessons[0].title.startswith("Boas-vindas")
    assert draft.modules[-1].lessons[0].title.startswith("Projeto final")


def test_course001_video_draft_uses_one_lesson_per_video_module():
    draft = _video_draft()

    assert all(len(module.lessons) == 1 for module in draft.modules)
    assert all(module.lessons[0].objective for module in draft.modules)
    assert all(module.lessons[0].practice for module in draft.modules)
    assert all(module.lessons[0].assessment for module in draft.modules)
