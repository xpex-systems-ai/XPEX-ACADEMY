"""Guarded, idempotent bootstrap for the first official XPeX Academy course.

The command is dry-run by default. With --execute it creates or repairs exactly one
course in the target organization, 11 ordered chapters and one published Markdown
lesson per chapter. It refuses ambiguous course/author scope and never prints PII.
"""

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
from src.db.courses.courses import Course, ThumbnailType
from src.db.organizations import Organization
from src.db.resource_authors import (
    ResourceAuthor,
    ResourceAuthorshipEnum,
    ResourceAuthorshipStatusEnum,
)
from src.db.user_organizations import UserOrganization
from src.db.users import User

COURSE_NAME = "Inteligência Artificial — do Básico ao Avançado"
COURSE_SLUG = "ia-do-basico-ao-avancado"
COURSE_DESCRIPTION = (
    "Formação prática em inteligência artificial, do fundamento à construção de "
    "automações, RAG, agentes e projetos aplicados a negócios e carreira."
)
RAW_BASE = (
    "https://raw.githubusercontent.com/xpex-systems-ai/XPEX-ACADEMY/dev/"
    "docs/courses/ia-do-basico-ao-avancado"
)

MODULES = [
    ("Fundamentos de Inteligência Artificial", "01-fundamentos.md"),
    ("Como funcionam LLMs e IA generativa", "02-llms-ia-generativa.md"),
    ("Prompt Engineering", "03-prompt-engineering.md"),
    ("Ferramentas de IA para produtividade", "04-produtividade.md"),
    ("Automação com IA", "05-automacao.md"),
    ("APIs e integrações", "06-apis-integracoes.md"),
    ("RAG e conhecimento privado", "07-rag.md"),
    ("Agentes de IA", "08-agentes.md"),
    ("Construção de projetos reais", "09-projetos-reais.md"),
    ("IA aplicada a negócios e carreira", "10-negocios-carreira.md"),
    ("Projeto final", "11-projeto-final.md"),
]

ASSESSMENT_TITLE = "Avaliação — Fundamentos de Inteligência Artificial"
ASSESSMENT_QUESTIONS = [
    ("q1", "Qual relação descreve melhor IA e Machine Learning?", [("a", "Machine Learning é uma abordagem dentro do campo mais amplo da IA", True), ("b", "IA e Machine Learning são termos sem qualquer diferença", False), ("c", "Toda IA precisa aprender continuamente sozinha", False), ("d", "Machine Learning existe apenas para gerar textos", False)]),
    ("q2", "O que caracteriza melhor uma aplicação de IA generativa?", [("a", "Apenas ordenar registros já existentes", False), ("b", "Produzir novo conteúdo com base em padrões aprendidos", True), ("c", "Garantir respostas factualmente corretas", False), ("d", "Substituir qualquer decisão humana", False)]),
    ("q3", "Como tratar uma resposta convincente produzida por um modelo generativo?", [("a", "Aceitá-la porque fluência comprova precisão", False), ("b", "Descartá-la porque modelos sempre erram", False), ("c", "Validá-la, pois a saída é probabilística e pode conter alucinações", True), ("d", "Publicá-la antes de verificar para economizar tempo", False)]),
    ("q4", "Qual tarefa é uma candidata mais adequada para automação com IA?", [("a", "Decidir autonomamente um tratamento médico crítico", False), ("b", "Condenar uma pessoa sem revisão", False), ("c", "Autorizar transferências atípicas sem controle", False), ("d", "Classificar rascunhos repetitivos com revisão das exceções", True)]),
    ("q5", "Qual prática é proporcional ao risco de uma decisão apoiada por IA?", [("a", "Aumentar validação e supervisão humana conforme cresce o impacto", True), ("b", "Usar a mesma revisão mínima em todos os casos", False), ("c", "Ocultar incertezas do responsável", False), ("d", "Transferir integralmente a responsabilidade ao modelo", False)]),
]


