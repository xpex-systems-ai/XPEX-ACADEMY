import { getUriWithOrg } from '@services/config/config'

/** Canonical navigation contract for the launch-critical XPeX surfaces. */
export const xpexAdminRoute = () => '/xpex/admin' as const
export const xpexControlCenterRoute = () => '/xpex/control-center' as const
export const xpexPoloRoute = () => '/xpex/polo' as const
export const xpexPoloStudentsRoute = () => '/xpex/polo/alunos' as const
export const xpexStudentRoute = () => '/xpex/aluno' as const
export const xpexLearnerCoursesRoute = () => '/xpex/courses' as const

/**
 * Administrative/operator routes remain organization-scoped. Polo/student
 * containment is enforced by their own XPeX navigation and section surfaces.
 */
export const xpexCourseStudioRoute = (orgSlug: string) => getUriWithOrg(orgSlug, '/course-studio')

/** Direct operator entry point into the human-gated Video Studio section. */
export const xpexVideoStudioRoute = (orgSlug: string) => `${xpexCourseStudioRoute(orgSlug)}#video-studio`

/** Native catalog entry is reserved for authorized admin/control-center callers. */
export function xpexPoloCoursesRoute(orgSlug: string): string {
  return getUriWithOrg(orgSlug, '/dash/courses')
}
