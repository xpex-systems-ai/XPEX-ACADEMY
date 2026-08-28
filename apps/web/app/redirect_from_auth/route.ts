import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { resolveXpexOrganization } from '@/lib/xpex/access'
import { safeAuthReturnPath } from '@/lib/proxyPaths'
import { listCourseStudioDrafts } from '@services/xpex/courseStudio'

export const dynamic = 'force-dynamic'

async function hasAdministrativeAuthority() {
  const session = await getServerSession()
  if (!session?.user || !session.tokens?.access_token) return false
  if (session.user.is_superadmin === true) return true

  const organization = resolveXpexOrganization(session.roles)
  if (!organization?.slug) return false

  try {
    await listCourseStudioDrafts(organization.slug, session.tokens.access_token, {
      limit: 1,
      offset: 0,
    })
    return true
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const requested = safeAuthReturnPath(request.nextUrl.searchParams.get('next'))
  const isAdminDestination = requested === '/xpex/admin' || requested.startsWith('/xpex/admin?')
  const isAdmin = await hasAdministrativeAuthority()

  // An admin URL is a request, never proof of authority. Conversely, a normal
  // login without an explicit destination sends a backend-authorized operator
  // to the administrative workspace and every other user to the learner home.
  const destination = isAdminDestination
    ? (isAdmin ? requested : '/home')
    : requested === '/home' && isAdmin
      ? '/xpex/admin'
      : requested

  const customDomain = request.cookies.get('LH_custom_domain')?.value
  const origin = customDomain
    ? `${request.nextUrl.protocol}//${customDomain}`
    : request.nextUrl.origin
  return NextResponse.redirect(new URL(destination, origin))
}
