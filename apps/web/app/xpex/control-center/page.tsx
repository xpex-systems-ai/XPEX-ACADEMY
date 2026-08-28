import Link from 'next/link'
import { xpexCourseStudioRoute, xpexPoloCoursesRoute } from '@/lib/xpexRouteMap'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { resolveXpexAccess, type LearnHouseMembership } from '@/lib/xpex/access'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import type { XpexRole } from '@components/Xpex/xpex-types'
import {
  getCourseStudioDraft,
  listCourseStudioDrafts,
  listVideoJobs,
  type CourseStudioDraft,
  type VideoStudioJob,
} from '@services/xpex/courseStudio'

const waitingStates = new Set(['AWAITING_HUMAN_APPROVAL', 'APPROVED', 'ATTACHED'])
const activeStates = new Set(['QUEUED', 'SCRIPTING', 'STORYBOARDING', 'NARRATING', 'ASSET_GENERATION', 'RENDERING', 'REVIEWING'])
const launchDraftId = 'xped_launch002_site_profissional_v1'
const draftPageSize = 100

type DraftJobsResult = {
  draftId: string
  jobs: VideoStudioJob[]
  error: boolean
}

async function loadAllDrafts(organizationSlug: string, accessToken: string) {
  const drafts: CourseStudioDraft[] = []
  let offset = 0

  while (true) {
    const page = await listCourseStudioDrafts(organizationSlug, accessToken, {
      limit: draftPageSize,
      offset,
    })
    drafts.push(...page)
    if (page.length < draftPageSize) break
    offset += page.length
  }

  return drafts
}

async function resolveAdministrativeContext(
  memberships: LearnHouseMembership[] | undefined,
  accessToken: string,
) {
  const slugs = [...new Set((memberships ?? []).map(item => item.org?.slug).filter((slug): slug is string => Boolean(slug)))]
  for (const organizationSlug of slugs) {
    try {
      const drafts = await loadAllDrafts(organizationSlug, accessToken)
      let launchDraft: CourseStudioDraft | null = null
      try {
        const candidate = await getCourseStudioDraft(launchDraftId, accessToken)
        if (candidate.organization_slug === organizationSlug) launchDraft = candidate
      } catch {
        launchDraft = null
      }
      if (launchDraft && !drafts.some(draft => draft.draft_id === launchDraft.draft_id)) {
        drafts.push(launchDraft)
      }
      return { organizationSlug, drafts, launchDraft }
    } catch {
      // Capability probe intentionally fails closed. Try another authorized organization, if any.
    }
  }
  return null
}

