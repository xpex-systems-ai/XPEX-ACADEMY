# XPEX-GROWTH-OS-001 — Survival Growth & Infrastructure Command

## Status

MISSION ACTIVE — survival mode.

## Objective

Create a separate growth, partnership and funding operating layer around XPeX Academy without coupling outbound marketing automation to the learning core. LearnHouse remains the source of truth for learning entities. XPeX Growth OS orchestrates partner research, evidence, proposals, personalized media, outreach, response tracking and infrastructure funding.

## Current verified infrastructure snapshot

Railway project: `resourceful-optimism`

Production services currently visible through the authorized Railway connection:

- `XPEX-ACADEMY` — latest deployment SUCCESS
- `Postgres` — latest deployment SUCCESS
- `Redis` — latest deployment SUCCESS
- `audit-launch-readiness-default-org` — latest deployment SUCCESS
- `function-bun` — latest deployment SLEEPING

This does not replace the full production launch gate. Student release still requires canonical-domain, authenticated journey, persistence, recovery and security evidence.

## Critical drift detected

Railway project flags currently include:

- `xpex.teacher.bootstrap.enabled=true`
- `xpex.teacher.canonical.org=kelle-digital-lab`
- `xpex.teacher.canonical.email=kelledigital@outlook.com`

The canonical teacher identity must be reconciled with the current operational source of truth before changing this production flag. Do not silently mutate identity flags.

## Target architecture

```text
GX / ORCHESTRATOR
  ├─ Infrastructure Control
  │   ├─ Railway runtime
  │   ├─ PostgreSQL
  │   ├─ Redis
  │   ├─ object storage
  │   ├─ transactional email
  │   ├─ backups / health / logs
  │   └─ cost controls
  ├─ Intelligence
  │   ├─ partner discovery
  │   ├─ funding-program discovery
  │   ├─ fit scoring
  │   └─ evidence verification
  ├─ Media Engine
  │   ├─ HeyGen Video Agent
  │   ├─ partner-specific scripts
  │   ├─ thumbnails / captions
  │   └─ multilingual variants
  ├─ Outreach Engine
  │   ├─ Gmail for high-value personalized outreach
  │   ├─ Brevo for transactional/product mail only unless separately approved for campaigns
  │   ├─ partner landing pages
  │   └─ human-approved LinkedIn/X outreach
  └─ Funding CRM
      ├─ target
      ├─ contact
      ├─ ask
      ├─ evidence
      ├─ message/video IDs
      ├─ status
      ├─ next action
      └─ potential value
```

## Survival-mode priorities

### P0 — Keep the Academy alive

1. Keep one production application service, one PostgreSQL service and one Redis service as the minimum durable core.
2. Keep optional worker/function services sleeping or disabled unless they are required for an active flow.
3. Do not add Kubernetes or multi-cloud complexity during survival mode.
4. Add storage, backups, observability and email only as required by the production launch gate.
5. Maintain real secrets in provider stores only.

### P0 — Raise infrastructure before equity

Primary asks are deliberately specific:

- compute credits
- PostgreSQL credits
- Redis / cache credits
- object storage credits
- AI inference credits
- email / communications credits
- developer tooling credits

Goal: extend runway without unnecessary dilution while the first verified deployment and learning outcomes are being produced.

### P1 — Strategic partner campaign

Each target gets its own Partner Digital Twin:

```json
{
  "partner_id": "",
  "company": "",
  "contact": "",
  "role": "",
  "category": "infrastructure|ai|education|sponsor|investor",
  "why_fit": [],
  "verified_evidence": [],
  "ask": "",
  "ask_value": null,
  "video_id": null,
  "email_status": "DRAFT",
  "reply_status": null,
  "meeting_status": null,
  "next_action": null
}
```

## Event model

- `PARTNER.DISCOVERED`
- `PARTNER.QUALIFIED`
- `EVIDENCE.VERIFIED`
- `PROPOSAL.DRAFTED`
- `VIDEO.REQUESTED`
- `VIDEO.READY`
- `EMAIL.DRAFTED`
- `EMAIL.APPROVED`
- `EMAIL.SENT`
- `PARTNER.REPLIED`
- `MEETING.REQUESTED`
- `CREDIT.APPROVED`
- `SPONSORSHIP.APPROVED`
- `INVESTMENT.DILIGENCE`

## Hard rules

- No invented partnerships, student counts, production claims or funding.
- No mass-spam automation.
- High-value emails are personalized and reviewed before or at explicit send authorization.
- LinkedIn/X automation must respect platform rules and should default to human-approved posting/DM flows.
- No campaign logic may mutate courses, enrollments, student progress or learning records.
- Growth integrations fail closed when partner identity, evidence or destination is uncertain.

## First execution wave

1. Verify Railway production status and minimum service set.
2. Reconcile teacher canonical-email drift before identity mutation.
3. Activate HeyGen connector and generate a 45–60 second infrastructure-partnership master video.
4. Build a first target queue focused on infrastructure credits and strategic open-source support.
5. Prepare individualized Gmail drafts with video/partner-page CTA.
6. Create a lightweight funding ledger and review replies daily.
7. Only after infrastructure relief is underway, expand to equity investors and institutional sponsors.

## Definition of Done for XPEX-GROWTH-OS-001

- Railway survival baseline documented and healthy.
- Partner/funding architecture committed in GitHub.
- HeyGen master partnership video generated.
- First prioritized target list created from current verified programs/contacts.
- First outreach drafts prepared.
- No unsupported production, partnership or impact claims.
- Launch-gate blockers remain visible until independently proven.
