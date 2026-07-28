#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/bin"

cat > "$tmp/staging.env" <<'ENV'
GCP_PROJECT_ID=xpex-staging1
GCP_REGION=us-central1
ARTIFACT_REPOSITORY=staging-images
CLOUD_RUN_SERVICE=academy-staging
CLOUD_RUN_SA=runtime@xpex-staging1.iam.gserviceaccount.com
CLOUD_SQL_INSTANCE=xpex-staging1:us-central1:academy-db
DB_NAME=academy
DB_USER=academy
REDIS_INSTANCE=academy-cache
VPC_CONNECTOR=academy-vpc
STAGING_BUCKET=academy-staging-bucket
STAGING_API_HOST=staging.example.test
STAGING_API_URL=https://staging.example.test
MAX_INSTANCES=5
SECRET_JWT_NAME=staging-jwt
SECRET_SQL_NAME=staging-sql
SECRET_REDIS_NAME=staging-redis
ENV

cat > "$tmp/bin/gcloud" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "$GCLOUD_CALL_LOG"
command="$*"

case "${SCENARIO:-authenticated}" in
  no-account)
    [[ "$command" == auth\ list* ]] && exit 0
    ;;
  auth-unavailable)
    if [[ "$command" == auth\ list* ]]; then echo 'no credentialed accounts' >&2; exit 1; fi
    ;;
  resource-absent)
    if [[ "$command" == artifacts\ repositories\ describe* ]]; then echo 'ERROR: NOT_FOUND: repository was not found' >&2; exit 1; fi
    ;;
  iam-unavailable)
    if [[ "$command" == projects\ get-iam-policy* ]]; then echo 'permission denied' >&2; exit 1; fi
    ;;
  maxscale-unavailable)
    if [[ "$command" == run\ services\ describe*maxScale* ]]; then echo 'permission denied: maxScale' >&2; exit 1; fi
    ;;
esac

case "$command" in
  auth\ list*) echo 'audit@xpex-staging1.iam.gserviceaccount.com' ;;
  config\ get-value\ project*) echo 'xpex-staging1' ;;
  projects\ describe*) echo 'xpex-staging1' ;;
  billing\ projects\ describe*) echo 'true' ;;
  services\ list*) printf '%s\n' run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com sqladmin.googleapis.com storage.googleapis.com redis.googleapis.com vpcaccess.googleapis.com ;;
  projects\ get-iam-policy*) cat <<'JSON'
{"bindings":[
 {"role":"roles/cloudsql.client","members":["serviceAccount:runtime@xpex-staging1.iam.gserviceaccount.com"]},
 {"role":"roles/secretmanager.secretAccessor","members":["serviceAccount:runtime@xpex-staging1.iam.gserviceaccount.com"]},
 {"role":"roles/storage.objectAdmin","members":["serviceAccount:runtime@xpex-staging1.iam.gserviceaccount.com"]}
]}
JSON
    ;;
  run\ services\ describe*maxScale*) echo '5' ;;
  *) echo 'resource-name' ;;
esac
STUB
chmod +x "$tmp/bin/gcloud"

run_audit() {
  local scenario="$1" expected_rc="$2" output
  output="$tmp/$scenario.out"
  : > "$tmp/$scenario.calls"
  set +e
  SCENARIO="$scenario" GCLOUD_CALL_LOG="$tmp/$scenario.calls" PATH="$tmp/bin:$PATH" \
    "$repo_root/scripts/audit-staging-resources.sh" --env-file "$tmp/staging.env" > "$output" 2>&1
  rc=$?
  set -e
  [[ "$rc" -eq "$expected_rc" ]] || { cat "$output" >&2; echo "$scenario returned $rc, expected $expected_rc" >&2; exit 1; }
}

run_audit no-account 10
grep -Fq 'GCP resource checks were not attempted' "$tmp/no-account.out"
[[ "$(wc -l < "$tmp/no-account.calls")" -eq 1 ]]

run_audit auth-unavailable 10
grep -Fq 'PENDÊNCIA EXTERNA | authenticated-account | gcloud read-only query unavailable' "$tmp/auth-unavailable.out"
! grep -Fq 'project not found' "$tmp/auth-unavailable.out"

run_audit authenticated 0
grep -Fq 'Resultado final: GO' "$tmp/authenticated.out"

sed '/^GCP_REGION=/d' "$tmp/staging.env" > "$tmp/missing-variable.env"
: > "$tmp/missing-variable.calls"
set +e
SCENARIO=authenticated GCLOUD_CALL_LOG="$tmp/missing-variable.calls" PATH="$tmp/bin:$PATH" \
  "$repo_root/scripts/audit-staging-resources.sh" --env-file "$tmp/missing-variable.env" > "$tmp/missing-variable.out" 2>&1
rc=$?
set -e
[[ "$rc" -eq 20 ]]
grep -Fq 'NO-GO | env:REGION | missing required audit input' "$tmp/missing-variable.out"

run_audit resource-absent 20
grep -Fq 'NO-GO | artifact-registry | configured resource was not found by the authenticated read-only query' "$tmp/resource-absent.out"

run_audit iam-unavailable 10
grep -Fq 'role checks skipped because the IAM policy was not obtained' "$tmp/iam-unavailable.out"
! grep -Fq 'role is not bound' "$tmp/iam-unavailable.out"

run_audit maxscale-unavailable 10
grep -Fq 'maxScale was not evaluated because the service query was unavailable' "$tmp/maxscale-unavailable.out"
! grep -Fq 'maxScale=permission denied' "$tmp/maxscale-unavailable.out"

if grep -E '(^| )(deploy|create|delete|update|add-iam-policy-binding|remove-iam-policy-binding|builds submit|artifacts .* upload|secrets versions access)( |$)' "$tmp"/*.calls; then
  echo 'mutable gcloud command was called by the audit' >&2
  exit 1
fi

! grep -Eq 'gcloud[[:space:]]+secrets[[:space:]]+versions[[:space:]]+(access|describe)' "$repo_root/scripts/audit-staging-resources.sh"

echo 'staging read-only authenticated audit tests passed'
