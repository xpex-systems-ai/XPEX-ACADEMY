import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  FolderKanban,
  LibraryBig,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'

const projectTemplates = [
  {
    title: 'Engenharia de Prompts — Assistente especialista',
    level: 'Fundamentos',
    icon: Sparkles,
    objective: 'Defina um problema, crie uma biblioteca de prompts, compare respostas e registre critérios de qualidade.',
    evidence: ['brief do problema', 'versões de prompt', 'critérios de avaliação', 'reflexão final'],
    gxPrompt: 'GX, atue como mentor de engenharia de prompts. Ajude-me a definir o problema, criar três estratégias de prompt, uma rubrica de avaliação e um plano de iteração. Não invente resultados: peça evidências do que eu testar.',
  },
  {
    title: 'RAG — Base de conhecimento confiável',
    level: 'Intermediário',
    icon: BrainCircuit,
    objective: 'Organize fontes autorizadas, formule perguntas de teste e avalie se as respostas permanecem fundamentadas no material.',
    evidence: ['fontes selecionadas', 'perguntas de teste', 'respostas com referência', 'análise de falhas'],
    gxPrompt: 'GX, oriente um projeto de RAG usando somente materiais autorizados. Ajude-me a estruturar fontes, perguntas de teste, critérios de groundedness e um relatório de falhas e melhorias.',
  },
  {
    title: 'Automação com IA — Fluxo orientado a tarefa',
    level: 'Intermediário',
    icon: Workflow,
    objective: 'Modele uma automação com entrada, decisão, ação, tratamento de erro e critério objetivo de sucesso.',
    evidence: ['mapa do fluxo', 'entradas e saídas', 'casos de erro', 'checklist de validação'],
    gxPrompt: 'GX, seja meu arquiteto de automação. Transforme meu objetivo em um fluxo com entradas, decisões, ações, falhas previsíveis, critérios de sucesso e passos de teste. Separe o que é desenho do que já foi realmente executado.',
  },
  {
    title: 'Projeto final — Solução de IA demonstrável',
    level: 'Avançado',
    icon: FolderKanban,
    objective: 'Consolide problema, arquitetura, protótipo, evidências e apresentação em um projeto que possa ser revisado e demonstrado.',
    evidence: ['problema e usuário', 'arquitetura', 'protótipo ou demonstração', 'evidências e próximos passos'],
    gxPrompt: 'GX, conduza meu projeto final de IA como um mentor técnico. Comece validando problema, usuário e restrições; depois proponha arquitetura, milestones, evidências obrigatórias e critérios para considerar o projeto demonstrável.',
  },
] as const

