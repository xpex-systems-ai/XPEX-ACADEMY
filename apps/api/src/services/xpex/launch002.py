"""XPEX-LAUNCH-002: first real course + 24 audiovisual lesson drafts.

The launch is opt-in via XPEX_LAUNCH002_ON_START=true and idempotent by a fixed
editorial draft id. It publishes the native textual course through the existing
human-gated editorial publisher, immediately stages the course back to unpublished
while video production runs, creates exactly 24 video jobs, and processes them with
bounded concurrency. Video jobs stop at AWAITING_HUMAN_APPROVAL; this module never
approves, attaches, or publishes generated video on behalf of a human reviewer.
"""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import UTC, datetime

from fastapi import Request
from sqlmodel import select

from src.db.courses.courses import CourseUpdate
from src.db.organizations import Organization
from src.db.users import PublicUser, User
from src.db.xpex_editorial import XPeXEditorialDraft
from src.services.courses.courses import update_course
from src.services.xpex.content_studio import CourseDraft, LessonDraft, ModuleDraft
from src.services.xpex.editorial_studio import (
    EditorialMutationRequest,
    approve_editorial_draft,
    draft_content_hash,
    publish_editorial_draft,
    review_editorial_draft,
)
from src.services.xpex.video_factory import VideoJobState
from src.services.xpex.video_studio import create_video_batch, process_video_job

logger = logging.getLogger(__name__)

LAUNCH_DRAFT_ID = "xped_launch002_site_profissional_v1"


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _lesson(title: str, objective: str, concept: str, practice: str) -> LessonDraft:
    return LessonDraft(
        title=title,
        objective=objective,
        explanation=(
            f"Nesta aula o aluno trabalha {concept}. O conteúdo conecta o conceito à construção "
            "de um site profissional real, explicando o porquê de cada decisão, os erros mais "
            "comuns e como validar o resultado no navegador. A aula prioriza prática verificável: "
            "o aluno observa o comportamento da página, altera o código, compara resultados e "
            "registra evidências do que aprendeu. Também são apresentados critérios de qualidade "
            "como semântica, acessibilidade, responsividade, desempenho e manutenção do projeto."
        ),
        practice=practice,
        assessment=(
            "Entregar a atividade prática funcionando, incluir uma captura do resultado e explicar "
            "em poucas linhas quais decisões foram tomadas. A entrega deve funcionar sem erros no "
            "navegador e demonstrar o objetivo específico da aula."
        ),
        resource_suggestions=[
            "MDN Web Docs",
            "Documentação do GitHub",
            "Chrome DevTools",
            "VS Code",
        ],
    )


