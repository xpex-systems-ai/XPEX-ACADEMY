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

# Start the services
# Use server-wrapper.js for runtime environment variable injection
PORT="$WEB_PORT" pm2 start server-wrapper.js --cwd /app/web --name learnhouse-web > /dev/null 2>&1
pm2 start uv --cwd /app/api --name learnhouse-api -- run app.py
pm2 start node --cwd /app/collab --name learnhouse-collab -- dist/index.js

# Check if the services are running and log the status
pm2 status

# Start Nginx in the background
nginx -g 'daemon off;' &

# Tail PM2 logs with proper formatting
pm2 logs --raw
