import Link from 'next/link'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'

export default async function CoursesPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/courses')
  if (!learning) return <XpexStudentDenied />
  return <XpexAuthenticatedShell role="aluno" allowedRoles={['aluno']} displayName={learning.displayName} organizationSlug={learning.organization.slug}><section className="xpex-native-page"><header><p className="xpex-label">Aprendizado autorizado</p><h1>Meus cursos</h1><p>Cursos publicados em que você possui matrícula ativa.</p></header>{learning.data.courses.length ? <div className="xpex-course-grid">{learning.data.courses.map(course => <article className="xpex-card xpex-learning-card" key={course.course_id}><span className="xpex-badge">{course.progress_percent ?? 0}% concluído</span><h2>{course.title}</h2><p>{course.description || 'Conteúdo disponível para sua jornada de aprendizado.'}</p><progress value={course.completed_lessons} max={course.total_lessons || 1}>{course.progress_percent ?? 0}%</progress><Link className="xpex-primary" href={`/xpex/courses/${course.course_id.replace('course_', '')}`}>{course.completed_lessons ? 'Continuar curso' : 'Ver curso'}</Link></article>)}</div> : <div className="xpex-card xpex-empty"><h2>Nenhum curso disponível</h2><p>Quando uma matrícula em um curso publicado for liberada, ela aparecerá aqui.</p></div>}</section></XpexAuthenticatedShell>
}
