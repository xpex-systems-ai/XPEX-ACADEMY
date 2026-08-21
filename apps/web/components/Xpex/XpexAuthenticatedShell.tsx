'use client'

import { signOut } from '@components/Contexts/AuthContext'
import { Bell, LogOut, Menu, MessageCircle, Search, ShieldCheck, X } from 'lucide-react'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { xpexAuthenticatedNavigation } from './xpex-navigation'
import type { XpexRole } from './xpex-types'
import './xpex.css'

const roleLabels: Record<XpexRole, string> = { aluno: 'Aluno', professora: 'Professora', polo: 'Polo' }

export function XpexLegalAttribution() {
  return <footer className="xpex-legal" aria-label="Informações legais">
    <span>XpeX Academy</span><span>Versão modificada do projeto open-source LearnHouse.</span>
    <a href="https://github.com/xpex-systems-ai/XPEX-ACADEMY/blob/dev/LICENSE">Licença AGPL-3.0</a>
    <a href="https://github.com/xpex-systems-ai/XPEX-ACADEMY">Código-fonte correspondente</a>
  </footer>
}

export function XpexRoleNavigation({ role, onNavigate }: { role: XpexRole; onNavigate?: () => void }) {
  return <nav className="xpex-role-nav" aria-label={`Navegação da área ${roleLabels[role]}`}>
    {xpexAuthenticatedNavigation[role].map(({ label, icon: Icon }, index) => index === 0 ? (
      <Link key={label} href={`/xpex/${role}`} aria-current="page" onClick={onNavigate} className="xpex-nav-item xpex-nav-active">
        <Icon aria-hidden="true" size={18}/><span>{label}</span>
      </Link>
    ) : (
      <span key={label} className="xpex-nav-item xpex-nav-disabled" aria-disabled="true" title="Em breve">
        <Icon aria-hidden="true" size={18}/><span>{label}</span><small>Em breve</small>
      </span>
    ))}
  </nav>
}

export function XpexSidebar({ role, open, close }: { role: XpexRole; open: boolean; close: () => void }) {
  return <aside id="xpex-sidebar" aria-label="Menu principal XpeX" className={`xpex-sidebar ${open ? 'is-open' : ''}`}>
    <div className="xpex-brand-row"><Link href="/xpex" className="xpex-brand" aria-label="XpeX Academy — início"><span aria-hidden="true">XP</span><strong>XpeX<small>Academy</small></strong></Link><button className="xpex-icon-button xpex-mobile-only" onClick={close} aria-label="Fechar menu"><X size={20}/></button></div>
    <p className="xpex-nav-label">Ecossistema autenticado</p><XpexRoleNavigation role={role} onNavigate={close}/>
    <div className="xpex-session-card"><ShieldCheck aria-hidden="true" size={17}/><div><strong>Sessão protegida</strong><span>Permissões validadas no servidor</span></div></div>
    <XpexLegalAttribution/>
  </aside>
}

export function XpexTopbar({ role, displayName, openMenu }: { role: XpexRole; displayName: string; openMenu: () => void }) {
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'XP'
  return <header className="xpex-topbar">
    <button className="xpex-icon-button xpex-mobile-only" onClick={openMenu} aria-label="Abrir menu" aria-controls="xpex-sidebar"><Menu size={20}/></button>
    <label className="xpex-search"><Search aria-hidden="true" size={18}/><span className="sr-only">Buscar na XpeX Academy</span><input placeholder="Buscar na Academy" disabled aria-describedby="xpex-search-status"/><span id="xpex-search-status" className="sr-only">Busca em breve</span></label>
    <div className="xpex-top-actions"><button className="xpex-icon-button" disabled aria-label="Notificações — em breve"><Bell size={18}/></button><button className="xpex-icon-button xpex-hide-small" disabled aria-label="Mensagens — em breve"><MessageCircle size={18}/></button>
      <div className="xpex-profile" aria-label={`Usuário: ${displayName}, papel: ${roleLabels[role]}`}><span className="xpex-avatar">{initials}</span><span><strong>{displayName}</strong><small>{roleLabels[role]}</small></span></div>
      <button type="button" onClick={() => signOut({ redirect: true, callbackUrl: '/login' })} className="xpex-icon-button" aria-label="Sair da XpeX Academy"><LogOut size={18}/></button>
    </div>
  </header>
}

export function XpexAuthenticatedShell({ role, allowedRoles, displayName, children }: { role: XpexRole; allowedRoles: XpexRole[]; displayName: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return <div className="xpex-root xpex-authenticated">
    <a href="#conteudo-xpex" className="xpex-skip">Pular para o conteúdo</a>
    {open && <button className="xpex-drawer-backdrop" aria-label="Fechar navegação" onClick={() => setOpen(false)}/>}
    <XpexSidebar role={role} open={open} close={() => setOpen(false)}/>
    <div className="xpex-workspace"><XpexTopbar role={role} displayName={displayName} openMenu={() => setOpen(true)}/>
      {allowedRoles.length > 1 && <nav className="xpex-role-switcher" aria-label="Alternar papel autorizado">{allowedRoles.map(item => <Link key={item} href={`/xpex/${item}`} aria-current={item === role ? 'page' : undefined}>{roleLabels[item]}</Link>)}</nav>}
      <main id="conteudo-xpex" tabIndex={-1} className="xpex-content">{children}</main>
    </div>
  </div>
}
