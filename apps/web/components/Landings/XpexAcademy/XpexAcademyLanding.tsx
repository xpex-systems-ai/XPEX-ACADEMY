import Link from 'next/link'
import { ArrowRight, Bot, BookOpen, CheckCircle2, GraduationCap, Layers3, Sparkles, Users } from 'lucide-react'
import { XPEX_BRAND } from '@/lib/xpex-brand'
import '../../Xpex/xpex.css'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00D4FF]'

const pillars = [
  { icon: BookOpen, title: 'Aprendizagem guiada', description: 'Cursos estruturados, atividades práticas e progresso real em uma jornada contínua.' },
  { icon: Bot, title: 'GX integrado', description: 'Assistente de IA conectado ao ambiente de aprendizagem para apoiar estudo, revisão e prática.' },
  { icon: Layers3, title: 'Projetos e evolução', description: 'Conteúdo orientado à construção de habilidades aplicáveis, do fundamento ao projeto final.' },
  { icon: Users, title: 'Comunidade e acompanhamento', description: 'Uma experiência preparada para colaboração, acompanhamento pedagógico e crescimento coletivo.' },
]

const journey = [
  ['01', 'Aprenda', 'Comece por fundamentos claros e avance por uma trilha estruturada.'],
  ['02', 'Pratique', 'Execute atividades e transforme conteúdo em experiência.'],
  ['03', 'Construa', 'Desenvolva projetos que consolidem o aprendizado.'],
  ['04', 'Evolua', 'Acompanhe seu progresso e continue a jornada no seu ritmo.'],
]

