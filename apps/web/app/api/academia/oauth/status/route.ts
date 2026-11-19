import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.XPEX_PILOT_SUPABASE_URL
  const googleAvailable =
    process.env.XPEX_PILOT_GOOGLE_OAUTH_ENABLED === 'true' &&
    Boolean(url && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) &&
    Boolean(process.env.XPEX_PILOT_SUPABASE_PUBLISHABLE_KEY) &&
    Boolean(process.env.XPEX_PILOT_ALLOWED_EMAILS)
  // Public availability only. Never expose provider secrets, allowlists or project keys.
  return NextResponse.json(
    { googleAvailable },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
