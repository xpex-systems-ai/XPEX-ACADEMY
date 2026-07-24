#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${OUT_DIR:-${1:-}}"
[[ -n "$OUT_DIR" ]] || { echo "Usage: OUT_DIR=dir scripts/collect-staging-deploy-evidence.sh" >&2; exit 2; }
mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"
EVIDENCE_FILE="$OUT_DIR/staging-deploy-evidence.md"

redact() {
  sed -E \
    -e 's#(Authorization: Bearer )[A-Za-z0-9._~+/=-]+#\1<redacted>#Ig' \
    -e 's#(token|password|passwd|secret|credential|credentials_json|access_token|id_token|refresh_token)([=: ]+)[^[:space:]]+#\1\2<redacted>#Ig' \
    -e 's#://([^:/@]+):([^@]+)@#://<redacted>:<redacted>@#g' \
    -e 's#(-----BEGIN [A-Z ]*PRIVATE KEY-----).*#\1 <redacted>#Ig'
}

field() { printf '%s' "${!1:-não informado}" | redact; }

cat > "$EVIDENCE_FILE.tmp" <<EOM
# Staging deployment evidence

- UTC timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)
- Workflow run: $(field GITHUB_SERVER_URL)/$(field GITHUB_REPOSITORY)/actions/runs/$(field GITHUB_RUN_ID)
- Operator: $(field GITHUB_ACTOR)
- Approver: $(field DEPLOY_APPROVER)
- Change ticket: $(field CHANGE_TICKET)
- Commit: $(field COMMIT_SHA)
- Image tag: $(field IMAGE_TAG)
- Image URI: $(field IMAGE_URI)
- Digest: $(field IMAGE_DIGEST)
- Plan config SHA-256: $(field PLAN_CONFIG_SHA256)
- Project: $(field PROJECT_ID)
- Region: $(field REGION)
- Service: $(field SERVICE_NAME)
- Previous revision: $(field PREVIOUS_REVISION)
- New revision: $(field NEW_REVISION)
- URL: $(field SERVICE_URL)
- Health result: $(field HEALTH_RESULT)
- CORS result: $(field CORS_RESULT)
- Build result: $(field BUILD_RESULT)
- Deploy result: $(field DEPLOY_RESULT)
- Verify result: $(field VERIFY_RESULT)
- Final classification: $(field FINAL_CLASSIFICATION)
- Prepared rollback command: $(field ROLLBACK_COMMAND)
EOM
redact < "$EVIDENCE_FILE.tmp" > "$EVIDENCE_FILE"
rm -f "$EVIDENCE_FILE.tmp"
chmod 600 "$EVIDENCE_FILE"
printf '%s\n' "$EVIDENCE_FILE"
