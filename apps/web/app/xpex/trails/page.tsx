import Link from 'next/link'
import { ArrowRight, Bot, BrainCircuit, CheckCircle2, Cloud, Code2, ExternalLink, Layers3, Route, Sparkles, Target, Workflow } from 'lucide-react'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getGxTrailRecommendations, xpexExternalLearningProviders } from '@/lib/xpex/external-learning-providers'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'

const futureTracks = [
  { title: 'IA Generativa e LLMs', icon: BrainCircuit, description: 'Da base conceitual a aplicações com modelos generativos, prompts e avaliação.' },
  { title: 'Agentes e Automação', icon: Workflow, description: 'Fluxos, ferramentas, integrações e agentes orientados a objetivos.' },
  { title: 'Cloud para IA', icon: Cloud, description: 'Fundamentos de infraestrutura, APIs e serviços para aplicações inteligentes.' },
  { title: 'Engenharia com IA', icon: Code2, description: 'Desenvolvimento assistido, APIs, RAG e construção de produtos com IA.' },
  { title: 'Produtividade com IA', icon: Layers3, description: 'Ferramentas e processos para pesquisa, criação, organização e execução.' },
] as const

const stageCopy = {
  fundamentos: 'Fundamentos e domínio da base',
  construcao: 'Construção prática e projetos',
  escala: 'Escala, carreira e especialização',
} as const

