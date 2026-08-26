import { Bell, CheckCircle2 } from 'lucide-react'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'

export default async function XpexNotificationsPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/notifications')
  if (!learning) return <XpexStudentDenied />

  const activeCourses = learning.data.courses.filter(
    (course) => (course.progress_percent ?? 0) < 100,
  )

  return (
    <XpexAuthenticatedShell
      role="aluno"
      allowedRoles={['aluno']}
      displayName={learning.displayName}
      organizationSlug={learning.organization.slug}
    >
      <section className="xpex-native-page">
        <header>
          <p className="xpex-label">Central de atualizações</p>
          <h1>Notificações</h1>
          <p>Acompanhe mudanças relevantes na sua jornada sem alertas ou números fictícios.</p>
        </header>
        {activeCourses.length > 0 ? (
          <div className="xpex-course-grid">
            {activeCourses.map((course) => (
              <article className="xpex-card" key={course.course_id}>
                <Bell aria-hidden="true" size={24} />
                <span className="xpex-badge">Curso ativo</span>
                <h2>{course.title}</h2>
                <p>Curso disponível. Progresso atual: {course.progress_percent ?? 0}%.</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="xpex-card xpex-empty">
            <CheckCircle2 aria-hidden="true" size={30} />
            <h2>Nenhuma pendência agora</h2>
            <p>Novos cursos, atividades e atualizações aparecerão aqui a partir dos dados reais.</p>
          </div>
        )}
      </section>
    </XpexAuthenticatedShell>
  )
}
