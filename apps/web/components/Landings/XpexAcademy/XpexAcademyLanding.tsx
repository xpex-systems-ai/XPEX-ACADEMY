import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { XPEX_BRAND, xpexBetaExperiences, xpexHowItWorks, xpexHumanLayer, xpexPilotCourse, xpexStrategicModules, xpexTransparencyNotes } from '@/lib/xpex-brand'

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#16D9FF]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-[#F8FAFC] md:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-8 text-[#A8B4C4] md:text-lg">{description}</p>
    </div>
  )
}

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#16D9FF]'

export function XpexAcademyLanding() {
  return (
    <div className="xpex-root min-h-screen overflow-hidden bg-[#02050B] text-[#F8FAFC] selection:bg-[#16D9FF] selection:text-[#02050B]">
      <a href="#conteudo" className={`sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-xl focus:bg-[#FF6A00] focus:px-4 focus:py-2 focus:text-sm focus:font-black focus:text-white ${focusRing}`}>Pular para o conteúdo</a>
      <div className="pointer-events-none fixed inset-0 opacity-80" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,106,0,0.18),transparent_30%),radial-gradient(circle_at_80%_14%,rgba(8,124,255,0.18),transparent_26%),radial-gradient(circle_at_50%_95%,rgba(22,217,255,0.10),transparent_30%),linear-gradient(145deg,#02050B_0%,#050D18_52%,#02050B_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      </div>

      <header className="relative z-10 border-b border-[rgba(148,163,184,0.14)] bg-[#02050B]/75 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8" aria-label="Navegação pública XpeX Academy">
          <Link href="/" className={`group flex w-fit items-center gap-3 rounded-full ${focusRing}`}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#FF6A00]/35 bg-[#FF6A00]/10 text-lg font-black text-[#FF8A2A] shadow-[0_0_30px_rgba(255,106,0,0.18)]">XP</span>
            <span><span className="block text-sm font-black tracking-[0.22em] text-white">{XPEX_BRAND.name}</span><span className="block text-xs text-[#A8B4C4]">{XPEX_BRAND.slogan}</span></span>
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-[#A8B4C4] md:gap-6">
            <a href="#experiencias" className={`hover:text-[#16D9FF] ${focusRing}`}>Experiências</a>
            <a href="#ecossistema" className={`hover:text-[#16D9FF] ${focusRing}`}>Ecossistema</a>
            <a href="#como-funciona" className={`hover:text-[#16D9FF] ${focusRing}`}>Como funciona</a>
            <a href="#transparencia" className={`hover:text-[#16D9FF] ${focusRing}`}>Transparência</a>
          </div>
          <div className="flex items-center gap-2"><Link href="/beta/aluno" className={`rounded-full bg-[#FF6A00] px-4 py-2 text-sm font-black text-white shadow-[0_0_28px_rgba(255,106,0,0.22)] hover:bg-[#FF8A2A] ${focusRing}`}>Explorar experiência</Link><Link href="/login" className={`rounded-full border border-[rgba(148,163,184,0.22)] px-4 py-2 text-sm font-bold text-white hover:border-[#16D9FF] hover:bg-[#16D9FF]/10 ${focusRing}`}>Entrar</Link></div>
        </nav>
      </header>

      <main id="conteudo" className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#FF8A2A]"><Sparkles size={15} aria-hidden="true" /> Preview Beta da XpeX Academy</p>
            <h1 className="max-w-4xl text-5xl font-black tracking-[-0.05em] text-white md:text-7xl">Aprender, criar e evoluir com inteligência artificial</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#A8B4C4] md:text-xl">A XpeX Academy é um {XPEX_BRAND.positioning} que combina aprendizagem guiada, projetos práticos, suporte inteligente e acompanhamento humano.</p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row"><Link href="/beta/aluno" className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6A00] px-6 py-4 text-sm font-black text-white shadow-[0_0_35px_rgba(255,106,0,0.28)] transition hover:-translate-y-0.5 hover:bg-[#FF8A2A] ${focusRing}`}>Explorar área do aluno <ArrowRight size={18} aria-hidden="true" /></Link><a href="#experiencias" className={`inline-flex items-center justify-center rounded-full border border-[#16D9FF]/30 bg-white/5 px-6 py-4 text-sm font-bold text-[#16D9FF] backdrop-blur transition hover:bg-[#16D9FF]/10 ${focusRing}`}>Conhecer as três experiências</a></div>
            <ul className="mt-6 flex flex-wrap gap-3 text-sm text-[#A8B4C4]">{['plataforma em evolução', 'experiência demonstrativa', 'dados fictícios nas telas beta'].map(item => <li key={item} className="rounded-full border border-[rgba(148,163,184,0.14)] bg-[#081321]/80 px-3 py-2">{item}</li>)}</ul>
          </div>

          <div className="rounded-[2rem] border border-[rgba(148,163,184,0.14)] bg-[#081321]/80 p-5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[1.5rem] border border-[#087CFF]/25 bg-[#050D18]/85 p-5">
              <div className="mb-5 flex items-center justify-between border-b border-[rgba(148,163,184,0.14)] pb-4"><div><p className="text-xs uppercase tracking-[0.22em] text-[#A8B4C4]">Preview público</p><p className="font-bold text-white">Jornada demonstrativa</p></div><span className="rounded-full bg-[#087CFF]/15 px-3 py-1 text-xs font-bold text-[#16D9FF]">Beta transparente</span></div>
              {['Aprendizagem guiada', 'Projeto prático', 'Acompanhamento humano'].map((label, index) => <div key={label} className="mb-4 rounded-2xl border border-[rgba(148,163,184,0.14)] bg-white/[0.04] p-4"><div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="text-[#16D9FF]">Etapa {index + 1}</span></div><div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-[#FF6A00] via-[#087CFF] to-[#16D9FF]" style={{ width: `${55 + index * 18}%` }} /></div></div>)}
              <div className="grid grid-cols-2 gap-3">{['Aluno', 'Professora', 'Polo', 'Roadmap'].map(item => <div key={item} className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1E30]/70 p-4 text-sm font-semibold text-slate-200">{item}</div>)}</div>
            </div>
          </div>
        </section>

        <section id="experiencias" className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <SectionHeader eyebrow="Experiências beta" title="Três experiências. Um único ecossistema." description="As áreas de aluno, professora e polo conectam a narrativa pública ao produto beta com dados fictícios e sem persistência." />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">{xpexBetaExperiences.map(item => <article key={item.href} className="rounded-[2rem] border border-[#FF6A00]/25 bg-gradient-to-br from-[#FF6A00]/10 via-[#081321]/90 to-[#087CFF]/10 p-7 backdrop-blur"><span className="text-xs font-black uppercase tracking-[.2em] text-[#FF8A2A]">{item.role} • Preview Beta</span><h3 className="mt-5 text-2xl font-black text-white">Experiência {item.role}</h3><p className="mt-4 leading-7 text-[#A8B4C4]">{item.summary}</p><ul className="mt-5 flex flex-wrap gap-2">{item.focus.map(focus => <li key={focus} className="rounded-full border border-[#16D9FF]/20 bg-[#16D9FF]/10 px-3 py-1 text-xs font-bold text-[#16D9FF]">{focus}</li>)}</ul><Link href={item.href} className={`mt-6 inline-flex items-center gap-2 rounded-full bg-[#FF6A00] px-5 py-3 text-sm font-black text-white hover:bg-[#FF8A2A] ${focusRing}`}>{item.label}<ArrowRight size={17} aria-hidden="true" /></Link></article>)}</div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8"><div className="rounded-[2rem] border border-[#087CFF]/25 bg-[#081321]/85 p-8 md:p-12"><p className="text-sm font-black uppercase tracking-[.24em] text-[#16D9FF]">{xpexPilotCourse.code}</p><h2 className="mt-4 text-3xl font-black text-white md:text-5xl">{xpexPilotCourse.title}</h2><p className="mt-3 text-lg font-bold text-[#FF8A2A]">{xpexPilotCourse.module}</p><p className="mt-5 max-w-4xl leading-8 text-[#A8B4C4]">{xpexPilotCourse.description}</p><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{xpexPilotCourse.includes.map(item => <div key={item} className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#050D18]/70 p-5 font-bold text-slate-100"><CheckCircle2 className="mb-4 text-[#16D9FF]" aria-hidden="true" />{item}</div>)}</div></div></section>

        <section id="ecossistema" className="mx-auto max-w-7xl px-5 py-16 md:px-8"><SectionHeader eyebrow="Ecossistema" title="Beta presente e roadmap futuro sem misturar promessas." description="Cada módulo deixa claro o que é demonstrativo agora e o que ainda é visão planejada para evolução da plataforma." /><div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{xpexStrategicModules.map(({ icon: Icon, title, status, description }) => <article key={title} className="rounded-3xl border border-[rgba(148,163,184,0.14)] bg-[#081321]/85 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-[#16D9FF]/35"><Icon className="mb-5 text-[#16D9FF]" size={28} aria-hidden="true" /><span className="rounded-full bg-[#087CFF]/15 px-3 py-1 text-xs font-black text-[#16D9FF]">{status}</span><h3 className="mt-5 text-xl font-black text-white">{title}</h3><p className="mt-3 leading-7 text-[#A8B4C4]">{description}</p></article>)}</div></section>

        <section id="como-funciona" className="mx-auto max-w-7xl px-5 py-16 md:px-8"><SectionHeader eyebrow="Como funciona" title="Aprenda. Pratique. Construa. Compartilhe. Evolua." description="A metodologia é prática e educacional, sem prometer emprego, renda, certificação externa ou integração institucional." /><div className="mt-12 grid gap-5 lg:grid-cols-5">{xpexHowItWorks.map((step, index) => <article key={step.step} className="rounded-3xl border border-[rgba(148,163,184,0.14)] bg-[#0E1E30]/70 p-6"><span className="text-sm font-black text-[#FF8A2A]">0{index + 1}</span><h3 className="mt-5 text-xl font-black text-white">{step.step}</h3><p className="mt-3 text-sm leading-6 text-[#A8B4C4]">{step.description}</p></article>)}</div></section>

        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8"><SectionHeader eyebrow="Camada humana" title="Tecnologia com acompanhamento humano" description="A inteligência artificial aparece como suporte educacional, enquanto aluno, professora e polo mantêm protagonismo na aprendizagem." /><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{xpexHumanLayer.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-3xl border border-[#FF6A00]/18 bg-[#081321]/85 p-6"><Icon className="text-[#FF8A2A]" size={30} aria-hidden="true" /><h3 className="mt-5 text-xl font-black text-white">{title}</h3><p className="mt-3 leading-7 text-[#A8B4C4]">{description}</p></article>)}</div></section>

        <section id="transparencia" className="mx-auto max-w-7xl px-5 py-16 md:px-8"><div className="rounded-[2rem] border border-[#16D9FF]/20 bg-gradient-to-br from-[#087CFF]/12 via-[#081321]/90 to-[#FF6A00]/10 p-8 md:p-12"><SectionHeader eyebrow="Transparência" title="O que esta página afirma — e o que não afirma." description="A comunicação pública evita alegações não verificadas e identifica conteúdos beta, fictícios e de roadmap." /><ul className="mt-10 grid gap-4 md:grid-cols-2">{xpexTransparencyNotes.map(note => <li key={note} className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#02050B]/45 p-5 leading-7 text-[#A8B4C4]"><CheckCircle2 className="mb-3 text-[#16D9FF]" aria-hidden="true" />{note}</li>)}</ul></div></section>

        <section className="mx-auto max-w-5xl px-5 py-20 md:px-8"><div className="rounded-[2rem] border border-[#FF6A00]/25 bg-gradient-to-br from-[#FF6A00]/15 via-[#087CFF]/10 to-white/[0.04] p-8 shadow-[0_0_50px_rgba(255,106,0,0.14)] backdrop-blur md:p-12"><h2 className="text-3xl font-black text-white md:text-5xl">Conheça a XpeX Academy em funcionamento</h2><p className="mt-5 max-w-3xl leading-8 text-[#A8B4C4]">Sem lista de espera visual ou formulário fictício: use os links abaixo para navegar pelas experiências demonstrativas disponíveis.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><Link href="/beta/aluno" className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6A00] px-6 py-4 text-sm font-black text-white hover:bg-[#FF8A2A] ${focusRing}`}>Entrar na experiência do aluno <ArrowRight size={18} aria-hidden="true" /></Link><Link href="/beta/professora" className={`inline-flex items-center justify-center rounded-full border border-[#16D9FF]/30 px-6 py-4 text-sm font-bold text-[#16D9FF] hover:bg-[#16D9FF]/10 ${focusRing}`}>Ver professora</Link><Link href="/beta/polo" className={`inline-flex items-center justify-center rounded-full border border-[#16D9FF]/30 px-6 py-4 text-sm font-bold text-[#16D9FF] hover:bg-[#16D9FF]/10 ${focusRing}`}>Ver polo</Link></div></div></section>
      </main>

      <footer className="relative z-10 border-t border-[rgba(148,163,184,0.14)] px-5 py-10 text-center text-sm text-[#A8B4C4] md:px-8"><p>© 2026 XpeX Academy. Experiência pública premium construída sobre base técnica open-source LearnHouse, preservando atribuição e licença AGPL-3.0.</p></footer>
    </div>
  )
}
