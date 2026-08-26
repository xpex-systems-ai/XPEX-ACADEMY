#!/bin/sh

export PYTHONUNBUFFERED=1
export PYTHONIOENCODING=utf-8

PUBLIC_PORT="${PORT:-80}"
WEB_PORT="${WEB_PORT:-8000}"
/app/render-nginx-config.sh \
    /etc/nginx/conf.d/default.conf \
    /tmp/nginx-default.conf \
    "$PUBLIC_PORT" \
    "$WEB_PORT"
mv /tmp/nginx-default.conf /etc/nginx/conf.d/default.conf

if [ -n "$LEARNHOUSE_SQL_CONNECTION_STRING" ]; then
    DB_HOST=$(echo "$LEARNHOUSE_SQL_CONNECTION_STRING" | sed -n 's/.*@\([^:]*\):\([0-9]*\)\/.*/\1/p')
    if [ -n "$DB_HOST" ] && [ "$DB_HOST" != "localhost" ] && [ "$DB_HOST" != "127.0.0.1" ] && [ "$DB_HOST" != "db" ]; then
        echo "Waiting for external database at $DB_HOST..."
        timeout 30 sh -c 'until nc -z '"$DB_HOST"' 5432; do sleep 1; done' || true
    fi
fi

# Guarded one-shot enrollment repair. It is opt-in, ambiguity-safe and can be
# narrowed to the exact authenticated learner UUID when duplicate names exist.
if [ "${XPEX_OPS_ENROLL_ON_START:-0}" = "1" ]; then
    echo "XPEX_OPS bootstrap requested"
    if [ -z "${XPEX_OPS_FIRST_NAME:-}" ] || [ -z "${XPEX_OPS_LAST_NAME:-}" ] || [ -z "${XPEX_OPS_ORG_SLUG:-}" ]; then
        echo "XPEX_OPS BLOCKED missing bootstrap target configuration"
    else
        (
            cd /app/api || exit 90
            if [ -n "${XPEX_OPS_USER_UUID:-}" ]; then
                PYTHONPATH=/app/api .venv/bin/python scripts/xpex_ops_enroll.py \
                    --first-name "$XPEX_OPS_FIRST_NAME" \
                    --last-name "$XPEX_OPS_LAST_NAME" \
                    --org-slug "$XPEX_OPS_ORG_SLUG" \
                    --user-uuid "$XPEX_OPS_USER_UUID" \
                    --execute
            else
                PYTHONPATH=/app/api .venv/bin/python scripts/xpex_ops_enroll.py \
                    --first-name "$XPEX_OPS_FIRST_NAME" \
                    --last-name "$XPEX_OPS_LAST_NAME" \
                    --org-slug "$XPEX_OPS_ORG_SLUG" \
                    --execute
            fi
        ) || echo "XPEX_OPS bootstrap blocked; application startup will continue"
    fi
fi

PORT="$WEB_PORT" pm2 start server-wrapper.js --cwd /app/web --name learnhouse-web > /dev/null 2>&1
pm2 start uv --cwd /app/api --name learnhouse-api -- run app.py
pm2 start node --cwd /app/collab --name learnhouse-collab -- dist/index.js

pm2 status
nginx -g 'daemon off;' &
pm2 logs --raw
