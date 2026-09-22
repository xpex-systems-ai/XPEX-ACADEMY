# XPeX Academy — Google Cloud Platform Security, IAM & Secrets Plan

**Document:** `docs/gxeon/gcp/XPEX_GCP_SECURITY_PLAN.md`  
**Mission ID:** `XPEX-GCP-FOUNDATION-001`  
**Status:** Security Baseline Specification  
**Date:** 2026-09-22  
**Author:** Google Antigravity (Engineering Executor)  
**Auditor / Orchestrator:** GX / GXEON  

---

## 1. Core Security Invariants

1. **Zero Hardcoded Secrets**: No secret, credential, token, or password may ever appear in source code, Docker images, GitHub pull requests, or CI build logs.
2. **Strict Identity Isolation**: Application workloads run under least-privilege dedicated Service Accounts. Workloads NEVER run with `roles/owner` or `roles/editor`.
3. **Network Boundary Isolation**: Cloud SQL and Memorystore reside strictly on private IP addresses within a Virtual Private Cloud (VPC), reachable only via Serverless VPC Access.
4. **Defense in Depth**: Secrets are stored in Google Secret Manager and mounted as environment variables at Cloud Run container boot via native IAM role grants.

---

## 2. Secrets Inventory (Variable Names Only)

In strict accordance with Section 11 of the Handoff Directive: **Only variable names are cataloged. Zero secret values are printed or stored.**

### 2.1 Critical Authentication & Platform Secrets
| Secret Variable Name | Managed In | Target Secret Manager Secret ID |
|---|---|---|
| `LEARNHOUSE_AUTH_JWT_SECRET_KEY` | Secret Manager | `xpex-jwt-secret-key` |
| `COLLAB_INTERNAL_KEY` | Secret Manager | `xpex-collab-internal-key` |
| `CLOUD_INTERNAL_KEY` | Secret Manager | `xpex-cloud-internal-key` |
| `LEARNHOUSE_PLATFORM_API_KEY` | Secret Manager | `xpex-platform-api-key` |

### 2.2 Data Store Credentials
| Secret Variable Name | Managed In | Target Secret Manager Secret ID |
|---|---|---|
| `LEARNHOUSE_SQL_CONNECTION_STRING` | Secret Manager | `xpex-sql-connection-string` |
| `LEARNHOUSE_REDIS_CONNECTION_STRING` | Secret Manager | `xpex-redis-connection-string` |
| `LEARNHOUSE_REDIS_URL` | Secret Manager | `xpex-redis-url` |

### 2.3 AI & LLM Provider Credentials
| Secret Variable Name | Managed In | Target Secret Manager Secret ID |
|---|---|---|
| `LEARNHOUSE_GEMINI_API_KEY` | Secret Manager | `xpex-gemini-api-key` |
| `LEARNHOUSE_AI_API_KEY` | Secret Manager | `xpex-ai-api-key` |
| `OPENROUTER_API_KEY` | Secret Manager | `xpex-openrouter-api-key` |
| `HF_TOKEN` | Secret Manager | `xpex-huggingface-token` |

### 2.4 External Integration Credentials
| Secret Variable Name | Managed In | Target Secret Manager Secret ID |
|---|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | Secret Manager | `xpex-mercadopago-access-token` |
| `MERCADOPAGO_WEBHOOK_SECRET` | Secret Manager | `xpex-mercadopago-webhook-secret` |
| `LEARNHOUSE_STRIPE_SECRET_KEY` | Secret Manager | `xpex-stripe-secret-key` |
| `LEARNHOUSE_STRIPE_WEBHOOK_STANDARD_SECRET` | Secret Manager | `xpex-stripe-webhook-standard-secret` |
| `LEARNHOUSE_STRIPE_WEBHOOK_CONNECT_SECRET` | Secret Manager | `xpex-stripe-webhook-connect-secret` |
| `LEARNHOUSE_RESEND_API_KEY` | Secret Manager | `xpex-resend-api-key` |
| `LEARNHOUSE_BREVO_API_KEY` | Secret Manager | `xpex-brevo-api-key` |
| `LEARNHOUSE_SMTP_PASSWORD` | Secret Manager | `xpex-smtp-password` |
| `LEARNHOUSE_TINYBIRD_INGEST_TOKEN` | Secret Manager | `xpex-tinybird-ingest-token` |
| `LEARNHOUSE_TINYBIRD_READ_TOKEN` | Secret Manager | `xpex-tinybird-read-token` |
| `LEARNHOUSE_JUDGE0_CLIENT_SECRET` | Secret Manager | `xpex-judge0-client-secret` |

---

## 3. IAM & Service Account Architecture

In accordance with Section 15 of the Handoff:

