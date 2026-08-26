# XPeX Course LearnHouse Experience Audit

## Scope

This change hardens the authenticated student course experience without creating a second LMS or inventing content. The XPeX course shell remains an adapter over LearnHouse-native `Course`, enrollment, activity and progress data.

## Findings

- `/xpex/courses` already reads the authorized student learning dashboard.
- `/xpex/courses/[courseId]` already resolves the course from the authorized dashboard and links each activity to the native XPeX player.
- `/xpex/courses/[courseId]/learn/[activityId]` already obtains the activity with the authenticated access token and rejects unpublished or locked content.
- The player already delegates content rendering to LearnHouse-native activity components for video, PDF, markdown, embed, resource and dynamic content.
- Progress completion is persisted through the existing `completeXpexActivity` action; this PR does not create a parallel progress store.

## Product correction

The course surface was visually too close to a text-only list. The implementation now makes the existing LearnHouse-backed media/content pipeline explicit in the UI: progress, chapter grouping metadata, activity type, published activity count, navigation, native player entry and source-of-truth boundary are visible to the learner.

## Important boundary

A video cannot be manufactured by the XPeX shell if the underlying LearnHouse activity is not actually `TYPE_VIDEO` with valid media configuration. This PR therefore does **not** fabricate video URLs, embeds, player data, analytics, cost metrics or fake monitoring. The native video component is used when the backend activity is truly a video.

Likewise, cost/compute monitoring belongs to the AI Lab/runtime boundary and must only be surfaced when backed by real telemetry. It is not added to the course page as a decorative metric.

## Verification target

Before merge, the executor should run the repository's web lint/build and XPeX learning tests, then validate with a real enrolled student that:

1. course appears in `/xpex/courses`;
2. course detail shows real activity count and progress;
3. a real video activity opens the LearnHouse video component;
4. PDF/dynamic content opens through its native renderer;
5. completion persists after refresh and a new session;
6. unauthorized course/activity access remains denied;
7. no fabricated metrics or content are introduced.

## Production boundary

This branch intentionally does not deploy, change production data, create migrations, or run bootstraps. Deployment remains a separate release gate.
