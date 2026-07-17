# Staging Topology

```mermaid
flowchart TD
  GH[GitHub dev branch] --> Vercel[Vercel Web staging]
  GH --> RailwayAPI[Railway API service]
  GH --> RailwayCollab[Railway Collab service optional]
  Vercel -->|public API URL| RailwayAPI
  Vercel -. websocket/collab UI .-> RailwayCollab
  RailwayCollab -->|internal key + API URL| RailwayAPI
  RailwayAPI --> PG[(Managed PostgreSQL)]
  RailwayAPI -. optional cache .-> Redis[(Managed Redis)]
  RailwayCollab --> Redis
  RailwayAPI --> S3[(S3-compatible private bucket)]
  RailwayAPI -. errors/traces .-> Sentry[Sentry]
```

## Contracts

- Web is independently built but functionally depends on API URLs and tenant/domain config.
- API owns secrets, persistence, auth, RBAC, storage, email, billing and AI integrations.
- Collab is isolated as a separate Railway service if MVP scope requires it.
- PostgreSQL is mandatory; Redis is feature-dependent for API and required for Collab.
- Storage must be S3-compatible for staging/production media.
