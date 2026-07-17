# Entity Relationship Mapping — Platform Core

## Diagrama Mermaid

```mermaid
erDiagram
    USER ||--o{ USER_ORGANIZATION : joins
    ORGANIZATION ||--o{ USER_ORGANIZATION : scopes
    ROLE ||--o{ USER_ORGANIZATION : grants
    ORGANIZATION ||--o{ ROLE : owns_optional_org_roles
    ORGANIZATION ||--o{ USERGROUP : owns
    USERGROUP ||--o{ USERGROUP_USER : has_members
    USER ||--o{ USERGROUP_USER : member
    USERGROUP ||--o{ USERGROUP_RESOURCE : gates_resource
    ORGANIZATION ||--o{ PLAN : subscribes_or_references
    ORGANIZATION ||--o{ APITOKEN : scopes
    USER ||--o{ APITOKEN : creates
    ORGANIZATION ||--o{ WEBHOOK_ENDPOINT : owns
    USER ||--o{ WEBHOOK_ENDPOINT : creates
    WEBHOOK_ENDPOINT ||--o{ WEBHOOK_DELIVERY_LOG : records
    ORGANIZATION ||--o{ MEDIA : scopes
    MEDIA ||--o{ MEDIA_SHARE_TOKEN : may_share
```

## Entidades estruturais

| Entidade | Evidência | Responsabilidade | Escopo multi-tenant |
|---|---|---|---|
| Organization | `apps/api/src/db/organizations.py` | Tenant, slug, metadata and public org profile/config. | Root tenant boundary. |
| User | `apps/api/src/db/users.py` | Global identity, login fields, profile and principal projections. | Global user may relate to many orgs. |
| UserOrganization | `apps/api/src/db/user_organizations.py` | Membership bridge between User, Organization and Role. | Primary org membership boundary. |
| Role | `apps/api/src/db/roles.py` | Named rights bundle, global/org/org-token role type. | Optional `org_id`; org roles scoped to tenant. |
| Rights | `apps/api/src/db/roles.py` | Permission buckets and action flags. | Applied through org membership and resource checks. |
| UserGroup | `apps/api/src/db/usergroups.py` | Generic grouping primitive. | Organization-owned. |
| UserGroupUser | `apps/api/src/db/usergroup_user.py` | Membership in a group. | Must remain inside org context. |
| UserGroupResource | `apps/api/src/db/usergroup_resources.py` | Resource gate/lock. | Connects group to tenant resource UUIDs. |
| Plan | `apps/api/src/db/plans.py` | Product/commercial plan metadata. | Used by org plan/gating flows. |
| API Token | `apps/api/src/db/api_tokens.py` | Org-scoped programmatic credential with rights. | Explicit `org_id`. |
| WebhookEndpoint | `apps/api/src/db/webhooks.py` | Org webhook subscription endpoint. | Explicit `org_id`. |
| WebhookDeliveryLog | `apps/api/src/db/webhooks.py` | Delivery attempt record. | Inherits tenant via endpoint. |
| Media | `apps/api/src/db/media/media.py` | Shared media/file metadata. | Must be accessed through media authorization. |
| MediaShareToken | `apps/api/src/db/media/media_share_token.py` | Share-token support for media access. | Bound to media semantics. |

## Cardinalidades

- One `User` may have many `UserOrganization` memberships.
- One `Organization` may have many members, roles, groups, media records, API tokens and webhook endpoints.
- One `Role` may be assigned to many `UserOrganization` rows.
- One `UserGroup` may have many users and many gated resources.
- One API token belongs to one organization and one creating user.
- One webhook endpoint belongs to one organization and has many delivery logs.
- Plan relationships are operationally tied to org plan flows; exact subscription cardinality should be confirmed in a billing-focused mission before schema changes.

## Escopo multi-tenant

`org_id` is the architectural boundary for Platform Core resources. Authentication establishes principal identity; authorization and tenancy are enforced later by membership, role, rights, resource access and service-level checks. Domains must not assume a valid login implies tenant access.

## Inferências marcadas

- **Inferência:** `Media` is shown under `Organization` because media access is used by tenant resources; follow-up should verify every media path preserves org/resource ownership.
- **Inferência:** `Plan` cardinality is shown conceptually because org plan/payment services use plans; no new schema is introduced by this document.
