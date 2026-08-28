import { getBackendUrl } from '@services/config/config'

export type XpexLaunchCourse = {
  course_uuid: string
  name: string
  description?: string | null
}

function backendUrl() {
  const resolved = getBackendUrl().replace(/\/+$/, '')
  return resolved === 'http://localhost' ? 'http://localhost:1338' : resolved
}

async function parseError(response: Response) {
  try {
    const payload = await response.json()
    return typeof payload?.detail === 'string' ? payload.detail : `HTTP ${response.status}`
  } catch {
    return `HTTP ${response.status}`
  }
}

export async function listXpexLaunchCourses(
  accessToken: string,
  organizationSlug: string
): Promise<XpexLaunchCourse[]> {
  const response = await fetch(
    `${backendUrl()}/api/v1/xpex/launch/courses?organization_slug=${encodeURIComponent(organizationSlug)}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' }
  )
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function inviteXpexLaunchStudent(
  accessToken: string,
  organizationSlug: string,
  email: string
) {
  const response = await fetch(`${backendUrl()}/api/v1/xpex/launch/students/invite`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ organization_slug: organizationSlug, email }),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function enrollXpexLaunchStudent(
  accessToken: string,
  organizationSlug: string,
  email: string,
  courseUuid: string
) {
  const response = await fetch(`${backendUrl()}/api/v1/xpex/launch/students/enroll`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organization_slug: organizationSlug,
      email,
      course_uuid: courseUuid,
    }),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}
