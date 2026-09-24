# Junior Sena — Applied AI Systems Portfolio

**Target profile:** Applied AI / AI Systems / Agent Orchestration  
**Location:** Brazil  
**Evidence-first rule:** only capabilities backed by public repositories, pull requests, deploys, tests, or reviewable artifacts are presented as real.

## Professional Summary

Independent AI systems builder focused on turning AI models into operational product workflows. Current work centers on XPeX Academy and GXEON: AI-native education, provider-neutral AI infrastructure, RAG, agentic execution, human approval gates, media pipelines, deployment workflows, and auditable engineering processes.

The engineering model is explicitly AI-assisted: missions are converted into structured handoffs, implemented on isolated branches, reviewed through pull requests, tested, audited, merged, deployed, and validated with production evidence.

## Selected Project 1 — XPeX Academy

**Repository:** xpex-systems-ai/XPEX-ACADEMY  
**Role:** product architecture, mission design, AI-assisted engineering orchestration, implementation review, debugging, deployment validation

### What it is
An AI-native Learning Operating System built on top of LearnHouse, extending the upstream foundation with XPeX product architecture, academic workflows, AI Lab, RAG, project workspaces, provider-neutral AI capabilities, multi-Polo concepts, and production governance.

### Verified technical surface
- Next.js / React / TypeScript frontend
- FastAPI / Python backend
- PostgreSQL and Redis architecture
- authentication and role-aware experiences
- course, enrollment, progress, activity and certificate flows
- AI Lab and project workspace concepts backed by repository implementation
- RAG/chat transport
- AI provider abstraction and gateway work
- Railway deployment workflow
- PR-driven engineering and human approval gates

### Recent evidence
- PR #238 — Google AI foundation + GXEON gateway baseline
- PR #239 — Gemini Core execution manifesto
- PR #240 — Gemini Core implementation handoff
- PR #241 — Gemini Core AI gateway hardening (under review)
- PR #236 — low-resource 1080p rendering fix for Railway constraints
- PR #237 — authenticated preview route for rendered lesson drafts

### Engineering themes demonstrated
- preserving an existing architecture instead of replacing it blindly
- provider-neutral AI integration
- capability contracts
- secure server-side model access
- production resource constraints
- debugging FFmpeg/media failures
- human review before publication
- branch / PR / audit / deploy discipline

## Selected Project 2 — Cenara

**Repository:** xpex-systems-ai/Cenara-xpex-systems  
**Role:** product direction, architecture decisions, AI-assisted implementation orchestration, quality review, production debugging

### What it is
An audiovisual generation and rendering engine used to explore automated lesson production for XPeX Academy.

### Verified technical surface
- FastAPI-based application
- FFmpeg / MoviePy media pipeline
- persistent production storage
- 16:9 / 9:16 rendering workflows
- provider routing for media generation
- TTS / narration workflows
- structured handoff protocol
- Director Agent and agentic render orchestration
- fallback paths when remote/open inference is unavailable
- low-memory rendering strategies for Railway

### Recent evidence
- PR #67 — structured handoff protocol, Director Agent and agentic render orchestration
- PR #66 — low-memory 1080p master pipeline after production OOM/SIGKILL
- PR #65 — guarded production generation for the first professional Academy lesson
- PR #62 — official XPeX video engine route with model fallback
- PR #59 — open video provider router with local FFmpeg fallback
- PR #58 — MuseTalk production lip-sync worker integration

### Engineering themes demonstrated
- failure reproduction and correction loops
- explicit fallback behavior
- production memory constraints
- provider abstraction
- deterministic fallback instead of silent failure
- reviewable output before publication
- structured agent-to-renderer handoffs

## Engineering Operating Model — GXEON

GXEON is the operating protocol used to structure AI-assisted engineering work:

MISSION
→ STRUCTURED HANDOFF
→ ISOLATED BRANCH
→ IMPLEMENTATION
→ TESTS
→ PULL REQUEST
→ INDEPENDENT AUDIT
→ CORRECTION LOOP
→ CI
→ MERGE
→ DEPLOY
→ SMOKE TEST / EVIDENCE

This is not presented as fully autonomous software development. Sensitive and production-affecting actions remain review-gated.

## Example Debugging Story

### Problem
A production lesson-rendering workflow failed under Railway resource limits.

### Investigation
The workflow surfaced sanitized FFmpeg diagnostics, isolated the rendering bottleneck, and tested lower-memory encoding strategies rather than hiding the failure.

### Iteration
Several approaches were explored through separate PRs. The accepted direction reduced scene-rendering load while preserving the target output format and human review gate.

### Evidence
XPeX Academy PRs #233–#237 and Cenara PR #66 document the debugging and correction sequence.

### What this demonstrates
- production debugging
- hypothesis-driven iteration
- resource-aware architecture
- safe diagnostics
- controlled rollout

## Current Strengths
- AI application architecture
- agent/workflow orchestration
- RAG and provider abstraction
- product decomposition
- Git / PR workflows
- deployment troubleshooting
- production debugging
- human-in-the-loop system design
- technical documentation and structured handoffs

## Gaps Being Developed
These are not hidden:
- deeper algorithm/data-structure interview fluency
- deeper Python internals and distributed-systems fundamentals
- systematic LLM evaluation design
- enterprise-scale customer deployment history
- English technical interview fluency, depending on role requirements

## Portfolio Principle

The goal is not to claim traditional enterprise tenure that does not exist. The goal is to show concrete systems, architectural decisions, debugging history, production constraints, and engineering evidence that can be discussed in detail during an interview.
