/**
 * XPeX Academy × Firebase Fabric Foundation — Public Facade
 * MISSION: XPEX-FIREBASE-FABRIC-FOUNDATION-001
 * 
 * Entry point for the Firebase Fabric surrounding XPeX Core.
 */

import { getFirebaseApp, getFirebaseAppStatus, isBrowser } from './client'
import { initAnalytics, getAnalyticsStatus, logFirebaseEvent } from './analytics'
import { initAppCheck, getAppCheckStatus, getCurrentAppCheckMode } from './app-check'
import { initRemoteConfig, getRemoteConfigStatus, getRemoteConfigValue } from './remote-config'
import { initPerformance, getPerformanceStatus, measureTrace, recordShellBootMetric } from './performance'
import { checkMessagingCapability, getMessagingStatus } from './messaging'
import { getAILogicStatus } from './ai-logic'
import { getFirebaseConfig, isFirebaseConfigured } from './config'
import { getFeatureFlag, isFeatureEnabled, getAllFeatureFlags } from './feature-flags'
import {
  trackXpexEvent,
  trackStudentShellLoaded,
  trackXaraOpened,
  trackCourseOpened,
  setTelemetryTenantContext,
} from './events'
import type { FirebaseFabricStatus } from './types'

export * from './types'
export {
  getFirebaseApp,
  isBrowser,
  getFirebaseConfig,
  isFirebaseConfigured,
  initAnalytics,
  logFirebaseEvent,
  initAppCheck,
  getCurrentAppCheckMode,
  initRemoteConfig,
  getRemoteConfigValue,
  getFeatureFlag,
  isFeatureEnabled,
  getAllFeatureFlags,
  initPerformance,
  measureTrace,
  recordShellBootMetric,
  checkMessagingCapability,
  trackXpexEvent,
  trackStudentShellLoaded,
  trackXaraOpened,
  trackCourseOpened,
  setTelemetryTenantContext,
  getAILogicStatus,
}

/**
 * Returns the truthful status contract of all Firebase Fabric services (Section 18).
 */
export function getFirebaseFabricStatus(): FirebaseFabricStatus {
  const config = getFirebaseConfig()

  const appStatus = getFirebaseAppStatus()
  const analyticsStatus = getAnalyticsStatus()
  const appCheckStatus = getAppCheckStatus()
  const remoteConfigStatus = getRemoteConfigStatus()
  const performanceStatus = getPerformanceStatus()
  const messagingStatus = getMessagingStatus()
  const aiLogicStatus = getAILogicStatus()

  return {
    ready: isBrowser() && isFirebaseConfigured() && appStatus === 'available',
    environment: process.env.NODE_ENV || 'development',
    projectId: config.projectId,
    services: {
      app: appStatus,
      analytics: analyticsStatus,
      appCheck: appCheckStatus,
      remoteConfig: remoteConfigStatus,
      performance: performanceStatus,
      messaging: messagingStatus,
      aiLogic: aiLogicStatus,
    },
  }
}

/**
 * Bootstraps client-side Firebase Fabric services in non-blocking fashion.
 * SSR-safe: does nothing on the server.
 */
export async function initFirebaseFabric(): Promise<FirebaseFabricStatus> {
  if (!isBrowser()) {
    return getFirebaseFabricStatus()
  }

  // 1. Core FirebaseApp
  const app = getFirebaseApp()
  if (!app) {
    return getFirebaseFabricStatus()
  }

  // 2. Parallel non-blocking bootstrap of staged services
  await Promise.allSettled([
    initAnalytics(),
    initAppCheck(),
    initRemoteConfig(),
    initPerformance(),
    checkMessagingCapability(),
  ])

  return getFirebaseFabricStatus()
}
