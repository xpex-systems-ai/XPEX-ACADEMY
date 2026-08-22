import { redirect } from 'next/navigation'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'

export default async function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const learning = await getAuthorizedStudentLearning(`/xpex/courses/${courseId}/learn`)
  const course = learning?.data.courses.find(item => item.course_id.replace('course_', '') === courseId)
  if (!course) return <XpexStudentDenied />
  const activity = course.activities.find(item => !item.complete) ?? course.activities[0]
  if (!activity) redirect(`/xpex/courses/${courseId}`)
  redirect(`/xpex/courses/${courseId}/learn/${activity.activity_uuid.replace('activity_', '')}`)
}
