import Link from 'next/link'
import type { ReactNode } from 'react'

export function XpexLegalPage({ eyebrow, title, summary, children }: {
  eyebrow: string
  title: string
  summary: string
  children: ReactNode
}) {
  return <main className="min-h-screen bg-[#030914] px-5 py-10 text-white sm:px-8 sm:py-16">
    <article className="mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-cyan-400/20 bg-[#0b1524] shadow-[0_32px_100px_rgba(0,0,0,.45)]">
      <header className="border-b border-white/10 bg-[radial-gradient(circle_at_85%_0,rgba(0,212,255,.16),transparent_38%),radial-gradient(circle_at_10%_0,rgba(255,122,0,.15),transparent_32%)] px-6 py-10 sm:px-12">
        <Link href="/login" className="text-xs font-black uppercase tracking-[.22em] text-cyan-300">Kelle Digital Lab</Link>
        <p className="mt-8 text-xs font-black uppercase tracking-[.2em] text-orange-400">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{summary}</p>
      </header>
      <div className="space-y-8 px-6 py-10 text-sm leading-7 text-slate-300 sm:px-12 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-white [&_a]:text-cyan-300 [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
      <footer className="flex flex-col gap-3 border-t border-white/10 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-12">
        <span>Tecnologia por XPeX Academy AI</span>
        <Link href="/login" className="font-bold text-cyan-300">Voltar ao acesso</Link>
      </footer>
    </article>
  </main>
}