async def _ensure_foundations_assessment(session: AsyncSession, org: Organization, course: Course) -> None:
    chapter = (await session.execute(select(Chapter).where(Chapter.course_id == course.id, Chapter.name == MODULES[0][0]))).scalars().first()
    if chapter is None:
        raise RuntimeError("module one missing")
    now = str(datetime.now(UTC))
    activity = (await session.execute(select(Activity).where(Activity.course_id == course.id, Activity.name == ASSESSMENT_TITLE))).scalars().one_or_none()
    if activity is None:
        activity = Activity(name=ASSESSMENT_TITLE, activity_type=ActivityTypeEnum.TYPE_ASSIGNMENT, activity_sub_type=ActivitySubTypeEnum.SUBTYPE_ASSIGNMENT_ANY, content={}, details={"xpex_module": 1, "xpex_assessment": True}, published=True, lock_type=ActivityLockType.AUTHENTICATED, org_id=org.id, course_id=course.id, activity_uuid=f"activity_{uuid4()}", creation_date=now, update_date=now, extra_metadata={"xpex_assessment": "foundations-v1"})
        session.add(activity)
        await session.flush()
        session.add(ChapterActivity(order=2, chapter_id=chapter.id, activity_id=activity.id, course_id=course.id, org_id=org.id, creation_date=now, update_date=now))
    assignment = (await session.execute(select(Assignment).where(Assignment.activity_id == activity.id))).scalars().one_or_none()
    if assignment is None:
        assignment = Assignment(title=ASSESSMENT_TITLE, description="Avalie sua compreensão dos fundamentos, limitações e uso responsável da IA.", due_date="", published=True, grading_type=GradingTypeEnum.PERCENTAGE, auto_grading=True, show_correct_answers=True, allow_retries=True, max_retries=0, passing_score=70, org_id=org.id, course_id=course.id, chapter_id=chapter.id, activity_id=activity.id, assignment_uuid=f"assignment_{uuid4()}", creation_date=now, update_date=now)
        session.add(assignment)
        await session.flush()
    else:
        assignment.title = ASSESSMENT_TITLE
        assignment.description = "Avalie sua compreensão dos fundamentos, limitações e uso responsável da IA."
        assignment.published = True
        assignment.grading_type = GradingTypeEnum.PERCENTAGE
        assignment.auto_grading = True
        assignment.show_correct_answers = True
        assignment.allow_retries = True
        assignment.max_retries = 0
        assignment.passing_score = 70
        assignment.update_date = now
        session.add(assignment)
    questions = [
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
        for qid, prompt, options in ASSESSMENT_QUESTIONS
    ]
    task = (await session.execute(select(AssignmentTask).where(AssignmentTask.assignment_id == assignment.id))).scalars().first()
    if task is None:
        session.add(AssignmentTask(title="Fundamentos de IA", description="Selecione uma resposta em cada questão.", hint="Considere confiabilidade, risco e supervisão humana.", assignment_type=AssignmentTaskTypeEnum.QUIZ, contents={"grading_mode": "exact_question", "questions": questions}, max_grade_value=100, assignment_task_uuid=f"assignmenttask_{uuid4()}", creation_date=now, update_date=now, assignment_id=assignment.id, org_id=org.id, course_id=course.id, chapter_id=chapter.id, activity_id=activity.id))
    else:
        task.title = "Fundamentos de IA"
        task.description = "Selecione uma resposta em cada questão."
        task.hint = "Considere confiabilidade, risco e supervisão humana."
        task.assignment_type = AssignmentTaskTypeEnum.QUIZ
        task.contents = {"grading_mode": "exact_question", "questions": questions}
        task.max_grade_value = 100
        task.update_date = now
        session.add(task)


