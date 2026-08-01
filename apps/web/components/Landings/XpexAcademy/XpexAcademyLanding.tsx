import Link from 'next/link'
import { ArrowRight, Bot, BriefcaseBusiness, CheckCircle2, GraduationCap, Layers3, Sparkles } from 'lucide-react'
import { XPEX_BRAND, xpexFaq, xpexHowItWorks, xpexStrategicModules } from '@/lib/xpex-brand'

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-50 md:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-8 text-slate-300 md:text-lg">{description}</p>
    </div>
  )
}

export function XpexAcademyLanding() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#020617] text-slate-50 selection:bg-cyan-300 selection:text-slate-950">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-full focus:bg-yellow-300 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-slate-950">Pular para o conteúdo</a>
      <div className="pointer-events-none fixed inset-0 opacity-70" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.25),transparent_28%),radial-gradient(circle_at_75%_10%,rgba(250,204,21,0.16),transparent_24%),linear-gradient(135deg,#020617_0%,#071B33_48%,#020617_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-slate-950/35 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8" aria-label="Navegação pública XpeX Academy">
          <Link href="/" className="group flex items-center gap-3 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-slate-950">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-lg font-black text-cyan-200 shadow-[0_0_30px_rgba(56,189,248,0.25)]">XP</span>
            <span>
              <span className="block text-sm font-black tracking-[0.22em] text-white">{XPEX_BRAND.name}</span>
              <span className="block text-xs text-slate-400">{XPEX_BRAND.slogan}</span>
            </span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
            <a href="#modulos" className="hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-yellow-300">Módulos</a>
            <a href="#como-funciona" className="hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-yellow-300">Como funciona</a>
            <a href="#faq" className="hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-yellow-300">FAQ</a>
          </div>
          <div className="flex items-center gap-2"><Link href="/beta/aluno" className="hidden rounded-full bg-yellow-300 px-4 py-2 text-sm font-black text-slate-950 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-cyan-300 sm:block">Explorar beta</Link><Link href="/login" className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white hover:border-cyan-300 hover:bg-cyan-300/10 focus:outline-none focus:ring-2 focus:ring-yellow-300">Login</Link></div>
        </nav>
      </header>

      <main id="conteudo" className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div className="flex flex-col justify-center">
            <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-200"><Sparkles size={15} /> {XPEX_BRAND.positioning}</p>
            <h1 className="max-w-4xl text-5xl font-black tracking-[-0.05em] text-white md:text-7xl">XpeX Academy</h1>
            <p className="mt-6 max-w-2xl text-2xl font-semibold leading-snug text-slate-100 md:text-3xl">Aprenda habilidades reais, pratique com projetos, construa seu portfólio e evolua com orientação inteligente.</p>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">A XpeX Academy organiza cursos, trilhas, ferramentas, projetos, certificados, comunidade e oportunidades profissionais em um único ecossistema de aprendizagem.</p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <a href="#lista-espera" className="inline-flex items-center justify-center gap-2 rounded-full bg-yellow-300 px-6 py-4 text-sm font-black text-slate-950 shadow-[0_0_35px_rgba(250,204,21,0.35)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950">Entrar na lista de espera <ArrowRight size={18} /></a>
              <a href="#modulos" className="inline-flex items-center justify-center rounded-full border border-cyan-300/30 bg-white/5 px-6 py-4 text-sm font-bold text-cyan-100 backdrop-blur transition hover:bg-cyan-300/10 focus:outline-none focus:ring-2 focus:ring-yellow-300">Conhecer o ecossistema</a>
            </div>
            <p className="mt-6 text-sm text-slate-400">Base técnica construída sobre tecnologia open-source e preparada para evolução modular.</p>
          </div>

          <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[1.5rem] border border-cyan-300/20 bg-slate-950/70 p-5">
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Dashboard preview</p><p className="font-bold text-white">Evolução profissional</p></div>
                <span className="rounded-full bg-green-400/15 px-3 py-1 text-xs font-bold text-green-300">Roadmap ativo</span>
              </div>
              <div className="space-y-4">
                {[['Trilhas com projetos', '86%'], ['Portfólio de evidências', '64%'], ['Ferramentas e curadoria', '72%']].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="text-cyan-200">{value}</span></div>
                    <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-yellow-300" style={{ width: value }} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {['IA planejada', 'Comunidade', 'Certificados', 'Jobs Hub'].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-[#071B33]/70 p-4 text-sm font-semibold text-slate-200">{item}</div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {['Aprendizagem orientada por competências.', 'Prática com projetos reais.', 'Portfólio como prova de evolução.'].map((item) => <div key={item} className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-lg font-bold text-white backdrop-blur"><CheckCircle2 className="mb-4 text-yellow-300" />{item}</div>)}
          </div>
        </section>

        <section id="modulos" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
          <SectionHeader eyebrow="Ecossistema estratégico" title="Do aprendizado à oportunidade profissional" description="Módulos apresentados como visão de produto e roadmap evolutivo, sem integrações reais com terceiros nesta fase." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {xpexStrategicModules.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/35"><Icon className="mb-5 text-cyan-200" size={28} aria-hidden="true" /><h3 className="text-xl font-black text-white">{title}</h3><p className="mt-3 leading-7 text-slate-300">{description}</p></article>)}
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
          <SectionHeader eyebrow="Jornada do aluno" title="Aprenda. Pratique. Construa. Evolua." description="A experiência pública comunica uma jornada simples, progressiva e orientada por resultados práticos." />
          <div className="mt-12 grid gap-5 lg:grid-cols-5">
            {xpexHowItWorks.map((step) => <article key={step.step} className="rounded-3xl border border-white/10 bg-[#071B33]/70 p-6"><span className="text-3xl font-black text-yellow-300">{step.step}</span><h3 className="mt-5 text-lg font-black text-white">{step.title}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{step.description}</p></article>)}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-5 py-16 md:px-8 lg:grid-cols-3">
          {[{ icon: Layers3, title: 'Global Skills Hub', text: 'Organiza habilidades, plataformas, trilhas e ferramentas para reduzir ruído e criar direção.' }, { icon: Bot, title: 'Professor IA', text: 'Módulo planejado para orientação de estudos, recomendações e revisão de projetos em fase futura.' }, { icon: BriefcaseBusiness, title: 'Jobs & Freelance Hub', text: 'Visão de conexão entre projetos, portfólio e oportunidades profissionais, sem integração real nesta fase.' }].map(({ icon: Icon, title, text }) => <article key={title} className="rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-7 backdrop-blur"><Icon className="text-yellow-300" size={34} /><h2 className="mt-6 text-2xl font-black text-white">{title}</h2><p className="mt-4 leading-7 text-slate-300">{text}</p></article>)}
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 backdrop-blur md:p-12">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div><GraduationCap className="text-cyan-200" size={42} /><h2 className="mt-5 text-3xl font-black text-white md:text-4xl">Portfólio, certificados, Blog, XpeX TV e Comunidade</h2><p className="mt-5 leading-8 text-slate-300">A landing apresenta a visão integrada de evidências práticas, mídia educacional e colaboração como extensão natural da aprendizagem.</p></div>
              <div className="grid gap-3 sm:grid-cols-2">{['Certificados por competência', 'Projetos e estudos de caso', 'Tutoriais e demonstrações', 'Networking e desafios'].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/45 p-5 font-bold text-slate-100">{item}</div>)}</div>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-5 py-20 md:px-8">
          <SectionHeader eyebrow="Transparência" title="Perguntas frequentes" description="Mensagens públicas sem promessa de parceria oficial, certificação externa ou integração técnica ainda inexistente." />
          <div className="mt-10 space-y-4">{xpexFaq.map((item) => <details key={item.question} className="group rounded-2xl border border-white/10 bg-white/[0.05] p-6"><summary className="cursor-pointer text-lg font-black text-white focus:outline-none focus:ring-2 focus:ring-yellow-300">{item.question}</summary><p className="mt-4 leading-7 text-slate-300">{item.answer}</p></details>)}</div>
        </section>

        <section id="lista-espera" className="mx-auto max-w-5xl px-5 py-20 md:px-8">
          <div className="rounded-[2rem] border border-yellow-300/25 bg-gradient-to-br from-yellow-300/15 via-cyan-300/10 to-white/[0.04] p-8 shadow-[0_0_50px_rgba(56,189,248,0.16)] backdrop-blur md:p-12">
            <h2 className="text-3xl font-black text-white md:text-5xl">Entre na lista de espera da XpeX Academy</h2>
            <p className="mt-5 max-w-3xl leading-8 text-slate-300">Acompanhe a construção da plataforma e receba novidades sobre trilhas, cursos, ferramentas e abertura da comunidade.</p>
            <form className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Formulário visual de lista de espera">
              <input className="rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-300" placeholder="Nome" aria-label="Nome" />
              <input className="rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-300" placeholder="Email" aria-label="Email" type="email" />
              <input className="rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-300" placeholder="Objetivo profissional" aria-label="Objetivo profissional" />
              <button type="button" className="rounded-2xl bg-yellow-300 px-5 py-4 font-black text-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-300 md:col-span-3">Quero acompanhar a construção</button>
            </form>
            <p className="mt-4 text-sm text-slate-400">TODO Fase futura: conectar este formulário a um backend seguro de captação sem criar banco novo nesta etapa.</p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-5 py-10 text-center text-sm text-slate-400 md:px-8">
        <p>© 2026 XpeX Academy. Experiência pública premium construída sobre base técnica open-source LearnHouse, preservando atribuição e licença AGPL-3.0.</p>
      </footer>
    </div>
  )
}
