# Primeiro deploy manual de staging — auditoria GO/NO-GO

> **Status:** PRONTO PARA O PRIMEIRO DEPLOY MANUAL DE STAGING, desde que o proprietário preencha os campos marcados e execute os comandos manualmente no Google Cloud. Este documento é um plano operacional: nenhum recurso foi criado e nenhum deploy foi executado nesta auditoria.

## Campos que o proprietário precisa preencher

| Campo | Placeholder | Observação |
| --- | --- | --- |
| Projeto GCP | `<GCP_PROJECT_ID>` | Projeto isolado para staging. |
| Região | `<GCP_REGION>` | Recomendado: `us-central1` para menor custo/boa disponibilidade nos EUA. |
| Repositório Artifact Registry | `<ARTIFACT_REPOSITORY>` | Ex.: `xpex-academy-staging`. |
| Serviço Cloud Run | `<CLOUD_RUN_SERVICE>` | Ex.: `xpex-academy-api-staging`. |
| Cloud SQL instance | `<CLOUD_SQL_INSTANCE>` | Ex.: `xpex-academy-staging-db`. |
| Database | `<DB_NAME>` | Ex.: `learnhouse_staging`. |
| Database user | `<DB_USER>` | Ex.: `learnhouse_staging`. |
| Redis instance | `<REDIS_INSTANCE>` | Memorystore ou alternativa externa. |
| Bucket | `<STAGING_BUCKET>` | Conteúdo persistente; filesystem do Cloud Run é efêmero. |
| Service account | `<CLOUD_RUN_SA>` | Ex.: `xpex-staging-runner@<GCP_PROJECT_ID>.iam.gserviceaccount.com`. |
| VPC connector | `<VPC_CONNECTOR>` | Necessário para Redis privado e, se aplicável, rede privada. |
| URL da API | `<STAGING_API_URL>` | Preencher após deploy manual. |
| URL do frontend | `<STAGING_FRONTEND_ORIGIN>` | Usar origem exata para CORS/cookies. |

## Fase 1 — auditoria final do repositório

| Item | Resultado |
| --- | --- |
| `cloudbuild.yaml` | **Pendente no checkout atual:** arquivo não existe; se Cloud Build for obrigatório, criar/recuperar antes do GO final. |
| `.github/workflows/staging.yml` | **Pendente no checkout atual:** workflow não existe; primeiro deploy pode ser manual, mas CI de staging não está versionado neste branch. |
| Dockerfile da API | OK: `apps/api/Dockerfile` usa Python 3.14.3 slim, `uv sync --frozen`, `HEALTHCHECK`, `ENTRYPOINT` e expõe `9000`. |
| `scripts/check-env.sh` | **Pendente no checkout atual:** arquivo não existe. |
| `scripts/deploy-staging.sh` | **Pendente no checkout atual:** arquivo não existe. |
| `scripts/verify-staging.sh` | **Pendente no checkout atual:** arquivo não existe. |
| Scripts de rollback | **Pendente no checkout atual:** não há script dedicado encontrado. Rollback manual por Cloud Run revisions está documentado abaixo. |
| `.env.staging.example` | **Pendente no checkout atual:** arquivo não existe. Usar placeholders deste documento até adicionar exemplo versionado sem segredos. |
| `.gitignore` | OK: ignora `.env`, variantes locais, tokens Tinybird, `.learnhouse/`, `.vercel/` e artefatos comuns. |
| Health endpoint | OK: `GET /api/v1/health`; healthcheck local do container usa `127.0.0.1:${PORT}/api/v1/health`. |
| CORS | OK com ressalva: política é tenancy-aware, permite credenciais e restringe origem por domínio/frontend configurados ou regex explícita. Validar valores antes de abrir tráfego. |
| `PORT` | OK: runtime resolve `PORT > LEARNHOUSE_PORT > 9000`, compatível com Cloud Run. |
| `app:app` | OK: entrypoint executa `uv run uvicorn app:app`. |
| Cloud SQL | Externo: aplicação usa `LEARNHOUSE_SQL_CONNECTION_STRING`; Alembic também lê essa variável. Recurso ainda precisa ser criado manualmente. |
| Redis | Externo: aplicação usa `LEARNHOUSE_REDIS_CONNECTION_STRING`; entrypoint aguarda host/porta se configurado. Recurso ainda precisa ser criado manualmente. |
| Storage | Externo: para Cloud Run, usar storage persistente (`s3api`/bucket). Não depender de filesystem local. |
| Secret Manager | Externo: obrigatório para JWT e connection strings; não commitar valores reais. |
| IAM | Externo: service account mínima deve receber acesso a secrets, Cloud SQL, logs e storage. |
| Artifact Registry | Externo: repositório Docker precisa ser criado manualmente. |
| Cloud Run | Externo: serviço precisa ser criado por comando manual; não executar nesta PR. |
| Migrações Alembic | OK: `apps/api/migrations/env.py` substitui URL pelo `LEARNHOUSE_SQL_CONNECTION_STRING` e converte `postgresql+asyncpg://` para `postgresql://`. |

