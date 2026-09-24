/**
 * XPeX Academy × Firebase Fabric Foundation — Feature Flags
 * MISSION: XPEX-FIREBASE-FABRIC-FOUNDATION-001
 * 
 * Typed feature flag accessor abstraction backed by Remote Config & safe defaults.
 */

import { getRemoteConfigValue } from './remote-config'
import { XPEX_FEATURE_FLAG_DEFAULTS, type XpexFeatureFlagKey } from './types'

/**
 * Reads a feature flag value safely.
 */
export function getFeatureFlag<T extends boolean | string | number>(key: XpexFeatureFlagKey): T {
  return getRemoteConfigValue<T>(key)
}

/**
 * Convenience helper to check if a boolean feature is enabled.
 */
export function isFeatureEnabled(key: XpexFeatureFlagKey): boolean {
  const value = getFeatureFlag(key)
  return Boolean(value)
}

/**
 * Returns a snapshot of all active feature flags.
 */
export function getAllFeatureFlags(): Record<XpexFeatureFlagKey, boolean | string | number> {
  const result = {} as Record<XpexFeatureFlagKey, boolean | string | number>
  for (const key of Object.keys(XPEX_FEATURE_FLAG_DEFAULTS) as XpexFeatureFlagKey[]) {
    result[key] = getFeatureFlag(key)
  }
  return result
}
