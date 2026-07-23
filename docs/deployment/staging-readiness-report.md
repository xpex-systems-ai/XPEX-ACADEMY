# Relatório de prontidão de staging — auditoria somente leitura

- **Commit auditado:** `2296d31890a28116beb5adf28451d39a885cf414`
- **Data/hora UTC:** `2026-07-23T17:22:24Z`
- **Conta GCP:** `<não consultável neste ambiente; redigida>`
- **Projeto:** `<pendente de .env.staging real>`
- **Região:** `<pendente de .env.staging real>`
- **Modo:** somente leitura; nenhum deploy, migration, criação de recurso, habilitação de API, criação de secret ou alteração IAM foi executado.

## Evidência local

| Verificação | Evidência | Classificação |
|---|---|---|
| Branch de trabalho | `codex/auditar-recursos-de-staging` criada a partir do commit de merge do PR #21. | GO |
| Commit base | `2296d31890a28116beb5adf28451d39a885cf414` (`Merge pull request #21 from xpex-systems-ai/codex/criar-runbook-para-deploy-controlado`). | GO |
| Disponibilidade do `gcloud` | `command -v gcloud` não retornou caminho; `gcloud auth list --filter=status:ACTIVE --format='value(account)'` retornou `gcloud: command not found`. | PENDÊNCIA EXTERNA |
| Arquivo de ambiente real | `.env.staging` real não foi fornecido ao container e não deve ser versionado. | PENDÊNCIA EXTERNA |
| Proteção contra dados sensíveis | O script novo valida exatamente `SECRET_JWT_NAME`, `SECRET_SQL_NAME` e `SECRET_REDIS_NAME` por nome e não chama `gcloud secrets versions access`. | GO |

## Recursos encontrados

Nenhum recurso GCP real foi confirmado neste ambiente porque o SDK `gcloud` não está instalado e não há conta/projeto autenticados disponíveis.

## Recursos ausentes ou não confirmados

Todos os itens abaixo permanecem **PENDÊNCIA EXTERNA** até execução por operador autenticado no projeto real de staging:

- conta autenticada;
- projeto ativo e projeto informado;
- billing habilitado;
- APIs obrigatórias (`run`, `cloudbuild`, `artifactregistry`, `secretmanager`, `sqladmin`, `storage`, `redis`, `vpcaccess`);
- Artifact Registry regional;
- serviço Cloud Run ou ausência aceitável antes do primeiro deploy;
- service account runtime;
- instância Cloud SQL, banco e usuário;
- Redis/Memorystore;
- VPC connector;
- bucket de staging;
- secrets exatos `SECRET_JWT_NAME`, `SECRET_SQL_NAME` e `SECRET_REDIS_NAME` sem leitura de valores;
- IAM mínimo para Cloud SQL, Secret Manager e Storage vinculado ao principal runtime;
- região real;
- cotas aplicáveis;
- limite de instâncias do Cloud Run.

## Permissões

A política IAM real não pôde ser consultada. A validação esperada é somente leitura via:

- `gcloud projects get-iam-policy "$GCP_PROJECT_ID" --format=json`
- `gcloud iam service-accounts describe "$CLOUD_RUN_SA" --project "$GCP_PROJECT_ID" --format='value(email)'`

A decisão permanece **PENDÊNCIA EXTERNA** porque não há evidência real de papéis mínimos nem de ausência de privilégios excessivos.

## Riscos

- Deploy real não deve ocorrer até a confirmação de billing, APIs, IAM, banco, Redis, bucket, VPC connector e secrets.
- Cloud Run pode estar ausente antes do primeiro deploy; isso é aceitável apenas se todos os demais pré-requisitos estiverem prontos e o runbook aprovar a criação/deploy por ação humana posterior.
- Billing desabilitado, APIs ausentes após consulta bem-sucedida, IAM insuficiente no principal runtime, secrets exatos ausentes ou targets com `prod`, `production` ou `main` devem ser tratados como **NO-GO** pelo script; falha de permissão em `services list` permanece **PENDÊNCIA EXTERNA** sem checar APIs individuais.
- A ausência de `gcloud` neste container impede conclusão de prontidão real; não é evidência de que os recursos existam.

## Custos estimados por categoria

Sem acesso ao projeto real, os custos não foram calculados com preços exatos. A estimativa qualitativa permanece:

| Categoria | Estimativa qualitativa | Observação |
|---|---|---|
| Cloud Run | Baixo a variável | Controlar com `min-instances=0` e `MAX_INSTANCES<=20`, preferencialmente menor. |
| Cloud Build | Baixo e episódico | Incorre em minutos de build somente quando builds reais forem submetidos. |
| Artifact Registry | Baixo | Depende de imagens armazenadas e retenção. |
| Cloud SQL | Contínuo relevante | Principal custo fixo provável de staging. |
| Redis/Memorystore | Contínuo | Custo enquanto provisionado. |
| VPC connector | Contínuo/throughput | Usar apenas se SQL/Redis privados exigirem. |
| Storage | Baixo a variável | Depende de objetos, operações e egress. |
| Logging/Monitoring | Variável | Depende de volume e retenção. |
| Egress | Variável | Depende de tráfego público e integrações. |

## Decisão final

**PENDÊNCIA EXTERNA**.

Motivo: o ambiente de auditoria não possui `gcloud`, conta autenticada, projeto ativo nem `.env.staging` real. Não há evidência suficiente para declarar **GO** para o primeiro deploy real. Execute `scripts/audit-staging-resources.sh --env-file .env.staging` em uma estação segura autenticada no projeto de staging e anexe a saída redigida antes de autorizar qualquer deploy ou migration.
