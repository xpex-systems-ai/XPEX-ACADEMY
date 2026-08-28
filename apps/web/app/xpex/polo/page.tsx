import { AuthenticatedXpexExperience } from '@components/Xpex/AuthenticatedXpexExperience'

export default function XpexPoloPage() {
  return <AuthenticatedXpexExperience requestedRole="professora" returnPath="/xpex/polo" />
}
