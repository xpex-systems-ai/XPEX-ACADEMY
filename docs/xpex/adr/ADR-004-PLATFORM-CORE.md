# ADR-004 — Platform Core Capability Registry

## Status

Proposto.

## Contexto

A XpeX Academy é um fork estratégico do LearnHouse. Missões anteriores consolidaram Trinity Governance, Kelle Pilot Architecture, Learning Core e Kelle Pilot Configuration. A plataforma ainda precisava de um registro central para capacidades compartilhadas antes de expandir Community, Studio AI, Career e Marketplace.

## Problema

Sem uma fonte oficial de verdade, novos domínios podem duplicar autenticação, usuários, organizações, roles, storage, billing, observabilidade, API tokens, webhooks ou feature gates. Isso aumenta risco multi-tenant, quebra compatibilidade upstream e dificulta auditoria.

## Opções consideradas

### Opção A — Registry documental baseado no código existente

Documentar capacidades reais, evidências, limites, dependências, lacunas e roadmap sem alterar código.

### Opção B — Criar uma nova camada Platform Core agora

Introduzir novos serviços, modelos, contratos ou flags para organizar o núcleo.

### Opção C — Deixar cada domínio decidir seus próprios fundamentos

Permitir que Learning, Community, Studio, Career e Marketplace criem suas próprias fundações conforme necessário.

## Decisão

Adotar a **Opção A**. O Platform Core é definido inicialmente como registro arquitetural documental, baseado nas implementações existentes do LearnHouse/XpeX. Nenhum código funcional, modelo, migration, endpoint, componente, workflow, dependência ou lockfile é alterado nesta missão.

## Capacidades incluídas

- Authentication.
- Users and identity.
- Organizations and multi-tenancy.
- Roles, Rights, RoleType and RBAC.
- Generic user groups as shared grouping/access primitive.
- Billing and plans foundation.
- Storage and media foundation.
- Notifications/email foundation.
- Observability and analytics foundation.
- API tokens.
- Webhook foundation.
- Shared plan/feature gating.
- Audit/governance foundations where evidenced.

## Capacidades excluídas

- Course, Chapter, Activity, Assignment, Submission, Trail, Certification and student/teacher journeys.
- Community discussions, reactions and moderation semantics.
- Studio AI prompt/generation semantics.
- Career-specific portfolio, placement and mentoring semantics.
- Marketplace catalog/offer/commission semantics beyond billing foundation.
- New schemas, migrations, services or endpoint contracts.

## Limites

Platform Core owns generic shared capabilities. Product domains own domain semantics. UserGroup is shared: Platform Core owns the generic group/access primitive; Learning Core owns cohort/turma pedagogy. Media, analytics, notifications, search and audit remain shared or require future ADRs before expansion.

## Consequências

- Future domains have a reusable map and anti-duplication rules.
- Learning Core boundaries are clarified against Platform Core.
- Capability maturity is honest: production-ready, operational, partial, experimental or missing.
- Roadmap remains incremental and reversible.
- No functional risk is introduced in this mission.

## Riscos

- Some capabilities may look complete by filename but remain partial operationally; this ADR records such uncertainty explicitly.
- Webhook delivery and audit coverage require focused follow-up.
- UserGroup may be overused as cohort unless Learning Core keeps pedagogical semantics separate.
- Feature gates may drift without a registry distinguishing billing gates from feature flags.

## Plano de reversão

Because this ADR is documentation-only, rollback is reverting `docs/xpex/platform-core/`, this ADR, and the Trinity Flow index update. No data, migrations, runtime contracts or dependencies need rollback.

## Questões abertas

- What is the authoritative audit event model for compliance-grade traces?
- Which webhook delivery guarantees are implemented and which are aspirational?
- Should notifications become a central event-driven service or remain email utilities?
- Should feature gating evolve into a formal registry or stay plan/usage-based?
- Which media lifecycle requirements are mandatory before production pilots scale?
