#!/usr/bin/env bash
set -euo pipefail
ENV_FILE="${ENV_FILE:-.env.staging}"
DRY_RUN="${DRY_RUN:-true}"
IMAGE_TAG="${IMAGE_TAG:-staging-manual}"
usage(){ echo "Usage: scripts/build-staging.sh [--env-file .env.staging] [--image-tag TAG] [--execute]"; }
while (($#)); do case "$1" in --env-file) ENV_FILE="${2:-}"; shift 2;; --image-tag) IMAGE_TAG="${2:-}"; shift 2;; --execute) DRY_RUN=false; shift;; -h|--help) usage; exit 0;; *) echo "Unknown argument: $1" >&2; usage >&2; exit 2;; esac; done
"$(dirname "$0")/check-env.sh" "$ENV_FILE" >/dev/null
set -a; source "$ENV_FILE"; set +a
PROJECT_ID="${GCP_PROJECT_ID:-${PROJECT_ID:-}}"; REGION="${GCP_REGION:-${REGION:-}}"
[[ "${LEARNHOUSE_ENV:-}" == staging && ! "$PROJECT_ID ${ARTIFACT_REPOSITORY:-}" =~ (prod|production|main) ]] || { echo "Refusing non-staging build target." >&2; exit 1; }
[[ -n "$IMAGE_TAG" && "$IMAGE_TAG" != *:* ]] || { echo "IMAGE_TAG must be non-empty and must not contain ':'" >&2; exit 1; }
cmd=(gcloud builds submit --project "$PROJECT_ID" --config cloudbuild.yaml --substitutions "_REGION=$REGION,_ARTIFACT_REPOSITORY=$ARTIFACT_REPOSITORY,_IMAGE_NAME=$IMAGE_NAME,_IMAGE_TAG=$IMAGE_TAG")
echo "⚠️ COMANDO MUTÁVEL — EXECUÇÃO HUMANA APÓS APROVAÇÃO"
printf 'Build command: %q ' "${cmd[@]}"; echo
[[ "$DRY_RUN" == true ]] && echo "DRY_RUN=true: build was not submitted." || "${cmd[@]}"
