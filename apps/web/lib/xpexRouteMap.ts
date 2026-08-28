/** Canonical navigation contract for the launch-critical XPeX surfaces. */
export const xpexAdminRoute = () => '/xpex/admin' as const
export const xpexPoloRoute = () => '/xpex/polo' as const
export const xpexPoloStudentsRoute = () => '/xpex/polo/alunos' as const
export const xpexStudentRoute = () => '/xpex/aluno' as const

/**
 * Course Studio is hosted by the server-authorized XPeX control center.
 * The organization is resolved from the authenticated session there, rather
 * than accepted from a caller-controlled URL segment.
 */
export const xpexCourseStudioRoute = (_orgSlug?: string) => '/xpex/control-center' as const

/** The native course manager remains organization-scoped and RBAC protected. */
export function xpexPoloCoursesRoute(orgSlug: string): string {
  return `/orgs/${encodeURIComponent(orgSlug)}/dash/courses`
}
