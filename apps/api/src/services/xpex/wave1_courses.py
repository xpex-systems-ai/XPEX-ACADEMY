"""Idempotent production factory for the ten private XPeX Core courses.

The factory is deliberately isolated from LearnHouse's legacy course, enrolment,
payment, progress, certificate, and credential tables.  It refuses to run unless
the complete canonical V1 catalog is present and private.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid5

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from src.db.xpex_catalog import (
    XPeXAssessment,
    XPeXAssessmentAttempt,
    XPeXCourse,
    XPeXLesson,
    XPeXModule,
    XPeXSchool,
    XPeXWaveMediaJob,
)
from src.services.xpex.official_catalog import CATALOG_KEY, CATALOG_NAMESPACE

WAVE_KEY = "XPEX-CORE-W1"
CANARY_COURSE_KEY = "XPEX-S02-C01"
CANARY_LESSON_KEY = f"{CANARY_COURSE_KEY}-M01-L01"
MEDIA_STAGES = (
    "SCRIPT_READY", "TTS_READY", "AVATAR_OR_VISUAL_RENDER", "COMPOSITION",
    "CAPTIONS", "MEDIA_QA", "AWAITING_HUMAN_APPROVAL", "APPROVED", "ATTACHED", "PUBLISHED",
)


@dataclass(frozen=True)
class CourseSpec:
    key: str
    audience: str
    outcome: str
    modules: tuple[tuple[str, tuple[str, str, str, str]], ...]


def _course(key: str, audience: str, outcome: str, modules: dict[str, tuple[str, str, str, str]]) -> CourseSpec:
    return CourseSpec(key, audience, outcome, tuple(modules.items()))


WAVE1_COURSES = (
    _course("XPEX-S01-C01", "Pessoas com pouca ou nenhuma experiência digital", "Usar computador, arquivos, internet e ferramentas essenciais com autonomia e segurança", {
        "Primeiros passos no computador": ("Conhecendo o computador", "Mouse, teclado e atalhos", "Sistema operacional e janelas", "Configurações de acessibilidade"),
        "Arquivos e organização": ("Pastas e caminhos", "Criar, mover e renomear", "Downloads e formatos", "Backup básico"),
        "Internet essencial": ("Navegador e endereços", "Pesquisa confiável", "Formulários e downloads seguros", "Comunicação por e-mail"),
        "Rotina digital autônoma": ("Documentos simples", "Planilhas simples", "Nuvem e compartilhamento", "Projeto: estação digital organizada"),
    }),
    _course("XPEX-S01-C03", "Usuários cotidianos de serviços digitais", "Proteger contas, dispositivos e dados pessoais e reagir a incidentes comuns", {
        "Riscos digitais": ("Ameaças do cotidiano", "Engenharia social", "Phishing na prática", "Privacidade e pegada digital"),
        "Proteção de contas": ("Senhas fortes", "Gerenciadores de senha", "Autenticação em dois fatores", "Recuperação segura"),
        "Proteção de dispositivos": ("Atualizações e antivírus", "Redes Wi-Fi", "Permissões de aplicativos", "Backup protegido"),
        "Resposta responsável": ("Reconhecer um incidente", "Conter e registrar", "LGPD no cotidiano", "Projeto: plano pessoal de proteção"),
    }),
    _course("XPEX-S02-C01", "Iniciantes curiosos sobre inteligência artificial", "Compreender fundamentos de IA e usar ferramentas generativas com senso crítico e responsabilidade", {
        "Fundamentos de IA": ("O que é inteligência artificial", "Como modelos aprendem", "IA generativa e modelos de linguagem", "Limites, erros e alucinações"),
        "Primeiras interações": ("Anatomia de um bom pedido", "Contexto e exemplos", "Iteração e refinamento", "Verificação de respostas"),
        "Aplicações responsáveis": ("IA nos estudos", "IA no trabalho", "Privacidade e dados", "Viés, autoria e ética"),
        "Projeto orientado": ("Definir um problema", "Desenhar um fluxo com IA", "Testar e documentar", "Projeto: solução assistida por IA"),
    }),
    _course("XPEX-S02-C02", "Pessoas que desejam produtividade prática com ChatGPT", "Planejar, redigir, analisar e revisar tarefas reais com ChatGPT de modo verificável", {
        "Uso consciente": ("Interface e capacidades", "Pedidos claros", "Contexto sem dados sensíveis", "Checagem de fatos"),
        "Texto e comunicação": ("Rascunhos profissionais", "Revisão e tom", "Resumo responsável", "Brainstorming estruturado"),
        "Análise e produtividade": ("Organizar informações", "Criar planos", "Trabalhar com tabelas", "Rotinas reutilizáveis"),
        "Fluxo profissional": ("Criar um prompt-base", "Avaliar qualidade", "Revisar com critérios", "Projeto: assistente de produtividade"),
    }),
    _course("XPEX-S02-C06", "Usuários de IA que precisam de resultados consistentes", "Projetar, testar e documentar prompts robustos para tarefas delimitadas", {
        "Fundamentos de prompting": ("Objetivo e contexto", "Instruções e restrições", "Formato de saída", "Exemplos de referência"),
        "Técnicas de construção": ("Decomposição de tarefas", "Papéis e perspectivas", "Critérios de qualidade", "Perguntas de esclarecimento"),
        "Teste e segurança": ("Casos de teste", "Avaliação comparativa", "Injeção e dados sensíveis", "Falhas e mitigação"),
        "Sistema de prompts": ("Templates reutilizáveis", "Versionamento", "Métricas e revisão", "Projeto: biblioteca validada"),
    }),
    _course("XPEX-S02-C09", "Estudantes e educadores iniciantes em IA", "Usar IA para planejar, compreender, praticar e revisar sem terceirizar a aprendizagem", {
        "Aprender com autonomia": ("Metas de aprendizagem", "Diagnóstico de conhecimentos", "Plano de estudos", "Uso ético e autoria"),
        "Compreender conteúdos": ("Explicações graduais", "Analogias verificáveis", "Leitura ativa", "Notas e mapas conceituais"),
        "Praticar e receber feedback": ("Perguntas socráticas", "Exercícios personalizados", "Feedback por rubrica", "Revisão espaçada"),
        "Projeto de aprendizagem": ("Escolher uma competência", "Montar trilha assistida", "Medir evolução", "Projeto: diário de aprendizagem"),
    }),
    _course("XPEX-S03-C01", "Iniciantes sem experiência em programação", "Resolver problemas simples com algoritmos, decisões, repetições e decomposição", {
        "Pensamento computacional": ("Problemas e algoritmos", "Entrada, processo e saída", "Variáveis e tipos", "Operadores e expressões"),
        "Controle de fluxo": ("Condições", "Condições compostas", "Repetições contadas", "Repetições condicionais"),
        "Estruturas e funções": ("Listas e coleções", "Percorrendo dados", "Funções", "Depuração sistemática"),
        "Solução completa": ("Decompor requisitos", "Escrever pseudocódigo", "Testar casos", "Projeto: algoritmo funcional"),
    }),
    _course("XPEX-S03-C05", "Criadores iniciantes que querem programar com assistência de IA", "Construir e validar uma pequena aplicação mantendo entendimento e controle técnico", {
        "Base do vibe coding": ("O que é vibe coding", "Escopo e critérios", "Escolha da stack", "Ambiente e versionamento"),
        "Construção assistida": ("Prompt de implementação", "Mudanças pequenas", "Ler código gerado", "Executar e observar"),
        "Qualidade e segurança": ("Depurar com evidências", "Testes essenciais", "Secrets e dependências", "Revisão humana"),
        "Entrega controlada": ("Polimento de interface", "Documentação", "Checklist de deploy", "Projeto: miniaplicação com IA"),
    }),
    _course("XPEX-S05-C01", "Iniciantes que precisam comunicar visualmente", "Criar peças digitais legíveis, consistentes e adequadas ao público e ao canal", {
        "Fundamentos visuais": ("Objetivo e público", "Hierarquia visual", "Cor e contraste", "Tipografia legível"),
        "Composição": ("Alinhamento e grade", "Espaço e equilíbrio", "Imagens e recortes", "Consistência de marca"),
        "Produção digital": ("Formatos e resolução", "Peças para redes", "Apresentações", "Acessibilidade visual"),
        "Projeto de design": ("Briefing", "Esboço e referências", "Feedback e iteração", "Projeto: kit visual coerente"),
    }),
    _course("XPEX-S09-C02", "Pessoas em transição ou busca de oportunidades", "Apresentar competências e experiências com clareza usando IA sem inventar qualificações", {
        "Identidade profissional": ("Objetivos de carreira", "Inventário de experiências", "Competências e evidências", "Proposta de valor"),
        "Narrativa autêntica": ("Resumo profissional", "Resultados e contexto", "Tom e palavras-chave", "IA sem fabricação"),
        "Presença digital": ("Currículo direcionado", "Perfil online", "Portfólio de evidências", "Privacidade e reputação"),
        "Plano de posicionamento": ("Analisar uma oportunidade", "Adaptar apresentação", "Revisão por critérios", "Projeto: perfil profissional completo"),
    }),
)


def _lesson_payload(course: XPeXCourse, module_title: str, title: str, lesson_key: str, prior: str | None) -> dict:
    objective = f"Aplicar {title.lower()} no contexto de {course.title}, explicando decisões e verificando o resultado."
    return {
        "learning_objective": objective,
        "prerequisites_json": [prior] if prior else ["Nenhum conhecimento técnico prévio"],
        "lesson_script": f"Abertura: conecte {title.lower()} a uma situação real. Demonstração: apresente o conceito em etapas, explicite limites e modele uma verificação. Prática guiada: o estudante executa uma tarefa curta. Fechamento: recapitule o objetivo, os cuidados e o próximo passo em {module_title}.",
        "summary": f"Conceitos essenciais e aplicação responsável de {title.lower()}, com verificação por evidências.",
        "exercise_json": {"prompt": f"Descreva como usaria {title.lower()} em um caso real e indique dois critérios para validar o resultado.", "validation": "rubric", "rubric": ["aplicação coerente", "dois critérios observáveis"]},
        "practical_activity_json": {"instructions": f"Produza uma evidência prática de {title.lower()}, registre as etapas e revise-a com os critérios da aula.", "deliverable": f"registro-{lesson_key.lower()}", "estimated_minutes": 20},
        "completion_criteria_json": ["atividade enviada", "etapas documentadas", "critérios de validação atendidos"],
        "media_json": {"video_job_id": None, "video_status": "NOT_REQUESTED", "captions": None, "transcript": None, "thumbnail": None, "support_material": None},
        "optional_resources_json": {"ai_lab_prompt": f"Atue como tutor: faça perguntas para eu revisar meu trabalho sobre {title}, sem entregar a resposta.", "downloadable_resource": None, "portfolio_artifact": "practical_activity"},
    }


async def verify_wave1_preflight(db_session: AsyncSession) -> dict[str, int]:
    schools = (await db_session.execute(select(XPeXSchool))).scalars().all()
    courses = (await db_session.execute(select(XPeXCourse).where(XPeXCourse.catalog_version == CATALOG_KEY))).scalars().all()
    if len(schools) != 9 or len(courses) != 156:
        raise RuntimeError(f"STOP: canonical catalog shape is {len(schools)} schools/{len(courses)} courses")
    if any(c.lifecycle_status != "CATALOG_REGISTERED" for c in courses):
        raise RuntimeError("STOP: official course lifecycle is not CATALOG_REGISTERED")
    if any(c.publication_status != "PRIVATE" for c in courses):
        raise RuntimeError("STOP: an official course is not PRIVATE")
    expected = {spec.key for spec in WAVE1_COURSES}
    if {c.course_key for c in courses if c.course_key in expected} != expected:
        raise RuntimeError("STOP: one or more Wave 1 canonical courses are missing")
    return {"schools": 9, "courses": 156}


async def seed_wave1_courses(db_session: AsyncSession) -> dict[str, object]:
    """Create curriculum drafts only after the strict catalog gate passes."""
    await verify_wave1_preflight(db_session)
    counts: dict[str, dict[str, int]] = {}
    for spec in WAVE1_COURSES:
        course = (await db_session.execute(select(XPeXCourse).where(XPeXCourse.course_key == spec.key))).scalars().one()
        course.blueprint_json = {"wave": WAVE_KEY, "template": "FOUNDATION", "objective": spec.outcome, "target_audience": spec.audience, "prerequisites": ["Acesso a um dispositivo conectado", "Disponibilidade para atividades práticas"], "final_competencies": [spec.outcome, "Validar resultados com critérios", "Agir com segurança, ética e autonomia"], "modules": 4, "lessons": 16, "project": 1, "final_assessment": 1}
        course.level, course.course_type, course.qa_status = "FOUNDATION", "OFFICIAL", "AWAITING_HUMAN_APPROVAL"
        db_session.add(course)
        await db_session.flush()
        prior: str | None = None
        module_rows: list[XPeXModule] = []
        for module_order, (module_title, lesson_titles) in enumerate(spec.modules, 1):
            module_key = f"{spec.key}-M{module_order:02d}"
            module = (await db_session.execute(select(XPeXModule).where(XPeXModule.module_key == module_key))).scalars().first()
            if module is None:
                module = XPeXModule(module_key=module_key, course_id=int(course.id), title=module_title, display_order=module_order)
                db_session.add(module)
                await db_session.flush()
            else:
                module.title, module.display_order, module.status = module_title, module_order, "DRAFT"
            module_rows.append(module)
            for lesson_order, title in enumerate(lesson_titles, 1):
                lesson_key = f"{module_key}-L{lesson_order:02d}"
                lesson = (await db_session.execute(select(XPeXLesson).where(XPeXLesson.lesson_key == lesson_key))).scalars().first()
                payload = _lesson_payload(course, module_title, title, lesson_key, prior)
                if lesson is None:
                    lesson = XPeXLesson(lesson_key=lesson_key, module_id=int(module.id), title=title, display_order=lesson_order, **payload)
                    db_session.add(lesson)
                else:
                    lesson.title, lesson.display_order, lesson.status = title, lesson_order, "DRAFT"
                    for field, value in payload.items():
                        setattr(lesson, field, value)
                prior = lesson_key
        for order, module in enumerate(module_rows, 1):
            key = f"{spec.key}-A-M{order:02d}"
            assessment = (await db_session.execute(select(XPeXAssessment).where(XPeXAssessment.assessment_key == key))).scalars().first()
            question = {"question_key": f"{key}-Q01", "objective_key": f"{spec.key}-M{order:02d}-L01", "prompt": f"Qual evidência melhor demonstra domínio do módulo {module.title}?", "options": ["Uma entrega prática revisada por critérios", "Apenas marcar todas as aulas", "Copiar uma resposta sem verificar"], "correct_index": 0, "feedback": "A evidência deve resultar de prática e validação."}
            if assessment is None:
                db_session.add(XPeXAssessment(assessment_key=key, course_id=int(course.id), module_id=int(module.id), assessment_type="MODULE_CHECK", display_order=order, objective_keys_json=[question["objective_key"]], questions_json=[question]))
            else:
                assessment.questions_json = [question]
        final_key = f"{spec.key}-A-FINAL"
        final = (await db_session.execute(select(XPeXAssessment).where(XPeXAssessment.assessment_key == final_key))).scalars().first()
        final_questions = [{"question_key": f"{final_key}-Q{i:02d}", "objective_key": f"{spec.key}-M{i:02d}-L04", "prompt": f"No projeto final, qual ação valida a competência do módulo {i}?", "options": ["Produzir, documentar e revisar a evidência", "Declarar conclusão sem entrega", "Ignorar os critérios"], "correct_index": 0, "feedback": "Conclusão exige evidência verificável."} for i in range(1, 5)]
        if final is None:
            db_session.add(XPeXAssessment(assessment_key=final_key, course_id=int(course.id), assessment_type="FINAL", display_order=5, objective_keys_json=[q["objective_key"] for q in final_questions], questions_json=final_questions, passing_score=70, max_attempts=3))
        else:
            final.questions_json = final_questions
        counts[spec.key] = {"modules": 4, "lessons": 16, "assessments": 5}
    await db_session.commit()
    return {"wave": WAVE_KEY, "courses": counts, "publication_status": "PRIVATE"}


async def create_controlled_video_job(db_session: AsyncSession, provider: str) -> XPeXWaveMediaJob:
    """Create the sole canary job; execution and human approval are separate operations."""
    await verify_wave1_preflight(db_session)
    existing_jobs = (await db_session.execute(select(XPeXWaveMediaJob))).scalars().all()
    lesson = (await db_session.execute(select(XPeXLesson).where(XPeXLesson.lesson_key == CANARY_LESSON_KEY))).scalars().first()
    if lesson is None:
        raise RuntimeError("Wave 1 curriculum must be seeded before the canary")
    if existing_jobs:
        if len(existing_jobs) != 1 or existing_jobs[0].lesson_id != lesson.id:
            raise RuntimeError("STOP: controlled gate permits exactly one Wave 1 media job")
        return existing_jobs[0]
    job = XPeXWaveMediaJob(job_id=f"xpw1_{uuid5(CATALOG_NAMESPACE, CANARY_LESSON_KEY).hex}", lesson_id=int(lesson.id), provider=provider, status="SCRIPT_READY", artifact_json={}, qa_json={})
    db_session.add(job)
    lesson.media_json = {**lesson.media_json, "video_job_id": job.job_id, "video_status": "SCRIPT_READY"}
    await db_session.commit()
    return job


async def submit_assessment(db_session: AsyncSession, *, assessment_key: str, learner_key: str, answers: list[int]) -> XPeXAssessmentAttempt:
    """Validate answers and durably score one bounded retry without faking completion."""
    assessment = (await db_session.execute(select(XPeXAssessment).where(XPeXAssessment.assessment_key == assessment_key))).scalars().first()
    if assessment is None:
        raise ValueError("assessment not found")
    questions = assessment.questions_json
    if len(answers) != len(questions) or any(not isinstance(answer, int) for answer in answers):
        raise ValueError("one integer answer is required for every question")
    previous = (await db_session.execute(select(XPeXAssessmentAttempt).where(XPeXAssessmentAttempt.assessment_id == assessment.id, XPeXAssessmentAttempt.learner_key == learner_key).order_by(XPeXAssessmentAttempt.attempt_number.desc()))).scalars().first()
    attempt_number = 1 if previous is None else previous.attempt_number + 1
    if attempt_number > assessment.max_attempts:
        raise PermissionError("assessment retry limit reached")
    correct = sum(answer == question["correct_index"] for answer, question in zip(answers, questions, strict=True))
    score = round(correct * 100 / len(questions))
    attempt = XPeXAssessmentAttempt(assessment_id=int(assessment.id), learner_key=learner_key, attempt_number=attempt_number, answers_json=answers, score=score, passed=score >= assessment.passing_score, submitted_at=datetime.now(UTC).isoformat())
    db_session.add(attempt)
    await db_session.commit()
    return attempt


def validate_media_qa(*, artifact: dict, qa: dict) -> None:
    required_artifact = {"uri", "checksum_sha256", "mime_type", "duration_seconds", "captions_uri"}
    required_qa = {"file_valid", "audio_valid", "duration_valid", "playback_valid", "captions_valid"}
    if not required_artifact <= artifact.keys() or not required_qa <= qa.keys() or not all(qa[k] is True for k in required_qa):
        raise ValueError("media QA cannot pass without a valid file, audio, duration, playback, and captions")
    if artifact["mime_type"] not in {"video/mp4", "video/webm"} or artifact["duration_seconds"] <= 0:
        raise ValueError("media artifact has invalid type or duration")


def next_media_status(current: str, requested: str, *, artifact: dict | None = None, qa: dict | None = None) -> str:
    """Enforce ordered stages and stop automation at the mandatory human gate."""
    if current not in MEDIA_STAGES or requested not in MEDIA_STAGES:
        raise ValueError("unknown media status")
    if MEDIA_STAGES.index(requested) != MEDIA_STAGES.index(current) + 1:
        raise ValueError("media stages cannot be skipped")
    if requested == "AWAITING_HUMAN_APPROVAL":
        validate_media_qa(artifact=artifact or {}, qa=qa or {})
    if current == "AWAITING_HUMAN_APPROVAL":
        raise PermissionError("SUPER_ADMIN human approval is required")
    return requested
