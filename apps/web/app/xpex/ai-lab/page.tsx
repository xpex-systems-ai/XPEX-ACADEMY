import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Database,
  FolderKanban,
  LibraryBig,
  Network,
  Play,
  Route,
  Sparkles,
  TerminalSquare,
  Users,
  Workflow,
} from 'lucide-react'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'
import Copilot from '../../orgs/[orgslug]/(withmenu)/copilot/copilot'

const discoveryRows = [
  {
    title: 'Comece pela base',
    subtitle: 'Fundamentos, prompts e prática guiada para transformar teoria em domínio.',
    items: [
      { title: 'Prompt Engineering', eyebrow: 'GX Studio', description: 'Estruture objetivos, compare estratégias e refine prompts com o GX.', icon: Sparkles, href: '#gx-copilot', action: 'Praticar agora' },
      { title: 'RAG e conhecimento privado', eyebrow: 'Core LearnHouse', description: 'Use o Copilot/RAG nativo sobre conteúdo autorizado.', icon: BrainCircuit, href: '#gx-copilot', action: 'Abrir bancada' },
      { title: 'Atividades do curso', eyebrow: 'Conteúdo XPeX', description: 'Volte às atividades publicadas e avance com progresso persistido.', icon: Play, href: '/xpex/activities', action: 'Continuar' },
    ],
  },
  {
    title: 'Construa projetos reais',
    subtitle: 'Saia do consumo passivo e transforme aprendizado em artefatos, decisões e evidências.',
    items: [
      { title: 'Workspace de Projetos GX', eyebrow: 'LAB-002', description: 'Templates de Prompt Engineering, RAG, Automação e Projeto Final.', icon: FolderKanban, href: '/xpex/ai-lab/projects', action: 'Abrir workspace' },
      { title: 'Boards', eyebrow: 'Core LearnHouse', description: 'Planeje tarefas, milestones e entregas no domínio colaborativo nativo.', icon: Workflow, href: 'boards', action: 'Planejar projeto', orgRoute: true },
      { title: 'Library', eyebrow: 'Core LearnHouse', description: 'Organize fontes, materiais e referências autorizadas da organização.', icon: LibraryBig, href: 'library', action: 'Organizar fontes', orgRoute: true },
    ],
  },
  {
    title: 'Expanda sua jornada',
    subtitle: 'Conecte laboratório, trilhas e comunidade em uma experiência única de evolução.',
    items: [
      { title: 'Trilhas profissionais', eyebrow: 'XPeX + LearnHouse', description: 'Combine o curso atual com academias oficiais e direção orientada pelo GX.', icon: Route, href: '/xpex/trails', action: 'Explorar trilhas' },
      { title: 'Comunidade', eyebrow: 'Core LearnHouse', description: 'Compartilhe dúvidas, projetos e aprendizados com a camada comunitária.', icon: Users, href: '/xpex/community', action: 'Abrir comunidade' },
      { title: 'Modelos, APIs e sandboxes', eyebrow: 'Roadmap seguro', description: 'Execução isolada só será liberada com quota, persistência, ACL e observabilidade reais.', icon: TerminalSquare, href: null, action: 'Em preparação' },
    ],
  },
] as const

