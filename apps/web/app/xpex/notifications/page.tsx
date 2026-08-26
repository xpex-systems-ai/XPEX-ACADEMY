import { Bell, CheckCircle2 } from 'lucide-react'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'

export default async function XpexNotificationsPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/notifications')
  if (!learning) return <XpexStudentDenied />
  const active = learning.data.courses.filter(course => (course.progress_percent ?? 0) < 100)

  return <XpexAuthenticatedShell role="aluno" allowedRoles={['aluno']} displayName={learning.displayName} organizationSlug={learning.organization.slug}>
    <section className="xpex-native-page">
      <header><p className="xpex-label">Central de atualizações</p><h1>Notificações</h1><p>Acompanhe mudanças relevantes na sua jornada sem números ou alertas fictícios.</p></header>
      {active.length ? <div className="xpex-course-grid">{active.map(course => <article className="xpex-card" key={course.course_id}><Bell size={24}/><span className="xpex-badge">Curso ativo</span><h2>{course.title}</h2><p>Seu curso está disponível. Progresso atual: {course.progress_percent ?? 0}%.</p></article>)}</div> : <div className="xpex-card xpex-empty"><CheckCircle2 size={30}/><h2>Nenhuma pendência agora</h2><p>Quando houver cursos, atividades ou atualizações relevantes, esta central refletirá os dados reais da sua conta.</p></div>}
    </section>
  </XpexAuthenticatedShell>
}
