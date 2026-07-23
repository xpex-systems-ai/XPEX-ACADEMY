# Runbook operacional — primeiro deploy real controlado de staging

Este runbook é seguro por padrão. Nesta missão nenhum deploy real foi executado, nenhum recurso GCP foi criado, nenhuma API foi habilitada e nenhum secret real foi utilizado. Tudo que depende do GCP deve ser tratado como **a confirmar no GCP**.

Comandos marcados com `⚠️ COMANDO MUTÁVEL — EXECUÇÃO HUMANA APÓS APROVAÇÃO` podem criar/alterar recursos, submeter build, implantar serviço, mudar tráfego, criar secret ou alterar IAM. O Codex não deve executá-los.

## Separação deliberada das etapas

- Preflight: `scripts/preflight-staging.sh --env-file .env.staging`.
- Build: `scripts/build-staging.sh --env-file .env.staging --image-tag <TAG>` em dry-run; adicionar `--execute` só após aprovação.
- Deploy: `scripts/deploy-staging.sh --dry-run --env-file .env.staging`; `DRY_RUN=false` só após aprovação.
- Verify: `scripts/verify-staging-deployment.sh <URL_STAGING> <ORIGEM_PERMITIDA>`.
- Rollback: `scripts/prepare-staging-rollback.sh --env-file .env.staging --previous-revision <REVISAO_CONCRETA>`.

## FASE 0 — Pré-requisitos locais

**Objetivo:** Validar ferramentas locais.

**Comando:** `bash --version && git status --short --branch && command -v gcloud docker curl`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 1 — Seleção segura da conta e projeto

**Objetivo:** Confirmar conta/projeto sem alterar projeto ativo.

**Comando:** `gcloud auth list --filter=status:ACTIVE --format="value(account)" && gcloud config get-value project`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 2 — Verificação de billing e APIs

**Objetivo:** Confirmar billing e APIs obrigatórias.

**Comando:** `gcloud billing projects describe "$GCP_PROJECT_ID" --format="value(billingEnabled)" && gcloud services list --project "$GCP_PROJECT_ID" --enabled`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 3 — Auditoria dos recursos

**Objetivo:** Preencher inventário com evidências.

**Comando:** `cat docs/deployment/staging-resource-inventory.md`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 4 — Preparação manual de secrets

**Objetivo:** Criar/rotacionar secrets fora deste runbook automatizado.

**Comando:** `⚠️ COMANDO MUTÁVEL — EXECUÇÃO HUMANA APÓS APROVAÇÃO: gcloud secrets versions add SECRET --data-file=-`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 5 — Preenchimento local do .env.staging

**Objetivo:** Criar arquivo local não rastreado.

**Comando:** `cp .env.staging.example .env.staging && editor .env.staging`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 6 — Execução do check-env

**Objetivo:** Validar contrato local sem GCP.

**Comando:** `scripts/check-env.sh .env.staging`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 7 — Execução do preflight real

**Objetivo:** Consultar GCP somente leitura.

**Comando:** `scripts/preflight-staging.sh --env-file .env.staging`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 8 — Execução do dry-run

**Objetivo:** Renderizar plano sem mudar recursos.

**Comando:** `scripts/deploy-staging.sh --dry-run --env-file .env.staging`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 9 — Revisão humana GO/NO-GO

**Objetivo:** Decidir se há autorização.

**Comando:** `cat docs/deployment/first-staging-go-no-go.md`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 10 — Build controlado

**Objetivo:** Submeter build somente após aprovação.

**Comando:** `⚠️ COMANDO MUTÁVEL — EXECUÇÃO HUMANA APÓS APROVAÇÃO: scripts/build-staging.sh --env-file .env.staging --image-tag <TAG> --execute`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 11 — Deploy controlado

**Objetivo:** Implantar imagem aprovada.

**Comando:** `⚠️ COMANDO MUTÁVEL — EXECUÇÃO HUMANA APÓS APROVAÇÃO: DRY_RUN=false IMAGE_TAG=<TAG> scripts/deploy-staging.sh --env-file .env.staging`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 12 — Verificação pós-deploy

**Objetivo:** Validar URL real de staging.

**Comando:** `scripts/verify-staging-deployment.sh "$STAGING_API_URL" "$STAGING_FRONTEND_ORIGIN"`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 13 — Smoke tests

**Objetivo:** Validar health, HTTP, JSON, CORS e 404.

**Comando:** `scripts/verify-staging-deployment.sh "$STAGING_API_URL" "$STAGING_FRONTEND_ORIGIN" https://not-allowed.example.test`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 14 — Observação de logs

**Objetivo:** Inspecionar inicialização e ausência de secrets.

**Comando:** `gcloud logging read "resource.type=cloud_run_revision" --project "$GCP_PROJECT_ID" --limit=50`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 15 — Rollback

**Objetivo:** Preparar rollback com revisão concreta; executar só se aprovado.

**Comando:** `scripts/prepare-staging-rollback.sh --env-file .env.staging --previous-revision <REVISAO_CONCRETA>`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## FASE 16 — Registro de evidências

**Objetivo:** Salvar saídas, decisões e hashes.

**Comando:** `mkdir -p evidence/staging-$(date +%Y%m%d) && git rev-parse HEAD`

**Pré-condições:** branch aprovada, `.env.staging` local não rastreado quando aplicável, conta/projeto corretos confirmados, e nenhuma credencial impressa.

**Saída esperada:** comando retorna código 0 ou fornece informação suficiente para classificar `GO`/`PENDÊNCIA EXTERNA` sem revelar secrets.

**Critérios de sucesso:** evidência salva, escopo staging confirmado, sem token `prod`, `production` ou `main`, e nenhum comando mutável executado sem aprovação humana.

**Critérios de falha:** saída vazia inesperada, recurso ausente não aceito, IAM insuficiente, placeholder, secret exibido, URL de produção, revisão de rollback indefinida ou erro não explicado.

**Ação de recuperação:** parar, registrar `NO-GO`, corrigir externamente com responsável apropriado, repetir somente a fase afetada e anexar nova evidência.

**Evidência que precisa ser salva:** stdout/stderr redigido, horário UTC, operador, commit, projeto, região, status GO/NO-GO e links para logs/workflows.

## Lacunas e riscos auditados

- O rollback antigo usava `PREVIOUS_REVISION` como placeholder; agora o fluxo exige revisão concreta ou bloqueia.
- Build, deploy, verify e rollback permanecem comandos separados para evitar automação cega.
- Recursos como Cloud SQL, Redis, bucket, VPC Connector, domínio, IAM e secrets podem existir ou não; todos seguem `a confirmar no GCP`.
- Custos contínuos são prováveis para Cloud SQL, Redis e VPC Connector; veja `staging-cost-guardrails.md`.
- A verificação simulada não prova disponibilidade real nem prontidão para deploy real.
