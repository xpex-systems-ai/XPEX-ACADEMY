import { getOrganizationContextInfo } from '@services/organizations/orgs'
import { Metadata } from 'next'
import React from 'react'
import { getServerSession } from '@/lib/auth/server'
import { getOrgFolders } from '@services/folders/folders'
import LibraryHome from './client'

type MetadataProps = {
  params: Promise<{ orgslug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(props: MetadataProps): Promise<Metadata> {
  const params = await props.params
  const org = await getOrganizationContextInfo(params.orgslug, {
    revalidate: 120,
    tags: ['organizations'],
  })

  return {
    title: `Biblioteca — ${org.name}`,
    description: `Gerencie a biblioteca de conteúdos de ${org.name}`,
    robots: {
      index: false,
      follow: false,
    },
  }
}

async function LibraryPage(props: { params: Promise<{ orgslug: string }> }) {
  const { orgslug } = await props.params
  const org = await getOrganizationContextInfo(orgslug, {
    revalidate: 120,
    tags: ['organizations'],
  })
  const session = await getServerSession()
  const access_token = session?.tokens?.access_token

  // Undefined means the server preload did not resolve. The client must then
  // complete its authenticated revalidation before an empty state is trusted.
  let folders: any[] | undefined
  try {
    folders = await getOrgFolders(org.id, access_token ?? undefined, { revalidate: 60, tags: ['folders'] })
  } catch {
    folders = undefined
  }

  return <LibraryHome orgslug={orgslug} org_id={org.id} initialFolders={folders} />
}

export default LibraryPage
