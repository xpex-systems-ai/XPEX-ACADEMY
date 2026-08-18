import { getBackendUrl } from '@services/config/config'

export type XpexLearningCourse = {
  course_id: string
  title: string
  image_url: string | null
  enrollment_state: string
  completed_lessons: number
  total_lessons: number
  progress_percent: number | null
  target_href: string
  last_activity_at: string | null
}

export type XpexLearningDashboardData = {
  organization: string
  summary: {
    active_courses: number
    completed_lessons: number
    total_lessons: number
    overall_progress_percent: number | null
  }
  courses: XpexLearningCourse[]
  continue_learning: XpexLearningCourse | null
}

export async function getXpexLearningDashboard(
  accessToken: string,
  organizationSlug: string
): Promise<XpexLearningDashboardData> {
  const resolvedBackendUrl = getBackendUrl().replace(/\/+$/, '')
  const backendUrl = resolvedBackendUrl === 'http://localhost' ? 'http://localhost:1338' : resolvedBackendUrl
  const response = await fetch(
    `${backendUrl}/api/v1/xpex/learning-dashboard?organization_slug=${encodeURIComponent(organizationSlug)}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' }
  )
  if (!response.ok) throw new Error(`XPeX dashboard request failed (${response.status})`)
  return response.json()
}
