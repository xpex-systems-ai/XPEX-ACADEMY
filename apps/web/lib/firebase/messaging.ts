/**
 * XPeX Academy × Firebase Fabric Foundation — Messaging
 * MISSION: XPEX-FIREBASE-FABRIC-FOUNDATION-001
 * 
 * Messaging readiness detection and capability probe.
 * STRICT RULE: ZERO automatic permission prompt on first load.
 */

import { isSupported } from 'firebase/messaging'
import { isBrowser } from './client'
import type { FirebaseServiceStatus, MessagingCapability } from './types'

let messagingStatus: FirebaseServiceStatus = 'not_initialized'

/**
 * Checks whether push messaging is supported in the current client browser.
 */
export async function checkMessagingCapability(): Promise<MessagingCapability> {
  if (!isBrowser()) {
    return {
      supported: false,
      permissionState: 'unsupported',
      serviceWorkerReady: false,
    }
  }

  const hasNotification = 'Notification' in window
  const hasServiceWorker = 'serviceWorker' in navigator

  if (!hasNotification || !hasServiceWorker) {
    messagingStatus = 'unsupported'
    return {
      supported: false,
      permissionState: 'unsupported',
      serviceWorkerReady: false,
    }
  }

  const supported = await isSupported().catch(() => false)
  messagingStatus = supported ? 'available' : 'unsupported'

  return {
    supported,
    permissionState: Notification.permission,
    serviceWorkerReady: hasServiceWorker,
  }
}

/**
 * Returns current status of Messaging foundation.
 */
export function getMessagingStatus(): FirebaseServiceStatus {
  if (!isBrowser()) return 'not_initialized'
  return messagingStatus
}
