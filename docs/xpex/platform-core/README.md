# XpeX Platform Core — Capability Registry

## Visão

MISSION-008 estabelece o **Platform Core** como fonte oficial de verdade para capacidades compartilhadas da XpeX Academy. O núcleo sustenta identidade, organizações, roles, RBAC, billing foundation, storage/media, notificações, observabilidade, API tokens, webhooks e feature gating sem criar arquitetura paralela ao LearnHouse.

## Escopo

Inclui capacidades reutilizáveis por Learning, Community, Studio AI, Career e Marketplace. Exclui cursos, capítulos, atividades, assignments, submissions, progresso, certificados, jornadas pedagógicas e customizações de domínio, que permanecem no Learning Core ou em domínios futuros.

## Princípios

- Platform Core deve permanecer pequeno, estável e reutilizável.
- Domínios de produto não duplicam autenticação, usuários, organizações, roles, storage ou observabilidade.
- Toda maturidade registrada deriva de evidência em caminhos reais do repositório.
- Capacidades parciais, experimentais e ausentes não são promovidas a prontas.
- Limites arquiteturais devem ser auditáveis e reversíveis.

## Status

| Item | Estado |
|---|---|
| Código funcional | Não alterado |
| Modelos/migrations/endpoints/componentes | Não criados |
| Dependências/lockfiles/workflows | Não alterados |
| Registro oficial | Proposto nesta missão |
| ADR | [ADR-004 — Platform Core](../adr/ADR-004-PLATFORM-CORE.md) |

## Capacidades

| Domínio | Status predominante | Evidências principais |
|---|---|---|
| Authentication | Production ready | `apps/api/src/security/auth.py`, `apps/api/src/routers/auth.py`, `apps/web/services/auth/` |
| Users and Identity | Production ready | `apps/api/src/db/users.py`, `apps/api/src/services/users/`, `apps/api/src/routers/users.py` |
| Organizations and Multi-Tenancy | Production ready | `apps/api/src/db/organizations.py`, `apps/api/src/db/user_organizations.py`, `apps/api/src/security/org_auth.py` |
| Roles and Permissions | Production ready | `apps/api/src/db/roles.py`, `apps/api/src/security/rbac/`, `apps/api/src/security/role_policy_validator.py` |
| User Groups | Partial/shared | `apps/api/src/db/usergroups.py`, `apps/api/src/services/users/usergroups.py`, `apps/api/src/routers/usergroups.py` |
| Billing and Plans | Operational | `apps/api/src/routers/plans.py`, `apps/api/src/security/features_utils/plans.py`, `apps/api/src/routers/orgs/org_plan.py`, `apps/api/src/db/billing_usage.py`, `apps/api/config/config.py` |
| Storage and Media | Operational | `apps/api/src/services/media/`, `apps/api/src/routers/media/`, `apps/api/config/config.py` |
| Notifications | Partial | `apps/api/src/services/email/`, `apps/web/services/emails/`, `apps/api/config/config.py` |
| Observability | Operational | `apps/api/app.py`, `apps/api/config/config.py`, `apps/api/src/services/analytics/`, `apps/web/services/analytics/` |
| API Tokens and Webhooks | Operational/partial | `apps/api/src/db/api_tokens.py`, `apps/api/src/db/webhooks.py`, `apps/api/src/routers/api_tokens.py`, `apps/api/src/routers/webhooks.py` |
| Feature Gates | Partial | `apps/api/src/security/features_utils/plans.py`, `apps/api/src/security/features_utils/usage.py`, `apps/web/services/billing/guard.ts` |
| Audit and Governance | Partial/documented | `apps/api/src/db/webhooks.py`, `apps/web/services/ee/audit_logs.ts`, `docs/trinity-flow/` |

## Limites

- Platform Core owns: authentication, identity, users, organizations, multi-tenancy, roles, permissions, storage foundation, billing foundation, observability, API tokens, webhook foundation and shared gates.
- Learning Core owns: course structure, learning journey, assignments, submissions, progress and certificates.
- Shared capabilities requiring explicit contracts: usergroups, media, analytics, notifications, search and audit logs.

## Relação com Learning Core

Learning Core consome Organization, User, UserOrganization, Role/Rights, RBAC, media/storage, billing gates and observability. It must not create parallel tenant, session, permission, payment, file or logging abstractions. See [Learning Core blueprint](../learning-core/README.md).

## Links

- [Capability Registry](CAPABILITY_REGISTRY.md)
- [Boundaries](BOUNDARIES.md)
- [Dependency Map](DEPENDENCY_MAP.md)
- [Entity Relationship](ENTITY_RELATIONSHIP.md)
- [Service Catalog](SERVICE_CATALOG.md)
- [Security Boundaries](SECURITY_BOUNDARIES.md)
- [Gap Analysis](GAP_ANALYSIS.md)
- [Implementation Roadmap](IMPLEMENTATION_ROADMAP.md)
- [ADR-004](../adr/ADR-004-PLATFORM-CORE.md)

## Próximas missões

Recomendação para MISSION-009: formalizar contratos mínimos de observability/audit e gaps de webhook delivery sem alterar endpoints ou schema até aprovação de ADR específica.
