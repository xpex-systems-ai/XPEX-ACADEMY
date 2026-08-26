import Link from 'next/link'
import { ArrowRight, Bot, BrainCircuit, Cloud, Code2, Layers3, Route, Sparkles, Workflow } from 'lucide-react'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'

const futureTracks = [
  { title: 'IA Generativa e LLMs', icon: BrainCircuit, description: 'Da base conceitual a aplicações com modelos generativos, prompts e avaliação.' },
  { title: 'Agentes e Automação', icon: Workflow, description: 'Fluxos, ferramentas, integrações e agentes orientados a objetivos.' },
  { title: 'Cloud para IA', icon: Cloud, description: 'Fundamentos de infraestrutura, APIs e serviços para aplicações inteligentes.' },
  { title: 'Engenharia com IA', icon: Code2, description: 'Desenvolvimento assistido, APIs, RAG e construção de produtos com IA.' },
  { title: 'Produtividade com IA', icon: Layers3, description: 'Ferramentas e processos para pesquisa, criação, organização e execução.' },
] as const

export default async function TrailsPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/trails')
  if (!learning) return <XpexStudentDenied />

  const activeCourses = learning.data.courses
  const totalLessons = activeCourses.reduce((sum, course) => sum + (course.total_lessons || 0), 0)
  const completedLessons = activeCourses.reduce((sum, course) => sum + (course.completed_lessons || 0), 0)

  return (
    <XpexAuthenticatedShell role="aluno" allowedRoles={['aluno']} displayName={learning.displayName} organizationSlug={learning.organization.slug}>
      <section className="xpex-native-page">
        <header>
          <p className="xpex-label">Jornadas de evolução</p>
          <h1>Trilhas XPeX</h1>
          <p>Organize sua evolução por jornadas progressivas. Seus números abaixo vêm apenas de cursos e atividades autorizados para sua conta.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="xpex-card"><span className="xpex-badge">Trilhas ativas</span><h2 className="mt-3 text-3xl font-black">{activeCourses.length}</h2><p>Jornadas com curso publicado e matrícula ativa.</p></article>
          <article className="xpex-card"><span className="xpex-badge">Aulas concluídas</span><h2 className="mt-3 text-3xl font-black">{completedLessons}</h2><p>Conclusões registradas no seu progresso real.</p></article>
          <article className="xpex-card"><span className="xpex-badge">Aulas disponíveis</span><h2 className="mt-3 text-3xl font-black">{totalLessons}</h2><p>Atividades publicadas nos cursos liberados para você.</p></article>
        </div>

        <div className="xpex-card mt-6 overflow-hidden border border-orange-500/25 bg-[radial-gradient(circle_at_75%_10%,rgba(8,124,255,0.18),transparent_28%),radial-gradient(circle_at_20%_20%,rgba(255,106,0,0.18),transparent_34%),#081321]">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-orange-400"><Sparkles size={15}/> Painel de trilhas</span>
            <h2 className="mt-4 text-3xl font-black md:text-5xl">Escolha sua direção. Evolua com evidência.</h2>
            <p className="mt-4 max-w-2xl text-slate-300">Cada trilha conecta conteúdo, prática e progresso. A XPeX só marca como ativa uma jornada que já possui conteúdo publicado e acesso autorizado.</p>
          </div>
        </div>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4"><div><p className="xpex-label">Em andamento</p><h2 className="text-2xl font-black">Suas trilhas</h2></div><Link href="/xpex/courses" className="text-sm font-bold text-cyan-400">Ver cursos</Link></div>
          {activeCourses.length ? <div className="xpex-course-grid">{activeCourses.map(course => {
            const courseId = course.course_id.replace('course_', '')
            return <article className="xpex-card xpex-learning-card" key={course.course_id}>
              <div className="mb-3 flex items-center justify-between gap-3"><span className="xpex-badge">Trilha ativa</span><Route size={20} className="text-orange-400"/></div>
              <h3 className="text-xl font-black">{course.title}</h3>
              <p>{course.description || 'Jornada de aprendizado liberada para sua conta.'}</p>
              <div className="mt-4 flex items-center justify-between text-sm"><span>{course.completed_lessons} de {course.total_lessons} aulas</span><strong>{course.progress_percent ?? 0}%</strong></div>
              <progress className="mt-2" value={course.completed_lessons} max={course.total_lessons || 1}>{course.progress_percent ?? 0}%</progress>
              <Link className="xpex-primary mt-5" href={`/xpex/courses/${courseId}`}>{course.completed_lessons ? 'Continuar trilha' : 'Começar trilha'}<ArrowRight size={17}/></Link>
            </article>
          })}</div> : <div className="xpex-card xpex-empty"><h2>Nenhuma trilha ativa</h2><p>Quando um curso publicado for liberado para sua conta, ele aparecerá aqui como jornada ativa.</p></div>}
        </section>

        <section className="mt-10">
          <div className="mb-4"><p className="xpex-label">Mapa de evolução</p><h2 className="text-2xl font-black">Próximas trilhas planejadas</h2><p className="mt-2 text-slate-400">Estas categorias mostram a direção do catálogo. Elas não exibem métricas, matrícula ou progresso enquanto não houver conteúdo real publicado.</p></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{futureTracks.map(({ title, description, icon: Icon }) => <article key={title} className="xpex-card">
            <div className="flex items-center justify-between"><span className="xpex-badge">Em breve</span><Icon size={22} className="text-cyan-400"/></div>
            <h3 className="mt-4 text-xl font-black">{title}</h3><p>{description}</p>
          </article>)}</div>
        </section>

        <div className="xpex-card mt-8 flex flex-col gap-4 border border-cyan-400/20 md:flex-row md:items-center md:justify-between">
          <div><p className="xpex-label">GX + trilhas</p><h2 className="text-xl font-black">Use o GX para construir seu plano de estudos</h2><p>Peça uma sequência de estudo com base no curso liberado e nas atividades que você ainda não concluiu.</p></div>
          <Link href="/xpex/ai-lab" className="xpex-primary"><Bot size={18}/> Abrir GX</Link>
        </div>
      </section>
    </XpexAuthenticatedShell>
  )
}
