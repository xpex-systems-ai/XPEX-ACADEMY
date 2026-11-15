import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/** Read-only readiness signal; never reports credentials, backend host or student data. */
export async function GET() {
  const headers = { 'Cache-Control': 'no-store' }
  const raw = process.env.NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL
  if (!raw) return NextResponse.json({ academy: 'not-ready', api: 'not-configured', polo: 'blocked', enrollment: 'blocked' }, { status: 503, headers })

  let url: URL
  try {
    url = new URL(raw)
    if (url.protocol !== 'https:' || url.username || url.password || !url.hostname || url.hostname === 'localhost') throw new Error('invalid')
  } catch {
    return NextResponse.json({ academy: 'not-ready', api: 'invalid-configuration', polo: 'blocked', enrollment: 'blocked' }, { status: 503, headers })
  }

  try {
    const endpoint = new URL('/api/v1/instance/info', url)
    const response = await fetch(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(5000), redirect: 'manual' })
    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json({ academy: 'not-ready', api: 'redirected', polo: 'blocked', enrollment: 'blocked' }, { status: 503, headers })
    }
    if (!response.ok) {
      return NextResponse.json({ academy: 'not-ready', api: 'backend-http-error', polo: 'blocked', enrollment: 'blocked' }, { status: 503, headers })
    }
    return NextResponse.json({ academy: 'partial', api: 'reachable', polo: 'not-yet-verified', enrollment: 'not-yet-verified' }, { headers })
  } catch (error) {
    const timeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
    return NextResponse.json({ academy: 'not-ready', api: timeout ? 'timeout' : 'network-error', polo: 'blocked', enrollment: 'blocked' }, { status: 503, headers })
  }
}
