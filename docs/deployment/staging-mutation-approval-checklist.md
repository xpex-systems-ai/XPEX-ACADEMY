# Staging mutation approval checklist

Complete this checklist before any mutable command is executed by a human operator.

- [ ] Correct GCP account confirmed.
- [ ] Correct project confirmed.
- [ ] Correct region confirmed.
- [ ] Billing confirmed enabled.
- [ ] Required APIs confirmed enabled.
- [ ] Budget and alerts confirmed.
- [ ] Artifact Registry confirmed.
- [ ] Service account confirmed.
- [ ] Runtime IAM confirmed.
- [ ] Cloud SQL confirmed.
- [ ] Redis confirmed.
- [ ] VPC connector confirmed.
- [ ] Bucket confirmed.
- [ ] Exact secret names confirmed: JWT, SQL, Redis.
- [ ] Max instances confirmed within guardrail.
- [ ] Min instances confirmed within guardrail.
- [ ] Previous revision captured or first-deploy exception approved.
- [ ] Rollback plan rendered.
- [ ] Operator named.
- [ ] Approver named.
- [ ] UTC execution window recorded.
- [ ] Commit recorded.
- [ ] Evidence attached.

Approval statement: I approve the explicitly listed staging mutation command(s) only; no production target, IAM change, API enablement, secret value read, migration, traffic change, or rollback may occur unless separately approved.