export default async function TrailsPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/trails')
  if (!learning) return <XpexStudentDenied />

  const activeCourses = learning.data.courses
  const totalLessons = activeCourses.reduce((sum, course) => sum + (course.total_lessons || 0), 0)
  const completedLessons = activeCourses.reduce((sum, course) => sum + (course.completed_lessons || 0), 0)
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  const gxRecommendations = getGxTrailRecommendations(overallProgress)
  const gxStage = overallProgress < 25 ? 'fundamentos' : overallProgress < 70 ? 'construcao' : 'escala'

  return (
    <XpexAuthenticatedShell role="aluno" allowedRoles={['aluno']} displayName={learning.displayName} organizationSlug={learning.organization.slug}>
      <section className="xpex-native-page">
        <header>
          <p className="xpex-label">Jornadas de evolução</p>
          <h1>Trilhas XPeX</h1>
          <p>Seu mapa profissional de aprendizagem. Combine progresso XPeX com academias oficiais do mercado sem misturar métricas ou certificados externos.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="xpex-card"><span className="xpex-badge">Trilhas ativas</span><h2 className="mt-3 text-3xl font-black">{activeCourses.length}</h2><p>Jornadas com curso publicado e matrícula ativa.</p></article>
          <article className="xpex-card"><span className="xpex-badge">Aulas concluídas</span><h2 className="mt-3 text-3xl font-black">{completedLessons}</h2><p>Conclusões registradas no seu progresso real.</p></article>
          <article className="xpex-card"><span className="xpex-badge">Aulas disponíveis</span><h2 className="mt-3 text-3xl font-black">{totalLessons}</h2><p>Atividades publicadas nos cursos liberados para você.</p></article>
        </div>

        <div className="xpex-card mt-6 overflow-hidden border border-orange-500/25 bg-[radial-gradient(circle_at_75%_10%,rgba(8,124,255,0.18),transparent_28%),radial-gradient(circle_at_20%_20%,rgba(255,106,0,0.18),transparent_34%),#081321]">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-orange-400"><Sparkles size={15}/> Painel profissional de trilhas</span>
            <h2 className="mt-4 text-3xl font-black md:text-5xl">Escolha sua direção. Evolua com evidência.</h2>
            <p className="mt-4 max-w-2xl text-slate-300">A XPeX organiza sua formação em uma jornada única: cursos próprios com progresso real e portas de entrada para academias oficiais de tecnologia, IA, cloud, produtividade e criação.</p>
          </div>
        </div>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4"><div><p className="xpex-label">Em andamento</p><h2 className="text-2xl font-black">Suas trilhas XPeX</h2></div><Link href="/xpex/courses" className="text-sm font-bold text-cyan-400">Ver cursos</Link></div>
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

        <section className="mt-10" aria-labelledby="gx-recommendations-title">
          <div className="xpex-card overflow-hidden border border-cyan-400/25 bg-[radial-gradient(circle_at_0%_0%,rgba(0,190,255,0.16),transparent_34%),radial-gradient(circle_at_100%_100%,rgba(255,106,0,0.14),transparent_30%),#0a1422]">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2"><Bot className="text-cyan-400" size={24}/><span className="xpex-badge">GX recomenda</span></div>
                <p className="xpex-label mt-5">Baseado no seu progresso XPeX: {overallProgress}%</p>
                <h2 id="gx-recommendations-title" className="mt-2 text-3xl font-black">Próximo estágio: {stageCopy[gxStage]}</h2>
                <p className="mt-3 text-slate-300">O GX usa seu estágio atual dentro da XPeX para priorizar portas de aprendizagem complementares. A recomendação é um ponto de partida; seu progresso externo continua separado até existir integração autenticada.</p>
                <Link href="/xpex/ai-lab" className="xpex-primary mt-5"><Bot size={18}/> Personalizar com o GX</Link>
              </div>
              <div className="grid w-full gap-3 md:grid-cols-3 xl:max-w-3xl">
                {gxRecommendations.map((provider, index) => <a key={provider.id} href={provider.url} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-cyan-400/5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                      <span role="img" aria-label={provider.logoAlt} className="h-7 w-7 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${provider.logoSrc})` }}/>
                    </span>
                    <span className="text-xs font-black text-orange-300">#{index + 1}</span>
                  </div>
                  <h3 className="mt-4 font-black text-white">{provider.name}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{provider.gxReason}</p>
                </a>)}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="external-learning-title">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="xpex-label">Ecossistema conectado</p>
              <h2 id="external-learning-title" className="text-2xl font-black">Academias oficiais e cursos livres</h2>
              <p className="mt-2 max-w-4xl text-slate-400">Curadoria XPeX de plataformas oficiais. Cada card leva diretamente ao ambiente de aprendizagem do fornecedor.</p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs font-bold text-emerald-300"><CheckCircle2 size={15}/> Links oficiais verificados</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {xpexExternalLearningProviders.map(provider => <article key={provider.id} className="xpex-card group flex min-h-[330px] flex-col overflow-hidden transition hover:-translate-y-1 hover:border-cyan-400/35">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_0_35px_rgba(0,180,255,0.07)]">
                  <span role="img" aria-label={provider.logoAlt} className="h-9 w-9 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${provider.logoSrc})` }}/>
                </span>
                <span className="xpex-badge">Oficial</span>
              </div>
              <h3 className="mt-5 text-xl font-black">{provider.name}</h3>
              <p className="mt-1 text-sm font-bold text-orange-300">{provider.area}</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{provider.description}</p>
              <div className="mt-4 rounded-xl border border-white/5 bg-black/15 p-3 text-xs leading-5 text-slate-400"><p className="font-semibold text-slate-200">{provider.highlight}</p><p className="mt-1">{provider.access}</p><p>{provider.language}</p></div>
              <div className="mt-auto flex gap-2 pt-5">
                <a className="xpex-primary flex-1" href={provider.url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${provider.name} em uma nova aba`}>Explorar <ExternalLink size={16}/></a>
                <Link className="inline-flex items-center justify-center rounded-xl border border-cyan-400/20 px-3 text-cyan-300 transition hover:bg-cyan-400/10" href="/xpex/ai-lab" aria-label={`Pedir ao GX uma recomendação sobre ${provider.name}`}><Target size={17}/></Link>
              </div>
            </article>)}
          </div>
          <div className="xpex-card mt-4 border border-cyan-400/20">
            <p className="text-sm text-slate-300"><strong className="text-white">Modo Trilha Real:</strong> progresso, certificados e conclusões só entram nos indicadores XPeX quando vierem do domínio XPeX ou de uma integração autenticada de provedor. As marcas pertencem aos respectivos titulares e são usadas apenas para identificar as plataformas de destino.</p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4"><p className="xpex-label">Mapa de evolução</p><h2 className="text-2xl font-black">Próximas trilhas XPeX planejadas</h2><p className="mt-2 text-slate-400">Estas categorias mostram a direção do catálogo próprio. Elas não exibem métricas, matrícula ou progresso enquanto não houver conteúdo XPeX real publicado.</p></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{futureTracks.map(({ title, description, icon: Icon }) => <article key={title} className="xpex-card">
            <div className="flex items-center justify-between"><span className="xpex-badge">Em breve</span><Icon size={22} className="text-cyan-400"/></div>
            <h3 className="mt-4 text-xl font-black">{title}</h3><p>{description}</p>
          </article>)}</div>
        </section>

        <div className="xpex-card mt-8 flex flex-col gap-4 border border-cyan-400/20 md:flex-row md:items-center md:justify-between">
          <div><p className="xpex-label">GX + trilhas</p><h2 className="text-xl font-black">Use o GX para construir seu plano de estudos</h2><p>Peça ao GX uma sequência personalizada combinando seu curso XPeX, atividades pendentes e as academias oficiais acima — sempre distinguindo conteúdo interno de conteúdo externo.</p></div>
          <Link href="/xpex/ai-lab" className="xpex-primary"><Bot size={18}/> Abrir GX</Link>
        </div>
      </section>
    </XpexAuthenticatedShell>
  )
}
