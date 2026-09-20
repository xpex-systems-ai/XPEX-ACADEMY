"""Prepare XPeX Course 001 for the real-student production gate.

Dry-run by default. With --execute it:
- ensures a welcome chapter/activity;
- ensures checkpoint 2 and checkpoint 3;
- ensures a manually graded final-project assignment;
- creates an internal native-course editorial bridge for Video Studio;
- queues exactly 12 video jobs without calling any media provider.

It never renders video, approves media, attaches media, publishes media, enrolls
students, sends email, or performs payments.
"""

from __future__ import annotations

import argparse
import asyncio
import os
from datetime import UTC, datetime
from uuid import uuid4

from config.config import get_learnhouse_config
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.courses.activities import (
    Activity,
    ActivityLockType,
    ActivitySubTypeEnum,
    ActivityTypeEnum,
)
from src.db.courses.assignments import (
    Assignment,
    AssignmentTask,
    AssignmentTaskTypeEnum,
    GradingTypeEnum,
)
from src.db.courses.chapter_activities import ChapterActivity
from src.db.courses.chapters import Chapter, LockType
from src.db.courses.course_chapters import CourseChapter
from src.db.courses.courses import Course
from src.db.organizations import Organization
from src.db.user_organizations import UserOrganization
from src.db.users import User
from src.db.xpex_editorial import XPeXEditorialDraft
from src.services.xpex.content_studio import CourseDraft, LessonDraft, ModuleDraft
from src.services.xpex.editorial_studio import draft_content_hash
from src.services.xpex.video_factory import VideoBatchPlan
from src.services.xpex.video_jobs import ensure_batch_jobs

COURSE_NAME = "Inteligência Artificial — do Básico ao Avançado"
COURSE_SLUG = "ia-do-basico-ao-avancado"
VIDEO_BRIDGE_ID = "xped_course001_ia_video_v1"
RAW_BASE = (
    "https://raw.githubusercontent.com/xpex-systems-ai/XPEX-ACADEMY/dev/"
    "docs/courses/ia-do-basico-ao-avancado"
)

MODULES = [
    "Fundamentos de Inteligência Artificial",
    "Como funcionam LLMs e IA generativa",
    "Prompt Engineering",
    "Ferramentas de IA para produtividade",
    "Automação com IA",
    "APIs e integrações",
    "RAG e conhecimento privado",
    "Agentes de IA",
    "Construção de projetos reais",
    "IA aplicada a negócios e carreira",
    "Projeto final",
]

