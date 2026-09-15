import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Mail,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from 'lucide-react'

import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { PoloIdentityHero } from '@components/Xpex/experiences/PoloIdentityHero'
import { getServerSession } from '@/lib/auth/server'
import { resolveXpexOrganization, resolveXpexPoloAccess } from '@/lib/xpex/access'
import { getPoloBranding } from '@/lib/xpex/polo-branding-server'
import { authorizePoloManager } from '@/lib/xpex/polo-policy'
import {
  enrollXpexLaunchStudent,
  inviteXpexLaunchStudent,
  listXpexLaunchCourses,
} from '@/lib/xpex/launch-ops'

import styles from './student-operations.module.css'

async function getLaunchContext() {
  const session = await getServerSession()
  if (!session?.user) redirect('/login?next=%2Fxpex%2Fpolo%2Falunos')

  const isSuperadmin = session.user.is_superadmin === true
  const organization = resolveXpexOrganization(session.roles, isSuperadmin ? undefined : 'polo')
  const organizationSlug = organization?.slug
  const accessToken = session.tokens?.access_token
  if (!organizationSlug || !accessToken) redirect('/xpex/polo')

  try {
    const courses = await authorizePoloManager(session, organizationSlug, listXpexLaunchCourses)
    const poloAccess = resolveXpexPoloAccess(session.roles, organizationSlug, isSuperadmin)
    if (!poloAccess?.isManager) redirect('/xpex/polo')

    const displayName = [session.user.first_name, session.user.last_name].filter(Boolean).join(' ').trim()
      || session.user.username
      || 'Administração do Polo'
    const poloBranding = await getPoloBranding(accessToken, organizationSlug, organization?.name)

    return {
      organization,
      organizationSlug,
      accessToken,
      courses,
      displayName,
      isSuperadmin,
      poloAccess,
      poloBranding,
    }
  } catch {
    redirect('/xpex/polo')
  }
}

async function inviteStudent(formData: FormData) {
  'use server'
  const { organizationSlug, accessToken } = await getLaunchContext()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) redirect('/xpex/polo/alunos?error=Informe%20o%20e-mail%20do%20aluno.')

  try {
    await inviteXpexLaunchStudent(accessToken, organizationSlug, email)
  } catch {
    redirect('/xpex/polo/alunos?error=Falha%20ao%20enviar%20convite.')
  }
  redirect('/xpex/polo/alunos?status=Convite%20enviado.%20Aguarde%20o%20aluno%20aceitar%20antes%20da%20matr%C3%ADcula.')
}

async function enrollStudent(formData: FormData) {
  'use server'
  const { organizationSlug, accessToken } = await getLaunchContext()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const courseUuid = String(formData.get('course_uuid') ?? '').trim()
  if (!email || !courseUuid) {
    redirect('/xpex/polo/alunos?error=Informe%20aluno%20e%20curso%20publicado.')
  }

  let message: string
  try {
    const result = await enrollXpexLaunchStudent(
      accessToken,
      organizationSlug,
      email,
      courseUuid
    )
    message = result?.status === 'already_enrolled'
      ? 'Aluno já estava matriculado neste curso.'
      : 'Matrícula realizada com sucesso.'
  } catch {
    redirect('/xpex/polo/alunos?error=Falha%20ao%20realizar%20matr%C3%ADcula.')
  }
  redirect(`/xpex/polo/alunos?status=${encodeURIComponent(message)}`)
}

