import Link from 'next/link'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'

export default async function ActivitiesPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/activities')
  if (!learning) return <XpexStudentDenied />
  const activities = learning.data.courses.flatMap(course => course.activities.map(activity => ({ course, activity })))
  const lessons = activities.filter(({ activity }) => activity.activity_type !== 'TYPE_ASSIGNMENT')
  const assessments = activities.filter(({ activity }) => activity.activity_type === 'TYPE_ASSIGNMENT')
  const cards = (items: typeof activities, assessment = false) => <div className="xpex-activity-list">{items.map(({ course, activity }) => <Link className="xpex-card xpex-activity-row" key={`${course.course_id}-${activity.activity_uuid}`} href={`/xpex/courses/${course.course_id.replace('course_', '')}/learn/${activity.activity_uuid.replace('activity_', '')}`}><span>{activity.complete ? (assessment ? 'Enviada' : 'Concluída') : (assessment ? 'Disponível' : 'Pendente')}</span><div><small>{course.title} · {activity.chapter_name}</small><h2>{activity.name}</h2>{assessment ? <p>{activity.complete ? 'Ver resultado ou tentar novamente' : 'Fazer avaliação'}</p> : null}</div></Link>)}</div>
  return <XpexAuthenticatedShell role="aluno" allowedRoles={['aluno']} displayName={learning.displayName} organizationSlug={learning.organization.slug} poloBranding={learning.branding}><section className="xpex-native-page"><header><p className="xpex-label">{learning.branding.organization_name}</p><h1>Atividades</h1><p>Atividades publicadas e acessíveis em seus cursos.</p></header><h2>Atividades do curso</h2>{lessons.length ? cards(lessons) : <div className="xpex-card xpex-empty"><p>Nenhuma aula disponível.</p></div>}<h2>Avaliações</h2>{assessments.length ? cards(assessments, true) : <div className="xpex-card xpex-empty"><p>Nenhuma avaliação disponível.</p></div>}</section></XpexAuthenticatedShell>
}
