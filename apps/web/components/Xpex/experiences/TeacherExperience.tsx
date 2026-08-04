import { BookOpen, CalendarDays, FileCheck2, Lightbulb, MessageSquareText, Sparkles, UsersRound } from 'lucide-react'
import { XpexActionCard, XpexBadge, XpexHero, XpexMetricCard, XpexPanel, XpexProgressBar, XpexSectionHeader, XpexStatusBadge } from '../XpexPrimitives'

const demoLabel = <span className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Dados fictícios</span>
const participants = [
  { name: 'Participante A', progress: 68, status: 'Em andamento' },
  { name: 'Participante B', progress: 35, status: 'Apoio sugerido' },
  { name: 'Participante C', progress: 100, status: 'Módulo concluído' },
  { name: 'Participante D', progress: 0, status: 'Não iniciou' },
]

export function TeacherExperience() {
  return <div className="space-y-5">
    <XpexHero eyebrow="Professora Kelle • Kelle Digital Lab" title="Conduza a turma com clareza e presença." description="Liderança pedagógica apoiada pela tecnologia e pela inteligência XpeX para acolher, orientar projetos e preparar cada próximo encontro.">
      <div className="mt-5 flex flex-wrap items-center gap-3"><XpexBadge>Preview Beta</XpexBadge>{demoLabel}</div>
    </XpexHero>

    <section id="metricas">
      <XpexSectionHeader eyebrow="Pulso pedagógico • demonstração" title="O que merece atenção agora" detail={demoLabel} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <XpexMetricCard icon={UsersRound} value="4" label="Participantes" detail="Turma piloto fictícia" />
        <XpexMetricCard icon={BookOpen} value="51%" label="Progresso médio" detail="Indicador demonstrativo" />
        <XpexMetricCard icon={FileCheck2} value="2" label="Projetos enviados" detail="Envios simulados" tone="orange" />
        <XpexMetricCard icon={MessageSquareText} value="2" label="Feedbacks pendentes" detail="Fila fictícia" tone="orange" />
      </div>
    </section>

    <div id="turma" className="grid gap-5 xl:grid-cols-[1.45fr_.55fr]">
      <XpexPanel id="participantes"><XpexSectionHeader eyebrow="Turma ativa • demonstração" title="XPEX-PILOT-01" detail={demoLabel} />
        <div className="mt-6 space-y-3">{participants.map(({ name, progress, status }) => <article key={name} className="grid items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:grid-cols-[1fr_1fr_auto]">
          <strong className="text-sm text-slate-200">{name}</strong><XpexProgressBar value={progress} label={`Progresso fictício de ${name}`} /><XpexStatusBadge tone="blue">{status}</XpexStatusBadge>
        </article>)}</div>
      </XpexPanel>
      <XpexPanel id="atividades" className="relative overflow-hidden border-orange-500/25 bg-orange-500/[.05]"><Lightbulb aria-hidden="true" className="text-orange-400" /><p className="xpex-label mt-5 !text-orange-400">Próxima ação sugerida</p><h2 className="mt-2 text-xl font-black text-white">Revisar dois mapas enviados</h2><p className="mt-3 text-sm leading-6 text-slate-400">Prepare uma pergunta acolhedora para cada projeto e planeje a próxima mentoria.</p><button type="button" className="xpex-primary">Abrir fila demonstrativa</button></XpexPanel>
    </div>

    <section id="conteudos"><XpexSectionHeader eyebrow="Preparação pedagógica" title="Ferramentas para a próxima aula" /><div className="mt-4 grid gap-4 md:grid-cols-3"><XpexActionCard icon={BookOpen} title="XpeX Studio" description="Preparar conteúdo demonstrativo da próxima aula." /><XpexActionCard icon={Sparkles} title="Professor IA" description="Rascunhar perguntas orientadoras sem persistência." /><XpexActionCard icon={CalendarDays} title="Planejar mentoria" description="Visualizar uma agenda demonstrativa." /></div></section>

    <div className="grid gap-5 lg:grid-cols-2">
      <XpexPanel id="eventos"><CalendarDays aria-hidden="true" className="text-cyan-300" /><p className="xpex-label mt-5">Mentorias e agenda</p><h2 className="mt-2 text-xl font-black text-white">Próximo encontro da turma</h2><p className="mt-3 text-sm leading-6 text-slate-400">Mentoria demonstrativa • 07 AGO, 19h • pauta fictícia: perguntas orientadoras para os projetos.</p></XpexPanel>
      <XpexPanel id="avisos"><Lightbulb aria-hidden="true" className="text-orange-400" /><p className="xpex-label mt-5 !text-orange-400">Ambiente demonstrativo</p><h2 className="mt-2 text-xl font-black text-white">Ações sem persistência</h2><p className="mt-3 text-sm leading-6 text-slate-400">Participantes, progressos, projetos, feedbacks, horários e ações são fictícios. Nada nesta apresentação é persistido ou altera dados reais.</p></XpexPanel>
    </div>
  </div>
}
