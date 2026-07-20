# Staging operations

## Routine checks

- Review Cloud Run error rate, p95 latency, container restarts, and memory usage.
- Review Cloud SQL CPU, storage, active connections, and slow queries.
- Review Memorystore memory usage and connection count.
- Verify bucket permissions and object lifecycle policy.
- Confirm Secret Manager secret versions are current and unused versions are disabled.

## Logging

The API writes structured enough stdout/stderr for Cloud Run logs. Filter by service name and revision when diagnosing releases. Never paste secrets into logs or GitHub issues.

## Monitoring

Recommended alerts:

- Uptime check failure for `/api/v1/health`.
- Cloud Run 5xx ratio above threshold for five minutes.
- Cloud Run memory utilization above 80%.
- Cloud SQL storage above 80%.
- Redis memory above 80%.

## External dependencies

AI providers, email providers, Stripe, Tinybird, and Judge0 are optional in staging. Keep them disabled unless a validation scenario requires them, and use sandbox/test credentials only.
