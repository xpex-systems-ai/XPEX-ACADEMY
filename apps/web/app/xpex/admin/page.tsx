import Link from 'next/link'
import { xpexControlCenterRoute, xpexCourseStudioRoute, xpexPoloCoursesRoute } from '@/lib/xpexRouteMap'
import { getUriWithOrg } from '@services/config/config'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import {
  resolveXpexAccess,
  resolveXpexOrganization,
  type LearnHouseMembership,
} from '@/lib/xpex/access'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import type { XpexRole } from '@components/Xpex/xpex-types'

export const dynamic = 'force-dynamic'

export default async function XpexAdminPage() {
  const session = await getServerSession()
  if (!session?.user) redirect('/login?next=%2Fxpex%2Fadmin')

  const memberships: LearnHouseMembership[] | undefined = session.roles
  const organization = resolveXpexOrganization(memberships)
  const organizationSlug = organization?.slug ?? 'global'
  const membershipRoles = organization?.slug ? resolveXpexAccess(memberships, organization.slug) : []
  const isSuperadmin = session.user.is_superadmin === true

  if (!isSuperadmin) redirect('/xpex?admin=forbidden')

  const shellRole: XpexRole = 'polo'
  const allowedRoles: XpexRole[] = [
    'polo',
    ...membershipRoles.filter(role => role !== 'polo'),
  ] as XpexRole[]
  const fullName = [session.user.first_name, session.user.last_name].filter(Boolean).join(' ').trim()
  const displayName = fullName || session.user.username || 'Administrador XPeX'
  const courseStudioPath = organization?.slug ? xpexCourseStudioRoute(organization.slug) : null
  const coursesPath = organization?.slug ? xpexPoloCoursesRoute(organization.slug) : null
  const classesPath = organization?.slug ? getUriWithOrg(organization.slug, '/dash/users/settings/usergroups') : null
  const reportsPath = organization?.slug ? getUriWithOrg(organization.slug, '/dash/analytics') : null

  return (
    <XpexAuthenticatedShell
      role={shellRole}
      allowedRoles={allowedRoles}
      displayName={displayName}
      organizationSlug={organizationSlug}
      adminAccess
      adminNavigation
    >
      <section className="space-y-6">
        <header className="rounded-3xl border border-cyan-500/20 bg-slate-950/75 p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-400">XPeX Admin</p>
              <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">Painel administrativo</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Centro operacional do superadmin. As telas profundas do LearnHouse continuam sendo usadas somente onde concentram a gestão acadêmica real da organização.
              </p>
            </div>
            <span className="w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
              Superadmin ativo
            </span>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AdminCard title="Centro de Controle" description="Operação acadêmica, fábrica editorial e telemetria audiovisual em um só lugar." href={xpexControlCenterRoute()} action="Abrir centro de controle" />
          <AdminCard title="Alunos" description="Convidar alunos, matricular em cursos publicados e preparar o acesso para a demonstração." href="/xpex/admin/alunos" action="Gerenciar alunos" />
          {courseStudioPath ? <AdminCard title="Fábrica de Cursos IA" description="Criar, revisar, aprovar e publicar cursos na organização autorizada." href={courseStudioPath} action="Abrir Course Studio" /> : <AdminNotice title="Organização" description="Sua conta superadmin está ativa, mas ainda não há uma organização vinculada à sessão atual." />}
          {coursesPath ? <AdminCard title="Cursos" description="Abrir o catálogo administrativo real de cursos e conteúdos da organização." href={coursesPath} action="Gerenciar cursos" /> : <AdminNotice title="Cursos" description="Vincule uma organização para habilitar os atalhos operacionais de cursos." />}
          {classesPath ? <AdminCard title="Turmas" description="Gerenciar grupos e turmas na área acadêmica vinculada à organização atual." href={classesPath} action="Gerenciar turmas" /> : <AdminNotice title="Turmas" description="Vincule uma organização para habilitar a gestão de turmas." />}
          {reportsPath ? <AdminCard title="Relatórios" description="Abrir analytics e indicadores acadêmicos da organização atual." href={reportsPath} action="Abrir relatórios" /> : <AdminNotice title="Relatórios" description="Vincule uma organização para habilitar os relatórios." />}
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-400">Sessão administrativa</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Status label="Usuário" value={displayName} />
            <Status label="Organização" value={organization?.name || organization?.slug || 'Global / não vinculada'} />
            <Status label="Acesso" value="Superadmin" />
            <Status label="Modo" value="XPeX Admin + Learning Core" />
          </div>
        </section>
      </section>
    </XpexAuthenticatedShell>
  )
}

function AdminCard({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6"><h2 className="text-xl font-black text-white">{title}</h2><p className="mt-2 min-h-16 text-sm leading-6 text-slate-400">{description}</p><Link href={href} className="mt-6 inline-flex rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-white transition hover:bg-orange-400">{action}</Link></article>
}

function AdminNotice({ title, description }: { title: string; description: string }) {
  return <article className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-6"><h2 className="text-xl font-black text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-amber-100/80">{description}</p></article>
}

function Status({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><strong className="mt-2 block text-white">{value}</strong></div>
}