export function XpexAcademyLanding() {
  return (
    <div className="xpex-root min-h-screen overflow-hidden bg-[#05080D] text-white selection:bg-[#00D4FF] selection:text-[#05080D]">
      <div className="pointer-events-none fixed inset-0 opacity-90" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_4%,rgba(255,106,0,0.20),transparent_30%),radial-gradient(circle_at_84%_12%,rgba(8,124,255,0.20),transparent_30%),linear-gradient(145deg,#05080D_0%,#08111E_52%,#05080D_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-[#05080D]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8" aria-label="Navegação pública XpeX Academy">
          <Link href="/" className={`flex w-fit items-center gap-3 rounded-full ${focusRing}`}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#FF7A00]/35 bg-[#FF7A00]/10 text-lg font-black text-[#FF9B3D] shadow-[0_0_30px_rgba(255,106,0,0.18)]">XP</span>
            <span><span className="block text-sm font-black tracking-[0.22em]">{XPEX_BRAND.name}</span><span className="block text-xs text-[#B8C4D6]">{XPEX_BRAND.slogan}</span></span>
          </Link>
          <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-[#B8C4D6]">
            <a href="#academy" className={`hover:text-[#00D4FF] ${focusRing}`}>Academy</a>
            <a href="#metodologia" className={`hover:text-[#00D4FF] ${focusRing}`}>Metodologia</a>
            <a href="#curso" className={`hover:text-[#00D4FF] ${focusRing}`}>Curso</a>
          </div>
          <Link href="/login?next=%2Fxpex%2Faluno" className={`rounded-full bg-[#FF7A00] px-5 py-3 text-sm font-black text-white shadow-[0_0_28px_rgba(255,106,0,0.24)] transition hover:-translate-y-0.5 hover:bg-[#FF8A2A] ${focusRing}`}>Entrar na Academy</Link>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:px-8 lg:grid-cols-[1.08fr_.92fr] lg:py-28">
          <div className="flex flex-col justify-center">
            <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#FF7A00]/30 bg-[#FF7A00]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#FF9B3D]"><Sparkles size={15} /> XpeX Academy</p>
            <h1 className="max-w-4xl text-5xl font-black tracking-[-0.055em] md:text-7xl">Aprenda inteligência artificial. <span className="text-[#00D4FF]">Construa o seu futuro.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#B8C4D6] md:text-xl">Uma plataforma de aprendizagem prática para estudar, experimentar, construir projetos e evoluir com apoio de inteligência artificial.</p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link href="/login?next=%2Fxpex%2Faluno" className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#FF7A00] px-6 py-4 text-sm font-black shadow-[0_0_35px_rgba(255,106,0,0.28)] transition hover:-translate-y-0.5 hover:bg-[#FF8A2A] ${focusRing}`}>Começar agora <ArrowRight size={18} /></Link>
              <a href="#curso" className={`inline-flex items-center justify-center rounded-full border border-[#00D4FF]/30 bg-white/5 px-6 py-4 text-sm font-bold text-[#00D4FF] backdrop-blur transition hover:bg-[#00D4FF]/10 ${focusRing}`}>Conhecer o primeiro curso</a>
            </div>
            <div className="mt-7 flex flex-wrap gap-3 text-sm text-[#B8C4D6]">{['curso publicado', 'progresso persistente', 'atividades reais', 'GX integrado'].map(item => <span key={item} className="rounded-full border border-white/10 bg-[#101A2B]/75 px-3 py-2">{item}</span>)}</div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#101A2B]/85 p-5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[1.5rem] border border-[#00D4FF]/15 bg-[#07101C] p-6">
              <p className="text-xs font-black uppercase tracking-[.22em] text-[#00D4FF]">Jornada do aluno</p>
              <h2 className="mt-3 text-2xl font-black">Do primeiro acesso ao projeto final</h2>
              <div className="mt-7 space-y-4">
                {['Fundamentos e LLMs', 'Prompt Engineering e produtividade', 'Automação, APIs e RAG', 'Agentes, projetos e aplicação real'].map((item, index) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="mb-2 flex items-center justify-between gap-4 text-sm"><span className="font-bold">{item}</span><span className="text-[#00D4FF]">Etapa {index + 1}</span></div><div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#00D4FF]" style={{ width: `${34 + index * 18}%` }} /></div></div>)}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">{['Aluno', 'GX', 'Cursos', 'Atividades'].map(item => <div key={item} className="rounded-2xl border border-white/10 bg-[#142238]/70 p-4 text-sm font-bold">{item}</div>)}</div>
            </div>
          </div>
        </section>

        <section id="academy" className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <p className="text-xs font-black uppercase tracking-[.24em] text-[#00D4FF]">Ecossistema de aprendizagem</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black md:text-5xl">Tudo conectado em uma única experiência.</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#B8C4D6]">A XpeX Academy integra conteúdo, atividades, progresso, laboratório de IA e experiências de comunidade em uma jornada única.</p>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{pillars.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-3xl border border-white/10 bg-[#101A2B]/85 p-6"><Icon className="text-[#00D4FF]" size={28} /><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-3 leading-7 text-[#B8C4D6]">{description}</p></article>)}</div>
        </section>

        <section id="curso" className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <div className="rounded-[2rem] border border-[#FF7A00]/25 bg-gradient-to-br from-[#FF7A00]/10 via-[#101A2B]/90 to-[#087CFF]/10 p-8 md:p-12">
            <p className="text-xs font-black uppercase tracking-[.24em] text-[#FF9B3D]">Primeiro curso oficial</p>
            <h2 className="mt-4 text-3xl font-black md:text-5xl">Inteligência Artificial — do Básico ao Avançado</h2>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-[#B8C4D6]">Uma formação progressiva que percorre fundamentos de IA, LLMs, Prompt Engineering, produtividade, automação, APIs, RAG, agentes, projetos reais e aplicação profissional.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{['11 módulos', 'atividades práticas', 'progresso persistente', 'projeto final'].map(item => <div key={item} className="rounded-2xl border border-white/10 bg-[#07101C]/75 p-5 font-bold"><CheckCircle2 className="mb-4 text-[#00D4FF]" />{item}</div>)}</div>
            <Link href="/login?next=%2Fxpex%2Faluno" className={`mt-8 inline-flex items-center gap-2 rounded-full bg-[#FF7A00] px-6 py-4 text-sm font-black hover:bg-[#FF8A2A] ${focusRing}`}>Entrar e estudar <ArrowRight size={18} /></Link>
          </div>
        </section>

        <section id="metodologia" className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <p className="text-xs font-black uppercase tracking-[.24em] text-[#00D4FF]">Metodologia XpeX</p>
          <h2 className="mt-4 text-3xl font-black md:text-5xl">Aprenda. Pratique. Construa. Evolua.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{journey.map(([number, title, description]) => <article key={title} className="rounded-3xl border border-white/10 bg-[#142238]/70 p-6"><span className="text-sm font-black text-[#FF9B3D]">{number}</span><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-[#B8C4D6]">{description}</p></article>)}</div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-20 text-center md:px-8">
          <div className="rounded-[2rem] border border-[#FF7A00]/25 bg-[#101A2B]/90 p-8 shadow-[0_0_70px_rgba(255,106,0,0.10)] md:p-12">
            <GraduationCap className="mx-auto text-[#00D4FF]" size={36} />
            <h2 className="mt-5 text-3xl font-black md:text-5xl">Seu próximo passo começa aqui.</h2>
            <p className="mx-auto mt-5 max-w-2xl leading-8 text-[#B8C4D6]">Entre na XpeX Academy, acesse seu curso e continue aprendendo com uma experiência criada para prática e evolução contínua.</p>
            <Link href="/login?next=%2Fxpex%2Faluno" className={`mt-8 inline-flex items-center gap-2 rounded-full bg-[#FF7A00] px-7 py-4 text-sm font-black hover:bg-[#FF8A2A] ${focusRing}`}>Entrar na Academy <ArrowRight size={18} /></Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-5 py-8 text-center text-sm text-[#7F8A99]">© 2026 XpeX Academy • {XPEX_BRAND.slogan}</footer>
    </div>
  )
}
