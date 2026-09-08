import Link from 'next/link'
import { Award, ExternalLink, LockKeyhole } from 'lucide-react'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getUriWithOrg } from '@services/config/config'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'
import { getXpexStudentCertificates } from '@/lib/xpex/certificates'

export default async function XpexCertificatesPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/certificates')
  if (!learning) return <XpexStudentDenied />

  const certificates = await getXpexStudentCertificates(
    learning.accessToken,
    learning.organization.id,
    new Set(learning.data.courses.map((course) => course.course_id)),
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
          <p>Suas conclusões reais e verificáveis ficam reunidas aqui.</p>
        </header>
        {certificates.length > 0 ? (
          <div className="xpex-course-grid">
            {certificates.map((certificate) => (
              <article className="xpex-card xpex-feature xpex-feature-orange" key={certificate.certificateId}>
                <Award aria-hidden="true" size={32} />
                <span className="xpex-badge">Certificado emitido</span>
                <h2>{certificate.courseTitle}</h2>
                <p><strong>Identificador verificável</strong><br />{certificate.certificateId}</p>
                {certificate.issuedAt ? <p>Emitido em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(certificate.issuedAt))}</p> : null}
                <Link
                  className="xpex-primary"
                  href={getUriWithOrg(
                    learning.organization.slug,
                    `/certificates/${encodeURIComponent(certificate.certificateId)}/verify`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visualizar certificado <ExternalLink aria-hidden="true" size={16} />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="xpex-card xpex-empty">
            <LockKeyhole aria-hidden="true" size={30} />
            <h2>Seu primeiro certificado começa no primeiro curso</h2>
            <p>Conclua os requisitos publicados e a XPeX Academy AI reconhecerá sua evolução automaticamente.</p>
          </div>
        )}
      </section>
    </XpexAuthenticatedShell>
  )
}
