export const BACKEND_ANALYTICS_EVENTS = new Set([
  'page_view',
  'course_view',
  'activity_view',
  'search_query',
  'time_on_activity',
])

export type AnalyticsEventPayload = {
  event_name: string
  org_id: number
  session_id: string
  properties: Record<string, unknown>
}

/** Build only payloads accepted by the backend's FrontendEvent contract. */
export function buildAnalyticsEventPayload(
  eventName: string,
  orgId: number,
  sessionId: string,
  properties: Record<string, unknown>,
): AnalyticsEventPayload | null {
  if (
    !BACKEND_ANALYTICS_EVENTS.has(eventName)
    || !Number.isInteger(orgId)
    || orgId <= 0
    || !sessionId
    || !properties
    || typeof properties !== 'object'
    || Array.isArray(properties)
  ) {
    return null
  }

  return {
    event_name: eventName,
    org_id: orgId,
    session_id: sessionId,
    properties,
  }
}
