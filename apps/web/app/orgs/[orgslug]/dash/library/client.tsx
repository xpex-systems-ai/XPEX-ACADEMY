'use client'
import LibraryGrid from '@components/Dashboard/Library/LibraryGrid'
import LibraryHeader, { filterLibrary, sortLibrary, type FilterKey } from '@components/Dashboard/Library/LibraryHeader'
import { type FolderSortMode } from '@components/Dashboard/Library/FolderSortDropdown'
import LibrarySearchResults from '@components/Dashboard/Library/LibrarySearchResults'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import useAdminStatus from '@components/Hooks/useAdminStatus'
import { getOrgFolders, getOrgRootItems, removeOrgRootContent, reorderFolders, searchLibrary } from '@services/folders/folders'
import { updateOrgFoldersSort } from '@services/organizations/orgs'
import { AlertTriangle, LoaderCircle } from 'lucide-react'
import React from 'react'
import toast from 'react-hot-toast'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'

type Props = {
  orgslug: string
  org_id: number
  initialFolders?: any[]
}

function LibraryState({ kind }: { kind: 'loading' | 'error' }) {
  const loading = kind === 'loading'
  return (
    <div
      className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white/5 px-6 text-center"
      role={loading ? 'status' : 'alert'}
      aria-live={loading ? 'polite' : 'assertive'}
    >
      {loading ? <LoaderCircle className="animate-spin text-cyan-300" size={30} /> : <AlertTriangle className="text-orange-400" size={30} />}
      <p className="text-sm font-bold text-gray-200">
        {loading ? 'Carregando biblioteca…' : 'Não foi possível carregar a biblioteca'}
      </p>
      <p className="max-w-md text-xs text-gray-400">
        {loading ? 'Estamos sincronizando pastas e conteúdos da organização.' : 'Tente novamente em instantes. Nenhum conteúdo foi removido.'}
      </p>
    </div>
  )
}

function LibraryHome({ orgslug, org_id, initialFolders }: Props) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const org = useOrg() as any

  const [query, setQuery] = React.useState('')
  const [filter, setFilter] = React.useState<FilterKey>('all')
  const searching = query.trim().length > 0

  const configSortMode: FolderSortMode =
    org?.config?.config?.general?.folders?.sort_mode ?? 'name_asc'
  const [sortMode, setSortMode] = React.useState<FolderSortMode>(configSortMode)
  React.useEffect(() => {
    setSortMode(configSortMode)
  }, [configSortMode])

  const { rights } = useAdminStatus()
  const canReorder = rights?.folders?.action_update === true
  const isManual = sortMode === 'manual' && canReorder

  const {
    data: folders,
    error: foldersError,
    isLoading: foldersLoading,
    mutate: mutateFolders,
  } = useSWR(
    org_id && access_token ? ['folders', org_id, 'root'] : null,
    () => getOrgFolders(org_id, access_token, { revalidate: 60, tags: ['folders'] }),
    { fallbackData: initialFolders }
  )
  const {
    data: rootItems,
    error: rootItemsError,
    isLoading: rootItemsLoading,
    mutate: mutateItems,
  } = useSWR(
    org_id && access_token ? ['library-root-items', org_id] : null,
    () => getOrgRootItems(org_id, access_token)
  )
  const {
    data: searchData,
    error: searchError,
    isLoading: searchLoading,
    mutate: mutateSearch,
  } = useSWR(
    searching && org_id && access_token ? ['library-search', org_id, query.trim()] : null,
    () => searchLibrary(org_id, query.trim(), access_token)
  )

  const refresh = () => {
    mutateFolders()
    mutateItems()
    if (searching) mutateSearch()
  }

  const folderList: any[] = Array.isArray(folders) ? folders : folders?.data ?? []
  const itemList: any[] = Array.isArray(rootItems) ? rootItems : rootItems?.data ?? []
  const filtered = filterLibrary(folderList, itemList, '', filter)
  const { folders: visibleFolders, items: visibleItems } = sortLibrary(
    filtered.visibleFolders, filtered.visibleItems, sortMode
  )

  const filteredSearch = searchData
    ? filterLibrary(searchData.folders || [], searchData.items || [], '', filter)
    : null

  // An unresolved server preload stays loading until the authenticated client
  // request settles. Only resolved [] values are treated as a true empty state.
  const libraryLoading = !access_token || rootItemsLoading || foldersLoading || rootItems === undefined || folders === undefined
  const libraryError = Boolean(foldersError || rootItemsError)

  const handleRemove = async (resourceUuid: string) => {
    try {
      await removeOrgRootContent(org_id, resourceUuid, access_token)
      toast.success(t('library.content_removed'))
      refresh()
    } catch (error: any) {
      toast.error(error?.message || t('library.content_remove_error'))
    }
  }

  const handleSortChange = async (mode: FolderSortMode) => {
    const previous = sortMode
    setSortMode(mode)
    try {
      await updateOrgFoldersSort(org_id, mode, access_token)
      mutateFolders()
    } catch (error: any) {
      setSortMode(previous)
      toast.error(error?.message || t('library.sort.sort_error', { defaultValue: 'Não foi possível atualizar a ordenação' }))
    }
  }

  const handleReorderFolders = async (newFolders: any[]) => {
    mutateFolders(newFolders, false)
    try {
      await reorderFolders(
        org_id,
        newFolders.map((f: any) => ({ folder_id: f.id })),
        access_token
      )
      mutateFolders()
    } catch (error: any) {
      mutateFolders()
      toast.error(error?.message || t('library.sort.reorder_error', { defaultValue: 'Não foi possível salvar a nova ordem' }))
    }
  }

  return (
    <div className="flex w-full">
      <div className="pl-4 sm:pl-10 mr-4 sm:mr-10 tracking-tight flex flex-col space-y-5 w-full">
        <LibraryHeader
          orgslug={orgslug}
          org_id={org_id}
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
          sortMode={sortMode}
          setSortMode={handleSortChange}
          onChanged={refresh}
        />

        {searching ? (
          searchError ? <LibraryState kind="error" /> : (
            <LibrarySearchResults
              results={filteredSearch ? { folders: filteredSearch.visibleFolders, items: filteredSearch.visibleItems } : null}
              isLoading={searchLoading}
              orgslug={orgslug}
              org_id={org_id}
              onChanged={refresh}
            />
          )
        ) : libraryError ? (
          <LibraryState kind="error" />
        ) : libraryLoading ? (
          <LibraryState kind="loading" />
        ) : (
          <LibraryGrid
            folders={visibleFolders}
            items={visibleItems}
            orgslug={orgslug}
            org_id={org_id}
            onChanged={refresh}
            onRemoveItem={handleRemove}
            isManual={isManual}
            onReorderFolders={handleReorderFolders}
            emptyTitle={filter !== 'all' ? t('library.no_results') : t('library.no_items')}
            emptyDescription={filter !== 'all' ? undefined : t('library.no_items_description')}
            emptyAction={undefined}
          />
        )}
      </div>
    </div>
  )
}

export default LibraryHome
