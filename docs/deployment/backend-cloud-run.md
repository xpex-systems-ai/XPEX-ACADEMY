# XPeX Academy backend remoto — Cloud Run staging

Este documento registra a auditoria da API FastAPI e a rota reproduzível recomendada para executar o backend em um ambiente remoto moderno, preferencialmente Google Cloud Run. Ele não publica nada em produção e mantém o frontend apontando para `localhost` até que uma URL remota seja validada.

## Resultado da auditoria

| Item | Resultado |
| --- | --- |
| Dockerfile | `apps/api/Dockerfile` já usa imagem Python slim, instala dependências nativas de sistema, copia o projeto, executa `uv sync --frozen`, expõe uma porta e configura `ENTRYPOINT`/`HEALTHCHECK`. |
| Ponto de entrada | A aplicação FastAPI é exportada como `app` em `apps/api/app.py`; o entrypoint inicia `uvicorn app:app`. |
| Porta esperada | O container expõe `9000`, mas o runtime resolve a porta por `PORT > LEARNHOUSE_PORT > 9000`, compatível com Cloud Run. |
| Bind | O entrypoint força `--host 0.0.0.0`, necessário para tráfego externo no container. |
| Python | `pyproject.toml` exige `>=3.14.3,<3.15`; o Dockerfile usa `python:3.14.3-slim-bookworm`, preservando a família 3.14. |
| Lockfile | O build usa `uv sync --frozen`, portanto `uv.lock` é obrigatório e não deve ser alterado sem necessidade comprovada. |
| Dependências nativas | O Dockerfile instala `build-essential`, `ffmpeg`, `curl` e `netcat-openbsd`; as dependências Python incluem extensões nativas como NumPy via `llama-index-core`/stack de IA, `psycopg2-binary`, `asyncpg`, `cryptography`, `tiktoken` e `pypdf`. |
| Health endpoint | `GET /api/v1/health`; o healthcheck do container chama essa rota em `127.0.0.1:${PORT}`. |
| Variáveis obrigatórias | `LEARNHOUSE_AUTH_JWT_SECRET_KEY` é obrigatória e deve ter pelo menos 32 caracteres. Para staging remoto com banco e Redis reais, também configurar domínio, frontend, origens CORS, PostgreSQL e Redis. |
| Banco de dados | A API usa `LEARNHOUSE_SQL_CONNECTION_STRING`; as migrações Alembic também leem essa variável e convertem `postgresql+asyncpg://` para `postgresql://` quando necessário. |
| Redis | A API usa `LEARNHOUSE_REDIS_CONNECTION_STRING`; o entrypoint aguarda o host/porta quando a variável está definida. |
| Storage | O padrão é filesystem; para Cloud Run recomenda-se `LEARNHOUSE_CONTENT_DELIVERY_TYPE=s3api` com bucket externo porque o filesystem do container é efêmero. |
| JWT secret | Validado no boot; não deve ser commitado. Use Secret Manager. |
| CORS | Configurado por `LEARNHOUSE_ALLOWED_ORIGINS` e `LEARNHOUSE_ALLOWED_REGEXP`; manter localhost enquanto não houver URL remota validada. |
| Migrações | Alembic está presente em `apps/api/migrations`; executar antes de validar tráfego de staging. |
| Cloud Run | O Dockerfile/entrypoint atual já atende aos requisitos mínimos: `PORT`, bind `0.0.0.0`, healthcheck e start por `uvicorn app:app`. |

## Arquitetura recomendada para staging

1. **Cloud Run service privado ou sem divulgação pública inicial** para a API, construído a partir de `apps/api/Dockerfile`.
2. **Artifact Registry** para armazenar a imagem do backend.
3. **Cloud SQL PostgreSQL** como banco relacional. Habilitar `pgvector` se os recursos de RAG/embeddings forem usados.
4. **Memorystore for Redis** ou Redis gerenciado equivalente acessível pelo Cloud Run via VPC connector quando necessário.
5. **Cloud Storage ou S3 compatível** para conteúdo persistente, configurando a API em modo `s3api`; não depender do filesystem local do container para arquivos de usuário.
6. **Secret Manager** para JWT, strings de conexão, tokens de IA/e-mail/pagamento e chaves internas.
7. **Cloud Run revisions** para promover staging de forma reversível. Não apontar o frontend de produção até validar a URL de staging.

