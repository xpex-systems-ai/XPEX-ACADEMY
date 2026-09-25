/**
 * XPeX Academy × Firebase Fabric Foundation — Client Singleton
 * MISSION: XPEX-FIREBASE-FABRIC-FOUNDATION-001
 * 
 * Centralized, SSR-safe FirebaseApp initialization.
 * Guaranteed browser-only, zero duplicate initializeApp calls, zero server-side side effects.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirebaseConfig, isFirebaseConfigured } from './config'
import type { FirebaseServiceStatus } from './types'

let appInstance: FirebaseApp | null = null
let appStatus: FirebaseServiceStatus = 'not_initialized'

/** Check if currently executing in browser runtime */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Initializes or returns the singleton FirebaseApp instance.
 * Safe to call repeatedly; guaranteed SSR-safe.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (!isBrowser()) {
    return null
  }

  if (appInstance) {
    return appInstance
  }

  if (!isFirebaseConfigured()) {
    appStatus = 'disabled'
    return null
  }

  try {
    const existingApps = getApps()
    if (existingApps.length > 0) {
      appInstance = existingApps[0]
      appStatus = 'available'
      return appInstance
    }

    const config = getFirebaseConfig()
    appInstance = initializeApp(config)
    appStatus = 'available'
    return appInstance
  } catch (error) {
    console.warn('[Firebase Fabric] Initialization skipped or degraded:', error instanceof Error ? error.message : error)
    appStatus = 'degraded'
    return null
  }
}

/**
 * Returns current status of FirebaseApp core.
 */
export function getFirebaseAppStatus(): FirebaseServiceStatus {
  if (!isBrowser()) return 'not_initialized'
  if (!isFirebaseConfigured()) return 'disabled'
  return appStatus
}
