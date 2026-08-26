import Link from 'next/link'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'

const activityTypeLabel: Record<string, string> = {
  TYPE_VIDEO: 'Vídeo',
  TYPE_DOCUMENT: 'Documento',
  TYPE_DYNAMIC: 'Interativo',
  TYPE_ASSIGNMENT: 'Atividade',
}

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const learning = await getAuthorizedStudentLearning(`/xpex/courses/${courseId}`)
  const course = learning?.data.courses.find(item => item.course_id.replace('course_', '') === courseId)
  if (!learning || !course) return <XpexStudentDenied />

  const nextIncomplete = course.activities.find(activity => !activity.complete)
  const reviewActivity = course.activities[0]
  const completed = course.completed_lessons ?? 0
  const total = course.total_lessons || course.activities.length || 1
  const progress = Math.min(100, Math.round((completed / total) * 100))
  const chapters = Array.from(new Set(course.activities.map(activity => activity.chapter_name).filter(Boolean)))

  return (
    <XpexAuthenticatedShell role="aluno" allowedRoles={['aluno']} displayName={learning.displayName} organizationSlug={learning.organization.slug}>
      <section className="xpex-native-page pb-14">
        <header className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#050a12] px-6 py-8 md:px-10 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_15%,rgba(0,174,255,0.24),transparent_26%),radial-gradient(circle_at_20%_90%,rgba(255,98,0,0.14),transparent_30%)]" />
          <div className="relative z-10 max-w-4xl">
            <p className="xpex-label">Curso XPeX · LearnHouse Core</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">{course.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">{course.description || 'Conteúdo publicado e autorizado para sua matrícula.'}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {nextIncomplete ? <Link className="xpex-primary" href={`/xpex/courses/${courseId}/learn/${nextIncomplete.activity_uuid.replace('activity_', '')}`}>{completed ? 'Continuar aprendendo' : 'Começar curso'}</Link> : reviewActivity ? <Link className="xpex-primary" href={`/xpex/courses/${courseId}/learn/${reviewActivity.activity_uuid.replace('activity_', '')}`}>Revisar curso</Link> : null}
              <Link className="xpex-secondary" href="/xpex/courses">Voltar aos meus cursos</Link>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-4 md:grid-cols-3" aria-label="Resumo do curso">
          <article className="xpex-card">
            <span className="xpex-badge">Progresso real</span>
            <div className="mt-3 flex items-end justify-between gap-4"><strong className="text-3xl font-black">{progress}%</strong><span className="text-sm text-slate-400">{completed}/{total} atividades</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-cyan-400" style={{ width: `${progress}%` }} /></div>
          </article>
          <article className="xpex-card"><span className="xpex-badge">Conteúdo</span><h2 className="mt-3 text-3xl font-black">{course.activities.length}</h2><p>Atividades publicadas retornadas pelo domínio autorizado.</p></article>
          <article className="xpex-card"><span className="xpex-badge">Capítulos</span><h2 className="mt-3 text-3xl font-black">{chapters.length}</h2><p>Estrutura derivada diretamente das atividades do curso.</p></article>
        </section>

        <section className="mt-8" aria-labelledby="course-content-heading">
          <div className="mb-4 flex items-end justify-between gap-4"><div><p className="xpex-label">Experiência de aprendizagem</p><h2 id="course-content-heading" className="text-2xl font-black md:text-3xl">Conteúdo do curso</h2></div><span className="text-sm text-slate-400">{course.activities.length} itens</span></div>
          <div className="space-y-3">
            {course.activities.map((activity, index) => {
              const href = `/xpex/courses/${courseId}/learn/${activity.activity_uuid.replace('activity_', '')}`
              const type = activityTypeLabel[activity.activity_type] ?? 'Conteúdo'
              return <Link className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-400/30 hover:bg-white/[0.05]" key={activity.activity_uuid} href={href}>
                <div className="flex items-center gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black ${activity.complete ? 'bg-emerald-400/15 text-emerald-300' : 'bg-cyan-400/10 text-cyan-300'}`}>{activity.complete ? '✓' : String(index + 1).padStart(2, '0')}</div>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><span>{activity.chapter_name || 'Curso'}</span><span>·</span><span>{type}</span></div><h3 className="mt-1 truncate text-base font-bold text-white group-hover:text-cyan-200 md:text-lg">{activity.name}</h3></div>
                  <span className="hidden rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-400 md:inline-flex">{activity.complete ? 'Concluída' : 'Abrir'}</span>
                </div>
              </Link>
            })}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-orange-400/15 bg-orange-400/[0.04] p-5" aria-label="Arquitetura do conteúdo">
          <p className="xpex-label">Fonte de verdade</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">Esta experiência não cria um segundo LMS: matrícula, curso, atividades, tipos de conteúdo e progresso continuam vindo da infraestrutura LearnHouse autorizada. Vídeos, documentos, embeds e conteúdos interativos são renderizados pelo player nativo correspondente.</p>
        </section>
      </section>
    </XpexAuthenticatedShell>
  )
}
