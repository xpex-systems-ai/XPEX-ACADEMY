'use client'

import { signOut } from '@components/Contexts/AuthContext'
import { Award, Bell, BookOpen, Bot, FileText, LayoutDashboard, LogOut, Map, Menu, MessageCircle, Search, ShieldCheck, Users, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react'
import { xpexAuthenticatedNavigation } from './xpex-navigation'
import { getUriWithOrg } from '@services/config/config'
import type { XpexRole } from './xpex-types'
import './xpex-tokens.css'
import './xpex.css'

const roleLabels: Record<XpexRole, string> = { aluno: 'Aluno', professora: 'Professora', polo: 'Polo' }

export function XpexLegalAttribution() {
  return <footer className="xpex-legal" aria-label="Informações legais"><span>XPeX Academy</span><span>Versão modificada do projeto open-source LearnHouse.</span><a href="https://github.com/xpex-systems-ai/XPEX-ACADEMY/blob/dev/LICENSE">Licença AGPL-3.0</a><a href="https://github.com/xpex-systems-ai/XPEX-ACADEMY">Código-fonte correspondente</a></footer>
}

function AdminEntry({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const current = pathname === '/xpex/admin' || pathname.startsWith('/xpex/admin/')
  return <Link href="/xpex/admin" aria-current={current ? 'page' : undefined} onClick={onNavigate} className={`xpex-nav-item ${current ? 'xpex-nav-active' : ''}`}><ShieldCheck aria-hidden="true" size={18}/><span>Painel Admin</span></Link>
}

function StudentNavigation({ organizationSlug, adminAccess = false, onNavigate }: { organizationSlug: string; adminAccess?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  const items = [
    { label: 'Início', icon: LayoutDashboard, href: '/xpex/aluno' },
    { label: 'Meus Cursos', icon: BookOpen, href: '/xpex/courses' },
    { label: 'Trilhas', icon: Map, href: '/xpex/trails' },
    { label: 'Atividades', icon: FileText, href: '/xpex/activities' },
    { label: 'Laboratório de IA', icon: Bot, href: '/xpex/ai-lab' },
    { label: 'Comunidade', icon: Users, href: '/xpex/community' },
    { label: 'Certificados', icon: Award, href: '/xpex/certificates' },
  ]
  return <nav className="xpex-role-nav" aria-label={`Navegação da área Aluno — ${organizationSlug}`}>{items.map(({ label, icon: Icon, href }) => { const current = pathname === href || pathname.startsWith(`${href}/`); return <Link key={label} href={href} aria-current={current ? 'page' : undefined} onClick={onNavigate} className={`xpex-nav-item ${current ? 'xpex-nav-active' : ''}`}><Icon aria-hidden="true" size={18}/><span>{label}</span></Link> })}{adminAccess && <AdminEntry onNavigate={onNavigate}/>}</nav>
}

export function XpexRoleNavigation({ role, organizationSlug, adminAccess = false, adminNavigation = false, onNavigate }: { role: XpexRole; organizationSlug: string; adminAccess?: boolean; adminNavigation?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  if (role === 'aluno' && !adminNavigation) return <StudentNavigation organizationSlug={organizationSlug} adminAccess={adminAccess} onNavigate={onNavigate}/>

  const destinations: Record<string, string> = adminNavigation
    ? {
        'Visão Geral': '/xpex/admin',
        'Alunos': '/xpex/admin/alunos',
        'Turmas': getUriWithOrg(organizationSlug, '/dash/users/settings/usergroups'),
        'Cursos': getUriWithOrg(organizationSlug, '/dash/courses'),
        'Conteúdos': getUriWithOrg(organizationSlug, '/dash/library'),
        'Relatórios': getUriWithOrg(organizationSlug, '/dash/analytics'),
        'Configurações': getUriWithOrg(organizationSlug, '/dash/org/settings/general'),
      }
    : role === 'polo'
      ? {
          'Visão Geral': '/xpex/polo',
          'Alunos': '/xpex/polo/alunos',
          'Turmas': getUriWithOrg(organizationSlug, '/dash/users/settings/usergroups'),
          'Cursos': getUriWithOrg(organizationSlug, '/dash/courses'),
          'Conteúdos': getUriWithOrg(organizationSlug, '/dash/library'),
          'Relatórios': getUriWithOrg(organizationSlug, '/dash/analytics'),
          'Configurações': getUriWithOrg(organizationSlug, '/dash/org/settings/general'),
        }
      : {
          'Visão Geral': '/xpex/professora',
          'Conteúdos': '/xpex/professora#cursos',
          'Atividades': '/xpex/professora#atividades',
        }

  const items = xpexAuthenticatedNavigation[role].filter(({ label }) => destinations[label])
  const navigationLabel = adminNavigation ? 'Navegação da área Superadmin' : `Navegação da área ${roleLabels[role]}`
  return <nav className="xpex-role-nav" aria-label={navigationLabel}>{items.map(({ label, icon: Icon }) => { const destination = destinations[label]!; const destinationPath = destination.split('#')[0].split('?')[0]; const homePath = adminNavigation ? '/xpex/admin' : `/xpex/${role}`; const isCurrent = pathname === destinationPath || (destinationPath !== homePath && pathname.startsWith(`${destinationPath}/`)); return <Link key={label} href={destination} aria-current={isCurrent ? 'page' : undefined} onClick={onNavigate} className={`xpex-nav-item ${isCurrent ? 'xpex-nav-active' : ''}`}><Icon aria-hidden="true" size={18}/><span>{label}</span></Link> })}{adminAccess && !adminNavigation && <AdminEntry onNavigate={onNavigate}/>}</nav>
}

export function XpexSidebar({ role, organizationSlug, adminAccess = false, adminNavigation = false, open, close }: { role: XpexRole; organizationSlug: string; adminAccess?: boolean; adminNavigation?: boolean; open: boolean; close: () => void }) {
  const homeHref = adminNavigation ? '/xpex/admin' : `/xpex/${role}`
  return <aside id="xpex-sidebar" aria-label="Menu principal XPeX" className={`xpex-sidebar ${open ? 'is-open' : ''}`}><div className="xpex-brand-row"><Link href={homeHref} className="xpex-brand" aria-label="XPeX Academy — início"><span aria-hidden="true">X</span><strong>XPeX<small>Academy</small></strong></Link><button className="xpex-icon-button xpex-mobile-only" onClick={close} aria-label="Fechar menu"><X size={20}/></button></div><p className="xpex-nav-label">Aprenda. Automatize. Construa.</p><XpexRoleNavigation role={role} organizationSlug={organizationSlug} adminAccess={adminAccess} adminNavigation={adminNavigation} onNavigate={close}/><div className="xpex-session-card"><ShieldCheck aria-hidden="true" size={17}/><div><strong>Sessão protegida</strong><span>Permissões validadas no servidor</span></div></div><XpexLegalAttribution/></aside>
}

export function XpexTopbar({ role, displayName, organizationSlug, adminNavigation = false, openMenu, menuOpen, menuButtonRef }: { role: XpexRole; displayName: string; organizationSlug: string; adminNavigation?: boolean; openMenu: () => void; menuOpen?: boolean; menuButtonRef?: RefObject<HTMLButtonElement | null> }) {
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'XP'
  const router = useRouter(); const [query, setQuery] = useState('')
  const submitSearch = (event: FormEvent) => { event.preventDefault(); const value = query.trim(); router.push(value ? `/xpex/search?q=${encodeURIComponent(value)}` : '/xpex/search') }
  const profileRole = adminNavigation ? 'Superadmin' : roleLabels[role]
  return <header className="xpex-topbar" data-organization={organizationSlug}><button ref={menuButtonRef} className="xpex-icon-button xpex-mobile-only" onClick={openMenu} aria-label="Abrir menu" aria-controls="xpex-sidebar" aria-expanded={menuOpen}><Menu aria-hidden="true" size={20}/></button><form className="xpex-search" onSubmit={submitSearch}><Search aria-hidden="true" size={18}/><span className="sr-only">Buscar na XPeX Academy</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar cursos, aulas, conteúdos..."/><button className="sr-only" type="submit">Buscar</button></form><div className="xpex-top-actions"><Link href="/xpex/notifications" className="xpex-icon-button" aria-label="Notificações"><Bell size={18}/></Link><Link href="/xpex/ai-lab" className="xpex-icon-button xpex-hide-small" aria-label="Abrir assistente GX"><MessageCircle size={18}/></Link><div className="xpex-profile" aria-label={`Usuário: ${displayName}, papel: ${profileRole}`}><span className="xpex-avatar">{initials}</span><span><strong>{displayName}</strong><small>{profileRole}</small></span></div><button type="button" onClick={() => signOut({ redirect: true, callbackUrl: '/login' })} className="xpex-icon-button" aria-label="Sair da XPeX Academy"><LogOut size={18}/></button></div></header>
}

export function XpexAuthenticatedShell({ role, allowedRoles, displayName, organizationSlug, adminAccess = false, adminNavigation = false, children }: { role: XpexRole; allowedRoles: XpexRole[]; displayName: string; organizationSlug: string; adminAccess?: boolean; adminNavigation?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false); const menuButton = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (!open) return; const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus() } }; document.addEventListener('keydown', closeOnEscape); return () => document.removeEventListener('keydown', closeOnEscape) }, [open])
  return <div className="xpex-root xpex-authenticated"><a href="#conteudo-xpex" className="xpex-skip">Pular para o conteúdo</a>{open && <button className="xpex-drawer-backdrop" aria-label="Fechar navegação" onClick={() => setOpen(false)}/>}<XpexSidebar role={role} organizationSlug={organizationSlug} adminAccess={adminAccess} adminNavigation={adminNavigation} open={open} close={() => setOpen(false)}/><div className="xpex-workspace"><XpexTopbar role={role} displayName={displayName} organizationSlug={organizationSlug} adminNavigation={adminNavigation} openMenu={() => setOpen(true)} menuOpen={open} menuButtonRef={menuButton}/>{!adminNavigation && allowedRoles.length > 1 && <nav className="xpex-role-switcher" aria-label="Alternar papel autorizado">{allowedRoles.map(item => <Link key={item} href={`/xpex/${item}`} aria-current={item === role ? 'page' : undefined}>{roleLabels[item]}</Link>)}</nav>}<main id="conteudo-xpex" tabIndex={-1} className="xpex-content">{children}</main></div></div>
}
