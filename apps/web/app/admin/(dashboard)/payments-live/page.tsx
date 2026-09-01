'use client'

import { useEffect, useState } from 'react'

const LIVE_TEST_AMOUNT = 1
const CHECKOUT_STORAGE_KEY = 'xpex_mp_live_checkout_id'
const ORG_STORAGE_KEY = 'xpex_mp_live_org_slug'

type CheckoutStatus = {
  checkout_id: string
  preference_id: string
  status: string
  organization_id: number
  course_uuid: string | null
  title: string
  quantity: number
  unit_price: number
  currency: string
  external_reference: string
  updated_at: string
}

export default function PaymentsLivePage() {
  const [organizationSlug, setOrganizationSlug] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [returnResult, setReturnResult] = useState<string | null>(null)
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus | null>(null)

  useEffect(() => {
    const storedOrg = window.sessionStorage.getItem(ORG_STORAGE_KEY)
    if (storedOrg) setOrganizationSlug(storedOrg)

    const params = new URLSearchParams(window.location.search)
    const result = params.get('result')
    setReturnResult(result)

    const checkoutId = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY)
    if (result && checkoutId) {
      void loadCheckoutStatus(checkoutId)
    }
  }, [])

  async function loadCheckoutStatus(checkoutId: string) {
    setStatusLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/v1/xpex/mercadopago/checkout/${encodeURIComponent(checkoutId)}`,
        { credentials: 'include' },
      )
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.detail || `Falha ao consultar checkout (HTTP ${response.status})`)
      }
      setCheckoutStatus(data as CheckoutStatus)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha inesperada ao consultar checkout.')
    } finally {
      setStatusLoading(false)
    }
  }

  async function createLiveCheckout() {
    if (!confirmed || loading || !organizationSlug.trim()) return
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

      if (!data?.checkout_id || !data?.init_point) {
        throw new Error('Mercado Pago não retornou uma resposta live completa de checkout.')
      }

      window.sessionStorage.setItem(CHECKOUT_STORAGE_KEY, data.checkout_id)
      window.sessionStorage.setItem(ORG_STORAGE_KEY, organizationSlug.trim())
      window.location.assign(data.init_point)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha inesperada ao criar checkout.')
      setLoading(false)
    }
  }

  const hasReturnedCheckout = Boolean(returnResult && checkoutStatus)

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

      {returnResult && (
        <section className="mb-6 rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
            Retorno do Mercado Pago: {returnResult}
          </p>
          {statusLoading && <p className="mt-3 text-sm text-white/60">Consultando ledger…</p>}
          {checkoutStatus && (
            <div className="mt-4 space-y-2 text-sm text-white/75">
              <p><span className="text-white/45">Checkout:</span> {checkoutStatus.checkout_id}</p>
              <p><span className="text-white/45">Preference:</span> {checkoutStatus.preference_id}</p>
              <p><span className="text-white/45">Status reconciliado:</span> {checkoutStatus.status}</p>
              <p><span className="text-white/45">Valor:</span> R$ {checkoutStatus.unit_price.toFixed(2)} {checkoutStatus.currency}</p>
              <p className="text-xs text-white/45">
                O parâmetro de retorno do navegador é apenas informativo. O status acima vem do ledger autenticado do backend, atualizado pelo webhook verificado.
              </p>
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
        <label className="block text-sm font-medium text-white/80" htmlFor="organizationSlug">
          Organização
        </label>
        <input
          id="organizationSlug"
          value={organizationSlug}
          onChange={(event) => setOrganizationSlug(event.target.value)}
          placeholder="Informe o slug real da organização"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-emerald-400/60"
          autoComplete="off"
        />
        <p className="mt-2 text-xs text-white/40">
          O teste não assume uma organização chamada “default”. Informe explicitamente a organização autorizada.
        </p>

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
          disabled={!confirmed || loading || !organizationSlug.trim() || hasReturnedCheckout}
          className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {hasReturnedCheckout
            ? 'Checkout anterior identificado — revise o status acima'
            : loading
              ? 'Criando checkout seguro…'
              : 'Criar checkout live de R$ 1,00'}
        </button>

        {checkoutStatus && (
          <button
            type="button"
            onClick={() => void loadCheckoutStatus(checkoutStatus.checkout_id)}
            disabled={statusLoading}
            className="mt-3 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/75 transition hover:bg-white/[0.05] disabled:opacity-40"
          >
            {statusLoading ? 'Atualizando status…' : 'Atualizar status do ledger'}
          </button>
        )}
      </section>
    </main>
  )
}