## Variáveis obrigatórias para staging

Definir como variáveis de ambiente não secretas quando não contiverem credenciais:

- `LEARNHOUSE_ENV=staging`
- `LEARNHOUSE_DEVELOPMENT_MODE=false`
- `LEARNHOUSE_TENANCY=single` inicialmente, salvo necessidade comprovada de multi-tenant/EE.
- `LEARNHOUSE_DOMAIN=<host-da-api-ou-domínio-staging>`
- `LEARNHOUSE_FRONTEND_DOMAIN=localhost:3000` até existir frontend remoto validado.
- `LEARNHOUSE_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001` inicialmente; adicionar a origem remota somente após validação.
- `LEARNHOUSE_SSL=true` quando exposto por HTTPS no Cloud Run/domínio.
- `LEARNHOUSE_CONTENT_DELIVERY_TYPE=s3api` para uso persistente de conteúdo no Cloud Run.
- `LEARNHOUSE_S3_API_BUCKET_NAME=<bucket-de-staging>` quando `s3api` estiver habilitado.
- `LEARNHOUSE_S3_API_ENDPOINT_URL=<endpoint>` somente se o storage não usar endpoint padrão do provedor.
- `LEARNHOUSE_IS_AI_ENABLED=false` inicialmente, a menos que as chaves e limites de custo estejam aprovados.

## Secrets

Armazenar fora do repositório, preferencialmente no Secret Manager:

- `LEARNHOUSE_AUTH_JWT_SECRET_KEY` — obrigatório, mínimo 32 caracteres.
- `LEARNHOUSE_SQL_CONNECTION_STRING` — PostgreSQL de staging.
- `LEARNHOUSE_REDIS_CONNECTION_STRING` — Redis de staging.
- `LEARNHOUSE_AI_API_KEY` e/ou `LEARNHOUSE_GEMINI_API_KEY`, se IA for habilitada.
- `LEARNHOUSE_RESEND_API_KEY` ou `LEARNHOUSE_SMTP_PASSWORD`, se e-mail for habilitado.
- `LEARNHOUSE_STRIPE_SECRET_KEY`, `LEARNHOUSE_STRIPE_WEBHOOK_STANDARD_SECRET`, `LEARNHOUSE_STRIPE_WEBHOOK_CONNECT_SECRET` e `LEARNHOUSE_STRIPE_CLIENT_ID`, se pagamentos forem habilitados.
- `LEARNHOUSE_TINYBIRD_INGEST_TOKEN` e `LEARNHOUSE_TINYBIRD_READ_TOKEN`, se analytics for habilitado.
- `LEARNHOUSE_JUDGE0_CLIENT_SECRET`, se Judge0 for habilitado.
- `CLOUD_INTERNAL_KEY` e `LEARNHOUSE_PLATFORM_API_KEY`, somente para modo SaaS/integrações internas.
- Credenciais do provedor de storage, quando não forem resolvidas por identidade do workload.

## Comandos reproduzíveis

Executar a partir da raiz do repositório.

### Build local da imagem

```bash
docker build -f apps/api/Dockerfile -t xpex-academy-api:staging apps/api
```

### Start local compatível com Cloud Run

```bash
docker run --rm \
  -e PORT=8080 \
  -e LEARNHOUSE_ENV=staging \
  -e LEARNHOUSE_DEVELOPMENT_MODE=false \
  -e LEARNHOUSE_AUTH_JWT_SECRET_KEY='<secret-manager-ou-valor-local-temporario>' \
  -e LEARNHOUSE_SQL_CONNECTION_STRING='<postgresql-url>' \
  -e LEARNHOUSE_REDIS_CONNECTION_STRING='<redis-url>' \
  -p 8080:8080 \
  xpex-academy-api:staging
```

### Build remoto no Google Cloud

```bash
gcloud builds submit apps/api \
  --tag REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/xpex-academy-api:staging
```

### Deploy de staging no Cloud Run

Este comando é referência operacional; executar somente após aprovação explícita para deploy:

