import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth/server'
import { resolveXpexOrganization } from '@/lib/xpex/access'
import {
  enrollXpexLaunchStudent,
  inviteXpexLaunchStudent,
  listXpexLaunchCourses,
} from '@/lib/xpex/launch-ops'

async function getLaunchContext() {
  const session = await getServerSession()
  if (!session?.user) redirect('/login?next=%2Fxpex%2Fpolo%2Falunos')

  const organization = resolveXpexOrganization(session.roles)
  const organizationSlug = organization?.slug
  const accessToken = session.tokens?.access_token
  if (!organizationSlug || !accessToken) redirect('/xpex/polo')

  return { organization, organizationSlug, accessToken }
}

async function inviteStudent(formData: FormData) {
  'use server'
  const { organizationSlug, accessToken } = await getLaunchContext()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) redirect('/xpex/polo/alunos?error=Informe%20o%20e-mail%20do%20aluno.')

  try {
    await inviteXpexLaunchStudent(accessToken, organizationSlug, email)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao enviar convite.'
    redirect(`/xpex/polo/alunos?error=${encodeURIComponent(message)}`)
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

  try {
    const result = await enrollXpexLaunchStudent(
      accessToken,
      organizationSlug,
      email,
      courseUuid
    )
    const message = result?.status === 'already_enrolled'
      ? 'Aluno já estava matriculado neste curso.'
      : 'Matrícula realizada com sucesso.'
    redirect(`/xpex/polo/alunos?status=${encodeURIComponent(message)}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao realizar matrícula.'
    redirect(`/xpex/polo/alunos?error=${encodeURIComponent(message)}`)
  }
}

export default async function PoleStudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { organization, organizationSlug, accessToken } = await getLaunchContext()
  const params = await searchParams
  const status = typeof params.status === 'string' ? params.status : null
  const error = typeof params.error === 'string' ? params.error : null

  let courses = []
  let coursesError = false
  try {
    courses = await listXpexLaunchCourses(accessToken, organizationSlug)
  } catch {
    coursesError = true
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Operação de lançamento</p>
            <h1 className="text-3xl font-semibold tracking-tight">Alunos do Polo</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Convide o aluno por e-mail e, depois que ele aceitar a organização, matricule-o em um curso publicado. Nenhuma senha é criada ou alterada por este painel.
            </p>
          </div>
          <Link className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted" href="/xpex/polo">
            Voltar ao Polo
          </Link>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Organização</p>
          <p className="mt-1 text-lg font-medium">{organization?.name || organizationSlug}</p>
        </div>

        {status ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">{status}</div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">{error}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Etapa 1</p>
            <h2 className="mt-2 text-xl font-semibold">Convidar aluno</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              O fluxo nativo envia o convite para o e-mail informado. O aluno cria ou usa a própria conta e aceita a participação no Polo.
            </p>
            <form action={inviteStudent} className="mt-6 space-y-4">
              <label className="block text-sm font-medium" htmlFor="invite-email">E-mail do aluno</label>
              <input
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                id="invite-email"
                name="email"
                type="email"
                placeholder="aluno@exemplo.com"
                required
              />
              <button className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" type="submit">
                Enviar convite
              </button>
            </form>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Etapa 2</p>
            <h2 className="mt-2 text-xl font-semibold">Matricular em curso</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A matrícula só é aceita para aluno que já entrou na organização e para curso publicado.
            </p>
            {coursesError ? (
              <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
                Não foi possível carregar os cursos publicados. Atualize a página ou confira o acesso administrativo.
              </div>
            ) : courses.length === 0 ? (
              <div className="mt-6 rounded-lg border p-3 text-sm text-muted-foreground">
                Nenhum curso publicado está disponível para matrícula.
              </div>
            ) : (
              <form action={enrollStudent} className="mt-6 space-y-4">
                <label className="block text-sm font-medium" htmlFor="enroll-email">E-mail do aluno</label>
                <input
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  id="enroll-email"
                  name="email"
                  type="email"
                  placeholder="aluno@exemplo.com"
                  required
                />
                <label className="block text-sm font-medium" htmlFor="course-uuid">Curso publicado</label>
                <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" id="course-uuid" name="course_uuid" required>
                  {courses.map((course) => (
                    <option key={course.course_uuid} value={course.course_uuid}>{course.name}</option>
                  ))}
                </select>
                <button className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" type="submit">
                  Matricular aluno
                </button>
              </form>
            )}
          </section>
        </div>

        <section className="rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Depois da matrícula</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            O aluno entra em <strong className="text-foreground">/xpex/aluno</strong>, abre o curso e conclui as atividades. O progresso é persistido no Learning Core e passa a alimentar tanto o gate de prontidão quanto o painel agregado da professora.
          </p>
        </section>
      </div>
    </main>
  )
}
