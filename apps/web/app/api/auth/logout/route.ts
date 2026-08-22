import { NextRequest, NextResponse } from 'next/server'

/**
 * Logout gateway.
 * Proxies logout request to the backend, gracefully handling already-expired sessions.
 * 
 * Frontend calls: POST /api/auth/logout
 * Backend API: DELETE /api/v1/auth/logout (requires Authorization header with valid JWT)
 * 
 * Response:
 * - 200: Successful logout (backend revoked all sessions)
 * - 401: No valid session or token expired (acceptable — user is effectively logged out)
 * - 5xx: Backend error (rare)
 */

export async function POST(request: NextRequest) {
  // Get the API URL from environment (same as used by frontend config)
  const backendUrl = process.env.NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL 
    || process.env.LEARNHOUSE_API_URL 
    || 'http://localhost:9000'

  // Extract the Authorization header from the request (if present)
  // This header carries the JWT access token that was stored in memory by AuthContext
  const authHeader = request.headers.get('authorization')

  try {
    const response = await fetch(`${backendUrl}/api/v1/auth/logout`, {
      method: 'DELETE',
      headers: {
        // Forward the Authorization header if present
        // If not present, the backend will see no auth and return 401, which is OK
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      // Include cookies (refresh token cookie)
      credentials: 'include',
    })

    // 200: Success
    if (response.ok) {
      const data = await response.json().catch(() => ({}))
      return NextResponse.json(data, { status: 200 })
    }

    // 401: No auth / already expired / session invalid
    // This is an acceptable end state — the user is not authenticated anymore.
    // The frontend has already cleared its local state via AuthContext.handleSignOut(),
    // so returning 401 here doesn't block the logout flow.
    if (response.status === 401) {
      return NextResponse.json(
        { msg: 'Session already expired or invalid', detail: 'User is logged out.' },
        { status: 200 } // Return 200 so frontend treats logout as success
      )
    }

    // Other errors (500, etc.)
    const errorData = await response.json().catch(() => ({}))
    console.error('[logout] Backend error:', response.status, errorData)
    return NextResponse.json(
      { detail: errorData.detail || 'Logout service error' },
      { status: response.status }
    )
  } catch (error) {
    console.error('[logout] Request failed:', error)
    return NextResponse.json(
      { detail: 'Could not reach the logout service.' },
      { status: 502 }
    )
  }
}