VIDEO_LESSONS = [
    (
        "Boas-vindas — como estudar e usar o GX",
        "Entender a jornada do curso, o papel do GX e como produzir evidências reais de aprendizagem.",
        "A formação combina conteúdo, prática, checkpoints, projeto e mentor contextual. O aluno aprende, executa, valida e registra evidências antes de avançar.",
        "Abra o painel do aluno, localize curso, atividades, AI Lab e certificado. Defina um objetivo pessoal para a formação.",
        "Registrar o objetivo de aprendizagem e explicar em uma frase como o GX será usado como mentor, não como substituto da validação humana.",
    ),
    (
        "Fundamentos de Inteligência Artificial",
        "Diferenciar IA, Machine Learning e IA generativa e reconhecer limites de uso.",
        "IA cobre técnicas de percepção, previsão, classificação, geração e decisão. Modelos generativos produzem saídas probabilísticas e podem errar com confiança.",
        "Classifique três tarefas reais por entrada, resultado esperado, risco e necessidade de revisão humana.",
        "Concluir o checkpoint de fundamentos com pelo menos 70%.",
    ),
    (
        "Como funcionam LLMs e IA generativa",
        "Compreender tokens, contexto, inferência e limitações de modelos de linguagem.",
        "LLMs transformam texto em tokens, usam contexto e calculam probabilidades para gerar a próxima saída. Contexto limitado e dados incompletos afetam a resposta.",
        "Compare uma explicação simples e uma técnica de janela de contexto usando o GX.",
        "Explicar o que muda entre treinamento, inferência e contexto da conversa.",
    ),
    (
        "Prompt Engineering",
        "Transformar intenção vaga em instruções avaliáveis e reutilizáveis.",
        "Prompts profissionais explicitam objetivo, contexto, restrições, critérios de qualidade e formato de saída. A qualidade melhora por iteração e teste.",
        "Reescreva um prompt de plano de estudos incluindo nível, tempo, objetivo, prazo e formato.",
        "Entregar um prompt reutilizável com critérios de avaliação explícitos.",
    ),
    (
        "Ferramentas de IA para produtividade",
        "Aplicar IA como copiloto de trabalho com rastreabilidade e validação.",
        "Fluxos produtivos funcionam melhor quando separam preparação, produção assistida e validação humana de fatos, números, nomes e decisões.",
        "Cronometre uma tarefa manual e compare com um fluxo assistido por IA.",
        "Entregar um SOP curto contendo entradas, prompt, revisão e critério de sucesso.",
    ),
    (
        "Automação com IA",
        "Projetar automações que usem IA apenas onde interpretação ou geração agrega valor.",
        "Uma automação robusta separa gatilho, coleta, regras determinísticas, IA, validação, ação e log. Decisões críticas exigem controles proporcionais ao risco.",
        "Desenhe um fluxo real e classifique cada etapa como regra, IA, aprovação humana ou log.",
        "Identificar três falhas possíveis e o fallback seguro de cada uma.",
    ),
    (
        "APIs e integrações",
        "Entender contratos HTTP e como integrar modelos sem expor segredos.",
        "APIs conectam sistemas por contratos de entrada, saída e erro. Chaves devem permanecer no servidor, com autenticação, autorização, timeout e validação.",
        "Modele a API de um gerador de plano de estudos com request, response e erros.",
        "Demonstrar onde a chave do provider fica e por que não pertence ao frontend.",
    ),
    (
        "RAG e conhecimento privado",
        "Compreender ingestão, embeddings, recuperação e geração fundamentada.",
        "RAG recupera trechos relevantes antes da geração. Qualidade depende de fontes, chunking, busca, autorização e tratamento de ausência de evidência.",
        "Defina fontes, permissões e perguntas de teste para uma base de conhecimento pequena.",
        "Concluir o checkpoint de RAG, APIs e agentes.",
    ),
    (
        "Agentes de IA",
        "Diferenciar chat de um agente governado por objetivo, ferramentas e verificação.",
        "Agentes combinam objetivo, contexto, plano, ferramentas, ações, observações e validação. Autonomia útil exige escopo, permissões, logs, rollback e evidência.",
        "Projete um agente simples com ferramentas permitidas, ações proibidas e condição de sucesso.",
        "Entregar uma matriz de riscos e proteções para o agente.",
    ),
    (
        "Construção de projetos reais",
        "Transformar um problema em MVP pequeno, útil, testável e demonstrável.",
        "Projetos fortes começam pelo usuário e pelo resultado, depois definem entradas, papel da IA, regras, interface, segurança, teste e evidência.",
        "Especifique um Assistente de Estudos com no máximo três capacidades.",
        "Entregar arquitetura, fluxo, riscos, prompts, contratos e três casos de teste.",
    ),
    (
        "IA aplicada a negócios e carreira",
        "Conectar capacidade técnica a métricas, portfólio e valor real.",
        "Valor aparece quando uma solução melhora tempo, qualidade, retrabalho, pesquisa ou outra métrica demonstrável. Hipótese deve ser separada de resultado observado.",
        "Escolha um processo e descreva situação atual, intervenção, métrica, risco e controle humano.",
        "Concluir o checkpoint de aplicação profissional e projeto.",
    ),
    (
        "Projeto final — da ideia à demonstração",
        "Integrar o curso em uma solução pequena, real, segura e verificável.",
        "O projeto final deve apresentar problema, usuário, golden path, arquitetura, prompt, segurança, testes, evidências e retrospectiva sem inventar resultados.",
        "Construa e documente uma solução de IA demonstrável, mantendo o escopo pequeno e verificável.",
        "Submeter o projeto final para revisão humana com evidências e próximos passos.",
    ),
]

