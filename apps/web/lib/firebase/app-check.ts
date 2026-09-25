/**
 * XPeX Academy × Firebase Fabric Foundation — App Check
 * MISSION: XPEX-FIREBASE-FABRIC-FOUNDATION-001
 *
 * Staged App Check bootstrap.
 * Default rollout mode: observe. Client policy never implies server enforcement.
 */

import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check'
import { getFirebaseApp, isBrowser } from './client'
import { getAppCheckMode, getAppCheckDebugToken } from './config'
import type { FirebaseServiceStatus, AppCheckMode } from './types'

let appCheckInstance: AppCheck | null = null
let appCheckStatus: FirebaseServiceStatus = 'not_initialized'

type DebugWindow = Window & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }

/**
 * Initializes App Check only when a real provider configuration exists.
 *
 * Debug mode follows the Firebase Web SDK contract: the debug token is placed
 * on the global before initializeAppCheck(), while the real provider remains
 * ReCaptchaV3Provider. No synthetic/custom App Check token is ever fabricated.
 */
export async function initAppCheck(): Promise<AppCheck | null> {
  if (!isBrowser()) return null
  if (appCheckInstance) return appCheckInstance

  const mode = getAppCheckMode()
  if (mode === 'disabled') {
    appCheckStatus = 'disabled'
    return null
  }

  const app = getFirebaseApp()
  if (!app) {
    appCheckStatus = 'disabled'
    return null
  }

  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY?.trim()
  if (!siteKey) {
    // Foundation is present, but there is no valid provider to initialize yet.
    appCheckStatus = 'configured'
    return null
  }

  try {
    const debugToken = getAppCheckDebugToken()
    if (debugToken) {
      ;(window as DebugWindow).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken
    }

    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    })
    appCheckStatus = 'available'
    return appCheckInstance
  } catch (error) {
    console.warn(
      '[Firebase Fabric App Check] Staged init warning:',
      error instanceof Error ? error.message : error
    )
    appCheckStatus = 'degraded'
    return null
  }
}

export function getAppCheckStatus(): FirebaseServiceStatus {
  if (!isBrowser()) return 'not_initialized'
  return appCheckStatus
}

export function getCurrentAppCheckMode(): AppCheckMode {
  return getAppCheckMode()
}
