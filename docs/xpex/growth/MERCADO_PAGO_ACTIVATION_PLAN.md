# XPEX — Mercado Pago Activation Plan

Status: READY_FOR_ACCOUNT_VERIFICATION
Updated: 2026-08-31

## Objective

Turn the existing Mercado Pago/Mercado Livre account and API capability into a controlled XPeX payments and partnership lane without exposing credentials or coupling payments to LearnHouse learning records.

## Current evidence classification

- Account longevity: USER_REPORTED — approximately 12 years.
- Existing Mercado Pago API capability: USER_REPORTED.
- Credentials/tokens: NEVER_COMMIT / NOT_REQUESTED_IN_GITHUB.
- Existing Mercado Pago implementation in this repository: NOT_FOUND by repository search on 2026-08-31.
- Mercado Pago Partner Program: VERIFIED_PUBLIC_PROGRAM.
- XPeX enrollment/progress source of truth: LearnHouse; payment integration must remain a separate bounded context.

## Public partner opportunity

Mercado Pago currently operates a free Partner Program for developers and platforms. Developers need at least one official certification to receive an Integrator ID. Eligible integrations identified with the Integrator ID can generate program benefits and financial incentives subject to program rules and transaction-volume thresholds.

The platform program explicitly includes SaaS, service and open-source platform models. This may be a stronger XPeX route than treating the academy only as a standalone merchant.

## Recommended XPeX architecture

Browser / XPeX UI
  -> XPeX payment boundary
  -> Mercado Pago Checkout
  -> Mercado Pago API

Mercado Pago webhook
  -> verified webhook handler
  -> payment event ledger
  -> entitlement/orchestration decision
  -> LearnHouse-compatible application flow

Rules:
1. Payment status is not learning progress.
2. Payment approval must be verified server-side before granting a paid entitlement.
3. No Mercado Pago access token, client secret or private credential in GitHub.
4. OAuth must be used for third-party seller authorization where applicable.
5. Webhook processing must be idempotent and auditable.
6. Never log full credentials or sensitive payment data.
7. Sandbox/test flow before production activation.
8. Refund/cancellation/chargeback events must revoke or review entitlements according to explicit business rules.

## Environment contract — names only

The implementation may later consume secret values through the deployment platform, not GitHub. Candidate names:

- MERCADOPAGO_ACCESS_TOKEN
- MERCADOPAGO_PUBLIC_KEY
- MERCADOPAGO_CLIENT_ID
- MERCADOPAGO_CLIENT_SECRET
- MERCADOPAGO_WEBHOOK_SECRET
- MERCADOPAGO_INTEGRATOR_ID

Do not populate these values in repository files.

## Activation gates

### Gate MP-01 — Account/API evidence
Operator verifies inside Mercado Pago Developers:
- application exists;
- production credentials exist;
- redirect URLs/domains are current;
- webhook configuration is known;
- no credential is pasted into chat, issue, commit or documentation.

### Gate MP-02 — Partner status
Verify whether the account already has:
- official certification;
- Integrator ID;
- Partner level;
- Partner Center access.

If not, complete the appropriate certification/application through the official Mercado Pago flow.

### Gate MP-03 — Product decision
Choose the first production product based on the actual XPeX commercial model:
- Checkout Pro for direct academy checkout;
- platform/OAuth model if XPeX will enable third-party sellers/partners/polos to receive payments.

Do not implement both simultaneously before the first flow is proven.

### Gate MP-04 — Repository implementation
Only after architecture/source-drift restrictions are cleared:
- create a payment provider adapter;
- implement create-checkout server action/API;
- implement verified webhook receiver;
- persist normalized payment events;
- add idempotency;
- add tests;
- add audit logs without secrets;
- run dependency/typecheck/lint/tests/build/smoke gates.

### Gate MP-05 — Production proof
Production is PASS only with evidence of:
- successful test payment;
- webhook received and verified;
- normalized payment state recorded;
- duplicate webhook handled safely;
- refund/cancellation path tested;
- no secret leakage;
- business entitlement applied exactly once.

## Partnership lane

Position XPeX as an education/AI technology platform with a controlled payment integration, not as a claimed Mercado Pago partner until approval is verified.

Potential asks after account status is verified:
- Partner Program enrollment/upgrade;
- Integrator ID activation;
- technical support;
- platform partnership route;
- commercial incentives tied to qualified integrations;
- education/social-impact collaboration where Mercado Pago elects to support it.

## Next evidence required

The operator should provide only non-secret status information from the Mercado Pago Developers dashboard: application name/ID if non-sensitive, certification status, Integrator ID status (not credentials), partner level, enabled checkout product and configured production domain. Secrets remain exclusively in the secret manager/deployment environment.
