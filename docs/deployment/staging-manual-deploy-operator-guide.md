# Manual staging deploy operator guide

The manual staging deploy workflow is approval-gated and must not be triggered by push, pull request, schedule, merge, or automatic workflow chaining.

## Plan mode

1. Confirm the target commit is on `dev`.
2. Run **Manual staging deploy** with `mode=plan` and the target `commit_sha`.
3. Review the redacted plan artifact.
4. Do not proceed unless the plan classification is `GO` and every external prerequisite in the environment setup guide is complete.

## Execute mode

1. Capture the concrete current Cloud Run revision before requesting approval.
2. Obtain the human approval/change record and put it in `change_ticket`.
3. Run the workflow with `mode=execute`, `confirmation=DEPLOY_XPEX_STAGING`, the concrete `previous_revision`, and the approved `change_ticket`.
4. Wait for the GitHub Environment `staging` reviewer approval.
5. The workflow re-runs audit and preflight before build. Any divergence stops before mutation.

## Failure handling

If verification fails, the workflow does not run rollback automatically. It prepares a manual rollback command through `scripts/prepare-staging-rollback.sh` using the operator-supplied `previous_revision`; a human must inspect evidence and run rollback separately if approved.

## Evidence

Download the redacted evidence artifact. It includes timestamps, actor, change ticket, commit, image tag, immutable digest, revisions, URL, verify status, final classification, and the prepared rollback command. It must not include tokens, passwords, connection strings, OIDC credentials, authorization headers, or secret contents.

## Immutable SHA policy

The workflow accepts only a full 40-character commit SHA and then verifies that the SHA belongs to `origin/dev`. A SHA is not rejected merely because it is also reachable from `main`; with immutable SHA inputs, production-like branch names and refs are rejected by input shape, while shared ancestry remains valid when the commit is part of the approved `dev` history.
