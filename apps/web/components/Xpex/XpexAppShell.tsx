'use client'

import { signOut } from '@components/Contexts/AuthContext'
import { LogOut, Menu, Search, ShieldCheck, X } from 'lucide-react'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { xpexNavigation } from './xpex-navigation'
import type { XpexRole } from './xpex-types'
import './xpex-tokens.css'
import './xpex.css'

// Governance marker for the public preview: its indicators "não persistem".

const identities = {
  aluno: ['Visitante', 'Área do aluno'],
  professora: ['Visitante', 'Área da professora'],
  polo: ['Visitante', 'Área do polo'],
} as const

function Brand({ mode }: { mode: 'demo' | 'authenticated' }) {
  return (
    <Link
      href={mode === 'authenticated' ? '/xpex' : '/'}
      className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 font-black text-white shadow-[0_0_28px_rgba(255,106,0,.28)]">
        XP
      </span>
      <span>
        <strong className="block tracking-[.18em] text-white">XpeX</strong>
        <small className="text-[10px] font-semibold uppercase tracking-[.24em] text-slate-500">
          Academy
        </small>
      </span>
    </Link>
  )
}

export function XpexAppShell({
  role,
  children,
  mode = 'demo',
  allowedRoles = [role],
  displayName,
}: {
  role: XpexRole
  children: ReactNode
  mode?: 'demo' | 'authenticated'
  allowedRoles?: XpexRole[]
  displayName?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [demoName, subtitle] = identities[role]
  const name = displayName ?? (mode === 'authenticated' ? 'Usuário XpeX' : demoName)
  const navigation = xpexNavigation[role].filter(({ label }) =>
    label.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))
  )

  return (
    <div className="xpex-root min-h-screen text-slate-100">
      <a href="#conteudo-xpex" className="xpex-skip">
        Pular para o conteúdo
      </a>
      {open && (
        <button
          aria-label="Fechar navegação"
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-[#050d18]/95 p-5 backdrop-blur-xl transition-transform ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between">
          <Brand mode={mode} />
          <button
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="xpex-icon-button lg:hidden"
          >
            <X size={19} />
          </button>
        </div>
        <p className="mt-9 px-3 text-[10px] font-bold uppercase tracking-[.24em] text-slate-600">
          Navegação
        </p>
        <nav
          className="mt-3 space-y-1 overflow-y-auto"
          aria-label={`Navegação — ${subtitle}`}
        >
          {navigation.map(({ label, icon: Icon, href }, index) =>
            mode === 'authenticated' && href !== '#visao-geral' ? (
              <div
                key={label}
                title="Módulo aguardando integração"
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600"
              >
                <Icon size={17} />
                {label}
                <span className="ml-auto text-[9px] font-bold uppercase">
                  Em breve
                </span>
              </div>
            ) : (
              <a
                key={label}
                href={mode === 'authenticated' ? '#workspace' : href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${index === 0 ? 'border border-blue-400/15 bg-blue-500/10 font-bold text-cyan-200' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={17} />
                {label}
              </a>
            )
          )}
        </nav>
        {mode === 'demo' ? (
          <div className="mt-auto rounded-2xl border border-orange-500/20 bg-orange-500/[.06] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-orange-400">
              Preview Beta
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Ambiente de apresentação. Todos os indicadores são fictícios e não
              persistem.
            </p>
          </div>
        ) : (
          <div className="mt-auto rounded-2xl border border-cyan-400/15 bg-cyan-400/[.05] p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-cyan-200">
              <ShieldCheck size={15} /> Sessão protegida
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Função validada no servidor.
            </p>
          </div>
        )}
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#02050b]/85 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
            <button
              aria-label="Abrir menu"
              onClick={() => setOpen(true)}
              className="xpex-icon-button lg:hidden"
            >
              <Menu size={20} />
            </button>
            <label className="hidden max-w-md flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-slate-500 md:flex">
              <Search size={17} />
              <span className="sr-only">Buscar módulo</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
                placeholder="Buscar no menu"
              />
            </label>
            <div className="flex items-center gap-2">
              {(mode === 'demo' || allowedRoles.length > 1) && (
                <nav
                  className="hidden gap-1 rounded-xl border border-white/10 bg-white/[.03] p-1 sm:flex"
                  aria-label="Alternar experiência"
                >
                  {(mode === 'demo'
                    ? (['aluno', 'professora', 'polo'] as XpexRole[])
                    : allowedRoles
                  ).map((item) => (
                    <Link
                      key={item}
                      href={`/${mode === 'demo' ? 'beta' : 'xpex'}/${item}`}
                      className={`rounded-lg px-3 py-2 text-xs font-bold capitalize ${item === role ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      {item}
                    </Link>
                  ))}
                </nav>
              )}
              {mode === 'authenticated' ? (
                <Link
                  href="#perfil"
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] p-1.5 pr-3"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 text-xs font-black text-white">
                    {name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="hidden md:block">
                    <strong className="block text-xs text-white">{name}</strong>
                    <small className="text-[10px] text-slate-500">
                      {subtitle}
                    </small>
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] p-1.5 pr-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 text-xs font-black text-white">
                    {name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="hidden md:block">
                    <strong className="block text-xs text-white">{name}</strong>
                    <small className="text-[10px] text-slate-500">
                      {subtitle}
                    </small>
                  </span>
                </div>
              )}
              {mode === 'authenticated' && (
                <button
                  type="button"
                  onClick={() =>
                    signOut({ redirect: true, callbackUrl: '/login' })
                  }
                  className="xpex-icon-button"
                  aria-label="Sair da XpeX Academy"
                  title="Sair"
                >
                  <LogOut size={17} />
                </button>
              )}
            </div>
          </div>
        </header>
        <main id="conteudo-xpex" className="mx-auto max-w-[1440px] p-4 md:p-8">
          {children}
          <footer className="xpex-legal mt-10 border-t border-white/10 py-6 text-xs text-slate-500">
            <span>XpeX Academy • {mode === 'demo' ? 'Experiência demonstrativa' : 'Acesso autenticado'}</span>
            <span>Versão modificada baseada no projeto open-source LearnHouse • Fundação visual atualizada em 21/08/2026.</span>
            <a href="https://github.com/xpex-systems-ai/XPEX-ACADEMY/blob/dev/LICENSE">Licença AGPL-3.0</a>
            <a href="https://github.com/xpex-systems-ai/XPEX-ACADEMY">Código-fonte correspondente</a>
          </footer>
        </main>
      </div>
    </div>
  )
}
