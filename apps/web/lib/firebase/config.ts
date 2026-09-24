/**
 * XPeX Academy × Firebase Fabric Foundation — Configuration
 * MISSION: XPEX-FIREBASE-FABRIC-FOUNDATION-001
 * 
 * Environment-driven configuration for Firebase Web SDK.
 * Public identifiers only — NO private keys, NO service accounts, NO backend secrets.
 */

import type { FirebaseWebConfig, AppCheckMode } from './types'

/**
 * Default public staging project identifiers (xpex-academy-stage).
 * Used when explicit environment variables are not injected.
 */
const DEFAULT_STAGE_CONFIG: FirebaseWebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyB0cH3Oq-Dg3qwMVCi_3m9kzqF_1CNDm3Q',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'xpex-academy-stage.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'xpex-academy-stage',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'xpex-academy-stage.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '364943107161',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:364943107161:web:bc3ab9a50a101115cc7d48',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-WCQ1XQE5ED',
}

/**
 * Returns the resolved Firebase Web configuration.
 */
export function getFirebaseConfig(): FirebaseWebConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || DEFAULT_STAGE_CONFIG.apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || DEFAULT_STAGE_CONFIG.authDomain,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || DEFAULT_STAGE_CONFIG.projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || DEFAULT_STAGE_CONFIG.storageBucket,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_STAGE_CONFIG.messagingSenderId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || DEFAULT_STAGE_CONFIG.appId,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || DEFAULT_STAGE_CONFIG.measurementId,
  }
}

/**
 * Checks whether Firebase configuration has the minimum required identifiers.
 */
export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig()
  return Boolean(config.apiKey && config.projectId && config.appId)
}

/**
 * Resolves current App Check enforcement mode:
 * 'disabled' | 'observe' | 'enforce' (defaults to 'observe' for safe staged rollout)
 */
export function getAppCheckMode(): AppCheckMode {
  const raw = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_MODE?.toLowerCase()
  if (raw === 'enforce') return 'enforce'
  if (raw === 'disabled') return 'disabled'
  return 'observe'
}

/**
 * Returns current debug token if configured for dev/staging App Check.
 */
export function getAppCheckDebugToken(): string | boolean | undefined {
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN || true
  }
  return process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN
}
