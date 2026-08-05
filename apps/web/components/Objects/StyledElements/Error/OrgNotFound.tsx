'use client'

import { ArrowRight, Building2, ShieldCheck, Sparkles } from 'lucide-react'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import { getLEARNHOUSE_DOMAIN_VAL } from '@services/config/config'
import { stripPort } from '@services/utils/ts/hostUtils'

function OrgNotFound() {
  const [orgSlug, setOrgSlug] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)

  const baseDomain = useMemo(
    () => stripPort(getLEARNHOUSE_DOMAIN_VAL()),
    [],
  )
  const organizationRoutingAvailable =
    Boolean(baseDomain) && baseDomain !== 'localhost' && !baseDomain.endsWith('.localhost')

  const handleNavigate = (event: React.FormEvent) => {
    event.preventDefault()
    if (!organizationRoutingAvailable || !orgSlug.trim()) return

    setIsNavigating(true)
    const cleanSlug = orgSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    const protocol = window.location.protocol + '//'
    const port = window.location.port
    const portSuffix = port && port !== '80' && port !== '443' ? `:${port}` : ''

    window.location.href = `${protocol}${cleanSlug}.${baseDomain}${portSuffix}/login`
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02050B] px-5 py-10 text-slate-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,106,0,0.20),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(8,124,255,0.20),transparent_28%),linear-gradient(145deg,#02050B_0%,#050D18_55%,#02050B_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#081321]/90 shadow-2xl backdrop-blur-xl lg:grid-cols-[.9fr_1.1fr]">
          <div className="border-b border-white/10 bg-gradient-to-br from-[#FF6A00]/15 via-[#050D18] to-[#087CFF]/15 p-8 lg:border-b-0 lg:border-r lg:p-12">
            <Link href="/" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9FF]">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#FF6A00] to-[#FF8A2A] text-lg font-black text-white shadow-[0_0_32px_rgba(255,106,0,.28)]">XP</span>
              <span>
                <strong className="block tracking-[.2em] text-white">XpeX</strong>
                <small className="text-[10px] font-bold uppercase tracking-[.24em] text-slate-400">Academy</small>
              </span>
            </Link>

            <div className="mt-12">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#16D9FF]/20 bg-[#16D9FF]/10 px-3 py-1 text-xs font-bold text-[#16D9FF]">
                <Sparkles size={14} aria-hidden="true" /> Portal Beta
              </span>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-white md:text-5xl">
                Seu acesso começa pelo polo.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
                A área institucional está em integração com o ambiente persistente. Enquanto isso, as experiências públicas permanecem disponíveis para apresentação e validação.
              </p>
            </div>

            <div className="mt-10 grid gap-3 text-sm text-slate-300">
              <div className="flex items-center gap-3"><ShieldCheck className="text-[#16D9FF]" size={18} aria-hidden="true" /> Ambiente demonstrativo e transparente</div>
              <div className="flex items-center gap-3"><Building2 className="text-[#FF8A2A]" size={18} aria-hidden="true" /> Acesso por organização quando configurado</div>
            </div>
          </div>

          <div className="p-8 lg:p-12">
            <p className="text-xs font-black uppercase tracking-[.24em] text-[#FF8A2A]">Acesso institucional</p>
            <h2 className="mt-3 text-2xl font-black text-white">Informe o código da organização</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Este campo será usado por polos e organizações quando o domínio institucional estiver conectado.
            </p>

            <form onSubmit={handleNavigate} className="mt-8">
              <label htmlFor="xpex-org-slug" className="text-sm font-bold text-slate-200">Código do polo ou organização</label>
              <div className="mt-3 flex items-center rounded-2xl border border-white/10 bg-black/25 p-3 focus-within:border-[#16D9FF]/60 focus-within:ring-2 focus-within:ring-[#16D9FF]/15">
                <input
                  id="xpex-org-slug"
                  type="text"
                  value={orgSlug}
                  onChange={(event) => setOrgSlug(event.target.value)}
                  placeholder="exemplo-polo"
                  className="min-w-0 flex-1 bg-transparent px-2 text-white outline-none placeholder:text-slate-600"
                  autoComplete="organization"
                  disabled={!organizationRoutingAvailable}
                />
                {organizationRoutingAvailable && (
                  <span className="hidden text-xs text-slate-500 sm:block">.{baseDomain}</span>
                )}
              </div>

              {!organizationRoutingAvailable && (
                <p className="mt-3 rounded-xl border border-[#FF6A00]/20 bg-[#FF6A00]/10 px-4 py-3 text-sm leading-6 text-[#FFB26F]">
                  O roteamento institucional ainda não está ativo neste ambiente Beta. Nenhum dado de acesso foi enviado.
                </p>
              )}

              <button
                type="submit"
                disabled={!organizationRoutingAvailable || !orgSlug.trim() || isNavigating}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6A00] px-5 py-3.5 font-black text-white transition hover:bg-[#FF8A2A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isNavigating ? 'Abrindo organização…' : 'Continuar para o acesso'}
                {!isNavigating && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </button>
            </form>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link href="/beta/aluno" className="rounded-2xl border border-[#16D9FF]/20 bg-[#16D9FF]/10 px-4 py-3 text-center text-sm font-bold text-[#16D9FF] transition hover:bg-[#16D9FF]/15">Explorar experiência Beta</Link>
              <Link href="/" className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-slate-200 transition hover:bg-white/5">Voltar à página inicial</Link>
            </div>

            <p className="mt-8 text-center text-xs leading-5 text-slate-600">
              XpeX Academy • Experiência Beta • Dados demonstrativos, sem persistência neste portal.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default OrgNotFound
