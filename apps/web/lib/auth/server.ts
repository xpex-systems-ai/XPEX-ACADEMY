import { cookies } from 'next/headers'
import { getBackendUrl } from '@services/config/config'
import type { LearnHouseMembership } from '@/lib/xpex/access'

function getAuthBackendUrl(): string {
  const backendUrl = getBackendUrl().replace(/\/+$/, '')
  return backendUrl === 'http://localhost' ? 'http://localhost:1338' : backendUrl
}

const ACCESS_TOKEN_COOKIE = 'LH_access'
const REFRESH_TOKEN_COOKIE = 'LH_refresh'

export interface Session {
  user: {
    username?: string
    first_name?: string
    last_name?: string
    is_superadmin?: boolean
    [key: string]: unknown
  } | undefined
  roles?: LearnHouseMembership[] | undefined
  tokens?: {
    access_token?: string | undefined
    refresh_token?: string | undefined
    expiry?: number | undefined
  } | undefined
}

async function readSessionFromBackend(backendUrl: string, accessToken: string) {
  const [sessionResponse, profileResponse] = await Promise.all([
    fetch(`${backendUrl}/api/v1/users/session`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }),
    fetch(`${backendUrl}/api/v1/users/profile`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }),
  ])

  if (!sessionResponse.ok) return null

  const sessionData = await sessionResponse.json()
  if (profileResponse.ok) {
    const liveProfile = await profileResponse.json()
    // /users/session is rebuilt from the canonical database user row, while
    // /users/profile can reflect the identity embedded in an older access token.
    // Never allow token-derived profile data to downgrade a database-confirmed
    // superadmin. Keep the session payload authoritative for overlapping fields.
    sessionData.user = {
      ...liveProfile,
      ...sessionData.user,
      is_superadmin:
        sessionData.user?.is_superadmin === true || liveProfile.is_superadmin === true,
    }
  }

  return sessionData
}

export async function getServerSession(): Promise<Session | null> {
  try {
    const backendUrl = getAuthBackendUrl()
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)

    if (accessToken?.value) {
      const sessionData = await readSessionFromBackend(backendUrl, accessToken.value)
      if (sessionData) {
        return {
          user: sessionData.user,
          roles: sessionData.roles,
          tokens: { access_token: accessToken.value },
        }
      }
      console.log('[SERVER_SESSION] Access token invalid, trying refresh')
    }

    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)
    if (!refreshToken?.value) return null

    const refreshResponse = await fetch(`${backendUrl}/api/v1/auth/refresh`, {
      method: 'GET',
      headers: { Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken.value}` },
      cache: 'no-store',
    })

    if (!refreshResponse.ok) {
      console.log('[SERVER_SESSION] Refresh failed:', refreshResponse.status)
      return null
    }

    const refreshData = await refreshResponse.json()
    if (!refreshData.access_token) return null

    const sessionData = await readSessionFromBackend(backendUrl, refreshData.access_token)
    if (!sessionData) {
      return {
        user: undefined,
        roles: [],
        tokens: {
          access_token: refreshData.access_token,
          expiry: refreshData.expiry,
        },
      }
    }

    return {
      user: sessionData.user,
      roles: sessionData.roles,
      tokens: {
        access_token: refreshData.access_token,
        expiry: refreshData.expiry,
      },
    }
  } catch (error) {
    console.error('[SERVER_SESSION] Error:', error)
    return null
  }
}

export async function getServerAccessToken(): Promise<string | null> {
  try {
    const backendUrl = getAuthBackendUrl()
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)
    if (accessToken?.value) return accessToken.value

    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)
    if (!refreshToken?.value) return null

    const response = await fetch(`${backendUrl}/api/v1/auth/refresh`, {
      method: 'GET',
      headers: { Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken.value}` },
      cache: 'no-store',
    })

    if (!response.ok) return null
    const data = await response.json()
    return data.access_token || null
  } catch (error) {
    console.error('[SERVER_SESSION] Error getting access token:', error)
    return null
  }
}
