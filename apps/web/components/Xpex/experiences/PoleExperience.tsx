import { BookOpen, CalendarDays, FileCheck2, Lightbulb, Sparkles, UsersRound } from 'lucide-react'
import { XpexActionCard, XpexAmbientGlow, XpexBadge, XpexHero, XpexMetricCard, XpexPanel, XpexProgressBar, XpexSectionHeader } from '../XpexPrimitives'

const demoLabel = <span className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Dados demonstrativos</span>
const events = [
  ['Encontro de boas-vindas', '05 AGO • 19H'],
  ['Laboratório aberto de prompts', '12 AGO • 19H'],
  ['Mentoria e roda da comunidade', '19 AGO • 19H'],
]

export function PoleExperience() {
  return <div className="space-y-5">
    <XpexHero eyebrow="Kelle Digital Lab • Polo piloto" title="Tecnologia próxima de quem quer criar novos caminhos." description="Um espaço humano, local e educacional para aprender em comunidade, experimentar inteligência artificial e transformar ideias em criações práticas.">
      <div className="mt-5 flex flex-wrap items-center gap-3"><XpexBadge>Polo piloto</XpexBadge>{demoLabel}</div>
    </XpexHero>

    <XpexPanel className="relative overflow-hidden border-orange-500/25 bg-gradient-to-br from-orange-500/[.10] via-transparent to-blue-500/[.10]"><XpexAmbientGlow tone="orange" /><div className="relative grid gap-8 lg:grid-cols-[1.35fr_.65fr]"><div><p className="xpex-label">Presença local</p><h2 className="mt-3 text-3xl font-black text-white">Kelle Digital Lab</h2><p className="mt-3 max-w-2xl leading-7 text-slate-300">Acolhimento, acessibilidade e experimentação orientam este conceito demonstrativo de aprendizagem comunitária.</p></div><div className="rounded-2xl border border-white/10 bg-black/25 p-5"><p className="text-xs uppercase tracking-widest text-slate-500">Propósito piloto</p><p className="mt-3 font-bold leading-7 text-white">Aprender junto, criar com propósito e explorar possibilidades locais.</p></div></div></XpexPanel>

    <section id="metricas"><XpexSectionHeader eyebrow="Visão operacional • piloto" title="Uma leitura simples do polo" detail={demoLabel} /><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><XpexMetricCard icon={UsersRound} value="4" label="Participantes piloto" detail="Quantidade fictícia" /><XpexMetricCard icon={BookOpen} value="1" label="Turma ativa" detail="Piloto demonstrativo" /><XpexMetricCard icon={CalendarDays} value="3" label="Próximos encontros" detail="Agenda demonstrativa" tone="orange" /><XpexMetricCard icon={FileCheck2} value="2" label="Projetos em curso" detail="Indicador fictício" tone="orange" /></div></section>

    <div className="grid gap-5 xl:grid-cols-2">
      <XpexPanel id="turmas"><XpexSectionHeader eyebrow="Turmas e cursos demonstrativos" title="Operação piloto" detail={demoLabel} /><div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5"><div className="flex flex-wrap justify-between gap-3"><strong className="text-white">Primeiros Passos com IA</strong><XpexBadge tone="blue">Piloto ativo</XpexBadge></div><p className="mt-2 text-sm text-slate-400">4 participantes fictícios • Módulo 0 • curso demonstrativo</p><div className="mt-5"><XpexProgressBar value={51} label="Progresso médio demonstrativo da turma" /></div></div></XpexPanel>
      <XpexPanel id="eventos"><XpexSectionHeader eyebrow="Datas demonstrativas" title="Agenda do polo" detail={demoLabel} />{events.map(([title, date]) => <article key={title} className="mt-4 flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-4"><span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><CalendarDays size={20} /></span><div><h3 className="text-sm font-bold text-white">{title}</h3><p className="mt-1 text-xs text-slate-500">{date} • informação fictícia</p></div></article>)}</XpexPanel>
    </div>

    <section id="atividades"><XpexSectionHeader eyebrow="Ativação local" title="Próximas ações do polo" /><div className="mt-4 grid gap-4 md:grid-cols-3"><XpexActionCard icon={UsersRound} title="Acompanhar turma" description="Observar a jornada piloto com acolhimento." /><XpexActionCard icon={CalendarDays} title="Organizar encontro" description="Planejar uma agenda demonstrativa." /><XpexActionCard icon={Sparkles} title="Ativar laboratório de IA" description="Explorar o conceito educacional local." /></div></section>

    <div className="grid gap-5 lg:grid-cols-2"><XpexPanel><p className="xpex-label">Impacto local possível</p><h2 className="mt-2 text-xl font-black text-white">Aprendizagem acessível e criação prática</h2><p className="mt-3 text-sm leading-6 text-slate-400">Esta visão comunica uma possibilidade: pessoas aprendendo em comunidade e criando projetos úteis, sem alegar parcerias ou resultados oficiais.</p></XpexPanel><XpexPanel id="avisos"><Lightbulb aria-hidden="true" className="text-cyan-300" /><p className="xpex-label mt-5">Transparência da apresentação</p><h2 className="mt-2 text-xl font-black text-white">Dados apenas fictícios</h2><p className="mt-3 text-sm leading-6 text-slate-400">Métricas, turmas, eventos e atividades são fictícios e não persistidos. Não há dados financeiros, matrículas, dados pessoais ou chamadas ao backend.</p></XpexPanel></div>
  </div>
}
