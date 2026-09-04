import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth/server'
import { resolveXpexAccess, resolveXpexOrganization, type LearnHouseMembership } from '@/lib/xpex/access'
import {
  enrollXpexLaunchStudent,
  inviteXpexLaunchStudent,
  listXpexLaunchCourses,
  type XpexLaunchCourse,
} from '@/lib/xpex/launch-ops'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import type { XpexRole } from '@components/Xpex/xpex-types'

export const dynamic = 'force-dynamic'

async function getAdminLaunchContext() {
  const session = await getServerSession()
  if (!session?.user) redirect('/login?next=%2Fxpex%2Fadmin%2Falunos')
  if (session.user.is_superadmin !== true) redirect('/xpex?admin=forbidden')

  const memberships: LearnHouseMembership[] | undefined = session.roles
  const organization = resolveXpexOrganization(memberships)
  const organizationSlug = organization?.slug
  const accessToken = session.tokens?.access_token
  if (!organizationSlug || !accessToken) redirect('/xpex/admin?organization=missing')

  const membershipRoles = resolveXpexAccess(memberships, organizationSlug)
  const allowedRoles: XpexRole[] = [
    'polo',
    ...membershipRoles.filter(role => role !== 'polo'),
  ] as XpexRole[]
  const fullName = [session.user.first_name, session.user.last_name].filter(Boolean).join(' ').trim()
  const displayName = fullName || session.user.username || 'Administrador XPeX'

  return { organization, organizationSlug, accessToken, allowedRoles, displayName }
}

async function inviteStudent(formData: FormData) {
  'use server'
  const { organizationSlug, accessToken } = await getAdminLaunchContext()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) redirect('/xpex/admin/alunos?error=Informe%20o%20e-mail%20do%20aluno.')

  try {
    await inviteXpexLaunchStudent(accessToken, organizationSlug, email)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao enviar convite.'
    redirect(`/xpex/admin/alunos?error=${encodeURIComponent(message)}`)
  }
  redirect('/xpex/admin/alunos?status=Convite%20enviado.%20Aguarde%20o%20aluno%20aceitar%20antes%20da%20matr%C3%ADcula.')
}

async function enrollStudent(formData: FormData) {
  'use server'
  const { organizationSlug, accessToken } = await getAdminLaunchContext()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const courseUuid = String(formData.get('course_uuid') ?? '').trim()
  if (!email || !courseUuid) redirect('/xpex/admin/alunos?error=Informe%20aluno%20e%20curso%20publicado.')

  try {
    const result = await enrollXpexLaunchStudent(accessToken, organizationSlug, email, courseUuid)
    const message = result?.status === 'already_enrolled'
      ? 'Aluno já estava matriculado neste curso.'
      : 'Matrícula realizada com sucesso.'
    redirect(`/xpex/admin/alunos?status=${encodeURIComponent(message)}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao realizar matrícula.'
    redirect(`/xpex/admin/alunos?error=${encodeURIComponent(message)}`)
  }
}

export default async function AdminStudentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { organization, organizationSlug, accessToken, allowedRoles, displayName } = await getAdminLaunchContext()
  const params = await searchParams
  const status = typeof params.status === 'string' ? params.status : null
  const error = typeof params.error === 'string' ? params.error : null

  let courses: XpexLaunchCourse[] = []
  let coursesError = false
  try {
    courses = await listXpexLaunchCourses(accessToken, organizationSlug)
  } catch {
    coursesError = true
  }

  return (
    <XpexAuthenticatedShell
      role="polo"
      allowedRoles={allowedRoles}
      displayName={displayName}
      organizationSlug={organizationSlug}
      adminAccess
      adminNavigation
    >
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-cyan-500/20 bg-slate-950/75 p-6 md:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-400">XPeX Admin · Operação acadêmica</p>
            <h1 className="mt-3 text-3xl font-black text-white">Alunos</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Convide o aluno e, depois que ele aceitar a organização, matricule-o em um curso publicado. Nenhuma senha é criada ou alterada por esta tela.</p>
          </div>
          <Link className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-white hover:bg-slate-900" href="/xpex/admin">Voltar ao Admin</Link>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Organização ativa</p>
          <p className="mt-1 text-lg font-bold text-white">{organization?.name || organizationSlug}</p>
        </div>

        {status ? <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">{status}</div> : null}
        {error ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div> : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">Etapa 1</p>
            <h2 className="mt-2 text-xl font-black text-white">Convidar aluno</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">O aluno recebe o convite, cria ou usa a própria conta e aceita a participação na organização.</p>
            <form action={inviteStudent} className="mt-6 space-y-4">
              <label className="block text-sm font-bold text-slate-200" htmlFor="invite-email">E-mail do aluno</label>
              <input className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white" id="invite-email" name="email" type="email" placeholder="aluno@exemplo.com" required />
              <button className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-white hover:bg-orange-400" type="submit">Enviar convite</button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">Etapa 2</p>
            <h2 className="mt-2 text-xl font-black text-white">Matricular em curso</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">A matrícula é feita somente para aluno que já entrou na organização e para curso publicado.</p>
            {coursesError ? (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">Não foi possível carregar os cursos publicados. Atualize a página ou confira o acesso administrativo.</div>
            ) : courses.length === 0 ? (
              <div className="mt-6 rounded-xl border border-slate-700 p-3 text-sm text-slate-400">Nenhum curso publicado está disponível para matrícula.</div>
            ) : (
              <form action={enrollStudent} className="mt-6 space-y-4">
                <label className="block text-sm font-bold text-slate-200" htmlFor="enroll-email">E-mail do aluno</label>
                <input className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white" id="enroll-email" name="email" type="email" placeholder="aluno@exemplo.com" required />
                <label className="block text-sm font-bold text-slate-200" htmlFor="course-uuid">Curso publicado</label>
                <select className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white" id="course-uuid" name="course_uuid" required>
                  {courses.map(course => <option key={course.course_uuid} value={course.course_uuid}>{course.name}</option>)}
                </select>
                <button className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-cyan-400" type="submit">Matricular aluno</button>
              </form>
            )}
          </section>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
          <h2 className="text-lg font-black text-white">Percurso para a demonstração</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Depois da matrícula, o aluno entra em <strong className="text-white">/xpex/aluno</strong>, abre o curso e estuda no player. O progresso continua persistido pelo Learning Core.</p>
        </section>
      </section>
    </XpexAuthenticatedShell>
  )
}
