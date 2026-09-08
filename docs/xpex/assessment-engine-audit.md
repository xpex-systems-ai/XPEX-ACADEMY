# XPeX student assessment — native-engine decision

## Audit result

LearnHouse already has a functional native assessment engine. The reusable domain is
`Assignment`, `AssignmentTask`, `AssignmentTaskSubmission`, and
`AssignmentUserSubmission`. Its native activity type is `TYPE_ASSIGNMENT`; quiz tasks
use `AssignmentTaskTypeEnum.QUIZ`. The `/api/v1/assignments` router already provides
definition/task reads, draft answer upserts, student submission, result reads, retry,
and instructor grading. The service already enforces course-scoped RBAC and persists
answers and grades.

The AI quiz generator is an authoring helper, not a submission or grading engine, and
was therefore not selected as the student assessment domain.

## Architecture decision

Reuse native assignments rather than introduce `/api/v1/xpex/assessments` tables or a
parallel LMS. The official bootstrap attaches one published quiz assignment to module
one. The XPeX player mounts the existing assignment providers and student component.
Server-side grading owns the score and configurable passing threshold; quiz definitions
sent to learners omit answer-key flags until a graded result may reveal them. Native
trail completion remains driven by the assignment submission service—never by a client
score or direct XPeX progress mutation.

The bootstrap remains guarded and idempotent. It creates real database records only
when invoked with `--execute`; dry runs do not create production data.

## Rollback

Roll back application code first so no process writes `passing_score`, then execute
`alembic downgrade -1` from revision `c8d9e0f1a2b3`. The downgrade drops only the new
check and column and restores both parent heads; assignments, tasks, answers, grades,
and attempts are retained. If production
has already accepted non-default thresholds, prefer roll-forward recovery because
dropping the column loses that configuration. The module-one assessment records may be
unpublished through the native authoring flow; they must not be deleted while learner
submissions exist.
