import { Award, LockKeyhole } from 'lucide-react'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'

export default async function XpexCertificatesPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/certificates')
  if (!learning) return <XpexStudentDenied />

  const completedCourses = learning.data.courses.filter(
    (course) => (course.progress_percent ?? 0) >= 100,
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
          <p className="xpex-label">Conquistas verificáveis</p>
          <h1>Certificados</h1>
          <p>Conclusões reais aparecem aqui quando os requisitos publicados forem atendidos.</p>
        </header>
        {completedCourses.length > 0 ? (
          <div className="xpex-course-grid">
            {completedCourses.map((course) => (
              <article className="xpex-card" key={course.course_id}>
                <Award aria-hidden="true" size={28} />
                <span className="xpex-badge">Curso concluído</span>
                <h2>{course.title}</h2>
                <p>100% das aulas contabilizadas deste curso foram concluídas.</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="xpex-card xpex-empty">
            <LockKeyhole aria-hidden="true" size={30} />
            <h2>Seu primeiro certificado começa no primeiro curso</h2>
            <p>Conclua as aulas publicadas e a Academy reconhecerá sua evolução automaticamente.</p>
          </div>
        )}
      </section>
    </XpexAuthenticatedShell>
  )
}