CHECKPOINT_2 = [
    ("q1", "O que o RAG adiciona a um modelo generativo?", [("a", "Acesso controlado a contexto recuperado de fontes relevantes", True), ("b", "Garantia absoluta de verdade", False), ("c", "Treinamento completo do modelo a cada pergunta", False), ("d", "Dispensa de autorização", False)]),
    ("q2", "Onde deve ficar uma chave secreta de API?", [("a", "No frontend", False), ("b", "Em comentário do repositório", False), ("c", "No servidor ou secret manager", True), ("d", "Na URL pública", False)]),
    ("q3", "Qual sequência descreve melhor um agente governado?", [("a", "Objetivo, ferramentas, ações, observações e validação", True), ("b", "Prompt e publicação automática", False), ("c", "Ação sem log", False), ("d", "Modelo sem permissões", False)]),
    ("q4", "O que fazer quando o RAG não encontra evidência suficiente?", [("a", "Inventar uma resposta provável", False), ("b", "Indicar insuficiência e pedir ou buscar fonte autorizada", True), ("c", "Ignorar permissões", False), ("d", "Usar dados de outra organização", False)]),
    ("q5", "Qual controle reduz risco em automações de alto impacto?", [("a", "Aprovação humana proporcional ao risco", True), ("b", "Remover logs", False), ("c", "Executar qualquer ação automaticamente", False), ("d", "Expor tokens para depuração", False)]),
]

CHECKPOINT_3 = [
    ("q1", "Qual é o melhor ponto de partida para um projeto de IA?", [("a", "Escolher primeiro a tecnologia mais nova", False), ("b", "Definir usuário, problema e resultado desejado", True), ("c", "Criar dez recursos", False), ("d", "Prometer métricas antes do teste", False)]),
    ("q2", "Como tratar uma métrica ainda não observada?", [("a", "Como resultado comprovado", False), ("b", "Como hipótese a validar", True), ("c", "Como garantia comercial", False), ("d", "Como dado irrelevante", False)]),
    ("q3", "O que torna um projeto demonstrável?", [("a", "Arquitetura enorme sem execução", False), ("b", "Fluxo funcional com evidências reproduzíveis", True), ("c", "Somente uma apresentação", False), ("d", "Quantidade de ferramentas", False)]),
    ("q4", "Qual prática melhora um portfólio técnico?", [("a", "Explicar problema, decisão, demonstração e aprendizado", True), ("b", "Listar ferramentas sem contexto", False), ("c", "Inventar impacto", False), ("d", "Ocultar limitações", False)]),
    ("q5", "O projeto final deve priorizar:", [("a", "Escopo verificável e evidência", True), ("b", "Complexidade máxima", False), ("c", "Automação sem fallback", False), ("d", "Resultados não medidos", False)]),
]


