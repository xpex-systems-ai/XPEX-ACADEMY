# Storage Readiness

The API supports `filesystem` and `s3api` content delivery. Filesystem is acceptable for local development but not recommended for Vercel/Railway production-style staging because containers and disks can be ephemeral.

## Staging recommendation

- Use S3-compatible storage for media/content in staging.
- Set `LEARNHOUSE_CONTENT_DELIVERY_TYPE=s3api` plus bucket/endpoint/region configuration.
- Provide provider credentials only through Railway secret variables or managed identity.
- Keep bucket private; serve content through existing API routers/presigned paths rather than raw public object URLs unless a later security review approves public assets.

## Open decisions

- Provider choice: AWS S3, Cloudflare R2, MinIO or equivalent.
- Bucket naming and retention policy.
- Malware scanning/media lifecycle policy.
- Backup/export procedure for course media.
