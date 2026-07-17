# Environment Variable Inventory

No values are recorded. Variables below are names and classifications only.

| Variable | Service | Category | Boot? | Feature | Frontend safe? | Secret? | Default behavior / risk if missing | Staging recommendation |
|---|---|---|---|---|---|---|---|---|
| LEARNHOUSE_AUTH_JWT_SECRET_KEY | API, Collab | secret | Yes | auth, webhook encryption | No | Yes | API raises security error; Collab exits | Set only in Railway API/Collab |
| LEARNHOUSE_SQL_CONNECTION_STRING | API | database_connection | Yes for real staging | persistence, health | No | Yes | Health fails without usable DB | Railway/API env from managed PostgreSQL |
| LEARNHOUSE_REDIS_CONNECTION_STRING | API | cache_connection | No for basic boot | revocation/cache/usage if configured | No | Yes | Some revocation/cache paths degrade | Add if staging needs Redis-backed features |
| LEARNHOUSE_REDIS_URL | Collab | cache_connection | Practical yes for Collab | ydoc cache | No | Yes | Defaults to localhost Redis, unsafe for Railway | Set on Collab if deployed |
| COLLAB_INTERNAL_KEY | API, Collab | secret | Yes for Collab | board ydoc internal API | No | Yes | Collab exits; API internal board route rejects | Shared only between API/Collab Railway services |
| LEARNHOUSE_API_URL | Collab | runtime_configuration | Yes for Collab integration | board persistence | No | No | Defaults localhost | Set to internal/public API URL |
| COLLAB_PORT / PORT / LEARNHOUSE_PORT | Collab/Web/API | runtime_configuration | Yes | port binding | No | No | Defaults 4000/3000/config port | Align with Railway/Vercel conventions |
| LEARNHOUSE_SITE_NAME, LEARNHOUSE_SITE_DESCRIPTION, LEARNHOUSE_CONTACT_EMAIL | API | runtime_configuration | No | branding/email | Yes if displayed | No | YAML/default fallback | Set explicit staging values |
| LEARNHOUSE_ENV, LEARNHOUSE_DEVELOPMENT_MODE, LEARNHOUSE_SAAS, LEARNHOUSE_TENANCY | API/Web | runtime_configuration | Yes for correct behavior | environment, tenancy, gates | Some public derivatives only | No | Wrong mode can expose docs or misroute tenants | Use staging/prod-like non-dev values |
| LEARNHOUSE_DOMAIN, LEARNHOUSE_FRONTEND_DOMAIN, LEARNHOUSE_ALLOWED_ORIGINS, LEARNHOUSE_ALLOWED_REGEXP, LEARNHOUSE_COOKIE_DOMAIN | API/Web | runtime_configuration | Yes for auth/CORS | tenancy and cookies | Domain names only | Cookie domain not secret | CORS/auth failures or tenant leakage risk | Define exact Vercel/Railway domains |
| NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL, NEXT_PUBLIC_LEARNHOUSE_API_URL, NEXT_PUBLIC_LEARNHOUSE_DOMAIN, NEXT_PUBLIC_LEARNHOUSE_ENV | Web | public_build_variable | Yes for frontend integration | API calls/domain routing | Yes | No | UI points at localhost/missing API | Vercel public env only |
| NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST, NEXT_PUBLIC_LEARNHOUSE_SENTRY_DSN, NEXT_PUBLIC_UNSPLASH_ACCESS_KEY | Web | observability/optional_integration | No | analytics/media | Yes | No by convention | Feature disabled or degraded | Optional; do not add private tokens |
| LEARNHOUSE_CONTENT_DELIVERY_TYPE, LEARNHOUSE_S3_API_BUCKET_NAME, LEARNHOUSE_S3_API_ENDPOINT_URL, LEARNHOUSE_S3_API_REGION | API | storage_credential/config | Required for S3 mode | media/content | No | Endpoint/bucket not secret; credentials are external secret chain | Filesystem fallback is not suitable for production media | Use S3-compatible storage for staging/prod |
| AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION/AWS_DEFAULT_REGION | API | storage/provider_credential | Required for S3 providers needing keys | S3/R2/Bedrock | No | Yes except region | S3/Bedrock calls fail | Railway API env only if provider requires static keys |
| LEARNHOUSE_IS_AI_ENABLED, LEARNHOUSE_AI_PROVIDER, LEARNHOUSE_AI_API_KEY, LEARNHOUSE_GEMINI_API_KEY, LEARNHOUSE_AI_* | API | optional_integration/secret | No | AI generation/RAG/media | No | Keys secret | AI disabled or calls fail | Keep disabled until AI mission provisions keys |
| LEARNHOUSE_EMAIL_PROVIDER, LEARNHOUSE_RESEND_API_KEY, LEARNHOUSE_SYSTEM_EMAIL_ADDRESS, LEARNHOUSE_SMTP_* | API | optional_integration/secret | No | transactional email | No | API keys/password secret | Emails fail/degrade | Configure after domain/email decision |
| LEARNHOUSE_SENTRY_DSN, LEARNHOUSE_TINYBIRD_* | API | observability_configuration | No | monitoring/analytics | No | Tokens secret; DSN generally non-secret but backend only | Observability reduced | Add after Sentry/Tinybird project approval |
| LEARNHOUSE_STRIPE_* / STRIPE_* | API/Web tests/config | provider_credential | No | billing | Publishable key frontend-safe only | Secret keys/webhooks secret | Billing disabled/fails | Out of scope for staging unless billing tested |
| CLOUD_INTERNAL_KEY, LEARNHOUSE_PLATFORM_API_KEY, LOOPS_API_KEY, CRON_SECRET, TURNSTILE_SECRET_KEY | API | provider/internal secret | No | cloud admin, packs, marketing, cron, captcha | No | Yes | Related endpoints reject or no-op | Do not provision unless feature is in staging scope |
| LEARNHOUSE_INITIAL_ADMIN_EMAIL, LEARNHOUSE_INITIAL_ADMIN_PASSWORD, LEARNHOUSE_INITIAL_ORG_NAME, LEARNHOUSE_INITIAL_ORG_SLUG | API/CLI/setup | development/setup secret | Not runtime | bootstrap | No | Password secret | Needed only by setup flows | Use one-time secret handling, not docs |

## Public vs secret rule

Only `NEXT_PUBLIC_*` values and explicitly public publishable keys belong in Vercel frontend variables. Database URLs, JWT secrets, Redis URLs, storage keys, SMTP passwords, Stripe secrets and internal keys must stay in Railway/provider secret stores.
