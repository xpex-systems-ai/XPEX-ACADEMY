import { getOrganizationContextInfo } from '@services/organizations/orgs'
import { getOrgLogoMediaDirectory } from '@services/media/media'
import { resolvePoloBranding, safePoloImage } from './polo-branding'
import { applyPoloBrandingPreset } from './polo-branding-presets'

export async function getPoloBranding(token: string, slug: string, name?: string) {
  try {
    const organization = await getOrganizationContextInfo(slug, { revalidate: 0 }, token)
    const branding = applyPoloBrandingPreset(slug, resolvePoloBranding(organization, slug, name))
    if (organization?.slug === slug && !branding.logo
      && typeof organization.org_uuid === 'string' && typeof organization.logo_image === 'string'
      && organization.logo_image) {
      branding.logo = safePoloImage(getOrgLogoMediaDirectory(organization.org_uuid, organization.logo_image))
    }
    return branding
  } catch {
    return applyPoloBrandingPreset(slug, resolvePoloBranding(null, slug, name))
  }
}
