'use server'
import { revalidatePath } from 'next/cache'
import { markActivityAsComplete } from '@services/courses/activity'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'

export async function completeXpexActivity(courseId: string, activityId: string) {
  const learning = await getAuthorizedStudentLearning(`/xpex/courses/${courseId}/learn/${activityId}`)
  const course = learning?.data.courses.find(item => item.course_id.replace('course_', '') === courseId)
  const activity = course?.activities.find(item => item.activity_uuid.replace('activity_', '') === activityId)
  if (!learning || !course || !activity) throw new Error('Conteúdo não autorizado')
  await markActivityAsComplete(learning.organization.slug, course.course_id, activity.activity_uuid, learning.accessToken)
  revalidatePath(`/xpex/courses/${courseId}`)
}
