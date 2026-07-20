# Primeiro deploy manual de staging — auditoria GO/NO-GO

> **Status:** PRONTO PARA O PRIMEIRO DEPLOY MANUAL DE STAGING. A branch foi atualizada para refletir a infraestrutura versionada após a PR #18: `cloudbuild.yaml`, `.github/workflows/staging.yml`, `.env.staging.example`, scripts de staging e documentação operacional estão presentes. Nenhum deploy foi executado, nenhum recurso pago foi criado e nenhum secret real foi usado.

## Arquivos auditados e fonte operacional

| Item | Resultado |
| --- | --- |
| `cloudbuild.yaml` | OK: define build Docker da API com `apps/api/Dockerfile`, imagem regional no Artifact Registry e substitutions para região, repositório, imagem e tag. |
| `.github/workflows/staging.yml` | OK: workflow manual de staging valida template, shell scripts e renderiza dry-run; não faz deploy por padrão. |
| `apps/api/Dockerfile` | OK: usa Python 3.14.3 slim, `uv sync --frozen`, `HEALTHCHECK`, `ENTRYPOINT` e expõe `9000`. |
| `scripts/check-env.sh` | OK: valida chaves obrigatórias do arquivo de ambiente e rejeita padrões de secrets reais de alto risco. |
| `scripts/deploy-staging.sh` | OK: integra `cloudbuild.yaml`, Cloud Run e Secret Manager; suporta `--dry-run` para revisão segura sem criar recursos. |
| `scripts/verify-staging.sh` | OK: valida `GET /api/v1/health` contra URL informada. |
| `.env.staging.example` | OK: contém somente placeholders e nomes de secrets, sem valores reais. |
| `.gitignore` | OK: ignora `.env`, variantes locais, tokens Tinybird, `.learnhouse/`, `.vercel/` e artefatos comuns. |
| `docs/deployment/cloud-run-staging.md` | OK: resume o processo Cloud Run e reforça que o deploy real depende de aprovação externa. |
| `docs/deployment/deployment-checklist.md` | OK: checklist operacional para antes, durante e depois do deploy manual. |
| `docs/deployment/rollback.md` | OK: rollback por revisão do Cloud Run e verificação de health. |
| `docs/deployment/operations.md` | OK: comandos de rotina, logs, dry-run e verificação. |
| Health endpoint | OK: `GET /api/v1/health`; o healthcheck do container usa `127.0.0.1:${PORT}/api/v1/health`. |
| CORS | OK com validação manual: política tenancy-aware restringe origens por domínio/frontend configurados ou regex explícita. |
| `PORT` | OK: runtime resolve `PORT > LEARNHOUSE_PORT > 9000`, compatível com Cloud Run. |
| `app:app` | OK: entrypoint executa `uv run uvicorn app:app`. |
| Cloud SQL | Pendente externo: aplicação e Alembic usam `LEARNHOUSE_SQL_CONNECTION_STRING`; recurso, database, user e secret devem ser criados pelo proprietário. |
| Redis | Pendente externo: aplicação usa `LEARNHOUSE_REDIS_CONNECTION_STRING`; recurso e secret devem ser criados pelo proprietário se Redis for exigido. |
| Storage | Pendente externo: bucket persistente deve ser criado e referenciado por `LEARNHOUSE_S3_API_BUCKET_NAME`. |
| Secret Manager | Pendente externo: criar secrets reais fora do repositório. |
| IAM | Pendente externo: conceder permissões mínimas à service account do Cloud Run. |
| Artifact Registry | Pendente externo: criar repositório Docker regional antes do build real. |
| Cloud Run | Pendente externo: criar/atualizar serviço manualmente somente após GO. |
| Migrações Alembic | OK: `apps/api/migrations/env.py` lê `LEARNHOUSE_SQL_CONNECTION_STRING` e converte `postgresql+asyncpg://` para `postgresql://`. |

## Campos que o proprietário precisa preencher

| Campo | Placeholder |
| --- | --- |
| Projeto GCP | `<GCP_PROJECT_ID>` |
| Região recomendada | `<GCP_REGION>`; recomendação inicial: `us-central1` |
| Artifact Registry | `<ARTIFACT_REPOSITORY>` |
| Cloud Run service | `<CLOUD_RUN_SERVICE>` |
| Cloud SQL instance | `<CLOUD_SQL_INSTANCE>` |
| Database/database user | `<DB_NAME>` / `<DB_USER>` |
| Redis | `<REDIS_INSTANCE>` ou alternativa externa aprovada |
| Bucket | `<STAGING_BUCKET>` |
| Service account | `<CLOUD_RUN_SA>` |
| VPC connector | `<VPC_CONNECTOR>` quando Redis privado for usado |
| Secrets | nomes no Secret Manager, nunca valores reais no git |
| Domínio/API/frontend | `<STAGING_API_URL>`, `<STAGING_API_HOST>`, `<STAGING_FRONTEND_ORIGIN>` |

## Inventário de recursos Google Cloud

### APIs a ativar manualmente

- `run.googleapis.com`
- `cloudbuild.googleapis.com`
- `artifactregistry.googleapis.com`
- `sqladmin.googleapis.com`
- `secretmanager.googleapis.com`
- `vpcaccess.googleapis.com`
- `redis.googleapis.com`
- `storage.googleapis.com`
- `iamcredentials.googleapis.com`
- `logging.googleapis.com`
- `monitoring.googleapis.com`

### Recursos mínimos

