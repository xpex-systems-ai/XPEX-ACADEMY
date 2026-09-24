/**
 * XPeX Academy × Firebase Fabric Foundation — App Check
 * MISSION: XPEX-FIREBASE-FABRIC-FOUNDATION-001
 * 
 * Staged App Check bootstrap.
 * Default mode: 'observe' (non-blocking). No aggressive enforcement without approval.
 */

import { initializeAppCheck, ReCaptchaV3Provider, CustomProvider, type AppCheck } from 'firebase/app-check'
import { getFirebaseApp, isBrowser } from './client'
import { getAppCheckMode, getAppCheckDebugToken } from './config'
import type { FirebaseServiceStatus, AppCheckMode } from './types'

let appCheckInstance: AppCheck | null = null
let appCheckStatus: FirebaseServiceStatus = 'not_initialized'

/**
 * Initializes App Check in staged mode.
 * In development or when debug token is present, configures debug provider.
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

  try {
    const debugToken = getAppCheckDebugToken()
    if (debugToken) {
      // Configure global debug token for Firebase App Check SDK
      ;(window as Window & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken
    }

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

    if (siteKey) {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      })
      appCheckStatus = 'available'
      return appCheckInstance
    }

    // When siteKey is absent but mode is observe, instantiate a non-blocking dummy/custom provider
    if (debugToken) {
      appCheckInstance = initializeAppCheck(app, {
        provider: new CustomProvider({
          getToken: async () => ({
            token: typeof debugToken === 'string' ? debugToken : 'debug-token-staged',
            expireTimeMillis: Date.now() + 3600000,
          }),
        }),
        isTokenAutoRefreshEnabled: true,
      })
      appCheckStatus = 'available'
      return appCheckInstance
    }

    // In observe mode without keys, flag as configured but dormant
    appCheckStatus = 'configured'
    return null
  } catch (error) {
    console.warn('[Firebase Fabric App Check] Staged init warning:', error instanceof Error ? error.message : error)
    appCheckStatus = 'degraded'
    return null
  }
}

/**
 * Returns current status of App Check.
 */
export function getAppCheckStatus(): FirebaseServiceStatus {
  if (!isBrowser()) return 'not_initialized'
  return appCheckStatus
}

/**
 * Returns configured App Check mode.
 */
export function getCurrentAppCheckMode(): AppCheckMode {
  return getAppCheckMode()
}