export default async function XpexControlCenterPage() {
  const session = await getServerSession()
  if (!session?.user) redirect('/login?next=%2Fxpex%2Fcontrol-center')
  if (!session.tokens?.access_token) redirect('/xpex')
  const accessToken = session.tokens.access_token

  const context = await resolveAdministrativeContext(session.roles, accessToken)
  if (!context) redirect('/xpex?admin=forbidden')

  const { organizationSlug, drafts, launchDraft } = context
  const roles = resolveXpexAccess(session.roles, organizationSlug)
  const shellRole: XpexRole = roles.includes('polo') ? 'polo' : roles.includes('professora') ? 'professora' : 'aluno'
  const fullName = [session.user.first_name, session.user.last_name].filter(Boolean).join(' ').trim()
  const displayName = fullName || session.user.username || 'Administrador XPeX'
  const isSuperadmin = 'is_superadmin' in session.user && session.user.is_superadmin === true

  const jobsByDraft: DraftJobsResult[] = await Promise.all(
    drafts.map(async draft => {
      try {
        const jobs = await listVideoJobs(draft.draft_id, accessToken)
        return { draftId: draft.draft_id, jobs, error: false }
      } catch {
        return { draftId: draft.draft_id, jobs: [], error: true }
      }
    })
  )
  const failedJobLoads = jobsByDraft.filter(result => result.error)
  const jobTelemetryUnavailable = failedJobLoads.length > 0
  const jobs = jobsByDraft.filter(result => !result.error).flatMap(result => result.jobs)
  const active = jobs.filter(job => activeStates.has(job.state)).length
  const awaiting = jobs.filter(job => waitingStates.has(job.state)).length
  const failed = jobs.filter(job => job.state === 'FAILED').length
  const launchJobResult = launchDraft ? jobsByDraft.find(result => result.draftId === launchDraft.draft_id) : undefined
  const launchJobs = launchJobResult?.jobs ?? []
  const launchPublished = launchJobs.filter(job => job.state === 'PUBLISHED').length
  const courseStudioPath = xpexCourseStudioRoute(organizationSlug)
  const coursesPath = xpexPoloCoursesRoute(organizationSlug)

  return (
    <XpexAuthenticatedShell
      role={shellRole}
      allowedRoles={roles.length ? roles : [shellRole]}
      displayName={displayName}
      organizationSlug={organizationSlug}
      adminAccess
    >
      <section className="space-y-6">
        <header className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-400">XPeX Control Center</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black text-white md:text-5xl">Operação acadêmica em um só lugar.</h1>
              <p className="mt-3 max-w-3xl text-slate-300">Cursos, fábrica editorial, produção audiovisual e operação LearnHouse com autorização validada pelo backend.</p>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">Admin autorizado · {organizationSlug}</span>
          </div>
        </header>

        {jobTelemetryUnavailable ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100">
            A telemetria de vídeo está parcialmente indisponível para {failedJobLoads.length} rascunho(s). As métricas agregadas permanecem ocultas até o backend responder novamente.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Rascunhos editoriais" value={drafts.length} />
          <Metric label="Vídeos processando" value={jobTelemetryUnavailable ? '—' : active} />
          <Metric label="Aguardando humano" value={jobTelemetryUnavailable ? '—' : awaiting} />
          <Metric label="Falhas" value={jobTelemetryUnavailable ? '—' : failed} danger={!jobTelemetryUnavailable && failed > 0} />
        </div>

        <section className={`grid gap-4 ${isSuperadmin ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
          <ActionCard title="Fábrica de Cursos IA" description="Gerar, revisar, aprovar e publicar cursos pelo fluxo editorial XPeX." href={courseStudioPath} action="Abrir Course Studio" />
          <ActionCard title="Cursos LearnHouse" description="Acompanhar o catálogo nativo, cursos e conteúdos publicados." href={coursesPath} action="Abrir cursos" />
          {isSuperadmin ? <ActionCard title="Administração" description="Acessar recursos avançados da plataforma quando necessário." href="/admin" action="Abrir admin" /> : null}
        </section>

        <section className="rounded-3xl border border-slate-700/60 bg-slate-950/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-400">Produção Audiovisual</p>
              <h2 className="mt-2 text-2xl font-black text-white">Primeiro curso real</h2>
              <p className="mt-1 text-slate-400">Criação de Sites Profissionais — do Zero ao Deploy</p>
            </div>
            <span className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
              {launchJobResult?.error ? 'Telemetria indisponível' : `${launchJobs.length}/24 jobs encontrados · ${launchPublished} publicados`}
            </span>
          </div>
          {!launchDraft ? (
            <p className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-200">O draft de lançamento não está disponível para esta organização. O painel permanece em fail-closed até o backend autorizá-lo.</p>
          ) : launchJobResult?.error ? (
            <p className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-200">Não foi possível carregar os jobs do curso de lançamento. Nenhum estado foi tratado como zero; tente novamente quando o backend estiver disponível.</p>
          ) : (
            <div className="mt-6 grid gap-3">
              {launchJobs.map(job => (
                <div key={job.job_id} className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <strong className="text-white">{job.lesson_title}</strong>
                    <p className="mt-1 text-sm text-slate-400">{job.lesson_id} · tentativa {job.attempt_count}</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${job.state === 'FAILED' ? 'bg-red-500/15 text-red-300' : job.state === 'AWAITING_HUMAN_APPROVAL' ? 'bg-amber-400/15 text-amber-200' : 'bg-cyan-400/10 text-cyan-300'}`}>{job.state}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </XpexAuthenticatedShell>
  )
}

function Metric({ label, value, danger = false }: { label: string; value: number | string; danger?: boolean }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"><p className="text-sm text-slate-400">{label}</p><strong className={`mt-2 block text-3xl font-black ${danger ? 'text-red-300' : 'text-white'}`}>{value}</strong></div>
}

function ActionCard({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6"><h2 className="text-xl font-black text-white">{title}</h2><p className="mt-2 min-h-12 text-sm text-slate-400">{description}</p><Link className="mt-6 inline-flex rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-400" href={href}>{action}</Link></article>
}
