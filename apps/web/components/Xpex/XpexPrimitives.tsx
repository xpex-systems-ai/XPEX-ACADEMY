import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Inbox, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import SafeImage from '@components/Objects/SafeImage'
import Link from 'next/link'

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
  const safeValue = Math.min(100, Math.max(0, value))
  return <div><div className="mb-2 flex justify-between text-xs font-semibold text-slate-300"><span>{label}</span><span>{safeValue}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={label} aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full xpex-progress-fill" style={{ width: `${safeValue}%` }} /></div></div>
}

export function XpexMetricCard({ icon: Icon, label, value, detail, tone = 'blue' }: { icon: LucideIcon; label: string; value: string; detail: string; tone?: 'orange' | 'blue' }) {
  return <article className="xpex-card p-5"><div className={`grid h-10 w-10 place-items-center rounded-xl ${tone === 'orange' ? 'bg-orange-500/15 text-orange-400' : 'bg-blue-500/15 text-cyan-300'}`}><Icon aria-hidden="true" size={20} /></div><p className="mt-5 text-3xl font-black text-white">{value}</p><p className="mt-1 text-sm font-semibold text-slate-200">{label}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></article>
}

export function XpexPanel({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`xpex-card p-5 md:p-6 ${className}`}>{children}</section>
}

export function XpexDemoButton({ children }: { children: ReactNode }) {
  return <button type="button" disabled aria-disabled="true" className="xpex-primary cursor-not-allowed opacity-75"><span>{children}</span><span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider">Demo</span></button>
}

export function XpexActionCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return <article className="xpex-card w-full p-5 text-left"><div className="flex items-start justify-between gap-3"><Icon aria-hidden="true" className="text-orange-400" size={22} /><span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-200">Preview</span></div><strong className="mt-4 block text-white">{title}</strong><span className="mt-2 block text-sm leading-6 text-slate-400">{description}</span><span className="mt-4 block text-xs font-bold text-slate-500">Ação demonstrativa — sem persistência</span></article>
}

export function XpexEmptyState({ title = 'Nada para mostrar', description = 'Ainda não há conteúdo disponível neste espaço.', compact = false }: { title?: string; description?: string; compact?: boolean } = {}) { return <div className={`xpex-card grid ${compact ? 'min-h-40' : 'min-h-80'} place-items-center border-dashed p-8 text-center`}><div><Inbox aria-hidden="true" className="mx-auto text-cyan-300" size={36} /><h2 className="mt-4 text-xl font-black text-white">{title}</h2><p className="mt-2 text-sm text-slate-400">{description}</p></div></div> }
export function XpexLoadingState() { return <div className="xpex-card grid min-h-80 place-items-center p-8 text-center" role="status" aria-live="polite"><div><LoaderCircle aria-hidden="true" className="mx-auto animate-spin text-cyan-300" size={36} /><p className="mt-4 text-sm text-slate-300">Carregando conteúdo…</p></div></div> }
export function XpexErrorState({ title = 'Não foi possível carregar', description = 'Tente novamente em instantes.' }: { title?: string; description?: string } = {}) { return <div className="xpex-card grid min-h-80 place-items-center p-8 text-center" role="alert" aria-live="assertive"><div><AlertTriangle aria-hidden="true" className="mx-auto text-orange-400" size={36} /><h2 className="mt-4 text-xl font-black text-white">{title}</h2><p className="mt-2 text-sm text-slate-400">{description}</p></div></div> }

export const XpexRoleHero = XpexHero
export function XpexKpiGrid({ children }: { children: ReactNode }) { return <section className="xpex-kpi-grid" aria-label="Indicadores">{children}</section> }
export function XpexProgressCard({ title, progress }: { title: string; progress: number }) { return <XpexPanel><h3 className="font-black text-white">{title}</h3><div className="mt-4"><XpexProgressBar value={progress} label={`Progresso de ${title}`} /></div></XpexPanel> }
export function XpexCourseCard({ title, href, progress, imageUrl, organization, status, featured = false }: { title: string; href: string; progress: number | null; imageUrl?: string | null; organization?: string; status?: string; featured?: boolean }) { return <article className={`xpex-card xpex-course-card ${featured ? 'xpex-course-featured' : ''}`}><div className="xpex-course-art"><SafeImage src={imageUrl} alt="" loading="lazy"/><span aria-hidden="true">X</span></div><div className="xpex-course-body"><div className="xpex-course-meta"><p className="xpex-label">{featured ? 'Continue de onde parou' : 'Curso matriculado'}</p>{status && <span className="xpex-state"><i aria-hidden="true"/>{status}</span>}</div><h3>{title}</h3>{organization && <p className="xpex-course-org">{organization}</p>}{progress === null ? <p className="xpex-course-unavailable">Progresso indisponível</p> : <XpexProgressBar value={progress} label={`Progresso de ${title}`} />}<Link href={href} className="xpex-primary">{progress && progress > 0 ? 'Continuar' : 'Abrir curso'}</Link></div></article> }
export function XpexActivityList({ items }: { items: Array<{ id: string; title: string; detail?: string }> }) { return items.length ? <ul className="xpex-list">{items.map(item => <li key={item.id}><strong>{item.title}</strong>{item.detail && <span>{item.detail}</span>}</li>)}</ul> : <XpexEmptyState title="Nenhuma atividade recente" description="As atividades autorizadas aparecerão aqui quando existirem." compact/> }
export function XpexQuickAction({ icon: Icon, title, disabled = true, href, detail }: { icon: LucideIcon; title: string; disabled?: boolean; href?: string; detail?: string }) {
  const launchStudentHref = title === 'Novo aluno' ? '/xpex/polo/alunos' : undefined
  const resolvedHref = href ?? launchStudentHref
  const resolvedDisabled = launchStudentHref ? false : disabled
  const content = <><Icon aria-hidden="true" size={20}/><strong>{title}</strong>{resolvedDisabled ? <small>Em breve</small> : detail ? <small>{detail}</small> : launchStudentHref ? <small>Convidar e matricular</small> : null}</>
  if (!resolvedDisabled && resolvedHref) return <Link href={resolvedHref} className="xpex-quick-action">{content}</Link>
  return <button type="button" disabled={resolvedDisabled} className="xpex-quick-action">{content}</button>
}
export function XpexAnnouncementCard({ title, children }: { title: string; children: ReactNode }) { return <article className="xpex-card p-5"><p className="xpex-label">Aviso</p><h3 className="mt-2 font-black text-white">{title}</h3><div className="mt-2 text-sm text-slate-400">{children}</div></article> }
export function XpexComingSoon({ title, description }: { title: string; description: string }) { return <article className="xpex-card xpex-coming-soon"><span>Em breve</span><h3>{title}</h3><p>{description}</p></article> }
