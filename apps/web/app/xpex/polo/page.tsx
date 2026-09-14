import { AuthenticatedXpexExperience } from '@components/Xpex/AuthenticatedXpexExperience'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function XpexPoloPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const organizationSlug = typeof params.org === 'string' ? params.org : undefined
  const returnPath = organizationSlug ? `/xpex/polo?org=${encodeURIComponent(organizationSlug)}` : '/xpex/polo'
  return <AuthenticatedXpexExperience requestedRole="polo" returnPath={returnPath} organizationSlugOverride={organizationSlug} />
}
