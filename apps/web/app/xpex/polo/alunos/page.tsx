import Link from 'next/link'
import { redirect } from 'next/navigation'

import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { getServerSession } from '@/lib/auth/server'
import { resolveXpexOrganization, resolveXpexPoloAccess } from '@/lib/xpex/access'
import { getPoloBranding } from '@/lib/xpex/polo-branding-server'
import { authorizePoloManager } from '@/lib/xpex/polo-policy'
import {
  enrollXpexLaunchStudent,
  inviteXpexLaunchStudent,
  listXpexLaunchCourses,
} from '@/lib/xpex/launch-ops'

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
      <section className="xpex-native-page" aria-labelledby="students-heading">
        <header className="xpex-card relative overflow-hidden p-6 md:p-8">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(0,212,255,.10),transparent_30%),radial-gradient(circle_at_5%_100%,rgba(255,122,0,.10),transparent_34%)]" />
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="xpex-label">Operação real do Polo</p>
              <h1 id="students-heading" className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">Alunos do Polo</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                Convide o aluno por e-mail e, depois que ele aceitar a organização, matricule-o em um curso publicado. Nenhuma senha é criada ou alterada por este painel.
              </p>
            </div>
            <Link className="xpex-secondary" href="/xpex/polo">Voltar ao Polo</Link>
          </div>
        </header>

        <div className="xpex-card p-5">
          <p className="xpex-label">Organização autorizada</p>
          <p className="mt-2 text-lg font-bold text-white">{organization?.name || organizationSlug}</p>
          <p className="mt-1 text-sm text-slate-400">As operações abaixo permanecem limitadas a esta organização e às permissões validadas no servidor.</p>
        </div>

        {status ? (
          <div role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-200">{status}</div>
        ) : null}
        {error ? (
          <div role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm font-semibold text-red-200">{error}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="xpex-card p-6">
            <p className="xpex-label">Etapa 1</p>
            <h2 className="mt-2 text-xl font-black text-white">Convidar aluno</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              O fluxo nativo envia o convite para o e-mail informado. O aluno cria ou usa a própria conta e aceita a participação no Polo.
            </p>
            <form action={inviteStudent} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-slate-200" htmlFor="invite-email">E-mail do aluno</label>
              <input
                className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                id="invite-email"
                name="email"
                type="email"
                placeholder="aluno@exemplo.com"
                required
                autoComplete="email"
              />
              <button className="xpex-primary w-full justify-center" type="submit">Enviar convite</button>
            </form>
          </section>

          <section className="xpex-card p-6">
            <p className="xpex-label">Etapa 2</p>
            <h2 className="mt-2 text-xl font-black text-white">Matricular em curso</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              A matrícula só é aceita para aluno que já entrou na organização e para curso publicado.
            </p>
            {courses.length === 0 ? (
              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                Nenhum curso publicado está disponível para matrícula.
              </div>
            ) : (
              <form action={enrollStudent} className="mt-6 space-y-4">
                <label className="block text-sm font-semibold text-slate-200" htmlFor="enroll-email">E-mail do aluno</label>
                <input
                  className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                  id="enroll-email"
                  name="email"
                  type="email"
                  placeholder="aluno@exemplo.com"
                  required
                  autoComplete="email"
                />
                <label className="block text-sm font-semibold text-slate-200" htmlFor="course-uuid">Curso publicado</label>
                <select className="min-h-11 w-full rounded-xl border border-white/10 bg-[#08111d] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50" id="course-uuid" name="course_uuid" required>
                  {courses.map((course) => (
                    <option key={course.course_uuid} value={course.course_uuid}>{course.name}</option>
                  ))}
                </select>
                <button className="xpex-primary w-full justify-center" type="submit">Matricular aluno</button>
              </form>
            )}
          </section>
        </div>

        <section className="xpex-card p-6">
          <p className="xpex-label">Depois da matrícula</p>
          <h2 className="mt-2 text-lg font-black text-white">Jornada do aluno</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            O aluno entra em <strong className="text-white">/xpex/aluno</strong>, abre o curso e conclui as atividades. O progresso é persistido no Learning Core e passa a alimentar tanto o gate de prontidão quanto o painel agregado da professora.
          </p>
        </section>
      </section>
    </XpexAuthenticatedShell>
  )
}