## Fase 2 — inventário de recursos Google Cloud necessários

### APIs a ativar

- Cloud Run Admin API: `run.googleapis.com`
- Cloud Build API: `cloudbuild.googleapis.com`
- Artifact Registry API: `artifactregistry.googleapis.com`
- Cloud SQL Admin API: `sqladmin.googleapis.com`
- Secret Manager API: `secretmanager.googleapis.com`
- Serverless VPC Access API: `vpcaccess.googleapis.com`
- Memorystore/Redis API: `redis.googleapis.com`
- Cloud Storage API: `storage.googleapis.com`
- IAM Service Account Credentials API: `iamcredentials.googleapis.com`
- Cloud Logging API: `logging.googleapis.com`
- Cloud Monitoring API: `monitoring.googleapis.com`

### Recursos

| Recurso | Configuração econômica recomendada | Obrigatório? |
| --- | --- | --- |
| Projeto GCP | `<GCP_PROJECT_ID>` separado de produção | Sim |
| Região | `us-central1` | Sim |
| Artifact Registry | Docker repository regional | Sim |
| Cloud Run service | 0 min instances, 1 CPU, 512Mi-1Gi, concurrency padrão, max instances baixo | Sim |
| Cloud SQL PostgreSQL | Menor instância aceitável para staging, SSD mínimo, backups conforme política | Sim se banco gerenciado for usado |
| Database | `<DB_NAME>` | Sim |
| Database user | `<DB_USER>` com senha em Secret Manager | Sim |
| Redis | Menor tier Memorystore ou Redis externo | Opcional se recursos dependentes forem desativados; recomendado |
| Bucket | Standard regional, lifecycle curto | Sim para uploads/conteúdo persistente |
| Service account | Uma SA dedicada para Cloud Run | Sim |
| VPC connector | Menor throughput | Sim para Redis privado; opcional para Cloud SQL por conector público/connector nativo |
| Secrets | JWT, SQL URL, Redis URL, storage keys se necessárias, chaves de integrações sandbox | Sim |
| IAM | `roles/secretmanager.secretAccessor`, `roles/cloudsql.client`, permissões de bucket mínimas, `roles/logging.logWriter` | Sim |

## Fase 3 — estimativa inicial de custos

> Valores dependem de região, tráfego e pricing vigente. Confirmar na calculadora oficial antes da execução.

### Custo obrigatório

- **Cloud Run:** mínimo com `min-instances=0`; custo tende a ser baixo e proporcional a requests/CPU/memória.
- **Cloud SQL PostgreSQL:** principal custo fixo; usar menor instância aceitável para staging e parar/remover quando não estiver em uso prolongado.
- **Artifact Registry:** baixo custo por armazenamento de imagens; manter política de limpeza.
- **Cloud Storage:** baixo custo para poucos GB; configurar lifecycle para objetos temporários.
- **Logs/Monitoring:** geralmente baixo em staging, mas limitar verbosidade e retenção.

### Custo opcional

- **Memorystore Redis:** custo fixo relevante mesmo sem tráfego; usar somente se a validação exigir Redis gerenciado.
- **VPC connector:** pode gerar custo fixo; necessário para Redis privado.
- **Backups/alta disponibilidade:** úteis, mas podem ser reduzidos em staging.

### Substituível por alternativa gratuita ou externa

- Redis pode ser substituído temporariamente por Redis externo/free tier controlado, se compatível com segurança.
- Storage S3 API pode usar provedor compatível externo/sandbox, desde que credenciais fiquem no Secret Manager.
- Cloud Build pode ser substituído por build local + push manual para Artifact Registry, se o ambiente local estiver autorizado.

## Fase 4 — comandos operacionais prontos para execução manual

> **Não executar automaticamente.** Substituir todos os placeholders antes de rodar.