def _to_async_url(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def _now() -> str:
    return str(datetime.now(UTC))


async def _resolve_operator(session: AsyncSession, org: Organization, explicit_uuid: str | None) -> User | None:
    statement = select(User).join(UserOrganization, UserOrganization.user_id == User.id).where(
        UserOrganization.org_id == org.id,
    )
    if explicit_uuid:
        statement = statement.where(User.user_uuid == explicit_uuid)
    else:
        statement = statement.where(User.is_superadmin == True)
    users = list((await session.execute(statement)).scalars().all())
    unique = {user.id: user for user in users if user.id is not None}
    if len(unique) != 1:
        print(f"BLOCKED operator_match_count={len(unique)} explicit_uuid={bool(explicit_uuid)}")
        return None
    return next(iter(unique.values()))


async def _find_chapter(session: AsyncSession, course: Course, name: str) -> Chapter | None:
    return (
        await session.execute(
            select(Chapter).where(Chapter.course_id == course.id, Chapter.name == name)
        )
    ).scalars().first()


async def _ensure_welcome(session: AsyncSession, org: Organization, course: Course) -> Chapter:
    chapter = await _find_chapter(session, course, "Boas-vindas")
    now = _now()
    if chapter is None:
        chapter = Chapter(
            name="Boas-vindas",
            description="Orientação oficial para estudar, praticar e usar o GX com responsabilidade.",
            thumbnail_image="",
            lock_type=LockType.AUTHENTICATED,
            org_id=org.id,
            course_id=course.id,
            chapter_uuid=f"chapter_{uuid4()}",
            creation_date=now,
            update_date=now,
            extra_metadata={"xpex_course001": "welcome-v1"},
        )
        session.add(chapter)
        await session.flush()
        session.add(
            CourseChapter(
                order=0,
                course_id=course.id,
                chapter_id=chapter.id,
                org_id=org.id,
                creation_date=now,
                update_date=now,
            )
        )

    activity_name = "Boas-vindas — como estudar e usar o GX"
    activity = (
        await session.execute(
            select(Activity).where(
                Activity.course_id == course.id,
                Activity.name == activity_name,
            )
        )
    ).scalars().first()
    if activity is None:
        activity = Activity(
            name=activity_name,
            activity_type=ActivityTypeEnum.TYPE_DYNAMIC,
            activity_sub_type=ActivitySubTypeEnum.SUBTYPE_DYNAMIC_MARKDOWN,
            content={"markdown_url": f"{RAW_BASE}/00-boas-vindas.md"},
            details={"xpex_course001": "welcome-v1"},
            published=True,
            lock_type=ActivityLockType.AUTHENTICATED,
            org_id=org.id,
            course_id=course.id,
            activity_uuid=f"activity_{uuid4()}",
            creation_date=now,
            update_date=now,
            extra_metadata={"xpex_course001": "welcome-v1"},
        )
        session.add(activity)
        await session.flush()
        session.add(
            ChapterActivity(
                order=1,
                chapter_id=chapter.id,
                activity_id=activity.id,
                course_id=course.id,
                org_id=org.id,
                creation_date=now,
                update_date=now,
            )
        )
    return chapter


async def _ensure_quiz(
    session: AsyncSession,
    org: Organization,
    course: Course,
    chapter: Chapter,
    *,
    title: str,
    questions: list,
    marker: str,
) -> None:
    now = _now()
    activity = (
        await session.execute(
            select(Activity).where(Activity.course_id == course.id, Activity.name == title)
        )
    ).scalars().first()
    if activity is None:
        activity = Activity(
            name=title,
            activity_type=ActivityTypeEnum.TYPE_ASSIGNMENT,
            activity_sub_type=ActivitySubTypeEnum.SUBTYPE_ASSIGNMENT_ANY,
            content={},
            details={"xpex_checkpoint": marker},
            published=True,
            lock_type=ActivityLockType.AUTHENTICATED,
            org_id=org.id,
            course_id=course.id,
            activity_uuid=f"activity_{uuid4()}",
            creation_date=now,
            update_date=now,
            extra_metadata={"xpex_checkpoint": marker},
        )
        session.add(activity)
        await session.flush()
        existing_links = (
            await session.execute(
                select(ChapterActivity).where(ChapterActivity.chapter_id == chapter.id)
            )
        ).scalars().all()
        session.add(
            ChapterActivity(
                order=max([link.order for link in existing_links] or [0]) + 1,
                chapter_id=chapter.id,
                activity_id=activity.id,
                course_id=course.id,
                org_id=org.id,
                creation_date=now,
                update_date=now,
            )
        )

    assignment = (
        await session.execute(select(Assignment).where(Assignment.activity_id == activity.id))
    ).scalars().first()
    if assignment is None:
        assignment = Assignment(
            title=title,
            description="Checkpoint de domínio com correção automática.",
            due_date="",
            published=True,
            grading_type=GradingTypeEnum.PERCENTAGE,
            auto_grading=True,
            show_correct_answers=True,
            allow_retries=True,
            max_retries=0,
            passing_score=70,
            org_id=org.id,
            course_id=course.id,
            chapter_id=chapter.id,
            activity_id=activity.id,
            assignment_uuid=f"assignment_{uuid4()}",
            creation_date=now,
            update_date=now,
        )
        session.add(assignment)
        await session.flush()

    task = (
        await session.execute(
            select(AssignmentTask).where(AssignmentTask.assignment_id == assignment.id)
        )
    ).scalars().first()
    encoded = [
        {
            "questionUUID": qid,
            "questionText": prompt,
            "options": [
                {
                    "optionUUID": f"{qid}-{option_id}",
                    "text": label,
                    "type": "text",
                    "fileID": "",
                    "assigned_right_answer": correct,
                }
                for option_id, label, correct in options
            ],
        }
        for qid, prompt, options in questions
    ]
    if task is None:
        session.add(
            AssignmentTask(
                title=title,
                description="Selecione uma resposta em cada questão.",
                hint="Use os conceitos e critérios de segurança trabalhados no curso.",
                assignment_type=AssignmentTaskTypeEnum.QUIZ,
                contents={"grading_mode": "exact_question", "questions": encoded},
                max_grade_value=100,
                assignment_task_uuid=f"assignmenttask_{uuid4()}",
                creation_date=now,
                update_date=now,
                assignment_id=assignment.id,
                org_id=org.id,
                course_id=course.id,
                chapter_id=chapter.id,
                activity_id=activity.id,
            )
        )
    else:
        task.contents = {"grading_mode": "exact_question", "questions": encoded}
        task.update_date = now
        session.add(task)


async def _ensure_final_project(
    session: AsyncSession,
    org: Organization,
    course: Course,
    chapter: Chapter,
) -> None:
    title = "Entrega final — Projeto demonstrável de IA"
    now = _now()
    activity = (
        await session.execute(
            select(Activity).where(Activity.course_id == course.id, Activity.name == title)
        )
    ).scalars().first()
    if activity is None:
        activity = Activity(
            name=title,
            activity_type=ActivityTypeEnum.TYPE_ASSIGNMENT,
            activity_sub_type=ActivitySubTypeEnum.SUBTYPE_ASSIGNMENT_ANY,
            content={},
            details={"xpex_final_project": True},
            published=True,
            lock_type=ActivityLockType.AUTHENTICATED,
            org_id=org.id,
            course_id=course.id,
            activity_uuid=f"activity_{uuid4()}",
            creation_date=now,
            update_date=now,
            extra_metadata={"xpex_final_project": "course001-v1"},
        )
        session.add(activity)
        await session.flush()
        links = (
            await session.execute(
                select(ChapterActivity).where(ChapterActivity.chapter_id == chapter.id)
            )
        ).scalars().all()
        session.add(
            ChapterActivity(
                order=max([link.order for link in links] or [0]) + 1,
                chapter_id=chapter.id,
                activity_id=activity.id,
                course_id=course.id,
                org_id=org.id,
                creation_date=now,
                update_date=now,
            )
        )

    assignment = (
        await session.execute(select(Assignment).where(Assignment.activity_id == activity.id))
    ).scalars().first()
    if assignment is None:
        assignment = Assignment(
            title=title,
            description=(
                "Entregue problema e usuário, golden path, arquitetura, prompt/contrato, "
                "segurança, pelo menos cinco testes, evidências e retrospectiva."
            ),
            due_date="",
            published=True,
            grading_type=GradingTypeEnum.PASS_FAIL,
            auto_grading=False,
            show_correct_answers=False,
            allow_retries=True,
            max_retries=0,
            passing_score=70,
            org_id=org.id,
            course_id=course.id,
            chapter_id=chapter.id,
            activity_id=activity.id,
            assignment_uuid=f"assignment_{uuid4()}",
            creation_date=now,
            update_date=now,
        )
        session.add(assignment)
        await session.flush()

    task = (
        await session.execute(
            select(AssignmentTask).where(AssignmentTask.assignment_id == assignment.id)
        )
    ).scalars().first()
    if task is None:
        session.add(
            AssignmentTask(
                title="Projeto final",
                description="Submeta a evidência estruturada do projeto para revisão humana.",
                hint="Não invente métricas. Diferencie hipótese, teste e resultado observado.",
                assignment_type=AssignmentTaskTypeEnum.CUSTOM,
                contents={
                    "fields": [
                        "project_name",
                        "problem_and_user",
                        "golden_path",
                        "architecture",
                        "prompt_or_contract",
                        "security_controls",
                        "tests",
                        "evidence_links",
                        "retrospective",
                    ],
                    "manual_review_required": True,
                },
                max_grade_value=100,
                assignment_task_uuid=f"assignmenttask_{uuid4()}",
                creation_date=now,
                update_date=now,
                assignment_id=assignment.id,
                org_id=org.id,
                course_id=course.id,
                chapter_id=chapter.id,
                activity_id=activity.id,
            )
        )


def _video_draft() -> CourseDraft:
    modules = []
    for index, (title, objective, explanation, practice, assessment) in enumerate(
        VIDEO_LESSONS, start=1
    ):
        modules.append(
            ModuleDraft(
                title=f"Vídeo {index:02d} — {title}",
                outcome=objective,
                lessons=[
                    LessonDraft(
                        title=title,
                        objective=objective,
                        explanation=explanation,
                        practice=practice,
                        assessment=assessment,
                        resource_suggestions=["XPeX Academy", "GX AI Lab"],
                    )
                ],
                lab=f"Aplicar a prática da aula: {practice}",
                evidence=assessment,
            )
        )
    return CourseDraft(
        title=COURSE_NAME,
        description=(
            "Pacote audiovisual oficial do primeiro curso de IA da XPeX Academy, "
            "vinculado ao curso nativo já existente."
        ),
        audience="Alunos iniciantes e intermediários que desejam aprender e aplicar IA em projetos reais.",
        prerequisites=["Acesso à XPeX Academy", "Navegador moderno"],
        learning_outcomes=[
            "Compreender fundamentos e limitações de IA.",
            "Construir prompts e fluxos de automação.",
            "Entender APIs, RAG e agentes.",
            "Projetar e demonstrar uma solução de IA.",
        ],
        modules=modules,
        final_project="Entregar uma solução de IA pequena, segura, testável e demonstrável com evidências.",
    )


async def _ensure_video_bridge(
    session: AsyncSession,
    org: Organization,
    operator: User,
    course: Course,
    chapters: list[Chapter],
) -> int:
    draft = _video_draft()
    now = _now()
    record = (
        await session.execute(
            select(XPeXEditorialDraft).where(XPeXEditorialDraft.draft_id == VIDEO_BRIDGE_ID)
        )
    ).scalars().first()

    mapping = {
        "draft_id": VIDEO_BRIDGE_ID,
        "revision": 1,
        "content_hash": draft_content_hash(draft),
        "course_id": course.id,
        "course_uuid": course.course_uuid,
        "chapters": [
            {"chapter_id": chapter.id, "chapter_uuid": chapter.chapter_uuid, "activities": []}
            for chapter in chapters
        ],
        "source": "native-course001-bridge",
    }

    if record is None:
        record = XPeXEditorialDraft(
            draft_id=VIDEO_BRIDGE_ID,
            org_id=org.id,
            created_by_user_id=operator.id,
            status="PUBLISHED",
            publication_state="SUCCEEDED",
            revision=1,
            content_hash=draft_content_hash(draft),
            schema_version="xpex-course001-video-bridge-v1",
            topic=COURSE_NAME,
            audience=draft.audience,
            module_count=len(draft.modules),
            draft_json=draft.model_dump(mode="json"),
            generated_by="xpex-course001-curated",
            native_course_id=course.id,
            native_course_uuid=course.course_uuid,
            native_mapping=mapping,
            published_at=now,
            created_at=now,
            updated_at=now,
        )
        session.add(record)
    else:
        record.status = "PUBLISHED"
        record.publication_state = "SUCCEEDED"
        record.content_hash = draft_content_hash(draft)
        record.module_count = len(draft.modules)
        record.draft_json = draft.model_dump(mode="json")
        record.native_course_id = course.id
        record.native_course_uuid = course.course_uuid
        record.native_mapping = mapping
        record.updated_at = now
        session.add(record)
    await session.commit()

    plan = VideoBatchPlan(
        course_id="xpvb-course001-ia-r1",
        lesson_ids=[f"m{index:02d}-l01" for index in range(1, 13)],
        concurrency=3,
    )
    jobs = await ensure_batch_jobs(
        session,
        plan=plan,
        org_id=org.id,
        created_by_user_id=operator.id,
        editorial_draft_id=VIDEO_BRIDGE_ID,
        native_course_uuid=course.course_uuid,
    )
    return len(jobs)


async def run(org_slug: str, operator_uuid: str | None, execute: bool) -> int:
    config = get_learnhouse_config()
    sql_url = config.database_config.sql_connection_string  # type: ignore[attr-defined]
    engine = create_async_engine(_to_async_url(sql_url), pool_pre_ping=True)
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            org = (
                await session.execute(select(Organization).where(Organization.slug == org_slug))
            ).scalars().first()
            if org is None or org.id is None:
                print(f"BLOCKED organization_not_found slug={org_slug}")
                return 2
            operator = await _resolve_operator(session, org, operator_uuid)
            if operator is None or operator.id is None:
                return 3
            course = (
                await session.execute(
                    select(Course).where(
                        Course.org_id == org.id,
                        Course.name == COURSE_NAME,
                    )
                )
            ).scalars().first()
            if course is None or course.id is None:
                print("BLOCKED course_not_found")
                return 4

            module_chapters = []
            for name in MODULES:
                chapter = await _find_chapter(session, course, name)
                if chapter is None:
                    print(f"BLOCKED missing_chapter name={name}")
                    return 5
                module_chapters.append(chapter)

            existing_videos = list(
                (
                    await session.execute(
                        select(Activity).where(
                            Activity.course_id == course.id,
                            Activity.activity_type == ActivityTypeEnum.TYPE_VIDEO,
                            Activity.published == True,
                        )
                    )
                ).scalars().all()
            )
            print(
                "AUDIT course001 "
                f"course_id={course.id} published={course.published} "
                f"modules={len(module_chapters)} published_videos={len(existing_videos)} "
                f"thumbnail_present={bool((course.thumbnail_image or '').strip())}"
            )
            if not execute:
                print(
                    "DRY_RUN will_ensure=welcome,checkpoint2,checkpoint3,final_project,"
                    "video_bridge,12_video_jobs"
                )
                return 0

            welcome = await _ensure_welcome(session, org, course)
            checkpoint2_chapter = module_chapters[6]
            checkpoint3_chapter = module_chapters[9]
            final_chapter = module_chapters[10]
            await _ensure_quiz(
                session,
                org,
                course,
                checkpoint2_chapter,
                title="Checkpoint 2 — APIs, RAG e agentes",
                questions=CHECKPOINT_2,
                marker="course001-checkpoint2-v1",
            )
            await _ensure_quiz(
                session,
                org,
                course,
                checkpoint3_chapter,
                title="Checkpoint 3 — Aplicação profissional",
                questions=CHECKPOINT_3,
                marker="course001-checkpoint3-v1",
            )
            await _ensure_final_project(session, org, course, final_chapter)

            course.extra_metadata = {
                **(course.extra_metadata or {}),
                "xpex_course001_completion": "prepared-v1",
                "xpex_required_video_count": 12,
                "xpex_release_gate": "human-video-approval-required",
            }
            session.add(course)
            await session.commit()

            jobs = await _ensure_video_bridge(
                session,
                org,
                operator,
                course,
                [welcome, *module_chapters],
            )
            print(
                "PASS course001_prepared "
                f"video_jobs={jobs} provider_calls=0 human_video_gate=true "
                "next=process_video_jobs_in_video_studio"
            )
            return 0
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--org-slug", default=os.getenv("XPEX_LAUNCH_ORG_SLUG", "default"))
    parser.add_argument("--operator-uuid", default=os.getenv("XPEX_OPS_USER_UUID"))
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(run(args.org_slug, args.operator_uuid, args.execute)))


if __name__ == "__main__":
    main()
