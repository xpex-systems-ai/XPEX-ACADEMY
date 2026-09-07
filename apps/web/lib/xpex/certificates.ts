import { getBackendUrl } from '@services/config/config'

export type XpexStudentCertificate = {
  certificateId: string
  courseUuid: string
  courseTitle: string
  issuedAt: string | null
}

type CertificatePayload = {
  certificate_user?: { user_certification_uuid?: unknown; creation_date?: unknown; created_at?: unknown }
  course?: { course_uuid?: unknown; name?: unknown }
}

/** Read awarded certificates from LearnHouse and retain only courses authorized by the dashboard. */
export async function getXpexStudentCertificates(
  accessToken: string,
  organizationId: number,
  authorizedCourseUuids: ReadonlySet<string>,
): Promise<XpexStudentCertificate[]> {
  const resolvedBackendUrl = getBackendUrl().replace(/\/+$/, '')
  const backendUrl = resolvedBackendUrl === 'http://localhost' ? 'http://localhost:1338' : resolvedBackendUrl
  const response = await fetch(
    `${backendUrl}/api/v1/certifications/user/all?org_id=${encodeURIComponent(organizationId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' },
  )

  // LearnHouse gates native certifications by plan. A plan-denied response must
  // degrade to an honest empty state instead of crashing the student area.
  if (response.status === 403) return []
  if (!response.ok) throw new Error(`XPeX certificates request failed (${response.status})`)

  const payload: unknown = await response.json()
  if (!Array.isArray(payload)) throw new Error('XPeX certificates response is invalid')

  return (payload as CertificatePayload[]).flatMap((item) => {
    const certificateId = item.certificate_user?.user_certification_uuid
    const courseUuid = item.course?.course_uuid
    const courseTitle = item.course?.name
    if (typeof certificateId !== 'string' || typeof courseUuid !== 'string' ||
        typeof courseTitle !== 'string' || !authorizedCourseUuids.has(courseUuid)) return []
    const rawDate = item.certificate_user?.creation_date ?? item.certificate_user?.created_at
    return [{ certificateId, courseUuid, courseTitle, issuedAt: typeof rawDate === 'string' ? rawDate : null }]
  })
}
