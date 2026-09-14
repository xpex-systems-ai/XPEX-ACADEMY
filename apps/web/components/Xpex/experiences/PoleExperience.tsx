import { BookOpen, CalendarDays, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { XpexActionCard, XpexAmbientGlow, XpexBadge, XpexHero, XpexPanel, XpexSectionHeader } from '../XpexPrimitives'

const pillars = [
  ['Aprendizagem com propósito', 'Cursos e atividades conectados à realidade da comunidade.'],
  ['Tecnologia acessível', 'Ferramentas digitais apresentadas com orientação e acolhimento.'],
  ['Presença humana', 'Uma experiência liderada pela Professora Kelle e apoiada pela XPeX.'],
] as const

export function PoleExperience() {
  return <div className="space-y-5">
    <XpexHero eyebrow="Kelle Digital Lab • Polo oficial" title="Tecnologia próxima de quem quer criar novos caminhos." description="Um ambiente humano, local e educacional para aprender em comunidade, experimentar inteligência artificial e transformar ideias em criações práticas.">
      <div className="mt-5 flex flex-wrap items-center gap-3"><XpexBadge>Polo oficial</XpexBadge><span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300"><ShieldCheck size={15}/> Operação conectada</span></div>
    </XpexHero>

    <XpexPanel className="relative overflow-hidden border-orange-500/25 bg-gradient-to-br from-orange-500/[.10] via-transparent to-blue-500/[.10]">
      <XpexAmbientGlow tone="orange"/>
      <div className="relative grid gap-8 lg:grid-cols-[1.35fr_.65fr]">
        <div><p className="xpex-label">Presença local</p><h2 className="mt-3 text-3xl font-black text-white">Kelle Digital Lab</h2><p className="mt-3 max-w-2xl leading-7 text-slate-300">Educação, acolhimento e experimentação orientam a experiência acadêmica do Polo em Campos Lindos/Marajó-GO.</p></div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-5"><p className="text-xs uppercase tracking-widest text-slate-500">Propósito</p><p className="mt-3 font-bold leading-7 text-white">Aprender junto, criar com propósito e ampliar possibilidades por meio da tecnologia.</p></div>
      </div>
    </XpexPanel>

    <section><XpexSectionHeader eyebrow="Identidade acadêmica" title="Os pilares do Polo"/><div className="mt-4 grid gap-4 md:grid-cols-3">{pillars.map(([title, description], index) => <XpexPanel key={title}><span className="xpex-label">0{index + 1}</span><h3 className="mt-3 text-lg font-black text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></XpexPanel>)}</div></section>

    <section id="atividades"><XpexSectionHeader eyebrow="Operação acadêmica" title="Experiência integrada"/><div className="mt-4 grid gap-4 md:grid-cols-3"><XpexActionCard icon={UsersRound} title="Acompanhar alunos" description="Acesse somente participantes e matrículas autorizados."/><XpexActionCard icon={BookOpen} title="Gerenciar cursos" description="Organize o catálogo real da organização."/><XpexActionCard icon={CalendarDays} title="Planejar encontros" description="Prepare atividades presenciais e digitais do Polo."/></div></section>

    <XpexPanel><Sparkles aria-hidden="true" className="text-cyan-300"/><p className="xpex-label mt-5">Compromisso de apresentação</p><h2 className="mt-2 text-xl font-black text-white">Transparência em cada indicador</h2><p className="mt-3 text-sm leading-6 text-slate-400">Métricas aparecem somente quando vêm da infraestrutura acadêmica. A identidade visual comunica a marca; os números refletem exclusivamente dados persistidos da organização.</p></XpexPanel>
  </div>
}
