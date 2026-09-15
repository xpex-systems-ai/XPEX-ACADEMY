'use client'

import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
import TypeOfContentTitle from '@components/Objects/StyledElements/Titles/TypeOfContentTitle'
import FeatureGate from '@components/Dashboard/Shared/FeatureGate/FeatureGate'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { queryKeys } from '@/lib/query/keys'
import { getOrgFolders, getOrgRootItems } from '@services/folders/folders'
import { useCourses } from '@/hooks/queries/useCourses'
import { FolderSimple, WarningCircle } from '@phosphor-icons/react'
import { FolderCard, LibraryItemCard } from './library-cards'
import { useTrackView, AnalyticsEvent } from '@services/analytics'

function LibraryState({ kind }: { kind: 'loading' | 'error' }) {
  const { t } = useTranslation()

  if (kind === 'loading') {
    return (
      <div className="w-full animate-pulse" role="status" aria-live="polite">
        <GeneralWrapperStyled>
          <span className="sr-only">Carregando biblioteca…</span>
          <div className="h-7 bg-gray-200 rounded w-28 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl nice-shadow p-3 h-20" />
            ))}
          </div>
        </GeneralWrapperStyled>
      </div>
    )
  }

  return (
    <div className="w-full" role="alert">
      <GeneralWrapperStyled>
        <div className="flex min-h-40 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/30 px-6 text-center">
          <p className="text-sm font-semibold text-gray-600">{t('library.error_loading')}</p>
        </div>
      </GeneralWrapperStyled>
    </div>
  )
}

function LibraryClient({ orgslug }: { orgslug: string }) {
  const { t } = useTranslation()
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const {
    data: foldersData,
    isLoading: foldersLoading,
  } = useQuery({
    queryKey: org?.id ? queryKeys.folders.list(org.id) : ['folders', 'pending'],
    queryFn: () => getOrgFolders(org.id, access_token),
    enabled: !!org?.id,
  })

  const {
    data: rootItemsData,
    isLoading: rootItemsLoading,
    isError: rootItemsError,
  } = useQuery({
    queryKey: org?.id ? ['library-root-items', org.id] : ['library-root-items', 'pending'],
    queryFn: () => getOrgRootItems(org.id, access_token),
    enabled: !!org?.id,
  })

  // Canonical catalog visibility is the source of truth for learner-facing
  // course discovery. Library can organize that truth, but must never expose a
  // draft/private course that /courses would not return to the same identity.
  const {
    data: catalogCoursesData,
    isLoading: catalogCoursesLoading,
    isError: catalogCoursesError,
  } = useCourses(orgslug)

  const folders = Array.isArray(foldersData) ? foldersData : []
  const rootItems = Array.isArray(rootItemsData) ? rootItemsData : []
  const catalogCourses = Array.isArray(catalogCoursesData) ? catalogCoursesData : []

  const visibleCourseUuids = useMemo(
    () => new Set(catalogCourses.map((course: any) => course.course_uuid)),
    [catalogCourses],
  )

  // Fail closed for COURSE cards if canonical visibility is unavailable, but do
  // not punish unrelated folders/media/podcasts/etc. A transient catalog outage
  // must not blank the rest of the Library.
  const visibleRootItems = useMemo(
    () => rootItems.filter((item: any) => (
      item?.resource_type !== 'courses' || (!catalogCoursesError && visibleCourseUuids.has(item?.resource?.course_uuid || item?.resource_uuid))
    )),
    [rootItems, visibleCourseUuids, catalogCoursesError],
  )

  const libraryLoading = !org?.id || foldersLoading || rootItemsLoading || catalogCoursesLoading
  const libraryError = rootItemsError

  useTrackView(
    AnalyticsEvent.LibraryViewed,
    {
      folder_count: folders.length,
      is_empty: folders.length === 0 && visibleRootItems.length === 0,
    },
    !libraryLoading && !libraryError,
    'learner',
  )

  if (libraryLoading) return <LibraryState kind="loading" />
  if (libraryError) return <LibraryState kind="error" />

  return (
    <FeatureGate feature="folders" orgslug={orgslug} context="public">
      <div className="w-full">
        <GeneralWrapperStyled>
          <div className="flex flex-col space-y-2 mb-2">
            <div className="flex items-center justify-between">
              <TypeOfContentTitle title={t('library.library')} type="cou" />
            </div>

            {catalogCoursesError && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200/60 bg-amber-50/60 px-3 py-2 text-sm text-amber-800" role="status">
                <WarningCircle size={18} className="mt-0.5 shrink-0" />
                <span>Os cursos estão temporariamente indisponíveis. Os demais conteúdos da biblioteca continuam acessíveis.</span>
              </div>
            )}

            <div className="flex flex-col gap-7">
              {folders.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {folders.map((folder: any) => (
                    <FolderCard key={folder.folder_uuid} folder={folder} orgslug={orgslug} />
                  ))}
                </div>
              )}

              {visibleRootItems.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
                  {visibleRootItems.map((item: any) => (
                    <LibraryItemCard key={item.resource_uuid} item={item} orgslug={orgslug} />
                  ))}
                </div>
              )}

              {folders.length === 0 && visibleRootItems.length === 0 && !catalogCoursesError && (
                <div className="col-span-full flex flex-col justify-center items-center py-12 px-4 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
                  <div className="p-4 bg-white rounded-full nice-shadow mb-4">
                    <FolderSimple className="w-8 h-8 text-gray-300" weight="duotone" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-600 mb-1">
                    {t('library.empty_folder')}
                  </h3>
                </div>
              )}
            </div>
          </div>
        </GeneralWrapperStyled>
      </div>
    </FeatureGate>
  )
}

export default LibraryClient
