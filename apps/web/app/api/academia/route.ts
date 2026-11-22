import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Isolated pilot. Never use LearnHouse/legacy credentials here.
const ACCESS_COOKIE = 'xpex_pilot_access'
const REFRESH_COOKIE = 'xpex_pilot_refresh'
const COOKIE_PATH = '/api/academia'
type Session = { token: string; refresh?: string; user: { id: string; email?: string }; rotated?: boolean }

function settings() {
  const url = process.env.XPEX_PILOT_SUPABASE_URL
  const key = process.env.XPEX_PILOT_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) return null
  return { url, key }
}
function result(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' } })
}
function cookieOptions(maxAge: number) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: COOKIE_PATH, maxAge }
}
function setSession(response: NextResponse, access: string, refresh: string, expiresIn: number) {
  response.cookies.set(ACCESS_COOKIE, access, cookieOptions(Math.min(Math.max(expiresIn - 30, 60), 3600)))
  response.cookies.set(REFRESH_COOKIE, refresh, cookieOptions(30 * 24 * 3600))
}
async function authFetch(base: { url: string; key: string }, path: string, init: RequestInit = {}) {
  return fetch(base.url + '/auth/v1' + path, {
    ...init,
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
    headers: { apikey: base.key, 'Content-Type': 'application/json', ...(init.headers || {}) },
  })
}
async function session(req: NextRequest, base: { url: string; key: string }): Promise<Session | null> {
  let token = req.cookies.get(ACCESS_COOKIE)?.value
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value
  if (token) {
    try {
      const check = await authFetch(base, '/user', { headers: { Authorization: 'Bearer ' + token } })
      if (check.ok) {
        const user = await check.json()
        if (typeof user?.id === 'string' && user.email_confirmed_at) return { token, user }
      }
    } catch { /* Attempt safe refresh below. */ }
  }
  if (!refresh) return null
  try {
    const response = await authFetch(base, '/token?grant_type=refresh_token', {
      method: 'POST', body: JSON.stringify({ refresh_token: refresh }),
    })
    if (!response.ok) return null
    const data = await response.json()
    if (typeof data.access_token !== 'string' || typeof data.refresh_token !== 'string' || !data.user?.id || !data.user.email_confirmed_at) return null
    return { token: data.access_token, refresh: data.refresh_token, user: data.user, rotated: true }
  } catch { return null }
}
function persistIfRotated(response: NextResponse, active: Session) {
  if (active.rotated && active.refresh) setSession(response, active.token, active.refresh, 3600)
  return response
}
async function databaseFetch(base: { url: string; key: string }, token: string, table: string, params = '', init: RequestInit = {}) {
  return fetch(base.url + '/rest/v1/' + table + params, {
    ...init,
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
    headers: {
      apikey: base.key,
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
}
async function records(base: { url: string; key: string }, token: string, table: string, params: string) {
  const response = await databaseFetch(base, token, table, params)
  if (!response.ok) throw new Error('database_' + response.status)
  return response.json()
}
const isUuid = (s: unknown): s is string => typeof s === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s)

export async function GET(req: NextRequest) {
  const base = settings()
  if (!base) return result({ error: 'Integração acadêmica ainda não configurada.' }, 503)
  const active = await session(req, base)
  if (!active) return result({ authenticated: false }, 401)
  if (req.nextUrl.searchParams.get('view') === 'session') {
    return persistIfRotated(result({ authenticated: true, user: { id: active.user.id, email: active.user.email } }), active)
  }
  try {
    // PostgreSQL RLS independently filters every row by verified Supabase Auth identity.
    const [invites, polos, courses, enrollments, lessons, progress] = await Promise.all([
      records(base, active.token, 'academy_pilot_invites', '?select=role,polo_id,email'),
      records(base, active.token, 'academy_polos', '?select=id,name,slug'),
      records(base, active.token, 'academy_courses', '?select=id,polo_id,title,description,slug,published&order=created_at.asc'),
      records(base, active.token, 'academy_enrollments', '?select=id,course_id,created_at'),
      records(base, active.token, 'academy_lessons', '?select=id,course_id,title,body,position&order=position.asc'),
      records(base, active.token, 'academy_progress', '?select=id,enrollment_id,lesson_id,completed_at'),
    ])
    return persistIfRotated(result({
      authenticated: true, user: { id: active.user.id, email: active.user.email },
      invites, polos, courses, enrollments, lessons, progress,
      source: 'supabase-rls-private-pilot', legacyImported: false,
    }), active)
  } catch {
    return result({ error: 'Não foi possível consultar o banco acadêmico. Nenhum progresso foi simulado.' }, 503)
  }
}

export async function POST(req: NextRequest) {
  // SameSite cookie + origin check on every write to protect against CSRF.
  const origin = req.headers.get('origin')
  if (origin) {
    try {
      if (new URL(origin).host !== req.nextUrl.host) return result({ error: 'Origem não autorizada.' }, 403)
    } catch { return result({ error: 'Origem inválida.' }, 403) }
  }
  const base = settings()
  if (!base) return result({ error: 'Integração acadêmica ainda não configurada.' }, 503)
  const body = await req.json().catch(() => null)
  if (!body || typeof body.action !== 'string') return result({ error: 'Solicitação inválida.' }, 400)
  if (body.action === 'verify_link') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const allowed = (process.env.XPEX_PILOT_ALLOWED_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean)
    if (!allowed.includes(email)) return result({ error: 'Conta não autorizada para este Polo.' }, 403)
    // The default Supabase email template sends a magic link instead of the six-digit OTP.
    // In the pilot, users can securely paste that one-time link into the Academy itself,
    // avoiding unconfigured external redirect URLs. Never store or log token/link values.
    let tokenHash = ''
    let type = ''
    try {
      const link = new URL(typeof body.link === 'string' ? body.link : '')
      if (link.origin !== base.url || link.pathname !== '/auth/v1/verify') throw new Error('origin')
      tokenHash = link.searchParams.get('token') || link.searchParams.get('token_hash') || ''
      type = link.searchParams.get('type') || ''
      if (!/^[a-zA-Z0-9_-]{24,160}$/.test(tokenHash) || !['magiclink', 'email', 'signup'].includes(type)) throw new Error('invalid')
    } catch {
      return result({ error: 'Cole o link completo enviado pelo Supabase. Não cole links de outros sites.' }, 400)
    }
    try {
      const verify = await authFetch(base, '/verify', {
        method: 'POST', body: JSON.stringify({ token_hash: tokenHash, type }),
      })
      if (verify.status === 429) return result({ error: 'Muitas tentativas. Aguarde antes de tentar novamente.' }, 429)
      if (!verify.ok) return result({ error: 'O link expirou ou já foi usado. Aguarde para solicitar outro.' }, 401)
      const data = await verify.json()
      if (!data.user?.email_confirmed_at || data.user.email?.toLowerCase() !== email || !data.access_token || !data.refresh_token) {
        return result({ error: 'Identidade não confirmada para este e-mail.' }, 401)
      }
      const out = result({ authenticated: true, user: { id: data.user.id, email: data.user.email } })
      setSession(out, data.access_token, data.refresh_token, Number(data.expires_in) || 3600)
      return out
    } catch {
      return result({ error: 'Não foi possível validar seu link de acesso.' }, 503)
    }
  }
  if (body.action === 'request_code' || body.action === 'verify_code') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const allowed = (process.env.XPEX_PILOT_ALLOWED_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean)
    if (!/^\S+@\S+\.\S+$/.test(email) || !allowed.includes(email)) {
      return result({ error: 'Acesso restrito às contas convidadas para o Polo Kelle.' }, 403)
    }
    if (body.action === 'request_code') {
      try {
        // Supabase sends a Magic Link by default. To use a six-digit code,
        // configure its Magic Link email template with {{ .Token }}.
        const response = await authFetch(base, '/otp', {
          method: 'POST',
          body: JSON.stringify({ email, create_user: false }),
        })
        if (response.status === 429) return result({ error: 'Limite de e-mails atingido. Aguarde a liberação do Supabase antes de solicitar outro código.' }, 429)
        if (!response.ok) return result({ error: 'Não foi possível enviar o acesso. Confira a configuração de e-mail do Supabase Auth.' }, 503)
        return result({ success: true, message: 'Solicitação recebida. Confira seu e-mail. Se chegar um link em vez de código, o modelo OTP ainda precisa ser configurado no Supabase.' })
      } catch {
        return result({ error: 'O serviço de envio está indisponível. Nenhum código foi confirmado.' }, 503)
      }
    }
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    if (!/^\d{6}$/.test(code)) return result({ error: 'Informe o código de seis dígitos enviado ao e-mail.' }, 400)
    try {
      const response = await authFetch(base, '/verify', {
        method: 'POST',
        body: JSON.stringify({ type: 'email', email, token: code }),
      })
      if (response.status === 429) return result({ error: 'Muitas tentativas. Aguarde antes de tentar novamente.' }, 429)
      if (!response.ok) return result({ error: 'Código inválido ou expirado. Confira o e-mail mais recente.' }, 401)
      const data = await response.json().catch(() => ({}))
      if (!data.user?.email_confirmed_at || !data.access_token || !data.refresh_token) {
        return result({ error: 'O Supabase não confirmou a identidade. O acesso não foi concedido.' }, 401)
      }
      const out = result({ authenticated: true, user: { id: data.user.id, email: data.user.email } })
      setSession(out, data.access_token, data.refresh_token, Number(data.expires_in) || 3600)
      return out
    } catch {
      return result({ error: 'Não foi possível verificar o código.' }, 503)
    }
  }
  if (body.action === 'login' || body.action === 'signup') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 10 || password.length > 128) return result({ error: 'Informe um e-mail válido e senha de pelo menos 10 caracteres.' }, 400)
    // Private pilot: prohibit unsolicited Auth signups even before RLS is evaluated.
    if (body.action === 'signup') {
      const allowed = (process.env.XPEX_PILOT_ALLOWED_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean)
      if (!allowed.includes(email)) return result({ error: 'Cadastro fechado: solicite autorização para o Polo Kelle.' }, 403)
    }
    try {
      const response = await authFetch(base, body.action === 'signup' ? '/signup' : '/token?grant_type=password', {
        method: 'POST', body: JSON.stringify({ email, password }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) return result({ error: response.status === 429 ? 'Muitas tentativas. Tente novamente mais tarde.' : body.action === 'login' ? 'Não foi possível entrar. Se este é seu primeiro acesso, clique em Cadastrar conta autorizada e confirme o e-mail antes do login.' : 'Cadastro não concluído. Verifique se seu e-mail está autorizado, a senha e as orientações de confirmação.' }, response.status === 429 ? 429 : 400)
      if (data.access_token && data.refresh_token && data.user?.id && data.user.email_confirmed_at) {
        const out = result({ authenticated: true, user: { id: data.user.id, email: data.user.email } })
        setSession(out, data.access_token, data.refresh_token, Number(data.expires_in) || 3600)
        return out
      }
      return result({ confirmationRequired: true, message: 'Confira seu e-mail e confirme a conta antes de entrar.' })
    } catch {
      return result({ error: 'Serviço de login indisponível. Tente novamente.' }, 503)
    }
  }
  const active = await session(req, base)
  if (!active) return result({ error: 'Faça login novamente.' }, 401)
  if (body.action === 'logout') {
    try { await authFetch(base, '/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + active.token } }) } catch { /* Logout is best-effort; the browser cookies are cleared below. */ }
    const out = result({ authenticated: false })
    out.cookies.set(ACCESS_COOKIE, '', cookieOptions(0))
    out.cookies.set(REFRESH_COOKIE, '', cookieOptions(0))
    return out
  }
  if (body.action === 'enroll' && isUuid(body.courseId)) {
    try {
      const res = await databaseFetch(base, active.token, 'academy_enrollments', '?on_conflict=user_id,course_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
        body: JSON.stringify({ user_id: active.user.id, course_id: body.courseId }),
      })
      if (!res.ok) return result({ error: 'Matrícula negada. Verifique seu convite e as permissões do Polo.' }, res.status === 403 ? 403 : 409)
      // A successful INSERT with ignore-duplicates can return no rows; verify the
      // authorized record through RLS before reporting persistence.
      const saved = await records(base, active.token, 'academy_enrollments',
        '?select=id&user_id=eq.' + encodeURIComponent(active.user.id) + '&course_id=eq.' + encodeURIComponent(body.courseId) + '&limit=1')
      if (!Array.isArray(saved) || saved.length !== 1 || !isUuid(saved[0]?.id)) {
        return result({ error: 'Matrícula ainda não confirmada. Consulte novamente antes de repetir a operação.' }, 503)
      }
      return persistIfRotated(result({ success: true, enrollmentId: saved[0].id, message: 'Matrícula confirmada no banco acadêmico.' }), active)
    } catch { return result({ error: 'Não foi possível registrar a matrícula.' }, 503) }
  }
  if (body.action === 'complete' && isUuid(body.enrollmentId) && isUuid(body.lessonId)) {
    try {
      const res = await databaseFetch(base, active.token, 'academy_progress', '?on_conflict=enrollment_id,lesson_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
        body: JSON.stringify({ user_id: active.user.id, enrollment_id: body.enrollmentId, lesson_id: body.lessonId }),
      })
      if (!res.ok) return result({ error: 'Progresso não autorizado para esta matrícula ou aula.' }, 403)
      // Confirm the persisted row under the student's own RLS-scoped token.
      const saved = await records(base, active.token, 'academy_progress',
        '?select=id&user_id=eq.' + encodeURIComponent(active.user.id) + '&enrollment_id=eq.' + encodeURIComponent(body.enrollmentId) + '&lesson_id=eq.' + encodeURIComponent(body.lessonId) + '&limit=1')
      if (!Array.isArray(saved) || saved.length !== 1 || !isUuid(saved[0]?.id)) {
        return result({ error: 'Progresso ainda não confirmado. Consulte novamente antes de repetir a operação.' }, 503)
      }
      return persistIfRotated(result({ success: true, progressId: saved[0].id, message: 'Progresso confirmado no PostgreSQL.' }), active)
    } catch { return result({ error: 'Não foi possível salvar o progresso.' }, 503) }
  }
  return result({ error: 'Operação não disponível.' }, 400)
}
