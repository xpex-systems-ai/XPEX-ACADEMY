# XPeX Current Architecture — 2026-09-22

## Executive snapshot

This document is based on the actual `dev` branch of `xpex-systems-ai/XPEX-ACADEMY`.

XPeX is not a blank LMS and should not be rebuilt. It is a customized LearnHouse fork with a real XPeX product layer already present.

## Runtime stack

- Web: Next.js 16 / React 19 / TypeScript under `apps/web`
- API: FastAPI / Python under `apps/api`
- Database: PostgreSQL with Alembic migrations
- Cache/session: Redis
- Production: Railway
- Durable media mount: `/data/xpex-media`
- Source of truth: GitHub `dev` branch
- License inherited from base: AGPL-3.0

## Existing platform capabilities confirmed in code

- authentication and session handling
- organization / Polo multi-tenancy
- role / RBAC controls
- course / chapter / activity / assignment flows
- student learning dashboard
- teacher dashboard
- communities, boards, podcasts, folders and media
- API tokens and webhooks
- plans, feature gating and AI credits
- course factory and editorial studio
- XPeX video studio job lifecycle
- AI Lab / RAG / course-grounded chat
- durable AI generation history
- image, audio, quiz, scenario and course-planning AI routes
- provider-agnostic LLM layer built on Pydantic AI
- current provider options include Google/Gemini, OpenRouter, OpenAI-compatible, Anthropic, DeepSeek, Moonshot/Kimi, Mistral, Bedrock and Ollama

## Existing AI foundation

The repository already has the foundation that the Google-AI handoff called “GXEON AI Gateway” in conceptual terms.

Relevant real paths:

- `apps/api/src/services/ai/llm/provider.py` — provider abstraction
- `apps/api/src/services/ai/llm/tiers.py` — centralized model tiering
- `apps/api/src/services/ai/base.py` — chat context + Redis history
- `apps/api/src/services/ai/rag/` — RAG implementation
- `apps/api/src/services/ai/image/` — image generation
- `apps/api/src/services/ai/audio/` — audio/TTS
- `apps/api/src/services/ai/generations.py` — durable generation history
- `apps/api/src/routers/ai/` — authenticated AI endpoints
- `apps/web/services/ai/` — frontend service layer
- `apps/api/src/routers/orgs/ai_credits.py` — org-scoped AI quota controls

## XPeX-specific orchestration already present

`apps/api/src/services/xpex/` contains real product orchestration including:

- course_factory
- editorial_studio
- launch_ops
- launch_readiness
- teacher_dashboard
- video_studio / video_jobs / video_factory / video_attachment
- content_studio
- official_catalog

The correct integration strategy is therefore to strengthen and unify these layers, not create a second parallel AI stack.

## Production deployment

Railway project: `resourceful-optimism`

Service: `XPEX-ACADEMY`

Repository source: `xpex-systems-ai/XPEX-ACADEMY`

Branch: `dev`

Public domain: `xpex-academy-ai.up.railway.app`

Port: `8080`

Persistent media: `/data/xpex-media`

Postgres and Redis are separate services in the same Railway project.

## Principle

PRESERVE → AUDIT → INTEGRATE → TEST → EXPAND.
