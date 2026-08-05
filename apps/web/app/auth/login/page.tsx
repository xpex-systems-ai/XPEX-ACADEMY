import { getOrganizationContextInfo } from '@services/organizations/orgs'
import { getAuthOrgSlug } from '@services/org/orgResolution'
import LoginClient from './login'
import { Metadata } from 'next'
import OrgNotFound from '@components/Objects/StyledElements/Error/OrgNotFound'

export async function generateMetadata(): Promise<Metadata> {
  const orgslug = await getAuthOrgSlug()

  if (!orgslug) {
    return {
      title: 'Acesso | XpeX Academy',
      description: 'Portal de acesso da experiência Beta da XpeX Academy.',
      robots: { index: false, follow: false },
    }
  }

  let org: any = null
  try {
    org = await getOrganizationContextInfo(orgslug, {
      revalidate: 60,
      tags: ['organizations'],
    })
  } catch {
    // Stale cookie, unavailable backend or unknown org — use safe XpeX metadata.
  }

  return {
    title: `Acesso — ${org?.name || 'XpeX Academy'}`,
    description: 'Acesso seguro à experiência educacional XpeX Academy.',
    robots: { index: false, follow: false },
  }
}

const Login = async () => {
  const orgslug = await getAuthOrgSlug()

  let org: any = null
  if (orgslug) {
    try {
      org = await getOrganizationContextInfo(orgslug, {
        revalidate: 60,
        tags: ['organizations'],
      })
    } catch {
      org = null
    }

    // Keep the access route useful and transparent when the organization
    // backend is not available in the visual Beta environment.
    if (!org) {
      return <OrgNotFound />
    }
  }

  return <LoginClient org={org} />
}

export default Login
