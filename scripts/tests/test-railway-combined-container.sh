#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

assert_contains() {
    local file=$1
    local expected=$2
    if ! grep -Fq -- "$expected" "$file"; then
        printf 'Expected %s to contain: %s\n' "$file" "$expected" >&2
        exit 1
    fi
}

# The provider-facing PORT belongs to nginx. Next.js must stay on a distinct
# internal port so /api/v1 is handled by nginx's FastAPI upstream.
assert_contains "$repo_root/Dockerfile" 'PORT=80 WEB_PORT=8000 LEARNHOUSE_PORT=9000 COLLAB_PORT=4000'
assert_contains "$repo_root/docker/start.sh" 'PUBLIC_PORT="${PORT:-80}"'
assert_contains "$repo_root/docker/start.sh" 'PORT="$WEB_PORT" pm2 start server-wrapper.js'
assert_contains "$repo_root/docker/start.sh" 's/listen 80;/listen ${PUBLIC_PORT};/'
assert_contains "$repo_root/docker/nginx.conf" 'proxy_pass http://localhost:9000;'

# Collab must use the API's actual internal port rather than its upstream
# development default (localhost:8000, occupied by Next.js in this image).
assert_contains "$repo_root/Dockerfile" 'LEARNHOUSE_API_URL=http://localhost:9000'

printf 'Railway combined-container routing checks passed.\n'
