FROM python:3.14.3-slim-bookworm

# Install curl and netcat for health checks and service waiting, plus ffmpeg
# for video rendering/faststart remuxing and espeak-ng for the audited local
# Portuguese narration fallback used when no remote TTS model is configured.
RUN apt-get update && apt-get install -y --no-install-recommends curl netcat-openbsd build-essential ffmpeg espeak-ng && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.10.7 /uv /uvx /bin/

# Copy the project into the image
ADD . /app

# Remove Enterprise Edition folder for public builds
ARG LEARNHOUSE_PUBLIC=false
RUN if [ "$LEARNHOUSE_PUBLIC" = "true" ]; then rm -rf /app/ee; fi

# Sync the project into a new environment, using the frozen lockfile
WORKDIR /app
RUN uv sync --frozen

# Copy runtime scripts
COPY docker-entrypoint.sh resolve-container-port.sh docker-healthcheck.sh ./
RUN chmod +x docker-entrypoint.sh resolve-container-port.sh docker-healthcheck.sh

# Expose port
EXPOSE 9000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD ./docker-healthcheck.sh || exit 1

# Use entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]
