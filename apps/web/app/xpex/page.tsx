import { AuthenticatedXpexExperience } from '@components/Xpex/AuthenticatedXpexExperience'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function XpexExperiencePage() { return <AuthenticatedXpexExperience returnPath="/xpex" /> }
