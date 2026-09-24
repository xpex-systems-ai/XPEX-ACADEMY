/**
 * XPeX Academy × Firebase Fabric Foundation — Remote Config
 * MISSION: XPEX-FIREBASE-FABRIC-FOUNDATION-001
 * 
 * Remote Config bootstrap with code-authoritative defaults and safe fallback.
 */

import { getRemoteConfig, fetchAndActivate, getValue, type RemoteConfig } from 'firebase/remote-config'
import { getFirebaseApp, isBrowser } from './client'
import { XPEX_FEATURE_FLAG_DEFAULTS, type FirebaseServiceStatus, type XpexFeatureFlagKey } from './types'

let remoteConfigInstance: RemoteConfig | null = null
let remoteConfigStatus: FirebaseServiceStatus = 'not_initialized'
let activated = false

/**
 * Initializes Remote Config with safe network parameters and code defaults.
 */
export async function initRemoteConfig(): Promise<RemoteConfig | null> {
  if (!isBrowser()) return null
  if (remoteConfigInstance) return remoteConfigInstance

  const app = getFirebaseApp()
  if (!app) {
    remoteConfigStatus = 'disabled'
    return null
  }

  try {
    const rc = getRemoteConfig(app)

    // Production settings: 1 hour cache; Development: 1 minute
    rc.settings = {
      fetchTimeoutMillis: 10000,
      minimumFetchIntervalMillis: process.env.NODE_ENV === 'development' ? 60000 : 3600000,
    }

    // Set code defaults
    rc.defaultConfig = { ...XPEX_FEATURE_FLAG_DEFAULTS }

    remoteConfigInstance = rc
    remoteConfigStatus = 'available'

    // Attempt non-blocking fetch and activate
    fetchAndActivate(rc)
      .then((success) => {
        activated = success
      })
      .catch((err) => {
        console.warn('[Firebase Fabric RemoteConfig] Fetch deferred:', err instanceof Error ? err.message : err)
      })

    return remoteConfigInstance
  } catch (error) {
    console.warn('[Firebase Fabric RemoteConfig] Init failed, using code defaults:', error instanceof Error ? error.message : error)
    remoteConfigStatus = 'degraded'
    return null
  }
}

/**
 * Reads a feature flag value from Remote Config, falling back strictly to code defaults.
 */
export function getRemoteConfigValue<T extends boolean | string | number>(key: XpexFeatureFlagKey): T {
  const defaultValue = XPEX_FEATURE_FLAG_DEFAULTS[key] as T

  if (!isBrowser() || !remoteConfigInstance) {
    return defaultValue
  }

  try {
    const val = getValue(remoteConfigInstance, key)

    if (typeof defaultValue === 'boolean') {
      return val.asBoolean() as T
    }
    if (typeof defaultValue === 'number') {
      return val.asNumber() as T
    }
    return (val.asString() || defaultValue) as T
  } catch {
    return defaultValue
  }
}

/**
 * Returns current status of Remote Config.
 */
export function getRemoteConfigStatus(): FirebaseServiceStatus {
  if (!isBrowser()) return 'not_initialized'
  return remoteConfigStatus
}

/**
 * Returns whether remote config values were successfully activated.
 */
export function isRemoteConfigActivated(): boolean {
  return activated
}
