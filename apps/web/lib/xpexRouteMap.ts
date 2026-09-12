/** Canonical navigation contract for the launch-critical XPeX surfaces. */
export const xpexAdminRoute = () => '/xpex/admin' as const
export const xpexControlCenterRoute = () => '/xpex/control-center' as const
export const xpexPoloRoute = () => '/xpex/polo' as const
export const xpexPoloStudentsRoute = () => '/xpex/polo/alunos' as const
export const xpexStudentRoute = () => '/xpex/aluno' as const
export const xpexLearnerCoursesRoute = () => '/xpex/courses' as const

/** Course creation and management stay inside the branded XPeX Polo shell. */
export const xpexCourseStudioRoute = (_orgSlug?: string) => '/xpex/polo/cursos' as const

/** Video work remains attached to the contained course workspace. */
export const xpexVideoStudioRoute = (_orgSlug?: string) => '/xpex/polo/cursos#video-studio' as const

/** Organization course management never exposes the raw academic-engine dashboard. */
export function xpexPoloCoursesRoute(_orgSlug?: string): string {
  return '/xpex/polo/cursos'
}
