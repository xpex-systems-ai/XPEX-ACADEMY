import { ArrowRight, Award, BookOpen, CalendarDays, CheckCircle2, Clock3, Lightbulb, MessageSquareText, Rocket, Sparkles, UsersRound } from 'lucide-react'
import { XpexActionCard, XpexBadge, XpexFeatureCard, XpexHero, XpexMetricCard, XpexPanel, XpexProgressBar, XpexSectionHeader } from '../XpexPrimitives'

const demo = <span className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Dados fictícios</span>
const modules = ['Boas-vindas e combinados', 'O que é inteligência artificial?', 'IA no nosso dia a dia']

export function StudentExperience() {
  return <div className="space-y-5">
    <XpexHero eyebrow="Olá, Estudante Demo • Preview Beta" title="Sua próxima conquista começa aqui." description="Continue o curso piloto, avance na trilha do Módulo 0 e transforme aprendizado em uma primeira evidência de portfólio.">
      <div className="mt-5 flex flex-wrap items-center gap-3"><XpexBadge>Jornada demonstrativa</XpexBadge>{demo}</div>
    </XpexHero>

    <div className="grid gap-5 xl:grid-cols-[1.5fr_.5fr]">
      <XpexPanel id="cursos" className="relative overflow-hidden border-orange-500/25"><XpexSectionHeader eyebrow="Curso piloto • XPEX-PILOT-01" title="Primeiros Passos com IA" detail={demo}/><p className="mt-3 text-slate-400">Módulo 0 — Primeiro Contato com a Inteligência Artificial</p><div className="mt-7"><XpexProgressBar value={35} label="Progresso demonstrativo" /></div><button className="xpex-primary">Continuar aprendizagem <ArrowRight size={17}/></button></XpexPanel>
      <XpexMetricCard icon={Clock3} value="28 min" label="Ritmo semanal" detail="Meta fictícia: 45 min" tone="orange" />
    </div>

    <div className="grid gap-5 md:grid-cols-3">
      <div id="eventos"><XpexFeatureCard icon={CalendarDays} eyebrow="Próxima aula" title="IA no nosso dia a dia" description="Aula ao vivo demonstrativa • amanhã, 19h" /></div>
      <div id="projetos"><XpexFeatureCard icon={Rocket} eyebrow="Projeto atual" title="Meu mapa da IA cotidiana" description="Rascunho fictício • 1 de 3 evidências" tone="orange" /></div>
      <div id="conquistas"><XpexFeatureCard icon={Award} eyebrow="Conquista" title="Primeiro acesso" description="Selo demonstrativo da jornada piloto" /></div>
    </div>

    <XpexPanel id="trilhas"><XpexSectionHeader eyebrow="Trilha do Módulo 0" title="Fundamentos para começar" detail={demo}/><div className="mt-6 grid gap-3 md:grid-cols-3">{modules.map((item, index) => <article key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${index === 0 ? 'bg-cyan-300 text-slate-950' : 'bg-white/10 text-slate-400'}`}>{index === 0 ? <CheckCircle2 size={16}/> : index + 1}</span><h3 className="mt-4 font-bold text-white">{item}</h3><p className="mt-2 text-xs text-slate-500">{index === 0 ? 'Concluída' : index === 1 ? 'Em andamento' : 'Próxima etapa'}</p></article>)}</div></XpexPanel>

    <div id="acoes" className="grid gap-4 md:grid-cols-3"><XpexActionCard icon={Sparkles} title="Laboratório de IA" description="Explore ferramentas e prompts guiados."/><XpexActionCard icon={MessageSquareText} title="Feedback da professora" description="Leia uma orientação demonstrativa."/><XpexActionCard icon={BookOpen} title="Materiais da aula" description="Revise a curadoria do módulo piloto."/></div>

    <div className="grid gap-5 lg:grid-cols-2"><XpexPanel id="comunidade"><UsersRound className="text-cyan-300"/><p className="xpex-label mt-5">Comunidade XpeX</p><h2 className="mt-2 text-xl font-black text-white">Aprender também é trocar</h2><p className="mt-3 text-sm leading-6 text-slate-400">Compartilhe descobertas e projetos com a turma piloto neste espaço demonstrativo.</p></XpexPanel><XpexPanel id="avisos"><Lightbulb className="text-orange-400"/><p className="mt-5 text-xs font-bold uppercase tracking-widest text-orange-400">Suporte e avisos</p><h2 className="mt-2 text-xl font-black text-white">Precisa de orientação?</h2><p className="mt-3 text-sm leading-6 text-slate-400">Consulte os combinados ou leve sua dúvida ao próximo encontro. Canal apenas demonstrativo.</p></XpexPanel></div>
  </div>
}