def build_launch002_course() -> CourseDraft:
    modules = [
        ModuleDraft(
            title="Módulo 1 — Fundamentos da Web e ambiente profissional",
            outcome="Entender como a Web funciona e preparar um ambiente de desenvolvimento reproduzível.",
            lessons=[
                _lesson("Como a Web funciona", "Explicar navegador, DNS, HTTP, servidor e arquivos de um site.", "o caminho completo entre uma URL e a página exibida", "Desenhar o fluxo navegador → DNS → servidor → resposta HTTP e inspecionar uma requisição real no DevTools."),
                _lesson("Frontend, backend, domínio e hospedagem", "Distinguir as partes de uma aplicação web e escolher onde cada responsabilidade vive.", "frontend, backend, domínio, hospedagem e APIs", "Classificar dez exemplos de funcionalidades entre frontend, backend e infraestrutura e justificar cada escolha."),
                _lesson("Preparando VS Code, navegador e projeto", "Criar um projeto local organizado e executá-lo no navegador.", "estrutura de pastas, editor, terminal e servidor local", "Criar a pasta xpex-site, arquivos index.html/styles.css/script.js e abrir o projeto com servidor local."),
                _lesson("Git e GitHub desde o primeiro commit", "Versionar o projeto e publicar o repositório com histórico compreensível.", "Git, commits, branches e repositório remoto", "Inicializar Git, criar três commits com mensagens claras e enviar o projeto para um repositório GitHub."),
            ],
            lab="Criar o repositório oficial do projeto final, documentar o ambiente e publicar a primeira página HTML mínima.",
            evidence="URL do repositório, histórico de commits e captura da página executando localmente.",
        ),
        ModuleDraft(
            title="Módulo 2 — HTML semântico e conteúdo",
            outcome="Construir páginas semanticamente corretas, acessíveis e preparadas para SEO básico.",
            lessons=[
                _lesson("Estrutura HTML5 profissional", "Construir um documento HTML5 válido usando landmarks semânticos.", "doctype, head, body, header, main, section, article e footer", "Refatorar uma página baseada apenas em divs para uma estrutura semântica HTML5."),
                _lesson("Textos, links, imagens e mídia", "Organizar conteúdo e mídia com atributos corretos e alternativas acessíveis.", "hierarquia de títulos, links, imagens responsivas e texto alternativo", "Montar uma seção de serviços com títulos, links e imagens com alt coerente."),
                _lesson("Formulários acessíveis", "Criar um formulário de contato utilizável por teclado e tecnologias assistivas.", "labels, inputs, tipos, validação nativa e mensagens de ajuda", "Criar formulário com nome, e-mail, telefone, assunto e mensagem usando validação HTML."),
                _lesson("SEO on-page e metadados essenciais", "Aplicar metadados básicos e estrutura de conteúdo rastreável.", "title, description, headings, canonical e dados compartilháveis", "Adicionar title, meta description, Open Graph básico e revisar a hierarquia H1–H3."),
            ],
            lab="Construir toda a camada HTML de uma landing page de empresa com navegação, serviços, prova social e contato.",
            evidence="HTML validado, checklist de acessibilidade básica e captura da árvore semântica no DevTools.",
        ),
        ModuleDraft(
            title="Módulo 3 — CSS, layout e responsividade",
            outcome="Transformar o HTML em uma interface consistente, responsiva e visualmente profissional.",
            lessons=[
                _lesson("Fundamentos de CSS e design system", "Definir tokens reutilizáveis de cor, tipografia, espaçamento e bordas.", "cascade, especificidade, variáveis CSS e sistema visual", "Criar :root com tokens e aplicar tipografia, cores e espaçamentos base à página."),
                _lesson("Flexbox na prática", "Construir alinhamentos de uma dimensão sem hacks de posicionamento.", "flex container, eixo, gap, alinhamento e distribuição", "Implementar header responsivo, grupo de cards e área de CTAs usando Flexbox."),
                _lesson("CSS Grid para layouts modernos", "Criar layouts bidimensionais adaptáveis com Grid.", "grid-template, minmax, auto-fit e áreas de grid", "Criar grade de portfólio que varie automaticamente de uma a quatro colunas."),
                _lesson("Mobile first e breakpoints", "Fazer a interface funcionar de telas pequenas para grandes.", "mobile first, media queries, medidas fluidas e teste responsivo", "Ajustar hero, navegação, cards e formulário para 360px, tablet e desktop."),
            ],
            lab="Finalizar o design responsivo da landing page e testar visualmente em três larguras de viewport.",
            evidence="Capturas mobile/tablet/desktop e checklist sem overflow horizontal ou texto ilegível.",
        ),
        ModuleDraft(
            title="Módulo 4 — JavaScript e experiência interativa",
            outcome="Adicionar comportamento real à interface sem comprometer acessibilidade ou estabilidade.",
            lessons=[
                _lesson("JavaScript moderno para a Web", "Manipular valores, funções, arrays e objetos aplicados à interface.", "variáveis, funções, escopo, arrays, objetos e módulos", "Criar uma lista de serviços em JavaScript e renderizar seus dados no console de forma estruturada."),
                _lesson("DOM, eventos e componentes interativos", "Selecionar elementos e responder a interações do usuário.", "DOM, querySelector, eventos, classes e atributos", "Implementar menu mobile, FAQ expansível e botão voltar ao topo com estados acessíveis."),
                _lesson("Validação de formulário com JavaScript", "Validar dados no cliente e apresentar feedback claro sem substituir validação de servidor.", "event submit, validação, mensagens de erro e estados de envio", "Adicionar validação progressiva ao formulário e impedir envio quando campos essenciais forem inválidos."),
                _lesson("Consumindo APIs com fetch", "Consultar uma API e tratar loading, sucesso e falha.", "fetch, async/await, JSON, HTTP status e tratamento de erros", "Consumir uma API pública segura e renderizar um pequeno bloco de dados com estado de carregamento e erro."),
            ],
            lab="Adicionar menu mobile, validação, feedback de formulário e uma integração simples de API ao projeto.",
            evidence="Vídeo curto demonstrando as interações e console sem erros durante o fluxo principal.",
        ),
        ModuleDraft(
            title="Módulo 5 — Qualidade, acessibilidade e performance",
            outcome="Auditar e melhorar o projeto antes de colocá-lo em produção.",
            lessons=[
                _lesson("Acessibilidade prática", "Corrigir barreiras comuns de teclado, foco, contraste e semântica.", "WCAG básica, foco visível, contraste, labels e landmarks", "Navegar o site inteiro apenas pelo teclado e corrigir foco, ordem e controles sem nome acessível."),
                _lesson("Performance e Core Web Vitals", "Reduzir custos de carregamento e identificar gargalos mensuráveis.", "peso de imagens, lazy loading, fontes, cache e métricas de renderização", "Comprimir imagens, aplicar loading adequado e comparar uma auditoria Lighthouse antes/depois."),
                _lesson("Compatibilidade e testes de interface", "Executar uma matriz mínima de testes antes do deploy.", "testes manuais, navegadores, viewports e regressão visual", "Executar checklist em Chrome/Edge e três viewports, registrando problemas encontrados e correções."),
                _lesson("Segurança básica no frontend", "Reconhecer riscos comuns e evitar exposição desnecessária no cliente.", "segredos, XSS conceitual, dependências e tratamento seguro de links", "Auditar o repositório para garantir ausência de tokens, senhas e chaves e revisar links externos com atributos adequados."),
            ],
            lab="Executar uma auditoria pré-produção completa e corrigir os itens críticos encontrados.",
            evidence="Relatório Lighthouse, checklist de acessibilidade, matriz de teste e confirmação de ausência de segredos.",
        ),
        ModuleDraft(
            title="Módulo 6 — Deploy, domínio e projeto final",
            outcome="Publicar, monitorar e entregar um site profissional com evidências técnicas.",
            lessons=[
                _lesson("Deploy contínuo com GitHub e Vercel", "Publicar o projeto a partir do repositório e entender o ciclo commit → build → deploy.", "deploy contínuo, build, ambientes e logs", "Conectar o repositório a uma plataforma de deploy e obter uma URL HTTPS funcional."),
                _lesson("Domínio, DNS e HTTPS", "Entender como apontar um domínio e validar segurança de transporte.", "registros DNS, propagação, domínio customizado e TLS", "Simular ou executar o apontamento de domínio e documentar os registros necessários para produção."),
                _lesson("Observabilidade e manutenção", "Preparar o site para detectar erros e evoluir com segurança.", "logs, métricas web, monitoramento, backups e fluxo de mudanças", "Definir checklist mensal de manutenção e registrar como investigar um deploy com falha."),
                _lesson("Entrega profissional e portfólio", "Apresentar o projeto final com contexto, decisões e evidências de funcionamento.", "README, case de portfólio, demonstração e handoff", "Produzir README final, vídeo demonstrativo curto e página de case com problema, solução, stack e resultados técnicos."),
            ],
            lab="Publicar a versão final, executar smoke test público e preparar o pacote de entrega profissional.",
            evidence="URL HTTPS, repositório, README, auditorias finais e demonstração do site em desktop e mobile.",
        ),
    ]
    return CourseDraft(
        title="Criação de Sites Profissionais — do Zero ao Deploy",
        description=(
            "Formação prática para construir, testar e publicar um site profissional usando HTML, CSS, "
            "JavaScript, GitHub e ferramentas modernas de deploy. O aluno evolui do funcionamento da Web "
            "até uma entrega pública, responsiva, acessível e documentada."
        ),
        audience="Iniciantes, estudantes, empreendedores e futuros freelancers que querem criar sites profissionais do zero.",
        prerequisites=["Computador com acesso à internet", "Conhecimentos básicos de uso de arquivos e navegador"],
        learning_outcomes=[
            "Construir páginas semânticas e acessíveis com HTML5.",
            "Criar layouts profissionais e responsivos com CSS moderno.",
            "Adicionar interações e validações com JavaScript.",
            "Versionar projetos usando Git e GitHub.",
            "Auditar acessibilidade, performance e segurança básica.",
            "Publicar e apresentar um site profissional em HTTPS.",
        ],
        modules=modules,
        final_project=(
            "Construir e publicar um site institucional completo para um negócio real ou fictício. A entrega "
            "deve incluir repositório Git, URL HTTPS, design responsivo, formulário validado, acessibilidade "
            "básica, auditoria de performance, README técnico e uma apresentação curta demonstrando o produto."
        ),
    )


