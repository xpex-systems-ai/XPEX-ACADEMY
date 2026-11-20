import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
const OAUTH_PATH = '/api/academia/oauth'
const SESSION_PATH = '/api/academia'
const secure = process.env.NODE_ENV === 'production'
function fail(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/academy/entry?error=google', req.url))
  response.cookies.set('xpex_google_pkce', '', { path: OAUTH_PATH, maxAge: 0 })
  response.cookies.set('xpex_google_state', '', { path: OAUTH_PATH, maxAge: 0 })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
export async function GET(req: NextRequest) {
  const url = process.env.XPEX_PILOT_SUPABASE_URL
  const key = process.env.XPEX_PILOT_SUPABASE_PUBLISHABLE_KEY
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const verifier = req.cookies.get('xpex_google_pkce')?.value
  const expectedState = req.cookies.get('xpex_google_state')?.value
  if (process.env.XPEX_PILOT_GOOGLE_OAUTH_ENABLED !== 'true' || !url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || !code || !verifier || !state || !expectedState || state !== expectedState) return fail(req)
  try {
    const exchanged = await fetch(url + '/auth/v1/token?grant_type=pkce', {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(12000),
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    })
    if (!exchanged.ok) return fail(req)
    const tokens = await exchanged.json()
    if (!tokens.access_token || !tokens.refresh_token || !tokens.user?.id || !tokens.user.email_confirmed_at) return fail(req)
    const email = String(tokens.user.email || '').trim().toLowerCase()
    const allowed = (process.env.XPEX_PILOT_ALLOWED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    // Google sign-in does not grant Academy membership. Existing allowlisted identities only.
    if (!email || !allowed.includes(email)) return fail(req)
    const response = NextResponse.redirect(new URL('/academy/entry', req.url))
    const cookieOptions = { httpOnly: true, secure, sameSite: 'lax' as const, path: SESSION_PATH }
    response.cookies.set('xpex_pilot_access', tokens.access_token, { ...cookieOptions, maxAge: Math.min(Math.max(Number(tokens.expires_in || 3600) - 30, 60), 3600) })
    response.cookies.set('xpex_pilot_refresh', tokens.refresh_token, { ...cookieOptions, maxAge: 30 * 24 * 3600 })
    response.cookies.set('xpex_google_pkce', '', { path: OAUTH_PATH, maxAge: 0 })
    response.cookies.set('xpex_google_state', '', { path: OAUTH_PATH, maxAge: 0 })
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch { return fail(req) }
}
