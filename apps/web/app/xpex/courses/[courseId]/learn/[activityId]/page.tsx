import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'
import { Player } from './Player'

export default async function ActivityPage({ params }: { params: Promise<{ courseId: string; activityId: string }> }) {
  const { courseId, activityId } = await params
  const learning = await getAuthorizedStudentLearning(`/xpex/courses/${courseId}/learn/${activityId}`)
  const course = learning?.data.courses.find(item => item.course_id.replace('course_', '') === courseId)
  const index = course?.activities.findIndex(item => item.activity_uuid.replace('activity_', '') === activityId) ?? -1
  if (!learning || !course || index < 0) return <XpexStudentDenied />
  return <XpexAuthenticatedShell role="aluno" allowedRoles={['aluno']} displayName={learning.displayName}><Player courseId={courseId} courseUuid={course.course_id} orgUuid={course.org_uuid} activity={course.activities[index]} previous={course.activities[index - 1]} next={course.activities[index + 1]} /></XpexAuthenticatedShell>
}