export default async function XpexAiLabPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/ai-lab')
  if (!learning) return <XpexStudentDenied />

  const courses = learning.data.courses
  const totalLessons = courses.reduce((sum, course) => sum + (course.total_lessons || 0), 0)
  const completedLessons = courses.reduce((sum, course) => sum + (course.completed_lessons || 0), 0)
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  const activeCourses = courses.filter(course => (course.progress_percent ?? 0) < 100).length
  const orgBase = `/orgs/${learning.organization.slug}`
  const continueCourse = learning.data.continue_learning
  const gxStage = progress < 25 ? 'Fundamentos' : progress < 70 ? 'Construção prática' : 'Projeto e especialização'
  const gxRecommendation = progress < 25
    ? 'Comece por Prompt Engineering, conclua a próxima atividade e use o GX para revisar conceitos antes de avançar.'
    : progress < 70
      ? 'Leve o que já aprendeu para um projeto no Workspace GX e registre decisões e fontes em Boards + Library.'
      : 'Consolide um projeto demonstrável, revise lacunas com o GX e use Trilhas para escolher sua próxima especialização.'

  return (
    <XpexAuthenticatedShell
      role="aluno"
      allowedRoles={['aluno']}
      displayName={learning.displayName}
      organizationSlug={learning.organization.slug}
    >
      <section className="xpex-native-page pb-14">
        <header className="sr-only">
          <h1>Laboratório de I.A. GX</h1>
          <p>Experiência profissional de prática, projetos e mentoria construída sobre o núcleo LearnHouse.</p>
        </header>

        <section className="relative -mx-2 overflow-hidden rounded-[28px] border border-white/10 bg-[#050a12] px-6 py-9 md:px-9 lg:min-h-[430px] lg:px-12 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(0,174,255,0.30),transparent_24%),radial-gradient(circle_at_62%_70%,rgba(255,98,0,0.18),transparent_28%),linear-gradient(90deg,#050a12_0%,#07111d_48%,#061624_100%)]" />
          <div className="absolute right-[8%] top-[12%] hidden h-64 w-64 rounded-full border border-cyan-400/20 shadow-[0_0_90px_rgba(0,174,255,0.20)] lg:block" />
          <div className="absolute right-[13%] top-[22%] hidden h-44 w-44 rounded-full border border-orange-500/20 shadow-[0_0_70px_rgba(255,98,0,0.16)] lg:block" />

          <div className="relative z-10 max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-orange-400"><Bot size={16}/> XPeX AI Lab Studio · LearnHouse Core</p>
            <h2 className="mt-5 text-4xl font-black leading-[0.98] text-white md:text-6xl lg:text-7xl">Aprenda. Pratique. Construa.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">Uma experiência de laboratório em formato de catálogo: continue do ponto certo, descubra práticas, construa projetos e use o GX como mentor dentro do contexto autorizado.</p>

            <div className="mt-7 flex flex-wrap gap-3">
              {continueCourse ? <Link href={continueCourse.target_href} className="xpex-primary"><Play size={18} fill="currentColor"/> Continuar aprendendo</Link> : null}
              <Link href="/xpex/ai-lab/projects" className="xpex-secondary"><FolderKanban size={17}/> Projetos GX</Link>
              <a href="#gx-copilot" className="xpex-secondary"><Bot size={17}/> Falar com GX</a>
            </div>

            {continueCourse ? <div className="mt-8 max-w-xl">
              <div className="flex items-center justify-between gap-4 text-xs font-black uppercase tracking-[0.16em] text-slate-400"><span>Continuar · {continueCourse.title}</span><span>{continueCourse.progress_percent ?? 0}%</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-cyan-400" style={{ width: `${Math.max(2, continueCourse.progress_percent ?? 0)}%` }} /></div>
            </div> : null}
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores reais do laboratório">
          <article className="xpex-card"><span className="xpex-badge">Cursos ativos</span><h2 className="mt-3 text-3xl font-black">{activeCourses}</h2><p>Derivados das matrículas autorizadas.</p></article>
          <article className="xpex-card"><span className="xpex-badge">Aulas disponíveis</span><h2 className="mt-3 text-3xl font-black">{totalLessons}</h2><p>Atividades publicadas e acessíveis.</p></article>
          <article className="xpex-card"><span className="xpex-badge">Aulas concluídas</span><h2 className="mt-3 text-3xl font-black">{completedLessons}</h2><p>Conclusões persistidas no progresso real.</p></article>
          <article className="xpex-card"><span className="xpex-badge">Evolução</span><h2 className="mt-3 text-3xl font-black">{progress}%</h2><p>Progresso agregado dos cursos liberados.</p></article>
        </section>

        <section className="mt-9 overflow-hidden rounded-3xl border border-cyan-400/20 bg-[linear-gradient(110deg,rgba(0,174,255,0.09),rgba(255,98,0,0.06))] p-6 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="xpex-label">GX Recomenda · baseado no seu progresso real</p>
              <h2 className="mt-2 text-2xl font-black md:text-3xl">Seu momento: {gxStage}</h2>
              <p className="mt-3 leading-7 text-slate-300">{gxRecommendation}</p>
            </div>
            <a href="#gx-copilot" className="xpex-primary shrink-0"><Bot size={17}/> Personalizar com GX</a>
          </div>
        </section>

        {discoveryRows.map(row => (
          <section key={row.title} className="mt-11" aria-labelledby={`lab-row-${row.title.replaceAll(' ', '-').toLowerCase()}`}>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 id={`lab-row-${row.title.replaceAll(' ', '-').toLowerCase()}`} className="text-2xl font-black md:text-3xl">{row.title}</h2>
                <p className="mt-1 max-w-3xl text-sm text-slate-400">{row.subtitle}</p>
              </div>
            </div>
            <div className="flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]">
              {row.items.map(({ title, eyebrow, description, icon: Icon, href, action, ...item }) => {
                const destination = href && 'orgRoute' in item && item.orgRoute ? `${orgBase}/${href}` : href
                return <article key={title} className="group relative min-h-[245px] min-w-[280px] max-w-[340px] flex-1 snap-start overflow-hidden rounded-2xl border border-white/10 bg-[#0b1625] p-5 transition duration-300 hover:-translate-y-1 hover:border-orange-500/45 hover:shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                  <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(circle_at_85%_10%,rgba(0,174,255,0.13),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(255,98,0,0.12),transparent_35%)]" />
                  <div className="relative z-10 flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">{eyebrow}</span><Icon className="text-cyan-400" size={24}/></div>
                    <h3 className="mt-5 text-xl font-black">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
                    {destination ? <Link href={destination} className="mt-auto pt-6 text-sm font-black text-white transition group-hover:text-orange-400">{action} <ArrowRight className="inline" size={15}/></Link> : <span className="mt-auto pt-6 text-sm font-black text-slate-500">{action}</span>}
                  </div>
                </article>
              })}
            </div>
          </section>
        ))}

        <section className="mt-11 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="xpex-card border border-cyan-400/20">
            <p className="xpex-label">Arquitetura operacional</p>
            <h2 className="mt-2 text-2xl font-black">Um estúdio sobre a fundação LearnHouse.</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><Network className="text-cyan-400" size={20}/><h3 className="mt-3 font-black">GX / Copilot / RAG</h3><p className="mt-2 text-sm text-slate-400">Mentoria e recuperação de contexto autorizado.</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><Database className="text-cyan-400" size={20}/><h3 className="mt-3 font-black">Course + Trail + TrailRun</h3><p className="mt-2 text-sm text-slate-400">Cursos, matrícula e progresso seguem como fonte de verdade.</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><FolderKanban className="text-cyan-400" size={20}/><h3 className="mt-3 font-black">Boards + Library</h3><p className="mt-2 text-sm text-slate-400">Projetos e evidências reutilizam capacidades do fork.</p></div>
            </div>
          </article>
          <article className="xpex-card border border-orange-500/20">
            <p className="xpex-label">Regra de engenharia</p>
            <h2 className="mt-2 text-2xl font-black">Sem laboratório fictício.</h2>
            <p className="mt-3 leading-7 text-slate-300">Notebooks, datasets privados, execução de código, modelos e APIs só serão marcados como ativos quando existirem isolamento, persistência, autorização, quota e observabilidade reais.</p>
            <Link href="/xpex/ai-lab/projects" className="xpex-secondary mt-5">Abrir projetos reais <ArrowRight size={16}/></Link>
          </article>
        </section>

        <section id="gx-copilot" className="mt-12 scroll-mt-24" aria-labelledby="gx-copilot-title">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="xpex-label">Bancada central</p>
              <h2 id="gx-copilot-title" className="text-3xl font-black">GX Course Copilot</h2>
              <p className="mt-2 max-w-4xl text-slate-400">Copilot/RAG real do LearnHouse, reaproveitado pela XPeX para explicar conteúdo, revisar conceitos, montar planos e apoiar projetos.</p>
            </div>
          </div>
          <div className="xpex-card overflow-hidden p-0 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <Copilot orgslug={learning.organization.slug} />
          </div>
        </section>
      </section>
    </XpexAuthenticatedShell>
  )
}
