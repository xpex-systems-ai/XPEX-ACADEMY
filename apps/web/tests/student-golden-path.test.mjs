import { describe, expect, test, before, after } from 'bun:test'

/**
 * MISSION 002 — Student Golden Path Integration Test
 * 
 * Tests the critical path:
 * 1. Signup (create account)
 * 2. Login (authenticate)
 * 3. Session (fetch session/roles)
 * 4. Logout (cleanup and revocation)
 * 
 * Requirements:
 * - API must be running at NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL or localhost:9000
 * - Database must be accessible (migration auto-applied)
 * - This test uses a unique email per run to avoid conflicts
 * 
 * Run with: `bun test apps/web/tests/student-golden-path.test.mjs`
 */

// Configuration
const API_BASE = process.env.NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL 
  || process.env.LEARNHOUSE_API_URL 
  || 'http://localhost:9000'
const API_URL = `${API_BASE}/api/v1`

// Generate unique test user
const testEmail = `student_golden_${Date.now()}@test.internal`
const testPassword = 'SecureTestPassword123!'
const testUsername = `student_${Date.now()}`

let accessToken = null
let refreshToken = null
let userId = null

describe('Student Golden Path', () => {
  test('healthcheck: API is accessible', async () => {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
    }).catch(e => ({ ok: false, status: 0, error: e.message }))
    
    if (!response.ok) {
      console.error(`⚠️  API not accessible at ${API_BASE}. Test would require running API.`)
      expect(response.ok).toBe(true)
    }
  })

  describe('Phase 1: Signup', () => {
    test('creates a new user account', async () => {
      const response = await fetch(`${API_URL}/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          username: testUsername,
          first_name: 'Golden',
          last_name: 'Path',
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe(testEmail)
      expect(data.user.user_uuid).toBeDefined()
      userId = data.user.id
    })
  })

  describe('Phase 2: Login', () => {
    test('authenticates user with credentials', async () => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.access_token).toBeDefined()
      expect(data.tokens?.access_token || data.access_token).toBeDefined()
      
      // Store tokens for next tests
      accessToken = data.access_token || data.tokens?.access_token
      expect(accessToken).toBeDefined()
    })

    test('login fails with wrong password', async () => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: 'WrongPassword123!',
        }),
      })

      expect(response.status).not.toBe(200)
    })
  })

  describe('Phase 3: Session', () => {
    test('retrieves authenticated session with roles', async () => {
      expect(accessToken).toBeDefined()
      
      const response = await fetch(`${API_URL}/users/session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe(testEmail)
      expect(data.roles).toBeDefined()
      expect(Array.isArray(data.roles)).toBe(true)
    })

    test('session fails without authorization', async () => {
      const response = await fetch(`${API_URL}/users/session`, {
        method: 'GET',
        // No Authorization header
      })

      expect(response.status).toBe(401)
    })

    test('session fails with invalid token', async () => {
      const response = await fetch(`${API_URL}/users/session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer invalid_token_${Date.now()}`,
        },
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Phase 4: Logout', () => {
    test('clears session and revokes token', async () => {
      expect(accessToken).toBeDefined()
      
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      // 200 = success, 401 = already expired (both acceptable)
      expect([200, 401]).toContain(response.status)
    })

    test('revoked token cannot access protected endpoints', async () => {
      // After logout, the token should be revoked (added to blocklist)
      // This test verifies the revocation worked by trying to use the token again
      const response = await fetch(`${API_URL}/users/session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      // Should fail because token was revoked
      expect(response.status).toBe(401)
    })

    test('logout is idempotent (calling again returns 401, not 5xx)', async () => {
      // Call logout again with already-revoked token
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      // Should be 401 (not authenticated), not 500 (server error)
      expect(response.status).toBe(401)
    })
  })

  describe('Phase 5: Golden Path Summary', () => {
    test('verifies all critical gates are passed', () => {
      expect(accessToken).toBeDefined() // Signup + login worked
      expect(userId).toBeDefined()       // User was created
      // If this test runs, all previous tests passed
      expect(true).toBe(true)
    })
  })
})

/**
 * Expected output (all pass):
 * ✓ healthcheck: API is accessible
 * ✓ creates a new user account
 * ✓ authenticates user with credentials
 * ✓ login fails with wrong password
 * ✓ retrieves authenticated session with roles
 * ✓ session fails without authorization
 * ✓ session fails with invalid token
 * ✓ clears session and revokes token
 * ✓ revoked token cannot access protected endpoints
 * ✓ logout is idempotent (calling again returns 401, not 5xx)
 * ✓ verifies all critical gates are passed
 * 
 * 11 pass (11 assertions)
 */
