# First real staging execution plan

This package operationalizes the audited readiness from PRs #21 and #22 for the first real Google Cloud Run staging deploy. It is intentionally gated: commands marked `⚠️ COMANDO MUTÁVEL — EXECUÇÃO HUMANA APÓS APROVAÇÃO` are proposals only and must not be run by automation.

Use with `docs/deployment/first-real-staging-runbook.md`, `docs/deployment/first-staging-go-no-go.md`, `docs/deployment/staging-resource-inventory.md`, `docs/deployment/staging-readiness-report.md`, `docs/deployment/staging-cost-guardrails.md`, and `docs/deployment/staging-values.md`.

## FASE A — validar contexto
- **Objetivo:** confirm staging branch, commit, account, project and non-production targets.
- **Pré-condições:** PR #22 merged to `dev`; branch `codex/preparar-primeiro-deploy-real-staging`; local `.env.staging` untracked.
- **Comandos somente leitura:** `git status --short --branch`; `git rev-parse HEAD`; `git ls-files --error-unmatch .env.staging`; `scripts/render-first-staging-deploy-plan.sh --env-file .env.staging`.
- **Comandos mutáveis destacados:** none.
- **Operador responsável:** deployment operator.
- **Evidência a salvar:** command transcript and commit SHA.
- **Critério GO:** renderer returns `0` and target names contain no `prod`, `production`, or `main` token.
- **Critério PENDÊNCIA EXTERNA:** renderer returns `10` only for externally confirmable items.
- **Critério NO-GO:** renderer returns `20`, tracked env file, placeholder, wrong branch, or production-like target.
- **Ação de recuperação:** fix context/env outside Git, rerun renderer.
- **Ponto de aprovação humana:** approve continuing to resource confirmation.

## FASE B — confirmar recursos existentes
- **Objetivo:** prove Artifact Registry, service account, IAM, Cloud SQL, Redis, VPC connector, bucket, APIs and billing are available.
- **Pré-condições:** FASE A approved; read-only GCP access available.
- **Comandos somente leitura:** `scripts/audit-staging-resources.sh --env-file .env.staging`; `scripts/preflight-staging.sh --env-file .env.staging`.
- **Comandos mutáveis destacados:** none.
- **Operador responsável:** GCP operator.
- **Evidência a salvar:** sanitized audit/preflight logs.
- **Critério GO:** required resources and runtime IAM pass.
- **Critério PENDÊNCIA EXTERNA:** API/billing/resource cannot be queried by the operator but is attested by an authorized approver.
- **Critério NO-GO:** missing mandatory resource, disabled billing, missing API, insufficient IAM, or max instance guardrail violation.
- **Ação de recuperação:** resource owner fixes GCP state manually after approval; rerun read-only checks.
- **Ponto de aprovação humana:** approve mutable secret/build preparation only after evidence is attached.

## FASE C — preparar secrets
- **Objetivo:** confirm exact Secret Manager names exist without reading secret values.
- **Pré-condições:** FASE B GO; secret names match `staging-values`.
- **Comandos somente leitura:** `gcloud secrets describe "$SECRET_JWT_NAME" --project "$PROJECT_ID" --format='value(name)'` and equivalent SQL/Redis describe commands.
- **Comandos mutáveis destacados:** `⚠️ COMANDO MUTÁVEL — EXECUÇÃO HUMANA APÓS APROVAÇÃO gcloud secrets versions add ...` only if a missing/rotated secret is separately approved.
- **Operador responsável:** secrets operator.
- **Evidência a salvar:** secret names, not values.
- **Critério GO:** all exact names exist and values are confirmed out-of-band.
- **Critério PENDÊNCIA EXTERNA:** authorized secret owner must create/rotate value manually.
- **Critério NO-GO:** secret value requested, printed, committed, or wrong name.
- **Ação de recuperação:** stop automation; use approved secret procedure.
- **Ponto de aprovação humana:** approver signs checklist before build.

