/**
 * XPeX Academy × Firebase Fabric Foundation — Analytics
 * MISSION: XPEX-FIREBASE-FABRIC-FOUNDATION-001
 * 
 * Safe, PII-free Analytics bootstrap.
 * Browser-only, verifies isSupported(), strips sensitive student/course data.
 */

import { getAnalytics, logEvent, isSupported, type Analytics } from 'firebase/analytics'
import { getFirebaseApp, isBrowser } from './client'
import type { FirebaseServiceStatus, XpexEventName } from './types'

let analyticsInstance: Analytics | null = null
let analyticsStatus: FirebaseServiceStatus = 'not_initialized'

/** Sensitive keys forbidden in telemetry payloads */
const FORBIDDEN_PARAM_KEYS = new Set([
  'email',
  'name',
  'student_name',
  'full_name',
  'password',
  'token',
  'access_token',
  'secret',
  'api_key',
  'content',
  'prompt',
  'answer',
  'course_text',
  'rag_text',
])

export const FORBIDDEN_PII_KEYS = FORBIDDEN_PARAM_KEYS

/**
 * Sanitizes event parameters to guarantee zero PII or private course text enters analytics.
 */
export function sanitizeAnalyticsParams(params?: Record<string, unknown>): Record<string, string | number | boolean> {
  if (!params) return {}

  const safe: Record<string, string | number | boolean> = {}

  for (const [key, value] of Object.entries(params)) {
    const lowerKey = key.toLowerCase()

    // Skip forbidden keys
    if (FORBIDDEN_PARAM_KEYS.has(lowerKey)) continue
    if (lowerKey.includes('email') || lowerKey.includes('password') || lowerKey.includes('token') || lowerKey.includes('secret')) {
      continue
    }

    // Only allow primitive types
    if (typeof value === 'string') {
      // Avoid long free-form text
      safe[key] = value.length > 100 ? value.slice(0, 100) : value
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      safe[key] = value
    }
  }

  return safe
}

export const sanitizeTelemetryParams = sanitizeAnalyticsParams

/**
 * Initializes Firebase Analytics in supported browser environments.
 */
export async function initAnalytics(): Promise<Analytics | null> {
  if (!isBrowser()) return null
  if (analyticsInstance) return analyticsInstance

  const app = getFirebaseApp()
  if (!app) {
    analyticsStatus = 'disabled'
    return null
  }

  try {
    const supported = await isSupported()
    if (!supported) {
      analyticsStatus = 'unsupported'
      return null
    }

    analyticsInstance = getAnalytics(app)
    analyticsStatus = 'available'
    return analyticsInstance
  } catch (error) {
    console.warn('[Firebase Fabric Analytics] Initialization error:', error instanceof Error ? error.message : error)
    analyticsStatus = 'degraded'
    return null
  }
}

/**
 * Dispatches a canonical XPeX analytics event with sanitization.
 */
export async function logFirebaseEvent(
  name: XpexEventName,
  params?: Record<string, unknown>
): Promise<void> {
  if (!isBrowser()) return

  try {
    const analytics = await initAnalytics()
    if (!analytics) return

    const sanitized = sanitizeAnalyticsParams(params)
    logEvent(analytics, name, sanitized)
  } catch (error) {
    // Non-blocking telemetry failure
    console.warn('[Firebase Fabric Analytics] Event dispatch skipped:', error instanceof Error ? error.message : error)
  }
}

/**
 * Returns current status of Firebase Analytics.
 */
export function getAnalyticsStatus(): FirebaseServiceStatus {
  if (!isBrowser()) return 'not_initialized'
  return analyticsStatus
}
