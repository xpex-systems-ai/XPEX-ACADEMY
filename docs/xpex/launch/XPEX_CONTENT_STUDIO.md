# XPEX-CONTENT-001 — AI Course Studio

## Goal

Add a controlled content-generation layer to XPeX without creating a second LMS.
LearnHouse remains the source of truth for courses, chapters, activities, media,
enrollment and progress.

## Providers

- OpenRouter: structured `CourseDraft` generation through `/api/v1/chat/completions`.
- Hugging Face Inference Providers: independent draft review through
  `https://router.huggingface.co/v1/chat/completions`.

Provider credentials are server-side only:

- `OPENROUTER_API_KEY`
- `HF_TOKEN`

Optional model selectors:

- `XPEX_OPENROUTER_COURSE_MODEL`
- `XPEX_HF_REVIEW_MODEL`

## Safety contract

`GENERATED != REVIEWED != APPROVED != PUBLISHED`

This first mission stops at `DRAFT`.

The engine MUST NOT:

- create Course, Chapter or Activity rows;
- enroll students;
- mutate progress;
- claim a course is published;
- invent accreditations, partnerships, metrics or certificates;
- expose provider tokens to the browser.

## Preview command

From `apps/api`:

```bash
uv run python scripts/xpex_content_preview.py \
  --topic "Criação de Vídeos com IA" \
  --audience "Iniciantes e profissionais criativos" \
  --modules 1
```

The command prints the validated JSON draft and the independent Hugging Face review.
It returns BLOCKED when credentials are absent or a provider response is invalid.

Use `--skip-hf-review` only for diagnostics.

## CourseDraft shape

A draft contains:

- title and description;
- audience and prerequisites;
- learning outcomes;
- modules;
- lessons with objective, explanation, practice, assessment and resources;
- lab and evidence per module;
- final project;
- `publication_status = DRAFT`.

## Publication boundary

A later mission may add an authenticated editorial review UI and an explicit
`APPROVED -> LearnHouse` publisher. That publisher must reuse native LearnHouse
course/chapter/activity creation services and remain fail-closed.

No automatic publication is part of XPEX-CONTENT-001.

## Media roadmap

Hugging Face Inference Providers supports media tasks through specialized providers,
but binary image/video generation is intentionally not coupled to this first text
draft transaction. The next media mission should create reviewed media assets,
store provenance, then attach approved media using native LearnHouse media handling.