```bash
gcloud run deploy xpex-academy-api-staging \
  --image REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/xpex-academy-api:staging \
  --region REGION \
  --platform managed \
  --port 8080 \
  --set-env-vars LEARNHOUSE_ENV=staging,LEARNHOUSE_DEVELOPMENT_MODE=false,LEARNHOUSE_TENANCY=single,LEARNHOUSE_FRONTEND_DOMAIN=localhost:3000,LEARNHOUSE_ALLOWED_ORIGINS=http://localhost:3000\,http://localhost:3001,LEARNHOUSE_SSL=true \
  --set-secrets LEARNHOUSE_AUTH_JWT_SECRET_KEY=learnhouse-auth-jwt-secret-key:latest,LEARNHOUSE_SQL_CONNECTION_STRING=learnhouse-sql-connection-string:latest,LEARNHOUSE_REDIS_CONNECTION_STRING=learnhouse-redis-connection-string:latest
```

### Migrações

Executar contra o banco de staging antes do tráfego real:

```bash
cd apps/api
LEARNHOUSE_AUTH_JWT_SECRET_KEY='<secret>' \
LEARNHOUSE_SQL_CONNECTION_STRING='<postgresql-url>' \
uv run alembic upgrade head
```

### Health check

```bash
curl -fsS http://127.0.0.1:8080/api/v1/health
```

No Cloud Run, trocar `127.0.0.1:8080` pela URL de staging validada.

## Validação mínima antes de staging

```bash
cd apps/api
uv sync --frozen
LEARNHOUSE_AUTH_JWT_SECRET_KEY='<secret-temporario-com-32+-chars>' uv run python -c "import numpy; print(numpy.__version__)"
LEARNHOUSE_AUTH_JWT_SECRET_KEY='<secret-temporario-com-32+-chars>' uv run python -c "import app; print(app.app.title)"
PORT=8080 LEARNHOUSE_AUTH_JWT_SECRET_KEY='<secret-temporario-com-32+-chars>' uv run uvicorn app:app --host 0.0.0.0 --port 8080
curl -fsS http://127.0.0.1:8080/api/v1/health
uv run pytest src/tests/routers/test_health_router.py src/tests/core/test_middleware_cors.py
```

## Riscos e mitigação

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| NumPy/extensões nativas no host antigo | Bloqueia validação local em hardware legado. | Validar em Cloud Run/build remoto ou máquina x86_64 moderna com Python 3.14. |
| Filesystem efêmero do Cloud Run | Perda de uploads/conteúdo entre instâncias/revisions. | Usar storage externo (`s3api`) para staging. |
| Banco/Redis privados | API pode falhar no boot ou health se rede/VPC estiver incorreta. | Configurar Cloud SQL connector/VPC connector e testar conectividade antes de abrir tráfego. |
| Migrações pendentes | Inconsistência de schema em staging. | Rodar `alembic upgrade head` com a mesma connection string do serviço. |
| CORS/cookies incorretos | Frontend não autentica ou chamadas são bloqueadas. | Manter localhost até URL remota validada; depois ajustar `LEARNHOUSE_ALLOWED_ORIGINS`, `LEARNHOUSE_FRONTEND_DOMAIN` e cookie/tenancy conscientemente. |
| Secrets ausentes | Boot falha ou endpoints internos retornam 403. | Provisionar Secret Manager e anexar secrets ao serviço. |
| Custos de IA/e-mail/pagamentos | Geração de custo ou chamadas reais indesejadas. | Manter IA/e-mail/pagamentos desligados até aprovação e usar chaves de sandbox/staging. |

## Arquivos que precisaram ser alterados

- Apenas este documento foi adicionado. Nenhuma versão de Python, NumPy, dependências ou `uv.lock` foi alterada.

## Conclusão da implementação mínima

O Dockerfile atual é suficiente para a primeira validação remota em staging: ele preserva Python 3.14, instala dependências nativas, usa `uv sync --frozen`, inicia `uvicorn app:app`, respeita `PORT` e faz bind em `0.0.0.0`. A pendência principal é externa ao código: provisionar banco, Redis, storage persistente e secrets em ambiente remoto moderno.