## FASE D — preparar build
- **Objetivo:** prepare immutable image command and tag/digest capture.
- **Pré-condições:** FASE C approved; cost guardrails accepted.
- **Comandos somente leitura:** `git rev-parse --short HEAD`; renderer output review.
- **Comandos mutáveis destacados:** `⚠️ COMANDO MUTÁVEL — EXECUÇÃO HUMANA APÓS APROVAÇÃO scripts/build-staging.sh --env-file .env.staging`.
- **Operador responsável:** release operator.
- **Evidência a salvar:** image URI and digest.
- **Critério GO:** build command matches project/region/repository and no secrets are printed.
- **Critério PENDÊNCIA EXTERNA:** Cloud Build quota/billing approval pending.
- **Critério NO-GO:** production project, mutable latest-only image with no digest capture, or secret leakage.
- **Ação de recuperação:** correct env/tag, rerender plan.
- **Ponto de aprovação humana:** approve build execution manually.

## FASE E — preparar deploy
- **Objetivo:** deploy only the approved image to staging Cloud Run with bounded scaling.
- **Pré-condições:** FASE D image digest captured; previous revision captured or first-deploy exception approved.
- **Comandos somente leitura:** `gcloud run services describe ... --format='value(status.latestReadyRevisionName,status.url)'`.
- **Comandos mutáveis destacados:** `⚠️ COMANDO MUTÁVEL — EXECUÇÃO HUMANA APÓS APROVAÇÃO scripts/deploy-staging.sh --env-file .env.staging`.
- **Operador responsável:** deployment operator.
- **Evidência a salvar:** deploy transcript, service URL, revision.
- **Critério GO:** max/min instances match guardrails and service account/IAM are correct.
- **Critério PENDÊNCIA EXTERNA:** first deploy has no previous revision and approver accepts rollback limitation.
- **Critério NO-GO:** deploy would alter production, exceed max instances, or use wrong service account.
- **Ação de recuperação:** abort deploy; rerender after correction.
- **Ponto de aprovação humana:** final approval immediately before manual deploy command.

## FASE F — verificar staging
- **Objetivo:** verify health, CORS, DB, Redis, storage and logs.
- **Pré-condições:** FASE E deploy completed manually.
- **Comandos somente leitura:** `scripts/verify-staging-deployment.sh "$STAGING_API_URL" "$STAGING_FRONTEND_ORIGIN"`; log read commands from runbook.
- **Comandos mutáveis destacados:** none.
- **Operador responsável:** verification operator.
- **Evidência a salvar:** evidence template fields and sanitized logs.
- **Critério GO:** all verification probes pass.
- **Critério PENDÊNCIA EXTERNA:** transient observation needs owner confirmation but service remains safe.
- **Critério NO-GO:** failed health/CORS/connectivity, 5xx spike, or cost anomaly.
- **Ação de recuperação:** proceed to rollback preparation/decision.
- **Ponto de aprovação humana:** approve final staging acceptance or rollback.

## FASE G — preparar rollback
- **Objetivo:** have a reviewed rollback command before declaring deploy accepted.
- **Pré-condições:** previous revision captured or first-deploy exception documented.
- **Comandos somente leitura:** `scripts/prepare-staging-rollback.sh --env-file .env.staging --previous-revision "$PREVIOUS_REVISION"`.
- **Comandos mutáveis destacados:** `⚠️ COMANDO MUTÁVEL — EXECUÇÃO HUMANA APÓS APROVAÇÃO scripts/prepare-staging-rollback.sh --env-file .env.staging --previous-revision "$PREVIOUS_REVISION" --execute`.
- **Operador responsável:** rollback operator.
- **Evidência a salvar:** proposed rollback command and previous revision.
- **Critério GO:** rollback proposal points to staging previous revision.
- **Critério PENDÊNCIA EXTERNA:** no previous revision on true first deploy; manual remediation documented.
- **Critério NO-GO:** rollback target unknown or production-like.
- **Ação de recuperação:** stop acceptance; decide rollback/fix-forward with approver.
- **Ponto de aprovação humana:** rollback/fix-forward decision.

## FASE H — emitir relatório final
- **Objetivo:** produce an honest final record.
- **Pré-condições:** FASE F and G complete.
- **Comandos somente leitura:** fill `docs/deployment/staging-execution-evidence-template.md` outside source control if it includes incident-sensitive data.
- **Comandos mutáveis destacados:** none.
- **Operador responsável:** release manager.
- **Evidência a salvar:** completed evidence record and go/no-go decision.
- **Critério GO:** all evidence attached, no open thread, checks green.
- **Critério PENDÊNCIA EXTERNA:** external owner signoff pending.
- **Critério NO-GO:** missing evidence or unresolved failure.
- **Ação de recuperação:** keep release open and document blocker.
- **Ponto de aprovação humana:** final staging acceptance.
