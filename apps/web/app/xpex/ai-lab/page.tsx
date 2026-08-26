import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Database,
  FolderKanban,
  LibraryBig,
  Network,
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

const labModules = [
  {
    title: 'Prompt Engineering',
    description: 'Use o GX para transformar objetivos em prompts claros, testar variações e revisar resultados.',
    icon: Sparkles,
    href: '#gx-copilot',
    action: 'Praticar com GX',
    status: 'Disponível',
  },
  {
    title: 'Agentes e Automação',
    description: 'Conecte o conteúdo do curso a fluxos, integrações e agentes orientados a tarefas.',
    icon: Workflow,
    href: '/xpex/activities',
    action: 'Abrir atividades',
    status: 'Conteúdo XPeX',
  },
  {
    title: 'RAG e conhecimento privado',
    description: 'Estude recuperação de contexto usando o Copilot/RAG nativo do fork LearnHouse.',
    icon: BrainCircuit,
    href: '#gx-copilot',
    action: 'Abrir bancada RAG',
    status: 'Core LearnHouse',
  },
  {
    title: 'Projetos colaborativos',
    description: 'Estruture projetos com templates XPeX e use Boards + Library nativos como infraestrutura real de trabalho e evidência.',
    icon: FolderKanban,
    href: '/xpex/ai-lab/projects',
    action: 'Abrir workspace',
    status: 'LAB-002',
  },
  {
    title: 'Biblioteca de recursos',
    description: 'Centralize referências e materiais usando a Library nativa da organização.',
    icon: LibraryBig,
    href: 'library',
    action: 'Abrir Library',
    status: 'Core LearnHouse',
    orgRoute: true,
  },
  {
    title: 'Trilhas profissionais',
    description: 'Combine o curso XPeX com academias oficiais e escolha a próxima direção com o GX.',
    icon: Route,
    href: '/xpex/trails',
    action: 'Explorar trilhas',
    status: 'XPeX + LearnHouse',
  },
  {
    title: 'Comunidade',
    description: 'Leve dúvidas, projetos e aprendizados para a camada comunitária da Academy.',
    icon: Users,
    href: '/xpex/community',
    action: 'Abrir comunidade',
    status: 'Core LearnHouse',
  },
  {
    title: 'Modelos, APIs e sandboxes',
    description: 'Área reservada para futuras execuções isoladas de código, modelos e APIs com quota e observabilidade.',
    icon: TerminalSquare,
    href: null,
    action: 'Em preparação',
    status: 'Roadmap seguro',
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

  return (
    <XpexAuthenticatedShell
      role="aluno"
      allowedRoles={['aluno']}
      displayName={learning.displayName}
      organizationSlug={learning.organization.slug}
    >
      <section className="xpex-native-page">
        <header>
          <p className="xpex-label">Laboratório profissional de inteligência artificial</p>
          <h1>Laboratório de I.A. GX</h1>
          <p>Aprenda, experimente e construa usando o núcleo LearnHouse que sustenta a XPeX — com dados reais, autorização real e IA integrada ao conteúdo.</p>
        </header>

        <section className="xpex-card mt-5 overflow-hidden border border-orange-500/25 bg-[radial-gradient(circle_at_75%_10%,rgba(0,139,255,0.22),transparent_30%),radial-gradient(circle_at_10%_10%,rgba(255,106,0,0.18),transparent_36%),#07111d]">
          <div className="grid gap-7 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-orange-400"><Bot size={16}/> Núcleo GX + LearnHouse</span>
              <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-5xl">O futuro da IA começa com prática real.</h2>
              <p className="mt-4 max-w-2xl text-slate-300">Use o GX como tutor, conecte a prática aos seus cursos, organize projetos no domínio nativo do LearnHouse e avance por trilhas profissionais sem criar um segundo LMS dentro da Academy.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#gx-copilot" className="xpex-primary"><Bot size={18}/> Entrar no laboratório</a>
                <Link href="/xpex/ai-lab/projects" className="xpex-secondary"><FolderKanban size={17}/> Projetos GX</Link>
                <Link href="/xpex/trails" className="xpex-secondary">Explorar trilhas <ArrowRight size={17}/></Link>
              </div>
            </div>
            <div className="rounded-3xl border border-cyan-400/20 bg-black/20 p-6">
              <p className="xpex-label">Arquitetura operacional</p>
              <div className="mt-5 space-y-4 text-sm text-slate-300">
                <div className="flex gap-3"><Network className="mt-0.5 shrink-0 text-cyan-400" size={20}/><div><strong className="text-white">GX / Copilot / RAG</strong><p>Assistente nativo do fork para conversar sobre cursos e recuperar contexto autorizado.</p></div></div>
                <div className="flex gap-3"><Database className="mt-0.5 shrink-0 text-cyan-400" size={20}/><div><strong className="text-white">Course + Trail + TrailRun</strong><p>Cursos, matrícula, atividades e progresso continuam como fonte de verdade.</p></div></div>
                <div className="flex gap-3"><FolderKanban className="mt-0.5 shrink-0 text-cyan-400" size={20}/><div><strong className="text-white">Boards + Library</strong><p>Projetos e recursos reutilizam capacidades existentes do LearnHouse.</p></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores reais do laboratório">
          <article className="xpex-card"><span className="xpex-badge">Cursos ativos</span><h2 className="mt-3 text-3xl font-black">{activeCourses}</h2><p>Derivados das matrículas e cursos autorizados.</p></article>
          <article className="xpex-card"><span className="xpex-badge">Aulas disponíveis</span><h2 className="mt-3 text-3xl font-black">{totalLessons}</h2><p>Atividades publicadas e acessíveis para sua conta.</p></article>
          <article className="xpex-card"><span className="xpex-badge">Aulas concluídas</span><h2 className="mt-3 text-3xl font-black">{completedLessons}</h2><p>Conclusões persistidas no progresso real.</p></article>
          <article className="xpex-card"><span className="xpex-badge">Evolução</span><h2 className="mt-3 text-3xl font-black">{progress}%</h2><p>Progresso agregado dos cursos liberados.</p></article>
        </section>

        <section className="mt-10" aria-labelledby="lab-modules-title">
          <div className="mb-5">
            <p className="xpex-label">Módulos do laboratório</p>
            <h2 id="lab-modules-title" className="text-3xl font-black">Construa usando o que já existe no fork</h2>
            <p className="mt-2 max-w-4xl text-slate-400">Cada módulo abaixo aponta para uma capacidade real da XPeX/LearnHouse. O que ainda exige sandbox, quota ou execução isolada aparece explicitamente como roadmap.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {labModules.map(({ title, description, icon: Icon, href, action, status, ...module }) => {
              const destination = href && 'orgRoute' in module && module.orgRoute ? `${orgBase}/${href}` : href
              return <article key={title} className="xpex-card flex min-h-[255px] flex-col">
                <div className="flex items-start justify-between gap-3"><span className="xpex-badge">{status}</span><Icon className="text-cyan-400" size={24}/></div>
                <h3 className="mt-4 text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm text-slate-300">{description}</p>
                {destination ? <Link className="mt-auto pt-5 text-sm font-black text-orange-400" href={destination}>{action} <ArrowRight className="inline" size={15}/></Link> : <span className="mt-auto pt-5 text-sm font-black text-slate-500">{action}</span>}
              </article>
            })}
          </div>
        </section>

        <section className="mt-10 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <article className="xpex-card border border-cyan-400/20">
            <p className="xpex-label">Fluxo profissional</p>
            <h2 className="mt-2 text-2xl font-black">Aprenda → pratique → construa → registre evidência</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ['1', 'Aprenda', 'Use cursos e trilhas autorizados como base técnica.'],
                ['2', 'Pratique', 'Abra o GX e trabalhe sobre atividades reais do curso.'],
                ['3', 'Construa', 'Use o Workspace de Projetos GX com Boards e recursos da Library.'],
                ['4', 'Evolua', 'Volte ao curso, conclua atividades e mantenha o progresso persistido.'],
              ].map(([step, title, copy]) => <div key={step} className="rounded-2xl border border-white/10 bg-black/15 p-4"><span className="text-xs font-black text-orange-400">0{step}</span><h3 className="mt-1 font-black">{title}</h3><p className="mt-1 text-sm text-slate-400">{copy}</p></div>)}
            </div>
          </article>
          <article className="xpex-card border border-orange-500/20">
            <p className="xpex-label">Regra de engenharia</p>
            <h2 className="mt-2 text-2xl font-black">Sem laboratório fictício.</h2>
            <p className="mt-3 text-slate-300">Notebooks, datasets privados, execução de código, modelos e APIs só serão marcados como ativos quando existirem isolamento, persistência, autorização, quota e observabilidade reais.</p>
            <Link href="/xpex/ai-lab/projects" className="xpex-secondary mt-5">Abrir projetos reais <ArrowRight size={16}/></Link>
          </article>
        </section>

        <section id="gx-copilot" className="mt-10 scroll-mt-24" aria-labelledby="gx-copilot-title">
          <div className="mb-4">
            <p className="xpex-label">Bancada central</p>
            <h2 id="gx-copilot-title" className="text-3xl font-black">GX Course Copilot</h2>
            <p className="mt-2 max-w-4xl text-slate-400">Este é o Copilot/RAG real do LearnHouse, reaproveitado pela XPeX. Use-o para explicar conteúdo, revisar conceitos, montar planos de estudo e apoiar projetos dentro do contexto autorizado.</p>
          </div>
          <div className="xpex-card overflow-hidden p-0">
            <Copilot orgslug={learning.organization.slug} />
          </div>
        </section>
      </section>
    </XpexAuthenticatedShell>
  )
}
