import { Award, LockKeyhole } from 'lucide-react'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'

export default async function XpexCertificatesPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/certificates')
  if (!learning) return <XpexStudentDenied />

  const completed = learning.data.courses.filter(course => (course.progress_percent ?? 0) >= 100)

  return <XpexAuthenticatedShell role="aluno" allowedRoles={['aluno']} displayName={learning.displayName} organizationSlug={learning.organization.slug}>
    <section className="xpex-native-page">
      <header><p className="xpex-label">Conquistas verificáveis</p><h1>Certificados</h1><p>Conclusões reais da sua jornada aparecem aqui quando os requisitos do curso forem atendidos.</p></header>
      {completed.length ? <div className="xpex-course-grid">{completed.map(course => <article className="xpex-card" key={course.course_id}><Award size={28}/><span className="xpex-badge">Curso concluído</span><h2>{course.title}</h2><p>Você concluiu 100% das aulas contabilizadas neste curso. A emissão oficial fica disponível conforme a política da Academy.</p></article>)}</div> : <div className="xpex-card xpex-empty"><LockKeyhole size={30}/><h2>Seu primeiro certificado começa no primeiro curso</h2><p>Conclua as aulas publicadas e o painel reconhecerá sua evolução automaticamente.</p></div>}
    </section>
  </XpexAuthenticatedShell>
}
