import { getOrganizationContextInfo } from '@services/organizations/orgs'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { getCommunity } from '@services/communities/communities'
import { getDiscussions, DiscussionWithAuthor } from '@services/communities/discussions'
import { getOrgThumbnailMediaDirectory, getOrgOgImageMediaDirectory } from '@services/media/media'
import { getOrgSeoConfig, buildPageTitle, buildBreadcrumbJsonLd } from '@/lib/seo/utils'
import { getServerCanonicalUrl } from '@/lib/seo/utils.server'
import { JsonLd } from '@components/SEO/JsonLd'
import CommunityClient from './community'

type MetadataProps = {
  params: Promise<{ orgslug: string; communityuuid: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(props: MetadataProps): Promise<Metadata> {
  const params = await props.params
  const org = await getOrganizationContextInfo(params.orgslug, {
    revalidate: 120,
    tags: ['organizations'],
  })

  const communityUuid = `community_${params.communityuuid}`
  let community = null
  try {
    community = await getCommunity(communityUuid, { revalidate: 120, tags: ['communities'] })
  } catch {
    // A comunidade pode não existir ou não estar disponível para esta sessão.
  }

  const seoConfig = getOrgSeoConfig(org)

  const title = buildPageTitle(community ? community.name : 'Comunidade', org.name, seoConfig)
  const description = community?.description || seoConfig.default_meta_description || `Comunidade de aprendizagem de ${org.name}`
  const ogImageUrl = seoConfig.default_og_image
    ? getOrgOgImageMediaDirectory(org?.org_uuid, seoConfig.default_og_image)
    : null
  const imageUrl = ogImageUrl || getOrgThumbnailMediaDirectory(org?.org_uuid, org?.thumbnail_image)
  const canonical = await getServerCanonicalUrl(params.orgslug, `/community/${params.communityuuid}`)

  return {
    title,
    description,
    robots: {
      index: !seoConfig.noindex_communities,
      follow: true,
      nocache: true,
      googleBot: {
        index: !seoConfig.noindex_communities,
        follow: true,
        'max-image-preview': 'large',
      },
    },
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: org.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      ...(seoConfig.twitter_handle && { site: seoConfig.twitter_handle }),
    },
  }
}

const CommunityPage = async (params: any) => {
  const session = await getServerSession()
  const access_token = session?.tokens?.access_token
  const { orgslug, communityuuid } = await params.params
  const communityUuid = `community_${communityuuid}`

  const org = await getOrganizationContextInfo(orgslug, {
    revalidate: 120,
    tags: ['organizations'],
  })
  const org_id = org.id

  let community = null
  let communityError: { status?: number } | null = null
  let discussions: DiscussionWithAuthor[] = []

  try {
    community = await getCommunity(
      communityUuid,
      { revalidate: 120, tags: ['communities'] },
      access_token ? access_token : undefined
    )
  } catch (error: any) {
    communityError = { status: error?.status }
    console.error('Failed to fetch community:', error)
  }

  if (community) {
    try {
      discussions = await getDiscussions(
        communityUuid,
        'recent',
        1,
        10,
        { revalidate: 120, tags: ['discussions'] },
        access_token ? access_token : undefined
      )
    } catch (error) {
      console.error('Failed to fetch discussions:', error)
      discussions = []
    }
  }

  // Ausente, ou negada para sessão anônima: 404 para evitar enumeração de comunidades privadas.
  if (!community && (!communityError || !access_token)) {
    notFound()
  }

  if (!community) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-6 py-12" role="main">
        <section className="w-full max-w-xl rounded-3xl border border-amber-400/20 bg-amber-400/5 p-8 text-center shadow-2xl" aria-labelledby="community-access-title">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Acesso protegido</p>
          <h1 id="community-access-title" className="mt-3 text-2xl font-black text-white">Comunidade ainda não liberada</h1>
          <p className="mt-3 leading-7 text-slate-300">Sua conta está autenticada, mas esta comunidade não está disponível para o seu perfil neste momento. Quando o acesso for autorizado, ela aparecerá normalmente na sua jornada.</p>
        </section>
      </main>
    )
  }

  const communityJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: community.name,
    description: community.description,
    author: {
      '@type': 'Organization',
      name: org.name,
    },
    url: await getServerCanonicalUrl(orgslug, `/community/${communityuuid}`),
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Início', url: await getServerCanonicalUrl(orgslug, '/') },
    { name: 'Comunidades', url: await getServerCanonicalUrl(orgslug, '/communities') },
    { name: community.name || 'Comunidade', url: await getServerCanonicalUrl(orgslug, `/community/${communityuuid}`) },
  ])

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={communityJsonLd} />
      <CommunityClient
        community={community}
        initialDiscussions={discussions || []}
        orgslug={orgslug}
        org_id={org_id}
      />
    </>
  )
}

export default CommunityPage