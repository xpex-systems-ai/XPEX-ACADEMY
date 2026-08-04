import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, ArrowRight, Inbox, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'

export function XpexBadge({ children, tone = 'orange' }: { children: ReactNode; tone?: 'orange' | 'blue' }) {
  return <span className={`xpex-badge ${tone === 'blue' ? 'xpex-badge-blue' : ''}`}>{children}</span>
}

export const XpexStatusBadge = XpexBadge

export function XpexAmbientGlow({ tone = 'cyan' }: { tone?: 'cyan' | 'orange' }) {
  return <span aria-hidden="true" className={`xpex-ambient xpex-ambient-${tone}`} />
}

export function XpexHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <header id="visao-geral" className="xpex-hero">
    <XpexAmbientGlow tone="cyan" />
    <div className="relative"><p className="xpex-label">{eyebrow}</p><h1>{title}</h1><p className="xpex-hero-copy">{description}</p>{children}</div>
  </header>
}

export function XpexSectionHeader({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: ReactNode }) {
  return <div className="xpex-section-header"><div><p className="xpex-label">{eyebrow}</p><h2>{title}</h2></div>{detail}</div>
}

export function XpexFeatureCard({ icon: Icon, eyebrow, title, description, tone = 'cyan' }: { icon: LucideIcon; eyebrow: string; title: string; description: string; tone?: 'cyan' | 'orange' }) {
  return <article className={`xpex-card xpex-feature xpex-feature-${tone}`}><Icon aria-hidden="true" size={23} /><p className="xpex-label">{eyebrow}</p><h3>{title}</h3><p>{description}</p></article>
}

export function XpexProgressBar({ value, label }: { value: number; label: string }) {
  return <div><div className="mb-2 flex justify-between text-xs font-semibold text-slate-300"><span>{label}</span><span>{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-gradient-to-r from-[#087cff] via-[#16d9ff] to-[#ff6a00]" style={{ width: `${value}%` }} /></div></div>
}

export function XpexMetricCard({ icon: Icon, label, value, detail, tone = 'blue' }: { icon: LucideIcon; label: string; value: string; detail: string; tone?: 'orange' | 'blue' }) {
  return <article className="xpex-card p-5"><div className={`grid h-10 w-10 place-items-center rounded-xl ${tone === 'orange' ? 'bg-orange-500/15 text-orange-400' : 'bg-blue-500/15 text-cyan-300'}`}><Icon aria-hidden="true" size={20} /></div><p className="mt-5 text-3xl font-black text-white">{value}</p><p className="mt-1 text-sm font-semibold text-slate-200">{label}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></article>
}

export function XpexPanel({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`xpex-card p-5 md:p-6 ${className}`}>{children}</section>
}

export function XpexActionCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return <button type="button" className="xpex-card group w-full p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"><Icon aria-hidden="true" className="text-orange-400" size={22} /><strong className="mt-4 block text-white">{title}</strong><span className="mt-2 block text-sm leading-6 text-slate-400">{description}</span><ArrowRight aria-hidden="true" className="mt-4 text-cyan-300 transition group-hover:translate-x-1" size={17} /></button>
}

export function XpexEmptyState() { return <div className="xpex-card grid min-h-80 place-items-center border-dashed p-8 text-center"><div><Inbox className="mx-auto text-cyan-300" size={36} /><h2 className="mt-4 text-xl font-black text-white">Nada para mostrar</h2><p className="mt-2 text-sm text-slate-400">Este estado também faz parte da apresentação. Nenhum dado real foi consultado.</p></div></div> }
export function XpexLoadingState() { return <div className="xpex-card grid min-h-80 place-items-center p-8 text-center"><div><LoaderCircle className="mx-auto animate-spin text-cyan-300" size={36} /><p className="mt-4 text-sm text-slate-300">Preparando ambiente demonstrativo…</p></div></div> }
export function XpexErrorState() { return <div className="xpex-card grid min-h-80 place-items-center p-8 text-center"><div><AlertTriangle className="mx-auto text-orange-400" size={36} /><h2 className="mt-4 text-xl font-black text-white">Preview indisponível</h2><p className="mt-2 text-sm text-slate-400">Nenhuma informação foi enviada ou alterada.</p></div></div> }
