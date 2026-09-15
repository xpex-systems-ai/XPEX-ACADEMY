'use client'

import { useQuery } from '@tanstack/react-query'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { queryKeys } from '@lib/query/keys'
import { getOrgCourses, getCourseMetadata } from '@services/courses/courses'

export function useCourses(orgSlug: string) {
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token as string | undefined
  const sessionResolved = session.status === 'authenticated' || session.status === 'unauthenticated'
  const authScope = session.status === 'authenticated'
    ? session?.data?.user?.user_uuid || 'authenticated'
    : 'anonymous'

  const query = useQuery({
    // Course visibility depends on the acting identity. Never let an anonymous
    // response fetched during hydration — or another signed-in user on a shared
    // browser — become the cached catalog truth for the current account.
    queryKey: [...queryKeys.courses.list(orgSlug), authScope],
    queryFn: () => getOrgCourses(orgSlug, {}, accessToken),
    enabled: !!orgSlug && sessionResolved,
    staleTime: 60_000,
  })

  // Existing catalog consumers use `isLoading`; include session hydration in
  // that contract so they never flash a false "no courses" empty state.
  return {
    ...query,
    isLoading: !sessionResolved || query.isLoading,
  }
}

export function useCourseMeta(courseUuid: string) {
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token as string | undefined

  return useQuery({
    queryKey: queryKeys.courses.meta(courseUuid),
    queryFn: () => getCourseMetadata(courseUuid, {}, accessToken, { slim: true }),
    enabled: !!courseUuid,
    staleTime: 60_000,
  })
}
