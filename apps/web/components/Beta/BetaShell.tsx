'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Play,
  RefreshCw,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react'

export type BetaRole = 'aluno' | 'professora'

const lessons = [
  { title: 'Boas-vindas e combinados', status: 'Concluída', minutes: '6 min' },
  { title: 'O que é inteligência artificial?', status: 'Em andamento', minutes: '12 min' },
  { title: 'IA no nosso dia a dia', status: 'Próxima', minutes: '10 min' },
]

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300 text-sm font-black text-slate-950">XP</span>
      <span><strong className="block text-sm tracking-[0.18em] text-white">XpeX ACADEMY</strong><span className="text-xs text-slate-400">Operação Beta</span></span>
    </Link>
  )
}

function Sidebar({ role, open, close }: { role: BetaRole; open: boolean; close: () => void }) {
  const isTeacher = role === 'professora'
  return (
    <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-[#061426] p-5 transition-transform lg:translate-x-0`}>
      <div className="flex items-center justify-between"><Brand /><button onClick={close} className="rounded-lg p-2 text-slate-400 lg:hidden" aria-label="Fechar menu"><X size={20} /></button></div>
      <nav className="mt-10 space-y-2" aria-label="Navegação da experiência beta">
        <a href="#visao-geral" onClick={close} className="flex items-center gap-3 rounded-xl bg-cyan-300/10 px-4 py-3 text-sm font-bold text-cyan-100"><LayoutDashboard size={18} /> Visão geral</a>
        <a href="#curso" onClick={close} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/5"><BookOpen size={18} /> {isTeacher ? 'Curso piloto' : 'Meu curso'}</a>
        <a href="#projeto" onClick={close} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/5"><FileText size={18} /> {isTeacher ? 'Atividades' : 'Meu projeto'}</a>
        <a href="#feedback" onClick={close} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/5"><MessageSquareText size={18} /> Feedback</a>
      </nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-slate-400"><strong className="block text-slate-200">Ambiente demonstrativo</strong>Dados totalmente fictícios. Não representa turma, matrícula ou operação em produção.</div>
    </aside>
  )
}

function EmptyState({ role, restore }: { role: BetaRole; restore: () => void }) {
  return <section className="grid min-h-[55vh] place-items-center rounded-3xl border border-dashed border-slate-700 bg-white/[0.025] p-8 text-center"><div className="max-w-md"><BookOpen className="mx-auto text-cyan-300" size={38} /><h2 className="mt-5 text-2xl font-black text-white">Nenhum conteúdo demonstrativo</h2><p className="mt-3 leading-7 text-slate-400">{role === 'aluno' ? 'Quando um curso piloto for disponibilizado, sua jornada aparecerá aqui.' : 'Quando houver participantes fictícios na turma, o acompanhamento aparecerá aqui.'}</p><button onClick={restore} className="mt-6 inline-flex items-center gap-2 rounded-full bg-yellow-300 px-5 py-3 text-sm font-black text-slate-950"><RefreshCw size={16} /> Restaurar demonstração</button></div></section>
}

function StudentDashboard() {
  return <>
    <section id="visao-geral" className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
      <div className="overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/15 via-white/[0.06] to-transparent p-6 md:p-8">
        <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-slate-950">CURSO PILOTO</span>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">XPEX-PILOT-01</p><h2 className="mt-2 text-3xl font-black text-white md:text-4xl">Primeiros Passos com IA</h2><p className="mt-3 max-w-2xl leading-7 text-slate-300">Módulo 0 — Primeiro Contato com a Inteligência Artificial</p>
        <div className="mt-8 flex items-center justify-between text-sm"><span className="font-semibold text-slate-200">Progresso demonstrativo</span><strong className="text-cyan-200">35%</strong></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-950/70"><div className="h-full w-[35%] rounded-full bg-gradient-to-r from-cyan-300 to-yellow-300" /></div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-6"><Clock3 className="text-yellow-300" /><p className="mt-6 text-xs font-bold uppercase tracking-widest text-slate-400">Tempo nesta semana</p><p className="mt-2 text-4xl font-black text-white">28 min</p><p className="mt-3 text-sm text-slate-400">Meta fictícia: 45 minutos</p></div>
    </section>
    <section className="mt-5 grid gap-5 lg:grid-cols-2">
      <article className="rounded-3xl border border-white/10 bg-white/[0.055] p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-200">Próxima aula</p><h3 className="mt-2 text-xl font-black text-white">O que é inteligência artificial?</h3></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300 text-slate-950"><Play size={19} fill="currentColor" /></span></div><p className="mt-4 text-sm leading-6 text-slate-400">Uma introdução simples para reconhecer o que a IA faz — e o que ela não faz.</p><button className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-yellow-300">Continuar aula <ArrowRight size={16} /></button></article>
      <article id="projeto" className="rounded-3xl border border-white/10 bg-white/[0.055] p-6"><p className="text-xs font-bold uppercase tracking-widest text-yellow-300">Primeiro projeto</p><h3 className="mt-2 text-xl font-black text-white">Meu mapa da IA cotidiana</h3><p className="mt-4 text-sm leading-6 text-slate-400">Registre três exemplos de IA que você percebe ao seu redor e uma pergunta que gostaria de investigar.</p><div className="mt-6 flex items-center justify-between"><span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">Rascunho</span><span className="text-xs text-slate-500">Atividade fictícia</span></div></article>
    </section>
    <section id="curso" className="mt-5 rounded-3xl border border-white/10 bg-white/[0.055] p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-200">Atividade atual</p><h3 className="mt-2 text-xl font-black text-white">Trilha do Módulo 0</h3></div><span className="text-sm text-slate-400">1 de 3 concluída</span></div><div className="divide-y divide-white/10">{lessons.map((lesson, index) => <div className="flex items-center gap-4 py-4" key={lesson.title}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${index === 0 ? 'bg-green-400 text-slate-950' : index === 1 ? 'bg-yellow-300 text-slate-950' : 'bg-white/10 text-slate-400'}`}>{index === 0 ? <CheckCircle2 size={18} /> : index + 1}</span><div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-100">{lesson.title}</p><p className="text-xs text-slate-500">{lesson.minutes}</p></div><span className="hidden text-xs font-semibold text-slate-400 sm:block">{lesson.status}</span><ChevronRight className="text-slate-600" size={18} /></div>)}</div></section>
    <section id="feedback" className="mt-5 rounded-3xl border border-yellow-300/20 bg-yellow-300/[0.06] p-6"><div className="flex gap-4"><MessageSquareText className="shrink-0 text-yellow-300" /><div><p className="text-xs font-bold uppercase tracking-widest text-yellow-300">Feedback demonstrativo</p><h3 className="mt-2 text-lg font-black text-white">Você começou com uma ótima observação.</h3><p className="mt-2 leading-7 text-slate-300">Na próxima etapa, tente explicar por que cada exemplo precisa de dados para funcionar.</p><p className="mt-4 text-xs text-slate-500">Mensagem fictícia da professora • sem dados pessoais</p></div></div></section>
  </>
}

function TeacherDashboard() {
  const learners = [{ label: 'Participante A', progress: 68, status: 'Em andamento' }, { label: 'Participante B', progress: 35, status: 'Precisa de apoio' }, { label: 'Participante C', progress: 100, status: 'Concluiu módulo' }, { label: 'Participante D', progress: 0, status: 'Ainda não iniciou' }]
  return <>
    <section id="visao-geral" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{ icon: UsersRound, label: 'Participantes fictícios', value: '4' }, { icon: GraduationCap, label: 'Progresso médio', value: '51%' }, { icon: FileText, label: 'Projetos enviados', value: '2' }, { icon: MessageSquareText, label: 'Feedbacks pendentes', value: '2' }].map(({ icon: Icon, label, value }) => <article key={label} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5"><Icon className="text-cyan-300" size={22} /><p className="mt-6 text-3xl font-black text-white">{value}</p><p className="mt-1 text-sm text-slate-400">{label}</p></article>)}</section>
    <section id="curso" className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]"><article className="rounded-3xl border border-white/10 bg-white/[0.055] p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-200">Turma piloto • demonstração</p><h2 className="mt-2 text-2xl font-black text-white">XPEX-PILOT-01</h2><p className="mt-2 text-sm text-slate-400">Módulo 0 — Primeiro Contato com a Inteligência Artificial</p></div><span className="w-fit rounded-full bg-green-400/10 px-3 py-1 text-xs font-bold text-green-300">Turma ativa</span></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[560px] text-left"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500"><tr><th className="pb-3">Identificação fictícia</th><th className="pb-3">Progresso</th><th className="pb-3">Situação</th></tr></thead><tbody className="divide-y divide-white/10">{learners.map(item => <tr key={item.label}><td className="py-4 font-bold text-slate-200">{item.label}</td><td className="py-4"><div className="flex items-center gap-3"><div className="h-2 w-24 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan-300" style={{ width: `${item.progress}%` }} /></div><span className="text-xs text-slate-400">{item.progress}%</span></div></td><td className="py-4 text-sm text-slate-400">{item.status}</td></tr>)}</tbody></table></div></article><aside className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-6"><Sparkles className="text-yellow-300" /><h3 className="mt-5 text-xl font-black text-white">Próxima ação sugerida</h3><p className="mt-3 leading-7 text-slate-300">Revisar os dois mapas enviados e preparar uma pergunta orientadora para cada projeto.</p><button className="mt-6 inline-flex items-center gap-2 rounded-full bg-yellow-300 px-5 py-3 text-sm font-black text-slate-950">Ver atividades <ArrowRight size={16} /></button></aside></section>
    <section id="projeto" className="mt-5 grid gap-5 lg:grid-cols-2"><article className="rounded-3xl border border-white/10 bg-white/[0.055] p-6"><p className="text-xs font-bold uppercase tracking-widest text-yellow-300">Atividade atual</p><h3 className="mt-2 text-xl font-black text-white">Meu mapa da IA cotidiana</h3><p className="mt-4 text-sm leading-6 text-slate-400">2 rascunhos enviados • 2 participantes ainda sem envio.</p></article><article id="feedback" className="rounded-3xl border border-white/10 bg-white/[0.055] p-6"><p className="text-xs font-bold uppercase tracking-widest text-cyan-200">Fila de feedback</p><h3 className="mt-2 text-xl font-black text-white">2 projetos para revisar</h3><p className="mt-4 text-sm leading-6 text-slate-400">Use perguntas curtas e acolhedoras. Esta visão não envia mensagens nem persiste alterações.</p></article></section>
  </>
}

export function BetaShell({ role }: { role: BetaRole }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [empty, setEmpty] = useState(false)
  const isTeacher = role === 'professora'
  return <div className="min-h-screen bg-[#020817] text-slate-100 selection:bg-yellow-300 selection:text-slate-950"><Sidebar role={role} open={menuOpen} close={() => setMenuOpen(false)} />{menuOpen && <button className="fixed inset-0 z-30 bg-slate-950/70 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}<div className="lg:pl-72"><header className="sticky top-0 z-20 border-b border-white/10 bg-[#020817]/90 px-4 py-4 backdrop-blur-xl md:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between"><button onClick={() => setMenuOpen(true)} className="rounded-xl border border-white/10 p-2.5 text-slate-300 lg:hidden" aria-label="Abrir menu"><Menu size={20} /></button><div className="hidden lg:block"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{isTeacher ? 'Área da professora' : 'Área do aluno'}</p><p className="font-bold text-white">{isTeacher ? 'Visão da turma piloto' : 'Minha aprendizagem'}</p></div><div className="flex items-center gap-2"><button onClick={() => setEmpty(value => !value)} className="hidden rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:border-cyan-300 sm:block">{empty ? 'Ver demonstração' : 'Testar estado vazio'}</button><Link href={isTeacher ? '/beta/aluno' : '/beta/professora'} className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-100">{isTeacher ? 'Visão do aluno' : 'Visão da professora'}</Link><span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5" aria-label="Perfil fictício"><CircleUserRound size={21} /></span></div></div></header><main className="mx-auto max-w-7xl p-4 md:p-8"><div className="mb-8"><p className="text-sm font-bold text-cyan-200">Olá, {isTeacher ? 'Professora Demo' : 'Estudante Demo'} 👋</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">{isTeacher ? 'Acompanhe os primeiros passos da turma.' : 'Continue de onde você parou.'}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Preview navegável com dados fictícios, sem matrícula real e sem persistência.</p></div>{empty ? <EmptyState role={role} restore={() => setEmpty(false)} /> : isTeacher ? <TeacherDashboard /> : <StudentDashboard />}<footer className="mt-10 border-t border-white/10 py-6 text-xs leading-5 text-slate-500">Experiência beta demonstrativa • Base open-source LearnHouse preservada sob AGPL-3.0 • Google Cloud permanece pausado.</footer></main></div></div>
}
