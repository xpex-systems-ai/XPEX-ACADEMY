#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-}"; ALLOWED_ORIGIN="${2:-}"; DISALLOWED_ORIGIN="${3:-https://not-allowed.example.test}"
[[ -n "$BASE_URL" && ( "$BASE_URL" == https://* || "$BASE_URL" == http://127.0.0.1:* || "$BASE_URL" == http://localhost:* ) && ! "$BASE_URL" =~ (prod|production) ]] || { echo "Usage: $0 https://staging-api.example.test https://staging.example.test [https://bad.example.test]" >&2; exit 2; }
[[ -n "$ALLOWED_ORIGIN" ]] || { echo "Allowed origin is required." >&2; exit 2; }
BASE_URL="${BASE_URL%/}"
start=$(date +%s%3N)
health_body=$(mktemp); health_headers=$(mktemp); cors_allowed=$(mktemp); cors_denied=$(mktemp); missing_headers=$(mktemp)
code=$(curl -sS -o "$health_body" -D "$health_headers" -w '%{http_code}' "$BASE_URL/api/v1/health")
end=$(date +%s%3N); ms=$((end-start))
[[ "$code" == 200 ]] || { echo "Health returned HTTP $code" >&2; exit 1; }
python3 -m json.tool "$health_body" >/dev/null || { echo "Health response is not valid JSON" >&2; exit 1; }
curl -fsSI -X OPTIONS "$BASE_URL/api/v1/health" -H "Origin: $ALLOWED_ORIGIN" -H "Access-Control-Request-Method: GET" > "$cors_allowed"
rg -i "^access-control-allow-origin: (\*|$ALLOWED_ORIGIN)" "$cors_allowed" >/dev/null || { echo "Allowed origin CORS header missing" >&2; exit 1; }
curl -sSI -X OPTIONS "$BASE_URL/api/v1/health" -H "Origin: $DISALLOWED_ORIGIN" -H "Access-Control-Request-Method: GET" > "$cors_denied" || true
if rg -i "^access-control-allow-origin: $DISALLOWED_ORIGIN" "$cors_denied" >/dev/null; then echo "Disallowed origin was allowed" >&2; exit 1; fi
missing_code=$(curl -sS -o /dev/null -D "$missing_headers" -w '%{http_code}' "$BASE_URL/__xpex_missing_route__")
[[ "$missing_code" =~ ^(404|405)$ ]] || { echo "Missing route returned unexpected HTTP $missing_code" >&2; exit 1; }
echo "Verification passed: health HTTP $code, response ${ms}ms, CORS allowed/denied behavior validated. Review Cloud Run logs separately for startup errors and leaked secrets."
