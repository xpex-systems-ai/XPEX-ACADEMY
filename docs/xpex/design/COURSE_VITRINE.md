# XPeX Course Vitrine

## Objective

Create a Netflix-inspired course discovery surface for the authenticated XPeX student area without inventing catalog data.

## Current implementation

The `/xpex/courses` page now uses the existing server-authoritative learning dashboard as its only source of course data. Only published courses with an active student enrollment are rendered as actual course cards.

The first visual layer introduces:

- XPeX Academy hero section;
- visual category rail for the planned catalog taxonomy;
- featured/continue-learning course surface;
- progress-aware course cards;
- course artwork when `image_url` exists;
- honest empty state when no authorized courses exist;
- direct navigation into the existing `/xpex/courses/[courseId]` learning flow.

## Catalog principle

The following categories are product taxonomy, not claims that those courses already exist:

- Inteligência Artificial
- Criação de Imagens
- Criação de Vídeos
- Criação de Música
- Marketing Digital
- Design & Figma
- Construção com IA
- Computação do Básico

Future catalog expansion must connect each card to a real published course and authorization path before it is shown as available to students.

## Data integrity

The page consumes `getAuthorizedStudentLearning()` and `getXpexLearningDashboard()`. It does not create mock courses, fake progress, fake enrollment counts, or synthetic lesson totals.

## Next evolution

1. Add catalog metadata/category fields to the real course model when the backend supports them.
2. Add search and category filtering against authorized course data.
3. Add richer course artwork and trailers using real media URLs.
4. Add a public discovery surface only after access, enrollment, and commercial rules are defined.
5. Validate the visual result in the canonical Vercel deployment before merging.
