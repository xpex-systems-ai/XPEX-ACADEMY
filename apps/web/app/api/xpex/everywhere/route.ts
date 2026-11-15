import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/** Public, read-only capability discovery. No private learner data is exposed. */
export async function GET() {
  const apiConfigured = Boolean(process.env.NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL)
  return NextResponse.json({
    product: 'XPeX Academy Everywhere — Learning OS',
    version: '0.1.0-preview',
    status: 'integration-preview',
    channels: {
      web: { state: 'preview', path: '/' },
      chatgpt: { state: 'planned', published: false },
      android: { state: 'planned', published: false },
    },
    capabilities: {
      course_catalog: 'pending-public-api',
      enrollment: 'requires-authenticated-backend',
      learning_progress: 'requires-authenticated-backend',
      certificates: 'requires-authenticated-backend',
      gx_tutor: 'pending-provider-validation',
    },
    dependencies: { academy_api_configured: apiConfigured, academy_api_verified: false },
  }, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
}
