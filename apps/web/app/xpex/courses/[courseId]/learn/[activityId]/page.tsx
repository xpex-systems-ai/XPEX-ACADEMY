import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'
import { Player } from './Player'
import { getActivityWithAuthHeader } from '@services/courses/activities'

export default async function ActivityPage({ params }: { params: Promise<{ courseId: string; activityId: string }> }) {
  const { courseId, activityId } = await params
  const learning = await getAuthorizedStudentLearning(`/xpex/courses/${courseId}/learn/${activityId}`)
  const course = learning?.data.courses.find(item => item.course_id.replace('course_', '') === courseId)
  const index = course?.activities.findIndex(item => item.activity_uuid.replace('activity_', '') === activityId) ?? -1
  if (!learning || !course || index < 0) return <XpexStudentDenied />
  const activity = await getActivityWithAuthHeader(activityId, { cache: 'no-store' }, learning.accessToken)
  if (activity?.activity_uuid !== course.activities[index].activity_uuid || activity.published !== true || activity.is_locked === true) return <XpexStudentDenied />
  const playerActivity = activity.content?.paid_access === false
    ? { ...activity, content: { paid_access: false }, details: null, extra_metadata: null }
    : activity
  return <XpexAuthenticatedShell role="aluno" allowedRoles={['aluno']} displayName={learning.displayName} organizationSlug={learning.organization.slug}><Player courseId={courseId} courseUuid={course.course_id} orgUuid={course.org_uuid} orgSlug={learning.organization.slug} activity={playerActivity} activityMeta={course.activities[index]} previous={course.activities[index - 1]} next={course.activities[index + 1]} lessonNumber={index + 1} totalLessons={course.total_lessons || course.activities.length} completedLessons={course.completed_lessons} /></XpexAuthenticatedShell>
}
