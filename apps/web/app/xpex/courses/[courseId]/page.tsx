import Link from 'next/link'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const learning = await getAuthorizedStudentLearning(`/xpex/courses/${courseId}`)
  const course = learning?.data.courses.find(item => item.course_id.replace('course_', '') === courseId)
  if (!learning || !course) return <XpexStudentDenied />
  const next = course.activities.find(activity => !activity.complete) ?? course.activities[0]
  return <XpexAuthenticatedShell role="aluno" allowedRoles={['aluno']} displayName={learning.displayName} organizationSlug={learning.organization.slug}><section className="xpex-native-page"><header className="xpex-hero"><p className="xpex-label">Visão geral do curso</p><h1>{course.title}</h1><p className="xpex-hero-copy">{course.description || 'Curso disponível na sua matrícula.'}</p>{next && <Link className="xpex-primary" href={`/xpex/courses/${courseId}/learn/${next.activity_uuid.replace('activity_', '')}`}>{course.completed_lessons ? 'Continuar aprendendo' : 'Começar curso'}</Link>}</header><div className="xpex-activity-list">{course.activities.map(activity => <Link className="xpex-card xpex-activity-row" key={activity.activity_uuid} href={`/xpex/courses/${courseId}/learn/${activity.activity_uuid.replace('activity_', '')}`}><span>{activity.complete ? 'Concluída' : 'Pendente'}</span><div><small>{activity.chapter_name}</small><h2>{activity.name}</h2></div></Link>)}</div></section></XpexAuthenticatedShell>
}
