from src.db.xpex_editorial import XPeXEditorialDraft
from src.services.xpex.content_studio import (
    CourseDraft,
    CourseDraftReview,
    LessonDraft,
    ModuleDraft,
    ReviewNote,
)
from src.services.xpex.editorial_studio import (
    _clear_review_and_approval,
    draft_content_hash,
    review_has_blocker,
)


def _sample_draft() -> CourseDraft:
    return CourseDraft(
        title="Fundamentos de Inteligência Artificial Aplicada",
        description=(
            "Curso introdutório e prático para compreender fundamentos de IA e aplicar "
            "conceitos em problemas reais com responsabilidade."
        ),
        audience="Alunos iniciantes da XPeX Academy interessados em aplicações práticas de IA.",
        prerequisites=[],
        learning_outcomes=[
            "Explicar conceitos fundamentais de inteligência artificial",
            "Aplicar uma técnica de IA em um problema prático",
            "Avaliar limitações, riscos e evidências de uma solução de IA",
        ],
        modules=[
            ModuleDraft(
                title="Módulo 1 — Fundamentos e prática",
                outcome="Compreender os fundamentos e produzir uma primeira aplicação prática verificável.",
                lessons=[
                    LessonDraft(
                        title="Aula 1 — Como a IA aprende",
                        objective="Compreender como dados, modelos e inferência se relacionam em uma solução de IA.",
                        explanation=(
                            "A aula apresenta a relação entre dados, treinamento, modelo e inferência, "
                            "destacando limites e a necessidade de validar resultados com evidências."
                        ),
                        practice="Comparar duas respostas de IA e registrar critérios objetivos de qualidade.",
                        assessment="Produzir uma explicação curta identificando entradas, modelo, saída e risco principal.",
                        resource_suggestions=["Documentação técnica oficial do modelo escolhido"],
                    )
                ],
                lab="Construir e documentar um pequeno experimento de IA com entradas, saídas e critérios de avaliação.",
                evidence="Entregar o artefato do experimento e uma análise objetiva dos resultados observados.",
            )
        ],
        final_project=(
            "Criar uma solução simples de IA para um problema real, documentando objetivo, dados, método, "
            "resultado, riscos, limitações e evidências de funcionamento."
        ),
    )


def _record() -> XPeXEditorialDraft:
    draft = _sample_draft()
    content_hash = draft_content_hash(draft)
    return XPeXEditorialDraft(
        draft_id="xped_test",
        org_id=1,
        created_by_user_id=1,
        status="APPROVED",
        publication_state="IDLE",
        revision=3,
        content_hash=content_hash,
        topic="Inteligência Artificial",
        audience=draft.audience,
        module_count=1,
        draft_json=draft.model_dump(mode="json"),
        review_json={"provider": "huggingface", "notes": []},
        generated_by="openrouter",
        reviewed_by="huggingface",
        reviewed_revision=3,
        reviewed_content_hash=content_hash,
        reviewed_at="2026-08-27T00:00:00+00:00",
        approved_by_user_id=1,
        approved_revision=3,
        approved_content_hash=content_hash,
        approved_at="2026-08-27T00:01:00+00:00",
        created_at="2026-08-27T00:00:00+00:00",
        updated_at="2026-08-27T00:01:00+00:00",
    )


def test_editorial_hash_is_stable_and_changes_for_meaningful_edit() -> None:
    original = _sample_draft()
    same = CourseDraft.model_validate(original.model_dump())
    edited = CourseDraft.model_validate(original.model_dump())
    edited.description += " Inclui um novo critério editorial verificável."

    assert draft_content_hash(original) == draft_content_hash(same)
    assert draft_content_hash(original) != draft_content_hash(edited)


def test_review_blocker_gate_only_blocks_blocker_severity() -> None:
    warning = CourseDraftReview(
        notes=[ReviewNote(severity="WARNING", area="Sequência", note="Revisar a ordem de dois conceitos do módulo.")]
    )
    blocker = CourseDraftReview(
        notes=[ReviewNote(severity="BLOCKER", area="Segurança", note="Remover uma instrução insegura antes da aprovação.")]
    )

    assert review_has_blocker(None) is False
    assert review_has_blocker(warning) is False
    assert review_has_blocker(blocker) is True


def test_edit_invalidation_clears_review_and_approval_evidence() -> None:
    record = _record()

    _clear_review_and_approval(record)

    assert record.status == "DRAFT"
    assert record.review_json is None
    assert record.reviewed_by is None
    assert record.reviewed_revision is None
    assert record.reviewed_content_hash is None
    assert record.approved_by_user_id is None
    assert record.approved_revision is None
    assert record.approved_content_hash is None
    assert record.approved_at is None
