import { NextRequest, NextResponse } from 'next/server'
import { getServerAPIUrl } from '@services/config/config'
import { isSaaSMode, isCustomDomainRequest } from '@lib/saas'
import { verifyTurnstile, clientIpFromHeaders } from '@lib/turnstile'
import { validateSignupEmail } from '@services/emails/disposableEmail'
import { addContactWithLoops, sendLoopsEvent, LOOPS_SIGNED_USERS_GROUP } from '@services/emails/loops'
import { buildSignupBackendPath } from '@services/auth/signupRouting'

// Signup gateway. Runs the anti-abuse add-ons (Turnstile, disposable-email)
// server-side BEFORE creating the account and fires the Loops marketing sync
// after — secrets never touch the client, and every add-on degrades gracefully
// when its key is unset (and only runs in SaaS mode).
//
// Account creation targets one of three backend endpoints, mirroring how the
// platform worked:
//   - org-less apex signup → POST /users/            (a standalone account, NOT
//     attached to any organization — the user creates/joins orgs later)
//   - org-subdomain signup → POST /users/{org_id}    (create + join that org)
//   - invite signup        → POST /users/{org_id}/invite/{code}
// The apex account is NOT linked to the instance default org.

interface SignupBody {
  org_id?: string | number
  org_slug?: string
  email: string
  password: string
  username: string
  first_name?: string
  last_name?: string
  bio?: string
  turnstileToken?: string | null
  inviteCode?: string
}

export async function POST(request: NextRequest) {
  let body: SignupBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: 'Invalid request body' }, { status: 400 })
  }

  const { email, org_id, org_slug: _org_slug, turnstileToken, inviteCode, ...rest } = body

  if (!email || !rest.password || !rest.username) {
    return NextResponse.json({ detail: 'Missing required fields' }, { status: 400 })
  }

  const saas = await isSaaSMode()

  if (saas) {
    if (!(await isCustomDomainRequest())) {
      const turnstile = await verifyTurnstile(turnstileToken, clientIpFromHeaders(request.headers))
      if (!turnstile.ok) {
        const detail =
          turnstile.reason === 'missing_token'
            ? 'Please complete the verification challenge.'
            : 'Verification failed. Please try again.'
        return NextResponse.json({ detail }, { status: 403 })
      }
    }

    const emailCheck = await validateSignupEmail(email)
    if (!emailCheck.ok) {
      return NextResponse.json(
        { detail: 'Please use a permanent email address — temporary/disposable addresses are not allowed.' },
        { status: 400 },
      )
    }
  }

  const base = getServerAPIUrl()
  const backendBody = { email, ...rest }
  const routeDecision = buildSignupBackendPath(org_id, inviteCode)

  if (!routeDecision.ok) {
    return NextResponse.json({ detail: 'Invite signups require an organization.' }, { status: 400 })
  }

  const url = `${base}${routeDecision.path}`

  let backendRes: Response
  try {
    backendRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendBody),
      signal: AbortSignal.timeout(8000),
    })
  } catch (err) {
    console.error('[signup] backend request failed:', err)
    return NextResponse.json({ detail: 'Could not reach the signup service. Please try again.' }, { status: 502 })
  }

  const data = await backendRes.json().catch(() => ({}))

  if (backendRes.ok && saas && !org_id) {
    void addContactWithLoops(email, LOOPS_SIGNED_USERS_GROUP, {
      firstName: rest.first_name || '',
      lastName: rest.last_name || '',
    }).catch(() => {})
    void sendLoopsEvent(email, 'user_signed_up', {
      username: rest.username,
      has_org: false,
    }).catch(() => {})
  }

  return NextResponse.json(data, { status: backendRes.status })
}