| Recurso | Configuração econômica | Obrigatório |
| --- | --- | --- |
| Projeto GCP | Isolado de produção | Sim |
| Região | `us-central1` salvo restrição do proprietário | Sim |
| Artifact Registry | Docker repository regional | Sim |
| Cloud Run | `min-instances=0`, max instances baixo, 512Mi-1Gi, porta 8080 | Sim |
| Cloud SQL PostgreSQL | Menor instância aceitável, zonal, SSD mínimo | Sim para banco gerenciado |
| Database/user | Banco e usuário dedicados de staging | Sim |
| Redis | Menor Memorystore ou Redis externo | Recomendado/opcional conforme funcionalidades |
| Bucket | Regional, uniform bucket-level access, lifecycle curto | Sim para conteúdo persistente |
| Service account | Dedicada ao Cloud Run | Sim |
| VPC connector | Menor configuração aceitável | Sim para Redis privado |
| Secret Manager | JWT, SQL URL, Redis URL, integrações sandbox | Sim |
| IAM | Secret accessor, Cloud SQL client, storage mínimo, logging | Sim |

## Estimativa inicial de custos

### Custo obrigatório

- **Cloud Run:** baixo em staging com `min-instances=0`; proporcional a uso.
- **Cloud SQL:** principal custo fixo; usar menor instância aceitável e revisar horários de uso.
- **Artifact Registry:** baixo para poucas imagens; configurar limpeza de tags antigas.
- **Cloud Storage:** baixo para poucos GB; usar lifecycle.
- **Logging/Monitoring:** controlar volume e retenção.

### Custo opcional

- **Memorystore Redis:** custo fixo mesmo sem tráfego; habilitar somente quando necessário.
- **VPC connector:** pode ter custo fixo; necessário para Redis privado.
- **Backups/alta disponibilidade:** úteis, mas reduzir em staging se o proprietário aceitar risco.

### Substituível por alternativa gratuita/externa

- Redis externo/free tier controlado.
- Storage S3 compatível externo/sandbox, com credenciais no Secret Manager.
- Build local + push manual, se Cloud Build ainda não estiver aprovado.

## Processo operacional com scripts versionados

1. Preencher uma cópia local de `.env.staging.example` sem commitar secrets.
2. Validar ambiente: `scripts/check-env.sh <ENV_FILE>`.
3. Revisar o deploy sem efeitos colaterais: `scripts/deploy-staging.sh --dry-run --env-file <ENV_FILE>`.
4. Ativar APIs e criar recursos externos aprovados no GCP.
5. Criar secrets reais no Secret Manager.
6. Conceder IAM mínimo à service account.
7. Executar migrações Alembic manualmente contra o banco de staging.
8. Executar o build versionado por `cloudbuild.yaml` e deploy Cloud Run via script sem `--dry-run`, somente após GO explícito.
9. Verificar health: `scripts/verify-staging.sh <STAGING_API_URL>`.
10. Consultar logs e validar CORS/autenticação.
11. Se necessário, seguir `docs/deployment/rollback.md`.

## Comandos manuais complementares

```bash
# APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com vpcaccess.googleapis.com redis.googleapis.com storage.googleapis.com iamcredentials.googleapis.com logging.googleapis.com monitoring.googleapis.com

# Migrações Alembic
cd apps/api
LEARNHOUSE_AUTH_JWT_SECRET_KEY='<JWT_SECRET_32_PLUS_CHARS>' LEARNHOUSE_SQL_CONNECTION_STRING='<POSTGRESQL_CONNECTION_STRING>' uv run alembic upgrade head
cd ../..

# Logs
gcloud run services logs read <CLOUD_RUN_SERVICE> --region <GCP_REGION> --limit 100

# Rollback
gcloud run revisions list --service <CLOUD_RUN_SERVICE> --region <GCP_REGION>
gcloud run services update-traffic <CLOUD_RUN_SERVICE> --region <GCP_REGION> --to-revisions <PREVIOUS_REVISION>=100
```

## Checklist GO/NO-GO

### GO

- [ ] PR #19 atualizada sobre a dev mais recente.
- [ ] `cloudbuild.yaml`, workflow, scripts, env example e docs operacionais existem e foram auditados.
- [ ] Dry-run revisado e sem valores reais.
- [ ] Billing/custos aprovados.
- [ ] GCP project, IAM, Cloud SQL, Redis, bucket, Secret Manager e domínio aprovados.
- [ ] Migração Alembic planejada com janela de rollback.
- [ ] CORS/domínios validados para staging.

### NO-GO / aborto

- [ ] Qualquer placeholder ainda aponta para produção.
- [ ] Secret real aparece em arquivo versionado ou logs.
- [ ] IAM mínimo não foi concedido.
- [ ] Cloud SQL/Redis/storage não estão acessíveis.
- [ ] Alembic falha ou fica parcialmente aplicado.
- [ ] Health endpoint falha após deploy.
- [ ] Logs indicam erro de JWT, banco, Redis, storage, CORS ou porta.

## Pendências externas reais

- Aprovação de GCP project e billing.
- Criação/validação de IAM e service account.
- Criação de Cloud SQL, database e database user.
- Criação/validação de Redis ou alternativa externa.
- Criação de bucket persistente.
- Criação dos secrets reais no Secret Manager.
- Definição de domínio/URL de staging e origem frontend.

## Conclusão

**PR #19 ATUALIZADA SOBRE A DEV MAIS RECENTE** no contexto disponível deste workspace, com os artefatos da PR #18 integrados e auditados.

**PRONTA PARA MERGE**, desde que o proprietário confirme as pendências externas reais acima e mantenha a regra de não executar deploy antes do GO manual.