```bash
# Autenticar e selecionar projeto
gcloud auth login
gcloud auth application-default login
gcloud config set project <GCP_PROJECT_ID>

# Ativar APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com vpcaccess.googleapis.com redis.googleapis.com storage.googleapis.com iamcredentials.googleapis.com logging.googleapis.com monitoring.googleapis.com

# Artifact Registry
gcloud artifacts repositories create <ARTIFACT_REPOSITORY> --repository-format=docker --location=<GCP_REGION> --description="XPeX Academy staging images"

# Service account
gcloud iam service-accounts create <CLOUD_RUN_SA_NAME> --display-name="XPeX Academy staging Cloud Run"

# Secrets sem expor valores no shell history: cole via stdin quando solicitado
printf '%s' '<JWT_SECRET_32_PLUS_CHARS>' | gcloud secrets create learnhouse-auth-jwt-secret-key --data-file=-
printf '%s' '<POSTGRESQL_CONNECTION_STRING>' | gcloud secrets create learnhouse-sql-connection-string --data-file=-
printf '%s' '<REDIS_CONNECTION_STRING>' | gcloud secrets create learnhouse-redis-connection-string --data-file=-

# IAM mínimo
gcloud projects add-iam-policy-binding <GCP_PROJECT_ID> --member="serviceAccount:<CLOUD_RUN_SA>" --role="roles/secretmanager.secretAccessor"
gcloud projects add-iam-policy-binding <GCP_PROJECT_ID> --member="serviceAccount:<CLOUD_RUN_SA>" --role="roles/cloudsql.client"
gcloud storage buckets add-iam-policy-binding gs://<STAGING_BUCKET> --member="serviceAccount:<CLOUD_RUN_SA>" --role="roles/storage.objectAdmin"

# Banco
gcloud sql instances create <CLOUD_SQL_INSTANCE> --database-version=POSTGRES_16 --tier=<SMALLEST_ACCEPTABLE_TIER> --region=<GCP_REGION> --storage-size=<MIN_STORAGE_GB> --availability-type=zonal
gcloud sql databases create <DB_NAME> --instance=<CLOUD_SQL_INSTANCE>
gcloud sql users create <DB_USER> --instance=<CLOUD_SQL_INSTANCE> --password='<DB_PASSWORD_PLACEHOLDER>'

# Redis e VPC connector
gcloud compute networks vpc-access connectors create <VPC_CONNECTOR> --region=<GCP_REGION> --range=<CIDR_RANGE_PLACEHOLDER> --min-instances=2 --max-instances=3
gcloud redis instances create <REDIS_INSTANCE> --size=1 --region=<GCP_REGION> --redis-version=redis_7_0

# Bucket
gcloud storage buckets create gs://<STAGING_BUCKET> --location=<GCP_REGION> --uniform-bucket-level-access

# Migrações Alembic contra staging
cd apps/api
LEARNHOUSE_AUTH_JWT_SECRET_KEY='<JWT_SECRET_32_PLUS_CHARS>' LEARNHOUSE_SQL_CONNECTION_STRING='<POSTGRESQL_CONNECTION_STRING>' uv run alembic upgrade head
cd ../..

# Build e push
gcloud builds submit apps/api --tag <GCP_REGION>-docker.pkg.dev/<GCP_PROJECT_ID>/<ARTIFACT_REPOSITORY>/xpex-academy-api:staging-<GIT_SHA>

# Deploy Cloud Run
gcloud run deploy <CLOUD_RUN_SERVICE> --image <GCP_REGION>-docker.pkg.dev/<GCP_PROJECT_ID>/<ARTIFACT_REPOSITORY>/xpex-academy-api:staging-<GIT_SHA> --region <GCP_REGION> --platform managed --service-account <CLOUD_RUN_SA> --port 8080 --allow-unauthenticated --min-instances 0 --max-instances <MAX_INSTANCES> --set-env-vars LEARNHOUSE_ENV=staging,LEARNHOUSE_DEVELOPMENT_MODE=false,LEARNHOUSE_TENANCY=single,LEARNHOUSE_FRONTEND_DOMAIN=<STAGING_FRONTEND_ORIGIN>,LEARNHOUSE_DOMAIN=<STAGING_API_HOST>,LEARNHOUSE_SSL=true,LEARNHOUSE_CONTENT_DELIVERY_TYPE=s3api,LEARNHOUSE_S3_API_BUCKET_NAME=<STAGING_BUCKET> --set-secrets LEARNHOUSE_AUTH_JWT_SECRET_KEY=learnhouse-auth-jwt-secret-key:latest,LEARNHOUSE_SQL_CONNECTION_STRING=learnhouse-sql-connection-string:latest,LEARNHOUSE_REDIS_CONNECTION_STRING=learnhouse-redis-connection-string:latest --vpc-connector <VPC_CONNECTOR>

# Verificações
curl -fsS <STAGING_API_URL>/api/v1/health
gcloud run services describe <CLOUD_RUN_SERVICE> --region <GCP_REGION>
gcloud run services logs read <CLOUD_RUN_SERVICE> --region <GCP_REGION> --limit 100

# Rollback para revision anterior
gcloud run revisions list --service <CLOUD_RUN_SERVICE> --region <GCP_REGION>
gcloud run services update-traffic <CLOUD_RUN_SERVICE> --region <GCP_REGION> --to-revisions <PREVIOUS_REVISION>=100

# Exclusão de recursos de staging
gcloud run services delete <CLOUD_RUN_SERVICE> --region <GCP_REGION>
gcloud artifacts repositories delete <ARTIFACT_REPOSITORY> --location <GCP_REGION>
gcloud sql instances delete <CLOUD_SQL_INSTANCE>
gcloud redis instances delete <REDIS_INSTANCE> --region <GCP_REGION>
gcloud compute networks vpc-access connectors delete <VPC_CONNECTOR> --region <GCP_REGION>
gcloud storage rm -r gs://<STAGING_BUCKET>
gcloud secrets delete learnhouse-auth-jwt-secret-key
gcloud secrets delete learnhouse-sql-connection-string
gcloud secrets delete learnhouse-redis-connection-string
```

