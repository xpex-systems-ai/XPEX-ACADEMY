#!/bin/sh

# Set environment variables for proper Python logging
export PYTHONUNBUFFERED=1
export PYTHONIOENCODING=utf-8

# Railway injects PORT and sends public traffic directly to that port. Keep the
# three application processes on fixed internal ports and make nginx the only
# process listening on the provider-facing port; otherwise Railway can route
# /api/v1 to Next.js and its public backend URL proxies back to itself.
PUBLIC_PORT="${PORT:-80}"
WEB_PORT="${WEB_PORT:-8000}"
/app/render-nginx-config.sh \
    /etc/nginx/conf.d/default.conf \
    /tmp/nginx-default.conf \
    "$PUBLIC_PORT" \
    "$WEB_PORT"
mv /tmp/nginx-default.conf /etc/nginx/conf.d/default.conf

# Wait for database and redis if connection strings point to external services
# (In docker-compose, depends_on handles this, but useful for standalone)
if [ -n "$LEARNHOUSE_SQL_CONNECTION_STRING" ]; then
    DB_HOST=$(echo "$LEARNHOUSE_SQL_CONNECTION_STRING" | sed -n 's/.*@\([^:]*\):\([0-9]*\)\/.*/\1/p')
    if [ -n "$DB_HOST" ] && [ "$DB_HOST" != "localhost" ] && [ "$DB_HOST" != "127.0.0.1" ] && [ "$DB_HOST" != "db" ]; then
        echo "Waiting for external database at $DB_HOST..."
        timeout 30 sh -c 'until nc -z '"$DB_HOST"' 5432; do sleep 1; done' || true
    fi
fi

# Production has historical schema drift outside the XPeX student mission. Avoid a
# global Alembic replay here: repair and verify only the assessment schema required
# by the first real student flow, then fail closed before any bootstrap if it is not ready.
echo "XPEX_DB_MIGRATION assessment_schema requested"
if ! (
    cd /app/api || exit 88
    PYTHONPATH=/app/api .venv/bin/python scripts/xpex_assessment_schema_ready.py
); then
    echo "XPEX_DB_MIGRATION BLOCKED assessment_schema_ready=false"
    exit 88
fi

# Optional guarded first-course bootstrap. Disabled by default. It is idempotent,
# refuses ambiguous organization/course/author scope, and keeps startup alive if
# the operation is blocked. Run it before enrollment so the course exists first.
if [ "${XPEX_LAUNCH_COURSE_ON_START:-0}" = "1" ]; then
    echo "XPEX_LAUNCH course bootstrap requested"
    (
        cd /app/api || exit 89
        if [ -n "${XPEX_LAUNCH_AUTHOR_UUID:-}" ]; then
            PYTHONPATH=/app/api .venv/bin/python scripts/xpex_launch_course.py \
                --org-slug "${XPEX_LAUNCH_ORG_SLUG:-default}" \
                --author-uuid "$XPEX_LAUNCH_AUTHOR_UUID" \
                --execute
        else
            PYTHONPATH=/app/api .venv/bin/python scripts/xpex_launch_course.py \
                --org-slug "${XPEX_LAUNCH_ORG_SLUG:-default}" \
                --execute
        fi
    ) || echo "XPEX_LAUNCH course bootstrap blocked; application startup will continue"
fi

# Optional guarded one-shot XPeX enrollment bootstrap. Disabled by default. The
# command blocks on ambiguous org/student/course scope and is idempotent when a
# valid enrollment already exists. XPEX_OPS_AUTO_UNIQUE_LEARNER=1 is an explicit
# repair mode that acts only when the target organization has exactly one learner
# membership with the canonical role_global_user role.
if [ "${XPEX_OPS_ENROLL_ON_START:-0}" = "1" ]; then
    echo "XPEX_OPS bootstrap requested"
    if [ "${XPEX_OPS_AUTO_UNIQUE_LEARNER:-0}" = "1" ]; then
        (
            cd /app/api || exit 90
            PYTHONPATH=/app/api .venv/bin/python scripts/xpex_ops_enroll.py \
                --org-slug "${XPEX_OPS_ORG_SLUG:-default}" \
                --auto-unique-learner \
                --execute
        ) || echo "XPEX_OPS unique-learner bootstrap blocked; application startup will continue"
    elif [ -z "${XPEX_OPS_FIRST_NAME:-}" ] || [ -z "${XPEX_OPS_LAST_NAME:-}" ] || [ -z "${XPEX_OPS_ORG_SLUG:-}" ]; then
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

# First standard student-flow bootstrap/readiness certification. By default this
# follows the existing OPS enrollment switch so environments already using the
# controlled learner bootstrap gain the full guarded course/assessment/certificate
# readiness check without any new secret or credential configuration. Set
# XPEX_FIRST_STUDENT_FLOW_ON_START=0 explicitly to disable it independently.
if [ "${XPEX_FIRST_STUDENT_FLOW_ON_START:-${XPEX_OPS_ENROLL_ON_START:-0}}" = "1" ]; then
    echo "XPEX_FIRST_FLOW bootstrap requested"
    (
        cd /app/api || exit 91
        PYTHONPATH=/app/api .venv/bin/python scripts/xpex_first_student_flow.py --execute
    ) || echo "XPEX_FIRST_FLOW bootstrap blocked; application startup will continue"
fi

# Start the services
# Use server-wrapper.js for runtime environment variable injection
PORT="$WEB_PORT" pm2 start server-wrapper.js --cwd /app/web --name learnhouse-web > /dev/null 2>&1
pm2 start uv --cwd /app/api --name learnhouse-api -- run app.py
pm2 start node --cwd /app/collab --name learnhouse-collab -- dist/index.js

# Check if the services are running and log the status
pm2 status

# Start Nginx in the background
nginx -g 'daemon off;' &

# Temporary mission-scoped runtime hook for XPEX-WAVE1-MEDIA-CANARY-RECOVERY-039.
# It runs only the fail-closed recovery script already merged in PR #159. The script
# itself enforces the single authorized job/lesson, durable checkpoint ownership,
# one provider retry maximum, checksum/media QA, and the human approval stop. Run in
# the background only after the web/API/collab stack is healthy so a slow video
# provider cannot block Railway health checks or replace the serving process.
(
    sleep 8
    cd /app/api || exit 92
    echo "XPEX_WAVE1_MEDIA_RECOVERY_039 runtime hook requested"
    PYTHONPATH=/app/api .venv/bin/python scripts/xpex_wave1_media_canary_recovery_038.py --execute
    recovery_rc=$?
    echo "XPEX_WAVE1_MEDIA_RECOVERY_039 runtime hook exit=$recovery_rc"
) &

# Tail PM2 logs with proper formatting
pm2 logs --raw
