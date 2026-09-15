'use client'

import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
import FeatureGate from '@components/Dashboard/Shared/FeatureGate/FeatureGate'
import { Breadcrumbs } from '@components/Objects/Breadcrumbs/Breadcrumbs'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { queryKeys } from '@/lib/query/keys'
import { getFolderById, removeFolderPrefix } from '@services/folders/folders'
import { getUriWithOrg } from '@services/config/config'
import { shareFolderLink } from '@components/Dashboard/Library/shareFolder'
import { useCourses } from '@/hooks/queries/useCourses'
import { FolderSimple, LinkSimple, WarningCircle } from '@phosphor-icons/react'
import { FolderCard, LibraryItemCard } from '../../library-cards'
import { useTrackView, AnalyticsEvent } from '@services/analytics'

function FolderClient({
  orgslug,
  folderid,
}: {
  orgslug: string
  folderid: string
}) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const sessionResolved = session.status === 'authenticated' || session.status === 'unauthenticated'
  const authScope = session.status === 'authenticated'
    ? session?.data?.user?.user_uuid || session?.data?.user?.id || 'authenticated-unresolved'
    : 'anonymous'
  const folderUuid = `folder_${folderid}`

  const {
    data: folder,
    isLoading: folderLoading,
    isError: folderError,
  } = useQuery({
    queryKey: [...queryKeys.folders.detail(folderUuid), authScope],
    queryFn: () => getFolderById(folderUuid, access_token),
    enabled: !!folderid && sessionResolved,
  })

  const {
    data: catalogCoursesData,
    isLoading: catalogCoursesLoading,
    isError: catalogCoursesError,
  } = useCourses(orgslug)

  const catalogCourses = Array.isArray(catalogCoursesData) ? catalogCoursesData : []
  const catalogReady = !catalogCoursesLoading && !catalogCoursesError
  const visibleCourseUuids = useMemo(
    () => new Set(catalogCourses.map((course: any) => course.course_uuid)),
    [catalogCourses],
  )

  const subfolders = folder?.subfolders || []
  const rawItems = folder?.items || []
  const items = useMemo(
    () => rawItems.filter((item: any) => (
      item?.resource_type !== 'courses' || (catalogReady && visibleCourseUuids.has(item?.resource?.course_uuid || item?.resource_uuid))
    )),
    [rawItems, visibleCourseUuids, catalogReady],
  )
  const breadcrumbs = folder?.breadcrumbs || []
  const loading = !sessionResolved || folderLoading
  const error = folderError
  const learnerEmpty = subfolders.length === 0 && items.length === 0
  const analyticsReady = !loading && !error && !!folder && catalogReady

  useTrackView(
    AnalyticsEvent.FolderViewed,
    {
      folder_count: subfolders.length,
      is_empty: learnerEmpty,
    },
    analyticsReady,
    'learner',
  )

  if (loading) {
    return (
      <div className="w-full animate-pulse" role="status" aria-live="polite">
        <GeneralWrapperStyled>
          <span className="sr-only">{t('common.loading')}</span>
          <div className="h-7 bg-gray-200 rounded w-40 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl nice-shadow p-3 h-20" />
            ))}
          </div>
        </GeneralWrapperStyled>
      </div>
    )
  }

  if (error || !folder) {
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

  return (
    <FeatureGate feature="folders" orgslug={orgslug} context="public">
      <div className="w-full">
        <GeneralWrapperStyled>
          <div className="flex flex-col space-y-4 mb-2">
            <Breadcrumbs
              items={[
                {
                  label: t('library.library'),
                  href: getUriWithOrg(orgslug, '/library'),
                  icon: <FolderSimple size={14} weight="fill" />,
                },
                ...breadcrumbs.map((crumb: any) => ({
                  label: crumb.name,
                  href: getUriWithOrg(
                    orgslug,
                    `/library/folder/${removeFolderPrefix(crumb.folder_uuid)}`
                  ),
                })),
              ]}
            />

            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-gray-800">{folder.name}</h1>
              <button
                onClick={() => shareFolderLink(orgslug, folderUuid, folder.name, t('library.link_copied'), t('library.link_copy_error'))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 nice-shadow hover:bg-gray-50 transition-colors flex-none"
              >
                <LinkSimple size={16} />
                <span>{t('library.share')}</span>
              </button>
            </div>

            {folder.description && (
              <p className="text-sm text-gray-500">{folder.description}</p>
            )}

            {catalogCoursesLoading && (
              <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600" role="status" aria-live="polite">
                <span>{t('common.loading')}</span>
              </div>
            )}

            {catalogCoursesError && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200/60 bg-amber-50/60 px-3 py-2 text-sm text-amber-800" role="status">
                <WarningCircle size={18} className="mt-0.5 shrink-0" />
                <span>{t('library.error_loading')}</span>
              </div>
            )}

            <div className="flex flex-col gap-7">
              {subfolders.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {subfolders.map((sub: any) => (
                    <FolderCard key={sub.folder_uuid} folder={sub} orgslug={orgslug} />
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
                  {items.map((item: any) => (
                    <LibraryItemCard key={item.resource_uuid} item={item} orgslug={orgslug} />
                  ))}
                </div>
              )}

              {catalogReady && learnerEmpty && (
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

export default FolderClient
