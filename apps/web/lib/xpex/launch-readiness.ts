import { getBackendUrl } from '@services/config/config'

export type XpexLaunchReadinessData = {
  organization: {
    name: string
    slug: string
  }
  metrics: {
    published_courses: number
    published_activities: number
    enrolled_students: number
    active_students: number
    completed_students: number
    completed_activities: number
    teachers: number
  }
  gates: {
    admin_access: boolean
    published_course: boolean
    published_activity: boolean
    pilot_enrollment: boolean
    progress_verified: boolean
    teacher_assigned: boolean
  }
  ready_for_controlled_pilot: boolean
  ready_for_official_intake: boolean
}

export async function getXpexLaunchReadiness(
  accessToken: string,
  organizationSlug: string
): Promise<XpexLaunchReadinessData> {
  const resolvedBackendUrl = getBackendUrl().replace(/\/+$/, '')
  const backendUrl = resolvedBackendUrl === 'http://localhost' ? 'http://localhost:1338' : resolvedBackendUrl
  const response = await fetch(
    `${backendUrl}/api/v1/xpex/launch-readiness?organization_slug=${encodeURIComponent(organizationSlug)}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' }
  )
  if (!response.ok) throw new Error(`XPeX launch readiness request failed (${response.status})`)
  return response.json()
}
