import { getOrganizationContextInfo } from '@services/organizations/orgs'
import { getOrgLogoMediaDirectory } from '@services/media/media'
import { resolvePoloBranding, safePoloImage } from './polo-branding'

export async function getPoloBranding(token: string, slug: string, name?: string) {
  try {
    const organization = await getOrganizationContextInfo(slug, { revalidate: 0 }, token)
    const branding = resolvePoloBranding(organization, slug, name)
    if (organization?.slug === slug && !branding.logo
      && typeof organization.org_uuid === 'string' && typeof organization.logo_image === 'string'
      && organization.logo_image) {
      branding.logo = safePoloImage(getOrgLogoMediaDirectory(organization.org_uuid, organization.logo_image))
    }
    return branding
  } catch {
    return resolvePoloBranding(null, slug, name)
  }
}
