# Platform Core Boundaries

## O que pertence ao Platform Core

| Área | Responsabilidade |
|---|---|
| Authentication | Login, JWT, refresh token, logout/revocation, password verification and session dependencies. |
| Identity/users | User principal, public/private projections, anonymous/internal/token principals. |
| Organizations | Tenant identity, slug, membership, org config and org user administration. |
| Multi-tenancy | `org_id` boundaries, membership checks and tenant-aware access helpers. |
| Roles/permissions | Role, Rights, role type, RBAC dependencies, resource access and least privilege policy validation. |
| Billing foundation | Runtime plan catalog/configuration, billing usage, organization billing state, Stripe/provider config and org plan gates. |
| Storage foundation | Media models, local/S3 content delivery and shared file access. |
| Notifications foundation | Transactional email configuration and reusable email utilities. |
| Observability | Sentry, health/monitoring routers, analytics services and event foundations. |
| API tokens | Org-scoped API token model, hashing, rights and active/expiry lifecycle. |
| Webhook foundation | Org webhook endpoints, encrypted secret field and delivery log records. |
| Shared feature gating | Runtime plan/usage helpers and commercial entitlement gates. |

## O que não pertence

| Domínio | Excluído do Platform Core |
|---|---|
| Learning Core | Course, Chapter, Activity, Assignment, Submission, Trail, Certificate, teacher/student journey. |
| Community | Discussions, reactions, moderation and community-specific authoring workflows. |
| Studio AI | Prompting, AI generation, model/provider orchestration, playground-specific workflows. |
| Career | Career path, portfolio, placement, mentoring and professional journey entities. |
| Marketplace | Offers, catalog merchandising, commissions and product-specific commerce workflows beyond billing foundation. |

## Platform Core x Learning Core

Learning Core consumes `Organization`, `User`, `UserOrganization`, `Role/Rights`, RBAC, UserGroup, media, billing gates and observability. It owns the pedagogical meaning of courses, cohorts, progress and certificates. It must not create parallel auth, tenant, user, role, payment or storage abstractions.

## Platform Core x Community

Community may use users, orgs, roles, media and observability. It owns discussion models, moderation policy, reactions and community surfaces. It must not implement separate identity, membership or upload systems.

## Platform Core x Studio AI

Studio AI may use identity, org plan/usage gates, API tokens, observability and media. It owns AI prompts, generations, model selection and Studio-specific UX. It must not bypass org plan gates or store provider secrets outside shared configuration patterns.

## Platform Core x Career

Career should consume Platform Core identity, org, roles, media and observability. Career-specific portfolios, jobs, assessments and mentoring require dedicated ADRs before models or endpoints are added.

## Platform Core x Marketplace

Marketplace may consume billing foundation, orgs, users, roles, media and notifications. It owns offer/catalog semantics and commercial workflows not already represented by plans/payments. It must not duplicate Stripe/provider configuration.

## Regras de não duplicação

1. No product domain may create a separate user, tenant, session, role, permission, billing provider, storage provider or observability stack.
2. Shared capabilities must have one architectural owner and documented consumer contracts.
3. If a product domain needs a new rights bucket, feature gate or audit event, it requests an extension to Platform Core instead of adding local authorization logic.
4. Generic primitives stay in Platform Core; domain semantics stay with the product domain.
5. Any new model or migration that touches shared identity, tenancy, permissions, billing, media or audit requires a future ADR.
