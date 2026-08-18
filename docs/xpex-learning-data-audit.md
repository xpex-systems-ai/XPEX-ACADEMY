# XPeX learning dashboard data audit

OS-P0-02 reuses LearnHouse domain truth and introduces no migration or parallel
progress store.

| Concept | Canonical source |
| --- | --- |
| User | `src.db.users.User`; the API derives the learner from the authenticated token |
| Organization membership | `src.db.user_organizations.UserOrganization` joined to `Organization` |
| Course | `src.db.courses.courses.Course` |
| Enrollment | `src.db.trail_runs.TrailRun`, scoped by `user_id`, `org_id`, and `course_id` |
| Course structure | `CourseChapter` and `ChapterActivity`; published `Activity` rows are dashboard lessons |
| Completion | `TrailStep.complete`; opening content is not treated as completion |
| Enrollment state | `TrailRun.status` |
| Last activity | No dedicated lesson-access event exists; `TrailRun.update_date` is exposed only as enrollment activity |
| Certificates | `src.db.courses.certifications`; certificates are outside this dashboard contract |

The `/api/v1/xpex/learning-dashboard` adapter accepts no user identifier. It
uses the authenticated principal, verifies that principal's organization
membership, batches course/activity/completion reads, and returns a minimal
serializable dashboard model. Progress is computed only over published
activities in the same enrolled courses. Continue-learning selects the first
incomplete published activity in canonical course order, falling back to the
real course landing page.