## Fase 5 — GO/NO-GO

### Pré-requisitos

- Branch de staging revisada e PR aprovada.
- Projeto GCP e billing aprovados pelo proprietário.
- Placeholders preenchidos com valores de staging.
- Secrets criados somente no Secret Manager.
- Custo fixo de Cloud SQL/Redis/VPC connector aceito.
- Janela de rollback definida.

### Ordem exata de execução

1. Confirmar custos e região.
2. Autenticar `gcloud` e selecionar projeto.
3. Ativar APIs.
4. Criar Artifact Registry, service account, bucket, Cloud SQL, database/user, Redis e VPC connector.
5. Criar secrets com valores de staging.
6. Conceder IAM mínimo.
7. Executar migrações Alembic.
8. Buildar e publicar imagem.
9. Executar deploy Cloud Run manual.
10. Verificar health, logs, CORS e fluxo mínimo de autenticação.
11. Registrar URL/revision implantada.

### Checklist manual

- [ ] `cloudbuild.yaml`, `staging.yml` e scripts ausentes foram conscientemente dispensados ou adicionados em PR posterior.
- [ ] Nenhum secret real foi commitado.
- [ ] `LEARNHOUSE_AUTH_JWT_SECRET_KEY` tem 32+ caracteres.
- [ ] `LEARNHOUSE_SQL_CONNECTION_STRING` aponta para staging.
- [ ] `LEARNHOUSE_REDIS_CONNECTION_STRING` aponta para staging ou recurso foi dispensado.
- [ ] Bucket de conteúdo está configurado para persistência.
- [ ] CORS contém apenas origens esperadas.
- [ ] Cloud Run usa service account dedicada.
- [ ] Rollback por revision foi testado conceitualmente antes de tráfego real.

### Critérios de sucesso

- Deploy manual conclui sem criar recursos fora do inventário.
- `GET /api/v1/health` retorna sucesso na URL de staging.
- Logs não mostram falha de conexão com PostgreSQL, Redis, storage ou secrets.
- Migrações Alembic finalizam em `head`.
- Sem uso de secrets reais em arquivos versionados.

### Critérios de aborto

- Ausência de aprovação de custo/billing.
- Falha em criar secrets ou IAM mínimo.
- Migração Alembic falha ou fica parcialmente aplicada.
- Health endpoint falha após deploy.
- Logs mostram erro de CORS, banco, Redis, storage ou JWT.
- Qualquer comando aponta para produção/main/projeto incorreto.

### Plano de rollback

1. Listar revisions do serviço.
2. Direcionar 100% do tráfego para a revision anterior conhecida.
3. Confirmar health/logs.
4. Se necessário, desabilitar tráfego público ou excluir o serviço de staging.
5. Registrar causa e não tentar novo deploy sem correção.

### Riscos e pendências externas

- Arquivos esperados pela missão (`cloudbuild.yaml`, `.github/workflows/staging.yml`, scripts e `.env.staging.example`) não existem neste checkout; isso não bloqueia um deploy manual documentado, mas bloqueia a conclusão de uma esteira automatizada de staging.
- Cloud SQL, Redis, bucket, Secret Manager, IAM e Artifact Registry dependem de execução manual do proprietário.
- Memorystore e VPC connector podem gerar custo fixo mesmo ocioso.
- Configuração incorreta de CORS/cookies pode impedir login pelo frontend.

## Conclusão

**PRONTO PARA O PRIMEIRO DEPLOY MANUAL DE STAGING**, condicionado ao aceite explícito das pendências externas, preenchimento dos placeholders e execução manual dos comandos pelo proprietário. Não executar deploy nesta PR.
