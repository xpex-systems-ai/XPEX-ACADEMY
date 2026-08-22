import Link from 'next/link'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'

export default async function ActivitiesPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/activities')
  if (!learning) return <XpexStudentDenied />
  const activities = learning.data.courses.flatMap(course => course.activities.map(activity => ({ course, activity })))
  return <XpexAuthenticatedShell role="aluno" allowedRoles={['aluno']} displayName={learning.displayName}><section className="xpex-native-page"><header><p className="xpex-label">Sua jornada real</p><h1>Atividades</h1><p>Atividades publicadas e acessíveis em seus cursos.</p></header>{activities.length ? <div className="xpex-activity-list">{activities.map(({ course, activity }) => <Link className="xpex-card xpex-activity-row" key={`${course.course_id}-${activity.activity_uuid}`} href={`/xpex/courses/${course.course_id.replace('course_', '')}/learn/${activity.activity_uuid.replace('activity_', '')}`}><span>{activity.complete ? 'Concluída' : 'Pendente'}</span><div><small>{course.title} · {activity.chapter_name}</small><h2>{activity.name}</h2></div></Link>)}</div> : <div className="xpex-card xpex-empty"><h2>Nenhuma atividade disponível</h2><p>As atividades publicadas dos seus cursos aparecerão aqui.</p></div>}</section></XpexAuthenticatedShell>
}