export default async function XpexAiLabProjectsPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/ai-lab/projects')
  if (!learning) return <XpexStudentDenied />

  const orgBase = `/orgs/${learning.organization.slug}`
  const courses = learning.data.courses
  const totalLessons = courses.reduce((sum, course) => sum + (course.total_lessons || 0), 0)
  const completedLessons = courses.reduce((sum, course) => sum + (course.completed_lessons || 0), 0)
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <XpexAuthenticatedShell
      role="aluno"
      allowedRoles={['aluno']}
      displayName={learning.displayName}
      organizationSlug={learning.organization.slug}
    >
      <section className="xpex-native-page">
        <header>
          <p className="xpex-label">LAB-002 · Projetos com evidência</p>
          <h1>Workspace de Projetos GX</h1>
          <p>Transforme aprendizado em entregas reais usando o GX como mentor e Boards + Library do LearnHouse como infraestrutura de organização e evidência.</p>
        </header>

        <section className="xpex-card mt-5 overflow-hidden border border-orange-500/25 bg-[radial-gradient(circle_at_85%_0%,rgba(0,180,255,0.20),transparent_32%),radial-gradient(circle_at_10%_10%,rgba(255,106,0,0.18),transparent_38%),#07111d]">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-orange-400"><FolderKanban size={16}/> Project OS sobre LearnHouse</span>
              <h2 className="mt-4 text-4xl font-black md:text-5xl">Do curso para um projeto demonstrável.</h2>
              <p className="mt-4 max-w-3xl text-slate-300">Escolha um template, peça orientação ao GX, organize tarefas e decisões em Boards e mantenha fontes e materiais na Library. A XPeX não inventa conclusão de projeto: a evidência continua sendo produzida por você.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`${orgBase}/boards`} className="xpex-primary"><FolderKanban size={17}/> Abrir Boards</Link>
                <Link href={`${orgBase}/library`} className="xpex-secondary"><LibraryBig size={17}/> Abrir Library</Link>
                <Link href="/xpex/ai-lab#gx-copilot" className="xpex-secondary"><Bot size={17}/> Abrir GX</Link>
              </div>
            </div>
            <div className="rounded-3xl border border-cyan-400/20 bg-black/20 p-6">
              <p className="xpex-label">Contexto real do aluno</p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div><span className="text-xs uppercase tracking-widest text-slate-500">Cursos liberados</span><strong className="mt-1 block text-3xl">{courses.length}</strong></div>
                <div><span className="text-xs uppercase tracking-widest text-slate-500">Evolução</span><strong className="mt-1 block text-3xl">{progress}%</strong></div>
                <div><span className="text-xs uppercase tracking-widest text-slate-500">Aulas</span><strong className="mt-1 block text-3xl">{totalLessons}</strong></div>
                <div><span className="text-xs uppercase tracking-widest text-slate-500">Concluídas</span><strong className="mt-1 block text-3xl">{completedLessons}</strong></div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="project-templates-title">
          <p className="xpex-label">Templates profissionais</p>
          <h2 id="project-templates-title" className="mt-1 text-3xl font-black">Escolha um desafio e produza evidência</h2>
          <p className="mt-2 max-w-4xl text-slate-400">Os templates são estruturas de trabalho, não projetos falsamente concluídos. Use-os para guiar a execução dentro das capacidades reais já existentes no fork.</p>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {projectTemplates.map(({ title, level, icon: Icon, objective, evidence, gxPrompt }) => (
              <article key={title} className="xpex-card flex flex-col border border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <span className="xpex-badge">{level}</span>
                  <Icon className="text-cyan-400" size={25}/>
                </div>
                <h3 className="mt-4 text-2xl font-black">{title}</h3>
                <p className="mt-3 text-slate-300">{objective}</p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">Evidências esperadas</p>
                  <ul className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                    {evidence.map(item => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-cyan-400" size={15}/><span>{item}</span></li>)}
                  </ul>
                </div>

                <div className="mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-orange-400"><Bot size={15}/> Prompt de mentoria GX</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{gxPrompt}</p>
                </div>

                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <Link href="/xpex/ai-lab#gx-copilot" className="xpex-primary"><Bot size={16}/> Trabalhar com GX</Link>
                  <Link href={`${orgBase}/boards`} className="xpex-secondary">Planejar no Board <ArrowRight size={15}/></Link>
                  <Link href={`${orgBase}/library`} className="xpex-secondary">Guardar fontes <ArrowRight size={15}/></Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-5 xl:grid-cols-3">
          <article className="xpex-card"><FolderKanban className="text-cyan-400"/><h2 className="mt-3 text-xl font-black">1. Planeje no Board</h2><p className="mt-2 text-slate-400">Quebre o projeto em problema, pesquisa, construção, teste e entrega. O Board continua sob as regras de autenticação do LearnHouse.</p></article>
          <article className="xpex-card"><LibraryBig className="text-cyan-400"/><h2 className="mt-3 text-xl font-black">2. Organize fontes</h2><p className="mt-2 text-slate-400">Use a Library para materiais, referências e artefatos permitidos. Não há progresso inventado a partir de arquivos externos.</p></article>
          <article className="xpex-card"><Bot className="text-cyan-400"/><h2 className="mt-3 text-xl font-black">3. Revise com GX</h2><p className="mt-2 text-slate-400">Peça ao GX para criticar decisões, propor testes e identificar lacunas, mantendo clara a diferença entre sugestão e evidência executada.</p></article>
        </section>

        <section className="xpex-card mt-10 border border-cyan-400/20">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="xpex-label">Governança do laboratório</p>
              <h2 className="mt-1 text-2xl font-black">Aprender, construir e provar.</h2>
              <p className="mt-2 max-w-3xl text-slate-400">Boards e Library são infraestrutura real do fork; GX é mentor e copiloto. Execução isolada de código, modelos e datasets privados continua fora deste bloco até existir sandbox, quota, autorização e observabilidade adequados.</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/5 px-4 py-2 text-sm font-black text-emerald-300"><ShieldCheck size={17}/> Sem bypass de ACL</span>
          </div>
        </section>
      </section>
    </XpexAuthenticatedShell>
  )
}