export default async function PoleStudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const {
    organization,
    organizationSlug,
    courses,
    displayName,
    isSuperadmin,
    poloAccess,
    poloBranding,
  } = await getLaunchContext()
  const params = await searchParams
  const status = typeof params.status === 'string' ? params.status : null
  const error = typeof params.error === 'string' ? params.error : null
  const organizationName = organization?.name || poloBranding.organization_name || organizationSlug

  const metrics = [
    {
      label: 'Fluxo de convites',
      value: 'Ativo',
      hint: 'Envio por e-mail habilitado',
      icon: Mail,
    },
    {
      label: 'Cursos publicados',
      value: String(courses.length),
      hint: 'Disponíveis para matrícula',
      icon: GraduationCap,
    },
    {
      label: 'Matrículas',
      value: 'Protegidas',
      hint: 'Somente após aceite do aluno',
      icon: UsersRound,
    },
    {
      label: 'Permissões',
      value: 'Validadas',
      hint: 'Escopo restrito ao Polo',
      icon: ShieldCheck,
    },
  ]

  return (
    <XpexAuthenticatedShell
      role="polo"
      allowedRoles={['polo']}
      displayName={displayName}
      organizationSlug={organizationSlug}
      adminAccess={isSuperadmin}
      poloAccess={poloAccess}
      poloBranding={poloBranding}
    >
      <section className={styles.page} aria-labelledby="students-heading">
        <div className={styles.heroCompact}>
          <PoloIdentityHero branding={poloBranding}/>
        </div>

        <header className="xpex-card p-5 md:p-6">
          <div className={styles.headerRow}>
            <div className={styles.headingBlock}>
              <p className={styles.eyebrow}>Console de operação de alunos</p>
              <h1 id="students-heading" className={styles.title}>Alunos do Polo</h1>
              <p className={styles.subtitle}>
                Convide, matricule e acompanhe alunos de {organizationName} com um fluxo simples, seguro e validado no servidor.
              </p>
            </div>
            <div className={styles.actions}>
              <Link className={styles.secondaryAction} href="/xpex/polo">
                <ArrowLeft aria-hidden="true" size={16}/>
                Voltar ao Polo
              </Link>
            </div>
          </div>
        </header>

        <section className={styles.metricsGrid} aria-label="Indicadores operacionais do Polo">
          {metrics.map(({ label, value, hint, icon: Icon }) => (
            <article className={styles.metricCard} key={label}>
              <div className={styles.metricIcon}><Icon aria-hidden="true" size={20}/></div>
              <div>
                <p className={styles.metricLabel}>{label}</p>
                <p className={styles.metricValue}>{value}</p>
                <p className={styles.metricHint}>{hint}</p>
              </div>
            </article>
          ))}
        </section>

        {status ? <div role="status" className={styles.alertSuccess}>{status}</div> : null}
        {error ? <div role="alert" className={styles.alertError}>{error}</div> : null}

        <div className={styles.operationsGrid}>
          <section className={styles.operationCard} aria-labelledby="invite-heading">
            <div className={styles.cardTitleRow}>
              <div className={styles.cardIcon}><UserPlus aria-hidden="true" size={18}/></div>
              <div>
                <h2 id="invite-heading" className={styles.cardTitle}>Convidar aluno</h2>
                <p className={styles.cardText}>Envie o acesso ao Polo pelo e-mail do aluno.</p>
              </div>
            </div>
            <form action={inviteStudent} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="invite-email">E-mail do aluno</label>
                <input
                  className={styles.input}
                  id="invite-email"
                  name="email"
                  type="email"
                  placeholder="aluno@exemplo.com"
                  required
                  autoComplete="email"
                />
              </div>
              <p className={styles.helper}>Nenhuma senha é criada ou alterada por este painel. O aluno usa a própria conta e define as próprias credenciais.</p>
              <button className={styles.primaryButton} type="submit">
                <Mail aria-hidden="true" size={16}/>
                Enviar convite
              </button>
            </form>
          </section>

          <section className={styles.operationCard} aria-labelledby="enroll-heading">
            <div className={styles.cardTitleRow}>
              <div className={styles.cardIcon}><GraduationCap aria-hidden="true" size={18}/></div>
              <div>
                <h2 id="enroll-heading" className={styles.cardTitle}>Matricular em curso</h2>
                <p className={styles.cardText}>Associe um aluno que já aceitou o convite a um curso publicado.</p>
              </div>
            </div>
            {courses.length === 0 ? (
              <div className={styles.activityEmpty}>
                <div>
                  <strong>Nenhum curso publicado disponível</strong>
                  <p>Publique um curso antes de iniciar matrículas.</p>
                </div>
              </div>
            ) : (
              <form action={enrollStudent} className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="enroll-email">E-mail do aluno</label>
                  <input
                    className={styles.input}
                    id="enroll-email"
                    name="email"
                    type="email"
                    placeholder="aluno@exemplo.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="course-uuid">Curso publicado</label>
                  <select className={styles.select} id="course-uuid" name="course_uuid" required defaultValue="">
                    <option value="" disabled>Selecione um curso</option>
                    {courses.map((course) => (
                      <option key={course.course_uuid} value={course.course_uuid}>{course.name}</option>
                    ))}
                  </select>
                </div>
                <button className={styles.primaryButton} type="submit">
                  <GraduationCap aria-hidden="true" size={16}/>
                  Matricular aluno
                </button>
              </form>
            )}
          </section>

          <aside className={styles.journeyCard} aria-labelledby="journey-heading">
            <div className={styles.cardTitleRow}>
              <div className={styles.cardIcon}><Activity aria-hidden="true" size={18}/></div>
              <div>
                <h2 id="journey-heading" className={styles.cardTitle}>Jornada do aluno</h2>
                <p className={styles.cardText}>Visão rápida do fluxo operacional até o início do aprendizado.</p>
              </div>
            </div>
            <div className={styles.journeyStatus}>
              <div className={styles.statusRow}>
                <span className={styles.statusName}>Organização</span>
                <span className={styles.statusValue}>{organizationName}</span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusName}>Convite</span>
                <span className={styles.statusBadge}><CheckCircle2 aria-hidden="true" size={12}/> Fluxo ativo</span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusName}>Próxima etapa</span>
                <span className={styles.statusValue}>Aceite e matrícula</span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusName}>Área do aluno</span>
                <span className={styles.statusValue}>/xpex/aluno</span>
              </div>
            </div>
          </aside>
        </div>

        <section className={styles.activityPanel} aria-labelledby="activity-heading">
          <div className={styles.activityHeader}>
            <div>
              <h2 id="activity-heading" className={styles.activityTitle}>Atividade recente</h2>
              <p className={styles.activityText}>Retorno da última operação executada nesta página.</p>
            </div>
          </div>
          <div className={styles.activityEmpty}>
            <div>
              <strong>{status || error || 'Nenhuma atividade recente nesta sessão'}</strong>
              <p>Esta versão mostra apenas o retorno da operação atual e não apresenta histórico persistente sem uma fonte real de dados.</p>
            </div>
          </div>
        </section>
      </section>
    </XpexAuthenticatedShell>
  )
}
