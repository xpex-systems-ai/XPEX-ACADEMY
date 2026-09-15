'use client'

import { useQuery } from '@tanstack/react-query'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { queryKeys } from '@lib/query/keys'
import { getOrgCourses, getCourseMetadata } from '@services/courses/courses'

export function useCourses(orgSlug: string) {
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token as string | undefined
  const sessionResolved = session.status === 'authenticated' || session.status === 'unauthenticated'
  const authScope = session.status === 'authenticated' ? 'authenticated' : 'anonymous'

  return useQuery({
    // Course visibility depends on the acting identity. Never let an anonymous
    // catalog response fetched during session hydration become the cached truth
    // for the authenticated learner/admin that appears a moment later.
    queryKey: [...queryKeys.courses.list(orgSlug), authScope],
    queryFn: () => getOrgCourses(orgSlug, {}, accessToken),
    enabled: !!orgSlug && sessionResolved,
    staleTime: 60_000,
  })
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
