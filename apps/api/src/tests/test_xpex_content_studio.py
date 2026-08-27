import pytest
from pydantic import ValidationError

from src.services.xpex.content_studio import (
    CourseDraft,
    CourseStudioNotConfigured,
    CourseStudioProviderError,
    generate_course_draft,
    review_course_draft,
)


SAMPLE_DRAFT = {
    "title": "Inteligência Artificial Aplicada",
    "description": "Curso prático para compreender fundamentos, aplicar IA e construir um projeto demonstrável com responsabilidade.",
    "audience": "Iniciantes e profissionais que desejam aplicar IA em problemas reais.",
    "prerequisites": ["Conhecimentos básicos de internet"],
    "learning_outcomes": [
        "Compreender fundamentos de IA",
        "Aplicar IA em fluxos reais",
        "Construir um projeto verificável",
    ],
    "modules": [
        {
            "title": "Fundamentos",
            "outcome": "Entender conceitos centrais e limites de sistemas de IA.",
            "lessons": [
                {
                    "title": "O que é IA",
                    "objective": "Distinguir IA, machine learning e IA generativa em situações práticas.",
                    "explanation": "A aula apresenta os conceitos fundamentais, diferenças entre abordagens e os limites que exigem validação humana em aplicações reais.",
                    "practice": "Classifique três tarefas reais e descreva qual abordagem de IA faria sentido em cada uma.",
                    "assessment": "Entregue uma tabela justificando a classificação e identifique um risco por caso.",
                    "resource_suggestions": ["Documentação oficial e material curado pelo instrutor"],
                }
            ],
            "lab": "Mapeie um problema real, defina entrada, saída, riscos, validação humana e evidência de sucesso.",
            "evidence": "Documento com o problema, critérios de sucesso, riscos e proposta de validação.",
        }
    ],
    "final_project": "Construir e demonstrar uma solução simples de IA com problema, arquitetura, execução, testes, riscos e evidências.",
    "publication_status": "DRAFT",
}


@pytest.mark.asyncio
async def test_openrouter_requires_server_side_key(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    with pytest.raises(CourseStudioNotConfigured):
        await generate_course_draft("IA", "Iniciantes")


@pytest.mark.asyncio
async def test_huggingface_requires_server_side_key(monkeypatch):
    monkeypatch.delenv("HF_TOKEN", raising=False)
    draft = CourseDraft.model_validate(SAMPLE_DRAFT)
    with pytest.raises(CourseStudioNotConfigured):
        await review_course_draft(draft)


def test_course_draft_is_preview_only():
    draft = CourseDraft.model_validate(SAMPLE_DRAFT)
    assert draft.publication_status == "DRAFT"
    assert draft.modules[0].lessons


def test_course_draft_rejects_invalid_empty_content():
    bad = dict(SAMPLE_DRAFT)
    bad["modules"] = []
    with pytest.raises(ValidationError):
        CourseDraft.model_validate(bad)


def test_provider_errors_do_not_leak_response_body():
    error = CourseStudioProviderError("OpenRouter request failed with HTTP 401")
    assert "401" in str(error)
    assert "token" not in str(error).lower()
