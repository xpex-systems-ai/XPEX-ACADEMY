import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/** Public login provider discovery. No secrets, OAuth tokens or private account data. */
export async function GET() {
  return NextResponse.json({
    product: 'XPeX Academy Everywhere — Learning OS',
    status: 'integration-preview',
    identity: { sourceOfTruth: 'academy-backend', linkedProvidersRequired: true },
    providers: [
      { id: 'google', label: 'Continuar com Google', state: 'pending-backend-oauth-validation', enabled: false },
      { id: 'github', label: 'Continuar com GitHub', state: 'pending-backend-oauth-validation', enabled: false },
      { id: 'chatgpt', label: 'Continuar com ChatGPT', state: 'requires-official-provider-support', enabled: false },
    ],
    integrations: {
      supabase: 'academic-database-pending-migrations',
      firebase: 'telemetry-and-feature-flags-pending-validation',
      chatgptMcp: 'separate-app-authorization-flow',
    },
    enrollment: 'blocked-until-academy-api-auth-and-tenant-checks-pass',
  }, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
}
