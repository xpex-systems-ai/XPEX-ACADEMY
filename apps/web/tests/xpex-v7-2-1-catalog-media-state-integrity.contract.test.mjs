import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSignupBackendPath } from '../services/auth/signupRouting.ts'

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (...parts) => readFileSync(join(WEB_ROOT, ...parts), 'utf8')

const useCourses = read('hooks/queries/useCourses.ts')
const courseService = read('services/courses/courses.ts')
const publicLibrary = read('app/orgs/[orgslug]/(withmenu)/library/LibraryClient.tsx')
const publicLibraryFolder = read('app/orgs/[orgslug]/(withmenu)/library/folder/[folderid]/FolderClient.tsx')
const courseThumbnail = read('components/Objects/Thumbnails/CourseThumbnail.tsx')
const communityCard = read('components/Objects/Communities/CommunityCard.tsx')
const safeImage = read('components/Objects/SafeImage.tsx')
const analytics = read('app/orgs/[orgslug]/dash/analytics/page.tsx')
const dashLoading = read('app/orgs/[orgslug]/dash/loading.tsx')
const errorMessage = read('services/utils/ts/errorMessage.ts')
const signupGateway = read('app/api/signup/route.ts')
const signupClient = read('services/auth/auth.ts')

describe('XPeX Polo Enterprise V7.2.1 catalog, media and state integrity', () => {
  test('resolves catalog truth only after auth state and scopes cache per acting user', () => {
    expect(useCourses).toContain("const sessionResolved = session.status === 'authenticated' || session.status === 'unauthenticated'")
    expect(useCourses).toContain('session?.data?.user?.user_uuid || session?.data?.user?.id')
    expect(useCourses).toContain("'anonymous'")
    expect(useCourses).toContain('queryKey: [...queryKeys.courses.list(orgSlug), authScope]')
    expect(useCourses).toContain('enabled: !!orgSlug && sessionResolved')
    expect(useCourses).toContain('isLoading: !sessionResolved || query.isLoading')
  })

  test('paginates the canonical learner-visible catalog instead of trusting page 1', () => {
    expect(courseService).toContain('export async function getAllVisibleOrgCourses')
    expect(courseService).toContain('for (let page = 1; page <= maxPages; page += 1)')
    expect(courseService).toContain('getOrgCourses(org_slug, next, access_token, false, page, pageSize)')
    expect(courseService).toContain('if (batch.length < pageSize) return courses')
    expect(useCourses).toContain('getAllVisibleOrgCourses(orgSlug, {}, accessToken)')
  })

  test('degrades gracefully instead of blanking the catalog at the pagination safety ceiling', () => {
    expect(courseService).toContain('return courses')
    expect(courseService).not.toContain("throw new Error('Course catalog pagination exceeded the safety limit')")
  })

  test('keeps learner Library course resources inside the canonical /courses visibility set', () => {
    expect(publicLibrary).toContain("import { useCourses } from '@/hooks/queries/useCourses'")
    expect(publicLibrary).toContain('const catalogReady = !catalogCoursesLoading && !catalogCoursesError')
    expect(publicLibrary).toContain('const visibleCourseUuids = useMemo')
    expect(publicLibrary).toContain("item?.resource_type !== 'courses' || (catalogReady && visibleCourseUuids.has")
    expect(publicLibrary).toContain('const libraryLoading = !org?.id || foldersLoading || rootItemsLoading')
    expect(publicLibrary).toContain('const analyticsReady = !libraryLoading && !libraryError && catalogReady')
    expect(publicLibrary).toContain('catalogCoursesError && (')
    expect(publicLibrary).toContain('<LibraryState kind="loading" />')
    expect(publicLibrary).toContain('<LibraryState kind="error" />')

    expect(publicLibraryFolder).toContain("import { useCourses } from '@/hooks/queries/useCourses'")
    expect(publicLibraryFolder).toContain('queryKey: [...queryKeys.folders.detail(folderUuid), authScope]')
    expect(publicLibraryFolder).toContain('const catalogReady = !catalogCoursesLoading && !catalogCoursesError')
    expect(publicLibraryFolder).toContain("item?.resource_type !== 'courses' || (catalogReady && visibleCourseUuids.has")
    expect(publicLibraryFolder).toContain('const loading = !sessionResolved || folderLoading')
    expect(publicLibraryFolder).toContain('const analyticsReady = !loading && !error && !!folder && catalogReady')
    expect(publicLibraryFolder).toContain('catalogCoursesError && (')
  })

  test('renders independent Library content while course visibility is pending or unavailable', () => {
    expect(publicLibrary).toContain('Carregando cursos… Os demais conteúdos já estão disponíveis.')
    expect(publicLibrary).toContain('Os cursos estão temporariamente indisponíveis')
    expect(publicLibrary).not.toContain('rootItemsLoading || catalogCoursesLoading')
    expect(publicLibrary).not.toContain('rootItemsError || catalogCoursesError')
    expect(publicLibraryFolder).toContain('Carregando cursos desta pasta… Os demais conteúdos já estão disponíveis.')
    expect(publicLibraryFolder).toContain('Os cursos desta pasta estão temporariamente indisponíveis')
    expect(publicLibraryFolder).not.toContain('folderLoading || catalogCoursesLoading')
    expect(publicLibraryFolder).not.toContain('folderError || catalogCoursesError')
  })

  test('does not record false empty Library analytics while catalog visibility is unresolved', () => {
    expect(publicLibrary).toContain('analyticsReady,')
    expect(publicLibraryFolder).toContain('analyticsReady,')
  })

  test('shows empty state only after learner visibility filtering is resolved', () => {
    expect(publicLibrary).toContain('const learnerEmpty = folders.length === 0 && visibleRootItems.length === 0')
    expect(publicLibrary).toContain('catalogReady && learnerEmpty && (')
    expect(publicLibrary).not.toContain('const genuineEmpty = folders.length === 0 && rootItems.length === 0')
    expect(publicLibraryFolder).toContain('const learnerEmpty = subfolders.length === 0 && items.length === 0')
    expect(publicLibraryFolder).toContain('catalogReady && learnerEmpty && (')
    expect(publicLibraryFolder).not.toContain('const genuineEmpty = subfolders.length === 0 && rawItems.length === 0')
  })

  test('uses one resilient image contract for course and community thumbnails', () => {
    expect(safeImage).toContain('setFailed(true)')
    expect(courseThumbnail).toContain("import SafeImage from '@components/Objects/SafeImage'")
    expect(courseThumbnail).toContain('data-thumbnail-fallback="course"')
    expect(courseThumbnail).not.toContain('style={{ backgroundImage:')
    expect(communityCard).toContain("import SafeImage from '@components/Objects/SafeImage'")
    expect(communityCard).toContain('data-thumbnail-fallback="community"')
  })

  test('does not mount analytics data widgets until provider readiness is confirmed', () => {
    expect(analytics).toContain('isLoading: analyticsStatusLoading')
    expect(analytics).toContain('isError: analyticsStatusError')
    expect(analytics).toContain('analyticsStatusLoading || (!analyticsStatus && !analyticsStatusError)')
    expect(analytics).toContain("isConfigured && tab === 'overview'")
    expect(analytics).toContain('analyticsUnavailable')
  })

  test('provides an explicit accessible loading shell for /dash transitions', () => {
    expect(dashLoading).toContain('Carregando painel de gestão')
    expect(dashLoading).toContain('role="status"')
    expect(dashLoading).toContain('animate-pulse')
  })

  test('keeps known invite validation failures localized', () => {
    expect(errorMessage).toContain('/^invite code not found$/i')
    expect(errorMessage).toContain('/^invite code is incorrect$/i')
    expect(errorMessage).toContain('return fallback')
  })

  test('routes invite consumption deterministically without consuming a real code in CI', () => {
    const valid = buildSignupBackendPath(1, 'AB cd/42')
    expect(valid).toEqual({ ok: true, path: 'users/1/invite/AB%20cd%2F42' })

    const missingOrg = buildSignupBackendPath(undefined, 'TEST-CODE')
    expect(missingOrg).toEqual({ ok: false, reason: 'invite_requires_org' })

    expect(signupGateway).toContain('buildSignupBackendPath(org_id, inviteCode)')
    expect(signupGateway).toContain('const url = `${base}${routeDecision.path}`')
    expect(signupClient).toContain('body: JSON.stringify({ ...body, inviteCode: invite_code })')
  })
})
