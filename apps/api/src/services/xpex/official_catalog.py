"""Canonical, content-free registry for XPeX Official Catalog V1.

This module registers product-approved names only. It deliberately does not invent
modules, lessons, descriptions, popularity, or publication state.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID, uuid5

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from src.db.xpex_catalog import XPeXCatalogVersion, XPeXCourse, XPeXSchool

CATALOG_KEY = "XPEX_OFFICIAL_CATALOG_V1"
CATALOG_VERSION = "V1"
CATALOG_NAMESPACE = UUID("72d020a1-28d0-5ee9-8c09-79f85cf96e5a")

_RAW_SCHOOLS = (
("XPEX-S01", "Escola de Fundamentos Digitais", """Informática do Zero|Navegador Inteligente e Pesquisa na Internet|Segurança Digital e Proteção de Dados|E-mail, Arquivos e Organização na Nuvem|Word e Documentos Profissionais|Excel e Planilhas Inteligentes|PowerPoint e Apresentações|Canva para Iniciantes|Produtividade Digital|Cidadania e Ética Digital"""),
("XPEX-S02", "Escola de Inteligência Artificial", """Inteligência Artificial do Zero|ChatGPT na Prática|Microsoft Copilot no Trabalho e nos Estudos|Gemini e Ferramentas Google com IA|Claude, DeepSeek e Outros Modelos|Engenharia de Prompts|Pesquisa Profissional com IA|Criação de Documentos com IA|IA para Estudos e Aprendizagem|IA para Pequenos Negócios|Ética, Privacidade e Uso Responsável da IA|Comparação e Escolha de Modelos de IA"""),
("XPEX-S03", "Escola de Vibe Coding e Desenvolvimento", """Lógica de Programação para Iniciantes|HTML e CSS|JavaScript Essencial|Git e GitHub do Zero|Vibe Coding com IA|Criação de Landing Pages|Criação de Sites Profissionais|Desenvolvimento com Replit|Desenvolvimento com Copilot e Codex|React e Next.js|APIs com Python e FastAPI|Bancos de Dados e PostgreSQL|Supabase na Prática|Autenticação e Controle de Acesso|Docker para Projetos Reais|Testes, Pull Requests e GitHub Actions|Deploy com Vercel|Deploy de Backend em Nuvem|Construção de Mini-SaaS|Projeto Full Stack Profissional"""),
("XPEX-S04", "Escola de Agentes e Automação", """O que São Agentes de IA|Criação de Chatbots|Agentes de Atendimento|Agentes de Pesquisa|Agentes Educacionais|Agentes de Marketing|Agentes de Vendas|Agentes Programadores|Agentes com Memória|Agentes de Conhecimento e RAG|Automação com n8n|Automação com APIs|Webhooks e Integrações|Agentes Conectados ao WhatsApp e E-mail|Orquestração de Múltiplos Agentes|Segurança e Permissões de Agentes|Construção de um Agente como Produto|XPEX Agent Studio — Projeto Final"""),
("XPEX-S05", "Escola de Design, Imagem e Vídeo com IA", """Design Digital do Zero|Identidade Visual com IA|Criação de Logotipos|Posts Profissionais para Redes Sociais|Capas, Banners e Thumbnails|Geração de Imagens com IA|Edição e Restauração de Imagens|Fotografia e Direção Visual com IA|Criação de Avatares|Criação de Vídeos com IA|HeyGen para Vídeos Profissionais|Edição de Reels e Shorts|Roteiro e Storytelling|Narração, Voz e Dublagem com IA|Animação de Imagens|Produção de Conteúdo para YouTube|Podcast com IA|Projeto de Campanha Visual Completa"""),
("XPEX-S06", "Escola de Produtos Digitais e Marketing", """Empreendedorismo Digital|Como Encontrar um Problema de Mercado|Validação de Ideias|Criação de Produtos Digitais|Criação de E-books com IA|Criação de Cursos Online|Templates, Prompts e Kits Digitais|Criação de Landing Pages de Venda|Copywriting com IA|Marketing de Conteúdo|Instagram Profissional|YouTube para Negócios|Tráfego Pago para Iniciantes|E-mail Marketing|Funis de Venda|Afiliados e Comissões|Precificação|Atendimento e Pós-venda|Marketplace XPEX|Lançamento de um Produto Real"""),
("XPEX-S07", "Escola de Cloud, Dados e Segurança", """Fundamentos de Computação em Nuvem|Google Cloud — Fundamentos|Amazon Web Services — Fundamentos|Microsoft Azure — Fundamentos|Cloud Run e Aplicações em Contêineres|Armazenamento em Nuvem|Bancos de Dados na Nuvem|Fundamentos de Dados|Excel Avançado e Análise de Dados|Python para Dados|Dashboards e Visualização|Introdução à Cibersegurança|Segurança de Aplicações|Gestão de Secrets e Credenciais|LGPD e Privacidade|Monitoramento, Logs e Recuperação|Infraestrutura como Código|Projeto de Arquitetura Cloud"""),
("XPEX-S08", "Escola de Creators, Professores e Polos", """Como Ensinar com Inteligência Artificial|Formação de Professor Digital|Planejamento de Aulas com IA|Produção de Material Didático|Avaliações e Quizzes|Criação de Curso na XPEX|Gestão de Turmas|Acompanhamento de Alunos|Comunidades Educacionais|Lives e Aulas Online|Creator Studio|Monetização de Conhecimento|Gestão de Afiliados|Analytics Educacional|Operação de Polo XPEX|Captação e Matrícula de Alunos|Marketing Local do Polo|Gestão Financeira e Administrativa|Formação de Mentores|Certificação de Professor Creator XPEX"""),
("XPEX-S09", "Escola de Carreira e Empreendedorismo", """Descoberta de Carreira|Perfil Profissional com IA|Currículo Profissional|LinkedIn de Autoridade|Portfólio Digital|GitHub Profissional|Como Apresentar um Projeto|Comunicação e Oratória|Trabalho em Equipe|Gestão de Projetos|Atendimento ao Cliente|Freelancing|Propostas e Orçamentos|Negociação|Empregabilidade em Tecnologia|Preparação para Entrevistas|Como Abrir um Pequeno Negócio Digital|Finanças para Empreendedores|Projeto Profissional Final|Demo Day XPEX"""),
)


@dataclass(frozen=True)
class OfficialCourse:
    course_key: str
    title: str
    slug: str
    display_order: int


@dataclass(frozen=True)
class OfficialSchool:
    school_key: str
    name: str
    slug: str
    display_order: int
    courses: tuple[OfficialCourse, ...]


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")


def _build_catalog() -> tuple[OfficialSchool, ...]:
    schools = []
    for school_order, (school_key, name, raw_courses) in enumerate(_RAW_SCHOOLS, 1):
        courses = tuple(
            OfficialCourse(
                course_key=f"{school_key}-C{course_order:02d}",
                title=title,
                slug=f"{school_key.lower()}-{slugify(title)}",
                display_order=course_order,
            )
            for course_order, title in enumerate(raw_courses.split("|"), 1)
        )
        schools.append(OfficialSchool(school_key, name, slugify(name), school_order, courses))
    return tuple(schools)


OFFICIAL_SCHOOLS = _build_catalog()
OFFICIAL_COURSES = tuple(course for school in OFFICIAL_SCHOOLS for course in school.courses)


def validate_official_catalog() -> None:
    if len(OFFICIAL_SCHOOLS) != 9:
        raise ValueError("Official catalog must contain exactly 9 schools")
    if len(OFFICIAL_COURSES) != 156:
        raise ValueError("Official catalog must contain exactly 156 courses")
    if [school.school_key for school in OFFICIAL_SCHOOLS] != [f"XPEX-S{i:02d}" for i in range(1, 10)]:
        raise ValueError("Official school keys or order are invalid")
    for label, values in {
        "course keys": [course.course_key for course in OFFICIAL_COURSES],
        "course slugs": [course.slug for course in OFFICIAL_COURSES],
        "school slugs": [school.slug for school in OFFICIAL_SCHOOLS],
    }.items():
        if len(values) != len(set(values)):
            raise ValueError(f"Official catalog has duplicate {label}")


async def seed_official_catalog(db_session: AsyncSession) -> dict[str, int | str]:
    """Idempotently register V1 without modifying legacy/native courses.

    Existing canonical records are updated in place. The routine never touches the
    native ``course`` table, creates no modules, and forces every V1 course private.
    """
    validate_official_catalog()
    now = datetime.now(UTC).isoformat()
    version = (await db_session.execute(select(XPeXCatalogVersion).where(XPeXCatalogVersion.catalog_key == CATALOG_KEY))).scalars().first()
    if version is None:
        version = XPeXCatalogVersion(catalog_key=CATALOG_KEY, version=CATALOG_VERSION, status="ACTIVE", course_count=156, created_at=now)
        db_session.add(version)
        await db_session.flush()
    else:
        version.version, version.status, version.course_count = CATALOG_VERSION, "ACTIVE", 156

    for school_spec in OFFICIAL_SCHOOLS:
        school = (await db_session.execute(select(XPeXSchool).where(XPeXSchool.school_key == school_spec.school_key))).scalars().first()
        if school is None:
            school = XPeXSchool(school_key=school_spec.school_key, catalog_version_id=int(version.id), name=school_spec.name, slug=school_spec.slug, display_order=school_spec.display_order)
            db_session.add(school)
            await db_session.flush()
        else:
            school.catalog_version_id, school.name, school.slug = int(version.id), school_spec.name, school_spec.slug
            school.display_order, school.status, school.theme = school_spec.display_order, "ACTIVE", "dark_neon_premium"
        for course_spec in school_spec.courses:
            course = (await db_session.execute(select(XPeXCourse).where(XPeXCourse.course_key == course_spec.course_key))).scalars().first()
            stable_uuid = uuid5(CATALOG_NAMESPACE, course_spec.course_key)
            if course is None:
                course = XPeXCourse(course_uuid=stable_uuid, course_key=course_spec.course_key, school_id=int(school.id), title=course_spec.title, slug=course_spec.slug, display_order=course_spec.display_order, catalog_version=CATALOG_KEY)
                db_session.add(course)
            else:
                course.course_uuid, course.school_id, course.title = stable_uuid, int(school.id), course_spec.title
                course.slug, course.display_order, course.catalog_version = course_spec.slug, course_spec.display_order, CATALOG_KEY
                course.lifecycle_status, course.publication_status = "CATALOG_REGISTERED", "PRIVATE"
    await db_session.commit()
    return {"catalog_key": CATALOG_KEY, "schools": 9, "courses": 156}
