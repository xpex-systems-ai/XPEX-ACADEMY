# XPEX-MP-001 — Mercado Pago Financial Engine Handoff

Status: IMPLEMENTATION_IN_PROGRESS
Date: 2026-08-31

## Mission
Make Mercado Pago the primary financial engine of XPeX while LearnHouse remains the learning source of truth.

## Implemented in branch
- durable XPeX Mercado Pago checkout ledger;
- durable verified webhook event ledger;
- Checkout Pro preference gateway using server-side environment credentials;
- X-Idempotency-Key on preference creation;
- Integrator ID support when configured;
- notification URL support;
- signed webhook verification with HMAC-SHA256 and constant-time comparison;
- server-side payment re-fetch before normalized payment status is trusted;
- duplicate notification protection through event_key uniqueness;
- tests for webhook validation and secret configuration;
- no credentials committed.

## Financial architecture

XPeX UI -> authenticated XPeX checkout API -> Mercado Pago Checkout Pro

Mercado Pago -> public signed webhook -> HMAC validation -> provider re-fetch -> durable event ledger -> checkout status

The webhook does NOT directly modify course progress. Paid access automation must be introduced as an explicit entitlement layer after buyer identity mapping and refund/chargeback policy are proven.

## Product roadmap

Phase A — Checkout Pro
- one-time course/product checkout;
- Pix/card/boleto methods exposed by Mercado Pago according to account/product configuration;
- webhook reconciliation;
- dashboard metrics from normalized ledger.

Phase B — Subscriptions
- recurring Academy plans through Mercado Pago Subscriptions API;
- plan-associated and plan-independent subscriptions as required;
- subscription webhooks;
- retry/delinquency/cancellation state machine.

Phase C — Platform / Polos / Stores
- OAuth seller connection for third-party polos/stores where the commercial/legal model requires it;
- mp-connect webhook lifecycle;
- seller/account mapping;
- Integrator ID attribution;
- never share seller credentials.

Phase D — Point / QR
- optional physical-polo payment lane using Mercado Pago Point and/or QR APIs;
- only after the online checkout path has passed production evidence gates.

## Required server-side environment variables

MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_CLIENT_ID=
MERCADOPAGO_CLIENT_SECRET=
MERCADOPAGO_WEBHOOK_SECRET=
MERCADOPAGO_INTEGRATOR_ID=
MERCADOPAGO_NOTIFICATION_URL=

No real value belongs in Git.

## Production gate

PASS requires all of the following:
1. secrets configured in deployment secret manager;
2. canonical HTTPS webhook URL configured in Mercado Pago;
3. valid signed webhook accepted;
4. invalid signature rejected with 401;
5. test payment reconciled by server-side API fetch;
6. duplicate webhook produces no duplicate state transition;
7. approved/rejected/pending flows observed;
8. refund/cancellation/chargeback policy implemented before automatic paid entitlement is considered complete;
9. no secret leakage in logs, commits or browser bundles;
10. investor/evidence dashboard reports only verified transactions.

## Evidence policy

A Mercado Pago payment is commercial evidence only after provider-side verification. A test payment is labeled test. Revenue metrics exclude unverified, rejected, cancelled and refunded events according to the final accounting policy. Partner status, certification and incentives are never claimed until verified in the Mercado Pago account/program.
