# Manifesto de configuração de staging

Este manifesto é um formulário de preenchimento pelo proprietário do ambiente. Use apenas placeholders neste arquivo; valores reais, credenciais e secrets devem ficar fora do Git e ser carregados por `.env.staging` local ou pelo Secret Manager.

| Campo | Placeholder | Como preencher com segurança |
| --- | --- | --- |
| `GCP_PROJECT_ID` | `<GCP_PROJECT_ID>` | ID do projeto GCP isolado de staging. Não use projetos contendo `prod`, `production` ou `main`. |
| `GCP_REGION` | `<GCP_REGION>` | Região única para Cloud Run, Artifact Registry e recursos regionais. |
| `ARTIFACT_REPOSITORY` | `<ARTIFACT_REPOSITORY>` | Nome do repositório Docker regional no Artifact Registry. |
| `CLOUD_RUN_SERVICE` | `<CLOUD_RUN_SERVICE>` | Nome do serviço Cloud Run de staging. |
| `CLOUD_RUN_SA` | `<CLOUD_RUN_SA>` | E-mail da service account dedicada ao Cloud Run, com IAM mínimo. |
| `CLOUD_SQL_INSTANCE` | `<GCP_PROJECT_ID>:<GCP_REGION>:<CLOUD_SQL_INSTANCE>` | Nome completo da instância Cloud SQL PostgreSQL de staging. |
| `DB_NAME` | `<DB_NAME>` | Database dedicado de staging. Não use bancos de produção. |
| `DB_USER` | `<DB_USER>` | Usuário dedicado de staging, com privilégios mínimos. |
| `REDIS_INSTANCE` | `<REDIS_INSTANCE>` | Nome da instância Redis/Memorystore ou identificador do Redis externo aprovado. |
| `VPC_CONNECTOR` | `<VPC_CONNECTOR>` | Conector Serverless VPC Access quando Cloud SQL/Redis privados exigirem rede privada. |
| `STAGING_BUCKET` | `<STAGING_BUCKET>` | Bucket de staging para mídia/conteúdo. Deve ser separado de produção. |
| `STAGING_API_HOST` | `<STAGING_API_HOST>` | Host público da API de staging, sem protocolo. |
| `STAGING_API_URL` | `https://<STAGING_API_HOST>` | URL pública da API de staging. |
| `STAGING_FRONTEND_ORIGIN` | `https://<STAGING_FRONTEND_ORIGIN>` | Origem exata permitida no CORS para o frontend de staging. |
| Secret JWT | `<SECRET_NAME_AUTH_JWT>` | Nome do secret `LEARNHOUSE_AUTH_JWT_SECRET_KEY` no Secret Manager. Nunca registre o valor. |
| Secret SQL | `<SECRET_NAME_SQL_CONNECTION>` | Nome do secret `LEARNHOUSE_SQL_CONNECTION_STRING` no Secret Manager. Deve apontar para banco de staging. |
| Secret Redis | `<SECRET_NAME_REDIS_CONNECTION>` | Nome do secret `LEARNHOUSE_REDIS_CONNECTION_STRING` no Secret Manager. Deve apontar para Redis de staging. |
| Secret S3 access key | `<SECRET_NAME_S3_ACCESS_KEY>` | Nome do secret para HMAC/access key quando storage S3/XML API for usado. |
| Secret S3 secret key | `<SECRET_NAME_S3_SECRET_KEY>` | Nome do secret para secret key S3/HMAC. |
| Secret integrações | `<SECRET_NAME_INTEGRATION>` | Nomes de secrets sandbox para AI, e-mail, pagamentos e analytics quando habilitados. |
| `IMAGE_TAG` | `<IMAGE_TAG>` | Tag imutável da imagem, preferencialmente SHA curto do commit. |
| `MAX_INSTANCES` | `<MAX_INSTANCES>` | Limite baixo de instâncias para controlar custo de staging. |

## Mapeamento esperado para `.env.staging`

Os nomes públicos oficiais são `GCP_PROJECT_ID`, `GCP_REGION`, `CLOUD_RUN_SERVICE`, `CLOUD_RUN_SA` e `STAGING_BUCKET`. Os scripts normalizam esses nomes antes da validação e ainda aceitam arquivos antigos com aliases legados:

- `GCP_PROJECT_ID` é normalizado internamente para `PROJECT_ID`.
- `GCP_REGION` é normalizado internamente para `REGION`.
- `CLOUD_RUN_SERVICE` é normalizado internamente para `SERVICE_NAME`.
- `CLOUD_RUN_SA` é normalizado internamente para `CLOUD_RUN_SERVICE_ACCOUNT`.
- `STAGING_BUCKET` é normalizado internamente para `GCS_BUCKET`.

## Rota de storage para staging

A implementação atual suporta storage local ou `s3api`. Para Cloud Run staging, use `s3api` com GCS pela compatibilidade S3/XML API ou um provedor S3 compatível externo. A aplicação lê `LEARNHOUSE_S3_API_BUCKET_NAME` e `LEARNHOUSE_S3_API_ENDPOINT_URL`; credenciais S3/HMAC devem ser fornecidas somente por secrets do runtime, nunca neste manifesto.
