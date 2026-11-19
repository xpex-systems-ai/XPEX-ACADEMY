'use client'
import { useEffect, useState } from 'react'

type Invite = { role?: string; polo_id?: string }
type SessionData = { authenticated?: boolean; invites?: Invite[]; polos?: { id: string; name: string }[] }
export default function AcademyEntry() {
  const [status, setStatus] = useState('Verificando acesso à Academy…')
  const [invites, setInvites] = useState<Invite[]>([])
  const [polos, setPolos] = useState<{ id: string; name: string }[]>([])
  const [googleAvailable, setGoogleAvailable] = useState(false)
  useEffect(() => {
    let active = true
    fetch('/api/academia/oauth/status', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { googleAvailable: false })
      .then(data => { if (active) setGoogleAvailable(data.googleAvailable === true) })
      .catch(() => { if (active) setGoogleAvailable(false) })
    fetch('/api/academia', { credentials: 'same-origin', cache: 'no-store' })
      .then(async r => {
        if (!r.ok) throw new Error('Acesso ainda não autorizado ou dados indisponíveis.')
        return r.json() as Promise<SessionData>
      })
      .then(data => {
        if (!active) return
        if (!data.authenticated || !Array.isArray(data.invites) || data.invites.length === 0) throw new Error('Conta sem convite acadêmico ativo.')
        setInvites(data.invites)
        setPolos(Array.isArray(data.polos) ? data.polos : [])
        setStatus('Acesso autorizado. Selecione seu ambiente.')
      })
      .catch(e => { if (active) setStatus(e instanceof Error ? e.message : 'Não foi possível verificar o acesso.') })
    return () => { active = false }
  }, [])
  return <main className="min-h-screen bg-[#05080D] text-white flex items-center justify-center p-6">
    <section className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#101A2B] p-8 space-y-6">
      <h1 className="text-3xl font-bold">XPeX Academy · Acesso</h1>
      <p role="status" className="text-slate-300">{status}</p>
      {invites.length > 0 ? <div className="space-y-3">{invites.map((invite, i) => {
        const polo = polos.find(p => p.id === invite.polo_id)
        const role = invite.role === 'admin' ? 'Gestão acadêmica piloto' : invite.role === 'teacher' ? 'Polo piloto / professora' : invite.role === 'student' ? 'Aluno / Academy' : 'Acesso acadêmico'
        // The legacy /xpex panels use LearnHouse authentication and cannot consume pilot cookies.
        // Always enter the Supabase/RLS-scoped Academy until explicit server-side SSO is implemented.
        const href = invite.role === 'teacher' || invite.role === 'admin' ? '/academia?section=polo' : '/academia?section=cursos'
        return <a key={i} href={href} className="block rounded-xl border border-cyan-400/30 p-4 hover:bg-white/10">{role}{polo ? ' · ' + polo.name : ''} →</a>
      })}</div> : <div className="space-y-3">
        {googleAvailable
          ? <a className="block rounded-xl bg-white p-4 text-center font-bold text-slate-900" href="/api/academia/oauth/google">Continuar com Google (piloto)</a>
          : <p className="rounded-xl border border-amber-300/30 p-3 text-sm text-amber-200">Google em preparação no ambiente piloto. Use o acesso por e-mail.</p>}
        <a className="block rounded-xl border border-white/25 p-4 text-center" href="/academia">Entrar com e-mail</a>
      </div>}
      <p className="text-xs text-slate-400">Acesso restrito a convites verificados por Supabase Auth e RLS. O Polo e a gestão nesta etapa são visões do piloto /academia; os painéis antigos /xpex exigem login independente. Nenhuma permissão é concedida por este menu.</p>
    </section>
  </main>
}
