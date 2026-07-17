# Staging Validation Checklist

Execute only after future provisioning/deploy authorization.

| Scenario | Expected result |
|---|---|
| API health | `/api/v1/health` passes on effective Railway port. |
| Web to API | Web calls only `https://api.academy-staging.example.com/api/v1/` when consuming the API URL directly. |
| CORS allowed origin | `https://academy-staging.example.com` accepted with credentials. |
| CORS unknown origin | Unknown, production, localhost, and unapproved preview origins denied. |
| Cookie attributes | Staging cookie is Secure, scoped to `.academy-staging.example.com`, covers Web/API/Collab/tenant hosts, and does not collide with production. |
| Login/refresh/logout | Auth works without logging cookie/token contents. |
| Anonymous access | Protected routes reject anonymous requests. |
| Tenant access | Pilot org user can access pilot org. |
| Wrong tenant | Non-pilot org user is denied pilot resources. |
| Missing optional secret | Optional feature is disabled or fails explicitly per contract. |
| Collab disabled | MVP without Collab has documented UI/API behavior. |
| Collab enabled | Collab health, Redis, internal key, and board persistence work. |
| Storage | Upload/download uses staging S3-compatible storage and any public media URL uses `https://media.academy-staging.example.com` only after approval. |
| Rotation rehearsal | JWT/internal/storage key rotation plan is executable without commit. |

Record date, commit, provider project names, commands, results, and rollback decision in the future deployment mission.
