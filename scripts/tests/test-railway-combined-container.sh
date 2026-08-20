#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
rendered=$(mktemp)
trap 'rm -f "$rendered"' EXIT

assert_contains() {
    local file=$1
    local expected=$2
    if ! grep -Fq -- "$expected" "$file"; then
        printf 'Expected %s to contain: %s\n' "$file" "$expected" >&2
        exit 1
    fi
}

# Render the same effective configuration used by the container with Railway's
# production PORT. This verifies actual listener and upstream values rather
# than only checking source files for strings.
"$repo_root/docker/render-nginx-config.sh" \
    "$repo_root/docker/nginx.conf" "$rendered" 8080 8000

assert_contains "$rendered" 'listen 8080;'
assert_contains "$rendered" 'listen [::]:8080;'
assert_contains "$rendered" 'proxy_pass http://localhost:8000;'
assert_contains "$rendered" 'proxy_pass http://localhost:9000;'
assert_contains "$rendered" 'proxy_pass http://localhost:4000;'

if grep -Eq '^[[:space:]]*listen (\[::\]:)?80;' "$rendered"; then
    printf 'Rendered nginx config still listens on port 80\n' >&2
    exit 1
fi

# WEB_PORT is intentionally immutable because every frontend nginx upstream is
# fixed to 8000. Unsupported overrides must fail before any process starts.
if "$repo_root/docker/render-nginx-config.sh" \
    "$repo_root/docker/nginx.conf" "$rendered" 8080 8123 2>/dev/null; then
    printf 'Expected unsupported WEB_PORT override to be rejected\n' >&2
    exit 1
fi

# The provider-facing PORT belongs to nginx. Next.js stays on the fixed internal
# port so /api/v1 is handled by nginx's FastAPI upstream.
assert_contains "$repo_root/Dockerfile" 'PORT=80 WEB_PORT=8000 LEARNHOUSE_PORT=9000 COLLAB_PORT=4000'
assert_contains "$repo_root/docker/start.sh" 'PUBLIC_PORT="${PORT:-80}"'
assert_contains "$repo_root/docker/start.sh" 'PORT="$WEB_PORT" pm2 start server-wrapper.js'

# Collab must use the API's actual internal port rather than its upstream
# development default (localhost:8000, occupied by Next.js in this image).
assert_contains "$repo_root/Dockerfile" 'LEARNHOUSE_API_URL=http://localhost:9000'

printf 'Railway combined-container routing checks passed.\n'
