# Case Study — Building and Operating XPeX Academy as an AI-Native Learning System

## Problem

A learning platform can easily become a collection of courses plus disconnected AI widgets. XPeX Academy was designed around a different question:

**How do we connect learning, AI assistance, project execution, media generation, review, publication, and measurable progress in one controlled system?**

The project also had a second constraint: preserve and extend an existing open-source foundation instead of replacing proven infrastructure unnecessarily.

## Architecture Direction

The system keeps LearnHouse as the upstream learning foundation and adds XPeX-specific product and governance layers.

High-level structure:

- web application: Next.js / React / TypeScript
- API: FastAPI / Python
- relational persistence: PostgreSQL
- cache / task support: Redis
- AI layer: provider-neutral gateway and model routing
- retrieval: RAG-backed learning/context flows
- media: Cenara rendering pipeline
- deployment: Railway
- engineering governance: GitHub branches, PRs, review gates and production validation

## AI Layer

The AI architecture is intentionally provider-neutral. Rather than coupling product features directly to a single model, the system evolves around a gateway/capability layer.

Recent repository evidence includes:

- PR #238: Google AI foundation + GXEON gateway baseline
- PR #241: typed AI gateway capability contract and health hardening

This direction is intended to centralize:
- provider selection
- model routing
- security boundaries
- cost control
- capability discovery
- failure handling

## Agentic Engineering Workflow

The project is developed with an AI-assisted but review-gated workflow.

MISSION
→ structured handoff
→ isolated branch
→ implementation
→ tests
→ PR
→ audit
→ corrections
→ merge
→ deploy
→ smoke test

PR #239 and PR #240 record the Gemini Core execution manifesto and implementation handoff.

## Human Approval Gates

The media workflow does not auto-publish generated lessons.

For example, PR #237 added an authenticated read-only preview route for rendered lesson drafts while explicitly avoiding approval, attachment or publication.

That separation is intentional:
- generation is not publication
- rendering success is not content approval
- automation does not remove operator accountability

## Production Debugging Example — Media Rendering

The video pipeline exposed a real production constraint: rendering 1080p media under Railway memory limits.

The correction sequence included:
- safe FFmpeg diagnostics
- fixing a sanitizer regression
- testing static-segment and single-pass approaches
- reducing encoding load while keeping target resolution
- preserving manual review

Cenara PR #66 documents a related low-memory master pipeline after SIGKILL/OOM behavior.

## Lessons

1. AI systems need explicit operational boundaries, not only model calls.
2. Provider abstraction matters when models, quotas and costs change.
3. Human approval is a product feature for high-impact workflows.
4. Production resource constraints can dominate architecture decisions.
5. Debugging evidence is often more valuable than polished screenshots.
6. AI-assisted engineering still needs branches, tests, reviews and reproducible decisions.

## Current Status

XPeX Academy is an active public repository with implemented academic and AI-related flows, ongoing Gemini Core work, and a production-oriented deployment workflow.

Not every roadmap capability is production-ready. Marketplace, payments and fully autonomous agent execution are not presented here as completed unless separately verified.

## Interview Walkthrough

A strong walkthrough can focus on:
1. why the existing platform was preserved instead of rewritten;
2. how the provider-neutral AI gateway reduces coupling;
3. how human approval gates were added around generated media;
4. how Railway constraints forced iterative rendering changes;
5. what failed, what was learned, and what changed;
6. what would be added next for enterprise-grade evals and observability.