```
┌────────────────────────────────────────────────────────┐
│               GOOGLE CLOUD IAM BOUNDARY                │
├─────────────────────────┬──────────────────────────────┤
│  Service Account Name   │ Assigned Least-Privilege Role │
├─────────────────────────┼──────────────────────────────┤
│ sa-xpex-api-runtime     │ • roles/cloudsql.client      │
│                         │ • roles/secretmanager.secret │
│                         │   Accessor (specific secrets)│
│                         │ • roles/storage.objectUser   │
│                         │ • roles/cloudtasks.enqueuer  │
├─────────────────────────┼──────────────────────────────┤
│ sa-xpex-web-runtime     │ • roles/monitoring.metric    │
│                         │   Writer                     │
├─────────────────────────┼──────────────────────────────┤
│ sa-xpex-video-worker    │ • roles/cloudsql.client      │
│                         │ • roles/storage.objectAdmin  │
│                         │ • roles/secretmanager.secret │
│                         │   Accessor (specific secrets)│
├─────────────────────────┼──────────────────────────────┤
│ sa-xpex-deployer        │ • roles/run.developer        │
│ (Cloud Build CI/CD)     │ • roles/artifactregistry.    │
│                         │   writer                     │
│                         │ • roles/iam.serviceAccount   │
│                         │   User (scoped to runtimes)  │
└─────────────────────────┴──────────────────────────────┘
```

### Invariants:
- Runtime service accounts have **zero access** to modify IAM policies (`resourcemanager.organizationAdmin` or `roles/owner`).
- Secrets access is granted strictly on a **per-secret basis** using `roles/secretmanager.secretAccessor` on the individual secret resource rather than project-wide.
- Database access uses Cloud SQL IAM database authentication or the Cloud SQL Auth Proxy over Private IP.

---

## 4. Environment Strategy: Separation & Isolation

In accordance with Section 14 of the Handoff:

| Environment | Purpose | GCP Project ID | Data Isolation | Network Isolation |
|---|---|---|---|---|
| **Development** (`dev`) | Local dev & feature branch verification | `xpex-academy-dev` | Isolated SQLite / local Docker Postgres | Localhost |
| **Staging** (`staging`) | PR preview & full end-to-end rehearsal | `xpex-academy-staging` | Dedicated Cloud SQL staging instance | Separate Staging VPC |
| **Production** (`prod`) | Live student & customer workloads | `xpex-academy-prod` | Primary Cloud SQL HA instance | Production VPC |

### Security Invariant:
**Production must NOT share unrestricted credentials, databases, or storage buckets with development or staging.** Staging tests run against sanitized synthetic data or test organizations (`test-org`, `org_test`).

---

## 5. Google AI Execution Modes Comparison: Studio vs Vertex AI

In accordance with Section 12 of the Handoff: **The existing GXEON AI Gateway provider abstraction is 100% preserved.** Business code never speaks directly to raw provider SDKs.

Below is the technical evaluation of the two Google AI runtime modes:

| Evaluation Dimension | Mode A: Google AI Studio (Gemini Developer API) | Mode B: Vertex AI Gemini on GCP |
|---|---|---|
| **Authentication** | API Key (`LEARNHOUSE_GEMINI_API_KEY` / `LEARNHOUSE_AI_API_KEY`) | Google Cloud IAM (`roles/aiplatform.user`) via Service Account token |
| **Quotas & Rate Limits** | Pay-as-you-go tiered per-project API quotas | Project-level Vertex AI quotas with regional guarantees and dynamic quotas |
| **Enterprise Controls** | Standard Google AI Terms | Covered under Google Cloud Master Services Agreement (HIPAA, ISO, SOC2 compliant, zero training on customer data) |
| **Regional Support** | Global API endpoints via Google Front End | In-region processing (`southamerica-east1` or multi-region Americas) |
| **Observability** | Developer Console request counts | Native Cloud Logging, Cloud Monitoring, request latency tracking, Model Monitoring |
| **Billing Model** | Direct API key billing / Google AI platform | Consolidated Google Cloud monthly invoice alongside Cloud Run & Cloud SQL |
| **Migration Effort** | **Zero**. Already implemented and tested in PR #241 (`services/ai/llm/provider.py`) | **Low**. Supported natively by Pydantic AI Vertex provider plugin |

### Architectural Recommendation:
- **Phase 1 & Cutover**: Continue using **Mode A (Gemini API via Google AI Studio Key)**. This requires zero code changes, preserves the audited behavior of PR #241, and avoids complicating the initial infrastructure migration.
- **Phase 2 (Post-Cutover Enterprise Hardening)**: Transition to **Mode B (Vertex AI)** using the Cloud Run Service Account identity, eliminating all long-lived API keys from configuration.
