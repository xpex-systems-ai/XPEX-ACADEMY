/**
 * XPeX Academy × Firebase Fabric Foundation — Events & Telemetry
 * MISSION: XPEX-FIREBASE-FABRIC-FOUNDATION-001
 * 
 * Central event tracking helper carrying safe multi-tenant context without PII.
 */

import { logFirebaseEvent } from './analytics'
import type { XpexEventName, SafeTenantContext } from './types'

let currentTenantContext: SafeTenantContext = {}

/**
 * Sets the active tenant context for subsequent telemetry events.
 * Strips any sensitive identifiers.
 */
export function setTelemetryTenantContext(context: SafeTenantContext): void {
  currentTenantContext = {
    tenant_id: context.tenant_id ? String(context.tenant_id).slice(0, 50) : undefined,
    tenant_type: context.tenant_type ? String(context.tenant_type).slice(0, 30) : undefined,
    user_role: context.user_role ? String(context.user_role).slice(0, 30) : undefined,
  }
}

/**
 * Tracks a canonical XPeX telemetry event.
 */
export async function trackXpexEvent(
  name: XpexEventName,
  params?: Record<string, unknown>,
  eventTenantContext?: SafeTenantContext
): Promise<void> {
  const mergedContext = {
    ...currentTenantContext,
    ...(eventTenantContext || {}),
  }

  const payload: Record<string, unknown> = {
    ...params,
    ...(mergedContext.tenant_id ? { tenant_id: mergedContext.tenant_id } : {}),
    ...(mergedContext.tenant_type ? { tenant_type: mergedContext.tenant_type } : {}),
    ...(mergedContext.user_role ? { user_role: mergedContext.user_role } : {}),
    timestamp: Date.now(),
  }

  await logFirebaseEvent(name, payload)
}

// ============================================================================
// Proof Event Helpers (Section 8)
// ============================================================================

/** Proof event 1: Student Authenticated Shell Loaded */
export function trackStudentShellLoaded(role: string, tenantId?: string): void {
  trackXpexEvent('student_shell_loaded', { role }, { tenant_id: tenantId, user_role: role })
}

/** Proof event 2: XARA Copilot opened */
export function trackXaraOpened(source: string, courseId?: string): void {
  trackXpexEvent('xara_opened', { source, course_id: courseId })
}

/** Proof event 3: Course opened */
export function trackCourseOpened(courseId: string, courseSlug?: string): void {
  trackXpexEvent('course_opened', { course_id: courseId, course_slug: courseSlug })
}
