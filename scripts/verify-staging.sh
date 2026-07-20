#!/usr/bin/env bash
set -euo pipefail
URL="${1:-${STAGING_API_URL:-}}"
if [[ -z "$URL" || "$URL" == "<STAGING_API_URL>" ]]; then echo "Usage: $0 https://staging-api.example.com" >&2; exit 1; fi
curl -fsS "${URL%/}/api/v1/health" >/dev/null
echo "Staging health OK: ${URL%/}/api/v1/health"
