import { notFound } from 'next/navigation'
import { AuthenticatedXpexExperience } from '@components/Xpex/AuthenticatedXpexExperience'
import { xpexPoloSections, type XpexPoloSectionId } from '@components/Xpex/experiences/XpexPoloSection'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function XpexPoloSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!xpexPoloSections.includes(section as XpexPoloSectionId)) notFound()
  return <AuthenticatedXpexExperience requestedRole="polo" returnPath={`/xpex/polo/${section}`} poloSection={section as XpexPoloSectionId}/>
}
