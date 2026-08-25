import { getBackendUrl } from '@services/config/config'

export type XpexTeacherCourse = {
  course_id: string
  title: string
  description: string | null
  enrolled_students: number
  active_students: number
  completed_students: number
  paused_students: number
  target_href: string
}

export type XpexTeacherDashboardData = {
  organization: string
  summary: {
    published_courses: number
    enrolled_students: number
    active_students: number
    completed_students: number
  }
  courses: XpexTeacherCourse[]
}

export async function getXpexTeacherDashboard(
  accessToken: string,
  organizationSlug: string
): Promise<XpexTeacherDashboardData> {
  const resolvedBackendUrl = getBackendUrl().replace(/\/+$/, '')
  const backendUrl = resolvedBackendUrl === 'http://localhost' ? 'http://localhost:1338' : resolvedBackendUrl
  const response = await fetch(
    `${backendUrl}/api/v1/xpex/teacher-dashboard?organization_slug=${encodeURIComponent(organizationSlug)}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' }
  )
  if (!response.ok) throw new Error(`XPeX teacher dashboard request failed (${response.status})`)
  return response.json()
}
