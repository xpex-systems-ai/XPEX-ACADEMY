import { getAPIUrl } from '@services/config/config'
import { RequestBodyWithAuthHeader } from '@services/utils/ts/requests'

export type CourseStudioStatus = 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'PUBLISHED'

export type CourseStudioDraft = {
  draft_id: string
  organization_slug: string
  status: CourseStudioStatus
  publication_state: string
  revision: number
  content_hash: string
  topic: string
  audience: string
  module_count: number
  draft: any
  review: any | null
  generated_by: string
  reviewed_by: string | null
  approved_by_user_id: number | null
  native_course_uuid: string | null
  native_mapping: any | null
  created_at: string
  updated_at: string
}

export type VideoJobState =
  | 'QUEUED'
  | 'SCRIPTING'
  | 'STORYBOARDING'
  | 'NARRATING'
  | 'ASSET_GENERATION'
  | 'RENDERING'
  | 'REVIEWING'
  | 'AWAITING_HUMAN_APPROVAL'
  | 'APPROVED'
  | 'ATTACHED'
  | 'PUBLISHED'
  | 'FAILED'
  | 'CANCELLED'

export type VideoStudioJob = {
  job_id: string
  batch_id: string
  lesson_id: string
  lesson_title: string
  state: VideoJobState
  revision: number
  attempt_count: number
  last_error: string | null
  native_course_uuid: string | null
  native_activity_uuid: string | null
  manifest: any
}

export type VideoBatchResult = {
  draft_id: string
  batch_id: string
  target_lessons: number
  jobs: VideoStudioJob[]
}

async function parseResponse(response: Response) {
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.detail || `Course Studio request failed (HTTP ${response.status})`)
  }
  return body
}

export async function listCourseStudioDrafts(orgslug: string, accessToken: string) {
  const response = await fetch(
    `${getAPIUrl()}xpex/course-studio/drafts?organization_slug=${encodeURIComponent(orgslug)}`,
    RequestBodyWithAuthHeader('GET', null, null, accessToken)
  )
  return parseResponse(response) as Promise<CourseStudioDraft[]>
}

export async function generateCourseStudioDraft(
  payload: { organization_slug: string; topic: string; audience: string; module_count: number },
  accessToken: string
) {
  const response = await fetch(
    `${getAPIUrl()}xpex/course-studio/drafts`,
    RequestBodyWithAuthHeader('POST', payload, null, accessToken)
  )
  return parseResponse(response) as Promise<CourseStudioDraft>
}

export async function editCourseStudioDraft(
  draftId: string,
  expectedRevision: number,
  draft: any,
  accessToken: string
) {
  const response = await fetch(
    `${getAPIUrl()}xpex/course-studio/drafts/${encodeURIComponent(draftId)}`,
    RequestBodyWithAuthHeader('PUT', { expected_revision: expectedRevision, draft }, null, accessToken)
  )
  return parseResponse(response) as Promise<CourseStudioDraft>
}

async function transitionCourseStudioDraft(
  draftId: string,
  action: 'review' | 'approve' | 'publish',
  expectedRevision: number,
  accessToken: string
) {
  const response = await fetch(
    `${getAPIUrl()}xpex/course-studio/drafts/${encodeURIComponent(draftId)}/${action}`,
    RequestBodyWithAuthHeader('POST', { expected_revision: expectedRevision }, null, accessToken)
  )
  return parseResponse(response)
}

export const reviewCourseStudioDraft = (
  draftId: string,
  expectedRevision: number,
  accessToken: string
) => transitionCourseStudioDraft(draftId, 'review', expectedRevision, accessToken) as Promise<CourseStudioDraft>

export const approveCourseStudioDraft = (
  draftId: string,
  expectedRevision: number,
  accessToken: string
) => transitionCourseStudioDraft(draftId, 'approve', expectedRevision, accessToken) as Promise<CourseStudioDraft>

export async function publishCourseStudioDraft(
  draftId: string,
  expectedRevision: number,
  accessToken: string
) {
  return transitionCourseStudioDraft(draftId, 'publish', expectedRevision, accessToken) as Promise<{
    draft: CourseStudioDraft
    course_id: number
    course_uuid: string
    canonical_path: string
    idempotent_replay: boolean
  }>
}

export async function createVideoBatch(draftId: string, accessToken: string) {
  const response = await fetch(
    `${getAPIUrl()}xpex/course-studio/drafts/${encodeURIComponent(draftId)}/videos`,
    RequestBodyWithAuthHeader('POST', {}, null, accessToken)
  )
  return parseResponse(response) as Promise<VideoBatchResult>
}

export async function listVideoJobs(draftId: string, accessToken: string) {
  const response = await fetch(
    `${getAPIUrl()}xpex/course-studio/drafts/${encodeURIComponent(draftId)}/videos`,
    RequestBodyWithAuthHeader('GET', null, null, accessToken)
  )
  return parseResponse(response) as Promise<VideoStudioJob[]>
}

async function transitionVideoJob(
  jobId: string,
  action: 'process' | 'approve' | 'attach' | 'publish',
  accessToken: string
) {
  const response = await fetch(
    `${getAPIUrl()}xpex/video-studio/jobs/${encodeURIComponent(jobId)}/${action}`,
    RequestBodyWithAuthHeader('POST', {}, null, accessToken)
  )
  return parseResponse(response) as Promise<VideoStudioJob>
}

export const processVideoJob = (jobId: string, accessToken: string) =>
  transitionVideoJob(jobId, 'process', accessToken)

export const approveVideoJob = (jobId: string, accessToken: string) =>
  transitionVideoJob(jobId, 'approve', accessToken)

export const attachVideoJob = (jobId: string, accessToken: string) =>
  transitionVideoJob(jobId, 'attach', accessToken)

export const publishVideoJob = (jobId: string, accessToken: string) =>
  transitionVideoJob(jobId, 'publish', accessToken)
