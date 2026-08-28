import { getUriWithOrg } from '@services/config/config'

/** Canonical navigation contract for the launch-critical XPeX surfaces. */
export const xpexAdminRoute = () => '/xpex/admin' as const
export const xpexControlCenterRoute = () => '/xpex/control-center' as const
export const xpexPoloRoute = () => '/xpex/polo' as const
export const xpexPoloStudentsRoute = () => '/xpex/polo/alunos' as const
export const xpexStudentRoute = () => '/xpex/aluno' as const
export const xpexLearnerCoursesRoute = () => '/xpex/courses' as const

/**
 * Browser-facing organization routes stay unprefixed. getUriWithOrg moves
 * across tenant hosts when required; the proxy adds the internal /orgs scope.
 */
export const xpexCourseStudioRoute = (orgSlug: string) => getUriWithOrg(orgSlug, '/course-studio')

/** The native course manager remains organization-scoped and RBAC protected. */
export function xpexPoloCoursesRoute(orgSlug: string): string {
  return getUriWithOrg(orgSlug, '/dash/courses')
}
