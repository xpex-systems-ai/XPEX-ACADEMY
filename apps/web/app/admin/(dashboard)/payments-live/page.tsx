'use client'

import { useState } from 'react'

const LIVE_TEST_AMOUNT = 1

export default function PaymentsLivePage() {
  const [organizationSlug, setOrganizationSlug] = useState('default')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createLiveCheckout() {
    if (!confirmed || loading) return
    setLoading(true)
    setError(null)

    try {
      const origin = window.location.origin
      const response = await fetch('/api/v1/xpex/mercadopago/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_slug: organizationSlug.trim(),
          title: 'XPeX MP LIVE-003 — verificação financeira',
          unit_price: LIVE_TEST_AMOUNT,
          quantity: 1,
          success_url: `${origin}/admin/payments-live?result=success`,
          pending_url: `${origin}/admin/payments-live?result=pending`,
          failure_url: `${origin}/admin/payments-live?result=failure`,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.detail || `Falha ao criar checkout (HTTP ${response.status})`)
      }

      if (!data?.init_point) {
        throw new Error('Mercado Pago não retornou URL live de checkout.')
      }

      window.location.assign(data.init_point)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha inesperada ao criar checkout.')
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-white">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          XPEX-MP-LIVE-003
        </p>
        <h1 className="text-3xl font-semibold">Prova financeira live</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
          Este fluxo cria um checkout real e controlado de R$ 1,00. Ele serve apenas para validar
          checkout → Mercado Pago → webhook → reconciliação → ledger. Nenhum acesso a curso ou
          progresso do LearnHouse é liberado automaticamente.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
        <label className="block text-sm font-medium text-white/80" htmlFor="organizationSlug">
          Organização
        </label>
        <input
          id="organizationSlug"
          value={organizationSlug}
          onChange={(event) => setOrganizationSlug(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-emerald-400/60"
          autoComplete="off"
        />

        <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
          <p className="text-sm font-semibold text-amber-300">Cobrança real: R$ 1,00</p>
          <p className="mt-1 text-xs leading-5 text-white/55">
            O backend continua aplicando autorização por organização, validação live/sandbox,
            valor, moeda, idempotência e proteção contra webhooks fora de ordem.
          </p>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>Confirmo que desejo iniciar agora um checkout real de R$ 1,00 para esta verificação.</span>
        </label>

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={createLiveCheckout}
          disabled={!confirmed || loading || !organizationSlug.trim()}
          className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? 'Criando checkout seguro…' : 'Criar checkout live de R$ 1,00'}
        </button>
      </section>
    </main>
  )
}
