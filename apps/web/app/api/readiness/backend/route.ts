import { NextResponse } from 'next/server'
import { inspectBackendConfiguration } from '@services/config/config'

export const dynamic = 'force-dynamic'

/** Non-secret signal for operators; the configured origin is intentionally omitted. */
export function GET() {
  const status = inspectBackendConfiguration()
  return NextResponse.json(
    { service: 'academy-web', backend: status },
    { status: status.configured ? 200 : 503 },
  )
}