def _request() -> Request:
    return Request({"type": "http", "method": "POST", "path": "/internal/xpex-launch-002", "headers": []})


async def run_launch002() -> None:
    if os.getenv("XPEX_LAUNCH002_ON_START", "").strip().lower() not in {"1", "true", "yes"}:
        return

    from src.core.events.database import _async_session_factory

    org_slug = os.getenv("XPEX_LAUNCH_ORG_SLUG", "default").strip() or "default"
    actor_uuid = os.getenv("XPEX_OPS_USER_UUID", "").strip()
    if not actor_uuid:
        logger.error("XPEX-LAUNCH-002 blocked: XPEX_OPS_USER_UUID is missing")
        return

    async with _async_session_factory() as db_session:
        org = (await db_session.execute(select(Organization).where(Organization.slug == org_slug))).scalars().first()
        user = (await db_session.execute(select(User).where(User.user_uuid == actor_uuid))).scalars().first()
        if not org or org.id is None or not user or user.id is None:
            logger.error("XPEX-LAUNCH-002 blocked: launch organization or operator was not found")
            return
        actor = PublicUser.model_validate(user)
        record = (
            await db_session.execute(
                select(XPeXEditorialDraft).where(XPeXEditorialDraft.draft_id == LAUNCH_DRAFT_ID)
            )
        ).scalars().first()

        if record is None:
            draft = build_launch002_course()
            now = _now()
            record = XPeXEditorialDraft(
                draft_id=LAUNCH_DRAFT_ID,
                org_id=int(org.id),
                created_by_user_id=int(user.id),
                status="DRAFT",
                publication_state="IDLE",
                revision=1,
                content_hash=draft_content_hash(draft),
                topic=draft.title,
                audience=draft.audience,
                module_count=len(draft.modules),
                draft_json=draft.model_dump(mode="json"),
                generated_by="xpex-launch-002-curated",
                created_at=now,
                updated_at=now,
            )
            db_session.add(record)
            await db_session.commit()
            await db_session.refresh(record)
            logger.info("XPEX-LAUNCH-002 created curated editorial draft=%s", record.draft_id)

        # Review + approval + native publication use the production editorial gates.
        if record.status == "DRAFT":
            await review_editorial_draft(
                record.draft_id,
                EditorialMutationRequest(expected_revision=record.revision),
                actor,
                db_session,
            )
            await db_session.refresh(record)
        if record.status == "REVIEWED":
            await approve_editorial_draft(
                record.draft_id,
                EditorialMutationRequest(expected_revision=record.revision),
                actor,
                db_session,
            )
            await db_session.refresh(record)
        if record.status == "APPROVED":
            published = await publish_editorial_draft(
                _request(),
                record.draft_id,
                EditorialMutationRequest(expected_revision=record.revision),
                actor,
                db_session,
            )
            # Keep the new course staged while audiovisual production is under review.
            await update_course(
                _request(),
                CourseUpdate(public=False, published=False),
                published.course_uuid,
                actor,
                db_session,
            )
            await db_session.refresh(record)
            logger.info("XPEX-LAUNCH-002 native course staged course=%s", published.course_uuid)

        if record.status != "PUBLISHED" or not record.native_course_uuid:
            logger.error("XPEX-LAUNCH-002 blocked before video production: editorial publication incomplete")
            return

        batch = await create_video_batch(record.draft_id, actor, db_session)
        logger.info("XPEX-LAUNCH-002 video batch=%s jobs=%s", batch.batch_id, len(batch.jobs))
        semaphore = asyncio.Semaphore(2)

        async def process(job_id: str) -> None:
            async with semaphore:
                try:
                    result = await process_video_job(job_id, actor, db_session)
                    logger.info("XPEX-LAUNCH-002 video job=%s state=%s", job_id, result.state)
                except Exception as exc:  # fail one lesson without publishing or stopping the batch
                    logger.exception("XPEX-LAUNCH-002 video job failed job=%s error=%s", job_id, type(exc).__name__)

        runnable = [
            job.job_id
            for job in batch.jobs
            if job.state in {VideoJobState.QUEUED.value, VideoJobState.FAILED.value}
        ]
        # A single AsyncSession cannot safely run concurrent transactions. Process sequentially here;
        # job-level provider/render stages still remain resumable, and restarts continue idempotently.
        for job_id in runnable:
            await process(job_id)

        refreshed = await create_video_batch(record.draft_id, actor, db_session)
        waiting = sum(job.state == VideoJobState.AWAITING_HUMAN_APPROVAL.value for job in refreshed.jobs)
        failed = sum(job.state == VideoJobState.FAILED.value for job in refreshed.jobs)
        logger.info(
            "XPEX-LAUNCH-002 checkpoint course=%s waiting_human=%s failed=%s total=%s",
            record.native_course_uuid,
            waiting,
            failed,
            len(refreshed.jobs),
        )


def start_launch002() -> asyncio.Task | None:
    if os.getenv("XPEX_LAUNCH002_ON_START", "").strip().lower() not in {"1", "true", "yes"}:
        return None
    task = asyncio.create_task(run_launch002(), name="xpex-launch-002")
    return task
