import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'

export const dynamic = 'force-dynamic'
const COOKIE_PATH = '/api/academia/oauth'
const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: COOKIE_PATH, maxAge: 600 }

export async function GET(req: NextRequest) {
  const url = process.env.XPEX_PILOT_SUPABASE_URL
  const key = process.env.XPEX_PILOT_SUPABASE_PUBLISHABLE_KEY
  if (process.env.XPEX_PILOT_GOOGLE_OAUTH_ENABLED !== 'true' || !url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) {
    return NextResponse.json({ error: 'Login Google indisponível neste ambiente.' }, { status: 503 })
  }
  const verifier = randomBytes(48).toString('base64url')
  const state = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  const callback = new URL('/api/academia/oauth/callback', req.nextUrl.origin)
  // The exact preview origin must be configured in Supabase Auth's redirect allowlist.
  const authorize = new URL(url + '/auth/v1/authorize')
  authorize.searchParams.set('provider', 'google')
  authorize.searchParams.set('redirect_to', callback.toString())
  authorize.searchParams.set('code_challenge', challenge)
  authorize.searchParams.set('code_challenge_method', 's256')
  authorize.searchParams.set('state', state)
  const response = NextResponse.redirect(authorize)
  response.cookies.set('xpex_google_pkce', verifier, options)
  response.cookies.set('xpex_google_state', state, options)
  response.headers.set('Cache-Control', 'no-store')
  return response
}