def _to_async_url(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


async def _resolve_author(
    session: AsyncSession, org: Organization, explicit_uuid: str | None
) -> User | None:
    if explicit_uuid:
        return (
            await session.execute(
                select(User)
                .join(UserOrganization, UserOrganization.user_id == User.id)
                .where(
                    User.user_uuid == explicit_uuid,
                    UserOrganization.org_id == org.id,
                )
            )
        ).scalars().one_or_none()

    candidates = list(
        (
            await session.execute(
                select(User)
                .join(UserOrganization, UserOrganization.user_id == User.id)
                .where(UserOrganization.org_id == org.id, User.is_superadmin == True)
            )
        ).scalars().all()
    )
    unique = {user.id: user for user in candidates if user.id is not None}
    if len(unique) != 1:
        print(f"BLOCKED author_match_count={len(unique)} explicit_uuid=false")
        return None
    return next(iter(unique.values()))


async def _ensure_course(
    session: AsyncSession, org: Organization, author: User, execute: bool
) -> tuple[Course | None, bool]:
    courses = list(
        (
            await session.execute(
                select(Course).where(
                    Course.org_id == org.id,
                    Course.name == COURSE_NAME,
                )
            )
        ).scalars().all()
    )
    if len(courses) > 1:
        print(f"BLOCKED course_match_count={len(courses)}")
        return None, False

    if courses:
        course = courses[0]
        print(
            "COURSE_EXISTS "
            f"course_id={course.id} published={course.published} public={course.public}"
        )
        if not execute:
            return course, False
        course.description = COURSE_DESCRIPTION
        course.about = (
            "Aprenda os fundamentos e avance até aplicações profissionais com prática "
            "progressiva, projetos e uso responsável de IA."
        )
        course.learnings = (
            "LLMs; prompt engineering; produtividade; automação; APIs; RAG; agentes; "
            "projetos; estratégia e carreira"
        )
        course.tags = "inteligência artificial,IA,LLM,RAG,agentes,automação"
        course.public = False
        course.published = True
        course.open_to_contributors = False
        course.thumbnail_type = ThumbnailType.IMAGE
        course.extra_metadata = {
            **(course.extra_metadata or {}),
            "xpex_slug": COURSE_SLUG,
            "xpex_launch": "XPEX-LAUNCH-001",
        }
        course.update_date = str(datetime.now(UTC))
        session.add(course)
        return course, False

    if not execute:
        print("DRY_RUN course_will_be_created=true")
        return None, True

    now = str(datetime.now(UTC))
    course = Course(
        name=COURSE_NAME,
        description=COURSE_DESCRIPTION,
        about=(
            "Aprenda os fundamentos e avance até aplicações profissionais com prática "
            "progressiva, projetos e uso responsável de IA."
        ),
        learnings=(
            "LLMs; prompt engineering; produtividade; automação; APIs; RAG; agentes; "
            "projetos; estratégia e carreira"
        ),
        tags="inteligência artificial,IA,LLM,RAG,agentes,automação",
        thumbnail_type=ThumbnailType.IMAGE,
        thumbnail_image="",
        thumbnail_video="",
        public=False,
        published=True,
        open_to_contributors=False,
        org_id=org.id,
        course_uuid=f"course_{uuid4()}",
        creation_date=now,
        update_date=now,
        extra_metadata={
            "xpex_slug": COURSE_SLUG,
            "xpex_launch": "XPEX-LAUNCH-001",
        },
    )
    session.add(course)
    await session.flush()
    session.add(
        ResourceAuthor(
            resource_uuid=course.course_uuid,
            user_id=author.id,
            authorship=ResourceAuthorshipEnum.CREATOR,
            authorship_status=ResourceAuthorshipStatusEnum.ACTIVE,
            creation_date=now,
            update_date=now,
        )
    )
    print(f"COURSE_CREATED course_id={course.id} published=true")
    return course, True


async def _ensure_module(
    session: AsyncSession,
    org: Organization,
    course: Course,
    order: int,
    module_name: str,
    markdown_file: str,
) -> None:
    chapters = list(
        (
            await session.execute(
                select(Chapter).where(
                    Chapter.org_id == org.id,
                    Chapter.course_id == course.id,
                    Chapter.name == module_name,
                )
            )
        ).scalars().all()
    )
    if len(chapters) > 1:
        raise RuntimeError(f"ambiguous chapter scope order={order}")
    now = str(datetime.now(UTC))
    if chapters:
        chapter = chapters[0]
        chapter.description = f"Módulo {order} da formação oficial XPeX Academy."
        chapter.lock_type = LockType.AUTHENTICATED
        chapter.update_date = now
        session.add(chapter)
    else:
        chapter = Chapter(
            name=module_name,
            description=f"Módulo {order} da formação oficial XPeX Academy.",
            thumbnail_image="",
            lock_type=LockType.AUTHENTICATED,
            org_id=org.id,
            course_id=course.id,
            chapter_uuid=f"chapter_{uuid4()}",
            creation_date=now,
            update_date=now,
            extra_metadata={"xpex_module": order},
        )
        session.add(chapter)
        await session.flush()

    course_chapter = (
        await session.execute(
            select(CourseChapter).where(
                CourseChapter.course_id == course.id,
                CourseChapter.chapter_id == chapter.id,
            )
        )
    ).scalars().one_or_none()
    if course_chapter is None:
        session.add(
            CourseChapter(
                order=order,
                course_id=course.id,
                chapter_id=chapter.id,
                org_id=org.id,
                creation_date=now,
                update_date=now,
            )
        )
    else:
        course_chapter.order = order
        course_chapter.update_date = now
        session.add(course_chapter)

    lesson_name = f"Módulo {order}: {module_name}"
    activities = list(
        (
            await session.execute(
                select(Activity).where(
                    Activity.org_id == org.id,
                    Activity.course_id == course.id,
                    Activity.name == lesson_name,
                )
            )
        ).scalars().all()
    )
    if len(activities) > 1:
        raise RuntimeError(f"ambiguous activity scope order={order}")
    content = {"markdown_url": f"{RAW_BASE}/{markdown_file}"}
    if activities:
        activity = activities[0]
        activity.activity_type = ActivityTypeEnum.TYPE_DYNAMIC
        activity.activity_sub_type = ActivitySubTypeEnum.SUBTYPE_DYNAMIC_MARKDOWN
        activity.content = content
        activity.details = {"xpex_module": order}
        activity.published = True
        activity.lock_type = ActivityLockType.AUTHENTICATED
        activity.last_modified_by_id = None
        activity.update_date = now
        session.add(activity)
    else:
        activity = Activity(
            name=lesson_name,
            activity_type=ActivityTypeEnum.TYPE_DYNAMIC,
            activity_sub_type=ActivitySubTypeEnum.SUBTYPE_DYNAMIC_MARKDOWN,
            content=content,
            details={"xpex_module": order},
            published=True,
            lock_type=ActivityLockType.AUTHENTICATED,
            org_id=org.id,
            course_id=course.id,
            activity_uuid=f"activity_{uuid4()}",
            creation_date=now,
            update_date=now,
            extra_metadata={"xpex_module": order},
        )
        session.add(activity)
        await session.flush()

    chapter_activity = (
        await session.execute(
            select(ChapterActivity).where(
                ChapterActivity.chapter_id == chapter.id,
                ChapterActivity.activity_id == activity.id,
            )
        )
    ).scalars().one_or_none()
    if chapter_activity is None:
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
    else:
        chapter_activity.order = 1
        chapter_activity.update_date = now
        session.add(chapter_activity)


async def run(org_slug: str, execute: bool, author_uuid: str | None) -> int:
    config = get_learnhouse_config()
    sql_url = config.database_config.sql_connection_string  # type: ignore[attr-defined]
    engine = create_async_engine(_to_async_url(sql_url), pool_pre_ping=True)
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            org = (
                await session.execute(
                    select(Organization).where(Organization.slug == org_slug)
                )
            ).scalars().one_or_none()
            if org is None:
                print(f"BLOCKED organization_not_found slug={org_slug}")
                return 2

            author = await _resolve_author(session, org, author_uuid)
            if author is None:
                return 3
            print(
                "AUTHOR_RESOLVED "
                f"user_id={author.id} explicit_uuid={bool(author_uuid)} superadmin={author.is_superadmin}"
            )

            course, _created = await _ensure_course(session, org, author, execute)
            if course is None:
                if execute:
                    return 4
                print(f"DRY_RUN modules={len(MODULES)} publish=true")
                return 0
            if not execute:
                print(f"DRY_RUN existing_course_id={course.id} modules={len(MODULES)}")
                return 0

            try:
                for order, (module_name, markdown_file) in enumerate(MODULES, start=1):
                    await _ensure_module(
                        session, org, course, order, module_name, markdown_file
                    )
                await _ensure_foundations_assessment(session, org, course)
                await session.commit()
            except RuntimeError as exc:
                await session.rollback()
                print(f"BLOCKED course_bootstrap_failed type={type(exc).__name__}")
                return 5

            chapter_count = len(
                (
                    await session.execute(
                        select(Chapter).where(
                            Chapter.org_id == org.id,
                            Chapter.course_id == course.id,
                        )
                    )
                ).scalars().all()
            )
            activity_count = len(
                (
                    await session.execute(
                        select(Activity).where(
                            Activity.org_id == org.id,
                            Activity.course_id == course.id,
                            Activity.published == True,
                        )
                    )
                ).scalars().all()
            )
            if chapter_count < len(MODULES) or activity_count < len(MODULES):
                print(
                    "BLOCKED verification_failed "
                    f"chapters={chapter_count} activities={activity_count}"
                )
                return 6
            print(
                "PASS first_ai_course_ready "
                f"course_id={course.id} published={course.published} "
                f"chapters={chapter_count} activities={activity_count}"
            )
            return 0
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--org-slug", default=os.getenv("XPEX_LAUNCH_ORG_SLUG", "default"))
    parser.add_argument("--author-uuid", default=os.getenv("XPEX_LAUNCH_AUTHOR_UUID"))
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(run(args.org_slug, args.execute, args.author_uuid)))


if __name__ == "__main__":
    main()
