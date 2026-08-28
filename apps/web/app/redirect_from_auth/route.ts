import { NextRequest, NextResponse } from 'next/server'
import { safeAuthReturnPath } from '@/lib/proxyPaths'

export const dynamic = 'force-dynamic'

/**
 * Deterministic same-origin handoff after credentials/OAuth authentication.
 *
 * Authentication is already completed before the browser reaches this route.
 * Authorization stays at the destination itself (for example /xpex/admin),
 * avoiding duplicate session/API checks and redirect races in this bridge.
 */
export function GET(request: NextRequest) {
  const requested = safeAuthReturnPath(
    request.nextUrl.searchParams.get('next') ?? request.nextUrl.searchParams.get('redirect'),
  )

  return NextResponse.redirect(new URL(requested, request.nextUrl.origin))
}
