/**
 * XPeX Academy × Firebase Fabric Foundation — Configuration
 * MISSION: XPEX-FIREBASE-FABRIC-FOUNDATION-001
 *
 * Environment-driven configuration for Firebase Web SDK.
 * Public identifiers only — NO private keys, NO service accounts, NO backend secrets.
 */

import type { FirebaseWebConfig, AppCheckMode } from './types'

const env = (name: string): string => process.env[name]?.trim() || ''

/**
 * Returns the resolved Firebase Web configuration.
 *
 * IMPORTANT:
 * No project-specific fallback is embedded in source. Each environment must
 * explicitly inject its own NEXT_PUBLIC_FIREBASE_* identifiers. This prevents
 * a production deployment from silently sending telemetry to staging.
 */
export function getFirebaseConfig(): FirebaseWebConfig {
  return {
    apiKey: env('NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: env('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: env('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: env('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: env('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: env('NEXT_PUBLIC_FIREBASE_APP_ID'),
    measurementId: env('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID') || undefined,
  }
}

/**
 * Firebase core is considered configured only when the minimum required
 * public identifiers are explicitly provided by the deployment environment.
 */
export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig()
  return Boolean(
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.messagingSenderId &&
    config.appId
  )
}

/**
 * Resolves current App Check rollout mode:
 * 'disabled' | 'observe' | 'enforce' (defaults to 'observe').
 *
 * NOTE: observe/enforce describe XPeX rollout policy. Actual Firebase resource
 * enforcement remains a server/console configuration and is never implied by
 * this client value alone.
 */
export function getAppCheckMode(): AppCheckMode {
  const raw = env('NEXT_PUBLIC_FIREBASE_APPCHECK_MODE').toLowerCase()
  if (raw === 'enforce') return 'enforce'
  if (raw === 'disabled') return 'disabled'
  return 'observe'
}

/**
 * Returns the Firebase App Check debug-token setting for local development.
 * Never invent a token. A real debug token must be injected explicitly.
 */
export function getAppCheckDebugToken(): string | undefined {
  if (process.env.NODE_ENV !== 'development') return undefined
  return env('NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN') || undefined
}
