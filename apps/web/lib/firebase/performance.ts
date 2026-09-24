/**
 * XPeX Academy × Firebase Fabric Foundation — Performance Monitoring
 * MISSION: XPEX-FIREBASE-FABRIC-FOUNDATION-001
 * 
 * Performance monitoring bootstrap and custom trace helper.
 * Browser-only, non-blocking, staging-safe.
 */

import { getPerformance, trace, type FirebasePerformance } from 'firebase/performance'
import { getFirebaseApp, isBrowser } from './client'
import type { FirebaseServiceStatus } from './types'

let performanceInstance: FirebasePerformance | null = null
let performanceStatus: FirebaseServiceStatus = 'not_initialized'

/**
 * Initializes Firebase Performance in supported browser environments.
 */
export async function initPerformance(): Promise<FirebasePerformance | null> {
  if (!isBrowser()) return null
  if (performanceInstance) return performanceInstance

  const app = getFirebaseApp()
  if (!app) {
    performanceStatus = 'disabled'
    return null
  }

  try {
    performanceInstance = getPerformance(app)
    performanceStatus = 'available'
    return performanceInstance
  } catch (error) {
    console.warn('[Firebase Fabric Performance] Init skipped:', error instanceof Error ? error.message : error)
    performanceStatus = 'degraded'
    return null
  }
}

/**
 * Measures an async operation using a custom performance trace.
 */
export async function measureTrace<T>(traceName: string, fn: () => Promise<T>): Promise<T> {
  if (!isBrowser()) {
    return fn()
  }

  const perf = await initPerformance()
  if (!perf) {
    return fn()
  }

  try {
    const t = trace(perf, traceName)
    t.start()
    try {
      const result = await fn()
      t.stop()
      return result
    } catch (err) {
      t.putAttribute('error', 'true')
      t.stop()
      throw err
    }
  } catch {
    return fn()
  }
}

/**
 * Proof trace for measuring student authenticated shell boot.
 */
export function recordShellBootMetric(durationMs: number): void {
  if (!isBrowser()) return

  initPerformance().then((perf) => {
    if (!perf) return
    try {
      const t = trace(perf, 'xpex_student_shell_boot')
      t.start()
      t.putMetric('duration_ms', durationMs)
      t.stop()
    } catch {
      // Ignored non-critical trace error
    }
  })
}

/**
 * Returns current status of Performance Monitoring.
 */
export function getPerformanceStatus(): FirebaseServiceStatus {
  if (!isBrowser()) return 'not_initialized'
  return performanceStatus
}
