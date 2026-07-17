# XpeX Academy — Environment and Deployment Readiness Audit

> MISSION-009 audit only: no deploy, no provider mutation, no remote migration, no secrets recorded.

## Executive summary

The repository contains four executable services: Web (`apps/web`), API (`apps/api`), Collab (`apps/collab`) and CLI (`apps/cli`). Staging is not yet ready for an official pilot deploy because required provider resources, environment values, database migration procedure, object storage decision and service-specific health checks still need human provisioning and validation.

Recommended staging topology is Vercel for Web, Railway for API and optionally Collab, managed PostgreSQL for persistence, managed Redis only when the selected feature set requires it, and S3-compatible storage for staging/production media.

## Deliverables

- [Runtime inventory](RUNTIME_INVENTORY.md)
- [Environment variables](ENVIRONMENT_VARIABLES.md)
- [Service dependencies](SERVICE_DEPENDENCIES.md)
- [Build and start runbook](BUILD_AND_START_RUNBOOK.md)
- [Database migration readiness](DATABASE_MIGRATION_READINESS.md)
- [Vercel readiness](VERCEL_READINESS.md)
- [Railway readiness](RAILWAY_READINESS.md)
- [Storage readiness](STORAGE_READINESS.md)
- [Security and secrets](SECURITY_AND_SECRETS.md)
- [Health and observability](HEALTH_AND_OBSERVABILITY.md)
- [Blockers and risks](BLOCKERS_AND_RISKS.md)
- [Staging topology](STAGING_TOPOLOGY.md)
- [Implementation roadmap](IMPLEMENTATION_ROADMAP.md)
- [ADR-005](../adr/ADR-005-STAGING-DEPLOYMENT-TOPOLOGY.md)

## Evidence base inspected

Primary evidence came from `README.md`, `.env.xpex.example`, `.github/copilot-instructions.md`, `docs/trinity-flow/EXECUTION_PROTOCOL.md`, `docs/xpex/deploy-strategy.md`, platform-core docs, service manifests, Dockerfiles, FastAPI config, Next config, Collab source, Alembic config and environment references discovered with `rg`.
